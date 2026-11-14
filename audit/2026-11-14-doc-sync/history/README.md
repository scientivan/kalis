> Historical Git HEAD baseline retained during the 14 November 2026 reconciliation. This is not the current working-tree state. Read [../../../CURRENT_STATE.md](../../../CURRENT_STATE.md) for current decisions, evidence and limits.

# Kalis

Kalis is a marketplace for private methods. A consultant sells a method (a program or a prompt) without revealing it, and a buyer runs it on sensitive data without revealing the data. Methods run inside a TEE on OutLayer (NEAR's off-chain compute), the AI they use runs on attested private models on NEAR AI Cloud, and payment sits in an escrow contract on NEAR that pays the seller, a community fund (Sputnik DAO) and the platform only when every stage of the run succeeded.

Built for NEAR Hackathon 2026. Tracks: Privacy & Private AI, Social Money, Open Innovation. Everything runs on **NEAR testnet** and **OutLayer testnet**. All companies, people, tenders, offers and portfolios in the demo are **fictional**, the sellers are **demo accounts**, and their rules were written by the Kalis team for the demo.

## How a run works

1. The buyer picks a method version. The detail page shows what the method is (program or prompt), which AI models it may call, which connectors, documents, outbound destinations, memory and browser access it needs, and which results the buyer can check on their own device. All of this comes from the version's manifest, whose hash is on chain.
2. The buyer's data is sealed **in the browser** to a key that exists only inside the runner TEE (X25519 + HKDF-SHA256 + ChaCha20-Poly1305). The server and OutLayer see ciphertext only.
3. The buyer pays into escrow (`pay_for_run`). In the demo the "mock fiat top-up" pays from a platform testnet account; a NEAR wallet can pay directly.
4. The Kalis runner (a WASM program in Intel TDX on OutLayer) opens the sealed method and data, runs the seller's code in a `wasmi` sandbox whose only possible import is `kalis.ai_chat`, and lets it reach only the models its manifest lists. Every AI answer is checked with a fresh-nonce attestation and a response signature, or discarded. The runner's own network allowlist holds one host, `cloud-api.near.ai`.
5. The answer is sealed back to the buyer. A public completion record (run id, all stages ok, method/manifest/data hashes) is signed by a TEE-held key.
6. The buyer opens the answer on the device and runs the method's buyer checks (data in the manifest, JSONLogic, no seller code). The app shows one verdict: safe, attention, or do not use.
7. Anyone submits the signed completion to the escrow. Every stage succeeded: 80% seller, 10% DAO fund (minimum), 10% platform. A stage failed: full refund. No completion within 30 minutes: the buyer reclaims with `refund_expired`. Payment depends on stages succeeding, never on how good the answer is.

## Methods in the marketplace

| Method | Seller (demo) | Kind | Why the data must stay private |
|---|---|---|---|
| Rebalance a portfolio at minimum transaction cost | `arif-planner.scientivan.testnet` | WASM | Positions leak, others trade against you |
| Price a tender bid above your minimum margin | `rani-procurement.scientivan.testnet` | WASM + private AI | Your cost price reaches a competitor |
| Write a salary counter-offer that protects your walk-away number | `maya-careers.scientivan.testnet` | Prompt | Your lowest number becomes the offer |
| Protect a DeFi loan before liquidation | `bima-pratama.scientivan.testnet` | WASM | Liquidation hunters see your position |
| 13-week cash plan that keeps payroll paid | `sari-wulandari.scientivan.testnet` | WASM | Suppliers and banks pull credit |
| Supplier contract concession plan | `dimas-hidayat.scientivan.testnet` | Prompt | The other side learns your walk-away terms |
| Sell unlocked tokens without crashing the price | `kenji-arakawa.scientivan.testnet` | Prompt | The market front-runs your sale |
| Check term-sheet dilution before signing | `laura-mendes.scientivan.testnet` | Prompt | Other investors learn your valuation |

All eight ran end to end on testnet with payment, TEE execution, buyer checks and escrow release (`BUILD_STATUS.md` 6.18).

A prompt method is labelled as one. Its best verdict is "attention", because nothing proves the model followed the seller's rules, and a paraphrased prompt can still leak through the answer (the runner withholds answers that copy 8 or more prompt words in a row).

## What is proven on testnet

See `BUILD_STATUS.md` section 6 for every transaction hash and call id. Highlights:

- Sealed execution in the OutLayer TEE: the attestation's input/output hashes and executed build match what was sent and received; OutLayer sees no plaintext.
- Network blocked by the manifest (6.7), seller code sandboxed, AI only through the runner with attestation and signature per call (6.15).
- Escrow release with an 80/10/10 split and refund on a failed stage (6.11), timeout reclaim (6.17).
- DAO bounty cycle: council approved a bounty, a demo contributor shipped a faster method version, the DAO paid it, and the version records its parent and contributor (6.12).
- Tender method (WASM + AI) paid end to end; the prompt injection inside the tender scan was not followed (6.16).
- Private evaluation of a bounty candidate inside the TEE: only pass/fail per field and a TEE-signed record leave the enclave (6.17).

## Run it

```bash
cd app/backend && npm install && npm start          # http://localhost:8787
node scripts/smoke.mjs http://localhost:8787 success tender-bid   # one paid run (testnet)
```

Secrets live in `app/backend/.env` and `Product/.env` (both gitignored): testnet demo buyer and settler keys, the OutLayer payment key, the NEAR AI key. The browser never receives them. API contract: `app/backend/API.md`. Manifest format: `app/methods/MANIFEST_V5.md`.

Test scripts in `app/backend/scripts/` (all against a running server): `runs-test`, `checks-test`, `protections-test`, `artifacts-test`, `reviews-activity-test`, `auth-test`, `sellers-test`, `community-test`, `private-tests-test`, `file-import-test`, `reclaim-test`. Runner tests in `app/kalis-runner/client/`.

## Limits (read before judging)

- The five protections (credentials, outbound approval, memory review, documents, browser agent) run on the Kalis backend, **not in a TEE**. The operator could technically read them. Uploaded documents pass through the backend on their way to NEAR AI; extracted text is not stored, but do not upload private documents.
- The browser agent is HTTP-level, not a headless browser. Connectors (`broker_mock`, `sheets_mock`, `docs_mock`, `wallet_mock`) and the procurement portal are **labelled mocks**.
- Intel and NVIDIA certificate chains are not verified by Kalis itself; attestation checks compare hashes and the fresh nonce in report_data.
- The mock fiat top-up is not a real payment. No real money moves anywhere.
- Buyer checks cover rules computable from the buyer's data and the answer. They cannot prove an answer is the best possible one.
- Proprietary models (Claude, GPT) are allowed by the design with warning and consent, but the runner does not support them yet.
- Seller rules and methods are demo content, not financial, legal or procurement advice.
- Trial, licensing, royalty and quality disputes are open product decisions and are not implemented.
