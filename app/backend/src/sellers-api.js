// Seller side: creator profiles, method drafts, sealed artifacts, validation, publication through the
// seller's own wallet, and per-version test evidence.
//
// The server never signs for a seller. Publication returns unsigned contract calls (register_method
// when the method is new, then publish_version) for the seller's wallet; /confirm then reads the chain
// and marks the draft published once a version with exactly the draft's hashes exists.
// Plaintext prompts or code are refused: the artifact must already be sealed to the runner TEE key.
import fs from "node:fs";
import path from "node:path";
import { config, DATA_DIR } from "./config.js";
import { view } from "./near.js";
import * as db from "./db.js";
import { principal, requireAccount } from "./principal.js";
import { ApiError, HASH, money, methodDir, PLATFORM_SHARE_PCT } from "./market.js";
import { sha256Hex, PROMPT_SELLER_WARNING } from "./kalis-crypto.js";
import { validateManifest } from "./manifest-validate.js";

export const PROMPT_WARNING_VERSION = sha256Hex(PROMPT_SELLER_WARNING).slice(0, 16);
const DEPOSIT_YOCTO = (10n ** 23n).toString(); // 0.1 NEAR attached for storage; the contract refunds the excess
const KINDS = ["wasm", "prompt"];
const FORBIDDEN_KEYS = ["prompt", "wasm_base64", "wasm", "plaintext", "source", "code"];

const rawOf = (manifest) => JSON.stringify(manifest, null, 2);

function ownDraft(p, id) {
  const d = db.get("method_drafts", id);
  if (!d) throw new ApiError(404, "unknown_draft", "No such method draft");
  if (d.owner_account !== p.account_id) throw new ApiError(403, "not_owner", "Only the seller who created this draft can change or publish it");
  return d;
}

async function chainMethod(id) {
  return view(config.market, "get_method", { method_id: id });
}

function publicDraft(d) {
  const { artifact, ...rest } = d;
  return { ...rest, artifact: artifact ? { code_hash: artifact.code_hash, kind: artifact.kind, size: artifact.size, uploaded_at: artifact.uploaded_at, sealed: true } : null };
}

/** Everything that blocks publication, as a list of {path, message}. */
function validateDraft(d) {
  const errors = [];
  if (!d.manifest) errors.push({ path: "manifest", message: "manifest is missing" });
  if (!d.artifact) errors.push({ path: "artifact", message: "the sealed method artifact is missing" });
  if (!(d.price_yocto && /^\d+$/.test(d.price_yocto) && BigInt(d.price_yocto) > 0n)) errors.push({ path: "price_yocto", message: "price must be a positive integer string in yoctoNEAR" });
  const dao = Number(d.dao_share_pct);
  if (!Number.isInteger(dao) || dao < 10 || dao > 100 - PLATFORM_SHARE_PCT) errors.push({ path: "dao_share_pct", message: `DAO share must be a whole number from 10 to ${100 - PLATFORM_SHARE_PCT}` });
  let v = null;
  if (d.manifest) {
    v = validateManifest({ raw: rawOf(d.manifest) });
    errors.push(...v.errors.map((e) => ({ path: `manifest.${e.path}`, message: e.message })));
    if (Number(d.manifest.manifest_version) !== 5) errors.push({ path: "manifest.manifest_version", message: "new versions must use manifest version 5" });
    if (d.manifest.method_id !== d.method_id) errors.push({ path: "manifest.method_id", message: `must equal the draft's method_id ${d.method_id}` });
    if ((d.manifest.kind || "wasm") !== d.kind) errors.push({ path: "manifest.kind", message: `must equal the draft's kind ${d.kind}` });
    if (Number(d.manifest.dao_share_percent) !== dao) errors.push({ path: "manifest.dao_share_percent", message: "must equal dao_share_pct, because the chain records the share separately" });
  }
  if (d.artifact && d.artifact.kind !== d.kind) errors.push({ path: "artifact.kind", message: "artifact kind differs from the draft kind" });
  if (d.kind === "prompt" && d.seller_prompt_warning_accepted?.version !== PROMPT_WARNING_VERSION)
    errors.push({ path: "seller_prompt_warning_accepted", message: `accept the current prompt leak warning (version ${PROMPT_WARNING_VERSION}) before publishing a prompt` });
  return { errors, manifest_validation: v };
}

/** Save the exact manifest bytes under a free file name. Returns the file name. */
function saveManifest(methodId, n, raw) {
  const dir = methodDir(methodId);
  fs.mkdirSync(dir, { recursive: true });
  for (const name of [`manifest-v${n}.json`, `manifest-v${n}-${sha256Hex(raw).slice(0, 8)}.json`]) {
    const f = path.join(dir, name);
    if (!fs.existsSync(f)) { fs.writeFileSync(f, raw); return name; }
    if (fs.readFileSync(f, "utf8") === raw) return name;
  }
  throw new ApiError(409, "manifest_file_conflict", "A different manifest already uses this version's file name");
}

function saveSealed(methodId, artifact) {
  const dir = path.join(methodDir(methodId), "sealed");
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${artifact.code_hash}.json`);
  if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({ method_id: methodId, code_hash: artifact.code_hash, tee_pubkey: config.runner.teePubkey, sealed: artifact.sealed }));
}

export function registerSellerRoutes(route) {
  route("GET", /^\/api\/creators\/([^/]+)$/, async (_q, [account]) => {
    if (!/^[a-z0-9._-]{2,64}$/.test(account)) throw new ApiError(400, "bad_account_id", "Invalid account id");
    const list = await view(config.market, "list_methods", { from_index: 0, limit: 200 });
    const mine = list.filter((m) => m.owner === account);
    const methods = await Promise.all(mine.map(async (m) => {
      const v = m.version_count ? await view(config.market, "get_version", { method_id: m.method_id }) : null;
      return { method_id: m.method_id, title: m.title, version_count: m.version_count, latest_version: v?.number || null, price: v ? money(v.price) : null, created_at_ns: String(m.created_at_ns) };
    }));
    const prof = db.get("profiles", `near:${account}`);
    return {
      account_id: account, network: config.network,
      display_name: prof?.display_name || null, bio: prof?.bio || null,
      profile_source: prof ? "set by the account owner after NEAR sign-in" : "no profile set; methods are read from the market contract",
      methods,
      attribution: { contract: config.market, explorer: `${config.explorer}/accounts/${account}` },
    };
  });

  route("GET", /^\/api\/me\/methods$/, async (q, _m, _b, req) => {
    const p = requireAccount(req);
    const list = await view(config.market, "list_methods", { from_index: 0, limit: 200 });
    const owned = list.filter((m) => m.owner === p.account_id).map((m) => ({ method_id: m.method_id, title: m.title, version_count: m.version_count, state: "listed" }));
    let drafts = Object.values(db.all("method_drafts")).filter((d) => d.owner_account === p.account_id);
    if (q.get("state")) drafts = drafts.filter((d) => d.state === q.get("state"));
    const page = db.paginate(drafts, { cursor: q.get("cursor"), limit: q.get("limit") });
    return { account_id: p.account_id, listed: owned, drafts: page.items.map(publicDraft), next_cursor: page.next_cursor };
  });

  route("POST", /^\/api\/method-drafts$/, async (_q, _m, b, req) => {
    const p = requireAccount(req);
    const method_id = String(b?.method_id || "");
    if (!/^[A-Za-z0-9_-]{3,48}$/.test(method_id)) throw new ApiError(400, "bad_method_id", "method_id: 3-48 letters, digits, '-' or '_'");
    if (!KINDS.includes(b?.kind)) throw new ApiError(400, "bad_kind", 'kind must be "wasm" or "prompt"');
    const title = String(b?.title || "").trim();
    if (!title || title.length > 120) throw new ApiError(400, "bad_title", "title must be 1-120 characters");
    const existing = await chainMethod(method_id);
    if (existing && existing.owner !== p.account_id) throw new ApiError(403, "not_owner", `${method_id} belongs to ${existing.owner}`);
    const id = db.newId("mdraft");
    return publicDraft(db.put("method_drafts", id, {
      id, owner_account: p.account_id, method_id, kind: b.kind, title,
      description: String(b?.description || "").slice(0, 2000), category: String(b?.category || "").slice(0, 60), cover_ref: b?.cover_ref ? String(b.cover_ref).slice(0, 300) : null,
      new_method: !existing, revision: 1, created_at: db.nowIso(), updated_at: db.nowIso(),
      manifest: null, price_yocto: null, dao_share_pct: 10, parent: existing?.version_count || null,
      artifact: null, seller_prompt_warning_accepted: null, state: "draft", publication: null,
    }));
  });

  route("GET", /^\/api\/method-drafts\/([^/]+)$/, async (_q, [id], _b, req) => publicDraft(ownDraft(requireAccount(req), id)));

  route("PATCH", /^\/api\/method-drafts\/([^/]+)$/, async (_q, [id], b, req) => {
    const p = requireAccount(req);
    const d = ownDraft(p, id);
    if (d.state !== "draft") throw new ApiError(409, "draft_locked", `Draft is ${d.state}; start a new draft for the next version`);
    if (Number(b?.expected_revision) !== d.revision) throw new ApiError(409, "revision_conflict", `Draft is at revision ${d.revision}`, { revision: d.revision });
    const next = { ...d, revision: d.revision + 1, updated_at: db.nowIso() };
    if (b.manifest !== undefined) {
      if (!b.manifest || typeof b.manifest !== "object" || Array.isArray(b.manifest)) throw new ApiError(400, "bad_manifest", "manifest must be a JSON object");
      next.manifest = b.manifest;
    }
    if (b.price_yocto !== undefined) {
      if (!/^\d{1,40}$/.test(String(b.price_yocto))) throw new ApiError(400, "bad_price", "price_yocto must be an integer string in yoctoNEAR");
      next.price_yocto = String(b.price_yocto);
    }
    if (b.dao_share_pct !== undefined) next.dao_share_pct = Number(b.dao_share_pct);
    if (b.parent !== undefined) next.parent = b.parent === null ? null : Number(b.parent);
    for (const k of ["title", "description", "category", "cover_ref"]) if (b[k] !== undefined) next[k] = String(b[k]).slice(0, k === "description" ? 2000 : 300);
    if (b.seller_prompt_warning_accepted !== undefined) {
      if (b.seller_prompt_warning_accepted?.version !== PROMPT_WARNING_VERSION) throw new ApiError(400, "warning_version_mismatch", `The current warning version is ${PROMPT_WARNING_VERSION}`);
      next.seller_prompt_warning_accepted = { version: PROMPT_WARNING_VERSION, accepted_at: db.nowIso(), by: p.account_id };
    }
    return publicDraft(db.put("method_drafts", id, next));
  });

  route("POST", /^\/api\/method-drafts\/([^/]+)\/artifact$/, async (_q, [id], b, req) => {
    const p = requireAccount(req);
    const d = ownDraft(p, id);
    if (d.state !== "draft") throw new ApiError(409, "draft_locked", `Draft is ${d.state}`);
    const bad = FORBIDDEN_KEYS.filter((k) => b && k in b);
    if (bad.length) throw new ApiError(400, "plaintext_refused", `Send only the sealed artifact. Plaintext fields are refused: ${bad.join(", ")}`);
    const s = b?.sealed;
    if (!s || typeof s.epk !== "string" || typeof s.nonce !== "string" || typeof s.ct !== "string") throw new ApiError(400, "bad_sealed", "sealed must be {epk, nonce, ct} from kalis-crypto sealMethod(teePubkey, bytes)");
    if (!HASH.test(b?.code_hash || "")) throw new ApiError(400, "bad_code_hash", "code_hash must be the sha256 hex of the plaintext method");
    if (!KINDS.includes(b?.kind)) throw new ApiError(400, "bad_kind", 'kind must be "wasm" or "prompt"');
    if (s.ct.length > 3_000_000) throw new ApiError(413, "too_large", "Sealed artifact over about 2 MB");
    const artifact = { sealed: { epk: s.epk, nonce: s.nonce, ct: s.ct }, code_hash: b.code_hash, kind: b.kind, size: Number(b.size) || null, ciphertext_sha256: sha256Hex(s.ct), uploaded_at: db.nowIso() };
    const next = db.put("method_drafts", id, { ...d, artifact, revision: d.revision + 1, updated_at: db.nowIso() });
    return { artifact: publicDraft(next).artifact, ciphertext_sha256: artifact.ciphertext_sha256, revision: next.revision,
      note: "The server cannot see the plaintext, so it cannot check that code_hash matches it. The runner reports the real hash in the signed completion, and the escrow refuses to settle a run whose method hash differs from the published code_hash." };
  });

  route("POST", /^\/api\/method-drafts\/([^/]+)\/validate$/, async (_q, [id], _b, req) => {
    const d = ownDraft(requireAccount(req), id);
    const { errors, manifest_validation: v } = validateDraft(d);
    return {
      ok: errors.length === 0, revision: d.revision, errors, warnings: v?.warnings || [],
      manifest_hash: d.manifest ? sha256Hex(rawOf(d.manifest)) : null, kind: d.kind, method_kind: v?.method_kind || null,
      runnable_capabilities: v?.runnable_capabilities || null, seller_prompt_warning_version: PROMPT_WARNING_VERSION,
      buyer_note: v?.method_kind?.buyer_note || null,
    };
  });

  route("POST", /^\/api\/method-drafts\/([^/]+)\/publish$/, async (_q, [id], b, req) => {
    const p = requireAccount(req);
    const d = ownDraft(p, id);
    if (d.state === "published") return { already_published: true, publication: d.publication };
    if (d.state === "pending_signature") return { replayed: true, ...d.publication };
    if (Number(b?.expected_revision) !== d.revision) throw new ApiError(409, "revision_conflict", `Draft is at revision ${d.revision}`);
    const { errors } = validateDraft(d);
    if (errors.length) throw new ApiError(422, "draft_invalid", "The draft cannot be published yet", { errors });
    const onChain = await chainMethod(d.method_id);
    if (onChain && onChain.owner !== p.account_id) throw new ApiError(403, "not_owner", `${d.method_id} belongs to ${onChain.owner}`);
    const n = (onChain?.version_count || 0) + 1;
    const raw = rawOf(d.manifest);
    const manifest_hash = sha256Hex(raw);
    const file = saveManifest(d.method_id, n, raw);
    saveSealed(d.method_id, d.artifact);
    const calls = [];
    if (!onChain) calls.push({ receiver_id: config.market, method_name: "register_method", args: { method_id: d.method_id, title: d.title }, deposit_yocto: DEPOSIT_YOCTO, gas_tgas: 100 });
    calls.push({ receiver_id: config.market, method_name: "publish_version", args: {
      method_id: d.method_id, code_hash: d.artifact.code_hash, manifest_hash, runner_hash: config.runner.buildHash,
      price: d.price_yocto, dao_share_pct: d.dao_share_pct, parent: d.parent ?? null, contributors: [], note: `Published from Kalis draft ${d.id}`,
    }, deposit_yocto: DEPOSIT_YOCTO, gas_tgas: 100 });
    const publication = {
      publication_id: db.newId("pub"), status: "pending_signature", signer: p.account_id, expected_version: n,
      manifest_hash, manifest_file: file, code_hash: d.artifact.code_hash, runner_hash: config.runner.buildHash,
      idempotency_key: b?.idempotency_key || null, created_at: db.nowIso(), calls,
      next: "Sign the calls in order with the seller wallet, then POST /api/method-drafts/:id/confirm.",
    };
    db.put("method_drafts", id, { ...d, state: "pending_signature", publication, updated_at: db.nowIso() });
    return publication;
  });

  route("POST", /^\/api\/method-drafts\/([^/]+)\/confirm$/, async (_q, [id], b, req) => {
    const p = requireAccount(req);
    const d = ownDraft(p, id);
    if (d.state === "published") return { already_published: true, publication: d.publication };
    if (d.state !== "pending_signature") throw new ApiError(409, "not_pending", "Publish the draft first");
    const versions = await view(config.market, "list_versions", { method_id: d.method_id }).catch(() => []);
    const pub = d.publication;
    const v = (versions || []).find((x) => x.code_hash === pub.code_hash && x.manifest_hash === pub.manifest_hash && x.runner_hash === pub.runner_hash && x.published_by === p.account_id);
    if (!v) throw new ApiError(409, "not_on_chain_yet", "No version with this draft's hashes is on chain yet. Sign the calls, wait for the transaction, then confirm again.");
    const publication = { ...pub, status: "published", version: v.number, tx_hash: b?.tx_hash || null, confirmed_at: db.nowIso() };
    db.put("method_drafts", id, { ...d, state: "published", publication, updated_at: db.nowIso() });
    return { published: true, method_id: d.method_id, version: v.number, publication };
  });

  route("GET", /^\/api\/methods\/([^/]+)\/versions\/(\d+)\/evidence$/, async (_q, [id, n]) => {
    const f = path.join(methodDir(id), "evidence", `v${Number(n)}.json`);
    if (!fs.existsSync(f)) return { available: false, method_id: id, version: Number(n), reason: "The seller has not published test evidence for this version. Evidence is separate from ratings." };
    return { available: true, method_id: id, version: Number(n), ...JSON.parse(fs.readFileSync(f, "utf8")) };
  });

  // ---------- method cover image (seller-chosen picture shown on Marketplace cards) ----------
  // Stored off chain on this server, keyed by method_id. Only the on-chain owner, or the owner of a draft
  // for a method that is not on chain yet, may set it. PNG, JPEG and WebP only (no SVG: it can carry script).
  route("POST", /^\/api\/methods\/([^/]+)\/cover$/, async (_q, [id], b, req) => {
    const p = requireAccount(req);
    methodDir(id);
    const onChain = await chainMethod(id);
    const ownsDraft = Object.values(db.all("method_drafts")).some((d) => d.method_id === id && d.owner_account === p.account_id);
    if (onChain ? onChain.owner !== p.account_id : !ownsDraft) throw new ApiError(403, "not_owner", `Only the owner of ${id} can set its cover`);
    const ext = COVER_TYPES[b?.mime];
    if (!ext) throw new ApiError(400, "bad_mime", "mime must be image/png, image/jpeg or image/webp");
    const bytes = Buffer.from(String(b?.base64 || ""), "base64");
    if (!bytes.length) throw new ApiError(400, "bad_image", "base64 image data is missing");
    if (bytes.length > COVER_MAX) throw new ApiError(413, "too_large", "Cover image over 512 KB");
    if (!coverMagicOk(b.mime, bytes)) throw new ApiError(400, "bad_image", "The bytes are not a valid image of that type");
    writeCover(id, b.mime, bytes);
    return { method_id: id, cover_url: coverUrl(id), mime: b.mime, size: bytes.length, sha256: sha256Hex(bytes) };
  });
  route("GET", /^\/api\/methods\/([^/]+)\/cover$/, async (_q, [id]) => {
    const c = readCover(id);
    if (!c) throw new ApiError(404, "no_cover", `${id} has no cover image`);
    return { __file: c.file, __type: c.mime };
  });
}

// ---------- cover storage helpers ----------
const COVER_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const COVER_MAX = 512 * 1024;
const coverDir = () => { const d = path.join(DATA_DIR, "covers"); fs.mkdirSync(d, { recursive: true }); return d; };
function coverMagicOk(mime, b) {
  if (mime === "image/png") return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  return b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
}
function writeCover(id, mime, bytes) {
  const dir = coverDir();
  for (const e of Object.values(COVER_TYPES)) fs.rmSync(path.join(dir, `${id}.${e}`), { force: true });
  fs.writeFileSync(path.join(dir, `${id}.${COVER_TYPES[mime]}`), bytes);
}
export function readCover(id) {
  if (!/^[A-Za-z0-9_-]{3,48}$/.test(id || "")) return null;
  for (const [mime, e] of Object.entries(COVER_TYPES)) {
    const file = path.join(coverDir(), `${id}.${e}`);
    if (fs.existsSync(file)) return { file, mime, mtime: fs.statSync(file).mtimeMs };
  }
  return null;
}
export function coverUrl(id) { const c = readCover(id); return c ? `/api/methods/${id}/cover?v=${Math.floor(c.mtime)}` : null; }
