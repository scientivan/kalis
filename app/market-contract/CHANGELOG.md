# kalis_market changelog

## 2026-11-14: contributor royalty paid at settle

- `publish_version` gains an optional last argument `contributor_bps: Option<Vec<u16>>`, one entry per contributor, in basis points of the seller share (total at most 5000). Callers that omit it behave as before.
- `settle` pays each contributor its share of the seller share on release, skips a contributor equal to the method owner, and reports `contributors` and `to_contributors` in `run_released`.
- New view `get_contributor_bps(method_id, number)`.
- Storage: rates live under the separate prefix `cbps`; `Market` and `Version` borsh layouts are unchanged, so the upgrade needs no migration.
- Tests: 13/13 (`cargo test`), including `contributor_royalty_paid_from_seller_share` and `contributor_bps_capped`.
- Build: `cargo +1.86.0 near build non-reproducible-wasm`, wasm sha256 `b8a614647f0afef25557b4c951f0f9e05615c007f734ce7f4818afa377688042`.
- Testnet: dry run on `kalis-mkt-dry-1114.testnet` (old wasm, then upgrade, then release with a contributor), then deployed to `market.scientivan.testnet` without init, tx `69Us5GWxzjzVrg42rQkisNYDVMXNRiU8M9eTc3y2jjcu`.
