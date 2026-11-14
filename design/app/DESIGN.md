> **Superseded on 14 Nov 2026.** Use `../../FRONTEND_GUIDE.md` for the app. This file is kept as history.

---
name: Kalis app preview
description: Reference-led private workspace in Operate mode
colors:
  canvas: "#edf0eb"
  surface: "#ffffff"
  surface-soft: "#f6f7f3"
  surface-muted: "#e1e6df"
  ink: "#19231e"
  secondary: "#536158"
  line: "#d8dfd6"
  control: "#7a897d"
  dark: "#17251e"
  on-dark: "#f7faf5"
  on-dark-muted: "#bccabd"
  green: "#32664e"
  green-soft: "#e6efe7"
  amber: "#795e2c"
  amber-soft: "#f2ecdd"
  red: "#8f4037"
  red-soft: "#f7e8e4"
  focus: "#226c51"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  headline:
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-.035em"
  title:
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-.025em"
rounded:
  r-sm: "8px"
  r: "14px"
  r-lg: "20px"
  pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "20px"
  s6: "24px"
  s8: "32px"
  s10: "40px"
  s12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.green}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.r-lg}"
    padding: "28px"
---

# Kalis app design contract

Review status, 14 November 2026. The user rejected pastel status fills, detached helper messaging, inconsistent method naming and the current method detail composition. Tokens below record the existing prototype, not an approved visual direction. See CRITIQUE.md for the independent review and proposed revision.

## Overview

This contract covers only `design/app`, an interactive frontend preview in Operate mode. Its visual anchor is the user's two pinned Corbel dashboard references, with a light sage canvas, restrained green accents, clean white panels, a pill navigation treatment and a compact dark utility rail. It does not replace the landing page's design contract.

The decision receipt is reference-led top navigation with a utility rail. The considered full sidebar alternative was not selected for this prototype. The implemented top navigation has a pale pill container and a dark selected item. This records the actual code rather than claiming exact screenshot reproduction. The shared shell accommodates multiple roles without a role switch.

Sources are `index.html`, `app.css`, `app.js`, `data.js`, the current user brief, and `RANCANGAN_PRODUK.md` sections 0, 52 and 54–56. Earlier navigation proposals and `PRODUCT.md` can be stale. The current brief and implemented five-area shell govern this artifact. Product guarantees describe the intended execution system, not capabilities of this preview.

Verification receipt from the finish reviewer records all eight earlier code findings resolved and nine passing controller checks from `node verify.cjs`, using DOM doubles. Native rendering remains unverified because Chromium launch failed with MachPortRendezvous error 1100. There has been no visual pass. Do not describe this artifact as visually approved or browser QA complete.

## Colors

The palette uses low-saturation sage, forest green and warm white. Exact primitives are in the frontmatter and mirror `app.css`.

| Role | Tokens and use |
| --- | --- |
| Canvas and surfaces | `canvas` behind content, `surface` for white panels, `surface-soft` for secondary areas, `surface-muted` for tabs and inactive fills |
| Text and structure | `ink` for main text, `secondary` for supporting text, `line` for dividers, `control` for form borders |
| Dark anchors | `dark` for selected navigation, primary actions, utility rail and feature panels, with `on-dark` and `on-dark-muted` text |
| Positive and selected | `green` for accents and hover, `green-soft` for selected choices and ready states |
| Attention and errors | `amber` with `amber-soft` for waiting and warnings, `red` with `red-soft` for errors |
| Keyboard focus | `focus` for visible outlines |

Status text accompanies color. A declined decision retains its literal status even where existing badge styling uses the ready palette. Color alone is not a decision signal.

## Typography

Use the system SF Pro-oriented stack in the frontmatter. There is no remote font dependency. Body copy is 14px with 1.5 line height and weight 500. Supporting text uses 12px and 13px, with some compact metadata at 11px. Section headings use 16–18px and weight 600. Page headings use 28px, reducing to 25px at the mobile breakpoint and 24px on narrow screens. Dark resume headings use 24px. Monetary summaries may use 32px.

Keep prose concise, concrete and task-oriented. Use tabular numerals for counts. Long names wrap in titles and result values. Do not insert bullet characters into interface copy.

## Layout

The desktop shell has a 1680px maximum width, a 100px header and main content padding of 22px 40px 0 112px. The fixed utility rail starts at left 24px and top 235px. Primary content uses generous 20–24px gaps with compact controls. The workspace overview pairs a wide resume panel with a review panel. Marketplace uses three columns. Detail pages pair main content with supporting panels. Forms have an 800px maximum width.

| Breakpoint | Implemented behavior |
| --- | --- |
| At least 1600px | Rail position follows the centered maximum-width shell |
| At most 1200px | Left content inset becomes 96px, right inset 28px, navigation spacing contracts |
| At most 1000px | Header wraps, navigation occupies a full second row, detail layout becomes one column, table date column hides |
| At most 760px | Rail hides, header search appears, content inset is 20px, catalogs and primary layouts stack, work rows become mobile cards, form grids stack, navigation count hides |
| At most 380px | Content inset reduces to 14px and navigation and tab spacing tighten |

All five main destinations remain visible on mobile. The dialog is 560px wide, capped at viewport width minus 32px and 85vh height. Responsive rules are code evidence, not verified rendering results.

## Elevation & Depth

Most surfaces rely on tonal contrast and dividers. The shared overlay shadow is `0 16px 42px -12px #20332624`, applied to the account dropdown, modal and toast. Active tabs have a subtle `0 2px 6px #23362608` shadow. Modal backdrop uses `#14231c66`. Avoid adding decorative elevation to ordinary data panels.

Color transitions last 150ms. System reduced-motion preference disables transitions and animation, and the session preference can disable them independently. Focus outlines are 3px with a 4px offset, with a 3px offset on search containers.

## Shapes

Use 20px corners for primary panels and dialogs, 14px for intermediate containers, and 8px for inputs and compact elements. Navigation, tabs and action buttons use pill corners. Avatars and icon actions are circular. Badges use 6px corners. Icons are inline stroke SVGs, generally 20px with 1.7 stroke width. Keep shapes functional and restrained.

## Components

| Component | Contract and behavior |
| --- | --- |
| Main navigation | Exactly Workspace, Marketplace, Community, Activity and Balance. Active route uses `aria-current`. No role switch |
| Named-user dropdown | Exactly Account, Connections and Permissions & preferences. Outside click closes it, Escape closes and restores trigger focus |
| Utility rail | Compact icon actions with hover and keyboard-focus labels. Mobile uses header search and footer help |
| Buttons | Primary dark fill, green hover, 42px minimum height. Secondary transparent fill with control border. Small variant 36px. Disabled controls use opacity .55 and a not-allowed cursor |
| Tabs and filters | Pale muted container with white selected tab. Filters expose selection with `aria-pressed`, navigation tabs with `aria-current` |
| Panels and tables | White rounded surfaces, thin row dividers, restrained hover fill. On mobile, work records become stacked rows |
| Fields | Visible labels, 1px control border, 8px radius and 12px 14px padding. Native required and numerical validation remains active |
| Search | Search work and method titles through a modal. Command/Ctrl K opens it. Catalog search and category filters update results locally, with a no-match recovery action |
| Work creation | Select method, enter constraints, review, then save a session draft. Back navigation preserves entered constraints. No method executes |
| Decisions | Pending requests may become Approved or Declined. Approved memory updates the session memory list. External-action approval records a sample decision and sends nothing |
| Balance | Initially disconnected. Mock top-up has pending, simulated failure, retry and success states. Closing the dialog cancels the pending UI update. Funds have no monetary value |
| Dialog and feedback | Native modal, close action, Escape and outside-backdrop dismissal. Closing restores opener focus. Toasts expire after 4200ms |
| Accessibility | Skip link, explicit focus styling, main-region focus on route changes, descriptive control labels, reduced-motion support and status announcements |
| Empty and error states | Empty memory, methods, contributions and financial records are explicit. Unknown routes show recovery to Workspace. Simulated top-up errors use an alert |

All data is synthetic or fictional and resets on reload. File entries are metadata records, not uploaded source documents. Portfolio evidence is the historical synthetic C03 sealed-probe result, not a new live run. Tender is planned, and salary negotiation is illustration only. Connections collect no credentials. Draft publication is session-only. Community voting, bounty payment and live settlement are not implemented here.

The payment illustration keeps a seller-selected shared-fund share of at least 10%, a fixed 10% platform share and the remaining seller share. Infrastructure is shown separately. Do not invent checkout totals, payment proof, product performance, populated community metrics or backend contracts.

## Do's and Don'ts

| Do | Don't |
| --- | --- |
| Preserve the five-area shell and contextual child tabs | Reintroduce Settings as a sixth main item or add a role switch |
| Keep muted greens, offwhite canvas and clear white surfaces | Import the landing page palette or add unrelated decorative effects |
| Show fictional, mock, historical and planned states honestly | Present local UI updates as encryption, execution, payment or external delivery |
| Keep permission scopes and destinations explicit | Treat navigation visibility as authority to access private data or sign transactions |
| Retain keyboard focus and reduced-motion behavior | Claim browser or visual validation from controller tests |
| Use task-specific results and restrained labels | Invent testimonials, prices, performance improvements or success metrics |

Compliance gate passes for local documentation of this synthetic preview. This task performs no submission, public publication, push, signing, spending or deployment.


## Marketplace revision

The revised Marketplace uses compact white listings, line icons, no pastel status pills, canonical method names and visible user rating/review counts. Empty ratings explicitly state No ratings yet. Method detail prioritizes an output example with a single use panel and separates reviews from test evidence. Reviews, versions and contributions have method-specific routes. The draft editor captures input, output, access and limitations. No seller, price or review values are invented. Existing token and component descriptions above record earlier surfaces and are superseded within Marketplace by the scoped market classes in app.css. Browser render remains unverified.


## Image-led Marketplace

OKX reference applied with local 640px photographic covers of architecture/workspaces. These represent listing artwork, never creator identity. Desktop catalog has two columns with image/text rows, single whole-card anchors, grouped ratings and consistent price metadata. Detail uses matching cover in the identity header. Reviews show aggregate and distribution in overview and dedicated route, honestly empty. My methods and draft detail retain the selected cover. Creator form offers three covers with an immediate preview. New styles at the end of app.css override earlier Marketplace card rules. Native rendering remains unverified. Source photo URLs are recorded in assets/README.md.


## Functional coverage pass

The user prioritized requirement coverage over UI polish. flows.js adds 23 workflow screens and session record details, connected through related links. No new navigation parent is introduced. Reports and escrow states are synthetic fixtures. COVERAGE.md is authoritative for partial journeys and missing integration. Forms preserve draft semantics and never collect real secrets or claim authorization from a typed authority reference.
