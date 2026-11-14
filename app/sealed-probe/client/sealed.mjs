// Buyer-side sealing for the OutLayer sealed probe. Node built-ins only.
// seal(teePubHex, caseObj) -> { request, secret }  (request is what crosses the coordinator)
// open(secret, response)   -> decrypted result
import crypto from "node:crypto";

const INFO_REQ = Buffer.from("sealed-probe/v1/request");
const INFO_RESP = Buffer.from("sealed-probe/v1/response");
const X25519_SPKI_PREFIX = Buffer.from("302a300506032b656e032100", "hex");

const rawPub = (keyObj) => keyObj.export({ type: "spki", format: "der" }).subarray(12);
const pubFromRaw = (raw) =>
  crypto.createPublicKey({ key: Buffer.concat([X25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });

function derive(shared, epk, tpk, info) {
  return Buffer.from(crypto.hkdfSync("sha256", shared, Buffer.concat([epk, tpk]), info, 32));
}

function aead(mode, key, nonce, data) {
  if (mode === "enc") {
    const c = crypto.createCipheriv("chacha20-poly1305", key, nonce, { authTagLength: 16 });
    return Buffer.concat([c.update(data), c.final(), c.getAuthTag()]);
  }
  const d = crypto.createDecipheriv("chacha20-poly1305", key, nonce, { authTagLength: 16 });
  d.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
}

export function seal(teePubHex, caseObj) {
  const tpk = Buffer.from(teePubHex, "hex");
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
  const epk = rawPub(publicKey);
  const shared = crypto.diffieHellman({ privateKey, publicKey: pubFromRaw(tpk) });
  const nonce = crypto.randomBytes(12);
  const ct = aead("enc", derive(shared, epk, tpk, INFO_REQ), nonce, Buffer.from(JSON.stringify(caseObj)));
  return {
    request: { cmd: "run", epk: epk.toString("base64"), nonce: nonce.toString("base64"), ct: ct.toString("base64") },
    secret: { shared, epk, tpk, ct },
  };
}

export function open(secret, response) {
  if (!response.ok) throw new Error(`probe error: ${response.error}`);
  if (response.tee_pubkey !== secret.tpk.toString("hex")) throw new Error("answer came from a different TEE key");
  const want = crypto.createHash("sha256").update(secret.ct).digest("hex");
  if (response.request_ct_sha256 !== want) throw new Error("answer is for a different request");
  const pt = aead("dec", derive(secret.shared, secret.epk, secret.tpk, INFO_RESP),
    Buffer.from(response.nonce, "base64"), Buffer.from(response.ct, "base64"));
  return JSON.parse(pt.toString());
}
