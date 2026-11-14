// Kalis buyer checks (manifest v5, see app/methods/MANIFEST_V5.md).
// Runs on the buyer's device in the browser or in Node. A seller declares checks as JSONLogic data;
// this module evaluates them with a small fixed interpreter. Seller code is never run, and there is
// no eval. Each check ends as pass, fail, cannot_check (a value is missing or not a number, or the
// rule errored) or not_applicable (its `when` was false). A missing check is never a pass.

export const CHECKER_VERSION = "kalis-checks/1";

class CannotCheck extends Error {}

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const num = (x) => { if (!isNum(x)) throw new CannotCheck(`expected a number, got ${JSON.stringify(x)?.slice(0, 40)}`); return x; };
const arr = (x) => { if (!Array.isArray(x)) throw new CannotCheck(`expected a list, got ${JSON.stringify(x)?.slice(0, 40)}`); return x; };
const truthy = (x) => Array.isArray(x) ? x.length > 0 : Boolean(x);

/** Look up a dotted path. Missing values are undefined (the caller decides whether that is an error). */
function lookup(obj, path) {
  if (path === "" || path === null || path === undefined) return obj;
  let cur = obj;
  for (const k of String(path).split(".")) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[/^\d+$/.test(k) && Array.isArray(cur) ? Number(k) : k];
  }
  return cur;
}

const OPS = new Set(["var", "==", "!=", "<", "<=", ">", ">=", "and", "or", "!", "!!", "if", "+", "-", "*", "/", "%", "min", "max",
  "map", "reduce", "filter", "all", "some", "none", "in", "cat", "missing",
  "sum", "count", "abs", "round2", "zip_dot", "get", "range", "is_int", "lower", "digits"]);

/**
 * Evaluate one JSONLogic expression.
 * `scope` is { root, local }: `var` first looks in `local` (the current item inside map/filter/...,
 * or {current, accumulator} inside reduce), then in `root` ({input, answer, derived}).
 * `tol` relaxes numeric ==, <=, >= by an absolute amount.
 */
export function evaluate(expr, scope, tol = 0) {
  if (Array.isArray(expr)) return expr.map((e) => evaluate(e, scope, tol));
  if (expr === null || typeof expr !== "object") return expr;
  const keys = Object.keys(expr);
  if (keys.length !== 1) throw new Error(`a rule object has exactly one operator, got ${keys.join(",") || "none"}`);
  const op = keys[0];
  if (!OPS.has(op)) throw new Error(`unknown operator "${op}"`);
  let args = expr[op];
  if (!Array.isArray(args)) args = [args];
  const ev = (e, s = scope) => evaluate(e, s, tol);
  const child = (local) => ({ root: scope.root, local });

  switch (op) {
    case "var": {
      const path = ev(args[0]);
      let v;
      if (scope.local !== undefined && (path === "" || path === null)) v = scope.local;
      else {
        const first = String(path).split(".")[0];
        const inLocal = scope.local !== null && typeof scope.local === "object" && !Array.isArray(scope.local) && first in scope.local;
        v = inLocal ? lookup(scope.local, path) : lookup(scope.root, path);
      }
      if (v === undefined) {
        if (args.length > 1) return ev(args[1]);
        throw new CannotCheck(`no value for "${path}"`);
      }
      return v;
    }
    case "missing": return args.map(ev).filter((p) => lookup(scope.root, p) === undefined);
    case "==": { const [a, b] = args.map((e) => ev(e)); return isNum(a) && isNum(b) ? Math.abs(a - b) <= tol : a === b; }
    case "!=": { const [a, b] = args.map((e) => ev(e)); return isNum(a) && isNum(b) ? Math.abs(a - b) > tol : a !== b; }
    case "<": return args.length === 3 ? num(ev(args[0])) < num(ev(args[1])) && num(ev(args[1])) < num(ev(args[2])) : num(ev(args[0])) < num(ev(args[1]));
    case "<=": return args.length === 3 ? num(ev(args[0])) <= num(ev(args[1])) + tol && num(ev(args[1])) <= num(ev(args[2])) + tol : num(ev(args[0])) <= num(ev(args[1])) + tol;
    case ">": return num(ev(args[0])) > num(ev(args[1]));
    case ">=": return num(ev(args[0])) >= num(ev(args[1])) - tol;
    case "and": { let r = true; for (const e of args) { r = ev(e); if (!truthy(r)) return r; } return r; }
    case "or": { let r = false; for (const e of args) { r = ev(e); if (truthy(r)) return r; } return r; }
    case "!": return !truthy(ev(args[0]));
    case "!!": return truthy(ev(args[0]));
    case "if": {
      let i = 0;
      for (; i + 1 < args.length; i += 2) if (truthy(ev(args[i]))) return ev(args[i + 1]);
      return i < args.length ? ev(args[i]) : null;
    }
    case "+": return args.reduce((s, e) => s + num(ev(e)), 0);
    case "*": return args.reduce((s, e) => s * num(ev(e)), 1);
    case "-": return args.length === 1 ? -num(ev(args[0])) : num(ev(args[0])) - num(ev(args[1]));
    case "/": { const d = num(ev(args[1])); if (d === 0) throw new CannotCheck("division by zero"); return num(ev(args[0])) / d; }
    case "%": return num(ev(args[0])) % num(ev(args[1]));
    case "min": return Math.min(...args.map((e) => num(ev(e))));
    case "max": return Math.max(...args.map((e) => num(ev(e))));
    case "abs": return Math.abs(num(ev(args[0])));
    case "round2": return Math.round(num(ev(args[0])) * 100) / 100;
    case "is_int": { const v = ev(args[0]); return isNum(v) && Number.isInteger(v); }
    case "map": return arr(ev(args[0])).map((x) => ev(args[1], child(x)));
    case "filter": return arr(ev(args[0])).filter((x) => truthy(ev(args[1], child(x))));
    case "all": { const a = arr(ev(args[0])); return a.length > 0 && a.every((x) => truthy(ev(args[1], child(x)))); }
    case "some": return arr(ev(args[0])).some((x) => truthy(ev(args[1], child(x))));
    case "none": return !arr(ev(args[0])).some((x) => truthy(ev(args[1], child(x))));
    case "reduce": return arr(ev(args[0])).reduce((acc, x) => ev(args[1], child({ current: x, accumulator: acc })), ev(args[2]));
    case "sum": return arr(ev(args[0])).reduce((s, x) => s + num(x), 0);
    case "count": return arr(ev(args[0])).length;
    case "zip_dot": { const a = arr(ev(args[0])), b = arr(ev(args[1])); if (a.length !== b.length) throw new CannotCheck("zip_dot lists differ in length"); return a.reduce((s, x, i) => s + num(x) * num(b[i]), 0); }
    case "get": { const a = arr(ev(args[0])); const i = num(ev(args[1])); if (!(i in a)) throw new CannotCheck(`no item ${i}`); return a[i]; }
    case "range": { const n = num(ev(args[0])); if (!Number.isInteger(n) || n < 0 || n > 10000) throw new CannotCheck("range needs 0 to 10000"); return Array.from({ length: n }, (_, i) => i); }
    case "in": { const a = ev(args[0]), b = ev(args[1]); if (typeof b === "string") return b.includes(String(a)); return Array.isArray(b) ? b.includes(a) : false; }
    case "cat": return args.map((e) => { const v = ev(e); return v === null || v === undefined ? "" : String(v); }).join("");
    case "lower": return String(ev(args[0]) ?? "").toLowerCase();
    // Numbers as space-separated tokens with thousand separators removed, wrapped in spaces:
    // "IDR 28,000,000 or 3 days" becomes " 28000000 3 ". Testing `in` with two such strings matches
    // whole numbers only, so 28000000 is not found inside 128000000.
    case "digits": {
      const t = String(ev(args[0]) ?? "").replace(/(\d)[.,](?=\d{3}(\D|$))/g, "$1").match(/\d+/g) || [];
      return ` ${t.join(" ")} `;
    }
    default: throw new Error(`unknown operator "${op}"`);
  }
}

/** All `var` paths a rule reads (for the validator). Paths inside map/filter/... are local, so marked. */
export function varPaths(expr, inLoop = false, out = []) {
  if (Array.isArray(expr)) { for (const e of expr) varPaths(e, inLoop, out); return out; }
  if (expr === null || typeof expr !== "object") return out;
  const op = Object.keys(expr)[0];
  let args = expr[op];
  if (!Array.isArray(args)) args = [args];
  if (op === "var" && typeof args[0] === "string") out.push({ path: args[0], local: inLoop });
  else if (op === "var") varPaths(args, inLoop, out);
  if (["map", "filter", "all", "some", "none", "reduce"].includes(op)) {
    varPaths(args[0], inLoop, out);
    varPaths(args[1], true, out);
    if (op === "reduce") varPaths(args[2], inLoop, out);
  } else if (op !== "var") varPaths(args, inLoop, out);
  return out;
}

/** "{{derived.cash:2}}" style placeholders. Formats: 2 (two decimals), pct (percent, one decimal), int. */
function fill(template, root) {
  if (typeof template !== "string") return template;
  return template.replace(/\{\{\s*([A-Za-z0-9_.]+)(?::(\w+))?\s*\}\}/g, (_, p, f) => {
    const v = lookup(root, p);
    if (v === undefined) return "?";
    if (!isNum(v)) return String(v);
    if (f === "pct") return `${(v * 100).toFixed(1)}%`;
    if (f === "int") return String(Math.round(v));
    if (f === "2") return v.toFixed(2);
    return String(v);
  });
}

/** Prompt answers open as { status, text }. With outputs.parse = "json_in_text", the JSON inside text is the answer. */
export function normalizeAnswer(manifest, answer) {
  if (manifest?.outputs?.parse !== "json_in_text" || !answer || typeof answer.text !== "string") return answer;
  const t = answer.text;
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [fenced?.[1], t, t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)].filter(Boolean);
  for (const c of candidates) {
    try { const v = JSON.parse(c); if (v && typeof v === "object") return { ...v, status: answer.status, _parsed_from_text: true }; } catch { /* try the next one */ }
  }
  return { ...answer, _parse_error: "The answer text is not JSON" };
}

/**
 * Evaluate a manifest's buyer checks against the buyer's own data and the opened answer.
 * Returns { checker_version, results, counts, passed, has_cannot_check, unverifiable, derived, answer }.
 * passed is true when no check failed. has_cannot_check and unverifiable say whether the buyer
 * should still treat the result with care.
 */
export function runChecks(manifest, input, rawAnswer) {
  const answer = normalizeAnswer(manifest, rawAnswer);
  const root = { input, answer, derived: {} };
  const results = [];
  for (const [name, expr] of Object.entries(manifest?.derived || {})) {
    try { root.derived[name] = evaluate(expr, { root }); } catch { /* checks that read it will report cannot_check */ }
  }
  for (const c of manifest?.buyer_checks || []) {
    const r = { id: c.id, description: c.description || c.id };
    try {
      if (c.when !== undefined && !truthy(evaluate(c.when, { root }))) { results.push({ ...r, status: "not_applicable", message: fill(c.not_applicable_message || "This check does not apply to this answer.", root) }); continue; }
      const ok = truthy(evaluate(c.rule, { root }, Number(c.tolerance) || 0));
      results.push({ ...r, status: ok ? "pass" : "fail", message: fill(ok ? (c.pass_message || `Passed: ${r.description}.`) : c.message || `Failed: ${r.description}.`, root) });
    } catch (e) {
      results.push({ ...r, status: "cannot_check", message: `This could not be checked on your device (${e instanceof CannotCheck ? e.message : `rule error: ${e.message}`}).` });
    }
  }
  const counts = { pass: 0, fail: 0, cannot_check: 0, not_applicable: 0 };
  for (const r of results) counts[r.status]++;
  const statusField = manifest?.outputs?.status_field;
  const status = statusField ? lookup(answer, statusField) : undefined;
  const unverifiable = (manifest?.outputs?.unverifiable_status || []).filter((s) => s === status);
  return {
    checker_version: CHECKER_VERSION, results, counts,
    passed: counts.fail === 0, has_cannot_check: counts.cannot_check > 0, no_checks: results.length === 0,
    unverifiable, derived: root.derived, answer,
  };
}
