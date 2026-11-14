// Method cover image: owner-only upload, type and size checks, public serving, cover_url in the method list.
// Usage: node scripts/cover-test.mjs [base url] [account]. Free: uses an off-chain draft only, no transactions.
import fs from "node:fs";
import os from "node:os";
import { KeyPair } from "near-api-js";
import { nep413Hash } from "../src/auth.js";

const BASE = process.argv[2] || "http://localhost:8787";
const ACCOUNT = process.argv[3] || "auth-test.scientivan.testnet";
const METHOD = `cover-test-${Date.now().toString(36)}`;
const cred = JSON.parse(fs.readFileSync(`${os.homedir()}/.near-credentials/testnet/${ACCOUNT}.json`, "utf8"));
const key = KeyPair.fromString(cred.private_key);
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? `  (${d})` : ""}`); };
async function api(method, p, body, headers = {}) {
  const r = await fetch(BASE + p, { method, headers: { "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const code = (r) => r.body?.error?.code;
const ch = (await api("POST", "/api/auth/challenge", { account_id: ACCOUNT })).body;
const sig = Buffer.from(key.sign(nep413Hash({ message: ch.message, nonce: Buffer.from(ch.nonce, "base64"), recipient: ch.recipient })).signature).toString("base64");
const login = (await api("POST", "/api/auth/verify", { challenge_id: ch.challenge_id, account_id: ACCOUNT, public_key: key.getPublicKey().toString(), signature: sig })).body;
const A = { Authorization: `Bearer ${login.session_token}` };
// 1x1 PNG
const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

check("anonymous upload is refused", code(await api("POST", `/api/methods/tender-bid/cover`, { mime: "image/png", base64: png })) === "login_required");
check("a non-owner cannot set another method's cover", code(await api("POST", `/api/methods/tender-bid/cover`, { mime: "image/png", base64: png }, A)) === "not_owner");
check("no draft and not on chain is refused", code(await api("POST", `/api/methods/${METHOD}/cover`, { mime: "image/png", base64: png }, A)) === "not_owner");
const d = await api("POST", "/api/method-drafts", { method_id: METHOD, kind: "prompt", title: "Cover test (ignore)" }, A);
check("draft created", d.status === 200, d.body?.error?.message);
check("SVG is refused", code(await api("POST", `/api/methods/${METHOD}/cover`, { mime: "image/svg+xml", base64: Buffer.from("<svg/>").toString("base64") }, A)) === "bad_mime");
check("bytes that are not a PNG are refused", code(await api("POST", `/api/methods/${METHOD}/cover`, { mime: "image/png", base64: Buffer.from("hello").toString("base64") }, A)) === "bad_image");
const up = await api("POST", `/api/methods/${METHOD}/cover`, { mime: "image/png", base64: png }, A);
check("draft owner uploads a PNG cover", up.status === 200 && /^\/api\/methods\/.+\/cover\?v=\d+$/.test(up.body.cover_url || ""), JSON.stringify(up.body));
const g = await fetch(BASE + up.body.cover_url);
check("cover is served publicly as image/png with nosniff", g.status === 200 && g.headers.get("content-type") === "image/png" && g.headers.get("x-content-type-options") === "nosniff");
check("a method without a cover returns 404", (await fetch(BASE + "/api/methods/no-such-cover-x/cover")).status === 404);
const list = await api("GET", "/api/methods");
check("method list carries a cover_url field", Array.isArray(list.body) && list.body.every((m) => "cover_url" in m));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
