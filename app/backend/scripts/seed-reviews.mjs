// Writes one review per released run of the demo account. The comment states only what the run itself shows
// (checks passed, how long it took), never the private input or answer. Usage: node scripts/seed-reviews.mjs <account_id>
import fs from "node:fs";
const ACCOUNT = process.argv[2];
const BASE = process.argv[3] || "http://localhost:8787";
const sessions = JSON.parse(fs.readFileSync(new URL("../data/db/sessions.json", import.meta.url), "utf8"));
const sid = Object.values(sessions).find((s) => s.seeded && s.account_id === ACCOUNT && !s.revoked && Date.parse(s.expires_at) > Date.now())?.id;
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sid}` }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};
const runs = (await api("GET", "/api/runs?limit=100")).items.filter((r) => r.phase === "released");
for (const run of runs) {
  try {
    const e = await api("GET", `/api/runs/${run.id}/review-eligibility`);
    if (!e.eligible) { console.log("skip", run.method_id, e.reason); continue; }
    const ex = await api("GET", `/api/runs/${run.id}/execution`);
    const ok = ex.completion?.record?.all_ok;
    const minutes = Math.max(1, Math.round((Date.parse(ex.at) - Date.parse(run.created_at)) / 60000));
    const rating = ok ? (minutes <= 3 ? 5 : 4) : 2;
    const comment = ok
      ? `Every step finished and my checks passed on this device. The answer took about ${minutes} minute${minutes > 1 ? "s" : ""} on testnet.`
      : `The run finished but not every step succeeded, so the payment logic handled it. Took about ${minutes} minutes.`;
    const r = await api("POST", `/api/methods/${run.method_id}/reviews`, { run_id: run.id, rating, comment, privacy_acknowledged: true, idempotency_key: `seed-review-${run.id}` });
    console.log("review", run.method_id, rating, r.id);
  } catch (err) { console.log("ERR", run.method_id, err.message.slice(0, 200)); }
}
