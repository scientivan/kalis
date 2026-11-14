# Kalis bounty pool contract (testnet)

Escrowed crowdfunding for a Sputnik DAO bounty. Deployed at `kalis-pools-1114.testnet`, initialised with
`new({"dao":"kalis-fund.sputnik-v2.testnet"})` (deploy tx `C24smEmdHuHmErZhgmyKRn82hvGhYQA4ckE3QRbHDZgj`).

## Rules

- `create_pool(bounty_id, title, deadline_ns)` anyone. Deadline at most 90 days ahead.
- `pledge(pool_id)` payable, at least 0.01 NEAR, only while Open and before the deadline. The NEAR stays in the contract.
- `release(pool_id, proposal_id)` anyone. The contract calls `get_proposal` on its DAO. It pays the whole pool to the
  proposal's `receiver_id` only if the proposal is a `BountyDone` for the pool's bounty, was submitted after the pool was
  created, and has status `Approved`. Otherwise it logs `release refused: ...` and the pool stays Open.
- `mark_rejected(pool_id, proposal_id)` anyone. Same check, status Rejected, Removed or Expired. Opens refunds early.
- `refund(pool_id)` each pledger, for their own pledge, after the deadline (without a release) or after `mark_rejected`.
- Views: `get_dao`, `get_pool`, `get_pools`, `get_pledge`.

There is no owner, no admin withdraw and no fee. While a DAO check is in flight the pool is `Checking`, which blocks a
second release and refunds until the callback lands.

## Limits (honest)

- The DAO is fixed at init. A different DAO needs a new deployment.
- The payout trusts the DAO's own `BountyDone` approval (the council vote). It does not judge the work itself.
- Once refunds open (deadline or rejection), a later approval no longer releases the pool.
- `#[private]` on the callbacks is enforced by the wasm entry point; native unit tests cannot cover it.

## Build, test, deploy

```bash
cargo test                                   # 8 unit tests
cargo +1.86.0 near build non-reproducible-wasm   # rust-version 1.86, same as app/market-contract
near contract deploy <account> use-file target/near/kalis_pool.wasm with-init-call new json-args '{"dao":"kalis-fund.sputnik-v2.testnet"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-legacy-keychain send
```
