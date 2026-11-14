// Manifest v5 validation before publication (app/methods/MANIFEST_V5.md, "Validation before publish").
// Also accepts older manifests (v2-v4) with warnings, so existing versions stay readable.
import { sha256Hex, methodKind } from "./kalis-crypto.js";
import { evaluate, varPaths } from "./checks.js";

export const ATTESTABLE_MODELS = ["deepseek-ai/DeepSeek-V4.1-Flash-1017", "Qwen/Qwen3-VL-30B-A3B-Instruct", "openai/privacy-filter"];
export const SERVED_CONNECTORS = {
  broker_mock: ["read_positions"],
  sheets_mock: ["read_range"],
  docs_mock: ["read_document"],
  wallet_mock: ["read_loans"],
};
const FIELD_TYPES = ["string", "number", "integer", "boolean", "enum", "money", "percent", "date", "array", "object", "text"];
const DISPLAYS = ["money", "percent", "number", "text", "list", "table", "badge", "markdown"];
const LISTING_REQUIRED = ["title", "outcome", "category", "seller", "urgency", "limits", "sample_output"];
const KINDS = ["wasm", "prompt"];
const SOURCES = /^(typed|document|memory|browser|file_import:(xlsx|docx)|connector:[a-z_]+\.[a-z_]+)$/;

function checkFields(fields, where, errors, isOutput) {
  if (!Array.isArray(fields)) { errors.push({ path: where, message: "must be a list of fields" }); return []; }
  const ids = [];
  fields.forEach((f, i) => {
    const p = `${where}[${i}]`;
    if (!f || typeof f !== "object") return errors.push({ path: p, message: "must be an object" });
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,47}$/.test(f.id || "")) errors.push({ path: `${p}.id`, message: "id must be a simple name (letters, digits, _), no dots" });
    if (ids.includes(f.id)) errors.push({ path: `${p}.id`, message: `duplicate field id ${f.id}` });
    ids.push(f.id);
    if (!f.label) errors.push({ path: `${p}.label`, message: "label is required" });
    if (!FIELD_TYPES.includes(f.type)) errors.push({ path: `${p}.type`, message: `type must be one of ${FIELD_TYPES.join(", ")}` });
    if (f.type === "enum" && !(Array.isArray(f.enum) && f.enum.length)) errors.push({ path: `${p}.enum`, message: "enum fields need a non-empty enum list" });
    if (f.type === "object") checkFields(f.fields || [], `${p}.fields`, errors, isOutput);
    if (f.type === "array" && f.items?.fields) checkFields(f.items.fields, `${p}.items.fields`, errors, isOutput);
    if (!isOutput && f.source !== undefined && !SOURCES.test(f.source)) errors.push({ path: `${p}.source`, message: "source must be typed, document, memory, browser, file_import:xlsx|docx or connector:<id>.<operation>" });
    if (isOutput && f.display !== undefined && !DISPLAYS.includes(f.display)) errors.push({ path: `${p}.display`, message: `display must be one of ${DISPLAYS.join(", ")}` });
  });
  return ids;
}

/**
 * Validate a manifest. Pass the raw file text when you have it, so the hash is the one the chain will record.
 * Returns { ok, errors, warnings, manifest_hash, manifest_version, kind, method_kind, runnable_capabilities }.
 */
export function validateManifest({ manifest, raw } = {}) {
  const errors = [], warnings = [];
  let m = manifest;
  if (raw !== undefined) {
    try { m = JSON.parse(raw); } catch (e) { return { ok: false, errors: [{ path: "", message: `not valid JSON: ${e.message}` }], warnings, manifest_hash: sha256Hex(String(raw)) }; }
  }
  if (!m || typeof m !== "object" || Array.isArray(m)) return { ok: false, errors: [{ path: "", message: "manifest must be a JSON object" }], warnings, manifest_hash: raw !== undefined ? sha256Hex(raw) : null };
  const v = Number(m.manifest_version || 0);
  const kind = m.kind || "wasm";
  if (v < 5) warnings.push({ path: "manifest_version", message: `version ${v || "missing"} is accepted for old methods, but new versions must use 5 (input/output schema and buyer checks)` });
  if (!/^[A-Za-z0-9_-]{3,48}$/.test(m.method_id || "")) errors.push({ path: "method_id", message: "3-48 letters, digits, '-' or '_'" });
  if (!KINDS.includes(kind)) errors.push({ path: "kind", message: `kind must be "wasm" or "prompt"` });

  // AI
  const allowed = m.ai?.allowed ?? [];
  if (!Array.isArray(allowed)) errors.push({ path: "ai.allowed", message: "must be a list of model ids" });
  else allowed.forEach((id, i) => { if (!ATTESTABLE_MODELS.includes(id)) errors.push({ path: `ai.allowed[${i}]`, message: `${id} is not a model this runner can attest. Allowed: ${ATTESTABLE_MODELS.join(", ")}` }); });
  if (kind === "prompt" && !(Array.isArray(allowed) && allowed.length)) errors.push({ path: "ai.allowed", message: "a prompt method must list at least one model; the runner uses the first" });
  if (m.ai?.proprietary) errors.push({ path: "ai.proprietary", message: "proprietary models are not supported by the runner yet" });

  // steps
  const steps = Array.isArray(m.steps) ? m.steps.map((s) => s?.id) : [];
  if (kind === "wasm" && !steps.length) errors.push({ path: "steps", message: "a wasm method must declare the steps it reports" });
  if (kind === "prompt" && steps.join(",") !== "ask_model,leak_check") errors.push({ path: "steps", message: "a prompt method declares exactly ask_model then leak_check (the runner reports them)" });
  if (new Set(steps).size !== steps.length) errors.push({ path: "steps", message: "step ids must be unique" });

  // connectors
  (m.connectors || []).forEach((c, i) => {
    const ops = SERVED_CONNECTORS[c?.id];
    if (!ops) return errors.push({ path: `connectors[${i}].id`, message: `connector ${c?.id} is not served by this backend. Served: ${Object.keys(SERVED_CONNECTORS).join(", ")}` });
    for (const op of c.operations || []) if (!ops.includes(op)) errors.push({ path: `connectors[${i}].operations`, message: `${c.id} has no operation ${op}. It has ${ops.join(", ")}` });
  });

  // money split
  const dao = Number(m.dao_share_percent);
  if (!Number.isInteger(dao) || dao < 10 || dao > 90) errors.push({ path: "dao_share_percent", message: "must be a whole number from 10 to 90 (the platform takes a fixed 10%)" });

  let inputIds = [], outputIds = [];
  if (v >= 5) {
    // listing
    for (const k of LISTING_REQUIRED) if (m.listing?.[k] === undefined || m.listing?.[k] === "") errors.push({ path: `listing.${k}`, message: "required" });
    if (m.listing?.seller && !m.listing.seller.display_name) errors.push({ path: "listing.seller.display_name", message: "required" });
    if (m.listing?.limits && !Array.isArray(m.listing.limits)) errors.push({ path: "listing.limits", message: "must be a list" });
    // schemas
    if (!m.inputs?.fields) errors.push({ path: "inputs.fields", message: "required in v5" });
    else inputIds = checkFields(m.inputs.fields, "inputs.fields", errors, false);
    if (!m.outputs?.fields) errors.push({ path: "outputs.fields", message: "required in v5" });
    else outputIds = checkFields(m.outputs.fields, "outputs.fields", errors, true);
    if (m.outputs?.parse !== undefined && m.outputs.parse !== "json_in_text") errors.push({ path: "outputs.parse", message: 'only "json_in_text" is supported' });
    if (m.outputs?.status_field && !outputIds.includes(m.outputs.status_field)) errors.push({ path: "outputs.status_field", message: `${m.outputs.status_field} is not an output field` });
    for (const f of m.inputs?.fields || []) {
      const src = f.source || "";
      if (src.startsWith("connector:")) {
        const [id, op] = src.slice(10).split(".");
        if (!(m.connectors || []).some((c) => c.id === id && (c.operations || []).includes(op))) errors.push({ path: `inputs.fields.${f.id}.source`, message: `${src} is not declared in connectors` });
      }
      if (src === "document" && !(m.inputs.documents || []).length) errors.push({ path: `inputs.fields.${f.id}.source`, message: "source document needs inputs.documents" });
      if (src === "memory" && !m.memory?.read) errors.push({ path: `inputs.fields.${f.id}.source`, message: "source memory needs memory.read" });
      if (src === "browser" && !m.browser?.enabled) errors.push({ path: `inputs.fields.${f.id}.source`, message: "source browser needs browser.enabled" });
    }
    // checks
    const derived = Object.keys(m.derived || {});
    const known = (path) => {
      const [root, first] = String(path).split(".");
      if (root === "input") return inputIds.includes(first);
      if (root === "answer") return outputIds.includes(first) || first === "status" || first.startsWith("_");
      if (root === "derived") return derived.includes(first);
      return false;
    };
    const scan = (expr, where) => {
      for (const { path, local } of varPaths(expr)) {
        if (local && (path === "" || !/^(input|answer|derived)\./.test(path))) continue; // item inside map/filter/reduce
        if (!known(path)) errors.push({ path: where, message: `reads "${path}", which is not declared in inputs, outputs or derived` });
      }
      try { evaluate(expr, { root: { input: {}, answer: {}, derived: {} } }); } catch (e) { if (/unknown operator|exactly one operator/.test(e.message)) errors.push({ path: where, message: e.message }); }
    };
    for (const [k, expr] of Object.entries(m.derived || {})) scan(expr, `derived.${k}`);
    const checkIds = [];
    (m.buyer_checks || []).forEach((c, i) => {
      const p = `buyer_checks[${i}]`;
      if (!/^[a-z0-9_]{1,48}$/.test(c?.id || "")) errors.push({ path: `${p}.id`, message: "lowercase letters, digits, _" });
      if (checkIds.includes(c?.id)) errors.push({ path: `${p}.id`, message: "duplicate check id" });
      checkIds.push(c?.id);
      if (!c?.rule) errors.push({ path: `${p}.rule`, message: "required" }); else scan(c.rule, `${p}.rule`);
      if (c?.when !== undefined) scan(c.when, `${p}.when`);
      if (!c?.message) errors.push({ path: `${p}.message`, message: "a failure message is required" });
    });
    if (!(m.buyer_checks || []).length) warnings.push({ path: "buyer_checks", message: "no buyer checks: the app will say the result cannot be checked on the device" });
    if (m.listing?.not_advice === undefined) warnings.push({ path: "listing.not_advice", message: "say whether the method gives financial or legal advice" });
  }

  return {
    ok: errors.length === 0, errors, warnings,
    manifest_hash: raw !== undefined ? sha256Hex(String(raw)) : null,
    manifest_hash_note: raw !== undefined ? "SHA-256 of the exact text sent. Publish these exact bytes." : "Send {raw} to get the hash the chain will record.",
    manifest_version: v || null, kind, method_kind: methodKind(m),
    runnable_capabilities: {
      kind_supported: KINDS.includes(kind),
      ai_models: Array.isArray(allowed) ? allowed.filter((x) => ATTESTABLE_MODELS.includes(x)) : [],
      connectors: (m.connectors || []).filter((c) => SERVED_CONNECTORS[c?.id]).map((c) => c.id),
      proprietary_ai: false,
      runnable_if_published: errors.length === 0,
    },
  };
}

export function registerManifestRoutes(route) {
  route("POST", /^\/api\/manifests\/validate$/, async (_q, _m, body) => {
    if (body?.raw === undefined && body?.manifest === undefined) {
      const e = new Error("Send {raw: <manifest text>} or {manifest: <object>}"); e.status = 400; e.code = "bad_request"; throw e;
    }
    return validateManifest(body.raw !== undefined ? { raw: String(body.raw) } : { manifest: body.manifest });
  });
}
