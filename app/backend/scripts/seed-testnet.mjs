// Seeds real NEAR testnet activity for the Kalis demo account so every page has data.
// Runs are paid with the demo top-up (real testnet escrow), executed in the TEE runner and settled on chain.
// Usage: node scripts/seed-testnet.mjs <account_id> [base url]
// Writes a 24h session fixture (test_fixture: true, seeded: true) for <account_id> into data/db/sessions.json.
import crypto from "node:crypto";
import fs from "node:fs";
import * as kalis from "../src/kalis-crypto.js";

const ACCOUNT = process.argv[2];
const BASE = process.argv.slice(3).find((a) => a.startsWith("http")) || "http://localhost:8787";
if (!ACCOUNT) throw new Error("usage: seed-testnet.mjs <account_id>");
const SESS = new URL("../data/db/sessions.json", import.meta.url);
const sessions = JSON.parse(fs.readFileSync(SESS, "utf8"));
// The server caches collections in memory: write the session with the server stopped, then restart it.
let sid = Object.values(sessions).find((s) => s.seeded && s.account_id === ACCOUNT && !s.revoked && Date.parse(s.expires_at) > Date.now() + 3600e3)?.id;
if (process.argv.includes("--write-session")) {
  sid = crypto.randomBytes(32).toString("hex"); // same 64-hex shape as real sessions; the web proxy only forwards that shape
  sessions[sid] = { id: sid, account_id: ACCOUNT, expires_at: new Date(Date.now() + 24 * 3600e3).toISOString(), revoked: false, test_fixture: true, seeded: true };
  fs.writeFileSync(SESS, JSON.stringify(sessions, null, 1), { mode: 0o600 });
  console.log("session written; restart the server"); process.exit(0);
}
if (!sid) throw new Error("no seeded session; stop the server and run with --write-session first");

const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sid}` }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
};
const out = { account: ACCOUNT, session: sid, runs: [], reviews: [], errors: [] };
const cfg = await api("GET", "/api/config");
const methods = await api("GET", "/api/methods");

function sampleFor(id, fail) {
  if (id === "portfolio-rebalance") {
    const cases = JSON.parse(fs.readFileSync(new URL("../../../validation/portfolio-method-02/cases.json", import.meta.url)));
    const { id: _, ...c } = cases.find((x) => x.id === "C03");
    if (fail) c.lower = [0.5, 0.5, 0.5];
    return c;
  }
  const f = new URL(`../../methods/${id}/fixtures/sample-input.json`, import.meta.url);
  if (fs.existsSync(f)) { const { _note, ...s } = JSON.parse(fs.readFileSync(f)); return s; }
  return { role: "Backend engineer", offer_salary: 30000000, currency: "IDR per month", walk_away: 28000000, competing_offer: 31000000, market_median: 32000000, offer_has: { remote_days: 1, learning_budget: 0, leave_days: 12 } };
}

const done = new Set((await api("GET", "/api/runs?limit=100")).items.filter((r) => r.phase === "released").map((r) => r.method_id));
const plan = [...methods.filter((m) => !done.has(m.method_id)).map((m) => [m.method_id, false]), ...(process.argv.includes("--with-failure") ? [["portfolio-rebalance", true]] : [])];
for (const [id, fail] of plan) {
  try {
    const data = sampleFor(id, fail);
    const { sealed, secret, dataCtSha256 } = kalis.sealData(cfg.runner.tee_pubkey, data);
    const created = await api("POST", "/api/runs", { method_id: id, data_ct_sha256: dataCtSha256, payment: "demo_topup" });
    // Async execute and poll, like the web app. A timed-out OutLayer call is resumed by the next execute.
    let ex = null;
    for (let attempt = 0; attempt < 4 && !ex; attempt++) {
      const started = await api("POST", `/api/runs/${created.run_id}/execute`, { data: sealed, async: true });
      for (;;) {
        const op = await api("GET", `/api/operations/${started.operation_id}`);
        if (op.status === "succeeded") { ex = await api("GET", `/api/runs/${created.run_id}/execution`); break; }
        if (op.status === "failed") {
          if (!/did not finish/.test(op.error?.message || "") || attempt === 3) throw new Error(op.error?.message || "execution failed");
          console.log("  OutLayer still queued, resuming the same call"); break;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    let opened = null; try { opened = kalis.openAnswer(secret, ex.output); } catch {}
    const st = await api("POST", `/api/runs/${created.run_id}/settle`);
    out.runs.push({ id, run_id: created.run_id, pay_tx: created.pay_tx, settle_tx: st.settle_tx, status: st.status, reason: st.reason, opened: Boolean(opened) });
    console.log(id, fail ? "(failure case)" : "", created.run_id, st.status, st.settle_tx);
  } catch (e) { out.errors.push({ id, error: String(e.message).slice(0, 400) }); console.log("ERR", id, e.message.slice(0, 300)); }
}
fs.writeFileSync(new URL(`../data/seed-${ACCOUNT}.json`, import.meta.url), JSON.stringify(out, null, 2));
