# Social Money (testnet)

Three ways NEAR moves between people around a method. All amounts are testnet NEAR. No token, no yield, no promise of returns.

| Feature | Who signs | Where the money goes | Recorded when |
|---|---|---|---|
| Contributor royalty | Platform account (backend) | 5% of the run price, from the 10% platform fee, to the version's on-chain `contributors` | Automatically at `settle` of a Released run |
| Tip | Buyer wallet | Seller or a contributor of the version, 0.01 to 1 NEAR | Backend reads the transfer on chain |
| Stake-backed rating | Buyer wallet | Kalis community fund `kalis-fund.sputnik-v2.testnet`, 0.01 to 0.1 NEAR, donation | Backend reads the transfer on chain |

Why the royalty comes from the platform fee. The market contract's `settle` pays seller, DAO and platform only. It stores `contributors` per version but does not pay them, and the backend cannot sign for the seller. Redeploying the contract was out of scope, so Kalis pays the royalty out of its own share in a separate transfer. The seller and DAO shares are unchanged.

Why the stake is a donation. It is the simplest honest mechanism with existing primitives: a plain transfer to the Sputnik DAO. Nothing is returned automatically and nothing is earned. A refund would need a normal council Transfer proposal.

## API (app/backend/src/social-api.js)

- `GET /api/runs/:id/social` royalty status, tips, who can be tipped.
- `POST /api/runs/:id/royalty` idempotent royalty payment (also called by settle).
- `POST /api/runs/:id/tip {amount_near, to}` unsigned transfer; `POST /api/runs/:id/tips {tx_hash}` records it.
- `POST /api/reviews/:id/stake {amount_near}` unsigned transfer; `POST /api/reviews/:id/stake/confirm {tx_hash}` records it.
- `GET /api/methods/:id/social`, `GET /api/social/summary` totals.

## Testnet evidence (14 Nov 2026)

- Run `run-mwgxfxq1-bb507657` (portfolio-rebalance v6), settle `6PCTUj3QxEdezuQfbKaNapngPixYj4pSJTRt81LoVDZE`.
- Royalty 0.005 NEAR to `kalis-contrib.testnet`: `E3kbGoTaruMnWNxF7kWGrRkxgpFLByD6HTzsSo9TTiCS`.
- Tip 0.02 NEAR to `arif-planner.scientivan.testnet`: `AocPgXqFQi9f7esRHDuUn1EfpGGfBKgimyMuZNv3LTUa` (signed by the demo buyer key in a script, same call the wallet signs).
- Stake 0.02 NEAR to the fund: `Gjvf1Vx8eMifGTrZuQeCKPPDaqzaxZpy53SXujPic3pu`.

Test: `node app/backend/scripts/social-money-test.mjs <base url> <released run id>`.

## Contract-paid royalty, refundable stake (agent E2, 14 Nov 2026 22:00 to 22:15 UTC)

**Contributor royalty is now paid by the market contract.** `publish_version` takes an optional `contributor_bps` (one entry per contributor, basis points of the seller share, total at most 5000). `settle` pays each contributor from the seller share, in the same transaction, and adds `contributors` and `to_contributors` to the `run_released` event. A contributor equal to the method owner is skipped. The rates live under their own storage prefix (`cbps`), so the `Market` and `Version` layouts did not change and no migration was needed. New view `get_contributor_bps(method_id, number)`.

- Upgrade deployed to `market.scientivan.testnet` without init, tx `69Us5GWxzjzVrg42rQkisNYDVMXNRiU8M9eTc3y2jjcu`, wasm sha256 `b8a614647f0afef25557b4c951f0f9e05615c007f734ce7f4818afa377688042` (`cargo +1.86.0 near build non-reproducible-wasm`). Existing versions still read back (`get_version portfolio-rebalance 1`).
- Dry run first on a fresh faucet account `kalis-mkt-dry-1114.testnet`: old production wasm deployed and initialised (`GVerj9Nej1mr8AhQ3tQg85G5BRaMdUKCv6NWHY4P8ndc`), v1 published on the old code (`3JPkn4q1s8BYjgEDhsV9GGBKakzqkvJMiTvbdeYdt68h`), upgraded in place (`CrsyRQidLKfWUUQGYMMHWdXEvNW6cfedHzoz5LGy2Wg3`), v1 still readable, v2 with 2000 bps (`JCSb3pvtk9B94ZSnNjvdjq6UB6ue3nZDDHkYLXieuoNF`), paid (`C1YsYLbTgR3VrXYsuGxRuFG1arXuGun35HP7mBunYEyT`) and settled with a test runner key (`3h7pyc2CZwtq5xHfVSMjjBpEPeRurDN7trY3sMucpEsE`, 0.016 NEAR to the contributor).
- Production proof with the real TEE runner: `token-scam-screen` v2 (same build as v1, contributor `scientivanmsk.testnet` at 1000 bps) published by the owner (`3E5PsAyKjueDXEA3NGGf4wdcRsJkG4xDbue96xTXZUiq`). Run `run-mwgyjjo5-3318bdc1` paid by `auth-test.scientivan.testnet` (`8nifQ6ExVg2tZ2aUEB1S7SKY5GzH98wYk2x3TfrFoq3K`), executed on OutLayer (call `6d9f62ce-b477-4145-96e9-07a3a8279110`), settled Released (`6dsA1S7rAsnXhyckyu7x9BTuHapnM9D331JMokddc4e5`). Split read from the event: seller 0.0576, DAO 0.008, platform 0.008, contributor 0.0064 NEAR.
- A first attempt on `demo-publish-test` v2 (`7SkkjZcvJbsN1M1hH5FouEqJsDRbD36F1HBj4PMJHuWT`) settled Refunded because that prompt method failed its own steps (`9TwAFoqRJaPNgTazKqCXnJeMdsSjKi4QuJjyrgy3itz9`), so no royalty was due.
- Backend: `payRoyalty` first reads `get_contributor_bps`. When rates exist it only records the contract payment (`paid_by: market_contract`, tx = settle tx) and sends nothing, so there is no double payment. The old platform-fee transfer remains only for versions published without rates. The settle response subtracts the contributor amount from the seller payout. The bounty publish flow (`community-api.js`) now sends `contributor_bps: 1000` per contributor.

**Refundable stake.** New stakes are recorded as `refundable_deposit`. The fund holds them for 7 days (`KALIS_STAKE_HOLD_MINUTES` overrides it; the demo used 1 minute). A council member (read from the DAO policy) can flag the review with `POST /api/reviews/:id/stake/flag`; the stake then stays as a donation. After the hold, the staker calls `POST /api/reviews/:id/stake/refund`; the backend files a Sputnik `Transfer` proposal signed by the platform account (it pays the 1 NEAR proposal bond) and the council approves or rejects it. `GET /api/reviews/:id/stake` reads the proposal status from chain. Stakes made before this change keep their donation terms.

- Demo through the app's unsigned-call path, signed by the `auth-test.scientivan.testnet` testnet key (not a browser wallet): tip 0.01 NEAR to the contributor `Chn5CDXoHdDNofctapXvKNtxLQaKcmBCALQWrxWoRvr1`, stake 0.02 NEAR `FU3EYRuF3RodBu4MehysQuYucFYHNc3AVgCiBjjph7Mg`, early refund refused with `still_held`, refund proposal 6 on `kalis-fund.sputnik-v2.testnet` filed in `2fWdUZht3k26WT1eLxFvMmjiz1MGdYtwvhv3A4Y5omE5` (status InProgress, waits for council `scientivan.testnet`), repeat call replayed.

Not done: tip and stake were not signed through a real browser wallet (near-wallet-selector) because a wallet login could not be automated in the time; the panel layout polish and 1440/375 screenshots were not completed (the shared dev server on port 3000 talks to another backend and did not render the panel).
