// What this server can actually do right now. The frontend shows features from this list instead of
// guessing. Status: enabled, demo (works, but with a labelled mock or demo identity), read_only,
// unavailable (with the reason). Update this list whenever a feature lands.
import { config } from "./config.js";

export function capabilities() {
  const has = (k) => Boolean(config.secrets[k]);
  const f = (id, status, reason, extra = {}) => ({ id, status, reason, ...extra });
  return {
    network: config.network,
    auth_mode: { current: "near_account_or_demo", supported: ["near_account", "demo_workspace"], note: "Sign in with a NEAR account through a NEP-413 signed challenge (POST /api/auth/challenge, /api/auth/verify) and send Authorization: Bearer <session_token>. Without it, X-Kalis-Workspace is a demo label, not proof of ownership." },
    payment_modes: [
      { id: "demo_topup", status: has("demoBuyer") ? "demo" : "unavailable", reason: "Mock fiat top-up. A platform-held testnet account pays. No real money moves." },
      { id: "wallet", status: "enabled", reason: "The API returns an unsigned contract call for the buyer's NEAR wallet." },
    ],
    method_kinds: [
      { id: "wasm", status: "enabled", reason: "Seller WASM in the wasmi sandbox; may call models listed in its manifest through kalis.ai_chat." },
      { id: "prompt", status: "enabled", reason: "Sealed seller prompt sent to one private attested model. Verdict is at best attention." },
    ],
    ai_routes: [
      { id: "private_attested", status: has("nearAiKey") ? "enabled" : "unavailable", reason: "NEAR AI Cloud models with fresh-nonce attestation and signed responses." },
      { id: "proprietary", status: "unavailable", reason: "The runner does not support proprietary models yet (no consent, redaction or enforcement path)." },
    ],
    features: [
      f("run_list", "enabled", "Runs created by the calling principal, cursor pagination."),
      f("run_drafts_quotes", "enabled", "Draft, revision-bound consent and quote before payment."),
      f("payment_idempotency", "enabled", "Idempotency-Key header or idempotency_key in the body."),
      f("async_execution", "enabled", "POST /api/runs/:id/execute with {async:true}, then poll the operation."),
      f("timeout_reclaim", "enabled", "Uses the contract's refund_expired after the timeout."),
      f("buyer_model_narrowing", "enabled", "A narrower model list on the run draft is sent to the runner as ai_restrict and enforced inside the TEE (runner build 823e9913)."),
      f("run_bound_protections", "enabled", "Protection requests with run_id use the manifest of the version that run paid for, owned by the caller. Without run_id they use the latest version and say so."),
      f("private_artifacts", "enabled", "POST /api/artifacts stores ciphertext only, owner access only. Retention policy is not decided; DELETE removes it at once."),
      f("input_provenance", "enabled", "Run drafts record where each input came from (document, connector, memory, browser, file import, typed) and whether the buyer reviewed it."),
      f("five_protections", "demo", "Run on the Kalis backend, not in a TEE. The operator could read them."),
      f("ratings", "enabled", "One rating 1-5 per executed run, by the principal who created it. Zero ratings show as null, not 0."),
      f("transactions_activity", "enabled", "Escrow hold, release split, stage refund and timeout reclaim from the contract; activity feed of runs, protection audit and reviews."),
      f("earnings", "read_only", "Public read-only seller view with ?account=. Owner view needs NEAR sign-in."),
      f("balance", "unavailable", "No custodial ledger. The mock fiat top-up is not a balance."),
      f("file_import", "enabled", "GET /file-import.js parses .xlsx and .docx on the buyer device; the file is never uploaded."),
      f("document_text_retention", "enabled", "Extracted document text is returned once and not stored. The backend still sees the document on its way to NEAR AI."),
      f("seller_publication", "enabled", "Drafts, sealed artifact upload, validation and publication through unsigned contract calls the seller's NEAR wallet signs. Needs NEAR sign-in."),
      f("profiles_preferences", "enabled", "Profile and preferences per principal. Demo profiles are labelled demo. Preferences only narrow model lists."),
      f("version_evidence", "enabled", "Per-version test evidence when the seller provides it; separate from ratings."),
      f("run_evidence", "enabled", "GET /api/runs/:id/evidence: signed completion, ciphertext commitments, chain hashes and attestation comparison. No plaintext."),
      f("community_write", "enabled", "Issues, bounty proposals, votes, contributions, private tests, reviews, payout and new versions. Money and authority steps are unsigned calls for the right wallet; authority is read from the Sputnik DAO policy. Competing claimers and disputes are not decided (see /api/community/config)."),
      f("private_test_cases", "enabled", "Cases sealed to the runner TEE key, separate grants with attempt limit and expiry. Evaluation runs inside the runner (evaluate command, needs runner build 823e9913 or later deployed); the candidate sees pass or fail per field and counts only."),
    ],
    limits: [
      "Intel and NVIDIA certificate chains are not verified by this backend.",
      "Uploaded documents are read by the backend on their way to NEAR AI. Do not upload private documents.",
    ],
  };
}
