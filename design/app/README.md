# Kalis app design preview

Open [index.html](index.html) directly in Chrome or Safari. This is a local, standalone frontend draft. No server, installation or build step is required. The intended production frontend remains Next.js, as agreed in the product design.

The preview opens in Workspace. Main navigation links to Marketplace, Community, Activity and Balance. The Dien account disclosure opens Account, Connections, and Permissions & preferences. There is no role switch.

## What can be reviewed

| Area | Preview behavior |
|---|---|
| Workspace | Recent work, status filter, file records, memory, historical portfolio result and work drafts |
| New work | Choose portfolio or tender, enter a work name and sample constraint, review, create a session draft |
| Marketplace | Search and category filtering, three illustrative method listings, details, draft creation and My methods |
| Community | Overview, contribution process, shared-fund allocation rules, explicit empty states for bounties/contributions/proposals |
| Activity | Review or decline sample memory/external-action requests. Decisions update the work status and pending count |
| Balance | Mock top-up with loading, failure/retry and cancellation states. Individual mock entries and session balance |
| Account dropdown | Edit session display name, toggle a mock connector, view permission policies and set reduced motion |
| Search | Find sample work or methods through the utility rail, mobile header or Command/Ctrl+K |

All work records, files and accounts are illustrative. The C03 result is a historical synthetic result, not a calculation performed by this page. No private input, real credentials, uploads, payments, votes or external actions are processed. Drafts and preferences reset when the page reloads. Community workflows are not simulated as completed live integrations.

The preview does not authenticate users, enforce production access control, implement encryption or connect the backend. Its UI statuses must not be used as implementation evidence for those systems. Current backend progress remains in BUILD_STATUS.md.

## Files

| File | Purpose |
|---|---|
| index.html | Accessible shell, five primary navigation items, account disclosure, utility controls and dialog |
| app.css | Scoped app styles, tokens and responsive rules |
| data.js | Labelled fictional records and method descriptions |
| app.js | Local routing and interaction state |
| verify.cjs | Controller checks with DOM doubles, explicitly not a browser test |
| DESIGN.md | App-specific visual and interaction system |
| REVIEW.md | Verification evidence and remaining limits |

Run `node design/app/verify.cjs` from the Product directory. JavaScript syntax can be checked with `node --check design/app/app.js` and `node --check design/app/data.js`.

## Design provenance

Dien provided two Corbel Supply Co. screenshots as references. The draft adapts their restrained sage background, white task surfaces, dark navigation/primary controls, top navigation and compact utility rail to Kalis's product objects. The retail metrics and kanban contents are not copied. The chosen composition is a design proposal awaiting Dien's visual review.

[Impeccable](https://github.com/pbakaus/impeccable) was read from the installed skill. [RYUX design-intelligence](https://github.com/ryuxdsgn/design-intelligence) was read from its official SKILL.md, Build/QA capabilities and relevant knowledge modules through web access. Git cloning failed because the terminal could not resolve github.com. RYUX was not installed and its CLI scan was not run. No external reference MCP was connected.

## Suggested review

Start on Workspace and locate the next action for a portfolio result and a pending tender request. Open Dien and check that all three account destinations are understandable. Create one work draft, navigate away and return during the same session. Try Marketplace search with an unmatched query. Approve a memory request and verify it appears in Memory. Open a mock top-up, test the failure/retry path, then cancel another top-up while it is loading.

Check the visual layout at desktop width and at 390px and 320px. Browser rendering and native keyboard/focus behavior could not be verified in the build environment. Test those before treating the design as approved.


Marketplace now includes local photographic covers, whole-card navigation, matching detail identity, inline review summaries and cover selection for session drafts. Source credits are in assets/README.md. Refresh index.html to load this revision.


## Coverage audit

See COVERAGE.md for requirements, routes, limits and incomplete journeys. flows.js adds 23 session workflow screens with related links beneath each app area. It includes labelled synthetic execution and escrow scenarios. These screens do not implement encryption, authentication, DAO operations or live payments. Run node verify.cjs for sixteen controller checks.
