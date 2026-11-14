// H5: private artifacts and input provenance.
// - POST /api/artifacts stores ciphertext only (sealed on the owner's device) with owner-only access.
//   The server cannot read it. Retention and deletion policy is still an open product decision, so
//   nothing here promises a retention period; DELETE removes the ciphertext immediately.
// - Run drafts record input_sources (document, connector, memory, browser, file_import, typed) with
//   hashes and a reviewed flag, so a run shows where each input came from (see runs-api.js).
import crypto from "node:crypto";
import * as db from "./db.js";
import { principal } from "./principal.js";
import { ApiError, HASH } from "./market.js";

const KINDS = ["buyer_input", "document_extraction", "seller_artifact", "test_case", "other"];
const MAX_CT = 1_500_000;

function own(p, id) {
  const a = db.get("artifacts", id);
  if (!a || a.deleted) throw new ApiError(404, "unknown_artifact", "No such artifact");
  if (a.owner !== p.id) throw new ApiError(403, "not_your_artifact", "This artifact belongs to another principal");
  return a;
}

export function registerArtifactRoutes(route) {
  route("POST", /^\/api\/artifacts$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const s = b?.sealed;
    if (!s?.ct || !s?.epk || !s?.nonce) throw new ApiError(400, "not_sealed", "Send only a sealed blob {epk, nonce, ct}. Plaintext is refused.");
    if (b.plaintext !== undefined || b.text !== undefined) throw new ApiError(400, "plaintext_refused", "Plaintext fields are refused. Seal on the device first.");
    const ctBytes = Buffer.from(s.ct, "base64");
    if (!ctBytes.length || ctBytes.length > MAX_CT) throw new ApiError(400, "bad_size", `Ciphertext must be 1 byte to ${MAX_CT} bytes`);
    const kind = KINDS.includes(b.kind) ? b.kind : "other";
    const source_refs = Array.isArray(b.source_refs) ? b.source_refs.slice(0, 20).map((r) => ({ type: String(r.type || "").slice(0, 32), id: String(r.id || "").slice(0, 80), sha256: HASH.test(r.sha256 || "") ? r.sha256 : null })) : [];
    const id = db.newId("art");
    const row = { id, owner: p.id, owner_demo: p.demo, kind, label: String(b.label || "").slice(0, 120) || null, created_at: db.nowIso(), revision: 1,
      ct_sha256: crypto.createHash("sha256").update(ctBytes).digest("hex"), bytes: ctBytes.length, sealed: s,
      classification: b.classification === "public" ? "public" : "private", source_refs,
      run_id: b.run_id || null, draft_id: b.draft_id || null };
    db.put("artifacts", id, row);
    const { sealed, ...meta } = row;
    return meta;
  });
  route("GET", /^\/api\/artifacts$/, async (q, _m, _b, req) => {
    const p = principal(req);
    const rows = Object.values(db.all("artifacts")).filter((a) => a.owner === p.id && !a.deleted).map(({ sealed, ...m }) => m);
    return db.paginate(rows, { cursor: q.get("cursor"), limit: q.get("limit") });
  });
  route("GET", /^\/api\/artifacts\/([^/]+)$/, async (_q, [id], _b, req) => { const { sealed, ...m } = own(principal(req), id); return m; });
  route("GET", /^\/api\/artifacts\/([^/]+)\/ciphertext$/, async (_q, [id], _b, req) => { const a = own(principal(req), id); return { id: a.id, ct_sha256: a.ct_sha256, sealed: a.sealed }; });
  route("DELETE", /^\/api\/artifacts\/([^/]+)$/, async (_q, [id], _b, req) => {
    const a = own(principal(req), id);
    db.put("artifacts", id, { id: a.id, owner: a.owner, deleted: true, deleted_at: db.nowIso(), ct_sha256: a.ct_sha256 });
    return { id, deleted: true, note: "The ciphertext was removed from this server. Copies already sent to a runner are not tracked here." };
  });
}
