# Backend integration

Normal application pages now default to backend mode. The banner toggle switches explicitly to an isolated mock demo. /connected/runs remains the encrypted buyer execution surface, reached from registered method versions. See COVERAGE.md for all connected operations and unsupported API boundaries.

## Start

Run the existing app/backend server on 8787, then restart the Next.js server from app/web so the new API route is discovered. npm run dev -- --port 3311. For production locally, npm run build followed by npm start -- --port 3311. KALIS_BACKEND_URL is a server-only setting, default http://127.0.0.1:8787. No backend secret is copied into frontend environment variables.

## Connected surfaces

/connected/methods and /connected/runs load backend config and registry methods. The portfolio path seals synthetic JSON in the browser, requests a version-pinned escrow using demo_topup only after explicit testnet payment consent, executes with ciphertext, opens the answer locally, verifies the completion signature/key/run/data binding and compares the answer to the paid version snapshot, then displays buyer checks and settlement. Payment requests are never automatically retried. An uncertain payment response must be reconciled before creating another payment.

Session secrets and original portfolio stay in memory. Only the public run reference is written to sessionStorage. Refresh loses the decryption key. The interface can inspect the previous on-chain reference but cannot recover the answer without the key. Never submit real private data while testing this integration.

/connected/dao reads backend balances, proposals and bounties. DAO write endpoints are not exposed by the current API, so proposal/vote/payout in the existing demo stay mock.

/connected/protections is an advanced API integration panel for credentials, private-value registration, outbound review, memory, documents and browser operations. It lists backend records and can approve/reject/revoke/use/execute selected records. Outbound approval returns the exact action_hash. These operations follow backend policy, not the mock reducer. The advanced panel remains available for diagnosis. Normal Connections, Memory, Files, Activity, Browser and Community pages now call their backend endpoints directly. Files uses a PDF/image picker and base64 ingestion, explicitly disclosed as plaintext upload to the backend, not encrypted document upload.

## Security boundary

The Next proxy has an explicit API path allowlist and requires matching Origin for writes. It forwards only JSON and a validated demo workspace identifier. Browser cookies and backend signing keys are not forwarded. Workspace IDs are demo identities, not authentication. No public deployment is authorized.

Copied browser crypto source is app/backend/src/kalis-crypto.js, with noble versions pinned to the same versions as the backend. Keep this copy aligned during integration. Certificate root validation is not implemented. Attestation comparisons alone do not establish full Intel-chain verification or universal method quality.

## Verification

Typecheck and production build pass. npm test runs 23 TypeScript tests (20 existing plus 3 proxy checks) and three browser-crypto tests. Direct read-only backend health/config/method requests succeeded. No paid run, settlement, protection mutation or testnet spending was performed by Codex.

Existing server 3311 was still running the old application and returned the old catch-all page for the new API URL. A replacement process could not bind port 3312 (EPERM). Restarting the existing frontend is required before browser end-to-end verification. Do not describe a live paid integration or all existing pages as verified.
