// NEP-413 sign-in tests against a real testnet account.
// Usage: node scripts/auth-test.mjs [base url] [account]
// Reads the account's full access key from ~/.near-credentials/testnet/<account>.json (never printed).
// Adds one function-call key to the account (testnet transaction) for the negative test.
import fs from "node:fs";
import os from "node:os";
import { KeyPair, connect, keyStores } from "near-api-js";
import { nep413Hash, RECIPIENT } from "../src/auth.js";

const BASE = process.argv[2] || "http://localhost:8787";
const ACCOUNT = process.argv[3] || "auth-test.scientivan.testnet";
const cred = JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${ACCOUNT}.json`, "utf8"));
const full = KeyPair.fromString(cred.private_key);
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
async function api(method, p, body, headers = {}) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;
const sign = (kp, ch) => Buffer.from(kp.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient })).signature).toString("base64");
const challenge = async (ttl) => (await api("POST", "/api/auth/challenge", { account_id: ACCOUNT, ttl_seconds: ttl })).body;
const verify = (ch, kp, sig) => api("POST", "/api/auth/verify", { challenge_id: ch.challenge_id, account_id: ACCOUNT, public_key: kp.getPublicKey().toString(), signature: sig ?? sign(kp, ch) });

// happy path
const ch = await challenge();
check("challenge is NEP-413 shaped", ch.recipient === RECIPIENT && Buffer.from(ch.nonce, "base64").length === 32 && ch.message.includes(ACCOUNT));
const ok = await verify(ch, full);
check("full access key signs in", ok.status === 200 && /^[0-9a-f]{64}$/.test(ok.body.session_token || ""), ok.body.error?.message);
const auth = { Authorization: `Bearer ${ok.body.session_token}` };
const me = await api("GET", "/api/me", null, auth);
check("GET /api/me returns the verified account", me.body.kind === "near_account" && me.body.account_id === ACCOUNT && me.body.demo === false);
const reuse = await verify(ch, full);
check("a used challenge is refused", code(reuse) === "challenge_used");

// negative signatures
const ch2 = await challenge();
const other = KeyPair.fromRandom("ed25519");
check("a wrong signature is refused", code(await verify(ch2, full, sign(other, ch2))) === "signature_invalid");
const ch2b = await challenge();
check("a challenge is single-try even after a failed attempt", code(await verify(ch2b, full, sign(other, ch2b))) === "signature_invalid" && code(await verify(ch2b, full)) === "challenge_used");
const ch3 = await challenge();
check("a key that is not on the account is refused", code(await verify(ch3, other)) === "key_not_on_account");
const ch4 = await challenge(5);
await new Promise((r) => setTimeout(r, 6000));
check("an expired challenge is refused", code(await verify(ch4, full)) === "challenge_expired");

// function-call key
const ks = new keyStores.InMemoryKeyStore();
await ks.setKey("testnet", ACCOUNT, full);
const acct = await (await connect({ networkId: "testnet", nodeUrl: "https://rpc.testnet.fastnear.com", keyStore: ks })).account(ACCOUNT);
const fck = KeyPair.fromRandom("ed25519");
await acct.addKey(fck.getPublicKey(), "market.scientivan.testnet", [], 10n ** 22n);
await new Promise((r) => setTimeout(r, 3000));
const ch5 = await challenge();
check("a function-call key cannot sign in", code(await verify(ch5, fck)) === "not_full_access");
await acct.deleteKey(fck.getPublicKey()).catch(() => {});

// profile and preferences
const prof = await api("PATCH", "/api/me", { display_name: "Auth Test Seller", bio: "Testnet account for automated tests." }, auth);
check("profile is stored for the account", prof.body.display_name === "Auth Test Seller");
const demoProf = await api("PATCH", "/api/me", { display_name: "Someone" }, { "X-Kalis-Workspace": `auth-${Date.now().toString(36)}` });
check("a demo profile is labelled demo", demoProf.body.display_name === "Someone (demo)" && demoProf.body.demo === true);
const prefBad = await api("PATCH", "/api/me/preferences", { default_models: ["openai/gpt-5"] }, auth);
check("preferences cannot name a model the runner cannot attest", code(prefBad) === "model_not_attestable");
const pref = await api("PATCH", "/api/me/preferences", { default_models: ["deepseek-ai/DeepSeek-V4.1-Flash-1017"], reduced_motion: true }, auth);
check("preferences are stored", pref.body.reduced_motion === true && pref.body.default_models.length === 1);
const prefStale = await api("PATCH", "/api/me/preferences", { expected_revision: 0, reduced_motion: false }, auth);
check("stale preference revision is refused", code(prefStale) === "revision_conflict");

// logout
await api("POST", "/api/auth/logout", null, auth);
check("a revoked session stops working", code(await api("GET", "/api/me", null, auth)) === "session_invalid");
check("a forged bearer token is refused", code(await api("GET", "/api/me", null, { Authorization: `Bearer ${"0".repeat(64)}` })) === "session_invalid");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
