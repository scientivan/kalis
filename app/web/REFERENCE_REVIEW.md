> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Marketplace reference review

Reviewed marketplace-reference.html supplied by Dien. Source inspection only. Browser rendering has not yet been performed.

The implementation must preserve the reference DOM grouping and CSS geometry instead of approximating it with generic cards.

| Element | Reference | Current implementation gap |
| --- | --- | --- |
| Sidebar | 280px, workspace options, pill role selector and blue plus, four dashed navigation groups | Role controls missing, one repeated icon everywhere |
| Header | 74px, burger, spaced KALIS wordmark, search, network chip, notification and wallet controls | Simplified header and Account link |
| Page heading | Title and full promise alongside a compact count and view toolbar | Toolbar absent |
| Stats | Horizontal blue glyph and stacked label/value | Vertical arrangement, repeated glyph |
| Method cards | Icon beside category/title, price beside kind, full-width colored track and caption | Everything stacked, no continuous tinted footer |
| Identity | Dedicated icon/color per method, reused across cards, categories and expert rows | Index-based colors change with filters |
| Categories | Icon plus label/count, five equal segments, dashed vertical dividers | Plain filter buttons |
| Main split | Flexible table and 340px sidebar, 12px gap, equal bottom edges | Different ratio and 18px gaps |
| Table | Six fixed grid columns, uppercase header, dashed rows, underline tabs, segmented sort, pinned pagination | Wrapping flex rows, no column headers or pagination |
| Quick run | Three inset labels, blue and pink 50px actions | One ordinary select and review link |
| Experts | Identity icon, name/role, aligned method count and demo label | Simple name list |
| Mobile | Below 560px featured cards, stats and categories become single column | Two columns remain |

Reference caveats

The mock contains static counts, seller examples and a notification count. Production values must come from the API. Its dark-mode button conflicts with the binding light-only rule and must not enable a dark theme. Unimplemented wallet or run actions must visibly explain their unavailable state. No fabricated action completion.

Motion uses one page fade, equal-height step bars growing in sequence, hover lift and finite approval pulse. Match the reference geometry while retaining reduced-motion support and keyboard focus.

Next implementation should port reference styles and SVG symbols into scoped Next.js components, replace only static data and event wiring, then compare rendered reference and page at 1440px and 390px. No claim of visual parity until that comparison is performed.

Compliance gate found no conflict. Review and documentation are confined to app/web.
