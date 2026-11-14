// Shared helpers: market contract reads, method files on this server, money formatting, API errors.
import fs from "node:fs";
import path from "node:path";
import { config, METHODS_DIR, DATA_DIR } from "./config.js";
import { view } from "./near.js";
import { sha256Hex, methodKind } from "./kalis-crypto.js";

export const YOCTO = 10n ** 24n;
export const toNear = (y) => (Number(BigInt(y) * 100000n / YOCTO) / 100000).toString();
export const RUN_ID = /^[A-Za-z0-9_-]{1,64}$/;
export const HASH = /^[0-9a-f]{64}$/;
export const PLATFORM_SHARE_PCT = 10;
export const STORAGE_DEPOSIT_YOCTO = 10n ** 22n; // 0.01 NEAR attached for the run record; excess refunded in the same tx

export class ApiError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; if (details) this.details = details; }
}

/** Money as the API returns it: integer string in the smallest unit, plus asset facts. */
export const money = (yocto, extra = {}) => ({ value: BigInt(yocto).toString(), asset: "NEAR", decimals: 24, network: config.network, display: `${toNear(yocto)} NEAR`, ...extra });

// ---------- method files: manifests and seller-sealed method blobs ----------
export function methodDir(id) {
  if (!/^[A-Za-z0-9_-]{3,48}$/.test(id || "")) throw new ApiError(400, "bad_method_id", "method_id has an invalid format");
  return path.join(METHODS_DIR, id);
}
export function manifestByHash(id, hash) {
  const dir = methodDir(id);
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    if (sha256Hex(text) === hash) return text;
  }
  return null;
}
export function sealedMethodByHash(id, codeHash) {
  const f = path.join(methodDir(id), "sealed", `${codeHash}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}

// ---------- execution cache (public data only: ciphertext, completion, attestation) ----------
fs.mkdirSync(path.join(DATA_DIR, "runs"), { recursive: true });
const runFile = (id) => path.join(DATA_DIR, "runs", `${id}.json`);
export const readExecution = (id) => (fs.existsSync(runFile(id)) ? JSON.parse(fs.readFileSync(runFile(id), "utf8")) : null);
export const writeExecution = (id, obj) => fs.writeFileSync(runFile(id), JSON.stringify(obj, null, 2));

// ---------- views ----------
export async function versionView(methodId, v) {
  const manifestText = manifestByHash(methodId, v.manifest_hash);
  const manifest = manifestText ? JSON.parse(manifestText) : null;
  return {
    ...v,
    price_near: toNear(v.price),
    price_amount: money(v.price),
    payout_split_pct: { seller: 100 - v.dao_share_pct - PLATFORM_SHARE_PCT, dao: v.dao_share_pct, platform: PLATFORM_SHARE_PCT },
    manifest,
    method_kind: manifest ? methodKind(manifest) : null,
    manifest_available: Boolean(manifestText),
    runnable: Boolean(manifestText && sealedMethodByHash(methodId, v.code_hash)),
  };
}

export async function getMethod(id) {
  const m = await view(config.market, "get_method", { method_id: id });
  if (!m) throw new ApiError(404, "unknown_method", `No method "${id}" in ${config.market}`);
  const versions = await view(config.market, "list_versions", { method_id: id });
  return { ...m, versions: await Promise.all(versions.map((v) => versionView(id, v))) };
}

export async function getVersion(methodId, number) {
  const method = await getMethod(methodId);
  const v = number ? method.versions.find((x) => x.number === Number(number)) : method.versions.at(-1);
  if (!v) throw new ApiError(404, "unknown_version", "No such version");
  return { method, v };
}

export async function chainRun(runId) {
  if (!RUN_ID.test(runId || "")) throw new ApiError(400, "bad_run_id", "run_id must be 1-64 letters, digits, '-' or '_'");
  return view(config.market, "get_run", { run_id: runId });
}
