> Historical Git HEAD baseline retained during the 14 November 2026 reconciliation. This is not the current working-tree state. Read [../../../../../CURRENT_STATE.md](../../../../../CURRENT_STATE.md) for current decisions, evidence and limits.

# Frontend gap audit

Source inspection against API.md, 14 November 2026. No runtime or browser verification in this audit. A route existing is not evidence that its whole workflow is implemented.

| Area | Existing | Missing or incomplete |
| --- | --- | --- |
| Buyer preparation | Typed manifest fields, synthetic sample | Connector selection/use, local Office import, document extraction review, note recall, private-value registration, source provenance |
| Checkout | Browser seal, direct test-top-up run creation | Draft/consent/quote, prompt-specific consent, model narrowing, detailed costs, wallet contract-call signing, idempotency and operation recovery |
| Execution | Synchronous execute and local opening/checks | Async operation polling, actual event track, AI-call evidence, richer manifest output display |
| Jobs | List derived from latest 50 transaction entries | Paginated job/status retrieval, full Results coverage, timeout reclaim action, review eligibility gating |
| Seller | Draft creation, published/draft lists, cover upload | Draft detail/editor, manifest validation, artefact sealing/upload, prompt warning acceptance, wallet publication/confirmation, version publication |
| Connections | Read and revoke | Create connection, scope/expiry picker, effective_state and allowed_actions handling |
| Documents | Metadata list | Upload/import/extraction review and document detail/proof linked to preparation |
| Notes | Read, accept, reject, delete | Create/edit and permission/use history |
| Proposals | DAO proposal list | Issue-linked proposal form, budget/acceptance/reviewer, signing, voting, chain confirmation |
| Bounties | Bounty list | Detail, claim, contribution package, candidate submission, test, review, payout and improved-version publication |
| Issues | Issue list | Create/report, detail, close and proposal links |
| Private tests | No dedicated current UI | Case sealing, explicit grants, limits/expiry, revoke and test report |
| Account | Sign-in, payment/earning lists | Profile/preferences editing, complete pagination and action/status states |
| Method detail | Listing, input/check/version/review tabs | Version test evidence and contribution-package access need integration |
| Cross-cutting | Shared design shell and controls | Capability gating, consistent allowed_actions, loading/error/retry coverage, authenticated/mobile verification |

Recommended implementation order

1. Complete buyer preparation, quote/payment recovery, async execution and reclaim. Prove tender browser-to-settle.
2. Complete seller draft-to-publication and version management.
3. Complete Issues to Proposals to Bounties to contribution/test/review/payout flow.
4. Complete Account editing and cross-cutting validation.

Keep backend ownership separate. Record missing contracts in BACKEND_REQUESTS.md, never invent endpoints. Only claim tested behavior after actual verification. Compliance gate found no conflict for this source audit.

## Status after the 14 November 2026 integration pass (Claude Code)

Verified in Chrome against the live backend, signed in as `scientivanmsk.testnet` through a seeded session fixture:

| Area | State |
| --- | --- |
| Jobs | Ongoing and Results list real runs. Execute is async with polling. A slow OutLayer call is now resumed by pressing Run privately again (backend keeps `pending_call_id`), no second payment |
| Methods | Drafts list and editor open with manifest, price, community share, sealed artefact and wallet publication. Published stays empty until the owner signs the publish calls |
| Connections, Documents, Notes | Create, list, revoke and edit work. Records now follow the signed-in account instead of a per-tab demo workspace (backend fix in `src/protections/routes.js`) |
| Issues, Proposals, Bounties, Fund | Lists, forms and detail work. Proposal waits for the proposer's wallet signature and bond |
| Account, Activity | Payments, earnings and the activity feed show seeded testnet records |
| Labels | Raw codes such as `awaiting_signature` and method ids are replaced by plain labels and marketplace titles (`src/lib/labels.ts`) |

Not verified: the full wallet signing path in a real browser wallet (publish, proposal bond, bounty claim, wallet-paid run), and mobile layout.
Known chain data: bounty 0 on `kalis-fund.sputnik-v2.testnet` has "rtk make" in its description, inserted by a shell hook when it was created. It is closed and cannot be edited on chain.
