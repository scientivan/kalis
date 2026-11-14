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
// ---------- Device vault ----------
// The owner's private records live encrypted in this browser (AES-GCM, non-extractable key).
// Owner-only operations run here instantly. Operations that must be enforced against a method,
// or that need the sealed secrets, go to the TEE with the records sealed inside the request.
// The runner applies the rule, stores nothing, and returns the updated records sealed to the owner.
type Rows = Record<string, Obj[]>;
const TEE_ACTIONS = new Set(["credentials.use", "memory.recall", "outbound.propose", "outbound.execute", "documents.ingest", "browser.act"]);
const READ_ACTIONS = new Set(["credentials.list", "memory.list", "documents.list", "documents.get", "outbound.list", "audit.list"]);
async function vaultKey(name: string) {
  let k = await local<CryptoKey>(name + ":vault-key");
  if (!k) {
    k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await local(name + ":vault-key", k);
  }
  return k;
}
async function loadRows(name: string): Promise<Rows> {
  const box = await local<{ iv: Uint8Array; ct: ArrayBuffer }>(name + ":vault");
  if (!box) return {};
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(box.iv) }, await vaultKey(name), box.ct);
  return JSON.parse(new TextDecoder().decode(pt));
}
async function saveRows(name: string, rows: Rows) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await vaultKey(name), new TextEncoder().encode(JSON.stringify(rows)));
  await local(name + ":vault", { iv, ct });
}
const nowS = () => Math.floor(Date.now() / 1000);
const rid = () => toHex(crypto.getRandomValues(new Uint8Array(12)));
const flagged = (t: string) => ["ignore previous", "ignore all previous", "system prompt", "save this to memory", "you must now", "disregard previous"].some(x => t.toLowerCase().includes(x));
function publicCredential(c: Obj) {
  const { token: _token, ...r } = c;
  const state = c.revoked ? "revoked" : (c.expires_unix || 0) <= nowS() ? "expired" : "active";
  return { ...r, effective_state: state, allowed_actions: state === "active" ? ["use", "revoke"] : [] };
}
// Same rules as the runner's owner operations in app/kalis-runner/src/privacy.rs.
function localAction(rows: Rows, action: string, p: Obj): any {
  const t = nowS();
  const list = (k: string) => (rows[k] ||= []);
  const find = (k: string) => {
    const r = list(k).find(x => x.id === p.id);
    if (!r) throw new Error("Private record not found.");
    return r;
  };
  const newest = (k: string, n: number) => [...list(k)].reverse().slice(0, n);
  switch (action) {
    case "credentials.list": return list("credentials").map(publicCredential);
    case "credentials.connect": {
      if (!["broker_mock", "sheets_mock", "docs_mock", "wallet_mock"].includes(p.connector)) throw new Error("Only built-in mock connections are supported.");
      if (p.token !== "kalis-private-demo") throw new Error("Use the private demo token. Real connector authentication is not enabled.");
      if (JSON.stringify(p.scopes) !== JSON.stringify(["read"])) throw new Error("Only read access is supported.");
      const ttl = Number(p.ttl_minutes);
      if (!Number.isInteger(ttl) || ttl <= 0 || ttl > 1440) throw new Error("Expiry must be 1 to 1440 minutes.");
      const row = { id: rid(), connector: p.connector, token: p.token, scopes: ["read"], expires_unix: t + ttl * 60, created_at: t, revoked: false };
      list("credentials").push(row);
      return publicCredential(row);
    }
    case "credentials.revoke": { const r = find("credentials"); r.revoked = true; return publicCredential(r); }
    case "memory.list": return newest("memory", 20);
    case "memory.propose": {
      if (list("memory").length >= 100) throw new Error("Private note limit reached.");
      const text = String(p.text || "");
      if (!text || text.length > 2000) throw new Error("Note is empty or too long.");
      if (!["user", "document", "web", "method"].includes(p.source?.kind)) throw new Error("Invalid note source.");
      const review = p.source.kind !== "user" || flagged(text);
      const r = { id: rid(), text, source: p.source, created_at: t, status: review ? "pending_review" : "approved", instruction_like: flagged(text), allowed_actions: ["approve", "reject", "edit", "delete"] };
      list("memory").push(r);
      return r;
    }
    case "memory.approve": case "memory.reject": case "memory.delete": case "memory.edit": {
      const r = find("memory");
      if (r.status === "deleted") throw new Error("Note was deleted.");
      if (action === "memory.approve") r.status = "approved";
      else if (action === "memory.reject") r.status = "rejected";
      else if (action === "memory.delete") Object.assign(r, { status: "deleted", text: "", source: { kind: "user" } });
      else {
        const text = String(p.text || "");
        if (!text || text.length > 2000) throw new Error("Invalid note.");
        Object.assign(r, { text, status: "approved", instruction_like: flagged(text) });
      }
      return { ...r };
    }
    case "documents.list": return newest("documents", 20);
    case "documents.get": return find("documents");
    case "outbound.list": return newest("outbound", 20);
    case "outbound.reject": {
      const r = find("outbound");
      if (r.status === "sent") throw new Error("Already sent.");
      Object.assign(r, { status: "rejected", allowed_actions: [] });
      return { ...r };
    }
    case "outbound.approve": {
      const r = find("outbound");
      if (p.action_hash !== r.action_hash) throw new Error("Approval must bind the exact destination, content and parameters.");
      if (r.status !== "held_for_approval") throw new Error("This action is not awaiting approval.");
      // Long enough for the testnet queue before the runner checks it on send.
      Object.assign(r, { status: "approved", allowed_actions: ["execute", "reject"], approval_expires_unix: t + 1800 });
      return { ...r };
    }
    case "audit.list": return newest("audit", 100);
  }
  throw new Error("This protection operation is not available.");
}
function audit(rows: Rows, action: string) {
  const a = (rows.audit ||= []);
  a.push({ id: rid(), at: nowS(), event: action });
  if (a.length > 1000) a.shift();
}
// Take the runner's additions and updates without discarding edits made on the device meanwhile.
function merge(current: Rows, returned: Rows) {
  for (const [k, items] of Object.entries(returned || {})) {
    const list = (current[k] ||= []);
    for (const row of items) {
      const i = list.findIndex(x => x.id === row.id);
      if (i < 0) list.push(row);
      else if (JSON.stringify(list[i]) !== JSON.stringify(row) && k !== "audit") list[i] = row;
    }
  }
  return current;
}
const pending = new Map<string, any>();
async function invoke(name: string, path: string, method: string, body: Obj): Promise<any> {
  const op = operation(path, method, body);
  if (!TEE_ACTIONS.has(op.action)) {
    const rows = await loadRows(name);
    const value = localAction(rows, op.action, op.payload);
    if (!READ_ACTIONS.has(op.action)) {
      audit(rows, op.action);
      await saveRows(name, rows);
    }
    return normalize(value);
  }
  const c = await raw("privacy/config");
  if (!c.enabled)
    throw new Error("Private protections are waiting for the TEE runner to be activated. Your data has not been sent.");
  const dev = c.mode === "local_native" && process.env.NEXT_PUBLIC_KALIS_PRIVATE_DEV === "1" && ["127.0.0.1", "localhost"].includes(window.location.hostname);
  if (c.mode !== "tee" && !dev) throw new Error("This server offers only a local development runner, not a TEE.");
  if (!dev && (c.tee_pubkey !== TEE_KEY || c.receipt_pubkey !== RECEIPT_KEY))
    throw new Error("The private runner does not match the pinned keys.");
  const ident = await identity(name);
  const sign = async (bytes: Uint8Array) =>
    new Uint8Array(await crypto.subtle.sign("Ed25519", ident.keys.privateKey, new Uint8Array(bytes).buffer));
  const key = sha256Hex(JSON.stringify({ name, path, method, body }));
  let packet = pending.get(key);
  if (!packet) {
    op.payload = await policy(op.payload);
    const rows = await loadRows(name);
    if (op.action === "outbound.propose" || op.action === "browser.act") {
      const values = await local<{ expires: number; values: string[] }>(name + ":private-values");
      op.payload.private_values = values && values.expires > Date.now() ? values.values : [];
    }
    if (op.action === "outbound.execute" && !op.payload.action_hash)
      op.payload.action_hash = (rows.outbound || []).find(x => x.id === op.payload.id)?.action_hash;
    packet = await (preparePrivateRequest as (...a: unknown[]) => Promise<any>)(c.tee_pubkey, ident.owner, sign, op.action, op.payload, 0, undefined, { rows });
    pending.set(key, packet);
  }
  // The relay resumes the same OutLayer call for the same sealed packet, so retrying after a
  // proxy timeout never runs the operation twice. The request stays valid for 15 minutes.
  let output: any;
  for (let attempt = 0; ; attempt++) {
    try { output = await relay(packet, c, dev); break; }
    catch (e) {
      if (attempt >= 3 || (e instanceof Error && /refused|match|invalid/i.test(e.message))) { pending.delete(key); throw e; }
    }
  }
  pending.delete(key);
  const opened = openPrivateResponse(packet, output, c.receipt_pubkey);
  if (opened.state?.rows) {
    const rows = merge(await loadRows(name), opened.state.rows);
    audit(rows, op.action);
    await saveRows(name, rows);
  }
  return normalize(opened.value);
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
