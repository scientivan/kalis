> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Coverage of RANCANGAN_PRODUK.md in the Next.js app

Audit date 14 November 2026. Source of truth for requirements is `../../RANCANGAN_PRODUK.md` (section 0 and the highest-numbered sections win). Every row below runs on mock data in the browser (`src/lib/domain.ts`, storage key `kalis-mock-v3`). Nothing calls `app/backend/` yet.

Status words. **Mock** means the control changes mock state and is covered by a test or a browser check. **Label only** means the UI states the rule but nothing enforces it. **Missing** means not built.

## Buyer (Workspace)

| Requirement | Section | Route | Status |
| --- | --- | --- | --- |
| Onboarding before the app shell | 56 | any route on first visit | Mock. No password or wallet |
| Work list, new work, open work | 56, 57 | `/workspace`, `/workspace/new`, `/workspace/run/[id]` | Mock |
| Input, document metadata, payment limit | 3, 29, 56 | run page | Mock. Filename only, no upload or OCR |
| Model choice inside seller policy, proprietary warning, redaction and consent | 52 | run page | Mock, enforced in domain |
| What the run may access (manifest snapshot) | 49, 52 | run page | Mock |
| Broker import through a connection | 49 | run page, `/connections` | Mock. Needs declared connector and active connection |
| Private values for outbound checks | 3, 50 | run page (methods with outbound) | Mock |
| Approve terms, fund escrow, run, timeout reclaim | 29, 56 (escrow) | run page, `/balance/escrow/[id]` | Mock |
| Seven runner stages, method steps, device checks, chip proof, one verdict | 55 (report) | run page | Mock fixtures in `src/lib/fixtures.ts` |
| Browser agent log and refused action | 3, 49, 50 | run page (tender) | Mock |
| Scanned document result with personal data and instruction-like text | 3, 50 | run page (tender) | Mock |
| Outbound approval bound to destination and exact content, held when private values or undeclared site | 3, 11 | run page, `/activity` | Mock |
| Memory with source, edit, delete | 3 | `/workspace/memory` | Mock |
| Memory proposals from documents wait for review, instruction-like text cannot be saved | 3, 49 | `/workspace/memory` | Mock |
| Private test case permission, limits, revoke, not training | 9 | `/workspace/permissions`, bounty page | Mock |
| Files | 56 | `/workspace/files` | Label only. Filenames |

## Marketplace

| Requirement | Section | Route | Status |
| --- | --- | --- | --- |
| Catalog, search, category, cover, rating and review count | 45, 59, 61 | `/marketplace` | Mock |
| Result-oriented method names, salary as concept only | 45 | `/marketplace` | Mock |
| Detail with output, input, limits, price and infrastructure, creator | 5, 29, 58 | `/marketplace/[id]` | Mock |
| What the method can access (manifest) | 49, 52 | `/marketplace/[id]` | Mock |
| Test results per version, separate from ratings | 44, 58 | `/marketplace/[id]` | Mock. Portfolio shows the real 12/12 result |
| Reviews only from completed runs with matching proof, per version | 46, 59 | `/marketplace/[id]/reviews` | Mock |
| Versions with parent, contributor, registry reference | 7, 47 | `/marketplace/[id]/versions` | Mock |
| Open modules and private core | 21 | `/marketplace/[id]/contributions` | Mock |
| Create method with category, price, DAO share 10 to 90%, models, modules, steps, checkable rules, full manifest | 21, 29, 52, 54 | `/marketplace/publish` | Mock |
| My methods, publish draft | 56 | `/marketplace/mine` | Mock |

## Community, Balance, Activity, Settings

| Requirement | Section | Route | Status |
| --- | --- | --- | --- |
| Problem, budget proposal, DAO vote, funded bounty | 8, 23, 47 | `/community/*` | Mock. Not Sputnik DAO |
| Candidate, independent test, reviewer decision with reason, pay once, new version | 23, 47 | `/community/bounties/[id]` | Mock |
| Shared fund separate from personal money | 8, 56 | `/community/fund` | Mock |
| Fiat top-up with failure and retry, crypto path | 50 | `/balance` | Mock. Crypto is a label, no signing |
| Seller 80% at most, DAO at least 10%, platform 10% | 54 | run page, escrow page | Mock |
| Transactions, earnings, bounty income | 56 | `/balance/*` | Mock |
| Activity linking to source pages, items needing a decision | 56 | `/activity` | Mock |
| Account, connections with scope and expiry, preferences, reset | 56, 57 | `/account`, `/connections`, `/preferences` | Mock |

## Not built, on purpose or pending

- Real sign-in, encrypted upload, calls to `app/backend/API.md`. Integration is the next step.
- Trial, license, royalty, refund and dispute. Open in sections 18 and 46, so the UI promises none of them.
- Trezu view (needs a mainnet DAO, section 54).
- NFT (rejected, section 12).

## Verification

`npm test` 20 of 20 pass. `npm run build` passes. Chrome checks on 14 November 2026 covered the buyer flow, contribution flow, five failure scenarios, seller form, connections, the tender protections and onboarding. Mobile rendering is not verified, because resizing the test browser had no effect.
