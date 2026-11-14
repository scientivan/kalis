// Isolated HTTP relay test. Native development mode only, no network calls or funded transactions.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import {
  preparePrivateRequest,
  openPrivateResponse,
} from "../src/privacy-crypto.js";
import { toHex } from "../src/kalis-crypto.js";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kalis-private-http-"));
process.env.KALIS_DATA_DIR = path.join(dir, "backend");
process.env.KALIS_PRIVATE_STATE_DIR = path.join(dir, "enclave");
process.env.KALIS_PRIVATE_LOCAL_RUNNER = path.resolve(
  "../kalis-runner/target/release/kalis-runner",
);
process.env.KALIS_PRIVATE_DEV_SEAL_KEY = crypto.randomBytes(32).toString("hex");
delete process.env.NEAR_AI_API_KEY;
const { server } = await import("../src/server.js");
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
let checks = 0;
async function req(p, body) {
  const r = await fetch(base + p, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
try {
  const c = await req("/api/privacy/config");
  assert.equal(c.body.mode, "local_native");
  assert.equal(c.body.enabled, true);
  checks++;
  const wrong = await req("/api/privacy/execute", { text: "SYNTHETIC_SECRET" });
  assert.equal(wrong.status, 400);
  checks++;
  const publicRefused = await req("/api/public-documents", {
    public_document: false,
    text: "not public",
  });
  assert.equal(publicRefused.status, 400);
  checks++;
  for (const p of [
    "/api/protections/private-values",
    "/api/protections/memory",
    "/api/protections/credentials",
    "/api/protections/outbound",
    "/api/protections/documents",
    "/api/protections/browser",
  ]) {
    const r = await req(p, {
      text: "SYNTHETIC_SECRET",
      values: ["SYNTHETIC_SECRET"],
    });
    assert.equal(r.status, 410);
    checks++;
  }
  const seed = crypto.randomBytes(32),
    owner = toHex(ed25519.getPublicKey(seed));
  const packet = await preparePrivateRequest(
    c.body.tee_pubkey,
    owner,
    (b) => ed25519.sign(b, seed),
    "memory.propose",
    { text: "SYNTHETIC_SECRET", source: { kind: "user" } },
    0,
  );
  const r = await req("/api/privacy/execute", { request: packet.sealed });
  assert.equal(r.status, 200);
  assert.equal(r.body.mode, "local_native");
  const opened = openPrivateResponse(
    packet,
    r.body.output,
    c.body.receipt_pubkey,
  );
  assert.equal(opened.value.text, "SYNTHETIC_SECRET");
  checks++;
  assert.ok(!JSON.stringify(r.body).includes("SYNTHETIC_SECRET"));
  assert.ok(!JSON.stringify(packet.sealed).includes("SYNTHETIC_SECRET"));
  checks++;
  for (const dirent of fs.readdirSync(path.join(dir, "enclave"))) {
    assert.ok(
      !fs
        .readFileSync(path.join(dir, "enclave", dirent))
        .includes(Buffer.from("SYNTHETIC_SECRET")),
    );
  }
  checks++;
  assert.ok(!fs.existsSync(path.join(dir, "backend", "protections")));
  checks++;
  console.log(
    checks +
      " HTTP relay checks passed. Native development only, no TEE claim.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  server.closeAllConnections();
  fs.rmSync(dir, { recursive: true, force: true });
}
