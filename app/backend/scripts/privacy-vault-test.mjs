// Device vault mode against the native runner. No network, AI, signing or spending.
// The browser holds the owner's rows; the runner applies rules in memory and stores nothing.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ed25519 } from "@noble/curves/ed25519";
import { preparePrivateRequest, openPrivateResponse } from "../src/privacy-crypto.js";
import { toHex, sha256Hex } from "../src/kalis-crypto.js";
const bin = path.resolve(process.argv[2] || "../kalis-runner/target/release/kalis-runner");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kalis-vault-test-"));
const env = { ...process.env, PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex"), KALIS_PRIVATE_STATE_DIR: dir };
delete env.NEAR_AI_API_KEY; delete env.NEAR_API_KEY;
const call = (input) => JSON.parse(execFileSync(bin, [], { input: JSON.stringify(input), env, maxBuffer: 2_000_000 }).toString());
const pub = call({ cmd: "pubkey" });
const key = crypto.randomBytes(32), owner = toHex(ed25519.getPublicKey(key)), sign = (b) => ed25519.sign(b, key);
const manifest = JSON.stringify({ method_id: "test-method", memory: { read: true }, connectors: [{ id: "broker_mock", operations: ["read_positions"] }], outbound: [{ host: "127.0.0.1:8787", path: "/mock/portal/submit" }] });
const policy = { method_id: "test-method", manifest, manifest_hash: sha256Hex(manifest) };
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("PASS", name); };
async function vault(action, payload, rows, time) {
  const p = await preparePrivateRequest(pub.tee_pubkey, owner, sign, action, payload, 0, time, { rows });
  const raw = call({ cmd: "protect", request: p.sealed });
  return { p, raw, open: () => openPrivateResponse(p, raw, pub.completion_pubkey) };
}
const now = Math.floor(Date.now() / 1000);
const TOKEN = "kalis-private-demo";
const rows = { credentials: [{ id: "c1", connector: "broker_mock", token: TOKEN, scopes: ["read"], expires_unix: now + 3600, created_at: now, revoked: false }], memory: [{ id: "m1", text: "Risk limit 12 percent", status: "approved", source: { kind: "user" } }], outbound: [] };
try {
  const use = (await vault("credentials.use", { ...policy, id: "c1", operation: "read_positions", params: {} }, rows)).open();
  ok("credential from the device vault reads the declared mock inside the runner", () => {
    assert.equal(use.value.data.positions.length, 3);
    assert.equal(use.value.credential.token, undefined);
  });
  const revoked = { ...rows, credentials: [{ ...rows.credentials[0], revoked: true }] };
  await assert.rejects(async () => (await vault("credentials.use", { ...policy, id: "c1", operation: "read_positions", params: {} }, revoked)).open(), /expired or revoked/);
  ok("revoked credential is refused", () => {});
  await assert.rejects(async () => (await vault("credentials.use", { ...policy, id: "c1", operation: "place_order", params: {} }, rows)).open(), /not declared/);
  ok("undeclared operation is refused", () => {});
  const recall = (await vault("memory.recall", policy, rows)).open();
  ok("approved notes are recalled as data", () => assert.equal(recall.value.notes[0].text, "Risk limit 12 percent"));
  const propRes = await vault("outbound.propose", { ...policy, destination: "http://127.0.0.1:8787/mock/portal/submit", content: "Bid 412000", params: {}, private_values: ["412000"] }, rows); const prop = propRes.open();
  ok("outbound proposal returns the new row in updated device state", () => {
    assert.equal(prop.state.rows.outbound.length, 1);
    assert.equal(prop.value.private_values_found.length, 1);
  });
  await assert.rejects(async () => (await vault("memory.list", {}, rows)).open(), /runs on the device/);
  ok("owner-only reads are refused in the runner", () => {});
  const late = await vault("memory.recall", policy, rows, now - 600);
  ok("a request queued for 10 minutes is still accepted", () => assert.ok(late.open().value.notes));
  const old = await vault("memory.recall", policy, rows, now - 1000);
  assert.match(JSON.stringify(old.raw), /expired/);
  ok("a request older than 15 minutes is refused", () => {});
  const sealedRequest = JSON.stringify(propRes.p.sealed), sealedAnswer = JSON.stringify(propRes.raw);
  ok("tokens and note text never appear outside the sealed boxes", () => {
    for (const s of [TOKEN, "Risk limit 12 percent", "412000"]) { assert.ok(!sealedRequest.includes(s)); assert.ok(!sealedAnswer.includes(s)); }
  });
  ok("runner stored nothing in vault mode", () => assert.equal(fs.readdirSync(dir).length, 0));
  console.log(n + " device vault checks passed. Native test only, no TEE execution.");
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
