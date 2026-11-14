# Product workspace (NEAR Hackathon 2026)

This folder holds the product being built for the NEAR Hackathon 2026. Deadline 14 Nov 2026 23:59 UTC (15 Nov 06:59 WIB).

## Read first, in this order

1. `../AGENTS.md` and `../NEAR.md`. Hackathon rules, tracks, submission requirements, and the mandatory "Compliance gate". Check every plan and action against that gate and report the result. Read them even if your tool did not load them automatically.
2. `BUILD_STATUS.md`. What is built, with evidence, and what is next. Update it before every session ends.
3. `PRODUCT_MEMORY.md`. Dien's communication preferences for product documents, pitches, and demos.
4. `RANCANGAN_PRODUK.md` section 0 (current status). It overrides older sections, because the document is ordered by time and early sections hold superseded directions. Then read sections 44–52 for the latest decisions (product promise, frontend use cases, two-sided guarantees, tracks and demo flow, pre-development decisions, five protections and third-party integration, hybrid payment and the tender use case). Sections marked "Digantikan" are history only.

5. For any frontend or UI work, `FRONTEND_GUIDE.md` (binding design rules, palette, layout, nav map and the approved reference mock `design/app/marketplace-luno-crypto.html`), then `app/backend/API.md` and `app/methods/MANIFEST_V5.md`.

## Folder map

- `RANCANGAN_PRODUK.md` / `.pdf`. Product design. The Markdown is primary. The PDF is the owner's audit summary.
- `document-tools/`. PDF source (`pdf-pages.json`) and generator. See its README.
- `validation/`. Method benchmark packages and results (method-01, portfolio-method-01, portfolio-method-02).
- `research/`. Background research from ideation. Not product decisions. See `research/README.md`.

## Current phase

Development of the MVP and the main demo flow (section 47) started 13 Nov 2026. Demo method is portfolio rebalancing (`validation/portfolio-method-02/`). Build flow steps 1–2 first, then 3–5. The five protections in section 3 are all built in the MVP (section 49). Second demo use case is tender bidding (section 50). Payment is hybrid, with a labelled mock fiat top-up and real testnet settlement (section 50). Features for Social Money and Open Innovation may change later. Build only what can run and be shown. Remove from the README anything that does not run, because AI screeners check that the project does what the README says.

Agent limits from `../NEAR.md`: no submission, X post, making a repo public, push, signing, spending, mainnet deploy, or committing secrets without Dien's explicit confirmation.

## Keeping documents in sync

After every concluded product discussion or agreed decision, update both `RANCANGAN_PRODUK.md` and `RANCANGAN_PRODUK.pdf` in the same turn without waiting for another request. Preserve rationale, constraints, and unresolved questions. Mark unapproved ideas as proposals. Update `PRODUCT_MEMORY.md` when needed. Verify the regenerated PDF for overflow and content coverage.
