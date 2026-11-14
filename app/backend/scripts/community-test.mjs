// Group D (community) and H7 acceptance tests through the HTTP API, on a separate server instance.
// It starts its own server (port 8792, own data dir) with the native runner for private tests, because
// the deployed OutLayer runner may not have the `evaluate` command yet. Verified NEAR sessions are test
// fixtures written into that data dir (NEP-413 sign-in is built separately).
//
// Chain state it creates on testnet (signed with keychain keys through near-cli):
//   one AddBounty proposal by scientivan.testnet (1 NEAR bond, returned on approval) for 0.001 NEAR,
//   and one council vote approving it. The payout and publish calls are only checked, never signed.
// Usage: node scripts/community-test.mjs
import { execFileSync, spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as kalis from "../src/kalis-crypto.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const APP = path.resolve(ROOT, "..");
const DATA = process.env.TEST_DATA_DIR || "/Users/scientivan/.claude/jobs/333cb961/tmp/dataE";
const PORT = 8792, BASE = `http://localhost:${PORT}`;
const RUNNER = path.join(APP, "kalis-runner/target/release/kalis-runner");
const SEAL = crypto.randomBytes(32).toString("hex");
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };

// ---- environment ----
fs.mkdirSync(path.join(DATA, "db"), { recursive: true });
const tok = (a) => ({ id: `sess-test-${a}-${crypto.randomBytes(6).toString("hex")}`, account_id: a, expires_at: new Date(Date.now() + 3600e3).toISOString(), revoked: false, test_fixture: true });
const S = { council: tok("scientivan.testnet"), contrib: tok("kalis-contrib.testnet"), outsider: tok("kalis-buyer.testnet") };
const sessFile = path.join(DATA, "db", "sessions.json");
const sessions = fs.existsSync(sessFile) ? JSON.parse(fs.readFileSync(sessFile, "utf8")) : {};
for (const s of Object.values(S)) sessions[s.id] = s;
fs.writeFileSync(sessFile, JSON.stringify(sessions));
const devPub = JSON.parse(execFileSync(RUNNER, { input: '{"cmd":"pubkey"}', env: { ...process.env, PROTECTED_SEAL_KEY: SEAL } }).toString()).tee_pubkey;
const baseWasm = fs.readFileSync(path.join(APP, "methods/portfolio-rebalance/method-v2-pruning.wasm"));
const baseHash = crypto.createHash("sha256").update(baseWasm).digest("hex");
fs.mkdirSync(path.join(DATA, "sealed-dev", "portfolio-rebalance"), { recursive: true });
fs.writeFileSync(path.join(DATA, "sealed-dev", "portfolio-rebalance", `${baseHash}.json`), JSON.stringify({ method_id: "portfolio-rebalance", code_hash: baseHash, sealed: kalis.sealMethod(devPub, baseWasm), dev_only: true }));
const srv = spawn("node", [path.join(ROOT, "src/server.js"), "--fork-e-test"], { env: { ...process.env, PORT: String(PORT), PUBLIC_BASE: "http://localhost:8787", KALIS_DATA_DIR: DATA, KALIS_LOCAL_RUNNER: RUNNER, KALIS_LOCAL_SEAL_KEY: SEAL }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));

async function api(method, p, body, who) {
  const headers = { "Content-Type": "application/json" };
  if (who && S[who]) headers.Authorization = `Bearer ${S[who].id}`; else headers["X-Kalis-Workspace"] = who || "community-demo";
  const r = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;
function sign(cc, signer) {
  const r = spawnSync("near", ["contract", "call-function", "as-transaction", cc.receiver_id, cc.method_name, "json-args", JSON.stringify(cc.args), "prepaid-gas", `${cc.gas_tgas} Tgas`, "attached-deposit", `${BigInt(cc.deposit_yocto)} yoctoNEAR`, "sign-as", signer, "network-config", "testnet", "sign-with-keychain", "send"], { encoding: "utf8" });
  return /Transaction ID: (\w+)/.exec(r.stdout + r.stderr)?.[1] || "unknown";
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const cfg = (await api("GET", "/api/community/config")).body;
  check("authority is read from the DAO policy on chain", cfg.council.includes("scientivan.testnet") && /Sputnik DAO policy/.test(cfg.authority));
  check("undecided rules are shown as unavailable with a reason", ["competing_claimers", "disputes"].every((id) => cfg.rules.find((r) => r.id === id)?.status === "unavailable"));
  const version = (await api("GET", "/api/methods/portfolio-rebalance")).body.versions.at(-1).number;

  const issue = await api("POST", "/api/issues", { method_id: "portfolio-rebalance", version, module: "core", problem: "Uses too much fuel on 3-asset cases", expected: "Same answers with less fuel", synthetic_reproduction: { case: "C03" } }, "community-demo");
  check("a demo workspace can open a labelled issue", issue.status === 200 && issue.body.demo === true && issue.body.allowed_actions.includes("create_proposal"));
  const demoProp = await api("POST", "/api/proposals", { issue_id: issue.body.id }, "community-demo");
  check("a demo workspace cannot propose a paid bounty", code(demoProp) === "login_required");
  const noCrit = await api("POST", "/api/proposals", { issue_id: issue.body.id, budget_yocto: "1000000000000000000000", reviewer: "scientivan.testnet", evaluator: { compare: { fields: ["status"] } } }, "council");
  check("a bounty without fixed acceptance criteria is refused", code(noCrit) === "no_criteria");
  const badRev = await api("POST", "/api/proposals", { issue_id: issue.body.id, budget_yocto: "1000000000000000000000", acceptance_criteria: ["same answers"], reviewer: "kalis-buyer.testnet", evaluator: { compare: { fields: ["status"] } } }, "council");
  check("the reviewer must be a council member", code(badRev) === "reviewer_not_council");
  const prop = await api("POST", "/api/proposals", { issue_id: issue.body.id, budget_yocto: "1000000000000000000000", acceptance_criteria: ["Same status, cost and trades as the base version on every private case"], reviewer: "scientivan.testnet", evaluator: { compare: { fields: ["status", "cost", "delta"], tolerance: 1e-6 }, min_cases: 1 } }, "council");
  const cc = prop.body.contract_call;
  check("proposal is an unsigned add_proposal AddBounty call with the bond and a tag", cc?.method_name === "add_proposal" && cc.args.proposal.kind.AddBounty.bounty.amount === "1000000000000000000000" && cc.deposit_yocto === cfg.proposal_bond.value && cc.args.proposal.description.includes(`[kalis:${prop.body.id}]`) && prop.body.chain_status === "awaiting_signature");

  const tx1 = sign(cc, "scientivan.testnet");
  await sleep(3000);
  const onChain = (await api("GET", `/api/proposals/${prop.body.id}`)).body;
  check("after signing, status is read from chain", onChain.dao_proposal_id !== null && onChain.chain_status === "InProgress", `tx ${tx1}, proposal ${onChain.dao_proposal_id}`);
  const outsiderVote = await api("POST", `/api/proposals/${prop.body.id}/vote`, { vote: "approve" }, "outsider");
  check("a non-council account cannot vote", code(outsiderVote) === "not_council");
  const demoVote = await api("POST", `/api/proposals/${prop.body.id}/vote`, { vote: "approve" }, "community-demo");
  check("a demo workspace cannot vote", code(demoVote) === "login_required");
  const vote = await api("POST", `/api/proposals/${prop.body.id}/vote`, { vote: "approve" }, "council");
  check("council vote is an unsigned act_proposal call, not an optimistic approval", vote.body.contract_call?.method_name === "act_proposal" && vote.body.contract_call.args.action === "VoteApprove" && vote.body.proposal.chain_status === "InProgress");
  const tx2 = sign(vote.body.contract_call, "scientivan.testnet");
  await sleep(3000);
  const approved = (await api("GET", `/api/proposals/${prop.body.id}`)).body;
  check("approval is visible from chain", approved.chain_status === "Approved", `tx ${tx2}`);
  const bounties = (await api("GET", "/api/bounties")).body.items;
  const bounty = bounties.find((b) => b.proposal_link === prop.body.id);
  check("the chain bounty is joined with its issue, criteria and fixed evaluator", bounty && bounty.issue_id === issue.body.id && bounty.evaluator.compare.fields.includes("cost"), `bounty ${bounty?.id}`);
  const issueAfter = (await api("GET", `/api/issues/${issue.body.id}`)).body;
  check("issue moves to funded once the bounty exists", issueAfter.state === "funded");
  const claim = await api("POST", `/api/bounties/${bounty.id}/claim`, {}, "contrib");
  check("claim is an unsigned bounty_claim with the claim bond", claim.body.contract_call?.method_name === "bounty_claim" && claim.body.contract_call.deposit_yocto === cfg.bounty_bond.value);

  // ---- H7 package ----
  const pkg = (await api("GET", `/api/methods/portfolio-rebalance/versions/${version}/contribution-package`)).body;
  check("contribution package gives the interface and spec, never private source", pkg.interface.exports.length === 3 && /interface only/.test(pkg.private_core_note) && !JSON.stringify(pkg).includes("fn execute"));

  // ---- contributions ----
  const sealCand = (w) => ({ sealed: kalis.sealMethod(devPub, w), code_hash: crypto.createHash("sha256").update(w).digest("hex") });
  const good = sealCand(baseWasm);
  const wrongW = fs.readFileSync(path.join(APP, "kalis-runner/client/fixtures/eval-candidates/wrong-cost.wasm"));
  const evalSwap = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: good, base_version: version, evaluator: { compare: { fields: ["status"] } } }, "contrib");
  check("a candidate cannot replace the evaluator", code(evalSwap) === "cannot_change_evaluator");
  const wrongBase = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: good, base_version: version - 1 }, "contrib");
  check("a candidate for another base version is refused", code(wrongBase) === "base_version_mismatch");
  const c1 = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: good, base_version: version, target_module: "core", description: "Pruning kept, answers unchanged" }, "contrib");
  check("contribution by a verified account is submitted, private core flagged needs_owner_access", c1.body.state === "submitted" && c1.body.validation.needs_owner_access === true && !JSON.stringify(c1.body).includes(good.sealed.ct));
  const cDemo = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: good, base_version: version }, "community-demo");
  check("a demo contribution is labelled and can never be paid", cDemo.body.state === "draft_demo" && /never paid/.test(cDemo.body.note));
  const cWrong = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: sealCand(wrongW), base_version: version }, "contrib");
  const cSelf = await api("POST", `/api/bounties/${bounty.id}/contributions`, { candidate: good, base_version: version }, "council");

  // ---- private case and grants ----
  const cases = JSON.parse(fs.readFileSync(path.join(APP, "../validation/portfolio-method-02/cases.json"), "utf8"));
  const { id: _, ...c03 } = cases.find((c) => c.id === "C03");
  const sc = kalis.sealData(devPub, c03);
  const pcase = await api("POST", "/api/private-test-cases", { method_id: "portfolio-rebalance", version, sealed_case: sc.sealed, case_ct_sha256: sc.dataCtSha256, label: "my real-ish portfolio (synthetic C03)" }, "case-owner");
  const grant = (cid) => api("POST", `/api/private-test-cases/${pcase.body.id}/grants`, { contribution_id: cid, purpose: "testing", allowed_output: ["per_check_status", "counts"], attempt_limit: 1, expires_at: new Date(Date.now() + 3600e3).toISOString(), explicit_consent: true }, "case-owner");
  const g1 = await grant(c1.body.id), gw = await grant(cWrong.body.id), gs = await grant(cSelf.body.id);

  const review0 = await api("POST", `/api/contributions/${c1.body.id}/reviews`, { decision: "accept", reason: "looks fine" }, "council");
  check("accept without a passing private test is refused", code(review0) === "needs_passing_test");
  const t1 = await api("POST", `/api/contributions/${c1.body.id}/tests`, { grant_ids: [g1.body.id] }, "contrib");
  check("private test of the good candidate passes inside the runner", t1.body.status === "passed" && t1.body.report.per_case[0].signature_valid && t1.body.report.per_case[0].hashes_bound, t1.body.report?.per_case?.map((c) => c.status).join(","));
  const raw = JSON.stringify(t1.body);
  check("test report holds no case data or answer values", !raw.includes(JSON.stringify(c03.holdings)) && !raw.includes("fee_rates") && !raw.includes("feasible") && !raw.includes(sc.sealed.ct));
  const t1b = await api("POST", `/api/contributions/${c1.body.id}/tests`, { grant_ids: [g1.body.id] }, "contrib");
  check("a second test on a 1-attempt grant is refused as exhausted", t1b.body.report.per_case[0].status === "refused" && t1b.body.report.per_case[0].reason === "exhausted" && t1b.body.status === "error");
  const tw = await api("POST", `/api/contributions/${cWrong.body.id}/tests`, { grant_ids: [gw.body.id] }, "contrib");
  check("a candidate with a wrong answer fails the private test", tw.body.status === "failed" && tw.body.report.per_case[0].per_check.find((p) => p.field === "cost").status === "fail");
  const crossGrant = await api("POST", `/api/contributions/${cWrong.body.id}/tests`, { grant_ids: [gs.body.id] }, "contrib");
  check("a grant for another candidate cannot be used", code(crossGrant) === "not_your_contribution" || crossGrant.body.report?.per_case?.[0]?.reason === "wrong_candidate");
  const acceptWrong = await api("POST", `/api/contributions/${cWrong.body.id}/reviews`, { decision: "accept", reason: "x", test_run_ids: [tw.body.id] }, "council");
  check("a failed candidate cannot be accepted", code(acceptWrong) === "needs_passing_test");
  const ts = await api("POST", `/api/contributions/${cSelf.body.id}/tests`, { grant_ids: [gs.body.id] }, "council");
  const self = await api("POST", `/api/contributions/${cSelf.body.id}/reviews`, { decision: "accept", reason: "mine", test_run_ids: [ts.body.id] }, "council");
  check("a council member cannot review their own candidate", code(self) === "self_review");
  const outsiderReview = await api("POST", `/api/contributions/${c1.body.id}/reviews`, { decision: "accept", reason: "x", test_run_ids: [t1.body.id] }, "outsider");
  check("a non-council account cannot review", code(outsiderReview) === "not_council");
  const accept = await api("POST", `/api/contributions/${c1.body.id}/reviews`, { decision: "accept", reason: "Same answers on the private case, fixed evaluator passed", test_run_ids: [t1.body.id] }, "council");
  check("council accepts with the immutable test report reference", accept.body.state === "accepted" && accept.body.reviews.at(-1).test_reports[0].report_sha256 && accept.body.allowed_actions.includes("request_payout"));

  // ---- payout and publish ----
  const payDemo = await api("POST", `/api/bounties/${bounty.id}/payout`, { contribution_id: c1.body.id }, "community-demo");
  check("payout needs a verified account", code(payDemo) === "login_required");
  const payWrongPerson = await api("POST", `/api/bounties/${bounty.id}/payout`, { contribution_id: c1.body.id }, "council");
  check("only the contributor submits the payout proposal", code(payWrongPerson) === "not_contributor");
  const pay = await api("POST", `/api/bounties/${bounty.id}/payout`, { contribution_id: c1.body.id }, "contrib");
  const pc = pay.body.payout?.contract_call;
  check("payout is an unsigned add_proposal BountyDone to the contributor", pc?.method_name === "add_proposal" && pc.args.proposal.kind.BountyDone.receiver_id === "kalis-contrib.testnet" && pc.args.proposal.kind.BountyDone.bounty_id === bounty.id);
  const pay2 = await api("POST", `/api/bounties/${bounty.id}/payout`, { contribution_id: c1.body.id }, "contrib");
  check("payout retry returns the same proposal, no duplicate", pay2.body.replayed === true && JSON.stringify(pay2.body.payout.contract_call) === JSON.stringify(pc));
  const pubNot = await api("POST", `/api/contributions/${cWrong.body.id}/publish-version`, {}, "contrib");
  check("a non-accepted candidate cannot become a version", code(pubNot) === "not_accepted");
  const pub = await api("POST", `/api/contributions/${c1.body.id}/publish-version`, {}, "contrib");
  const a = pub.body.publish?.contract_call?.args;
  check("publish is an unsigned publish_version bound to the tested hash, parent and contributor", a?.code_hash === good.code_hash && a.parent === version && a.contributors[0] === "kalis-contrib.testnet" && pub.body.publish.contract_call.signer_must_be);
  const pub2 = await api("POST", `/api/contributions/${c1.body.id}/publish-version`, {}, "contrib");
  check("publish retry does not create a second version request", pub2.body.replayed === true);
  fs.writeFileSync(path.join(DATA, "community-test-state.json"), JSON.stringify({ bounty_id: bounty.id, proposal: prop.body.id, contribution: c1.body.id, wrong_contribution: cWrong.body.id, case_id: pcase.body.id, version, dev_pub: devPub, seal: "not stored" }));
} finally {
  srv.kill();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
