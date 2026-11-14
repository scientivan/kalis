// Self-review block: the on-chain owner of a method cannot review it. No chain writes.
// Needs a seeded session for the owner (seed-testnet.mjs --write-session) and one executed run of theirs.
// Usage: node scripts/own-review-test.mjs <owner_account> <method_id> <run_id> [base url]
import fs from "node:fs";
const [ACCOUNT, METHOD, RUN, BASE = "http://localhost:8787"] = process.argv.slice(2);
const sessions = JSON.parse(fs.readFileSync(new URL("../data/db/sessions.json", import.meta.url), "utf8"));
const sid = Object.values(sessions).find((s) => s.seeded && s.account_id === ACCOUNT && !s.revoked && Date.parse(s.expires_at) > Date.now())?.id;
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const api = async (m, p, b) => { const r = await fetch(BASE + p, { method: m, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sid}` }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
const owner = (await api("GET", `/api/methods/${METHOD}`)).body.owner;
check("caller is the on-chain owner", owner === ACCOUNT, owner);
const e = await api("GET", `/api/runs/${RUN}/review-eligibility`);
check("eligibility says own_method", e.body.eligible === false && e.body.reason === "own_method", e.body.reason);
const before = (await api("GET", `/api/methods/${METHOD}/rating-summary`)).body.count;
const r = await api("POST", `/api/methods/${METHOD}/reviews`, { run_id: RUN, rating: 5, comment: "self", privacy_acknowledged: true });
check("self-review refused with 403 own_method", r.status === 403 && r.body?.error?.code === "own_method", `${r.status} ${r.body?.error?.code}`);
const after = (await api("GET", `/api/methods/${METHOD}/rating-summary`)).body.count;
check("no review stored", after === before, `${before} -> ${after}`);
const anon = await fetch(`${BASE}/api/runs/${RUN}/review-eligibility`, { headers: { "X-Kalis-Workspace": "own-test-x" } }).then((x) => x.json());
check("other callers still get not_your_run", anon.reason === "not_your_run", anon.reason);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
