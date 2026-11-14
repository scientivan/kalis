// Seeds the Data pages (Connections, Files, Memory) for the Kalis demo account with labelled mock sources.
// All companies and accounts are fictional. Usage: node scripts/seed-data-sources.mjs <account_id> [base url]
import fs from "node:fs";
const ACCOUNT = process.argv[2];
const BASE = process.argv[3] || "http://localhost:8787";
const sessions = JSON.parse(fs.readFileSync(new URL("../data/db/sessions.json", import.meta.url), "utf8"));
const sid = Object.values(sessions).find((s) => s.seeded && s.account_id === ACCOUNT && !s.revoked && Date.parse(s.expires_at) > Date.now())?.id;
if (!sid) throw new Error("no seeded session");
const api = async (method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sid}` }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};
const out = {};
for (const connector of ["sheets_mock", "docs_mock", "wallet_mock"]) {
  try {
    const t = await (await fetch(`${BASE}/mock/demo-token?connector=${connector}`)).json();
    const c = await api("POST", "/api/protections/credentials", { connector, token: t.token, scopes: ["read"], ttl_minutes: 1440 });
    out[connector] = c.id || "ok";
  } catch (e) { out[connector] = e.message; }
}
for (const [text, kind] of [["My minimum margin on public tenders is 12 percent.", "user"], ["Prefer suppliers that accept 45 day payment terms.", "user"]]) {
  try { out[text.slice(0, 20)] = (await api("POST", "/api/protections/memory", { text, source: { kind, ref: "seed" } })).id; } catch (e) { out.memory = e.message; }
}
try {
  const png = Buffer.from(await (await fetch(`${BASE}/mock/portal/docs/T-2026-114.png`)).arrayBuffer()).toString("base64");
  const d = await api("POST", "/api/protections/documents", { method_id: "tender-bid", filename: "tender-T-2026-114.png", mime: "image/png", base64: png });
  out.document = d.id;
} catch (e) { out.document = e.message; }
console.log(JSON.stringify(out, null, 2));
