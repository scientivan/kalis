// NEP-413 sign-in with wallets that sign the optional callbackUrl (MyNearWallet) or return base58.
// Usage: node scripts/auth-callback-test.mjs [base url] [account]. Free, no transactions.
import fs from "node:fs";
import os from "node:os";
import { KeyPair, utils } from "near-api-js";
import { nep413Hash } from "../src/auth.js";
const BASE = process.argv[2] || "http://localhost:8787";
const ACCOUNT = process.argv[3] || "auth-test.scientivan.testnet";
const key = KeyPair.fromString(JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${ACCOUNT}.json`, "utf8")).private_key);
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
const post = async (p, b) => { const r = await fetch(BASE + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() }; };
async function attempt({ callbackUrl, sendCallback, base58 }) {
  const ch = (await post("/api/auth/challenge", { account_id: ACCOUNT })).body;
  const raw = key.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient, callbackUrl })).signature;
  const signature = base58 ? utils.serialize.base_encode(raw) : Buffer.from(raw).toString("base64");
  const r = await post("/api/auth/verify", { challenge_id: ch.challenge_id, account_id: ACCOUNT, public_key: key.getPublicKey().toString(), signature, ...(sendCallback ? { callback_url: callbackUrl } : {}) });
  if (r.body.session_token) await fetch(BASE + "/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${r.body.session_token}`, "Content-Type": "application/json" }, body: "{}" });
  return r;
}
const url = "http://localhost:3000/marketplace/mine";
check("plain payload, base64 (Meteor style) signs in", (await attempt({ callbackUrl: null })).status === 200);
check("payload with callbackUrl (MyNearWallet style) signs in", (await attempt({ callbackUrl: url, sendCallback: true })).status === 200);
check("base58 signature is accepted", (await attempt({ callbackUrl: null, base58: true })).status === 200);
check("callbackUrl signed but not sent is refused", (await attempt({ callbackUrl: url, sendCallback: false })).body.error?.code === "signature_invalid");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
