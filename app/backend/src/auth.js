// Sign in with a NEAR account (NEP-413 signed message), profile and preferences.
//
// Flow: POST /api/auth/challenge -> the wallet signs the NEP-413 payload { message, nonce, recipient }
// -> POST /api/auth/verify. The server checks the ed25519 signature over sha256(borsh(payload)) and
// that the public key is a FULL ACCESS key of the account on chain (RPC view_access_key). A challenge
// works once. The session id is the bearer token read by principal.js.
import crypto from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { utils } from "near-api-js";
import { config } from "./config.js";
import { rpc } from "./near.js";
import * as db from "./db.js";
import { principal, requireAccount } from "./principal.js";
import { ApiError } from "./market.js";
import { ATTESTABLE_MODELS } from "./manifest-validate.js";

export const RECIPIENT = "kalis.app";
const NEP413_TAG = 2147483648 + 413; // 2^31 + 413
const SESSION_MS = 12 * 60 * 60 * 1000;
const ACCOUNT = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

function borshString(s) {
  const b = Buffer.from(s, "utf8");
  const len = Buffer.alloc(4); len.writeUInt32LE(b.length);
  return Buffer.concat([len, b]);
}

/** sha256 of the borsh-serialised NEP-413 payload (callbackUrl = None). */
export function nep413Hash({ message, nonce, recipient, callbackUrl = null }) {
  const tag = Buffer.alloc(4); tag.writeUInt32LE(NEP413_TAG);
  const n = Buffer.from(nonce);
  if (n.length !== 32) throw new ApiError(400, "bad_nonce", "nonce must be 32 bytes");
  const cb = callbackUrl == null ? Buffer.from([0]) : Buffer.concat([Buffer.from([1]), borshString(String(callbackUrl))]);
  const payload = Buffer.concat([tag, borshString(message), n, borshString(recipient), cb]);
  return sha256(payload);
}

async function accessKey(accountId, publicKey) {
  try {
    const r = await rpc("query", { request_type: "view_access_key", finality: "final", account_id: accountId, public_key: publicKey });
    if (r.error) return null;
    return r;
  } catch {
    return null;
  }
}

function pubkeyBytes(pk) {
  if (!/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,50}$/.test(pk || "")) throw new ApiError(400, "bad_public_key", 'public_key must be "ed25519:<base58>"');
  return utils.PublicKey.fromString(pk).data;
}

function profileOf(p) {
  const prof = db.get("profiles", p.id);
  return prof ? { display_name: prof.display_name, bio: prof.bio, demo: prof.demo, updated_at: prof.updated_at } : { display_name: p.account_id || null, bio: null, demo: p.demo };
}

const DEFAULT_PREFS = { default_models: null, reduced_motion: false };

export function registerAuthRoutes(route) {
  route("POST", /^\/api\/auth\/challenge$/, async (_q, _m, b) => {
    const account = String(b?.account_id || "");
    if (account.length < 2 || account.length > 64 || !ACCOUNT.test(account)) throw new ApiError(400, "bad_account_id", "account_id is not a valid NEAR account id");
    const ttl = Math.min(Math.max(Number(b?.ttl_seconds) || 300, 5), 300);
    const id = db.newId("chal");
    const expires = new Date(Date.now() + ttl * 1000).toISOString();
    const nonce = crypto.randomBytes(32);
    const message = `Sign in to Kalis (${config.network}) as ${account}. Challenge ${id}. Expires ${expires}.`;
    db.put("auth_challenges", id, { id, account_id: account, message, nonce: nonce.toString("base64"), recipient: RECIPIENT, created_at: db.nowIso(), expires_at: expires, used: false });
    return { challenge_id: id, account_id: account, message, nonce: nonce.toString("base64"), recipient: RECIPIENT, callback_url: null, expires_at: expires, standard: "NEP-413" };
  });

  route("POST", /^\/api\/auth\/verify$/, async (_q, _m, b) => {
    const c = db.get("auth_challenges", String(b?.challenge_id || ""));
    if (!c) throw new ApiError(404, "unknown_challenge", "No such challenge");
    if (c.account_id !== b?.account_id) throw new ApiError(400, "account_mismatch", "The challenge was issued for another account");
    if (c.used) throw new ApiError(409, "challenge_used", "This challenge was already used. Request a new one.");
    if (Date.parse(c.expires_at) < Date.now()) throw new ApiError(410, "challenge_expired", "This challenge expired. Request a new one.");
    // One attempt per challenge, whatever the outcome, so a signature cannot be brute-forced against it.
    db.put("auth_challenges", c.id, { ...c, used: true, used_at: db.nowIso() });
    const pk = pubkeyBytes(b?.public_key);
    // Wallets differ: the signature may be base64 or base58, and some wallets (MyNearWallet) sign the
    // optional callbackUrl field of the NEP-413 payload. Accept either encoding and both payload forms.
    const raw = String(b?.signature || "").replace(/^ed25519:/, "");
    let sig = Buffer.alloc(0);
    try { sig = Buffer.from(raw, "base64"); } catch { /* not base64 */ }
    if (sig.length !== 64) { try { sig = Buffer.from(utils.serialize.base_decode(raw)); } catch { sig = Buffer.alloc(0); } }
    if (sig.length !== 64) throw new ApiError(400, "bad_signature", "signature must be 64 bytes, base64 or base58");
    const nonce = Buffer.from(c.nonce, "base64");
    const callbacks = [null, ...(typeof b?.callback_url === "string" && b.callback_url.length <= 2000 ? [b.callback_url] : [])];
    let ok = false;
    for (const callbackUrl of callbacks) {
      try { ok = ed25519.verify(sig, nep413Hash({ message: c.message, nonce, recipient: c.recipient, callbackUrl }), pk); } catch { ok = false; }
      if (ok) break;
    }
    if (!ok) throw new ApiError(401, "signature_invalid", "The signature does not match the challenge and public key");
    const key = await accessKey(c.account_id, b.public_key);
    if (!key) throw new ApiError(401, "key_not_on_account", "This public key is not an access key of the account on chain");
    if (key.permission !== "FullAccess") throw new ApiError(401, "not_full_access", "Sign in needs a full access key. A function-call key cannot prove ownership of the account.");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + SESSION_MS).toISOString();
    db.put("sessions", token, { id: token, account_id: c.account_id, public_key: b.public_key, created_at: db.nowIso(), expires_at: expires, revoked: false, challenge_id: c.id });
    return { session_token: token, account_id: c.account_id, expires_at: expires, token_type: "Bearer" };
  });

  route("POST", /^\/api\/auth\/logout$/, async (_q, _m, _b, req) => {
    const p = requireAccount(req);
    db.update("sessions", p.session_id, (s) => ({ ...s, revoked: true, revoked_at: db.nowIso() }));
    return { logged_out: true };
  });

  route("GET", /^\/api\/me$/, async (_q, _m, _b, req) => {
    const p = principal(req);
    const s = p.session_id ? db.get("sessions", p.session_id) : null;
    return {
      id: p.id, kind: p.kind, account_id: p.account_id, demo: p.demo,
      ...profileOf(p),
      linked_accounts: p.account_id ? [{ type: "near", account_id: p.account_id, network: config.network, verified: true }] : [],
      permissions: p.kind === "near_account" ? ["publish_methods", "review_own_runs", "manage_own_drafts"] : ["demo_runs", "demo_protections"],
      session_expires_at: s?.expires_at || null,
      note: p.demo ? "Demo workspace. Anyone can pick this label; it is not proof of ownership. Sign in with a NEAR account for publishing and other owner actions." : null,
    };
  });

  route("PATCH", /^\/api\/me$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const cur = db.get("profiles", p.id) || {};
    const next = { ...cur, id: p.id, account_id: p.account_id, demo: p.demo, updated_at: db.nowIso() };
    if (b?.display_name !== undefined) {
      const d = String(b.display_name).trim();
      if (d.length < 1 || d.length > 60) throw new ApiError(400, "bad_display_name", "display_name must be 1-60 characters");
      next.display_name = p.demo && !d.endsWith("(demo)") ? `${d} (demo)` : d;
    }
    if (b?.bio !== undefined) {
      const bio = String(b.bio).trim();
      if (bio.length > 500) throw new ApiError(400, "bad_bio", "bio must be at most 500 characters");
      next.bio = bio;
    }
    db.put("profiles", p.id, next);
    return { id: p.id, ...profileOf(p) };
  });

  route("GET", /^\/api\/me\/preferences$/, async (_q, _m, _b, req) => {
    const p = principal(req);
    return { ...DEFAULT_PREFS, ...(db.get("preferences", p.id) || {}), note: "Preferences can only narrow the models a method's manifest allows. They are not consent for any run." };
  });

  route("PATCH", /^\/api\/me\/preferences$/, async (_q, _m, b, req) => {
    const p = principal(req);
    const cur = { ...DEFAULT_PREFS, ...(db.get("preferences", p.id) || {}) };
    if (b?.expected_revision !== undefined && Number(b.expected_revision) !== (cur.revision || 0)) throw new ApiError(409, "revision_conflict", `Preferences are at revision ${cur.revision || 0}`);
    if (b?.default_models !== undefined) {
      if (b.default_models !== null && (!Array.isArray(b.default_models) || b.default_models.some((m) => !ATTESTABLE_MODELS.includes(m))))
        throw new ApiError(400, "model_not_attestable", `default_models must be null or a list from ${ATTESTABLE_MODELS.join(", ")}`);
      cur.default_models = b.default_models;
    }
    if (b?.reduced_motion !== undefined) cur.reduced_motion = Boolean(b.reduced_motion);
    cur.revision = (cur.revision || 0) + 1;
    cur.updated_at = db.nowIso();
    db.put("preferences", p.id, cur);
    return { ...cur, note: "Preferences can only narrow the models a method's manifest allows. They are not consent for any run." };
  });
}
