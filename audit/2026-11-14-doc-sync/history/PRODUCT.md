> Historical Git HEAD baseline retained during the 14 November 2026 reconciliation. This is not the current working-tree state. Read [../../../CURRENT_STATE.md](../../../CURRENT_STATE.md) for current decisions, evidence and limits.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, deployed to Vercel (confirmed by Dien, 13 Nov 2026). Any public deploy needs Dien's explicit confirmation first. NEAR testnet contracts in Rust. Methods run as WASM in OutLayer TEEs. AI calls go to NEAR AI Cloud.

## Users

- **Buyers** who need an expert method but cannot hand over their data: individuals with a private portfolio (positions across accounts, cash needs), and businesses preparing a tender bid (cost price, minimum margin, win/loss history). Web2 and web3 buyers both count; web2 buyers top up with fiat.
- **Sellers**: experts (a portfolio strategist, a procurement consultant) who will only sell a method if buyers cannot see how it works.
- **Contributors and DAO members** who fund and approve method improvements through a shared fund.
- **Hackathon judges and AI screeners** read the landing page and README first and check that every claimed feature actually runs.

## Product Purpose

Kalis lets a buyer run a seller's secret method on the buyer's own sensitive data, so a deal can happen that neither side would risk otherwise. The buyer does not reveal the data to the seller or to the platform operator. The seller does not reveal the method to the buyer. Part of each payment goes to a shared DAO fund that pays bounties for accepted method improvements, with version and contributor history recorded on NEAR.

Success for the MVP is a demo where a judge can watch one buyer run the portfolio method privately, see the proof of what ran, and understand why this needs NEAR.

## Positioning

Kalis guarantees how a method runs and how both sides are protected, not that a method is good. Method quality is the seller's responsibility and is judged by buyers. The supply argument: these methods are not in general AI tools because their owners will not reveal them without protection.

Name: **Kalis**, an Indonesian word. KBBI: unable to get wet (like a taro leaf), immune, kept from harm; *kalis air* means waterproof. Meaning for the product: data and secrets do not leak through.

## Operating Context

- Buyer data is encrypted on the buyer's device and opened only inside an OutLayer TEE. The OutLayer coordinator and the public chain see only ciphertext (proven on testnet, `BUILD_STATUS.md` 6.1).
- Seller code runs inside a platform runner sandbox with no network (option B, `RANCANGAN_PRODUK.md` section 52).
- Each method version has three hashes on NEAR: seller code, manifest, runner (`registry.scientivan.testnet`).
- AI steps use NEAR AI Cloud models that pass attestation. Proprietary models (Claude, GPT) are allowed only with a buyer warning, privacy filtering and explicit consent.
- Demo use cases: portfolio rebalancing at minimum transaction cost (runs end to end), tender bidding (second demo), salary negotiation (illustration only).

## Capabilities and Constraints

- Working now (testnet): sealed input and output through OutLayer, NEAR AI attestation and response signatures, method registry contract.
- Not working yet: OutLayer runs of the sandbox runner (testnet failures since 13 Nov 12:00 UTC), DAO fund and bounty, the five protections, frontend.
- Mock and labelled as mock: fiat top-up, broker connector, procurement portal. All demo data is synthetic or fictional.
- Browser agent runs on an ordinary backend, not in a TEE. This must be stated as a limitation.
- Deadline 14 Nov 2026 23:59 UTC.

## Brand Commitments

- Approved hero hook, 13 Nov 2026. “Where expertise is traded, run privately, and improved together.” Dien chose the flowing sentence over the imperative alternative. The message gives sellers and buyers equal standing.

- Latest hero direction, 13 Nov 2026. Dien rejected the previous batik hero as AI slop and requested a clean, simple, interactive replacement using https://hellonear.xyz/ as the reference. Preserve the product facts and typography preferences. Batik may remain a subtle accent. The replacement draft is not yet approved. Section 53 overrides the earlier batik composition.

- Name Kalis.
- Dien's design preferences are binding (`~/.claude/DESIGN-PREFERENCES.md`): nothing that looks AI-made, clean simple type (SF Pro system stack, Inter fallback), weight 500 or more, solid colors, textured page background, no labels stacked above headings, no ":" or em dash in UI copy, meaningful motion, honest copy.
- Structural reference given by Dien: https://deltacafes.com/en (Awwwards). Use its structure and pacing only, not its content, palette, fonts or shapes.

## Evidence on Hand

- Testnet transactions and attestation records listed in `BUILD_STATUS.md` section 6.
- Synthetic portfolio cases in `validation/portfolio-method-02/cases.json`.
- No customers, testimonials, partners, prices, usage numbers or benchmarks of method quality exist. Do not invent any.

## Product Principles

1. Show the mechanism, not adjectives. Every privacy claim on screen points to something a visitor can verify.
2. Both sides are protected. Never frame the product as only buyer privacy or only seller secrecy.
3. Say what is mock and what is not, on the screen where it appears.
4. A first-time visitor must understand each label and number without a glossary.

## Accessibility & Inclusion

No product-specific requirement established. Follow WCAG AA contrast, keyboard access and `prefers-reduced-motion`.
