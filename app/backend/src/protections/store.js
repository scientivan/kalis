// Small JSON-file store per workspace and collection (demo persistence under app/backend/data/).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DATA_DIR } from "../config.js";

const WS = /^[A-Za-z0-9_-]{1,48}$/;
export class ProtectionError extends Error {
  constructor(status, code, message, extra = {}) { super(message); this.status = status; this.code = code; Object.assign(this, extra); }
}
export function checkWorkspace(ws) {
  if (!WS.test(ws || "")) throw new ProtectionError(400, "bad_workspace", "Send a workspace id (1-48 letters, digits, '-', '_') in the X-Kalis-Workspace header");
  return ws;
}
const file = (ws, coll) => path.join(DATA_DIR, "workspaces", checkWorkspace(ws), `${coll}.json`);
export function load(ws, coll) {
  const f = file(ws, coll);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
}
export function save(ws, coll, rows) {
  const f = file(ws, coll);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(rows, null, 2), { mode: 0o600 });
}
export const newId = (prefix) => `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
export const now = () => new Date().toISOString();
export const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

/** Append-only audit log per workspace. Never store secret values here. */
export function audit(ws, entry) {
  const rows = load(ws, "audit");
  rows.push({ at: now(), ...entry });
  save(ws, "audit", rows);
}

// Text that tries to steer an AI agent. Used to flag external content; flagged text is kept as data, never followed.
const INSTRUCTION_PATTERNS = [
  /ignore (all |your )?(previous|prior) instructions/i, /note to (ai|assistant|llm)s?/i, /\bsave (this )?to memory\b/i,
  /\bsend\b.{0,60}\b(to|at)\b\s*https?:\/\//i, /\bsystem prompt\b/i, /\byou (must|should) now\b/i, /\bdisregard\b.{0,30}\binstructions\b/i,
];
export function instructionFlags(text) {
  return INSTRUCTION_PATTERNS.filter((p) => p.test(text || "")).map((p) => p.source);
}
