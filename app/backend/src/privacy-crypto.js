// Sealed device-owned protection requests. This module is also used by native runner tests.
import { ed25519 } from "@noble/curves/ed25519";
import { randomBytes } from "@noble/hashes/utils";
import * as kc from "./kalis-crypto.js";
const enc = new TextEncoder();
export const REQUEST_PREFIX = "kalis-protection-request:v1:";
export const RECEIPT_PREFIX = "kalis-protection-receipt:v1:";
export async function preparePrivateRequest(
  teePubkey,
  owner,
  sign,
  action,
  payload,
  revision,
  now = Math.floor(Date.now() / 1000),
) {
  const request_id = kc.toHex(randomBytes(16));
  const request = JSON.stringify({
    owner,
    request_id,
    issued_at: now,
    expires_at: now + 180,
    revision,
    action,
    payload,
  });
  const signature = kc.toHex(await sign(enc.encode(REQUEST_PREFIX + request)));
  const box = kc.sealData(teePubkey, { request, signature });
  return { ...box, request_id, revision, action };
}
export function openPrivateResponse(packet, output, pinnedReceiptKey) {
  if (!pinnedReceiptKey || output.receipt_pubkey !== pinnedReceiptKey)
    throw new Error("Private runner signing key changed.");
  const rec = JSON.parse(output.receipt || "{}");
  if (
    rec.protocol !== "kalis-private/v1" ||
    rec.request_ct_sha256 !== packet.dataCtSha256 ||
    rec.response_ct_sha256 !== kc.sha256Hex(kc.fromB64(output.ct || ""))
  )
    throw new Error("Private receipt does not match this request and answer.");
  if (
    !ed25519.verify(
      kc.fromHex(output.receipt_sig),
      enc.encode(RECEIPT_PREFIX + output.receipt),
      kc.fromHex(pinnedReceiptKey),
    )
  )
    throw new Error("Private runner signature is invalid.");
  const body = kc.openAnswer(packet.secret, output);
  if (
    body.protocol !== "kalis-private/v1" ||
    body.request_id !== packet.request_id ||
    !Number.isSafeInteger(body.revision) ||
    body.revision < packet.revision
  )
    throw new Error("Private answer binding is invalid.");
  if (!body.result?.ok)
    throw new Error(body.result?.error || "The private operation was refused.");
  return { value: body.result.value, revision: body.revision };
}
