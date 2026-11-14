# Design context

This file points to the current design rules. It does not redefine product capabilities.

Read FRONTEND_GUIDE.md for binding app decisions and its latest revisions. The active application is app/web, with shared shell.tsx, controls.tsx, tiles.tsx and reference.css. Luno reference files explain provenance, while the approved Marketplace template and later role/navigation decisions supersede earlier reference dimensions.

Consumer navigation covers Marketplace, Jobs, Data, Community and Activity. Author navigation covers Methods, Community and Activity. Account is in the wallet menu. The observed author label is Create, while an earlier guide says Drafts. This difference remains recorded in CURRENT_STATE.md.

Read PRODUCT.md and CURRENT_STATE.md for actual capabilities and privacy limits before writing copy. In particular, credentials and the other protections are not stored or executed in the TEE, and current checkout registers private-marked values on the backend. Do not repeat older generated RYUX context that claimed otherwise.

The design/app HTML, Corbel review documents and hero files are historical prototypes or reference artifacts. They do not establish current app integration or production readiness. The landing draft is not deployed, and deployment remains postponed.

Audit screenshots of Marketplace and Fund are in audit/2026-11-14-doc-sync/. Their viewport is the default headless browser. They are not mobile, authenticated-wallet or accessibility certification.
