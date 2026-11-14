// Community workflow (group D), private test cases (group E) and contribution packages (H7).
// RANCANGAN 65.4:
// - Authority comes from the Sputnik DAO policy on chain. Council members vote; a council member who
//   is not the contributor reviews; payout happens when a BountyDone proposal is approved on chain.
//   The backend never creates authority: every money or authority step is an UNSIGNED contract call
//   the right account signs in its own wallet, and status is always re-read from chain.
// - Private test cases are sealed to the runner TEE key by the owner's device and only opened inside
//   the runner `evaluate` command with the evaluator fixed in the bounty proposal. The candidate side
//   learns pass or fail per compared field and counts, nothing else.
// Demo workspaces may create labelled drafts (issues, demo contributions). Anything that moves money
// or uses authority needs a verified NEAR account (principal.kind "near_account").
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config, DATA_DIR } from "./config.js";
import { view } from "./near.js";
import { callRunner } from "./outlayer.js";
import { sha256Hex, fromB64 } from "./kalis-crypto.js";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { ApiError, HASH, money, getVersion, manifestByHash, sealedMethodByHash, methodDir } from "./market.js";

const MAX_CANDIDATE_CT = 4_000_000; // bytes of sealed candidate ciphertext
const MAX_CASE_CT = 1_000_000;
const EVAL_PREFIX = "kalis-evaluation:v1:";
const tag = (id) => `[kalis:${id}]`;
const TAG_RE = /\[kalis:([A-Za-z0-9-]+)\]/;

// ---------- chain authority ----------
async function daoId() { return (await view(config.market, "get_config")).dao; }
async function policy() {
  const dao = await daoId();
  const p = await view(dao, "get_policy");
  const council = p.roles.find((r) => r.name === "council")?.kind?.Group || [];
  return { dao, council, proposal_bond: p.proposal_bond, bounty_bond: p.bounty_bond, proposal_period: p.proposal_period, vote_policy: p.default_vote_policy, raw: p };
}
function needAccount(p, what) {
  if (p.kind !== "near_account") throw new ApiError(401, "login_required", `Sign in with your NEAR account to ${what}. A demo workspace cannot do it.`);
  return p.account_id;
}
async function needCouncil(p, what) {
  const acct = needAccount(p, what);
  const pol = await policy();
  if (!pol.council.includes(acct)) throw new ApiError(403, "not_council", `${acct} is not in the council of ${pol.dao} (read from the DAO policy on chain)`);
  return { acct, pol };
}
const call = (receiver_id, method_name, args, deposit_yocto, gas_tgas, signer) => ({ receiver_id, method_name, args, deposit_yocto: String(deposit_yocto), gas_tgas, signer_must_be: signer });

async function chainProposals() {
  const dao = await daoId();
  const last = await view(dao, "get_last_proposal_id");
  const out = [];
  for (let i = 0; i < last; i += 50) out.push(...await view(dao, "get_proposals", { from_index: i, limit: 50 }));
  return out;
}
async function chainBounties() { return view(await daoId(), "get_bounties", { from_index: 0, limit: 100 }); }

// ---------- views with relations and allowed actions ----------
function issueView(i) {
  const allowed = [];
  if (i.state === "open") allowed.push("create_proposal", "close");
  return { ...i, allowed_actions: allowed };
}

async function proposalView(link, chain) {
  const onChain = chain.find((c) => TAG_RE.exec(c.description)?.[1] === link.id) || null;
  const status = onChain?.status || "awaiting_signature";
  const allowed = !onChain ? ["sign_add_proposal"] : onChain.status === "InProgress" ? ["vote_approve", "vote_reject"] : [];
  return { ...link, dao_proposal_id: onChain?.id ?? null, chain_status: status, vote_counts: onChain?.vote_counts || null, votes: onChain?.votes || null, allowed_actions: allowed };
}

// ---------- evaluation runner ----------
function devSealed(methodId, codeHash) {
  const f = path.join(DATA_DIR, "sealed-dev", methodId, `${codeHash}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}

/** Run the runner `evaluate` command. Local native runner only when KALIS_LOCAL_RUNNER is set (dev). */
async function runEvaluate(input) {
  if (process.env.KALIS_LOCAL_RUNNER) {
    const env = { ...process.env, PROTECTED_SEAL_KEY: process.env.KALIS_LOCAL_SEAL_KEY || "", NEAR_AI_API_KEY: config.secrets.nearAiKey || "" };
    const out = JSON.parse(execFileSync(process.env.KALIS_LOCAL_RUNNER, { input: JSON.stringify(input), env, maxBuffer: 1 << 26 }).toString());
    return { output: out, via: "local_runner (development only, not a TEE)" };
  }
  const res = await callRunner(input);
  if (res.status !== "completed") throw new ApiError(502, "runner_failed", res.error || `runner status ${res.status}`);
  return { output: res.output, call_id: res.call_id, via: "outlayer_tee" };
}

function verifyEvaluation(out, expectedPubkey) {
  const pub = crypto.createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(out.evaluation_pubkey, "hex")]), format: "der", type: "spki" });
  const sigOk = crypto.verify(null, Buffer.from(EVAL_PREFIX + out.evaluation), pub, Buffer.from(out.evaluation_sig, "hex"));
  return { sigOk, keyOk: !expectedPubkey || out.evaluation_pubkey === expectedPubkey };
}

// Per-grant mutex so the attempt counter is atomic in this single process.
const locks = new Map();
async function withLock(key, fn) {
  while (locks.has(key)) await locks.get(key);
  let release;
  locks.set(key, new Promise((r) => (release = r)));
  try { return await fn(); } finally { locks.delete(key); release(); }
}

function grantState(g) {
  if (g.revoked_at) return "revoked";
  if (Date.parse(g.expires_at) < Date.now()) return "expired";
  if (g.attempts_used >= g.attempt_limit) return "exhausted";
  return "active";
}
const grantView = (g) => ({ ...g, status: grantState(g), allowed_actions: grantState(g) === "active" ? ["revoke"] : grantState(g) === "revoked" ? [] : ["revoke"] });

/** Latest test that produced an evaluation (passed or failed). Refused or errored attempts do not count. */
function lastCompletedTest(c) {
  return c.test_runs.map((id) => db.get("test_runs", id)).filter((t) => t && ["passed", "failed"].includes(t.status)).at(-1) || null;
}

function contributionView(c) {
  const allowed = [];
  const lastTest = lastCompletedTest(c);
  if (["submitted", "tested", "changes_requested"].includes(c.state)) allowed.push("run_private_test");
  if (lastTest?.status === "passed" && ["tested"].includes(c.state)) allowed.push("review");
  if (c.state === "accepted" && !c.payout) allowed.push("request_payout");
  if (c.state === "accepted" && !c.publish) allowed.push("request_publish_version");
  const { candidate, ...rest } = c;
  return { ...rest, candidate: { code_hash: candidate.code_hash, ct_sha256: candidate.ct_sha256, ct_bytes: candidate.ct_bytes }, allowed_actions: allowed };
}

// ---------- routes ----------
export function registerCommunityRoutes(route) {
  // Rules that are not decided yet are shown, not invented.
  route("GET", /^\/api\/community\/config$/, async () => {
    const pol = await policy();
    return {
      dao: pol.dao, council: pol.council, proposal_bond: money(pol.proposal_bond), bounty_bond: money(pol.bounty_bond),
      proposal_period_ns: String(pol.proposal_period), vote_policy: pol.vote_policy,
      authority: "Read from the Sputnik DAO policy on chain. The backend creates no authority.",
      rules: [
        { id: "reviewer", status: "enabled", reason: "A council member who is not the contributor." },
        { id: "payout", status: "enabled", reason: "BountyDone proposal approved on chain. Created with add_proposal because bounty_done of the deployed Sputnik contract rejects the required bond (BUILD_STATUS 6.12)." },
        { id: "competing_claimers", status: "unavailable", reason: "How several claimers of one bounty are ranked is not decided." },
        { id: "disputes", status: "unavailable", reason: "Dispute handling for rejected candidates is not decided." },
        { id: "royalty", status: "unavailable", reason: "Contributors receive the bounty only. Royalties are an open decision (RANCANGAN 7)." },
      ],
    };
  });

  // ---- issues ----
  route("POST", /^\/api\/issues$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const { v } = await getVersion(b?.method_id, b?.version);
    for (const k of ["problem", "expected"]) if (!String(b?.[k] || "").trim()) throw new ApiError(400, "bad_issue", `${k} is required`);
    const id = db.newId("issue");
    return issueView(db.put("issues", id, {
      id, created_at: db.nowIso(), method_id: b.method_id, version: v.number, module: String(b.module || "core").slice(0, 64),
      problem: String(b.problem).slice(0, 2000), expected: String(b.expected).slice(0, 2000),
      synthetic_reproduction: b.synthetic_reproduction ?? null, owner: p.id, demo: p.demo, state: "open", state_reason: null, proposal_ids: [],
    }));
  });
  route("GET", /^\/api\/issues$/, async (q) => {
    let rows = Object.values(db.all("issues"));
    if (q.get("method_id")) rows = rows.filter((r) => r.method_id === q.get("method_id"));
    const page = db.paginate(rows, { cursor: q.get("cursor"), limit: q.get("limit") });
    return { items: page.items.map(issueView), next_cursor: page.next_cursor };
  });
  route("GET", /^\/api\/issues\/([^/]+)$/, async (_q, [id]) => {
    const i = db.get("issues", id);
    if (!i) throw new ApiError(404, "unknown_issue", "No such issue");
    return issueView(i);
  });
  route("POST", /^\/api\/issues\/([^/]+)\/close$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const i = db.get("issues", id);
    if (!i) throw new ApiError(404, "unknown_issue", "No such issue");
    if (i.owner !== p.id) throw new ApiError(403, "not_your_issue", "Only the issue owner can close it");
    return issueView(db.put("issues", id, { ...i, state: "closed", state_reason: String(b?.reason || "closed by owner").slice(0, 300) }));
  });

  // ---- proposals: AddBounty with fixed criteria and evaluator ----
  route("POST", /^\/api\/proposals$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const proposer = needAccount(p, "propose a bounty (it needs a proposal bond)");
    const issue = db.get("issues", b?.issue_id);
    if (!issue) throw new ApiError(404, "unknown_issue", "issue_id is required");
    if (issue.state !== "open") throw new ApiError(409, "issue_not_open", `Issue is ${issue.state}`);
    const budget = BigInt(String(b?.budget_yocto || "0"));
    if (budget <= 0n) throw new ApiError(400, "bad_budget", "budget_yocto must be a positive integer string");
    const criteria = (b?.acceptance_criteria || []).map((x) => String(x).slice(0, 300)).filter(Boolean);
    if (!criteria.length) throw new ApiError(400, "no_criteria", "A paid bounty needs fixed acceptance_criteria");
    const fields = b?.evaluator?.compare?.fields;
    if (!Array.isArray(fields) || !fields.length) throw new ApiError(400, "no_evaluator", "evaluator.compare.fields is required: the answer fields a candidate must reproduce on private cases");
    const pol = await policy();
    const reviewer = b?.reviewer;
    if (!pol.council.includes(reviewer)) throw new ApiError(400, "reviewer_not_council", "reviewer must be a council member from the DAO policy");
    const deadlineNs = BigInt(String(b?.deadline_ns || 7n * 24n * 3600n * 10n ** 9n));
    const id = db.newId("prop");
    const description = `Bounty for ${issue.method_id} v${issue.version} (${issue.module}): ${issue.problem.slice(0, 160)} | Accept if: ${criteria.join("; ")} ${tag(id)}`;
    const link = db.put("proposal_links", id, {
      id, created_at: db.nowIso(), issue_id: issue.id, proposer, method_id: issue.method_id, base_version: issue.version, module: issue.module,
      budget: money(budget), acceptance_criteria: criteria,
      evaluator: { kind: "kalis-evaluate:v1", compare: { fields: fields.map(String).slice(0, 32), tolerance: Number(b.evaluator.compare.tolerance ?? 1e-6) }, min_cases: Math.max(1, Number(b.evaluator.min_cases || 1)) },
      reviewer, deadline_ns: deadlineNs.toString(), description,
      contract_call: call(pol.dao, "add_proposal", { proposal: { description, kind: { AddBounty: { bounty: { description, token: "", amount: budget.toString(), times: 1, max_deadline: deadlineNs.toString() } } } } }, pol.proposal_bond, 150, proposer),
    });
    db.put("issues", issue.id, { ...issue, state: "proposed", proposal_ids: [...issue.proposal_ids, id] });
    return proposalView(link, []);
  });
  route("GET", /^\/api\/proposals$/, async () => {
    const chain = await chainProposals();
    return { items: await Promise.all(Object.values(db.all("proposal_links")).map((l) => proposalView(l, chain))) };
  });
  route("GET", /^\/api\/proposals\/([^/]+)$/, async (_q, [id]) => {
    const l = db.get("proposal_links", id);
    if (!l) throw new ApiError(404, "unknown_proposal", "No such proposal");
    return proposalView(l, await chainProposals());
  });
  // Vote: unsigned act_proposal for a council member. The result is read from chain afterwards.
  route("POST", /^\/api\/proposals\/([^/]+)\/vote$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const { acct, pol } = await needCouncil(p, "vote");
    const l = db.get("proposal_links", id);
    if (!l) throw new ApiError(404, "unknown_proposal", "No such proposal");
    const v = await proposalView(l, await chainProposals());
    if (v.dao_proposal_id === null) throw new ApiError(409, "not_on_chain", "The proposal has not been submitted to the DAO yet");
    if (v.chain_status !== "InProgress") throw new ApiError(409, "voting_closed", `Proposal is ${v.chain_status}`);
    const action = { approve: "VoteApprove", reject: "VoteReject" }[b?.vote];
    if (!action) throw new ApiError(400, "bad_vote", 'vote must be "approve" or "reject"');
    return { proposal: v, contract_call: call(pol.dao, "act_proposal", { id: v.dao_proposal_id, action }, 0, 150, acct), next: "Sign with your wallet, then GET this proposal. Status is read from chain, never assumed." };
  });

  // ---- bounties from chain, joined with app data ----
  const bountyView = async (bnt) => {
    const linkId = TAG_RE.exec(bnt.description)?.[1];
    const link = linkId ? db.get("proposal_links", linkId) : null;
    if (link) { const i = db.get("issues", link.issue_id); if (i && i.state === "proposed") db.put("issues", i.id, { ...i, state: "funded" }); }
    const contribs = Object.values(db.all("contributions")).filter((c) => c.bounty_id === bnt.id).map((c) => c.id);
    return { ...bnt, amount: money(bnt.amount), proposal_link: link?.id || null, issue_id: link?.issue_id || null, method_id: link?.method_id || null, base_version: link?.base_version ?? null,
      acceptance_criteria: link?.acceptance_criteria || null, evaluator: link?.evaluator || null, reviewer: link?.reviewer || null, contributions: contribs,
      open: bnt.times > 0, allowed_actions: bnt.times > 0 && link ? ["claim", "submit_contribution"] : [] , note: link ? null : "Created outside this app. No fixed evaluator, so it cannot be tested here." };
  };
  route("GET", /^\/api\/bounties$/, async () => ({ items: await Promise.all((await chainBounties()).map(bountyView)) }));
  route("GET", /^\/api\/bounties\/(\d+)$/, async (_q, [id]) => {
    const bnt = (await chainBounties()).find((x) => x.id === Number(id));
    if (!bnt) throw new ApiError(404, "unknown_bounty", "No such bounty on chain");
    return bountyView(bnt);
  });
  route("POST", /^\/api\/bounties\/(\d+)\/claim$/, async (_q, [id], b, req) => {
    const acct = needAccount(principal(req), "claim a bounty (it needs a claim bond)");
    const pol = await policy();
    const deadline = String(b?.deadline_ns || 24n * 3600n * 10n ** 9n);
    return { contract_call: call(pol.dao, "bounty_claim", { id: Number(id), deadline }, pol.bounty_bond, 100, acct), note: "The claim bond is held by the DAO." };
  });

  // ---- contributions ----
  route("POST", /^\/api\/bounties\/(\d+)\/contributions$/, async (_q, [bid], b, req) => {
    const p = principal(req);
    const bnt = await bountyView((await chainBounties()).find((x) => x.id === Number(bid)) || (() => { throw new ApiError(404, "unknown_bounty", "No such bounty on chain"); })());
    if (!bnt.proposal_link) throw new ApiError(409, "no_evaluator", "This bounty has no fixed evaluator in this app");
    for (const k of ["evaluator", "acceptance_criteria", "compare", "criteria"]) if (b?.[k] !== undefined) throw new ApiError(400, "cannot_change_evaluator", "A candidate cannot set or replace the evaluator or acceptance criteria");
    const s = b?.candidate?.sealed;
    if (!s?.ct || !s?.epk || !s?.nonce) throw new ApiError(400, "bad_candidate", "candidate.sealed must be a sealed method blob {epk, nonce, ct} sealed to the runner TEE key");
    if (!HASH.test(b?.candidate?.code_hash || "")) throw new ApiError(400, "bad_code_hash", "candidate.code_hash must be the sha256 of the candidate plaintext");
    const ct = fromB64(s.ct);
    if (ct.length > MAX_CANDIDATE_CT) throw new ApiError(413, "candidate_too_large", `Sealed candidate over ${MAX_CANDIDATE_CT} bytes`);
    if (Number(b?.base_version) !== bnt.base_version) throw new ApiError(409, "base_version_mismatch", `This bounty is for version ${bnt.base_version}`);
    const { v } = await getVersion(bnt.method_id, bnt.base_version);
    const manifest = v.manifest || {};
    const openModules = manifest.open_modules || [];
    const module = String(b?.target_module || "core");
    const needsOwner = !openModules.includes(module);
    const demo = p.kind !== "near_account";
    const id = db.newId("contrib");
    return contributionView(db.put("contributions", id, {
      id, created_at: db.nowIso(), bounty_id: bnt.id, proposal_link: bnt.proposal_link, issue_id: bnt.issue_id, method_id: bnt.method_id, base_version: bnt.base_version,
      author: p.id, author_account: p.account_id, demo, target_module: module,
      candidate: { sealed: s, code_hash: b.candidate.code_hash, ct_sha256: sha256Hex(ct), ct_bytes: ct.length },
      description: String(b?.description || "").slice(0, 2000), impact: String(b?.impact || "").slice(0, 1000), regression_cases: (b?.regression_cases || []).slice(0, 50),
      validation: {
        base_version_ok: true, size_ok: true, evaluator_untouched: true,
        imports: "checked inside the TEE at test time: only kalis.ai_chat, and only when the manifest allows a model",
        needs_owner_access: needsOwner, needs_owner_access_reason: needsOwner ? `Module "${module}" is not in the version's open_modules (${openModules.join(", ") || "none"}). A private-core fix needs the owner's involvement.` : null,
      },
      state: demo ? "draft_demo" : "submitted", test_runs: [], reviews: [], payout: null, publish: null,
      note: demo ? "Demo contribution. It can be tested but never paid: a verified NEAR account is required for payout." : null,
    }));
  });
  route("GET", /^\/api\/contributions\/([^/]+)$/, async (_q, [id]) => {
    const c = db.get("contributions", id);
    if (!c) throw new ApiError(404, "unknown_contribution", "No such contribution");
    return contributionView(c);
  });

  // ---- private test cases (owner only, sealed) ----
  route("POST", /^\/api\/private-test-cases$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const { v } = await getVersion(b?.method_id, b?.version);
    const s = b?.sealed_case;
    if (!s?.ct || !s?.epk || !s?.nonce) throw new ApiError(400, "bad_case", "sealed_case must be sealed to the runner TEE key on the owner's device. Plaintext is never accepted.");
    const ct = fromB64(s.ct);
    if (ct.length > MAX_CASE_CT) throw new ApiError(413, "case_too_large", "Sealed case over 1 MB");
    if (sha256Hex(ct) !== b?.case_ct_sha256) throw new ApiError(409, "case_hash_mismatch", "case_ct_sha256 is not the sha256 of the sealed ciphertext");
    const id = db.newId("case");
    db.put("private_test_cases", id, { id, created_at: db.nowIso(), owner: p.id, demo: p.demo, method_id: b.method_id, version: v.number, sealed_case: s, case_ct_sha256: b.case_ct_sha256, label: String(b?.label || "").slice(0, 120) || null, usage: "testing only, never training, only through grants" });
    const { sealed_case, ...meta } = db.get("private_test_cases", id);
    return meta;
  });
  route("GET", /^\/api\/private-test-cases$/, async (_q, _m, _b, req) => {
    const p = principal(req);
    return { items: Object.values(db.all("private_test_cases")).filter((c) => c.owner === p.id).map(({ sealed_case, ...m }) => m) };
  });
  route("POST", /^\/api\/private-test-cases\/([^/]+)\/grants$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const c = db.get("private_test_cases", id);
    if (!c) throw new ApiError(404, "unknown_case", "No such case");
    if (c.owner !== p.id) throw new ApiError(403, "not_your_case", "Only the case owner can grant access");
    if (b?.explicit_consent !== true) throw new ApiError(400, "consent_required", "explicit_consent: true is required. A normal run never grants testing access.");
    if (b?.purpose !== "testing") throw new ApiError(400, "bad_purpose", 'purpose must be "testing"');
    const allowedOut = b?.allowed_output || ["per_check_status", "counts"];
    if (allowedOut.some((x) => !["per_check_status", "counts"].includes(x))) throw new ApiError(400, "bad_output_scope", "allowed_output may only contain per_check_status and counts");
    if (!b?.contribution_id && !HASH.test(b?.code_hash || "")) throw new ApiError(400, "bad_scope", "Name contribution_id or a candidate code_hash");
    if (b?.contribution_id) {
      const ctr = db.get("contributions", b.contribution_id);
      if (!ctr) throw new ApiError(404, "unknown_contribution", "No such contribution");
      if (ctr.method_id !== c.method_id) throw new ApiError(409, "wrong_method", "The contribution is for another method");
    }
    const limit = Math.min(Math.max(Number(b?.attempt_limit || 1), 1), 20);
    const exp = Date.parse(b?.expires_at || "");
    if (!exp || exp < Date.now()) throw new ApiError(400, "bad_expiry", "expires_at must be a future ISO time");
    const gid = db.newId("grant");
    return grantView(db.put("test_grants", gid, { id: gid, created_at: db.nowIso(), case_id: id, owner: p.id, method_id: c.method_id, contribution_id: b.contribution_id || null, code_hash: b.code_hash || null, purpose: "testing", allowed_output: allowedOut, attempt_limit: limit, attempts_used: 0, expires_at: new Date(exp).toISOString(), consent_at: db.nowIso(), revoked_at: null }));
  });
  route("GET", /^\/api\/test-grants$/, async (_q, _m, _b, req) => {
    const p = principal(req);
    return { items: Object.values(db.all("test_grants")).filter((g) => g.owner === p.id).map(grantView) };
  });
  route("POST", /^\/api\/test-grants\/([^/]+)\/revoke$/, async (_q, [id], _b, req) => {
    const p = principal(req);
    const g = db.get("test_grants", id);
    if (!g || g.owner !== p.id) throw new ApiError(404, "unknown_grant", "No such grant for this principal");
    if (g.revoked_at) return { ...grantView(g), already_revoked: true };
    return grantView(db.put("test_grants", id, { ...g, revoked_at: db.nowIso() }));
  });

  // ---- private test of a contribution ----
  route("POST", /^\/api\/contributions\/([^/]+)\/tests$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const ctr = db.get("contributions", id);
    if (!ctr) throw new ApiError(404, "unknown_contribution", "No such contribution");
    if (ctr.author !== p.id) throw new ApiError(403, "not_your_contribution", "Only the contributor starts a test of their candidate");
    if (!["submitted", "tested", "changes_requested", "draft_demo"].includes(ctr.state)) throw new ApiError(409, "not_testable", `Contribution is ${ctr.state}`);
    const link = db.get("proposal_links", ctr.proposal_link);
    const grants = (b?.grant_ids || []).map((g) => db.get("test_grants", g));
    if (!grants.length || grants.some((g) => !g)) throw new ApiError(400, "no_grants", "grant_ids must name existing grants from case owners");
    if (grants.length < link.evaluator.min_cases) throw new ApiError(400, "too_few_cases", `The evaluator needs at least ${link.evaluator.min_cases} private cases`);
    const { v } = await getVersion(ctr.method_id, ctr.base_version);
    const manifestText = manifestByHash(ctr.method_id, v.manifest_hash);
    const baseline = (process.env.KALIS_LOCAL_RUNNER ? devSealed(ctr.method_id, v.code_hash) : null) || sealedMethodByHash(ctr.method_id, v.code_hash);
    if (!manifestText || !baseline) throw new ApiError(409, "base_not_runnable", "The base version has no manifest or sealed build on this server");
    const tid = db.newId("test");
    db.put("test_runs", tid, { id: tid, created_at: db.nowIso(), contribution_id: id, candidate_code_hash: ctr.candidate.code_hash, grant_ids: grants.map((g) => g.id), evaluator: link.evaluator, status: "running", report: null });
    db.put("contributions", id, { ...ctr, test_runs: [...ctr.test_runs, tid] });
    const perCase = [];
    for (const g0 of grants) {
      // Reserve one attempt atomically before running.
      const reserved = await withLock(g0.id, async () => {
        const g = db.get("test_grants", g0.id);
        const st = grantState(g);
        if (st !== "active") return { ok: false, reason: st };
        if (g.method_id !== ctr.method_id) return { ok: false, reason: "wrong_method" };
        if (g.contribution_id && g.contribution_id !== id) return { ok: false, reason: "wrong_candidate" };
        if (g.code_hash && g.code_hash !== ctr.candidate.code_hash) return { ok: false, reason: "wrong_candidate" };
        db.put("test_grants", g.id, { ...g, attempts_used: g.attempts_used + 1 });
        return { ok: true };
      });
      if (!reserved.ok) { perCase.push({ grant_id: g0.id, status: "refused", reason: reserved.reason }); continue; }
      const caseRow = db.get("private_test_cases", g0.case_id);
      try {
        const { output, via, call_id } = await runEvaluate({ cmd: "evaluate", run_id: tid.slice(0, 64), manifest: manifestText, baseline: baseline.sealed, candidate: ctr.candidate.sealed, case: caseRow.sealed_case, compare: link.evaluator.compare });
        if (!output?.ok) throw new ApiError(502, "evaluate_failed", output?.error || "runner did not evaluate");
        const sig = verifyEvaluation(output, (await view(config.market, "get_config")).runner_pubkey);
        const rec = JSON.parse(output.evaluation);
        const hashOk = rec.candidate_sha256 === ctr.candidate.code_hash && rec.baseline_sha256 === v.code_hash && rec.case_ct_sha256 === caseRow.case_ct_sha256;
        const revoked = Boolean(db.get("test_grants", g0.id).revoked_at);
        perCase.push(revoked
          ? { grant_id: g0.id, status: "withheld_revoked", reason: "The case owner revoked the grant while the test ran, so the result is withheld." }
          : { grant_id: g0.id, status: rec.all_pass && hashOk && sig.sigOk ? "passed" : "failed", per_check: output.per_check, counts: output.counts, both_reports_ok: output.both_reports_ok,
              signature_valid: sig.sigOk, key_matches_market: sig.keyOk, hashes_bound: hashOk, evaluation: output.evaluation, evaluation_sig: output.evaluation_sig, via, call_id: call_id || null });
      } catch (e) {
        perCase.push({ grant_id: g0.id, status: "error", reason: e.message.slice(0, 300) });
      }
    }
    const done = perCase.filter((c) => ["passed", "failed"].includes(c.status));
    const status = done.length < link.evaluator.min_cases ? "error" : done.every((c) => c.status === "passed") ? "passed" : "failed";
    const report = { per_case: perCase, summary: { cases: perCase.length, passed: done.filter((c) => c.status === "passed").length, failed: done.filter((c) => c.status === "failed").length }, report_sha256: null };
    report.report_sha256 = db.payloadHash(report);
    db.put("test_runs", tid, { ...db.get("test_runs", tid), status, report, finished_at: db.nowIso() });
    const c2 = db.get("contributions", id);
    if (c2.state !== "draft_demo") db.put("contributions", id, { ...c2, state: "tested" });
    return { ...db.get("test_runs", tid), contribution: contributionView(db.get("contributions", id)) };
  });
  route("GET", /^\/api\/test-runs\/([^/]+)$/, async (_q, [id]) => {
    const t = db.get("test_runs", id);
    if (!t) throw new ApiError(404, "unknown_test_run", "No such test run");
    return t;
  });

  // ---- review by a council member who is not the contributor ----
  route("POST", /^\/api\/contributions\/([^/]+)\/reviews$/, async (_q, [id], b, req) => {
    const p = principal(req);
    const { acct } = await needCouncil(p, "review a contribution");
    const ctr = db.get("contributions", id);
    if (!ctr) throw new ApiError(404, "unknown_contribution", "No such contribution");
    if (ctr.author_account === acct) throw new ApiError(403, "self_review", "A contributor cannot review their own candidate");
    if (ctr.state === "draft_demo") throw new ApiError(409, "demo_contribution", "Demo contributions cannot be accepted");
    const decision = b?.decision;
    if (!["accept", "reject", "request_changes"].includes(decision)) throw new ApiError(400, "bad_decision", "decision must be accept, reject or request_changes");
    const reason = String(b?.reason || "").trim();
    if (!reason) throw new ApiError(400, "reason_required", "A review needs a reason");
    const refs = (b?.test_run_ids || []).map((t) => db.get("test_runs", t)).filter((t) => t && t.contribution_id === id);
    if (decision === "accept") {
      const last = lastCompletedTest(ctr);
      if (!last || last.status !== "passed" || !refs.some((r) => r.id === last.id)) throw new ApiError(409, "needs_passing_test", "Accept needs the latest private test of this exact candidate to have passed, named in test_run_ids");
      if (last.candidate_code_hash !== ctr.candidate.code_hash) throw new ApiError(409, "candidate_changed", "The tested candidate differs from the submitted one");
    }
    const rv = { id: db.newId("review"), at: db.nowIso(), reviewer: acct, decision, reason: reason.slice(0, 1000), test_reports: refs.map((r) => ({ id: r.id, report_sha256: r.report?.report_sha256, status: r.status })) };
    const state = { accept: "accepted", reject: "rejected", request_changes: "changes_requested" }[decision];
    return contributionView(db.put("contributions", id, { ...ctr, state, accepted_code_hash: decision === "accept" ? ctr.candidate.code_hash : ctr.accepted_code_hash || null, reviews: [...ctr.reviews, rv] }));
  });

  // ---- payout: BountyDone proposal (unsigned), once per accepted candidate ----
  route("POST", /^\/api\/bounties\/(\d+)\/payout$/, async (_q, [bid], b, req) => {
    const p = principal(req);
    const acct = needAccount(p, "request a payout");
    const ctr = db.get("contributions", b?.contribution_id);
    if (!ctr || ctr.bounty_id !== Number(bid)) throw new ApiError(404, "unknown_contribution", "contribution_id must be a contribution to this bounty");
    if (ctr.state !== "accepted") throw new ApiError(409, "not_accepted", "Only an accepted candidate can be paid");
    if (ctr.author_account !== acct) throw new ApiError(403, "not_contributor", "The contributor submits the BountyDone proposal");
    const pol = await policy();
    const chain = await chainProposals();
    const onChain = chain.find((x) => x.kind?.BountyDone?.bounty_id === ctr.bounty_id && x.kind.BountyDone.receiver_id === acct && x.description.includes(tag(ctr.id)));
    if (ctr.payout) return { contribution: contributionView(ctr), payout: { ...ctr.payout, dao_proposal_id: onChain?.id ?? null, chain_status: onChain?.status || "awaiting_signature" }, replayed: true };
    const others = Object.values(db.all("contributions")).filter((c) => c.bounty_id === ctr.bounty_id && c.id !== ctr.id && c.payout);
    if (others.length) throw new ApiError(409, "bounty_already_paid", "Another contribution to this bounty already requested the payout");
    const description = `Bounty ${ctr.bounty_id} done by ${acct}. Candidate ${ctr.candidate.code_hash}, test ${lastCompletedTest(ctr).id} passed, accepted by ${ctr.reviews.at(-1).reviewer}. ${tag(ctr.id)}`;
    const payout = { requested_at: db.nowIso(), contract_call: call(pol.dao, "add_proposal", { proposal: { description, kind: { BountyDone: { bounty_id: ctr.bounty_id, receiver_id: acct } } } }, pol.proposal_bond, 150, acct),
      note: "Created with add_proposal (bounty_done of the deployed Sputnik contract rejects the bond). The council approves it on chain; that is when the DAO pays." };
    return { contribution: contributionView(db.put("contributions", ctr.id, { ...ctr, payout })), payout: { ...payout, dao_proposal_id: null, chain_status: "awaiting_signature" }, replayed: false };
  });

  // ---- new version from the accepted candidate (unsigned publish_version for the method owner) ----
  route("POST", /^\/api\/contributions\/([^/]+)\/publish-version$/, async (_q, [id], _b, req) => {
    principal(req);
    const ctr = db.get("contributions", id);
    if (!ctr) throw new ApiError(404, "unknown_contribution", "No such contribution");
    if (ctr.state !== "accepted" || ctr.accepted_code_hash !== ctr.candidate.code_hash) throw new ApiError(409, "not_accepted", "Only the accepted, tested candidate can become a version");
    const { method, v } = await getVersion(ctr.method_id, ctr.base_version);
    const existing = method.versions.find((x) => x.code_hash === ctr.candidate.code_hash && x.parent === ctr.base_version);
    if (ctr.publish) return { contribution: contributionView(ctr), publish: { ...ctr.publish, published_version: existing?.number ?? null }, replayed: true };
    // Make the tested candidate runnable as the new version: store its sealed blob like a seller would.
    const dir = path.join(methodDir(ctr.method_id), "sealed");
    const f = path.join(dir, `${ctr.candidate.code_hash}.json`);
    if (!fs.existsSync(f)) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, JSON.stringify({ method_id: ctr.method_id, code_hash: ctr.candidate.code_hash, tee_pubkey: config.runner.teePubkey, sealed: ctr.candidate.sealed, from_contribution: ctr.id })); }
    const args = { method_id: ctr.method_id, code_hash: ctr.candidate.code_hash, manifest_hash: v.manifest_hash, runner_hash: v.runner_hash, price: v.price, dao_share_pct: v.dao_share_pct,
      parent: v.number, contributors: [ctr.author_account].filter(Boolean), note: `Bounty ${ctr.bounty_id}, contribution ${ctr.id}, test ${lastCompletedTest(ctr).id}` };
    const publish = { requested_at: db.nowIso(), contract_call: call(config.market, "publish_version", args, "100000000000000000000000", 100, method.owner), bound_to: { code_hash: ctr.candidate.code_hash, test_run: lastCompletedTest(ctr).id } };
    return { contribution: contributionView(db.put("contributions", id, { ...ctr, publish })), publish: { ...publish, published_version: existing?.number ?? null }, replayed: false };
  });

  // ---- H7 contribution package ----
  route("GET", /^\/api\/methods\/([^/]+)\/versions\/(\d+)\/contribution-package$/, async (_q, [mid, n]) => {
    const { v } = await getVersion(mid, n);
    const m = v.manifest || {};
    const openModules = m.open_modules || [];
    return {
      method_id: mid, version: v.number, kind: m.kind || "wasm", code_hash: v.code_hash, manifest_hash: v.manifest_hash,
      inputs: m.inputs || null, outputs: m.outputs || null, steps: m.steps || [], buyer_checks: m.buyer_checks || [],
      interface: m.kind === "prompt"
        ? { kind: "prompt", note: "A prompt candidate is a full replacement prompt, sealed. The runner sends it with the case data to the first allowed model." }
        : { kind: "wasm", target: "wasm32-unknown-unknown", exports: ["memory", "alloc(len: u32) -> u32", "run(ptr: u32, len: u32) -> u64 (ptr << 32 | len of the JSON answer)"],
            imports: (m.ai?.allowed || []).length ? ["kalis.ai_chat(req_ptr, req_len, out_ptr, out_cap) -> i32, models limited to the manifest"] : [],
            answer: '{"steps": [{"id","ok","detail"}...], "result": {...}}; steps must match manifest.steps' },
      open_modules: openModules, private_core_note: openModules.length ? null : "private core: interface only. The seller has not opened any module, so a fix needs the owner's access (needs_owner_access).",
      synthetic_examples: m.inputs?.sample ?? null, ai_allowed: m.ai?.allowed || [],
      evaluator: { contract: "runner evaluate command, kalis-evaluation:v1 signed record", compare: "fixed per bounty in the proposal; a candidate cannot change it" },
      change_limits: ["Same manifest and inputs/outputs as the base version", "Imports only kalis.ai_chat and only when the manifest allows a model", `Sealed candidate at most ${MAX_CANDIDATE_CT} bytes`, "No network, storage or chain access"],
      how_to_submit: "Seal the candidate to the runner TEE key (GET /api/config runner.tee_pubkey, kalis-crypto sealMethod) and POST /api/bounties/:id/contributions with {candidate: {sealed, code_hash}, base_version, target_module, description, regression_cases}.",
      never_included: "Raw private source or seller prompts are never part of this package.",
    };
  });
}
