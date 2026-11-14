# Kalis

Kalis is a marketplace for private expert methods. Authors publish a WASM program or a prompt, buyers run a selected version, and part of each successful payment funds improvements through Sputnik DAO. Built for NEAR Hackathon 2026, targeting Privacy & Private AI, Social Money and Open Innovation.

The active website is Next.js in app/web, backed by app/backend and NEAR testnet. Runner execution uses OutLayer testnet and private AI on NEAR AI Cloud. Demo people, businesses and inputs are fictional. External connectors, the procurement portal and fiat top-up are labelled mocks. Payment settlement uses real testnet transactions.

The core runner accepts encrypted methods and inputs, then returns an encrypted answer. The five protections (connections, notes, documents, outbound approval and the browser agent) now use a sealed protocol. The browser encrypts each operation for a separate private runner, and the backend only relays ciphertext. **The private runner is deployed on OutLayer testnet as `scientivan.testnet/kalis-private` (build `457e260c…`), with a seal key generated inside the TEE and locked to that build. An end-to-end test through the backend relay passed for notes.** If the backend starts without the private runner keys, protection pages refuse with `private_runner_unavailable` instead of falling back to plaintext. See the limits below before using data.

## Try the local website

Use Node.js 20.9 or newer supported by the installed Next.js version and install from the lockfiles. In one terminal, from this repository root run

```bash
cd app/backend
npm ci
npm start
```

In another terminal, from this repository root run

```bash
cd app/web
npm ci
npm run dev
```

Open http://127.0.0.1:3000/marketplace to see methods read from the backend. Open /community to see the testnet fund and council, /community/proposals for funding proposals, and /community/bounties for bounties. Switch Consumer/Author in the rail to reach author Create and Published. Account is in the connected wallet menu. Roles organise navigation and do not grant authority.

Check backend availability without signing or payment

```bash
curl http://127.0.0.1:8787/api/health
curl http://127.0.0.1:3000/api/backend/api/health
```

Both should return JSON with ok true and network testnet. The frontend proxy defaults to http://127.0.0.1:8787. Set server-side KALIS_BACKEND_URL when the backend is elsewhere. The demo requires internet access to NEAR RPC and the relevant OutLayer/NEAR AI services.

Backend secrets belong in app/backend/.env or the root .env, both gitignored. DEMO_BUYER_ACCOUNT/DEMO_BUYER_KEY enable the mock test top-up, SETTLER_ACCOUNT/SETTLER_KEY enable backend settlement, OUTLAYER_PAYMENT_KEY enables execution, and NEAR_API_KEY enables private AI. Credential features also use CREDENTIAL_KEY and MOCK_BROKER_TOKEN. Do not put secrets in NEXT_PUBLIC variables or commit them. GET /api/capabilities reports what the running configuration can do. Wallet operations need a funded NEAR testnet account and the user's own signature.

This is not a credential-free, fully offline demo. Existing registered methods require their matching manifests and sealed artifacts on the backend. Seller-private source is excluded from the repository. Historical testnet success does not mean a new checkout automatically has funded accounts or all deployment secrets.

## How a run works

1. Pick a method and version. Its manifest defines inputs, output fields, access, price, checks and allowed AI models. Programs can call private AI, while prompts are labelled as prompts.
2. Review inputs, declared sources and terms. The browser seals the run input to the runner key. Private-marked values are kept only in this browser (IndexedDB, 24 hours) for the outbound check. They are no longer sent to the backend.
3. Review the quote and pay into the NEAR market escrow. The mock fiat top-up pays from a platform testnet account. Wallet payment prepares a call for the buyer to approve.
4. The OutLayer TEE runner opens the method/data and runs WASM in wasmi. Its model route is NEAR AI Cloud. AI calls use fresh-nonce attestation and response signatures. Execution is asynchronous and the app polls its operation.
5. Open the answer in the same tab, inspect completion/attestation binding and run manifest checks locally. The decryption key remains only in tab memory.
6. Settle using the signed completion. All required stages passing releases payment. Failed stages refund it. After timeout the buyer can request reclaim. Settlement depends on stage completion, not answer quality.
7. Review the payment record and, if eligible, rate the run. Prompt verdicts are at best attention because checks cannot prove the model followed every private instruction.

The platform takes 10 percent. A method version sets a community share of at least 10 percent and the seller gets the remainder. The nine versions observed in the latest audit use 80/10/10. No custodial wallet balance or real fiat gateway is implemented.

## Methods and recorded evidence

The original eight demo methods are portfolio-rebalance, tender-bid, salary-counteroffer, defi-liquidation-guard, cash-runway-13w, supplier-concession-plan, token-unlock-sell-plan and term-sheet-dilution. BUILD_STATUS.md 6.18 records their paid testnet runs, including the exact versions used. Portfolio v6, tender v2 and salary v3 are the current observed versions, while some historical receipts refer to earlier versions.

The runtime audit on 14 November found an additional registered prompt method, scientivanmsk-freelance-rate v2. Catalog presence is verified, but no new paid run of it was performed in this audit. Catalog counts and review scores can change. Seeded testnet ratings are not customer validation.

BUILD_STATUS.md 6.1–6.18 preserves historical evidence for sealed execution, sandbox/network limits, AI evidence, escrow release/refund/reclaim, DAO bounty payment, contributor version history and private candidate evaluation. These are version-specific backend/runner/testnet results. They do not establish that every present browser workflow has passed end to end.

## Social Money already implemented

The fund is kalis-fund.sputnik-v2.testnet. The app supports issue reporting, fixed acceptance criteria/evaluator, AddBounty proposals, council votes, claims, sealed contributions, private test grants, review, payout requests and improved-version publication. Monetary and authority operations return unsigned calls for the appropriate wallet and require chain confirmation.

Private tests compare baseline and candidate on specified fields inside the runner. Owners grant separate candidate-bound access with attempt and expiry limits. A council member cannot review their own contribution. Payout uses BountyDone through add_proposal and council approval, due to the deployed Sputnik bounty_done bond limitation.

The observed council has one member. Legacy bounties without an app-linked evaluator cannot be tested through this workflow. A prepared payout call is not a paid bounty. Contributor royalties, competing-claimer ranking and dispute handling are undecided. Further Social Money innovation is deferred until the private protections migration is finished. See PRIVACY_TEE_INVESTIGATION.md.

## Verify without paid operations

```bash
cd app/web
npm test
npm run build
```

From the repository root, these backend checks are local and do not submit transactions

```bash
node app/backend/scripts/checks-test.mjs
node app/backend/scripts/file-import-test.mjs
```

Private protections checks. They are local, native development only (not a TEE), with no network, AI, signing or spending. Build the runner first with `cargo build --release` in app/kalis-runner.

```bash
cd app/backend
node scripts/privacy-local-test.mjs   # 27 protocol checks
node scripts/privacy-http-test.mjs    # 13 relay checks
node scripts/privacy-remote-test.mjs  # 6 checks against the testnet TEE, spends a little OutLayer compute
```

The browser proof needs `node scripts/privacy-preview.mjs` (port 8798) and the web app built with `NEXT_PUBLIC_KALIS_PRIVATE_DEV=1` and started on port 3312 with `KALIS_BACKEND_URL=http://127.0.0.1:8798`. Then run `node app/backend/scripts/privacy-browser-test.mjs` from the Product folder. It saves a note with a sentinel value, reloads the page and confirms the sentinel never appears in a browser request. Result: audit/2026-11-14-private-migration/browser-proof.json.

The documentation audit inspected 14 unauthenticated local pages, nine GET endpoints and proxy health. Build passed, 31 frontend tests passed, and the two local backend scripts passed 47 and 8 checks. See CURRENT_STATE.md and audit/2026-11-14-doc-sync/ for scope and snapshots.

The optional smoke script performs a paid testnet run and consumes configured funds/compute. Run it only with explicit transaction authorization. Other backend scripts may mutate state, seed fixtures or sign transactions. They are not blanket read-only verification commands.

## Limits

- Owner data for the five protections (notes, connections, documents, outbound approvals, audit) is kept encrypted in this browser and handled on the device, so those pages open instantly. Actions that must be enforced against a method or need sealed secrets (using a connection, recalling notes for a method, proposing or sending outbound, reading a private image, the browser agent) go to the TEE with the owner's records sealed inside the request, and the runner stores nothing. Those TEE actions still wait for the OutLayer testnet queue, measured at about 5 minutes, and were not re-tested end to end on runner build `cd95487f…`.

- The private runner runs on OutLayer testnet (BUILD_STATUS.md 6.19). Only the notes path was tested end to end in the TEE. Credentials, documents, outbound and the browser agent share that code path but were not tested one by one there. The browser proof ran in native mode, and the web app has not been deployed with the TEE yet.
- Ownership of private data is tied to a non-extractable signing key in this browser. Clearing browser data loses access. There is no recovery or multi-device flow yet.
- The old plaintext endpoints under /api/protections/ are blocked by the web proxy, but data stored there by earlier versions is not migrated or deleted. That cleanup needs an explicit scope.
- Private PDFs are refused in the private path. Public documents can still be extracted by the backend only after an explicit opt-in, as agreed in rancangan 65.1. Connectors inside the private runner are labelled mocks with no free network access.
- Office files are parsed locally.
- The browser agent is HTTP-level, not a headless browser. Broker, spreadsheet, document, wallet connectors and procurement portal are labelled mocks. No real trades are placed.
- Intel/NVIDIA certificate chains are not independently verified by Kalis. Hash/nonce/signature checks are not a full independent trust-chain audit.
- Literal prompt-copy filtering does not prevent all paraphrase leaks. Buyer checks do not prove optimality, quality, investment returns or business outcomes.
- Answer keys do not survive a tab losing its memory. The server cannot recover the decrypted answer.
- Full wallet publication/payment/community E2E, mobile behavior and accessibility were not reverified by this documentation audit.
- Model proprietary routing, real fiat top-up, custodial balances, trial/licensing/royalties and quality-dispute policy are not implemented or remain undecided.
- The nominated reviewer in a proposal is not enforced exclusively by the current review handler, which accepts another council member who is not the contributor. Grant revocation while testing withholds results in code, but that policy was previously still a proposal.
- Deployment (15 Nov 2026): backend at https://api.kalis.scientivan.dev (VPS, systemd + Caddy) and the app at https://app.kalis.scientivan.dev (Vercel). https://kalis.scientivan.dev temporarily redirects to the app until a landing page is designed. Public HTTPS is live only after the Cloudflare DNS records in app/web/DEPLOYMENT.md exist; end-to-end checks on the public hosts are not verified yet.

API contract is app/backend/API.md. Manifest format is app/methods/MANIFEST_V5.md. Current decisions and reconciliation are in RANCANGAN_PRODUK.md section 0 and 70, CURRENT_STATE.md and DOCUMENTATION_INDEX.md.
