// Public evidence bundle for one run, for independent verification after a reload. Contains only what
// is already public: the signed completion record, ciphertext commitments, hashes from the chain and
// the OutLayer attestation comparison. Never the plaintext answer or the buyer's decryption secret.
import { config } from "./config.js";
import { view } from "./near.js";
import { sha256Hex, fromB64, verifyCompletion } from "./kalis-crypto.js";
import { ApiError, chainRun, readExecution, money } from "./market.js";

export function registerEvidenceRoutes(route) {
  route("GET", /^\/api\/runs\/([^/]+)\/evidence$/, async (_q, [id]) => {
    const run = await chainRun(id);
    if (!run) throw new ApiError(404, "unknown_run", `No run "${id}" in ${config.market}`);
    const [v, cfg] = await Promise.all([
      view(config.market, "get_version", { method_id: run.method_id, number: run.version }),
      view(config.market, "get_config"),
    ]);
    const exec = readExecution(id);
    const out = exec?.output || null;
    let completion = null;
    if (out?.completion && out?.completion_sig) {
      const c = verifyCompletion(out, cfg.runner_pubkey);
      const r = c.record;
      completion = {
        record_text: out.completion, signature: out.completion_sig, signer_pubkey: out.completion_pubkey,
        signature_valid: c.sigOk, signer_matches_market: c.keyOk, record: r,
        matches: {
          run_id: r.run_id === id,
          data_ct_sha256: r.data_ct_sha256 === run.data_ct_sha256,
          method_sha256: r.method_sha256 === v.code_hash,
          manifest_sha256: r.manifest_sha256 === v.manifest_hash,
        },
      };
    }
    const att = exec?.attestation || null;
    const checks = {
      completion_signed_by_market_key: completion ? completion.signature_valid && completion.signer_matches_market : null,
      completion_matches_chain: completion ? Object.values(completion.matches).every(Boolean) : null,
      executed_build_matches_version: att?.available ? att.executed_build_ok : null,
      input_hash_matches_attestation: att?.available ? att.input_hash_ok : null,
      output_hash_matches_attestation: att?.available ? att.output_hash_ok : null,
      intel_nvidia_certificate_chain: "not_verified",
    };
    const known = Object.entries(checks).filter(([k, x]) => k !== "intel_nvidia_certificate_chain" && x !== null);
    return {
      run_id: id,
      chain: {
        contract: config.market, status: run.status, reason: run.reason || null, buyer: run.buyer, amount: money(run.amount),
        paid_at_ns: String(run.paid_at_ns), method_id: run.method_id, version: run.version,
        expected: { code_hash: v.code_hash, manifest_hash: v.manifest_hash, runner_hash: v.runner_hash },
        runner_pubkey: cfg.runner_pubkey,
      },
      commitments: {
        input_ciphertext_sha256: run.data_ct_sha256,
        output_ciphertext_sha256: out?.ct ? sha256Hex(fromB64(out.ct)) : null,
        output_ciphertext_b64: out?.ct || null, output_nonce_b64: out?.nonce || null, tee_pubkey: out?.tee_pubkey || null,
      },
      completion,
      execution: exec ? { call_id: exec.call_id || exec.failed?.call_id || null, executed_at: exec.at || null, failed: exec.failed || null } : null,
      attestation: att ? { url: att.url || null, executed_wasm_sha256: att.executed_wasm_sha256 || null, available: att.available, tdx_quote_present: att.tdx_quote_present ?? null } : null,
      verification: {
        checks,
        status: !exec ? "not_executed" : known.length && known.every(([, x]) => x === true) ? "verified_with_limits" : known.some(([, x]) => x === false) ? "mismatch" : "incomplete",
      },
      limits: [
        "The Intel TDX and NVIDIA certificate chains are not verified by this backend (not_verified).",
        "This bundle proves which build ran on which ciphertext and that the TEE signed the completion. It does not reveal or check the answer.",
        "Opening the answer needs the secret kept on the buyer's device. Reloading this bundle does not decrypt anything.",
        "Attestation hash comparisons were made by this server when the run executed; the attestation URL lets anyone repeat them.",
      ],
    };
  });
}
