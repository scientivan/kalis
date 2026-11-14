# Kalis frontend guide (binding for any agent building the UI)

Written 14 Nov 2026 by Claude Code from Dien's reviews in this session. This file is the source of truth for the redesign of `app/web` (Next.js App Router). It supersedes `design/app/DESIGN.md` (Corbel draft) and the earlier batik and HelloNear directions. When a rule here conflicts with an older document, this file wins. When it conflicts with Dien's own words in a later chat, Dien wins; update this file.

Approved reference mock (open it in a browser, copy its structure, tokens and behaviour): `design/app/marketplace-luno-crypto.html`, also published at https://claude.ai/artifact/NL5gnbJifLxfd6GLXptjdX (version 5). Earlier exploration, not approved as final: `design/app/marketplace-luno.html` (Luno CRM style), `design/app/directions.html`, `design/app/references.html`.

Backend contract: `app/backend/API.md` (all endpoints, run flow, manifest v5 form and result generation, buyer checks, login, seller publication, community, private tests). Manifest format: `app/methods/MANIFEST_V5.md`. Do not invent endpoints or data; use `GET /api/capabilities` to show only what works.

## 1. User experience rules (Dien, 14 Nov 2026)

1. Lead with the brand promise: the problem Kalis solves, framed so it feels relevant to many people. Kalis lets you run an expert's method on your own data; the expert never sees your data and you never see their method.
2. Features connect into one flow that is easy to follow. Each activity leads to the next (find a method, prepare data, check cost, seal and run, read the answer and your checks, rate, see payment and history).
3. Name features and labels in general, everyday language that a first-time user can picture. No internal or technical names in the interface (say "Connected apps", not "connectors"; "Saved notes", not "memory"; "Waiting for my approval", not "outbound").
4. Every activity and use case the product supports must be reachable from a navbar item. Map all of them before designing a page (section 4 has the map).
5. Merge pages whose information is strongly related. Example: Balance lives inside Account ("Account and balance").
6. Research products with similar use cases before deciding layout, positioning and wording, and show Dien the references first. Research already done: Apify, Replicate, Hugging Face Spaces, Phala, Venice, Nillion, Ocean, Gitcoin (see `design/app/references.html`).

## 2. Visual rules

1. **Never use an em dash and never use bullet points** in the interface. Use cards, rows, chips and short sentences instead.
2. **No floating text.** Every piece of information sits inside an element (card, panel, row, chip, note card). A page title and its subtitle sit inside a card too.
3. **Side by side elements share one height** and end on the same bottom edge. When one column is taller, stretch the others and push their footer or last block to the bottom (the method table card has a footer row "Showing 4 of 8 methods" with pagination pinned to its bottom). Cards in one row are equal height, with their bottom element pinned by `margin-top: auto`.
4. **Light theme only.** White and near white backgrounds, black text, electric blue accents. Never a dark background, also when the user's system is in dark mode (`color-scheme: light`).
5. Follow good UI/UX practice and **WCAG 2.2 AA**: text contrast at least 4.5:1, visible focus ring (3px blue), keyboard reachable controls, labels on every input, `prefers-reduced-motion` respected.
6. Font: Inter only (all weights), see section 3 "Type". Never SF Pro files, Nunito, Geist or any other family.
7. From Dien's global preferences (`~/.claude/DESIGN-PREFERENCES.md`, summarised here because other agents cannot read it): nothing that looks AI generated; no small kicker labels stacked above headings; no ":" to explain a previous phrase in copy; no gradients, glass or glow; solid colours; text weight 500 or more (labels 600 to 800, values 800); honest copy with demo data labelled as demo; app pages use a compact scale (page title about 22 to 24px, card title 15 to 17px, body 13 to 15px, controls 38px high).

## 3. Design system (from the approved mock)

Structure and component style follow the **Luno admin template, Crypto variant** (https://wrraptheme.com/templates/luno/crypto/index.html). Colour follows **extrafazant.nl**.

### Colour tokens (light only)

| Token | Hex | Use |
|---|---|---|
| `--page` | `#F4F4F4` | Page and sidebar background (same colour for both) |
| `--card` | `#FFFFFF` | Cards |
| `--line` | `#E2E2E2` | Dashed separators inside cards |
| `--line2` | `#CFCFCF` | Dashed card borders |
| `--ink` | `#101010` | Main text |
| `--ink2` | `#3A3A3A` | Secondary text |
| `--muted` | `#5C5C5C` | Tertiary text (passes 4.5:1 on white) |
| `--blue` | `#0038FF` | The one action colour: primary buttons, active menu item, breadcrumb links, active tab underline, active page, `+` button, wallet button |
| `--blue-soft` | `#DCE1F5` | Soft blue chips and small round buttons (`···`) |
| `--red` | `#F44A32` | Notification dot, pulse |
| `--orange` | `#FF5F04` | Method identity colour |
| `--pink` | `#FF77CD` | Method identity colour, secondary big button ("See the cost"), badges, with black text |
| `--butter` | `#FEE897` | Method identity colour, "Prompt" chip, "N checks" chip, notes, with black text |
| `--peri` | `#9FA9F5` | Method identity colour |

Text on loud accents (orange, pink, butter, peri, red) is black `#101010`; text on blue is white. Each method has one identity colour used for its round icon, its step track tint, and its rows everywhere (like coin logos in Luno Crypto). There is no green; if a success or failure state colour is needed later, add one semantic pair and keep it out of the accent role.

### Type

**Inter only, with all its variants (decided by Dien, 14 Nov 2026).** Apple's SF Pro may not be embedded on the web (Apple's licence limits it to Apple platforms), so Kalis uses Inter, the closest open alternative. Inter is licensed under the SIL Open Font License 1.1, which allows commercial use and web embedding. Sources: https://github.com/rsms/inter and https://en.wikipedia.org/wiki/Inter_(typeface).

Load it with `next/font/google` (self-hosted by Next.js at build time, no request to Google at runtime):

```ts
import { Inter } from "next/font/google";
export const inter = Inter({ subsets: ["latin"], weight: "variable", display: "swap", variable: "--font-inter" }); // weights 100 to 900, italic optional
```

```css
--font: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-feature-settings: "cv11", "ss01"; /* optional Inter alternates: single storey a and open digits; keep only if Dien likes them */
```

Use Inter for everything, including numbers (`font-variant-numeric: tabular-nums`). For hashes and transaction ids use the system monospace stack `ui-monospace, Menlo, monospace`; no second web font. Inter Display (optical size for 32px and up) is part of the variable font through the `opsz` axis when available; do not add another family.

Weights available: 100 Thin, 200 ExtraLight, 300 Light, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black. Use them like this:

| Role | Size | Weight |
|---|---|---|
| Running text, table cells, form values | 14 to 15px | 500 Medium |
| Card titles, menu items | 15 to 17px | 600 SemiBold |
| Page title | 22 to 24px | 700 Bold |
| Uppercase labels | 12.5 to 13px, letter spacing 0.05em | 700 to 800 |
| Prices and key numbers | 16 to 19px | 800 ExtraBold, `tabular-nums` |
| Large display text only (hero numbers or headlines of 32px and larger, landing page) | 32px and up | 100 Thin, 200 ExtraLight or 300 Light allowed, paired with 800 or 900 for contrast |

Thin, ExtraLight and Light are for large display text only. Dien's standing rule is weight 500 or more for normal visible text, because thin small text is hard to read and looks AI made.

### Shape and surfaces

Cards: white, `1px dashed var(--line2)`, radius 12px, no shadow at rest. Nested panels inside a card also dashed. Pills and selects radius 999px; buttons and inputs radius 6px, height 38px (big action buttons 50px). Round icon buttons 38px. Hover on cards lifts 3px with a soft shadow (0.3s). No gradients.

### App shell

Items 1 to 3 below are superseded by section 7 (capsule icon rail, no horizontal header). They stay here only to describe what each element contains.

1. Sidebar 280px, same background as the page. Top: workspace name "Kalis" (26px, 700) with a round `···` button; then a pill select ("I want to use a method" or "I want to sell a method") and a round blue `+` button ("Sell a new method").
2. Menu groups in dashed boxes (radius 12px). Each group has an uppercase title and one sentence under it. Every item has a duotone icon, 44px rows with dashed separators, active item in blue, optional badge at the right.
3. Header 74px, same background, a 4px white line under it. Left: menu icon and wordmark. Centre: search ("Search methods, for example tender or payroll"). Right: "NEAR testnet" chip with globe icon, notification bell with a red dot, blue "Connect NEAR wallet" button (NEAR Wallet Selector, testnet).
4. Content: breadcrumb (blue links), then a page head card (title, one sentence, a toolbar group of slate icon buttons), then content cards.

### Marketplace page (reference layout)

Row 1, four stat cards with large blue glyph icons: Your data "Sealed on your device", Where it runs "Locked chip on NEAR", Payment "Only if every step works", Community fund "10% of each run".
Row 2, four featured method cards (coin card style): round identity icon, uppercase category, title, price, kind chip (Program, Program with private AI, Prompt), and a step track at the bottom: one equal height bar per step declared in the manifest, drawn in one by one on load, caption "N steps you can follow while it runs". Bars are equal height on purpose so they never read as a chart of values.
Row 3, a horizontal strip card of categories with identity icons and counts (Invest and Web3 3, Win business 2, Run the company 2, Career 1, Everything 8), divided by dashed vertical lines.
Row 4, two columns of equal height. Left: a card with tabs (All, Programs, Prompts, blue underline), a sort range group (Newest, Lowest price, Most checks), an info line "Checks are rules your own device verifies after the answer opens", a table whose header is a white strip with uppercase labels and whose rows are separate dashed cards (method with icon and category, expert with "Demo seller", kind chip, "N checks" chip, price, outline "View" button), and a footer pinned to the bottom. Right: "Quick run" card (floating label selects for Method, Your data comes from, Pay with; big blue "Seal and run" and pink "See the cost"), an "Experts" list card, and a butter note card saying every seller is a demo account and nothing is financial, legal or procurement advice.

### Motion

Page fades in (0.45s). Step tracks grow bar by bar on load. Cards lift on hover. The pending approvals dot pulses a few times. All motion is finite and switched off under `prefers-reduced-motion`. Motion must mean something in the product; no generic fade-up on every section.

## 4. Navigation map (every use case reachable)

| Group (sentence under it) | Item | What the user does there |
|---|---|---|
| Use methods (Find one and run it on your data) | Marketplace | Browse, filter by goal, open a method, see kind, steps, checks, price, expert, ratings, evidence |
| | My runs | Run list, run detail with steps, AI proof, buyer checks, verdict, settlement, reclaim after timeout, rate the run |
| | Waiting for my approval | Outbound actions held for exact approval (bid submission, browser submits) |
| Your private data (What methods may read, under your control) | Connected apps | Broker, spreadsheet, documents and wallet connections (labelled mocks), scopes, expiry, revoke; file import on the device |
| | Documents | Uploaded and downloaded documents, extraction results, personal data warnings, "read by the backend" notice |
| | Saved notes | Memory notes, pending proposals from documents, approve, edit, delete |
| Sell and improve (For experts and contributors) | My methods | Seller drafts, sealed upload, validation, publish with wallet, versions, earnings view, prompt leak warning acceptance |
| | Community fund | DAO balance, council, proposals, votes, bounties |
| | Paid improvements | Issues, contributions, private tests in the TEE, reviews, payouts, new versions |
| Account (Profile, payments and history) | Account and balance | NEAR sign-in, profile, preferences, transactions, earnings, balance status |
| | Activity | Events across runs, protections, reviews and community |

## 5. Wording rules and fixed phrases

Use these phrases consistently: "Run privately", "Seal and run", "See the cost", "Your checks", "Demo seller", "No ratings yet", "Waiting for my approval", "Test top-up (no real money)", "NEAR testnet". A prompt method is always labelled "Prompt" and its answer can be at best "Needs your attention", never "Safe to use". Keep every limit from `README.md` "Limits" visible where it applies (backend not in a TEE for the five protections, mock connectors, uploaded documents read by the backend).

## 6. Process for agents

1. Read this file, `app/backend/API.md`, `app/methods/MANIFEST_V5.md`, then open the reference mock.
2. Build forms and result views from manifest v5 (`inputs.fields`, `outputs.fields`, `buyer_checks`), never per method by hand.
3. Before handing over, check every page against sections 1 and 2 (em dash, bullets, floating text, equal heights, light only, contrast), run typecheck and build, and render at 1440px and 390px.


## 7. Latest layout preferences (Dien, 14 Nov 2026)

These later preferences update the sidebar and density details above.

- Keep the Marketplace and other application pages compact at 100% browser zoom so users do not need excessive vertical scrolling. Reduce padding, gaps, decorative elements and repeated whitespace first. Preserve readable text and usable controls.
- Replace the 280px text sidebar with a narrow, vertically centered capsule icon rail based on the image supplied by Dien. The rail stays fixed in the viewport while the page scrolls. Separate navigation groups with subtle dividers.
- Put the Kalis mark and method search vertically at the top of the rail. Put notifications, current network and wallet status vertically at the bottom. The navigation icons occupy the independently scrollable middle area.
- On hover or keyboard focus, expand the rail to reveal each navigation label and the search field. Reserve layout space and shift the main page to the right while expanded. The rail must not cover page content. Use a short transition and respect reduced-motion preferences.
- On touch screens, provide a clear control to open and close the expanded rail. Keep all links keyboard reachable and provide accessible names while collapsed.
- Keep the capsule light, using the approved Kalis palette. The dark capsule in the reference image describes shape only and does not override the light-theme rule.
- Remove the horizontal header entirely. Its search, network chip, notification bell and wallet button live in the rail (search at the top, the rest at the bottom).
- Match the approved HTML mock closely (structure, sizes, spacing, card layout, icons, table, colours, motion). A first build that simplified the mock was rejected, so do not reinterpret it; port its CSS and SVG and connect real API data.
- Keep the rest of the compact Marketplace geometry from the approved HTML mock: four featured cards, horizontal category strip, six-column method table and adjacent Quick run panel. At narrow widths, cards may stack to fit the screen.

## 8. Distilled Marketplace (Dien, 14 Nov 2026)

This overrides the four-row Marketplace layout in section 3. Dien asked for a compact page that keeps only information tied to the page and has no duplicated elements.

- Removed: the four stat cards (marketing copy repeated on every visit), the four featured method cards (same methods as the table), the separate category strip, the Quick run card (it was disabled and did nothing), the Experts card (same data as the Expert column), the breadcrumb and the standalone info hint.
- The page is two cards. A head card holds the title, one sentence and the method count with refresh. A full-width list card holds kind tabs, goal filter buttons with a sort select, the six-column table and a footer with the count and the demo/no-advice note.
- Category and step count live in the method cell. The checks explanation lives in a tooltip on "Your checks". Seller names already say "demo seller", so no second demo line per row.
- Kind chips use only the fixed short labels "Program", "Program with private AI" and "Prompt".
- Apply the same rule to every other page: one head card, then only the cards that hold the page's own task. Never show the same data twice on one page.
- Revision 2 (Dien, 14 Nov 2026). Kind filter is a small segmented control (white track, active segment solid #0038FF with white text, no icons). Goals are a dropdown ("All goals"), never a row of buttons. Kind chips are white with a 1px border and a small solid colour square (Program blue, Program + AI orange, Prompt pink); no tinted chip fills. Labels are "Program", "Program + AI", "Prompt". The column is "Checks" and shows a plain number. Table headers use sentence case, not uppercase. The method cell has two lines: title, then "category, N steps, rating" in sentence case.
- Revision 3 (Dien, 14 Nov 2026). No "demo seller" label and no "every seller is a demo account" note anywhere in the Marketplace; seller names are shown without the suffix. Each expert name links to a public profile at `/experts/<near account>` built from `GET /api/creators/:account` and the method list: head card with avatar, name, bio or NEAR account, counts (methods, average rating, reviews) and a "View on NEAR" link, then a card "Methods by this expert" with the same table minus the Expert column.
- Revision 4 (Dien, 14 Nov 2026). The method table is replaced by near-square method cards in an auto-fill grid (min 270px). Each card: 52px solid identity icon, title (17px, 700), two-line outcome, a meta row (rating or "Unrated", N checks, N steps) split by thin dividers, the expert as a link to their profile, and a footer pinned to the bottom with the kind chip, "From <price>" and a View button. "Checks" means rules the buyer's device verifies, not sales; there is no sales count in the API yet.
- Revision 5 (Dien, 14 Nov 2026). A seller may replace the method icon with their own image. The card reads `manifest.listing.cover_url` (or `cover_ref`), only `https://` URLs, rendered as a 52px rounded `<img>` with `object-fit: cover` and `referrerPolicy="no-referrer"`; otherwise the identity icon is shown. The kind chip sits top right next to the icon, and the footer holds only "From <price>" and View. No element may cross a card's outer edge: cards use `overflow: hidden`, children `min-width: 0`, and long text truncates or wraps.
- Revision 6 (Dien, 14 Nov 2026). NEAR sign-in is live in the rail (bottom wallet button) and on "My methods" (`/marketplace/mine`): Wallet Selector (MyNearWallet, Meteor, testnet), then `POST /api/auth/challenge`, NEP-413 `signMessage`, `POST /api/auth/verify`. The session token lives in sessionStorage and is sent as `Authorization: Bearer` through the proxy (which forwards only a 64-hex bearer). The wallet modal is forced to the light Kalis palette in `globals.css`. "My methods" lists the account's listed methods and drafts; "Change picture" crops to a 320px square, encodes WebP and posts to `POST /api/methods/:id/cover`.
- Revision 7 (Dien, 14 Nov 2026). A page's explanation sentence never sits loose under the title. Package it as a "How it works" pill button beside the title that opens a small popover: a bold title plus two or three rows, each with a solid blue icon tile and one short sentence. Apply this to every page. Filters use one control family from `src/components/controls.tsx`: `Segmented` (white track, 1px border, solid blue pill that slides to the chosen option, hover tint on the others) and `Dropdown` (same 42px frame and radius, "Label Value" inside, chevron rotates, menu fades and drops in, chosen item solid blue, keyboard arrows, Enter and Escape). All motion is switched off under `prefers-reduced-motion`.
- Revision 8 (Dien, 14 Nov 2026). The page info trigger is a quiet 26px (i) icon without border or text (70% opacity, blue on hover); its popover is 270px with 12.5px rows and pale icon tiles. No method count in the head. The (i) button and the refresh button sit together on the right, both 32px outlined icon buttons; the popover opens aligned to the right edge. The network is shown once, in the rail, not repeated in page heads.

## 9. Approved page template (Marketplace final, Dien, 14 Nov 2026)

Dien approved the Marketplace at `/marketplace` (`app/web/src/components/marketplace-next.tsx`, `controls.tsx`, `reference.css`) as the final design. Build every other page from this template. Where sections 3 to 8 disagree with this section, this section wins.

### Shell
- Light only: page `#F4F4F4`, cards `#FFFFFF`, ink `#101010`, secondary ink dark grey, one accent `#0038FF`. Identity colours (orange, pink, butter, periwinkle, red) only for method icons and kind markers. Solid fills, no tints as backgrounds of chips, no gradients, no dark surfaces (third-party modals are forced light).
- Inter only. Visible text weight 500 or more. Sentence case everywhere, no uppercase labels, no letter-spaced headers.
- Capsule icon rail on the left, vertically centred, expands on hover and pushes content. Kalis mark and search at the top, notifications, network and wallet sign-in at the bottom. No horizontal header, no breadcrumb.

### Page head
- One white card: page title (22px, 700) on the left; on the right a row of 32px outlined icon buttons (page info (i), refresh, other page actions).
- No sentence under the title, no counts, no network label. The page explanation lives in the (i) popover: 270px, a bold title and two or three short rows with pale icon tiles, opening aligned to the right edge.

### Content
- One main card per task. Its toolbar holds the filters: `Segmented` for two to four options, `Dropdown` for longer lists (never a row of many chips). Both are 42px, white, 1px border, radius 10px, active state solid blue, with motion (sliding pill, rotating chevron, dropping menu, value fade).
- Items are near-square cards in an auto-fill grid (min 270px): icon or seller image top left, kind chip top right, bold title 17px, two-line description, a meta row split by thin dividers, a linked owner, and a footer pinned to the bottom with price and one outline action button. Nothing may cross a card edge.
- Numbers alone when the column or label already names the unit. Short labels ("Program", "Program + AI", "Prompt"). No ":" explanations, no em dash, no bullets, no floating text.
- Never show the same data twice on one page. Remove stat cards, featured duplicates, disabled widgets and repeated disclaimers. A page should fit one 100% zoom viewport when its content allows.
- Every name that has its own page is a link (experts go to `/experts/<account>`).

### Motion and states
- Hover: cards lift 2px with a soft offset shadow and blue border; buttons turn blue. Every motion is short, eased out and off under `prefers-reduced-motion`.
- Honest states: loading, empty ("No method matches..."), error with retry, sign-in required. No fake data and no dead buttons; if something cannot work yet, leave it out.

### Marketplace pages built from the template (14 Nov 2026)
- Shell is shared: `src/components/shell.tsx` (`AppShell`, `icon`). Search on any page jumps to `/marketplace?q=`.
- `/marketplace/<id>` and `/<tab>` (`method-detail.tsx`): head card (back, title, (i), refresh); main card with `Segmented` tabs Overview, Inputs, Checks, Versions, Reviews (each tab is a URL); side card with icon or cover, kind, price per run, payout split bar (expert, community fund, Kalis), expert link, "Before you run" disclosures (collapsed), and "Run privately" pinned at the bottom (links to the existing run flow `/connected/runs` until that page is rebuilt). Everything comes from the manifest and the reviews API.
- `/experts/<account>`: back button, avatar, name and account chip in the head; stats and "View on NEAR" on the right; method cards below.
- `/marketplace/mine` and `/marketplace/publish`: sign-in, your methods with picture upload, and "Start a new method" (creates a draft only; manifest, sealing and on-chain publish are not in the app yet, and the form says so).

### Rail pages built from the template (14 Nov 2026)
- `/runs/new?method=&version=` and `/runs/<id>` (`run-page.tsx`): segmented stages Your data, Pay, Run, Result. The data form is generated from `inputs.fields` and prefilled with the synthetic `inputs.sample`; data is sealed with `crypto.sealData`, paid with the test top-up, executed, opened in the browser, compared with the runner signature and chip attestation, and checked with `runChecks` (`src/lib/backend/checks.js`, a verbatim copy of the backend module; `crypto.js` is again identical to `kalis-crypto.js`). Then settle and rate. The sealing key lives only in the tab's memory.
- `/runs` My runs, `/approvals` Waiting for my approval, `/activity`, `/account` (also `/balance`), `/community`, `/community/bounties`, `/connections`, `/workspace/files` Documents, `/workspace/memory` Saved notes, all in `app-pages.tsx`: head card, one main card with a `Segmented` filter, rows, honest empty states, and the README limits as note rows (protections run on the Kalis server, connections are mocks, balance is unavailable).
- Chain text is cleaned for display (`[kalis:...]` tags removed, "| Accept if:" moved to the second line).
- Fields (Dien, 14 Nov 2026). Every input, select and info row uses the Dropdown frame: 42px, 1px border, radius 10px, label inside on the left in grey 600, value on the right in ink 650 (`.fx` in `reference.css`). Yes/no and fixed choices use `Dropdown`, never a native select. Long text uses the same frame with the label on top (`.fx.tall`). Help text goes in the field's tooltip, not below it. Checkboxes are custom 20px squares that turn solid blue. Do not repeat the active tab name as a heading.
- Navigation naming (Dien, 14 Nov 2026). Rail items are short nouns in Title Case and page titles match them exactly: Marketplace, Runs, Approvals (group Buying); Connections, Documents, Notes (group Private Data); Listings, Fund, Bounties (group Selling); Account, Activity (group Profile). Titles also use Title Case (Dien, 14 Nov 2026, evening): page, card, panel, step and section headings follow English title-case rules (major words capitalised; a, an, the, and, or, of, to, in, on, for, with, by, at stay lowercase unless first or last), e.g. "Inputs and Answer", "Review and Publish". Sentences, hints, messages and action buttons stay in sentence case. Never mix the two styles inside one element.


## 10. Role navigation (Dien, approved 14 Nov 2026)

The rail has a Consumer / Author role selector and expandable parent navigation with child links. Consumer parents are Marketplace, Runs, Data, Community and Activity. Author parents are Listings, Community and Activity. Marketplace contains Methods. Runs contains History and Approvals. Data contains Connections, Documents and Notes. Listings contains Methods and Drafts. Community contains Fund (including proposals and council) and Bounties (including reported problems). Activity contains History. Account and Sign out remain in the wallet menu. Roles organise navigation and do not confer permissions. Preserve access through the role selector and existing routes.

Revision to section 10. Parent headings sit farther left, with visibly indented child links and a subtle vertical guide. All child links appear immediately when the rail expands. No accordion click or individual parent hover is required.

Navigation density revision. Preserve the approved indentation, while reducing parent/child row heights, icons and group gaps so the whole role navigation fits without scrolling on ordinary desktop heights. Use compact 12px navigation labels and 28px rows, tightening to 25px on short viewports. Keep overflow as a fallback for very short screens, zoom and accessibility rather than clipping destinations.

Capsule proportion correction. Its height follows its contents, centered vertically, with only a viewport max-height. Do not stretch the capsule to viewport height or push bottom utilities away with auto margins. Collapsed parent icons use 24px inside 44px rows. Expanded navigation keeps compact indented rows, followed closely by notifications/network/wallet. Avoid a large empty gap after History.

Sidebar spacing. Use equal vertical gaps between Role and the first parent (Marketplace for Consumer), and between the last child (History) and Notifications. Navigation has symmetric top/bottom padding and no extra trailing group padding.

Sidebar refinement. Lower the navigation and following utility area slightly beneath Role. NEAR testnet is a noninteractive network status, with an icon and quiet text, no filled button background or button border.

Sidebar grouping correction. Notifications belongs at the end of the central navigation block. Give this block equal top and bottom margins between Role above and the network/account block below. Place the noninteractive NEAR testnet status immediately above the wallet Connected label, aligned with its text, and show the network identifier as Chain ID testnet. Do not invent a numeric EVM chain ID for NEAR.

Approved naming revision. Replace Runs parent with Jobs. Its children are Ongoing, Results and Approvals. Ongoing and Results use separate URLs and titles. Results includes released or refunded jobs, without promising a decrypted answer survives reload.

Page orientation revision. Each subsection page should visibly explain its purpose for first-time visitors. Package a concise explanation inside a small inset note row within the title card, with a blue icon. Describe what is shown and what the visitor can do. Extra details stay in the existing info popover. This supersedes the earlier rule that all explanation must be hidden in the info popover.

Jobs consolidation approved by Dien. Jobs contains only Ongoing and Results. Ongoing shows Needs your approval above its job list, including outbound actions without an attached job. Preserve exact-action-hash approval and rejection. Existing /approvals links open the same Ongoing surface for compatibility.

Contextual action placement. When a button follows from an explanation or empty state, place it immediately beneath that text within the same content group. Do not put that action in a toolbar above the explanation. Filters and global page actions remain in their toolbars. Apply this to job empty states, connection/document onboarding and similar contexts.

Empty-state packaging correction. Put the explanation and its contextual action inside the same grey note panel. The button sits beneath the text, aligned to the text column beside the icon, and never outside the panel.

Author naming approved. Methods replaces Listings, with Drafts and Published child pages. Create method is a button within Drafts. Existing draft creation remains draft-only, without implying manifest/seal/publish is implemented.

Community structure approved. Both roles have Fund, Proposals, Bounties and Issues as child links. Fund shows treasury and council, Proposals shows funding decisions, Bounties shows paid improvement opportunities, Issues shows reported problems. Contribution tests, reviews and payout belong within bounty/contribution details.


## 11. Documentation reconciliation, 14 November 2026

Current capability and evidence boundaries live in CURRENT_STATE.md, with route coverage in app/web/COVERAGE.md. Earlier notes saying seller creation is draft-only or community is read-only are historical. SellerEditor and wallet request/confirmation UI now exist, but presence is not authenticated E2E proof. The active source shell exposes Author Methods → Create and Published, while earlier naming approval says Drafts. Keep that difference explicit until resolved, rather than treating implementation as a new naming approval.

All five protection services run on the ordinary backend. Current checkout additionally sends private-marked values plaintext to protections/private-values for outbound detection. Operator-blind claims must not hide this gap. No new design decision or privacy exception is approved by this note. Deployment is postponed and Social Money innovation is the next discussion after sync.
