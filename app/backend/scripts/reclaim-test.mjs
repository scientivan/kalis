// Timeout reclaim test for the run left Paid by runs-test.mjs (data/reclaim-pending.json).
// Run it at least 30 minutes after runs-test.mjs. Usage: node scripts/reclaim-test.mjs [base url]
import fs from "node:fs";
const BASE = process.argv[2] || "http://localhost:8787";
const { workspace, run_id } = JSON.parse(fs.readFileSync(new URL("../data/reclaim-pending.json", import.meta.url)));
const api = async (m, p, b, ws = workspace) => { const r = await fetch(BASE + p, { method: m, headers: { "Content-Type": "application/json", "X-Kalis-Workspace": ws }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, body: await r.json() }; };
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const before = (await api("GET", `/api/runs/${run_id}`)).body;
check("run is still Paid and now reclaimable", before.status === "Paid" && before.reclaimable === true, before.reclaim_after_ns);
const other = await api("POST", `/api/runs/${run_id}/reclaim`, {}, `${workspace}-other`);
check("another principal cannot reclaim a mock top-up run", other.body.error?.code === "not_your_run");
const r1 = await api("POST", `/api/runs/${run_id}/reclaim`, {});
check("reclaim refunds through refund_expired", r1.body.reclaimed === true && r1.body.run?.status === "Refunded", r1.body.tx);
const r2 = await api("POST", `/api/runs/${run_id}/reclaim`, {});
check("second reclaim changes nothing", r2.body.reclaimed === false && r2.body.status === "Refunded");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
