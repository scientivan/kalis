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
