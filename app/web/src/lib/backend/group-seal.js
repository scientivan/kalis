// Group run answers: re-seal one opened answer to each member's device key.
// Runs on the ORGANIZER's device (browser or Node 20+). It is not done in the TEE: the organizer's device sees
// the plaintext answer, as it already does for any run it paid. Kalis only stores the ciphertext.
// Scheme: X25519 (fresh ephemeral key per member) + HKDF-SHA256 (salt epk||member_pk, info "kalis/v1/group-answer")
// + ChaCha20-Poly1305 with AAD "kalis/v1/group-answer|<group_id>|<run_id>|<member account>".
import { x25519 } from "@noble/curves/ed25519";
import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { randomBytes } from "@noble/hashes/utils";

const V = "kalis/v1/group-answer";
const enc = new TextEncoder();
const dec = new TextDecoder();
const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
function toB64(b) { let s = ""; for (const x of b) s += String.fromCharCode(x); return btoa(s); }
function fromB64(s) { const t = atob(s); const o = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) o[i] = t.charCodeAt(i); return o; }
const cat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const aad = (ctx) => enc.encode(`${V}|${ctx.group_id}|${ctx.run_id}|${ctx.account_id}`);

/** Member: a new device key pair. Keep `secret_hex` on this device only; register `public_hex`. */
export function newDeviceKey() {
  const sk = randomBytes(32);
  return { secret_hex: toHex(sk), public_hex: toHex(x25519.getPublicKey(sk)) };
}

/** Organizer: seal `answer` (any JSON) to one member's device public key. */
export function sealForMember(memberPubHex, answer, ctx) {
  const mpk = fromHex(memberPubHex);
  const esk = randomBytes(32);
  const epk = x25519.getPublicKey(esk);
  const key = hkdf(sha256, x25519.getSharedSecret(esk, mpk), cat(epk, mpk), enc.encode(V), 32);
  const nonce = randomBytes(12);
  const ct = chacha20poly1305(key, nonce, aad(ctx)).encrypt(enc.encode(JSON.stringify(answer)));
  return { v: V, to: memberPubHex, epk: toB64(epk), nonce: toB64(nonce), ct: toB64(ct) };
}

/** Member: open the sealed answer with this device's secret key. Throws if it was not sealed to this key. */
export function openAsMember(secretHex, sealed, ctx) {
  if (sealed?.v !== V) throw new Error("not a group answer");
  const sk = fromHex(secretHex);
  const mpk = x25519.getPublicKey(sk);
  if (toHex(mpk) !== sealed.to) throw new Error("this answer was sealed to a different device key");
  const epk = fromB64(sealed.epk);
  const key = hkdf(sha256, x25519.getSharedSecret(sk, epk), cat(epk, mpk), enc.encode(V), 32);
  return JSON.parse(dec.decode(chacha20poly1305(key, fromB64(sealed.nonce), aad(ctx)).decrypt(fromB64(sealed.ct))));
}
