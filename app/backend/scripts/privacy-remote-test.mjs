// Private protections against the deployed OutLayer TEE runner (scientivan.testnet/kalis-private).
// Uses synthetic data only. Each call spends a small amount of OutLayer testnet compute.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import { preparePrivateRequest, openPrivateResponse } from "../src/privacy-crypto.js";
import { toHex } from "../src/kalis-crypto.js";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kalis-private-remote-"));
process.env.KALIS_DATA_DIR = dir;
delete process.env.KALIS_PRIVATE_LOCAL_RUNNER;
const { server } = await import("../src/server.js");
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
const req = async (p, body) => {
  const r = await fetch(base + p, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json() };
};
const SENTINEL = "TEE_SENTINEL_" + crypto.randomBytes(4).toString("hex");
const user = () => { const seed = crypto.randomBytes(32); return { seed, owner: toHex(ed25519.getPublicKey(seed)) }; };
let checks = 0;
const call = async (c, u, action, payload, rev) => {
  const packet = await preparePrivateRequest(c.tee_pubkey, u.owner, (b) => ed25519.sign(b, u.seed), action, payload, rev);
  assert.ok(!JSON.stringify(packet.sealed).includes(SENTINEL));
  const r = await req("/api/privacy/execute", { request: packet.sealed });
  if (r.status !== 200) return { status: r.status, body: r.body };
  assert.ok(!JSON.stringify(r.body).includes(SENTINEL));
  return { status: 200, call_id: r.body.call_id, mode: r.body.mode, opened: openPrivateResponse(packet, r.body.output, c.receipt_pubkey) };
};
try {
  const c = (await req("/api/privacy/config")).body;
  assert.equal(c.mode, "tee"); assert.equal(c.enabled, true); checks++;
  const a = user(), b = user();
  const p = await call(c, a, "memory.propose", { text: SENTINEL, source: { kind: "user" } }, 0);
  assert.equal(p.status, 200, JSON.stringify(p.body)); assert.equal(p.mode, "tee");
  assert.equal(p.opened.value.text, SENTINEL); checks++;
  console.log("propose ok, call", p.call_id, "revision", p.opened.revision);
  const l = await call(c, a, "memory.list", {}, p.opened.revision);
  assert.equal(l.status, 200, JSON.stringify(l.body));
  assert.ok(JSON.stringify(l.opened.value).includes(SENTINEL), "owner must read own note in a later TEE call"); checks++;
  console.log("list ok, call", l.call_id);
  const o = await call(c, b, "memory.list", {}, 0);
  assert.equal(o.status, 200, JSON.stringify(o.body));
  assert.ok(!JSON.stringify(o.opened.value).includes(SENTINEL), "another owner must not see the note"); checks++;
  console.log("other owner isolated, call", o.call_id);
  // The runner refuses inside the TEE and returns the refusal sealed to the owner.
  const stale = await call(c, a, "memory.propose", { text: "stale", source: { kind: "user" } }, 0).then(() => null, (e) => e.message);
  assert.match(stale || "", /private state changed/, "stale revision must be refused"); checks++;
  console.log("stale revision refused inside TEE:", stale);
  const leaked = fs.readdirSync(dir, { recursive: true }).filter((f) => fs.statSync(path.join(dir, f)).isFile() && fs.readFileSync(path.join(dir, f)).includes(SENTINEL));
  assert.deepEqual(leaked, []); checks++;
  console.log(checks + " TEE checks passed against scientivan.testnet/kalis-private.");
} finally {
  server.close(); server.closeAllConnections?.();
  fs.rmSync(dir, { recursive: true, force: true });
}
