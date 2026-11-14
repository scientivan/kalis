# Senyap layout reference for Kalis

Reference https://senyap.scientivan.dev/ inspected 15 November 2026 through live HTML, CSS and Chrome section captures. Dien explicitly chose it to replace Extrafazant. The request concerns layout and positioning, with Kalis colors and existing product illustrations retained. This supersedes both earlier reference directions for the current local landing draft.

## Layout observations

Senyap uses a viewport-height hero, overlaid navigation, a large lower-left headline and CTAs, a large interactive scene in the upper-right and a compact preview lower-right. Lower sections are white. Its explanatory sequence pairs a sticky left-hand list with interactive product panels down the right. Subsequent sections pair concise large headings and a single demo or role-based view. Thin boundaries, rounded interaction panels and generous separation give the content space without narrowing the whole page to an app shell.

## Implemented Kalis layout

The landing root explicitly resets main max-width, margin and sidebar padding inherited from globals.css. The root and section backgrounds fill the viewport width, while inner gutters provide readable text alignment. The hero occupies 100dvh without a separate header row. On very short mobile screens it expands to fit content rather than clipping controls. Existing Kalis landscape, Meeting K, Three.js sculpture, generated editorial image and app UseCaseArt illustrations are reused. No Senyap red/gold, vault artwork, proprietary content or data-market features are copied. Previous condensed/serif type is removed from the current design. Inter is restored throughout.

Core composition mirrors the reference. Hero headline/CTA lower-left, existing scene upper-right, workflow preview lower-right. Technology/connector strip follows. Intro is two columns. Privacy has a sticky left list and four interactive right-side demos. Participant view explains buyer/expert/platform boundaries. Marketplace switches buyer/author views, with actual method illustrations and app links. Community fund has an illustrative split, followed by FAQ and a large final invitation. Hero asset design remains unchanged, only placement/size changes.

## Interaction and accessibility

Sealing preview is explicitly a visual simulation. Buyer-check illustration evaluates a fixed fictional bid of 112 against cost 100 and a user-selected margin. A 10 percent margin passes, 20 percent fails. Outbound approval and author/buyer/participant switches do not send requests or transact. The connector strip uses actual catalog statuses. Desktop scroll updates the privacy list. Mobile stacks the columns. Decorative motion respects reduced motion, pause, viewport visibility and hidden tabs. Existing hero offers its own pause control.

## Verification

Production build and TypeScript pass. Browser viewport measurements and functional checks are recorded in BUILD_STATUS.md. No deployment or final visual approval is implied.

## Subsequent hero refinement

Dien removed the lower-right workflow preview card. It is deleted from the DOM. Hero now groups copy, CTA and animation control in a left-hand reading block, with the existing scene on the right. Product Inter is explicit, with hero weight 600 and section headings 500. Navigation is one floating capsule containing logo, links and app CTA. Initially wide, it contracts after 64px of scroll and moves from 16px to 24px below the viewport top. Mobile uses a toggleable menu, and reduced motion removes the geometry transition. These decisions supersede the earlier preview-card and light-weight typography interpretation.
