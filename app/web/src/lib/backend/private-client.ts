import { PRIVATE_RUNNER_HASH, PRIVATE_TEE_KEY, PRIVATE_RECEIPT_KEY } from "./private-release";
import { preparePrivateRequest, openPrivateResponse } from "./privacy-crypto";
import { sha256Hex, toHex } from "./crypto";
type Obj = Record<string, any>;
const TEE_KEY = process.env.NEXT_PUBLIC_KALIS_PRIVATE_TEE_KEY || PRIVATE_TEE_KEY;
const RECEIPT_KEY = process.env.NEXT_PUBLIC_KALIS_PRIVATE_RECEIPT_KEY || PRIVATE_RECEIPT_KEY;
const database = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("kalis-private-device-v1", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("device");
    r.onerror = () =>
      reject(new Error("Private storage is unavailable in this browser."));
    r.onsuccess = () => resolve(r.result);
  });
async function local<T>(key: string, value?: T): Promise<T | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        "device",
        value === undefined ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("device");
      const r = value === undefined ? store.get(key) : store.put(value, key);
      let found: T | undefined;
      r.onsuccess = () => {
        found = value === undefined ? r.result : value;
      };
      tx.oncomplete = () => resolve(found);
      tx.onerror = () => reject(new Error("Private device storage failed."));
      tx.onabort = () =>
        reject(new Error("Private device storage was interrupted."));
    });
  } finally {
    db.close();
  }
}
const slot = () => {
  try {
    return (
      (JSON.parse(sessionStorage.getItem("kalis-session") || "null")
        ?.account_id || "anonymous") + "@device"
    );
  } catch {
    return "anonymous@device";
  }
};
const keys = new Map<string, Promise<{ owner: string; keys: CryptoKeyPair }>>();
async function identity(name: string) {
  if (!keys.has(name))
    keys.set(
      name,
      (async () => {
        let pair = await local<CryptoKeyPair>(name);
        if (!pair) {
          const candidate = (await crypto.subtle.generateKey(
            { name: "Ed25519" },
            false,
            ["sign", "verify"],
          )) as CryptoKeyPair;
          const db = await database();
          try {
            pair = await new Promise<CryptoKeyPair>((resolve, reject) => {
              const tx = db.transaction("device", "readwrite"),
                store = tx.objectStore("device");
              const r = store.get(name);
              let selected: CryptoKeyPair;
              r.onsuccess = () => {
                selected = r.result || candidate;
                if (!r.result) store.put(candidate, name);
              };
              tx.oncomplete = () => resolve(selected);
              tx.onerror = () =>
                reject(new Error("Device identity could not be saved."));
            });
          } finally {
            db.close();
          }
        }
        return {
          keys: pair,
          owner: toHex(
            new Uint8Array(
              await crypto.subtle.exportKey("raw", pair.publicKey),
            ),
          ),
        };
      })(),
    );
  return keys.get(name)!;
}
export async function rememberPrivateValues(label: string, values: string[]) {
  const name = slot() + ":private-values";
  const old = await local<{ expires: number; values: string[] }>(name);
  const all = [
    ...(old && old.expires > Date.now() ? old.values : []),
    ...values,
  ];
  await local(name, {
    expires: Date.now() + 24 * 3600000,
    values: [...new Set(all)].slice(-100),
  });
  return { label, count: values.length };
}
function sessionHeaders(): Record<string, string> {
  try {
    const s = JSON.parse(sessionStorage.getItem("kalis-session") || "null");
    return s && Date.parse(s.expires_at) > Date.now()
      ? { Authorization: "Bearer " + s.token }
      : {};
  } catch {
    return {};
  }
}
async function raw(path: string, body?: unknown) {
  const response = await fetch("/api/backend/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data)
    throw new Error(
      data?.error?.message ||
        "The private relay did not answer. Check its status before retrying.",
    );
  return data;
}
async function policy(payload: Obj) {
  if (!payload.method_id) return payload;
  let detail = await raw("methods/" + encodeURIComponent(payload.method_id));
  const run = payload.run_id
    ? await raw("runs/" + encodeURIComponent(payload.run_id))
    : null;
  if (run && run.method_id !== payload.method_id)
    throw new Error("This job belongs to another method.");
  const version = run
    ? detail.versions.find((x: Obj) => x.number === run.version)
    : detail.versions[detail.versions.length - 1];
  if (!version) throw new Error("The selected version is unavailable.");
  const m = await raw(
    "methods/" +
      encodeURIComponent(payload.method_id) +
      "/versions/" +
      version.number +
      "/manifest",
  );
  if (sha256Hex(m.raw) !== version.manifest_hash)
    throw new Error("The method policy does not match its published hash.");
  return { ...payload, manifest: m.raw, manifest_hash: version.manifest_hash };
}
function operation(
  path: string,
  method: string,
  body: Obj,
): { action: string; payload: Obj } {
  const url = new URL(path, "http://private.invalid/");
  const parts = url.pathname.split("/").filter(Boolean);
  const group = parts[1],
    id = parts[2],
    sub = parts[3];
  if (group === "credentials")
    return {
      action:
        "credentials." + (id ? sub : method === "GET" ? "list" : "connect"),
      payload: { ...body, id },
    };
  if (group === "memory")
    return {
      action:
        "memory." +
        (id === "recall"
          ? "recall"
          : id
            ? sub
            : method === "GET"
              ? "list"
              : "propose"),
      payload: { ...body, id, ...Object.fromEntries(url.searchParams) },
    };
  if (group === "outbound")
    return {
      action: "outbound." + (id ? sub : method === "GET" ? "list" : "propose"),
      payload: { ...body, id },
    };
  if (group === "documents")
    return {
      action:
        method === "GET"
          ? id
            ? "documents.get"
            : "documents.list"
          : "documents.ingest",
      payload: { ...body, id },
    };
  if (group === "browser") return { action: "browser.act", payload: body };
  if (group === "audit") return { action: "audit.list", payload: {} };
  throw new Error("This protection operation is not available.");
}
const lanes = new Map<string, Promise<unknown>>();
function normalize(x: any): any {
  if (Array.isArray(x)) return x.map(normalize);
  if (x && typeof x === "object") {
    const o: Obj = {};
    for (const [k, v] of Object.entries(x))
      o[k] =
        k.endsWith("_at") && typeof v === "number"
          ? new Date(v * 1000).toISOString()
          : normalize(v);
    if (o.status === "pending_review") o.status = "pending";
    if (typeof x.expires_unix === "number")
      o.expires_at = new Date(x.expires_unix * 1000).toISOString();
    return o;
  }
  return x;
}
const sorted = (v: any): any =>
  Array.isArray(v)
    ? v.map(sorted)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, sorted(v[k])]),
        )
      : v;
async function relay(packet: any, c: Obj, dev: boolean) {
  const r = await raw("privacy/execute", { request: packet.sealed });
  if (!dev) {
    if (!r.call_id || !/^[A-Za-z0-9-]{1,80}$/.test(r.call_id))
      throw new Error("Private execution has no valid call reference.");
    let att: Obj | null = null;
    for (let n = 0; n < 8; n++) {
      const res = await fetch(
        "https://testnet-api.outlayer.ai/attestations/by-call/" + r.call_id,
        { cache: "no-store" },
      );
      if (res.ok) {
        const text = await res.text();
        if (text) {
          att = JSON.parse(text);
          break;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (
      !att ||
      c.runner_hash !== PRIVATE_RUNNER_HASH ||
      att.executed_wasm_sha256 !== PRIVATE_RUNNER_HASH ||
      att.input_hash !==
        sha256Hex(JSON.stringify({ cmd: "protect", request: packet.sealed })) ||
      att.output_hash !== sha256Hex(JSON.stringify(sorted(r.output)))
    )
      throw new Error(
        "The independent OutLayer record does not match the pinned private runner and encrypted exchange.",
      );
  }
  return r.output;
}
const pending = new Map<
  string,
  { packet: any; path: string; bodyHash: string }
>();
async function invoke(name: string, path: string, method: string, body: Obj, fresh = false): Promise<any> {
  const c = await raw("privacy/config");
  if (!c.enabled)
    throw new Error(
      "Private protections are waiting for the new TEE runner to be activated. Your data has not been sent.",
    );
  const dev =
    c.mode === "local_native" &&
    process.env.NEXT_PUBLIC_KALIS_PRIVATE_DEV === "1" &&
    ["127.0.0.1", "localhost"].includes(window.location.hostname);
  if (c.mode !== "tee" && !dev)
    throw new Error(
      "This server offers only a local development runner, not a TEE.",
    );
  if (!dev && (c.tee_pubkey !== TEE_KEY || c.receipt_pubkey !== RECEIPT_KEY))
    throw new Error("The private runner does not match the pinned keys.");
  const ident = await identity(name);
  const sign = async (bytes: Uint8Array) =>
    new Uint8Array(
      await crypto.subtle.sign(
        "Ed25519",
        ident.keys.privateKey,
        new Uint8Array(bytes).buffer,
      ),
    );
  const hash = sha256Hex(JSON.stringify({ path, method, body }));
  let waiting = pending.get(name);
  if (waiting && (waiting.path !== path || waiting.bodyHash !== hash))
    throw new Error(
      "A previous private operation is unresolved. Retry that same operation first.",
    );
  if (!waiting) {
    // Use the revision this device last saw, which saves one TEE round trip per operation.
    // If another device changed the state, the runner refuses and we retry once with a snapshot.
    const highest = (await local<number>(name + ":revision")) || 0;
    let state: Obj = { revision: highest };
    if (fresh) {
      const snap = await preparePrivateRequest(
        c.tee_pubkey,
        ident.owner,
        sign,
        "snapshot",
        {},
        0,
      );
      state = openPrivateResponse(
        snap,
        await relay(snap, c, dev),
        c.receipt_pubkey,
      );
      if (state.revision < highest)
        throw new Error(
          "Private storage returned an older revision. No operation was sent.",
        );
    }
    const op = operation(path, method, body);
    op.payload = await policy(op.payload);
    if (op.action === "outbound.propose" || op.action === "browser.act") {
      const values = await local<{ expires: number; values: string[] }>(
        name + ":private-values",
      );
      op.payload.private_values =
        values && values.expires > Date.now() ? values.values : [];
    }
    // On execute, bind the owner signature to the same hash already reviewed on the device.
    if (op.action === "outbound.execute" && !op.payload.action_hash) {
      const packet = await preparePrivateRequest(
        c.tee_pubkey,
        ident.owner,
        sign,
        "outbound.list",
        {},
        state.revision,
      );
      const list = openPrivateResponse(
        packet,
        await relay(packet, c, dev),
        c.receipt_pubkey,
      );
      op.payload.action_hash = list.value.find(
        (x: Obj) => x.id === op.payload.id,
      )?.action_hash;
      state.revision = list.revision;
    }
    const packet = await preparePrivateRequest(
      c.tee_pubkey,
      ident.owner,
      sign,
      op.action,
      op.payload,
      state.revision,
    );
    waiting = { packet, path, bodyHash: hash };
    pending.set(name, waiting);
  }
  const output = await relay(waiting.packet, c, dev);
  try {
    const opened = openPrivateResponse(
      waiting.packet,
      output,
      c.receipt_pubkey,
    );
    const seen = (await local<number>(name + ":revision")) || 0;
    if (opened.revision < seen)
      throw new Error("Private storage returned an older revision.");
    await local(name + ":revision", Math.max(seen, opened.revision));
    pending.delete(name);
    const value = normalize(opened.value);
    // Decrypted results stay on this device only, so pages can show them while the TEE refreshes.
    if (method === "GET") await local(name + ":cache:" + path, { at: Date.now(), value });
    return value;
  } catch (e) {
    pending.delete(name);
    if (!fresh && e instanceof Error && /private state changed/.test(e.message))
      return invoke(name, path, method, body, true);
    throw e;
  }
}
export async function cachedPrivate<T>(path: string): Promise<{ at: number; value: T } | undefined> {
  try {
    return await local<{ at: number; value: T }>(slot() + ":cache:" + path);
  } catch {
    return undefined;
  }
}
export function privateRequest<T>(
  path: string,
  method: string,
  body: Obj = {},
): Promise<T> {
  if (
    path === "protections/documents" &&
    method === "POST" &&
    body.public_document === true
  )
    return raw("public-documents", body) as Promise<T>;
  if (path === "protections/private-values" && method === "POST")
    return rememberPrivateValues(body.label, body.values) as Promise<T>;
  const name = slot();
  const next = (lanes.get(name) || Promise.resolve())
    .catch(() => {})
    .then(() => invoke(name, path, method, body));
  lanes.set(name, next);
  return next as Promise<T>;
}
