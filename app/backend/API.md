# Kalis backend API (for frontend integration)

Server code `app/backend/`, owned by Claude Code. Frontend (`app/web/`, Next.js) is owned by Codex. Everything runs on **NEAR testnet** and **OutLayer testnet**.

```bash
cd app/backend
npm install          # once
npm start            # http://localhost:8787  (PORT, CORS_ORIGIN env vars optional)
npm run smoke        # full paid run through the API (spends about 0.1 NEAR testnet)
node scripts/smoke.mjs http://localhost:8787 failure   # failing run, refund path
```

Secrets live in `app/backend/.env` (gitignored, testnet keys only): `DEMO_BUYER_ACCOUNT/KEY`, `SETTLER_ACCOUNT/KEY`, `OUTLAYER_PAYMENT_KEY`. The browser never receives any of them.


## Current audit boundary, 14 November 2026

The active frontend is app/web, not the design/app prototype. API and code inspection plus live GET checks are recorded in ../../CURRENT_STATE.md. This contract documents supported operations, not proof that every authenticated browser journey has been exercised.

The encryption rule below applies to the runner payload. Since 15 November 2026 the frontend no longer calls POST /api/protections/private-values. Private-marked values stay in browser IndexedDB for the device outbound check, and the web proxy blocks every /api/protections/ request.

The five protections now use a ciphertext-only relay.

- `GET /api/privacy/config` returns the private runner public keys and mode. In native development it says "Local native development only. This is not a TEE."
- `POST /api/privacy/execute` accepts exactly `{request:{epk,nonce,ct}}` (canonical base64, epk 32 bytes, nonce 12 bytes). The browser seals and signs each operation (credentials, memory, documents, outbound, browser.act, audit.list) with its device key. The private runner verifies owner, revision and nonce, and returns an encrypted result. Errors are `sealed_request_required` (400), `private_runner_unavailable` (503, runner not activated, no plaintext fallback), `private_runner_refused` and `private_attestation_mismatch` (502).
- `POST /api/public-documents` extracts a document only when the user explicitly marks it public (rancangan 65.1).

The protection routes in the table below are the legacy backend contract, kept for history. The private runner is proven only in native development and is not yet deployed as a TEE (`PRIVATE_RUNNER_HASH` is `not-built`), so the whole website still must not claim a deployed operator-blind TEE for protections.

Community request preparation is not chain completion. Legacy bounties with no local evaluator cannot use private tests. The review handler accepts any council member other than the contributor, not only the nominated reviewer. Withholding results after grant revocation is implemented but the earlier product policy remains proposed. See the current-state reconciliation before expanding Social Money.

## The privacy rule for the frontend

The buyer's data is sealed **in the browser** with `kalis-crypto.js` before anything is sent. The server and OutLayer only ever see ciphertext. Keep the `secret` returned by `sealData` in memory on the device; it is the only thing that opens the answer. Never send it to the server.

## Browser crypto module

`GET /kalis-crypto.js` serves `app/backend/src/kalis-crypto.js` (ES module, uses `@noble`). In a static page:

```html
<script type="importmap">
{ "imports": {
  "@noble/curves/": "https://cdn.jsdelivr.net/npm/@noble/curves@1.8.1/",
  "@noble/ciphers/": "https://cdn.jsdelivr.net/npm/@noble/ciphers@1.2.1/",
  "@noble/hashes/": "https://cdn.jsdelivr.net/npm/@noble/hashes@1.7.1/"
} }
</script>
<script type="module">
  import * as kalis from "http://localhost:8787/kalis-crypto.js";
</script>
```

Exports:

| Function | Use |
|---|---|
| `sealData(teePubkey, dataObj)` | Returns `{ sealed, secret, dataCtSha256 }`. Send `sealed` and `dataCtSha256`, keep `secret` |
| `openAnswer(secret, output)` | Returns `{ method_sha256, manifest_sha256, answer, report }` |
| `recheckPortfolio(data, answer)` | Returns `{ passed, checks: [{ id, ok, message }], unverifiable }`. `message` is ready to show |
| `runVerdict({ opened, recheck, checks, completion, attestation, chain })` | Returns `{ status: "safe" \| "attention" \| "do_not_use", reasons: [string] }`. Pass `checks` (from `runChecks`) for manifest v5 methods, `recheck` for the legacy portfolio check |
| `runChecks(manifest, input, answer)` | Manifest v5 buyer checks, see "Manifest v5 and buyer checks" below |
| `verifyCompletion(output, pubkey?)` | Checks the TEE signature on the public completion record |
| `sealMethod(teePubkey, wasmBytes)` | Seller side, used by `scripts/seal-method.mjs` |

## Buyer flow (portfolio method)

1. `GET /api/config`, take `runner.tee_pubkey`.
2. `GET /api/methods`, pick `portfolio-rebalance`, show `latest.manifest.steps`, `latest.price_near`, `latest.payout_split_pct`.
3. In the browser: `const { sealed, secret, dataCtSha256 } = kalis.sealData(teePubkey, portfolio)`.
4. `POST /api/runs` with `{ method_id, data_ct_sha256: dataCtSha256, payment: "demo_topup" }`. The payment is held in escrow on chain. Label this as **mock fiat top-up**. With `payment: "wallet"` the response instead returns `contract_call` for the buyer's own NEAR wallet to sign, then poll `GET /api/runs/:id` until `status` is `Paid`.
5. `POST /api/runs/:id/execute` with `{ data: sealed }`. Takes about 10 s to 3 min (OutLayer queue). Show progress.
6. In the browser: `opened = kalis.openAnswer(secret, exec.output)`, `recheck = kalis.recheckPortfolio(portfolio, opened.answer)`, `verdict = kalis.runVerdict({ opened, recheck, completion: { sigOk: exec.completion.signature_valid }, attestation: exec.attestation, chain: exec.chain })`.
7. Show `opened.answer`, `opened.report.runner_stages` and `opened.report.method_steps.reported` (each `{ id, ok, detail }`), `recheck.checks`, and `verdict`.
8. `POST /api/runs/:id/settle`. Returns `status` `Released` (with `payouts`) or `Refunded` (with `buyer_refund`), plus `settle_tx_url`.

## Endpoints

All responses are JSON. Errors are `{ "error": { "code", "message" } }` with HTTP 4xx/5xx.

| Method and path | Returns |
|---|---|
| `GET /api/health` | `{ ok, network, time }` |
| `GET /api/config` | `network, market, dao, platform, platform_share_pct, min_dao_share_pct, refund_timeout_minutes, runner { project, tee_pubkey, completion_pubkey }, demo_topup { enabled, buyer_account, label }, explorer` |
| `GET /api/methods` | `[{ method_id, owner, title, version_count, latest: Version }]` |
| `GET /api/methods/:id` | `{ method_id, owner, title, version_count, versions: [Version] }` (version history with `parent` and `contributors`) |
| `GET /api/methods/:id/versions/:n/manifest` | `{ raw, manifest_hash }` |
| `GET /api/methods/:id/versions/:n/sealed-method` | Seller-sealed method blob (public) |
| `POST /api/runs` | Body `{ method_id, version?, data_ct_sha256, payment }`. Returns `{ run_id, pay_tx, pay_tx_url, run }` or `{ run_id, contract_call }` |
| `GET /api/runs/:id` | On-chain run `{ buyer, method_id, version, amount_near, status: Paid\|Released\|Refunded, reason, execution }` |
| `POST /api/runs/:id/execute` | Body `{ data: sealed }`. Returns `{ call_id, instructions, time_ms, output, completion { record, signature_valid, key_matches_market }, attestation { executed_build_ok, input_hash_ok, output_hash_ok, url }, chain }`. A second call returns the cached result |
| `POST /api/runs/:id/settle` | Returns `{ settle_tx, settle_tx_url, status, reason, payouts, run }` |
| `GET /api/dao` | `{ dao, balance_near, available_near, council, bounties, proposals }` for the Community view |

`Version` = `{ number, code_hash, manifest_hash, runner_hash, price, price_near, dao_share_pct, payout_split_pct { seller, dao, platform }, parent, contributors, note, published_by, published_at_ns, manifest, method_kind, runnable }`.

## Method kinds (runner v0.5)

Every method has a kind in its manifest (`manifest.kind`, default `wasm`). `version.method_kind` is `{ kind, label, uses_ai, buyer_note }`, built by `kalis.methodKind(manifest)`. **Show `label` and `buyer_note` on the method detail page and at checkout**, so the buyer knows whether they buy a program or a prompt.

| Kind | What the seller sells | Buyer checks |
|---|---|---|
| `wasm`, no AI | Program (WASM), same steps every time | Execution report and device recheck |
| `wasm` with `ai.allowed` | Program that asks the listed private models through `kalis.ai_chat` | Report, `report.ai_calls` (each attested and signed) |
| `prompt` | A sealed prompt the runner sends with the buyer data to the first model in `ai.allowed` | Report steps `ask_model`, `leak_check`, and `ai_calls`. Verdict is at best `attention` |

Seller form: when the seller picks "prompt", show `config.method_kinds.seller_prompt_warning` (also exported as `kalis.PROMPT_SELLER_WARNING`) and require the seller to tick that they accept it.

Prompt answers open as `{ status: "ok", text }` (the model text, often JSON as the prompt asks) or `{ status: "withheld", reason }` when the answer repeated 8 or more words of the seller prompt in a row. A withheld answer fails `leak_check`, so the escrow refunds the buyer.

Demo prompt method: `salary-counteroffer` v1 (price 0.05 NEAR, model DeepSeek V4.1 Flash, fictional offers). Its input is JSON such as `{ role, offer_salary, currency, walk_away, competing_offer, market_median, offer_has }`. `node scripts/smoke.mjs http://localhost:8787 success salary-counteroffer` runs it end to end.

Error codes worth handling: `bad_data_hash`, `unknown_method`, `unknown_version`, `not_runnable`, `payment_failed`, `not_payable_state`, `data_mismatch`, `runner_failed`, `outlayer_timeout`, `settle_rejected`, `not_configured`.

## Honest labels the UI must keep

- Payment `demo_topup` is a **mock fiat top-up**: a platform-held testnet account pays. No real money.
- Portfolio data is synthetic. No trades are placed anywhere.
- The attestation check compares hashes; the Intel certificate chain is not verified by this backend.
- Recheck covers limits and cost only. It cannot prove the answer is the cheapest.
- A prompt method's answer comes from an AI model. Nothing checks that the model followed the seller's rules; say so next to the answer.
- `leak_check` only catches 8 or more prompt words in a row. A paraphrased leak passes.
- Bounty and contributor in the demo are a demo account (`kalis-contrib.testnet`), not a real person.

## Five protections (backend)

Every route below needs the header `X-Kalis-Workspace: <id>` (1-48 letters, digits, `-`, `_`). It is a demo identity, not a login. Each route that acts for a method takes `method_id`; the server reads that method's manifest (latest market version, or the local draft for `tender-bid`) and refuses anything the manifest does not declare. Run `node scripts/protections-test.mjs` for 33 checks.

| Protection | Routes | What the UI shows |
|---|---|---|
| 1 Credentials | `POST /api/protections/credentials` `{connector:"broker_mock", token, scopes:["read"], ttl_minutes}` · `GET /api/protections/credentials` · `POST …/credentials/:id/revoke` · `POST …/credentials/:id/use` `{operation:"read_positions", method_id}` | Connection list with scope, expiry, last use, revoke button. The token is never returned. `use` returns positions for the device to seal |
| 2 Outbound | `POST /api/protections/private-values` `{label, values}` · `POST /api/protections/outbound` `{method_id, destination, content, params}` · `GET …/outbound` · `POST …/outbound/:id/approve` `{action_hash}` · `…/reject` · `…/execute` | Approval card with destination, exact content, `private_values_found`, `reason`. Approve sends back the `action_hash` shown. `blocked` items explain why |
| 3 Memory | `POST /api/protections/memory` `{text, source:{kind:"user"\|"document"\|"web"\|"method", ref}}` · `GET …/memory` · `POST …/memory/:id/approve\|reject\|delete` · `POST …/memory/:id/edit` `{text}` · `GET …/memory/recall?method_id=` | Pending proposals with source and `instruction_like` warning. `note` is a ready sentence |
| 4 Documents | `POST /api/protections/documents` `{method_id, filename, mime, base64}` · `GET …/documents` · `GET …/documents/:id` | `processed_by`, `proof.extraction.signature_valid`, `pii_spans`, `instruction_like`, `note`, `operator_visibility`. **`text` is returned only in the POST response** (and in `browser` download results); the server keeps metadata only (`text_sha256`, `text_chars`, `text_kept: false`). Keep the text on the device and seal it into the run. Images go to the attested Qwen3-VL TEE model, text PDFs to local pdftotext |
| 5 Browser agent | `POST /api/protections/browser` `{method_id, action:"open"\|"download"\|"submit", url, content?}` | `open` returns page text and allowed links, `download` returns a processed document, `submit` returns `{held:true, outbound}` for approval. `login` and undeclared sites are refused |
| Audit | `GET /api/protections/audit` | Event list per protection. No secret values |

Labelled mock services on the same server: `GET /mock/broker/positions` (needs the mock token), `GET /mock/broker/demo-token`, `GET /mock/portal/`, `GET /mock/portal/tenders/T-2026-114`, `GET /mock/portal/docs/T-2026-114.png`, `POST /mock/portal/submit`, `GET /mock/portal/submissions`.

### Connectors (protection 1)

| Connector | Operation | Params (allowlisted values) | Returns | Forbidden |
|---|---|---|---|---|
| `broker_mock` | `read_positions` | none | positions and cash | `place_order`, `withdraw`, `transfer` |
| `sheets_mock` | `read_range` | `sheet`: `sinar-mandiri-cash-13w`, `maju-tender-cost-T-2026-114`, `nusa-data-cap-table` | the sheet as JSON | `write_range`, `delete_sheet`, `share_sheet` |
| `docs_mock` | `read_document` | `doc`: `arunika-supply-contract-draft`, `nusa-data-term-sheet` | `{ doc, title, text }` | `edit_document`, `delete_document`, `share_document` |
| `wallet_mock` | `read_loans` | none | lending position `{ collateral, debt, wallet, target_health_factor }` | `sign_transaction`, `transfer`, `repay`, `borrow`, `approve` |

Use: `POST /api/protections/credentials/:id/use` `{ operation, params, method_id }`. A parameter outside the allowlist gives `bad_param`, a missing one `missing_param`. The method's manifest must declare the connector and operation (`not_in_manifest` otherwise). Demo tokens: `GET /mock/demo-token?connector=<id>` (broker also keeps `GET /mock/broker/demo-token`). `GET /mock/catalog` lists mock sheet and document ids for a picker. Mock services (need the connector's token): `GET /mock/sheets/range?sheet=`, `GET /mock/docs/document?doc=`, `GET /mock/wallet/loans`. All companies, people and accounts are fictional; data files are in `app/backend/mock/productivity-*.json` and `wallet-loan-position.json`.

Which method uses what: `cash-runway-13w` (sheets `sinar-mandiri-cash-13w`), `tender-bid` (sheets `maju-tender-cost-T-2026-114`, cost price IDR 812,000,000), `supplier-concession-plan` (docs `arunika-supply-contract-draft`), `term-sheet-dilution` (sheets `nusa-data-cap-table`, docs `nusa-data-term-sheet`), `defi-liquidation-guard` (wallet `read_loans`). The data the connector returns goes to the buyer's device, which builds the method input and seals it.

Limits the UI must state: credentials, outbound, memory and browser run on the Kalis backend, not in a TEE, so the operator could read them; the browser agent is HTTP-level, not a full browser; documents pass through the backend on the way to NEAR AI.

## Manifest v5 and buyer checks

Spec: `app/methods/MANIFEST_V5.md`. A v5 manifest adds `listing`, `inputs.fields`, `outputs.fields`, optional `derived`, and `buyer_checks` (JSONLogic data). Build the buyer form from `version.manifest.inputs.fields`, the result view from `version.manifest.outputs.fields`, and the card from `version.manifest.listing`. Older versions (v2–v4) have no schema; show their result as raw JSON and say the result cannot be checked on the device (unless it is `portfolio-rebalance`, where legacy `recheckPortfolio` still works).

Browser use, after `openAnswer`:

```js
import * as kalis from "http://localhost:8787/kalis-crypto.js"; // also loads ./checks.js
const checks = kalis.runChecks(version.manifest, buyerData, opened.answer);
const verdict = kalis.runVerdict({ opened, checks, completion: { sigOk: exec.completion.signature_valid }, attestation: exec.attestation, chain: exec.chain });
```

`runChecks` returns `{ checker_version: "kalis-checks/1", results: [{ id, description, status, message }], counts: { pass, fail, cannot_check, not_applicable }, passed, has_cannot_check, no_checks, unverifiable, derived, answer }`.

- `status` is `pass`, `fail`, `cannot_check` (a value is missing, not a number, or the rule errors) or `not_applicable` (the check's `when` was false). Show every row with its `message`; messages already contain the numbers.
- `passed` means no check failed. It is not "everything was proven": show `cannot_check` rows and `unverifiable` too.
- `answer` is the answer the checks used. For prompt methods with `outputs.parse: "json_in_text"` it is the JSON parsed out of the model text; render the result view from it.
- `runVerdict` takes `checks` (v5) or the legacy `recheck`. Any `fail` gives `do_not_use`. `cannot_check`, no checks at all, or an unverifiable status such as `infeasible` gives `attention`. A prompt method is never better than `attention`. Local checks never move escrow money.

| Method and path | Body | Returns |
|---|---|---|
| `POST /api/manifests/validate` | `{ raw: "<exact manifest text>" }` (preferred) or `{ manifest: {...} }` | `{ ok, errors: [{ path, message }], warnings, manifest_hash, manifest_hash_note, manifest_version, kind, method_kind, runnable_capabilities: { kind_supported, ai_models, connectors, proprietary_ai, runnable_if_published } }` |
| `GET /checks.js` | none | The checker module (imported by `/kalis-crypto.js`) |

`manifest_hash` is the SHA-256 of the exact `raw` text: publish those bytes unchanged so the hash on chain matches. Show `errors` next to the seller form fields by `path` (for example `buyer_checks[1].rule`, `listing.urgency`, `inputs.fields[0].source`). The demo seller form should call this before publishing.

New manifests (not yet published on chain): `app/methods/portfolio-rebalance/manifest-v5.json`, `app/methods/salary-counteroffer/manifest-v5.json`. Tests: `node scripts/checks-test.mjs [base url]` (50 checks, including agreement with `recheckPortfolio` on the 12 reference cases and 1,440 random trade lists).

## Document text retention (protection 4)

The backend no longer writes extracted document text to disk. `POST /api/protections/documents` returns `text` once; `GET /api/protections/documents` and `GET …/:id` return metadata with `text_kept: false` and `text_note`. Every document response carries `operator_visibility` ("The Kalis backend saw this document on its way to NEAR AI. Do not upload private documents."). Show that sentence next to the upload control. `node scripts/scrub-document-text.mjs [data dir]` removes text stored by older servers.

## File import on the device (.xlsx, .docx)

`GET /file-import.js` serves `src/file-import.js`, a dependency-free ES module. The file is parsed in the browser (zip reader with `DecompressionStream("deflate-raw")`) and never uploaded. Seal the values you take from it like typed input.

```js
import { parseXlsx, parseDocx, sheetToObjects, parseOfficeFile } from "http://localhost:8787/file-import.js";
const book = await parseXlsx(await file.arrayBuffer());   // { kind:"xlsx", sheets:[{ name, rows:[[cell|null, ...]] }], parsed_on:"this device" }
const lines = sheetToObjects(book.sheets[0]);              // rows after the header row as objects keyed by header text
const doc = await parseDocx(await file.arrayBuffer());     // { kind:"docx", paragraphs:[string], tables:[[[cell text]]], text }
```

Cells are numbers, strings, booleans or `null`. Formulas are not evaluated (Excel's cached value is used), dates come back as Excel serial numbers, 10 MB maximum. Errors are `FileImportError` with `code`: `not_zip`, `not_xlsx`, `not_docx`, `unsupported_type`, `unsupported_compression`, `too_large`, `empty`, `unsupported` (no DecompressionStream). Fictional fixtures: `mock/files/cash-13-week-cv-sinar-mandiri.xlsx` (sheets "Cash plan" with columns `Item, Type, W1..W13` in IDR million, and "Facts") and `mock/files/term-sheet-lumbung-tani.docx` (terms as paragraphs, cap table as a table). Regenerate with `python3 -I scripts/make-import-fixtures.py mock/files`. Test: `node scripts/file-import-test.mjs [base url]` (9 checks).

## Ratings and reviews

Rules (RANCANGAN 65.4): one rating 1–5 per run; the caller must be the principal that created the run on this server and the run must be executed (runner output stored). Released and Refunded both count. The review is bound to the run's paid version. Zero reviews give `average: null` and `label: "No ratings yet"`. User reviews are separate from seller test evidence.

| Method and path | Body or query | Returns |
|---|---|---|
| `GET /api/methods/:id/reviews` | `cursor`, `limit` (1–100), `version` | `{ items: [Review], next_cursor, order: "created_at desc", summary }` |
| `GET /api/methods/:id/rating-summary` | `version` optional | `{ method_id, scope, count, average (2 decimals or null), distribution {1..5}, label, note }` |
| `GET /api/runs/:id/review-eligibility` | caller identity | `{ run_id, eligible, reason, message, method_id, version, run_status, existing_review_id }`. `reason`: `executed_run`, `not_executed`, `not_your_run`, `unknown_run`, `already_reviewed`, `own_method` (the signed-in account owns the method on chain) |
| `POST /api/methods/:id/reviews` | `{ run_id, rating, comment?, privacy_acknowledged: true, idempotency_key? }` (or `Idempotency-Key` header) | `{ review, summary, replayed }` |

`Review` = `{ id, method_id, version, run_id, rating, comment, author, author_kind, purchase_verified: true, run_status, created_at }`. `author` is the NEAR account when signed in, otherwise "Demo buyer <6 hex>". Comments are at most 1000 characters and contain only what the buyer typed. Errors: `bad_rating`, `comment_too_long`, `privacy_not_acknowledged` (400), `not_your_run`, `not_executed`, `unknown_run`, `own_method` (403), `already_reviewed` (409, `details.existing_review_id`), `wrong_method` (409), `idempotency_conflict` (409). No edit, delete or moderation yet (not decided).

## Transactions, earnings, balance, activity

| Method and path | Returns |
|---|---|
| `GET /api/me/transactions` | `cursor`, `limit`, `type`. `{ principal, items: [Entry], next_cursor, order: "occurred_at desc", note }` for runs the caller created |
| `GET /api/me/earnings` | Signed-in NEAR account, or `?account=<seller>` for the public read-only view. `{ account, view, seller_allocations { items, total_paid, scope }, bounty_income { items, total_paid, scope }, note }`. Without either: `{ status: "unavailable", reason }` |
| `GET /api/me/balance` | Always `{ status: "unavailable", reason }`: no custodial ledger, and the mock fiat top-up is not a balance |
| `GET /api/activity` | `cursor`, `limit`, `resource_type`. `{ principal, items: [Activity], next_cursor, order, note }` |

`Entry.type`: `escrow_hold` (payment held by the contract; `funding` is `mock_fiat_topup` or `buyer_wallet`), `release` (with `split { seller, dao, platform }`), `stage_refund`, `timeout_reclaim`. Every amount is `{ value (integer yocto string), asset: "NEAR", decimals: 24, network, display }`, and `seller + dao + platform === amount` exactly. Entries carry `run_id, method_id, version, tx, tx_url, occurred_at, status, note`. Storage deposit refunds and gas are not listed.

Earnings items: `seller_allocation` (from runs settled through this server) and `bounty_income` (approved `BountyDone` proposals in the DAO paying that account, read from chain). The two totals are never added together; bounty income is not a royalty.

`Activity` = `{ id, resource_type (run | memory | outbound | credentials | documents | browser | review), resource_id, kind (e.g. run.paid, protection.memory.approved, review.created), actor, status, occurred_at, summary }`. Summaries hold no buyer data, answers, prompts or tokens. Protection audit events appear for the same demo workspace. Test: `node scripts/reviews-activity-test.mjs [base url]` (31 checks, spends about 0.1 NEAR testnet).

## Sign in with a NEAR account (NEP-413)

A session proves the caller controls a NEAR account. `X-Kalis-Workspace` stays available as a demo label and proves nothing.

1. `POST /api/auth/challenge` `{account_id, ttl_seconds?}` (ttl 5–300, default 300) returns `{challenge_id, account_id, message, nonce (32 bytes, base64), recipient: "kalis.app", callback_url: null, expires_at, standard: "NEP-413"}`.
2. The wallet signs the NEP-413 payload `{message, nonce, recipient}` (wallet `signMessage`). The signed bytes are `sha256(borsh(u32 2147484061, message, [u8;32] nonce, recipient, Option<string> None))`.
3. `POST /api/auth/verify` `{challenge_id, account_id, public_key: "ed25519:...", signature (base64, 64 bytes)}` returns `{session_token, account_id, expires_at, token_type: "Bearer"}` (12 h). The server checks the signature and that `public_key` is a **full access** key of the account on chain. A function-call key is refused.
4. Send `Authorization: Bearer <session_token>` on later calls. `POST /api/auth/logout` revokes it.

A challenge allows exactly one verify attempt, successful or not. Errors: `challenge_used`, `challenge_expired` (410), `account_mismatch`, `signature_invalid`, `key_not_on_account`, `not_full_access`, `session_invalid` (401), `login_required` (401, for owner-only routes called with a demo workspace).

| Route | Returns |
|---|---|
| `GET /api/me` | `{id, kind: near_account\|demo_workspace, account_id, demo, display_name, bio, linked_accounts, permissions, session_expires_at, note}` |
| `PATCH /api/me` `{display_name?, bio?}` | Profile. Demo profiles get " (demo)" appended to the display name |
| `GET /api/me/preferences` | `{default_models: null\|[model ids], reduced_motion, revision, note}` |
| `PATCH /api/me/preferences` `{default_models?, reduced_motion?, expected_revision?}` | Only attestable models. A preference narrows a method's allowlist, never widens it, and is not consent for any run |

## Seller publication

Every route except `GET /api/creators/:account` needs a NEAR session. The server never signs for a seller and never accepts plaintext prompts or code.

| Route | Body | Returns |
|---|---|---|
| `GET /api/creators/:account` | | `{account_id, display_name, bio, profile_source, methods: [{method_id, title, version_count, latest_version, price}], attribution}` |
| `GET /api/me/methods` | `?state=&cursor=&limit=` | `{listed: [methods owned on chain], drafts: [Draft], next_cursor}` |
| `POST /api/methods/:id/cover` | `{mime: image/png\|image/jpeg\|image/webp, base64}` | `{method_id, cover_url, mime, size, sha256}`. Owner of the on-chain method, or owner of a draft for a method not yet on chain. Max 512 KB, magic bytes checked, SVG refused (`bad_mime`, `bad_image`, `too_large`, `not_owner`). Served publicly by `GET /api/methods/:id/cover` with `nosniff`; `GET /api/methods` rows carry `cover_url` (null when unset). Test: `node scripts/cover-test.mjs [base url]` (10 checks, free) |
| `POST /api/method-drafts` | `{method_id, kind: wasm\|prompt, title, description?, category?, cover_ref?}` | Draft (revision 1). `not_owner` if the method exists and belongs to another account |
| `GET /api/method-drafts/:id` | | Draft |
| `PATCH /api/method-drafts/:id` | `{expected_revision, manifest?, price_yocto?, dao_share_pct?, parent?, title?, description?, category?, cover_ref?, seller_prompt_warning_accepted?: {version}}` | Draft. `revision_conflict`, `draft_locked` after publication |
| `POST /api/method-drafts/:id/artifact` | `{sealed: {epk, nonce, ct}, code_hash, kind, size}` | `{artifact, ciphertext_sha256, revision, note}`. `plaintext_refused` if the body has `prompt`, `wasm_base64`, `wasm`, `plaintext`, `source` or `code` |
| `POST /api/method-drafts/:id/validate` | | `{ok, revision, errors: [{path, message}], warnings, manifest_hash, kind, method_kind, runnable_capabilities, seller_prompt_warning_version, buyer_note}` |
| `POST /api/method-drafts/:id/publish` | `{expected_revision, idempotency_key?}` | `{publication_id, status: "pending_signature", signer, expected_version, manifest_hash, manifest_file, code_hash, runner_hash, calls: [ContractCall], next}`. A retry returns the same publication with `replayed: true`. `draft_invalid` (422) with `details.errors` |
| `POST /api/method-drafts/:id/confirm` | `{tx_hash?}` | `{published, method_id, version, publication}` once a chain version with the draft's code, manifest and runner hashes, published by the seller, exists. `not_on_chain_yet` before that |
| `GET /api/methods/:id/versions/:n/evidence` | | `{available: true, title, dataset, protocol, metrics, tested_at, method_code_hash, verifier, limits}` or `{available: false, reason}`. Evidence is separate from ratings |

`ContractCall` = `{receiver_id, method_name, args, deposit_yocto, gas_tgas}`. Sign them in order (`register_method` only appears for a new method). Each attaches 0.1 NEAR for storage; the contract refunds the excess.

Seller form steps: seal the method on the device with `kalis.sealMethod(config.runner.tee_pubkey, bytes)` and compute `code_hash = sha256Hex(bytes)`, upload with `/artifact`, edit the manifest (v5, see "Manifest v5 and buyer checks"), show `config.method_kinds.seller_prompt_warning` for prompts and send `seller_prompt_warning_accepted: {version: config.method_kinds.seller_prompt_warning_version}`, validate, publish, sign, confirm.

Validation rules: manifest v5 passes `validateManifest`; `manifest.method_id`, `kind` and `dao_share_percent` equal the draft's; price > 0; DAO share 10 to 90; artifact present and of the same kind; prompts need the current warning version.

Limit: the server cannot check that `code_hash` matches the sealed plaintext. The runner reports the real hash in the signed completion and the escrow refuses to settle a run whose method hash differs from the published `code_hash`, so a wrong hash makes every run refund.

## Preflight and run evidence

`GET /api/config` `runner` now also has `build_hash` (runner build new versions are published against), `key_version`, `attestation_note` and `preflight_note`. Seal only to `runner.tee_pubkey`, and compare a run's attested build with the paid version's `runner_hash`.

`GET /api/runs/:id/evidence` (public) returns:

- `chain`: status, buyer, amount, paid version and its expected `code_hash`, `manifest_hash`, `runner_hash`, and the market's runner key.
- `commitments`: input and output ciphertext hashes, plus the output ciphertext and nonce.
- `completion`: record text, signature, `signature_valid`, `signer_matches_market`, and per-field matches against the chain.
- `execution`: `call_id`.
- `attestation`: `url` and executed build.
- `verification`: `{checks, status: verified_with_limits | mismatch | incomplete | not_executed}`. `intel_nvidia_certificate_chain` is always `not_verified`.
- `limits`.

No plaintext answer, no secret. Reloading it does not decrypt the answer.

## Community: issues, bounties, contributions (group D)

Authority comes only from the Sputnik DAO policy of `kalis-fund.sputnik-v2.testnet` on chain (RANCANGAN 65.4). Every step that moves money or uses authority returns an **unsigned contract call** `{ receiver_id, method_name, args, deposit_yocto, gas_tgas, signer_must_be }` for the named wallet to sign. Status is always re-read from chain afterwards, never assumed. Money is `{ value (yocto string), asset, decimals, network, display }`. Every object carries relation ids and `allowed_actions`.

Writes marked **account** need a verified NEAR session (`Authorization: Bearer <session>`, principal kind `near_account`). A demo workspace gets `401 login_required`. **council** additionally needs the account in the DAO council role (`403 not_council`).

| Method and path | Who | Returns |
|---|---|---|
| `GET /api/community/config` | anyone | dao, council, `proposal_bond`, `bounty_bond`, vote policy, `rules[]` (`competing_claimers`, `disputes`, `royalty` are `unavailable` with reason) |
| `POST /api/issues` `{method_id, version?, module, problem, expected, synthetic_reproduction}` | anyone (demo labelled) | Issue `{id, state: open\|proposed\|funded\|closed, demo, proposal_ids}` |
| `GET /api/issues`, `GET /api/issues/:id`, `POST /api/issues/:id/close {reason}` | owner closes | Issue |
| `POST /api/proposals` `{issue_id, budget_yocto, acceptance_criteria[], evaluator:{compare:{fields[], tolerance}, min_cases}, reviewer, deadline_ns?}` | account | Proposal link with `contract_call` = `add_proposal` AddBounty (bond attached). Description ends with `[kalis:<id>]`, which is how chain proposals and bounties are matched back |
| `GET /api/proposals`, `GET /api/proposals/:id` | anyone | `{..., dao_proposal_id, chain_status: awaiting_signature\|InProgress\|Approved\|Rejected\|..., vote_counts}` |
| `POST /api/proposals/:id/vote {vote: approve\|reject}` | council | `contract_call` = `act_proposal` |
| `GET /api/bounties`, `GET /api/bounties/:id` | anyone | Chain bounty joined with `issue_id`, `acceptance_criteria`, fixed `evaluator`, `reviewer`, `contributions` |
| `POST /api/bounties/:id/claim {deadline_ns?}` | account | `contract_call` = `bounty_claim` (claim bond) |
| `POST /api/bounties/:id/contributions` `{candidate:{sealed, code_hash}, base_version, target_module, description, impact, regression_cases}` | account (demo becomes `draft_demo`, never payable) | Contribution `{state: submitted\|tested\|accepted\|rejected\|changes_requested\|draft_demo, validation{needs_owner_access, ...}}`. Refused: `cannot_change_evaluator` (any evaluator/criteria field), `base_version_mismatch`, `candidate_too_large` |
| `GET /api/contributions/:id` | anyone | Contribution (sealed candidate never returned) |
| `POST /api/contributions/:id/tests {grant_ids[]}` | the contributor | Test run `{status: passed\|failed\|error, report:{per_case[], summary, report_sha256}}` |
| `GET /api/test-runs/:id` | anyone | Test run |
| `POST /api/contributions/:id/reviews {decision: accept\|reject\|request_changes, reason, test_run_ids[]}` | council, not the contributor (`self_review`) | Contribution with the review and immutable `test_reports[{id, report_sha256}]`. Accept needs the latest completed test of this exact candidate to have passed (`needs_passing_test`) |
| `POST /api/bounties/:id/payout {contribution_id}` | the contributor, accepted only | `payout.contract_call` = `add_proposal` BountyDone to the contributor (the deployed Sputnik `bounty_done` rejects the bond, BUILD_STATUS 6.12). Once per bounty; retry returns the same call (`replayed: true`) |
| `POST /api/contributions/:id/publish-version` | anyone requests, the method owner signs | `publish.contract_call` = market `publish_version` with the tested `code_hash`, `parent` = base version and `contributors` = [contributor]. The sealed candidate is stored as the new version's sealed build. Retry is `replayed: true` |

## Private test cases and grants (group E)

A case is sealed on the owner's device to the runner TEE key (`kalis.sealData(config.runner.tee_pubkey, case)`), the same sealing as buyer data. Plaintext is never accepted. A normal run never grants testing or training access.

| Method and path | Who | Returns |
|---|---|---|
| `POST /api/private-test-cases {method_id, version?, sealed_case, case_ct_sha256, label}` | owner | Metadata only. `case_hash_mismatch` if the hash is not of the ciphertext |
| `GET /api/private-test-cases` | owner | Owner's case metadata (no ciphertext) |
| `POST /api/private-test-cases/:id/grants {contribution_id \| code_hash, purpose:"testing", allowed_output:["per_check_status","counts"], attempt_limit (1-20), expires_at, explicit_consent:true}` | owner | Grant `{status: active\|revoked\|expired\|exhausted, attempts_used}` |
| `GET /api/test-grants`, `POST /api/test-grants/:id/revoke` | owner | Revoke is idempotent (`already_revoked`) |

Evaluation runs only inside the runner (`evaluate` command). It opens baseline, candidate and case, runs both in the sandbox, compares the evaluator's fixed fields (`status` always; numbers within tolerance) and returns only `per_check[{field, status}]`, `counts` and `both_reports_ok`, plus a record signed with prefix `kalis-evaluation:v1:` by the runner key. The backend checks the signature and that the record's candidate, baseline and case hashes are the expected ones. A grant attempt is reserved atomically before running; wrong method, wrong candidate, revoked, expired or exhausted grants are `refused` per case.

**Proposal pending Dien's decision:** if the owner revokes a grant while its test is running, the test finishes but its result is withheld (`withheld_revoked`).

Development path: with `KALIS_LOCAL_RUNNER=<native runner>` and `KALIS_LOCAL_SEAL_KEY`, the backend runs `evaluate` locally (labelled `local_runner (development only, not a TEE)`) and reads baselines from `<data dir>/sealed-dev/`. Without it, it calls the OutLayer runner, which needs the runner build with `evaluate` deployed.

## Contribution package (H7)

`GET /api/methods/:id/versions/:n/contribution-package` returns the version's inputs/outputs/steps/buyer_checks, the interface (exports `memory`, `alloc`, `run`; import `kalis.ai_chat` only when the manifest allows a model), `open_modules` (from manifest `open_modules`, else empty with "private core: interface only"), synthetic examples, the evaluator contract, change limits and how to submit. It never contains private source or seller prompts. A fix to a module not in `open_modules` is flagged `needs_owner_access`.

## Run-bound protections (H4), effective state (H8), artifacts and provenance (H5)

- Every protection route that takes `method_id` also takes `run_id` (body, or query for `memory/recall`). With `run_id` the server uses the manifest of the version that run paid for, refuses a run owned by another principal (`not_your_run`), a different method (`method_mismatch`) or an unpaid run (`run_not_paid`). Publishing a new version never changes the policy of an old run. A revoked or expired credential stays unusable whatever the run. Without `run_id` the response manifest `_source` says "latest market version (not bound to a paid run)".
- `GET /api/protections/credentials` items add `effective_state` (`active`, `expired`, `revoked`), `changed_at`, `allowed_actions`. `GET /api/protections/memory` items add `effective_state`, `allowed_actions`, `given_to_methods`.
- `POST /api/artifacts` `{ sealed: {epk, nonce, ct}, kind, label, classification, source_refs, run_id?, draft_id? }` stores ciphertext only (plaintext fields refused). `GET /api/artifacts`, `GET /api/artifacts/:id` (metadata), `GET /api/artifacts/:id/ciphertext` (owner only), `DELETE /api/artifacts/:id`.
- Run drafts accept `input_sources: [{ field, kind: typed|document|connector|memory|browser|file_import, ref, sha256, revision, reviewed_by_buyer }]`. A changed source clears consent. A document source not reviewed by the buyer carries a note that it must not be treated as fact. Run detail returns `input_sources` to the owner.
- Buyer model narrowing: a draft whose `models` list is narrower than the seller allowlist is passed to the runner as `ai_restrict` and enforced in the TEE. The sealed report then carries `ai_policy`.
- OutLayer calls ask for `resource_limits.max_execution_seconds: 180` and `X-Compute-Limit: 100000`, because prompt methods can exceed the 60 s default.

Tests: `scripts/run-bound-test.mjs` (7), `scripts/artifacts-test.mjs` (9).
