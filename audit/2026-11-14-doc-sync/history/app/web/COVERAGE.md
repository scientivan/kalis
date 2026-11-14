> Historical Git HEAD baseline retained during the 14 November 2026 reconciliation. This is not the current working-tree state. Read [../../../../../CURRENT_STATE.md](../../../../../CURRENT_STATE.md) for current decisions, evidence and limits.

# Current frontend gap audit

Reviewed current Next.js pages against the API contract. See FRONTEND_GAPS.md for implementation gaps and proposed order. Most primary routes exist but many mutation/detail/recovery workflows are incomplete. This audit is based on source inspection, without new browser or testnet proof. Compliance gate found no conflict.

# Community subsection routes

Added Fund, Proposals, Bounties and Issues for both roles. Existing DAO proposals and council are separated into their corresponding pages, and reported problems now have an Issues route rather than a Bounties tab. Data still comes from existing API requests. Write/contribution flows remain incomplete and explanatory states are retained. Browser verification remains pending. Compliance gate found no conflict.

# Author Methods sections

Renamed Author Listings parent to Methods with Drafts and Published. Existing /marketplace/publish now displays drafts and a Create method button opening the draft form. /marketplace/mine shows published methods only. Shared seller view filters the existing API response by section. Manifest/seal/publish workflow remains incomplete. Browser verification remains pending. Compliance gate found no conflict.

# Unified empty-state panel

Explanation and contextual action now share the same grey note panel. Button sits beneath the explanation in its text column beside the information icon. Applies to all shared State actions. Browser verification remains pending. Compliance gate found no conflict.

# Explanation before contextual actions

Moved Find a method from the Jobs toolbar into the empty-state group beneath its explanation. Added the same contextual next step below empty Connections and Documents explanations. Shared State now accepts a contextual action rendered only for the empty state, after loading and error handling. Inspected approval/note controls and account/fund action placement, whose actions already follow their relevant content. Browser verification remains pending. Compliance gate found no conflict.

# Approvals inside Ongoing

Removed the Approvals sidebar child. Ongoing now embeds the existing approval controls above jobs, with Waiting, Done and All filters. Exact-hash approval and reject requests are preserved, including actions without a job. Legacy /approvals displays the same Ongoing page. Browser verification remains pending. Compliance gate found no conflict.

# Visible page explanations

Shared rail-page title card now contains a compact inset purpose note with an icon. Ongoing, Results and Approvals have specific plain-language explanations, including the result-key limitation. Other rail pages reuse their existing first info point as visible orientation. Marketplace/detail have separate title implementations and still require equivalent review. Browser verification remains pending. Compliance gate found no conflict.

# Jobs navigation

Renamed the Runs parent to Jobs with Ongoing, Results and Approvals. Added list routes /runs/ongoing and /runs/results before the individual run matcher. Lists separate terminal release/refund transactions from outstanding holds within the loaded transaction history. This is not a complete paginated job-status index and does not imply decrypted results survive reload. Browser verification remains pending. Compliance gate found no conflict.

# Sidebar boundary correction

Added explicit final sidebar rules removing inherited margin, padding and borders from the network/wallet block. Navigation has equal 16px top/bottom padding between Role and the network block. Network and wallet are adjacent with a 4px gap. Native NEAR testnet chain_id is a string, testnet. Browser verification remains pending. Compliance gate found no conflict.

# Network/account placement and symmetric menu block

Moved Notifications into the central navigation block. Applied symmetric 14px vertical padding around that block. The separate bottom block now groups NEAR testnet and Chain ID testnet immediately above the wallet state, with text aligned. No numeric EVM identifier is invented. Browser verification remains pending. Compliance gate found no conflict.

# Sidebar offset and network status

Added a 6px offset before navigation and removed the network indicator's filled rounded surface. NEAR testnet now uses a neutral icon and text as noninteractive status. Visual browser verification remains pending. Compliance gate found no conflict.

# Symmetric navigation spacing

Applied equal 8px top/bottom padding around navigation, removed trailing group/child padding and extra utility top padding. The surrounding flex gap is shared, making Role-to-Marketplace and History-to-Notifications spacing symmetric. Visual verification remains pending. Compliance gate found no conflict.

# Sidebar proportion correction

Removed viewport-height sizing and the auto margin above bottom utilities. Capsule now takes its natural content height with a viewport maximum. Collapsed navigation uses 24px icons in 44px rows. Expanded navigation retains compact indented rows with utilities directly below. Browser verification remains pending. Compliance gate found no conflict.

# Compact sidebar hierarchy

Reduced sidebar parent/child rows to 28px, labels to 12px, icons to 18px and utility spacing. Short viewports use 25px navigation rows. Approved indentation is preserved. Overflow remains a fallback on constrained screens. Actual no-scroll fit has not been measured in browser. Compliance gate found no conflict.

# Visible navigation hierarchy

Replaced parent disclosure controls with headings. Expanded sidebar shows all child links immediately, indented beneath each parent with a vertical guide. Browser verification remains pending. Compliance gate found no conflict.

# Role hierarchy implementation

Shared shell now provides Consumer and Author selection, retained per tab. Consumer parents are Marketplace, Runs, Data, Community and Activity. Author parents are Listings, Community and Activity. Each parent is a keyboard-operable disclosure containing existing route links. The active parent opens automatically. Account remains in the connected wallet menu. Fund contains the existing proposal/council tabs, Bounties contains reported problems. No new unsupported route is introduced.

Visual browser verification remains pending. Compliance gate found no conflict.

# Wallet state and account navigation

Fixed connected wallet text using white foreground on blue. Added a connected-state marker and account menu with Account and Sign out. Removed the duplicate Account navigation link. Further navigation mapping is recorded as a proposal in NAVIGATION_REVIEW.md. Browser verification of the authenticated state remains pending. Compliance gate found no conflict.

# Claude session handoff review

Read session 362bf009-3858-4298-ab0a-8df4e7549098 and current frontend guide. Older entries below predate Claude's redesign and must not be treated as current coverage. Context and proposed priorities are recorded in CLAUDE_SESSION_CONTEXT.md. No new runtime verification was performed. Latest local commit bf1e05e contains the auth fix discussed at the session end. Compliance gate found no conflict.

# Vertical sidebar utilities

Moved Kalis branding and method search to the top of the sidebar. Notifications, NEAR testnet indicator and the unavailable wallet control now sit at the bottom. Removed the horizontal header. The middle navigation region scrolls independently while the utilities stay visible. Expanded rail reveals text and search input. Mobile retains a navigation toggle. Browser rendering remains unverified. Compliance gate found no conflict.

# Compact content and sidebar space

Further reduced featured-card, category, table and Quick run dimensions. Categories now use a horizontally scrollable strip instead of wrapping into multiple rows. Expanded desktop navigation reserves 270px in the grid so the main area shifts right. Hover and keyboard focus share this behavior. Mobile opened navigation reserves space using a content margin.

Visual browser validation remains pending. Compliance gate found no conflict. Changes are confined to app/web.

# Centered expanding navigation

Sidebar now uses fixed viewport centering and expands on hover or focus-within to expose item labels. Touch-open navigation displays labels directly. Main Marketplace spacing is reduced again and legacy pages receive compact spacing/type tokens. Browser verification remains pending, so reduced scroll height and hover geometry are not yet measured. Compliance gate found no conflict.

# Capsule sidebar and reduced scrolling

Implemented the supplied image's capsule silhouette as a 64px light icon rail inside an 88px column. All navigation links retain accessible labels and title text. Desktop rail remains sticky. Main spacing, table rows and card padding are tighter, with four featured columns and the table/sidebar split retained above 1100px to reduce vertical stacking. This uses the image's shape, retaining the required light palette.

Browser visual verification is still pending. Compliance gate found no conflict. Changes remain within app/web.

# Compact layout revision

Applied Dien's latest request for a narrower sticky sidebar and slightly smaller Marketplace at normal browser zoom. Sidebar is now 240px, sticky at the viewport top with its own overflow. Header, spacing, icons and display values are more compact. Body text remains at least 13px, controls remain 38px and large actions 50px. Mobile navigation remains in document flow.

Preferences are recorded in DESIGN_PREFERENCES.md. Browser rendering remains unverified. Compliance gate found no conflict. Only app/web changed.

# Reference-based revision

Marketplace markup has now been revised using the supplied HTML structure. Reference CSS is scoped under .reference and the original SVG symbol set is served locally. The revision restores horizontal stats, icon/title grouping, full-width colored step footers, category strip, six-column table, underline filters, segmented sorting, 340px Quick run sidebar and the reference single-column mobile breakpoint.

API methods and rating summaries remain the data source. Method colors are now keyed by method identity rather than the filtered position. Wallet and Quick run controls show unavailable states rather than simulate completion. Detail pages remain legacy. Pagination and full capability gating are still outstanding.

No browser comparison has yet established visual parity. The previously documented font-network and local-server restrictions remain relevant. No payment or deployment was performed. Compliance gate found no conflict.

# Reference correction

Dien rejected the initial visual approximation. The supplied marketplace-reference.html has now been read and compared against the current implementation. See REFERENCE_REVIEW.md for concrete mismatches. The current page does not meet reference parity. No redesign changes or browser rendering were performed during this reference review.

# Marketplace implementation update

The Next.js catalog at /marketplace and / now uses a new scoped layout with the requested sidebar groups, light dashed cards, method step tracks, category filters, search, kind filtering, price/check sorting, seller list and a method-review entry point. Methods and rating summaries are requested through the existing origin-checked proxy. Explicitly unlisted methods are filtered out. No fixture catalog or invented reviews are used.

The proxy GET allowlist now includes capabilities, rating summaries, reviews and version evidence. POST behavior is unchanged. Browser crypto is unchanged.

Current verification

- Typecheck passed and all 26 existing tests passed.
- Build failed because fonts.googleapis.com could not resolve. The required next/font/google Inter configuration is retained.
- The local backend did not return data during the connection probe. Loaded catalog behavior is not browser-verified.
- No browser renderer was available in the inspected local dependencies or command paths. Reference markup was inspected, but opening the mock and renders at 1440px and 390px remain unperformed.

Not complete

Capability gating, wallet connection, full Quick run, detail-page redesign and navigation destination migration remain outstanding. Sidebar links currently enter existing legacy areas. No paid run or testnet transaction was performed. This is an initial catalog implementation, not a finished Marketplace acceptance result.

Compliance gate found no conflict. All changes are in app/web. No deployment, push, submission or spending occurred.

---

# Redesign verification, 14 November 2026

This update supersedes the completion and missing-API claims in the historical report below. The latest API contract includes login, publication, reviews, community writes and reclaim. Their frontend integration still needs auditing.

Only initial typography and base theme changes have been made. Inter variable is configured through next/font/google. Base background, text and focus tokens now follow the binding guide, with color-scheme light. This is not a completed shell or page redesign.

Verification in this session

- npm run typecheck passed.
- npm test passed 23 TypeScript tests and 3 crypto tests. These include mock-domain tests and do not prove a real browser payment.
- npm run build failed because fonts.googleapis.com could not resolve (ENOTFOUND). Inter could not be fetched at build time.
- Reference mock browser inspection and 1440px/390px renders have not been performed.
- No paid browser run, settlement or transaction hash was produced.
- Proxy and crypto modules were not changed. Crypto parity with the latest backend has not yet been verified.

Remaining work includes the complete shell, Marketplace, manifest-generated buyer flow, wallet integration, all other navigation areas, capability gating and actual browser/testnet verification. The original task remains incomplete.

Compliance gate found no conflict for these local frontend edits. No push, deploy, submission, public post, signing or spending occurred. Changes are confined to app/web.

## Historical report, not current verification

# Current frontend and backend coverage

Normal application routes now default to backend mode. A separate explicit toggle opens the isolated local mock demo. Mock records are never presented as registered methods, live runs, backend notes, or testnet balances.

| Frontend area | Backend operations connected | Remaining boundary |
| --- | --- | --- |
| Marketplace | GET config/methods/method details/version history, manifest data, published price, method kind and buyer warning | No seller draft/publish/profile/ratings/reviews write or read API exists |
| Buyer work | Browser sealing, POST runs with selected version, demo_topup or unsigned wallet call, GET run, encrypted execute, device decryption, completion signature/run/data/version binding, rechecks and verdict, settle | No automatic payment retry. Browser refresh loses the answer key. No wallet connector or on-chain timeout reclaim endpoint |
| Connections | Credential list/connect/revoke/use, scope, expiry, last use; labelled demo-token acquisition | Backend broker is not inside TEE. No real broker or trade execution |
| Memory | List/propose/edit/approve/reject/delete/recall with source and instruction-like warning | Demo workspace identity, not authenticated account isolation |
| Files | List/detail, PDF/image upload, extraction output/proof/PII warnings | Upload passes plaintext to backend. File size up to 4 MB. Images may consume configured AI credit after explicit submit |
| Browser | Open/download/submit with method and URL, backend results/refusals | HTTP-level agent, not a headless browser. Submit becomes held outbound action |
| Activity | Private-value registration, outbound proposal/list, exact-hash approval, rejection and execution, audit list | Synthetic inputs only. Backend operation visibility is disclosed |
| Community | GET DAO balance/available amount/council/proposals/bounties | No issue/proposal/vote/candidate/test/review/payout write APIs |
| Balance | Run amount/status, selected-run settlement and payout/return receipts | No balance/top-up-ledger/seller-earnings aggregate API. Do not show mock USD as real NEAR |
| Account and preferences | Access to backend workspace surfaces | No authentication/profile/retention/private-test-grant endpoints. Unsupported actions have explanatory states |

## Verification and scope

Typecheck and production build pass. npm test has 23 TypeScript tests and three crypto tests, including prompt verdict and failed AI-proof regression coverage. Independent source review identified stale verifier, lost version selection and input-validation lockout, which were corrected.

Direct backend GET health/config/methods succeeded in the preceding integration pass. No testnet payments, signing, settlement or protection mutations were executed by Codex. Existing frontend server at 3311 was old; process binding for a replacement server was denied with EPERM. The latest code requires restarting that server before end-to-end browser verification. These limitations remain open and are not converted into a pass claim.

The prior mock-only feature audit remains in MOCK_COVERAGE_ARCHIVE.md for traceability. It does not describe the current default data source.
