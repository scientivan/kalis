> Historical Git HEAD baseline retained during the 14 November 2026 reconciliation. This is not the current working-tree state. Read [../../../CURRENT_STATE.md](../../../CURRENT_STATE.md) for current decisions, evidence and limits.

<!-- ryux-context:start -->
## RYUX project context

RYUX reads this block before any design task. These answers are the team's context and direction,
not evidence or verified facts: RYUX follows them and still backs its decisions with evidence.
Blanks stay unknown. UI direction describes character, not colors, fonts, or spacing.

- **Product**: Building a private AI method marketplace on NEAR for NEAR Hackathon 2026. Experts sell valuable methods, like a portfolio strategy or a tender pricing method, that stay secret. Buyers run them on their own sensitive data without showing it to the seller or to us. Methods run inside OutLayer TEEs.: Building a private AI method marketplace on NEAR for NEAR Hackathon 2026. Experts sell valuable methods, like a portfolio strategy or a tender pricing method, that stay secret. Buyers run them on their own sensitive data without showing it to the seller or to us. Methods run inside OutLayer TEEs.Buyer data is encrypted on the buyer's device, and a version hash plus attestation prove which method ran. This sealed run already works on testnet. AI steps use verifiable models on NEAR AI Cloud.In progress: five protections (credentials kept in the TEE and never given to the AI, outbound data held until the user approves, memory changes that need approval and keep their source, private handling of PDFs and scans, a browser agent with limited actions). Part of each payment will fund a shared DAO that pays bounties for method improvements, with version and contributor history on NEAR. Web2 buyers top up with fiat, web3 buyers pay crypto.
- **Current work**: A new product
- **Audience**: Consumers
- **Market and locale**: Global, several markets
- **Why choose it**: (why this audience would pick it over what they use now)
- **Taste references**: Luno admin template CRM and Crypto (wrraptheme.com/templates/luno) for structure, extrafazant.nl for colour; rejected batik and HelloNear hero drafts
- **What people do in it**: (the three main things people do in the product)
- **Numbers that may be shown**: (a minimum, a fee, a limit; or none yet)
- **Brand and design system**:
- **Product docs**: paths RYUX reads for product facts, for example docs/prd.md:
- **Evidence sources**: RYUX MCP (early access, by key), Figma files, reference URLs:
- **Constraints**: Responsive website
- **Design intent**: Learn the product step by step
- **UX direction**: Clear for people using it for the first time
- **UI direction**: Clean admin layout in the Luno Crypto style, light theme only, white surfaces, black text, electric blue accents, icons on every menu item and most information rows
- **Voice and tone**: Warm and casual
- **Motion direction**: Meaningful and finite in the app (step tracks drawing in, card lift, pending dot pulse), expressive on the landing page
<!-- ryux-context:end -->


## Current app direction (14 Nov 2026)

The binding rules, palette, layout and navigation for the app are in `FRONTEND_GUIDE.md`. The reference mock is `design/app/marketplace-luno-crypto.html`. Structure follows the Luno admin template (Crypto variant), colour follows extrafazant.nl, light theme only. The Corbel draft below is superseded.

## App surface design (superseded)

The local application draft has its own documented system at [design/app/DESIGN.md](design/app/DESIGN.md). It follows the user-provided Corbel references, with five main destinations and the named-user account dropdown. This surface-specific record supersedes earlier landing-page visual choices only for the app. Rendered visual review remains pending.
