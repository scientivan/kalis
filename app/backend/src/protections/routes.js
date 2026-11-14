// HTTP routes for the five protections and the labelled mock services they use.
// Every protections route needs an X-Kalis-Workspace header (demo identity; no real login yet).
import fs from "node:fs";
import path from "node:path";
import { config, METHODS_DIR, ROOT } from "../config.js";
import { view } from "../near.js";
import { sha256Hex } from "../kalis-crypto.js";
import { checkWorkspace, load, ProtectionError } from "./store.js";
import * as credentials from "./credentials.js";
import { MOCK_SHEETS, MOCK_DOCS, MOCK_WALLET } from "./mock-data.js";
import * as outbound from "./outbound.js";
import * as memory from "./memory.js";
import * as documents from "./documents.js";
import * as browser from "./browser.js";
import * as db from "../db.js";
import { principal } from "../principal.js";

/**
 * Manifest that governs a protection request.
 * - With run_id (H4): the manifest of the version that run paid for, never a later version. The run
 *   must belong to the caller and be for the same method.
 * - Without run_id: the latest market version (a draft-local check, labelled as such), or the local
 *   draft manifest for a method not yet listed.
 */
export async function resolveManifest(methodId, runId, req) {
  if (!/^[A-Za-z0-9_-]{3,48}$/.test(methodId || "")) throw new ProtectionError(400, "bad_method_id", "method_id is required");
  if (runId) {
    const row = db.get("runs", runId);
    if (!row) throw new ProtectionError(404, "unknown_run", `No run ${runId} on this server`);
    if (req && row.principal !== principal(req).id) throw new ProtectionError(403, "not_your_run", "This run belongs to another principal");
    if (row.method_id !== methodId) throw new ProtectionError(409, "method_mismatch", `Run ${runId} is for ${row.method_id}, not ${methodId}`);
    const onChain = await view(config.market, "get_run", { run_id: runId }).catch(() => null);
    if (!onChain) throw new ProtectionError(409, "run_not_paid", "This run has not been paid yet");
    const v = await view(config.market, "get_version", { method_id: methodId, number: onChain.version });
    const dir = path.join(METHODS_DIR, methodId);
    for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
      const text = fs.readFileSync(path.join(dir, f), "utf8");
      if (sha256Hex(text) === v.manifest_hash) return { ...JSON.parse(text), _source: `paid run ${runId}, version ${v.number}`, _run_id: runId, _manifest_hash: v.manifest_hash };
    }
    throw new ProtectionError(404, "manifest_missing", `Manifest of ${methodId} v${v.number} is not on this server`);
  }
  const dir = path.join(METHODS_DIR, methodId);
  const v = await view(config.market, "get_version", { method_id: methodId }).catch(() => null);
  if (v) {
    for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
      const text = fs.readFileSync(path.join(dir, f), "utf8");
      if (sha256Hex(text) === v.manifest_hash) return { ...JSON.parse(text), _source: `latest market version ${v.number} (not bound to a paid run)` };
    }
    throw new ProtectionError(404, "manifest_missing", `Manifest of ${methodId} v${v.number} is not on this server`);
  }
  const draft = path.join(dir, "manifest.json");
  if (!fs.existsSync(draft)) throw new ProtectionError(404, "unknown_method", `No method ${methodId}`);
  return { ...JSON.parse(fs.readFileSync(draft, "utf8")), _source: "local draft, not in the market" };
}

const MOCK = "This is a labelled mock service for the Kalis demo. Nothing here is real.";
const tenderHtml = `<!doctype html><html><body><h1>Kota Harapan Procurement Portal (mock)</h1><p>${MOCK}</p>
<h2>Tender T-2026-114</h2><p>Supply of 400 ergonomic office chairs. Deadline 20 November 2026.</p>
<p><a href="/mock/portal/docs/T-2026-114.png">Tender document (scan)</a></p>
<form method="post" action="/mock/portal/submit"><button>Submit bid</button></form></body></html>`;

export function registerProtectionRoutes(route) {
  const ws = (req) => checkWorkspace(req.headers["x-kalis-workspace"]);

  // ----- mock services (labelled) -----
  route("GET", /^\/mock\/broker\/positions$/, async (_q, _m, _b, req) => {
    if (req.headers.authorization !== `Bearer ${config.secrets.mockBrokerToken}`) throw new ProtectionError(401, "bad_token", "Mock broker: invalid token");
    return { mock: MOCK, account: "DEMO-001", positions: [{ asset: "A", units: 7, price: 2 }, { asset: "B", units: 1, price: 3 }, { asset: "C", units: 1, price: 1 }], cash: 5 };
  });
  route("GET", /^\/mock\/portal\/?$/, async () => ({ __html: tenderHtml }));
  route("GET", /^\/mock\/portal\/tenders\/T-2026-114$/, async () => ({ __html: tenderHtml }));
  route("GET", /^\/mock\/portal\/docs\/T-2026-114\.png$/, async () => ({ __file: path.join(ROOT, "mock", "tender-T-2026-114.png"), __type: "image/png" }));
  const submissions = [];
  route("POST", /^\/mock\/portal\/submit$/, async (_q, _m, body) => { const r = { receipt: `MOCK-${submissions.length + 1}`, received: body, at: new Date().toISOString(), mock: MOCK }; submissions.push(r); return r; });
  route("GET", /^\/mock\/portal\/submissions$/, async () => submissions);
  // Demo only: the mock broker token, so the UI can show "connect your broker". Real tokens come from the broker.
  route("GET", /^\/mock\/broker\/demo-token$/, async () => ({ token: config.secrets.mockBrokerToken, mock: MOCK }));
  // Demo only: a token for any mock connector, so the UI can show "connect your spreadsheet / document / wallet".
  route("GET", /^\/mock\/demo-token$/, async (q) => {
    const c = q.get("connector");
    if (!credentials.CONNECTORS[c]) throw new ProtectionError(404, "unknown_connector", `Unknown connector "${c}"`);
    return { connector: c, token: credentials.mockToken(c), mock: MOCK };
  });
  const mockAuth = (req, connector) => {
    if (req.headers.authorization !== `Bearer ${credentials.mockToken(connector)}`) throw new ProtectionError(401, "bad_token", `${connector}: invalid token`);
  };
  route("GET", /^\/mock\/sheets\/range$/, async (q, _m, _b, req) => {
    mockAuth(req, "sheets_mock");
    const sheet = MOCK_SHEETS[q.get("sheet")];
    if (!sheet) throw new ProtectionError(404, "unknown_sheet", "No such mock sheet");
    return sheet;
  });
  route("GET", /^\/mock\/docs\/document$/, async (q, _m, _b, req) => {
    mockAuth(req, "docs_mock");
    const doc = MOCK_DOCS[q.get("doc")];
    if (!doc) throw new ProtectionError(404, "unknown_doc", "No such mock document");
    return doc;
  });
  route("GET", /^\/mock\/wallet\/loans$/, async (_q, _m, _b, req) => { mockAuth(req, "wallet_mock"); return MOCK_WALLET; });
  // Lists the mock sheets and documents (names only), so the UI can offer a picker.
  route("GET", /^\/mock\/catalog$/, async () => ({ mock: MOCK,
    sheets: Object.entries(MOCK_SHEETS).map(([id, s]) => ({ id, company: s.company })),
    docs: Object.entries(MOCK_DOCS).map(([id, d]) => ({ id, title: d.title })) }));

  // ----- 1 credentials -----
  route("POST", /^\/api\/protections\/credentials$/, async (_q, _m, b, req) => credentials.connect(ws(req), b || {}));
  route("GET", /^\/api\/protections\/credentials$/, async (_q, _m, _b, req) => credentials.list(ws(req)).map((c) => {
    const state = c.revoked_at ? "revoked" : Date.parse(c.expires_at) < Date.now() ? "expired" : "active";
    return { ...c, effective_state: state, changed_at: c.revoked_at || c.last_used_at || c.created_at, allowed_actions: state === "active" ? ["use", "revoke"] : [] };
  }));
  route("POST", /^\/api\/protections\/credentials\/([^/]+)\/revoke$/, async (_q, [id], _b, req) => credentials.revoke(ws(req), id));
  route("POST", /^\/api\/protections\/credentials\/([^/]+)\/use$/, async (_q, [id], b, req) =>
    credentials.use(ws(req), { credential_id: id, operation: b?.operation, params: b?.params, manifest: await resolveManifest(b?.method_id, b?.run_id, req) }));

  // ----- 2 outbound -----
  route("POST", /^\/api\/protections\/private-values$/, async (_q, _m, b, req) => outbound.markPrivate(ws(req), b || {}));
  route("POST", /^\/api\/protections\/outbound$/, async (_q, _m, b, req) => outbound.propose(ws(req), { ...b, manifest: await resolveManifest(b?.method_id, b?.run_id, req) }));
  route("GET", /^\/api\/protections\/outbound$/, async (_q, _m, _b, req) => outbound.list(ws(req)));
  route("POST", /^\/api\/protections\/outbound\/([^/]+)\/approve$/, async (_q, [id], b, req) => outbound.approve(ws(req), id, b?.action_hash));
  route("POST", /^\/api\/protections\/outbound\/([^/]+)\/reject$/, async (_q, [id], _b, req) => outbound.reject(ws(req), id));
  route("POST", /^\/api\/protections\/outbound\/([^/]+)\/execute$/, async (_q, [id], b, req) => outbound.execute(ws(req), id, b || {}));

  // ----- 3 memory -----
  route("POST", /^\/api\/protections\/memory$/, async (_q, _m, b, req) => memory.propose(ws(req), b || {}));
  route("GET", /^\/api\/protections\/memory$/, async (_q, _m, _b, req) => memory.list(ws(req)).map((m) => ({
    ...m, effective_state: m.status,
    allowed_actions: m.status === "pending_review" ? ["approve", "reject", "edit", "delete"] : m.status === "approved" ? ["edit", "delete"] : ["delete"],
    given_to_methods: m.status === "approved" ? "only to methods whose manifest asks for memory, marked as data" : "no",
  })));
  route("GET", /^\/api\/protections\/memory\/recall$/, async (q, _m, _b, req) => memory.recall(ws(req), await resolveManifest(q.get("method_id"), q.get("run_id"), req)));
  route("POST", /^\/api\/protections\/memory\/([^/]+)\/(approve|reject|delete)$/, async (_q, [id, act], _b, req) =>
    (act === "approve" ? memory.approve : act === "reject" ? memory.reject : memory.remove)(ws(req), id));
  route("POST", /^\/api\/protections\/memory\/([^/]+)\/edit$/, async (_q, [id], b, req) => memory.edit(ws(req), id, b?.text));

  // ----- 4 documents -----
  route("POST", /^\/api\/protections\/documents$/, async (_q, _m, b, req) => documents.ingest(ws(req), { ...b, manifest: await resolveManifest(b?.method_id, b?.run_id, req) }));
  route("GET", /^\/api\/protections\/documents$/, async (_q, _m, _b, req) => documents.list(ws(req)));
  route("GET", /^\/api\/protections\/documents\/([^/]+)$/, async (_q, [id], _b, req) => documents.get(ws(req), id));

  // ----- 5 browser agent -----
  route("POST", /^\/api\/protections\/browser$/, async (_q, _m, b, req) => browser.act(ws(req), { ...b, manifest: await resolveManifest(b?.method_id, b?.run_id, req) }));

  // ----- audit -----
  route("GET", /^\/api\/protections\/audit$/, async (_q, _m, _b, req) => load(ws(req), "audit"));
}
