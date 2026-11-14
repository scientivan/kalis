// Protection 1: credentials and integrations.
// A connector token is stored encrypted (AES-256-GCM) with a narrow scope, an expiry and a revoke switch.
// Methods and sellers never receive it; the backend uses it on the buyer's behalf for one allowed
// operation at a time and logs each use without the value.
// Limitation: this broker runs on the Kalis backend, not inside a TEE, so the operator could read tokens.
import crypto from "node:crypto";
import { config } from "../config.js";
import { load, save, newId, now, audit, ProtectionError } from "./store.js";
import { MOCK_SHEETS, MOCK_DOCS } from "./mock-data.js";

// Connectors the platform knows. Only read and prepare operations exist; nothing can place a trade.
export const CONNECTORS = {
  broker_mock: {
    label: "Mock broker (labelled mock, no real broker)",
    operations: { read_positions: { scope: "read", method: "GET", path: "/mock/broker/positions" } },
    forbidden: ["place_order", "withdraw", "transfer"],
  },
  // Productivity apps (labelled mocks shaped like a spreadsheet and a document service).
  sheets_mock: {
    label: "Mock spreadsheet (labelled mock, no real Excel or Google account)",
    operations: { read_range: { scope: "read", method: "GET", path: "/mock/sheets/range", params: { sheet: Object.keys(MOCK_SHEETS) } } },
    forbidden: ["write_range", "delete_sheet", "share_sheet"],
  },
  docs_mock: {
    label: "Mock document store (labelled mock, no real Word or Google account)",
    operations: { read_document: { scope: "read", method: "GET", path: "/mock/docs/document", params: { doc: Object.keys(MOCK_DOCS) } } },
    forbidden: ["edit_document", "delete_document", "share_document"],
  },
  wallet_mock: {
    label: "Mock wallet (labelled mock, no real wallet or chain)",
    operations: { read_loans: { scope: "read", method: "GET", path: "/mock/wallet/loans" } },
    forbidden: ["sign_transaction", "transfer", "repay", "borrow", "approve"],
  },
};

/** Mock token per connector. broker_mock keeps MOCK_BROKER_TOKEN; the others derive from it. */
export function mockToken(connector) {
  const base = config.secrets.mockBrokerToken || "";
  if (connector === "broker_mock") return base;
  return crypto.createHmac("sha256", base).update(`kalis-mock:${connector}`).digest("hex");
}

function key() {
  if (!config.secrets.credentialKey) throw new ProtectionError(503, "not_configured", "CREDENTIAL_KEY is not configured");
  return Buffer.from(config.secrets.credentialKey, "hex");
}
function encrypt(text) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return { iv: iv.toString("base64"), ct: ct.toString("base64"), tag: c.getAuthTag().toString("base64") };
}
function decrypt(box) {
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(box.iv, "base64"));
  d.setAuthTag(Buffer.from(box.tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(box.ct, "base64")), d.final()]).toString("utf8");
}
const publicView = ({ secret, ...rest }) => rest;

export function connect(ws, { connector, token, scopes = ["read"], ttl_minutes = 60 }) {
  const c = CONNECTORS[connector];
  if (!c) throw new ProtectionError(400, "unknown_connector", `Unknown connector "${connector}"`);
  if (!token || typeof token !== "string") throw new ProtectionError(400, "missing_token", "token is required");
  if (scopes.some((s) => s !== "read")) throw new ProtectionError(400, "scope_not_allowed", "Only the read scope can be granted");
  const row = { id: newId("cred"), connector, scopes, created_at: now(), expires_at: new Date(Date.now() + ttl_minutes * 60000).toISOString(), revoked_at: null, last_used_at: null, secret: encrypt(token) };
  const rows = load(ws, "credentials"); rows.push(row); save(ws, "credentials", rows);
  audit(ws, { protection: "credentials", event: "connected", credential: row.id, connector });
  return publicView(row);
}

export const list = (ws) => load(ws, "credentials").map(publicView);

export function revoke(ws, id) {
  const rows = load(ws, "credentials"); const r = rows.find((x) => x.id === id);
  if (!r) throw new ProtectionError(404, "unknown_credential", "No such credential");
  r.revoked_at = r.revoked_at || now(); save(ws, "credentials", rows);
  audit(ws, { protection: "credentials", event: "revoked", credential: id });
  return publicView(r);
}

/**
 * Use a credential for one operation on behalf of a method. Refused unless the method manifest
 * declares the connector and the operation, the credential is live, and the operation fits its scope.
 */
export async function use(ws, { credential_id, operation, params = {}, manifest }) {
  const rows = load(ws, "credentials"); const r = rows.find((x) => x.id === credential_id);
  const deny = (code, message) => { audit(ws, { protection: "credentials", event: "refused", credential: credential_id, operation, reason: code }); throw new ProtectionError(403, code, message); };
  if (!r) deny("unknown_credential", "No such credential");
  const c = CONNECTORS[r.connector];
  if (c.forbidden.includes(operation)) deny("operation_forbidden", `${operation} can never be done through Kalis. Only reading and preparing are possible.`);
  const op = c.operations[operation];
  if (!op) deny("unknown_operation", `${r.connector} has no operation "${operation}"`);
  const declared = (manifest?.connectors || []).find((x) => x.id === r.connector);
  if (!declared || !(declared.operations || []).includes(operation)) deny("not_in_manifest", `The method's manifest does not ask for ${r.connector}.${operation}, so it cannot use this connection`);
  if (r.revoked_at) deny("revoked", "This connection was revoked");
  if (Date.parse(r.expires_at) < Date.now()) deny("expired", "This connection has expired");
  if (!r.scopes.includes(op.scope)) deny("scope", `This connection only allows ${r.scopes.join(", ")}`);
  // Only parameters the connector names, with values from its allowlist, reach the service.
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (!op.params?.[k]) deny("bad_param", `${r.connector}.${operation} takes no parameter "${k}"`);
    if (!op.params[k].includes(String(v))) deny("bad_param", `${k} must be one of ${op.params[k].join(", ")}`);
    query.set(k, String(v));
  }
  for (const k of Object.keys(op.params || {})) if (!query.has(k)) deny("missing_param", `${r.connector}.${operation} needs ${k} (one of ${op.params[k].join(", ")})`);
  const qs = query.toString() ? `?${query}` : "";
  const resp = await fetch(`${config.publicBase}${op.path}${qs}`, { method: op.method, headers: { Authorization: `Bearer ${decrypt(r.secret)}` } });
  const body = await resp.json();
  if (!resp.ok) deny("connector_error", `Connector answered ${resp.status}`);
  r.last_used_at = now(); save(ws, "credentials", rows);
  audit(ws, { protection: "credentials", event: "used", credential: r.id, operation, params });
  // The token itself is never returned. The data goes back to the buyer's device, which seals it for the TEE.
  return { credential: publicView(r), operation, data: body };
}
