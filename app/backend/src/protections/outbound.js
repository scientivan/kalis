// Protection 2: private data flowing out.
// Every external send is held until the user approves that exact action. Approval is bound to a hash
// of destination, content and parameters; any change needs a new approval. Values the user marked
// private are tracked (taint), and content that carries them, even inside a summary, is flagged.
// Destinations must be declared in the method manifest.
import { config } from "../config.js";
import { load, save, newId, now, audit, sha256, ProtectionError } from "./store.js";

/** Register values that must not leave without explicit approval, e.g. a cost price. */
export function markPrivate(ws, { label, values }) {
  if (!label || !Array.isArray(values) || !values.length) throw new ProtectionError(400, "bad_private_values", "Send { label, values: [...] }");
  const rows = load(ws, "private_values");
  rows.push({ id: newId("pv"), label, values: values.map(String), at: now() });
  save(ws, "private_values", rows);
  audit(ws, { protection: "outbound", event: "private_values_marked", label, count: values.length });
  return { label, count: values.length };
}

// Forms a number can take in text: 812000000, 812,000,000, 812.000.000, 812 million, 812 juta.
function variants(v) {
  const s = String(v).trim(), out = new Set([s.toLowerCase()]);
  const n = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n) && n >= 100) {
    const i = Math.round(n);
    out.add(String(i)); out.add(i.toLocaleString("en-US")); out.add(i.toLocaleString("de-DE"));
    if (i % 1e6 === 0) { out.add(`${i / 1e6} million`); out.add(`${i / 1e6} juta`); out.add(`${i / 1e6}m`); }
  }
  return [...out].filter((x) => x.length >= 3);
}
function taint(ws, text) {
  const t = (text || "").toLowerCase(), hits = [];
  for (const row of load(ws, "private_values")) for (const v of row.values) if (variants(v).some((x) => t.includes(x))) hits.push({ label: row.label, value_hint: `${String(v).slice(0, 2)}…` });
  return hits;
}
const actionHash = (a) => sha256(JSON.stringify({ destination: a.destination, content: a.content, params: a.params || {} }));
const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };

export function propose(ws, { destination, content, params = {}, origin = "method", manifest }) {
  const host = hostOf(destination);
  if (!host) throw new ProtectionError(400, "bad_destination", "destination must be a URL");
  const allowed = (manifest?.outbound || []).some((o) => o.host === host && (!o.path || new URL(destination).pathname.startsWith(o.path)));
  const hits = taint(ws, `${content} ${JSON.stringify(params)}`);
  const row = {
    id: newId("out"), destination, host, content, params, origin, created_at: now(),
    action_hash: actionHash({ destination, content, params }),
    private_values_found: hits,
    status: allowed ? "held_for_approval" : "blocked",
    reason: allowed
      ? (hits.length ? `Held. This content contains values you marked private (${[...new Set(hits.map((h) => h.label))].join(", ")}). Approve only if you mean to share them.` : "Held until you approve this exact content.")
      : `Blocked. ${host} is not a destination this method declared.`,
  };
  const rows = load(ws, "outbound"); rows.push(row); save(ws, "outbound", rows);
  audit(ws, { protection: "outbound", event: row.status, id: row.id, host, private_values: hits.length });
  return row;
}

export const list = (ws) => load(ws, "outbound");

export function approve(ws, id, action_hash) {
  const rows = load(ws, "outbound"); const r = rows.find((x) => x.id === id);
  if (!r) throw new ProtectionError(404, "unknown_action", "No such outbound action");
  if (r.status !== "held_for_approval") throw new ProtectionError(409, "not_approvable", `This action is ${r.status}`);
  if (action_hash !== r.action_hash) throw new ProtectionError(409, "hash_mismatch", "Approve the exact action you reviewed (action_hash does not match)");
  r.status = "approved"; r.approved_at = now(); r.approved_hash = action_hash; save(ws, "outbound", rows);
  audit(ws, { protection: "outbound", event: "approved", id });
  return r;
}

export function reject(ws, id) {
  const rows = load(ws, "outbound"); const r = rows.find((x) => x.id === id);
  if (!r) throw new ProtectionError(404, "unknown_action", "No such outbound action");
  r.status = "rejected"; r.rejected_at = now(); save(ws, "outbound", rows);
  audit(ws, { protection: "outbound", event: "rejected", id });
  return r;
}

/** Send an approved action. The content is re-hashed so a change after approval is refused. */
export async function execute(ws, id, { content, params } = {}) {
  const rows = load(ws, "outbound"); const r = rows.find((x) => x.id === id);
  if (!r) throw new ProtectionError(404, "unknown_action", "No such outbound action");
  if (r.status !== "approved") throw new ProtectionError(409, "not_approved", `This action is ${r.status}, not approved`);
  const sending = { destination: r.destination, content: content ?? r.content, params: params ?? r.params };
  if (actionHash(sending) !== r.approved_hash) {
    audit(ws, { protection: "outbound", event: "refused_changed", id });
    throw new ProtectionError(409, "changed_after_approval", "The content changed after approval. Propose it again so you can review the new version.");
  }
  if (!r.destination.startsWith(config.publicBase)) throw new ProtectionError(403, "mock_only", "In this demo only the mock procurement portal can receive data");
  const resp = await fetch(r.destination, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: sending.content, params: sending.params }) });
  r.status = resp.ok ? "sent" : "send_failed"; r.sent_at = now(); r.receipt = await resp.json().catch(() => null); save(ws, "outbound", rows);
  audit(ws, { protection: "outbound", event: r.status, id });
  return r;
}
