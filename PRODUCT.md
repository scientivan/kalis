# Product

<!-- impeccable:product-schema 1 -->

## Platform and stack

Kalis is a web marketplace for private expert methods. The active app is Next.js and React in app/web. The Node backend is app/backend. NEAR testnet market.scientivan.testnet combines registry and per-run escrow. Methods execute in the OutLayer TEE runner, with private attested AI through NEAR AI Cloud. Vercel hosting is planned and locally configured. Public deployment and DNS changes are postponed.

## Users and purpose

Buyers run a chosen method on sensitive data. Authors sell a WASM program or a prompt without distributing its plaintext. Contributors and DAO council members fund, test and review method improvements. Target adoption and willingness to pay remain hypotheses.

The intended value is a trade that can happen because neither party needs to reveal its private inputs or method to the other. Operator privacy is a product requirement with current implementation gaps. Do not turn the intended promise into a claim that every website workflow is operator-blind.

## Current implementation

The app has Marketplace and method detail, expert profiles, Jobs, Connectors (renamed from Connections on 15 November 2026), Documents, Notes, author Create/Published, Community Fund/Proposals/Bounties/Issues, Account and Activity. Role selection organises navigation only. Seller editing, wallet requests, async execution, reclaim, private test grants and community writes are implemented, with transaction and browser verification limits in CURRENT_STATE.md.

The runtime catalog observed on 14 November contains nine registered methods. Eight are the original demo set and one is scientivanmsk-freelance-rate. Catalog presence is not proof that every current version has completed a paid browser run.

Platform share is 10 percent. The method version sets a DAO share of at least 10 percent and the seller gets the remainder. Current observed versions use 80/10/10. The DAO is kalis-fund.sputnik-v2.testnet. Royalties, competing-claimer ranking and quality disputes remain undecided.

## Privacy and product limits

The core runner takes sealed method/data and returns a sealed answer. Since 15 November 2026 the checkout plaintext path is closed. Owner data for connectors, notes, documents, outbound approvals and audit is kept encrypted in the browser, and enforced actions run in the private TEE runner `scientivan.testnet/kalis-private`. Limits are in RANCANGAN_PRODUK.md section 73.

Intel/NVIDIA certificate-chain verification is incomplete. Prompt leak checks do not prevent all paraphrase leaks. A prompt verdict is at best attention. Buyer checks prove only declared computable conditions, not expert quality, investment returns or business success.

Fiat top-up, external connectors and procurement portal are labelled mocks. Settlement uses actual testnet transactions, not real fiat or mainnet money. No custodial balance or proprietary AI path exists.

## Evidence and decisions

CURRENT_STATE.md reconciles decisions, source, live GET observations and historical evidence. BUILD_STATUS.md preserves version-specific testnet receipts. RANCANGAN_PRODUK.md section 0 and latest decisions define approved behavior. FRONTEND_GUIDE.md defines the binding app design.

The latest audit inspected 14 unauthenticated browser pages, nine GET endpoints and proxy health. It did not sign in or perform transactions. Earlier user/Claude reports remain attributed. Demo ratings are not customer validation.

## Tracks and next discussion

Agreed tracks are Privacy & Private AI, Social Money and Open Innovation. Social Money already includes a funded Sputnik DAO bounty cycle and private candidate evaluation. Dien requested further Social Money innovation discussion after documentation reconciliation. No additional feature or governance policy has been approved by this audit.

## Brand and communication

Name Kalis. Domain spelling is kalis (changed from calis on 15 November 2026): landing kalis.scientivan.dev (temporary redirect), app app.kalis.scientivan.dev, API api.kalis.scientivan.dev. The approved hero hook remains “Where expertise is traded, run privately, and improved together.”

Follow FRONTEND_GUIDE.md for Inter typography, light theme, capsule role navigation and current page patterns. Historical Corbel, HelloNear and batik drafts are not current app specifications. No invented customers, testimonials, partnerships, method-quality benchmarks or real revenue.

<!-- impeccable:product-schema-end -->
