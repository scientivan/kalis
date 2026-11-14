# Context from Claude session 362bf009-3858-4298-ab0a-8df4e7549098

Read local session transcript and current FRONTEND_GUIDE.md. Latest decisions override the earlier mock reproduction. Marketplace uses compact method cards, shared capsule shell, reusable Segmented and Dropdown controls, info popovers and consistent inset field frames. Always use Impeccable for subsequent frontend design work. Navigation uses short nouns in Title Case, other copy sentence case.

Claude reported rebuilding marketplace detail, expert, listings, run and all rail pages. Dien reported a successful portfolio run from the UI. This is user-reported evidence, not a newly reproduced run in this session. Claude reported mobile checks using a 390px iframe, not a physical mobile device.

Latest local commit is bf1e05e, fixing NEP-413 callbackUrl and base58 handling. Claude said it was not pushed and the live backend required restarting. This review did not restart it or reproduce wallet login.

Next priorities

1. Confirm live backend uses the auth fix and reproduce wallet sign-in. Coordinate backend work with its owner.
2. Verify Listings draft creation while signed in. It was explicitly left unverified.
3. Complete tender buyer inputs from connectors/documents and capture browser-to-settle testnet evidence.
4. Add wallet payment, complete seller manifest/seal/publish flow, then remaining community/profile actions according to capabilities.
5. Validate actual mobile behavior and update stale COVERAGE.md claims against current code.

No implementation edits, signing, spending, push or deployment in this review. Compliance gate found no conflict.
