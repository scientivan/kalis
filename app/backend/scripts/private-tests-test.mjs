// Group E (private test cases and grants) acceptance tests. Run scripts/community-test.mjs first:
// this script reuses its bounty and contributions from the same data dir. No chain transactions.
// Usage: node scripts/private-tests-test.mjs
import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as kalis from "../src/kalis-crypto.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const APP = path.resolve(ROOT, "..");
const DATA = process.env.TEST_DATA_DIR || "/Users/scientivan/.claude/jobs/333cb961/tmp/dataE";
const PORT = 8793, BASE = `http://localhost:${PORT}`;
const RUNNER = path.join(APP, "kalis-runner/target/release/kalis-runner");
const st = JSON.parse(fs.readFileSync(path.join(DATA, "community-test-state.json"), "utf8"));
const SEAL = crypto.randomBytes(32).toString("hex");
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };

// New dev seal key: re-seal the dev baseline and use a fresh contribution sealed to it.
const devPub = JSON.parse(execFileSync(RUNNER, { input: '{"cmd":"pubkey"}', env: { ...process.env, PROTECTED_SEAL_KEY: SEAL } }).toString()).tee_pubkey;
const baseWasm = fs.readFileSync(path.join(APP, "methods/portfolio-rebalance/method-v2-pruning.wasm"));
const baseHash = crypto.createHash("sha256").update(baseWasm).digest("hex");
fs.writeFileSync(path.join(DATA, "sealed-dev", "portfolio-rebalance", `${baseHash}.json`), JSON.stringify({ method_id: "portfolio-rebalance", code_hash: baseHash, sealed: kalis.sealMethod(devPub, baseWasm), dev_only: true }));
const sessions = JSON.parse(fs.readFileSync(path.join(DATA, "db", "sessions.json"), "utf8"));
const contribTok = Object.values(sessions).filter((s) => s.account_id === "kalis-contrib.testnet").at(-1).id;
const srv = spawn("node", [path.join(ROOT, "src/server.js"), "--fork-e-private-test"], { env: { ...process.env, PORT: String(PORT), PUBLIC_BASE: "http://localhost:8787", KALIS_DATA_DIR: DATA, KALIS_LOCAL_RUNNER: RUNNER, KALIS_LOCAL_SEAL_KEY: SEAL }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 2500));
async function api(method, p, body, who = "owner-ws") {
  const headers = { "Content-Type": "application/json" };
  if (who === "contrib") headers.Authorization = `Bearer ${contribTok}`; else headers["X-Kalis-Workspace"] = who;
  const r = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const w = baseWasm;
  const cand = { sealed: kalis.sealMethod(devPub, w), code_hash: baseHash };
  const contrib = (await api("POST", `/api/bounties/${st.bounty_id}/contributions`, { candidate: cand, base_version: st.version, description: "private-tests run" }, "contrib")).body;
  const cases = JSON.parse(fs.readFileSync(path.join(APP, "../validation/portfolio-method-02/cases.json"), "utf8"));
  const { id: _, ...c05 } = cases.find((c) => c.id === "C05");
  const sc = kalis.sealData(devPub, c05);

  const plain = await api("POST", "/api/private-test-cases", { method_id: "portfolio-rebalance", sealed_case: c05, case_ct_sha256: sc.dataCtSha256 });
  check("plaintext case is refused", code(plain) === "bad_case");
  const mism = await api("POST", "/api/private-test-cases", { method_id: "portfolio-rebalance", sealed_case: sc.sealed, case_ct_sha256: "0".repeat(64) });
  check("case hash must match the ciphertext", code(mism) === "case_hash_mismatch");
  const pc = await api("POST", "/api/private-test-cases", { method_id: "portfolio-rebalance", sealed_case: sc.sealed, case_ct_sha256: sc.dataCtSha256, label: "C05 (synthetic)" });
  check("sealed case stored, response has no ciphertext", pc.status === 200 && !JSON.stringify(pc.body).includes(sc.sealed.ct));
  const list = (await api("GET", "/api/private-test-cases")).body;
  check("owner list shows metadata only", list.items.some((c) => c.id === pc.body.id) && !JSON.stringify(list).includes(sc.sealed.ct));
  const otherList = (await api("GET", "/api/private-test-cases", null, "stranger-ws")).body;
  check("another principal does not see the case", !otherList.items.some((c) => c.id === pc.body.id));

  const g = (body, who = "owner-ws") => api("POST", `/api/private-test-cases/${pc.body.id}/grants`, { purpose: "testing", allowed_output: ["per_check_status", "counts"], attempt_limit: 1, expires_at: new Date(Date.now() + 3600e3).toISOString(), explicit_consent: true, contribution_id: contrib.id, ...body }, who);
  check("only the owner can grant", code(await g({}, "stranger-ws")) === "not_your_case");
  check("a grant needs separate explicit consent", code(await g({ explicit_consent: false })) === "consent_required");
  check("output scope cannot exceed per-check status and counts", code(await g({ allowed_output: ["per_check_status", "answer"] })) === "bad_output_scope");
  check("purpose must be testing (no training)", code(await g({ purpose: "training" })) === "bad_purpose");
  check("expiry must be in the future", code(await g({ expires_at: new Date(Date.now() - 1000).toISOString() })) === "bad_expiry");

  const revoked = (await g({})).body;
  await api("POST", `/api/test-grants/${revoked.id}/revoke`);
  const again = await api("POST", `/api/test-grants/${revoked.id}/revoke`);
  check("revoke is idempotent", again.body.already_revoked === true && again.body.status === "revoked");
  const tRev = (await api("POST", `/api/contributions/${contrib.id}/tests`, { grant_ids: [revoked.id] }, "contrib")).body;
  check("a revoked grant is refused", tRev.report.per_case[0].status === "refused" && tRev.report.per_case[0].reason === "revoked");

  const short = (await g({ expires_at: new Date(Date.now() + 1500).toISOString() })).body;
  await sleep(2500);
  const tExp = (await api("POST", `/api/contributions/${contrib.id}/tests`, { grant_ids: [short.id] }, "contrib")).body;
  check("an expired grant is refused", tExp.report.per_case[0].reason === "expired");

  const wrong = (await g({ contribution_id: undefined, code_hash: "a".repeat(64) })).body;
  const tWrong = (await api("POST", `/api/contributions/${contrib.id}/tests`, { grant_ids: [wrong.id] }, "contrib")).body;
  check("a grant for another candidate hash is refused", tWrong.report.per_case[0].reason === "wrong_candidate");

  const two = (await g({ attempt_limit: 2 })).body;
  const results = await Promise.all([0, 1, 2].map(() => api("POST", `/api/contributions/${contrib.id}/tests`, { grant_ids: [two.id] }, "contrib")));
  const statuses = results.map((r) => r.body.report.per_case[0].status);
  const used = (await api("GET", "/api/test-grants")).body.items.find((x) => x.id === two.id);
  check("attempt counter is exact under parallel requests", used.attempts_used === 2 && statuses.filter((s) => s === "refused").length === 1 && used.status === "exhausted", statuses.join(","));
  const ok = results.find((r) => r.body.status === "passed")?.body;
  check("an allowed test passes and reports only per-field status and counts", ok && Object.keys(ok.report.per_case[0].per_check[0]).sort().join(",") === "field,status");
  const raw = JSON.stringify(results.map((r) => r.body));
  check("no case data or answer values in any report", !raw.includes(JSON.stringify(c05.holdings)) && !raw.includes("fee_rates") && !raw.includes("feasible") && !raw.includes(sc.sealed.ct));
  const notMine = await api("POST", `/api/contributions/${contrib.id}/tests`, { grant_ids: [two.id] }, "owner-ws");
  check("only the contributor starts tests of their candidate", code(notMine) === "not_your_contribution");
} finally {
  srv.kill();
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
