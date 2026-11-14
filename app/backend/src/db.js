// Durable JSON collections under app/backend/data/db/. One file per collection, written atomically
// (write to a temp file, then rename), so a crash never leaves half a file. Small and single-process:
// fine for the demo server, not a production database.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "./config.js";

const DIR = path.join(DATA_DIR, "db");
fs.mkdirSync(DIR, { recursive: true });
const cache = new Map();

function file(coll) {
  if (!/^[a-z_]{2,40}$/.test(coll)) throw new Error(`bad collection ${coll}`);
  return path.join(DIR, `${coll}.json`);
}

/** All rows of a collection as an object keyed by id. */
export function all(coll) {
  if (!cache.has(coll)) {
    const f = file(coll);
    cache.set(coll, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
  }
  return cache.get(coll);
}

function flush(coll) {
  const f = file(coll);
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache.get(coll), null, 1), { mode: 0o600 });
  fs.renameSync(tmp, f);
}

export const get = (coll, id) => all(coll)[id] || null;

export function put(coll, id, row) {
  all(coll)[id] = row;
  flush(coll);
  return row;
}

/** Read-modify-write one row. `fn` gets the current row (or null) and returns the new row. */
export function update(coll, id, fn) {
  const next = fn(get(coll, id));
  return put(coll, id, next);
}

export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
export const nowIso = () => new Date().toISOString();

/** Stable hash of a JSON value (keys sorted), used to compare idempotent request payloads. */
export function payloadHash(v) {
  const sorted = (x) => Array.isArray(x) ? x.map(sorted) : x && typeof x === "object"
    ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sorted(x[k])])) : x;
  return crypto.createHash("sha256").update(JSON.stringify(sorted(v))).digest("hex");
}

/**
 * Cursor pagination over rows sorted by (created_at desc, id desc).
 * The cursor is the last row's "created_at|id"; it stays stable when new rows arrive.
 */
export function paginate(rows, { cursor, limit = 20 }) {
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const sorted = [...rows].sort((a, b) => (b.created_at + b.id).localeCompare(a.created_at + a.id));
  let start = 0;
  if (cursor) {
    const [c, id] = String(cursor).split("|");
    start = sorted.findIndex((r) => (r.created_at + r.id).localeCompare(c + id) < 0);
    if (start < 0) start = sorted.length;
  }
  const items = sorted.slice(start, start + lim);
  const last = items.at(-1);
  return { items, next_cursor: start + lim < sorted.length && last ? `${last.created_at}|${last.id}` : null };
}
