// Local cross-language proof. No network, real credentials, AI or testnet transactions.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import {
  preparePrivateRequest,
  openPrivateResponse,
  REQUEST_PREFIX,
} from "../src/privacy-crypto.js";
import { sealData, sealMethod, toHex, sha256Hex } from "../src/kalis-crypto.js";
const bin = path.resolve(
  process.argv[2] || "../kalis-runner/target/release/kalis-runner",
);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kalis-private-test-"));
const env = {
  ...process.env,
  PROTECTED_SEAL_KEY: crypto.randomBytes(32).toString("hex"),
  KALIS_PRIVATE_STATE_DIR: dir,
};
delete env.NEAR_AI_API_KEY;
delete env.NEAR_API_KEY;
const call = (input) =>
  JSON.parse(
    execFileSync(bin, [], {
      input: JSON.stringify(input),
      env,
      maxBuffer: 2_000_000,
    }).toString(),
  );
const pub = call({ cmd: "pubkey" });
const actor = () => {
  const key = crypto.randomBytes(32);
  return {
    key,
    owner: toHex(ed25519.getPublicKey(key)),
    revision: 0,
    sign: (bytes) => ed25519.sign(bytes, key),
  };
};
const alice = actor(),
  bob = actor();
let count = 0;
const ok = (name, fn) => {
  fn();
  count++;
  console.log("PASS", name);
};
const packet = (a, action, payload = {}, time) =>
  preparePrivateRequest(
    pub.tee_pubkey,
    a.owner,
    a.sign,
    action,
    payload,
    a.revision,
    time,
  );
async function run(a, action, payload = {}) {
  const p = await packet(a, action, payload);
  const raw = call({ cmd: "protect", request: p.sealed });
  const opened = openPrivateResponse(p, raw, pub.completion_pubkey);
  a.revision = opened.revision;
  return { value: opened.value, p, raw };
}
const manifest = JSON.stringify({
  method_id: "test-method",
  memory: { read: true },
  inputs: { documents: ["image", "pdf"] },
  connectors: [{ id: "broker_mock", operations: ["read_positions"] }],
  outbound: [{ host: "127.0.0.1:8787", path: "/mock/portal/submit" }],
  browser: {
    enabled: true,
    domains: ["127.0.0.1:8787"],
    actions: ["open", "download"],
  },
});
const policy = {
  method_id: "test-method",
  manifest,
  manifest_hash: sha256Hex(manifest),
};
const sentinel = "PRIVATE_SENTINEL_812000000";
try {
  const note = await run(alice, "memory.propose", {
    text: sentinel,
    source: { kind: "document", ref: "private-source" },
  });
  ok("note is sealed in transit and held for review", () => {
    assert.equal(note.value.status, "pending_review");
    assert.ok(!JSON.stringify(note.p.sealed).includes(sentinel));
    assert.ok(!JSON.stringify(note.raw).includes(sentinel));
  });
  const excluded = await run(alice, "memory.recall", policy);
  ok("pending content is excluded from memory recall", () =>
    assert.equal(excluded.value.notes.length, 0),
  );
  await run(alice, "memory.approve", { id: note.value.id });
  const included = await run(alice, "memory.recall", policy);
  ok("approved memory is available only through declared policy", () =>
    assert.equal(included.value.notes[0].text, sentinel),
  );
  const other = await run(bob, "memory.list");
  ok("different device key sees no other owner's data", () =>
    assert.equal(other.value.length, 0),
  );
  await assert.rejects(
    () => run(bob, "memory.approve", { id: note.value.id }),
    /not found/,
  );
  count++;
  console.log("PASS cross-owner record mutation refused");
  const replay = call({ cmd: "protect", request: note.p.sealed });
  const replayOpened = openPrivateResponse(
    note.p,
    replay,
    pub.completion_pubkey,
  );
  ok(
    "replay after intervening mutations returns its original receipt without duplication",
    () => assert.equal(replayOpened.value.id, note.value.id),
  );
  const notes = await run(alice, "memory.list");
  ok("one note exists after replay", () => assert.equal(notes.value.length, 1));
  const stale = await preparePrivateRequest(
    pub.tee_pubkey,
    alice.owner,
    alice.sign,
    "memory.propose",
    { text: "new", source: { kind: "user" } },
    0,
  );
  const staleOut = call({ cmd: "protect", request: stale.sealed });
  ok("stale mutation rejected rather than overwriting state", () =>
    assert.throws(
      () => openPrivateResponse(stale, staleOut, pub.completion_pubkey),
      /state changed/,
    ),
  );
  const fake = await preparePrivateRequest(
    pub.tee_pubkey,
    alice.owner,
    bob.sign,
    "memory.list",
    {},
    alice.revision,
  );
  ok("server cannot impersonate owner by changing the public key", () =>
    assert.equal(call({ cmd: "protect", request: fake.sealed }).ok, false),
  );
  const expired = await packet(
    alice,
    "memory.list",
    {},
    Math.floor(Date.now() / 1000) - 1000,
  );
  ok("expired signature refused", () =>
    assert.equal(call({ cmd: "protect", request: expired.sealed }).ok, false),
  );
  ok("tampered ciphertext rejected", () => {
    const bad = structuredClone(note.p.sealed);
    const ct = Buffer.from(bad.ct, "base64");
    ct[20] ^= 1;
    bad.ct = ct.toString("base64");
    assert.equal(call({ cmd: "protect", request: bad }).ok, false);
  });
  ok("forged response or signer rejected on device", () => {
    assert.throws(() =>
      openPrivateResponse(
        note.p,
        { ...note.raw, receipt_pubkey: bob.owner },
        pub.completion_pubkey,
      ),
    );
    assert.throws(() =>
      openPrivateResponse(
        note.p,
        { ...note.raw, ct: note.raw.ct.slice(0, -4) + "AAAA" },
        pub.completion_pubkey,
      ),
    );
  });
  const cred = await run(alice, "credentials.connect", {
    connector: "broker_mock",
    token: "kalis-private-demo",
    scopes: ["read"],
    ttl_minutes: 1,
  });
  ok("credential response never returns stored token", () =>
    assert.equal(cred.value.token, undefined),
  );
  const positions = await run(alice, "credentials.use", {
    ...policy,
    id: cred.value.id,
    operation: "read_positions",
    params: {},
  });
  ok("mock connector executes inside runner without backend fetch", () =>
    assert.equal(positions.value.data.positions.length, 3),
  );
  await assert.rejects(
    () =>
      run(alice, "credentials.use", {
        ...policy,
        id: cred.value.id,
        operation: "place_order",
        params: {},
      }),
    /not declared or permitted/,
  );
  count++;
  console.log("PASS trading operation refused");
  await run(alice, "credentials.revoke", { id: cred.value.id });
  await assert.rejects(
    () =>
      run(alice, "credentials.use", {
        ...policy,
        id: cred.value.id,
        operation: "read_positions",
        params: {},
      }),
    /expired or revoked/,
  );
  count++;
  console.log("PASS revocation enforced inside runner");
  await assert.rejects(
    () =>
      run(alice, "memory.recall", { ...policy, manifest_hash: "0".repeat(64) }),
    /manifest hash/,
  );
  count++;
  console.log("PASS policy hash tampering refused");
  const held = await run(alice, "outbound.propose", {
    ...policy,
    destination: "http://127.0.0.1:8787/mock/portal/submit",
    content: "The price is 812 juta",
    params: {},
    private_values: ["812000000"],
  });
  ok("private-value detection runs inside sealed request", () =>
    assert.equal(held.value.private_values_found.length, 1),
  );
  await assert.rejects(
    () =>
      run(alice, "outbound.approve", { id: held.value.id, action_hash: "bad" }),
    /bind exact/,
  );
  count++;
  console.log("PASS changed approval hash refused");
  const approved = await run(alice, "outbound.approve", {
    id: held.value.id,
    action_hash: held.value.action_hash,
  });
  const sent = await run(alice, "outbound.execute", {
    id: held.value.id,
    action_hash: held.value.action_hash,
  });
  ok(
    "explicit exact approval records only a labelled private mock submission",
    () => {
      assert.equal(approved.value.status, "approved");
      assert.equal(sent.value.receipt.mock, true);
    },
  );
  const replaySend = call({ cmd: "protect", request: sent.p.sealed });
  ok("replaying a send cannot create another submission", () =>
    assert.equal(
      openPrivateResponse(sent.p, replaySend, pub.completion_pubkey).value
        .receipt.id,
      sent.value.receipt.id,
    ),
  );
  await assert.rejects(
    () =>
      run(alice, "outbound.execute", {
        id: held.value.id,
        action_hash: held.value.action_hash,
      }),
    /approval missing/,
  );
  count++;
  console.log("PASS fresh duplicate send refused");
  const blocked = await run(alice, "outbound.propose", {
    ...policy,
    destination: "https://other.invalid/upload",
    content: "secret",
    params: {},
  });
  ok("undeclared destination blocked", () =>
    assert.equal(blocked.value.status, "blocked"),
  );
  const page = await run(alice, "browser.act", {
    ...policy,
    action: "open",
    url: "http://127.0.0.1:8787/mock/portal",
  });
  ok("browser accesses only built-in declared mock", () =>
    assert.equal(page.value.mock, true),
  );
  await assert.rejects(
    () =>
      run(alice, "browser.act", {
        ...policy,
        action: "login",
        url: "http://127.0.0.1:8787/mock/portal",
      }),
    /not permitted/,
  );
  count++;
  console.log("PASS browser login refused");
  await assert.rejects(
    () =>
      run(alice, "documents.ingest", {
        ...policy,
        mime: "application/pdf",
        filename: "secret.pdf",
        base64: "JVBERg==",
      }),
    /Private PDF/,
  );
  count++;
  console.log(
    "PASS unsupported private PDF refuses without plaintext fallback or AI call",
  );
  ok("all persisted native state is opaque ciphertext", () => {
    for (const file of fs.readdirSync(dir)) {
      const b = fs.readFileSync(path.join(dir, file));
      assert.ok(!b.includes(Buffer.from(sentinel)));
      assert.ok(!b.includes(Buffer.from("kalis-private-demo")));
      assert.ok(!b.includes(Buffer.from("812 juta")));
    }
  });
  console.log(
    count +
      " private-protocol checks passed. Native test only, no TEE execution.",
  );
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
