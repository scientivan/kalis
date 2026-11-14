// OutLayer access over HTTPS (the on-chain path is unreliable on testnet, see BUILD_STATUS.md 6.4).
// The payment key stays on the server.
import { config } from "./config.js";
import { sha256Hex } from "./kalis-crypto.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// JSON with object keys sorted, which is how the runner (serde_json) prints its output.
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === "object"
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;

export async function callRunner(input, { timeoutMs = 300000, resumeCallId = null, project = config.runner.project, secretsRef = config.runner.secretsRef, onStarted = null } = {}) {
  const key = config.secrets.outlayerPaymentKey;
  if (!key) throw Object.assign(new Error("OutLayer payment key is not configured"), { code: "not_configured", status: 503 });
  // Prompt methods can spend most of a minute in model reasoning, so ask for the 180 s hard cap
  // and a compute limit of 0.10 USD (testnet credit) instead of the 60 s / 0.01 defaults.
  const headers = { "X-Payment-Key": key, "Content-Type": "application/json", "X-Compute-Limit": "100000" };
  const inputText = JSON.stringify(input);
  const limits = { max_execution_seconds: 180, max_instructions: 20_000_000_000 };
  const body = `{"input":${inputText},"secrets_ref":${JSON.stringify(secretsRef)},"resource_limits":${JSON.stringify(limits)},"async":true}`;
  // Resume a call that outlived an earlier poll instead of paying for a second one.
  const start = resumeCallId ? { call_id: resumeCallId } : await (await fetch(`${config.outlayerApi}/call/${project}`, { method: "POST", headers, body })).json();
  if (!start.call_id) throw Object.assign(new Error(`OutLayer refused the call: ${JSON.stringify(start).slice(0, 300)}`), { code: "outlayer_refused", status: 502 });
  if (onStarted) await onStarted(start.call_id);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const s = await (await fetch(`${config.outlayerApi}/calls/${start.call_id}`, { headers })).json();
    if (!["pending", "running", "queued"].includes(s.status)) return { ...s, call_id: start.call_id, inputText };
    await sleep(5000);
  }
  throw Object.assign(new Error(`OutLayer call ${start.call_id} did not finish in time`), { code: "outlayer_timeout", status: 504, callId: start.call_id });
}

/** Fetch the TEE attestation of a call and compare it with what was sent and received. */
export async function checkAttestation(callId, { inputText, output, runnerHash }) {
  let att = null;
  for (let i = 0; i < 8 && !att; i++) {
    const t = await (await fetch(`${config.outlayerApi}/attestations/by-call/${callId}`)).text();
    if (t) att = JSON.parse(t); else await sleep(4000);
  }
  if (!att) return { available: false };
  return {
    available: true,
    url: `${config.outlayerApi}/attestations/by-call/${callId}`,
    project_id: att.project_id,
    executed_wasm_sha256: att.executed_wasm_sha256,
    executed_build_ok: att.executed_wasm_sha256 === runnerHash,
    input_hash_ok: att.input_hash === sha256Hex(inputText),
    output_hash_ok: att.output_hash === sha256Hex(JSON.stringify(sortKeys(output))),
    tdx_quote_present: Boolean(att.tdx_quote),
    note: "Intel certificate chain of the quote is not verified by this backend.",
  };
}
