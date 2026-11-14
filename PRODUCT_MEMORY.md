# Product communication decisions

## Explicit user preferences

- Pembaruan desain 13 November 2026. Draf hero batik ditolak karena terasa AI slop. Referensi terbaru adalah https://hellonear.xyz/, dengan tampilan simpel, bersih dan interaktif. Pengguna meminta pengerjaan hero pengganti dimulai. Batik boleh menjadi aksen halus. Hasil draf baru tetap memerlukan review dan belum disetujui. Lihat `RANCANGAN_PRODUK.md` bagian 53.

- Begin product documents and demo videos by mentioning multiple suitable user segments and concrete scenarios. Present the product's breadth first.
- Then explicitly explain that the document or demo uses one segment and one scenario to make the product's workflow and core value easier to understand. That example does not define or restrict the whole target market.
- Do not present the demo persona as the product's sole audience or an approved exclusive target market.
- The example marketplace method must embody distinctive, valuable expertise, strategy, or procedure. Its output should demonstrate efficient resolution of a meaningful problem and give users a concrete reason to pay for the method.
- A generic summary, task list, or draft reply is insufficient as the principal demonstration of method value.
- The user's analogy is a private trading strategy people pay to use because of its performance. This describes the desired value of proprietary expertise, not a request to build a trading product or promise repeatable success.
- Show inputs, consequential decisions, actionable outputs, and how results are evaluated. Do not invent proof of performance or efficiency.
- Keep explanations focused and concise. Avoid repeatedly expanding the product into unrelated concepts.

## Current product direction (as of 13 November 2026, version 1.29)

Read `RANCANGAN_PRODUK.md` section 0 first. It overrides older entries below, which are kept as history.

- Product name: Kalis (Indonesian, from KBBI: impervious to water, immune).
- Private AI workspace with a marketplace for expert methods. Sellers sell methods that stay secret. Buyers run them on their own sensitive data without revealing it. A shared fund pays for method improvements.
- The product guarantees how methods run and are protected, not method quality. Method quality is the seller's responsibility, judged by buyers (for example through ratings).
- Tracks: Privacy & Private AI, Social Money, Open Innovation.
- MVP demo method: minimum-cost portfolio rebalancing under user allocation and cash limits, based on `validation/portfolio-method-02/`. Synthetic data, no profit promise.
- Frontend illustrations: portfolio, salary negotiation, tender bidding. Portfolio and tender run end to end. Salary negotiation is illustration only.
- The five protections (credentials, outbound data, persistent memory, multimodal documents, browser agent) are all built and working in the MVP. The demo video shows only some. The README documents all of them. Anything not working at submission is listed as a limitation. Which protections apply depends on the method sold.
- Third-party integration (for example a trading platform or broker) is a focus. Use a clearly labelled mock connector if no real API key. No real trades.
- Second demo use case: tender bidding (web2), showing browser agent, memory, documents and outbound data protection.
- Payment is hybrid. Web2 buyers top up a balance with fiat, web3 buyers may pay crypto. Seller share, DAO fund and bounties settle on NEAR. In the MVP, fiat top-up is a labelled mock and settlement uses real testnet transfers. Users and methods are not limited to web3.
- Every new user decision or piece of information must be recorded in RANCANGAN_PRODUK.md and .pdf.
- Execution architecture (option A): methods run as WASM in OutLayer TEE (NEAR ecosystem, built by FastNEAR); AI parts use NEAR AI Cloud. The OutLayer coordinator can see unencrypted input, so buyer data is encrypted before sending; this sealed-input path passed a testnet test (only ciphertext on chain). Testnet account `scientivan.testnet` exists (section 51).
- Build order: demo flow steps 1–2 (method publication, private TEE execution) first, then steps 3–5 (DAO fund, bounty, version history).
- NEAR handles shared funds, agreed decisions, and payments. Confidential execution handles data protection. NFTs are not used. AI Swarms is optional.

## Status

Development phase started 13 November 2026. Deadline 14 November 2026 23:59 UTC. The freelancer proposal example below is superseded as the demo method and kept only as history.

## Further approved decisions

- Methods are modular. Contributors can inspect and patch explicitly opened modules. Private cores expose interfaces. Internal private-core repairs require approved limited access or a replacement module. User data stays private and payment evaluators cannot be edited by candidate patches.
- The approved example now combines project proposals and negotiation with cost/capacity optimization. It produces feasible scope, prices and schedules, or reports infeasibility. Compare against both good prompting and AI with calculation/code tools. No superiority or willingness-to-pay claim is established yet.
- Bounties define acceptance upfront, offer synthetic reproductions, test authorized private cases independently, require reviewer acceptance, and pay once on valid acceptance evidence. Example is scheduling around team leave with regression, overlap and cost checks.
- After each concluded discussion, update BOTH authoritative documents in the same turn without further prompting. Preserve decisions and rationale, and distinguish unresolved or proposed choices.

## Research update, 12 November 2026

Version 1.3 section 26 records competitor and demand research. No exact complete duplicate was established, but iExec, Ocean, PIP Labs CDR demo, Productive, Apify and bounty platforms establish significant overlapping precedent. CDR README labels AI inference and TEE evaluation mock. Do not claim first-ever private AI plus marketplace plus bounty. Evidence supports component needs, not our package pricing, retention, supplier quality or willingness to fund private-case improvements. NEAR AI token cost illustration is hypothetical inference only. Findings are analysis, not new approved features.

## Adoption assumption, 13 November 2026

User cannot interview others and approves proceeding with component market demand as the basis for assumed willingness to use. Interviews are not a prerequisite. Label this as an assumption, not validated adoption, willingness to pay a particular price, or willingness to jointly fund improvements. Version 1.4 section 27 explains incremental private collaboration value and package economics.

## Feasibility analysis, 13 November 2026

Version 1.5 section 28 critiques requiring universal contributor superiority. Optional collaboration can offer continuity and capacity, but review and private-test costs still matter. Illustrative USD 29/50 bounded jobs yields USD 6.179 contribution before fixed costs under assumed 30% creator share, 10% fund and USD .15 job cost. Heavy jobs lose money. These prices, splits and limits are proposals, NOT approved decisions or benchmark evidence. Community fund is not platform profit. Full-product profitability, security audits and acquisition remain unproven.

## Creator-set pricing, 13 November 2026

User directs variable creator-set method prices at publication plus infrastructure paid upfront by the method user. Fixed-cost estimate scope is server, database and domain only, no team salaries. Supersedes universal subscription assumptions in section 28. Per-execution charging, prepaid budget reconciliation and transparent shared-cost allocation are proposals. Platform commission, community fund source, failures/refunds and billing unit remain open. Prior 30%/10% splits are not decisions. See version 1.6 section 29.

## Consolidated business reference

Version 1.7 section 30 is the authoritative current business model, also referenced from section 14. Creator-set prices plus user-funded infrastructure upfront are approved direction. Operational settlement remains to be finalized. No universal subscription or 30%/10% allocation is approved. Fixed cost estimate includes only server, database and domain. Platform fee, community funding source, billing unit, failure/refund rules and workspace-only pricing remain open. Historical economics cannot establish feasibility for the new model.

## Concrete method draft

Version 1.8 section 31 proposes a synthetic website quotation/negotiation method. User authorized exploration, not approval of detailed numbers/rules. Example has 100 hours full scope, 80 hours core, budget IDR15m, limited capacity, three conditional options. Aggregate capacity is not a verified task schedule. No expert provenance or benchmark superiority is established. Next step is review example and detail task/calendar fixtures before implementation.

## Reopened demo method selection

Version 1.9 section 32 records user dissatisfaction with quotation example as insufficiently crucial. Explore consequential problem-solving methods, framework selection is one inspiration only. Proposed candidates are recurring operational failures, customer churn investigation, and workflow bottleneck diagnosis before hiring. First is assistant recommendation, none approved. Do not treat section 31 as selected final demo. Accuracy and causal diagnoses require evidence.

User requires meaningful, measured efficiency improvement over ordinary good prompting as a criterion for method selection. Candidate 1 remains unapproved. Distinguish faster diagnosis from proven reduction of real incidents. See section 32.1.

## Evaluation package created

Version 1.10 section 33 indexes validation/method-01. Twelve synthetic cases, 4 development and 8 evaluation, oracle isolated, three comparison prompts, rubric and empty run log. No model experiment performed. Same author created cases/procedure, so not independent holdout. Human time must be measured, not inferred from latency. Full framework efficacy and operational impact remain untested.

## Local evaluation outcome

Version 1.11 section 34 records bounded deterministic prototype results (12/12 original, 120 shuffle stability, 5 development regressions after fixing 3 failures, 100 planted findings in 1000 orders). LLM probes timed out at 45/90s. No A/B/C benchmark or human efficiency measured. Recommended design is evidence-based investigation of repeated fulfillment errors, not proven best or approved final demo. General AI with tools may replicate reconciliation. Empirical superiority objective remains incomplete.

## Financial method exploration

Version 1.12 section 35 records user proposing portfolio/trading strategies as privacy-relevant candidates, not approved final use case or trading authorization. Assistant recommends evaluating strategy compatibility with private portfolio/risk constraints over profit predictions. Both investor data and proprietary method may be confidential, public-chain positions remain public. No financial benchmark or superiority established.

## Privacy-demand research

Version 1.13 section 36 completes research requested before financial testing. TradingView commercial closed-source access and QuantConnect reported IP questions support creator secrecy. CR December2023 banking survey (2027 US adults, 76% permission preference), Sharesight controls and CFA confidentiality support investor data sensitivity with population/norm limits. No proof target pays extra for operator-blind TEE or blockchain. Distinguish privacy from public/counterparty/operator and minimize strategy exposure if proposed trades suffice. Financial benchmark not run.

## Portfolio-conditioned execution test

Version 1.14 section 37 records user direction that strategy must execute on portfolio, not only inspect precomputed trades. Local synthetic strategy plus SciPy MILP compared with exhaustive oracle passes 42/42 logic cases. Same market/different portfolios yield different actions. No profit, LLM superiority, human efficiency, TEE/privacy or real trading established. Artifacts in validation/portfolio-method-01.

## Follow-up benchmark and operator privacy

Version 1.15 section 38. User explicitly requests prompt comparison and two-party operator privacy, excludes investment profit testing. Readiness CLI inference timed out at 35s, debug shows connection errors and OAuth lock EPERM. No LLM responses or accuracy scores. Frozen fair 42-case prompt and grader controls in validation/portfolio-method-01/followup. Four ordinary-host operator probes successfully read portfolio/source and capture portfolio/strategy parameters at runtime. Thus current local prototype FAILS operator privacy, not a TEE failure or proof privacy impossible. No TEE deployment/attestation tested. Keep pending model comparison and real confidential-runtime validation explicit.

## Prompt-only retry

Version 1.16 section 39. User prioritizes prompt comparison only. Retry diagnostic resolves neither api.anthropic.com nor api.openai.com from this execution environment, curl returns code 6. Do not infer global service outage. Runner supports --model-only and --grade-response. No comparative score without actual response. Previous clarification permits local privacy-flow prototype but real TEE evidence requires actual TEE execution, not full product deployment.

Full benchmark retry failed after 173.6 seconds with connection_failed / DNS ENOTFOUND and zero input/output tokens. No model answers or AI score.

## Actual prompt benchmark completed

Version 1.17 section 40 supersedes missing-response status. User ran CLI locally. Runtime reports claude-opus-5-5, tools disabled. Actual answers regraded 42/42, matching solver 42/42, including 32 feasible optimum, 9 infeasible, 1 invalid. Prompt hash checked. Accuracy advantage NOT shown. 84.99s batch inference, CLI list-price estimate USD0.220036, not proven subscription charge or fair infrastructure comparison. Full strategy rules supplied, tests execution not discovering expert strategy. One synthetic three-asset batch/model, no investment profit tests. Recommend representative task and predeclared efficiency criteria rather than escalating difficulty merely to defeat model. No final demo selection.

## Corrected comparison objective

Version 1.18 section 41. User explicitly wants ordinary AI WITHOUT seller strategy vs product using proprietary strategy, measuring value of paid expertise access. Both arms get same portfolio, public context, user goals and constraints, only product gets secret strategy. Keep previous 42/42 tie as execution-of-known-rules evidence, not rejection of proprietary expertise value. New rubric must evaluate shared user outcomes, never agreement with an undisclosed arbitrary seller objective. Current toy strategy is NOT proven valuable. No investment-profit evaluation authorized. New protocol not yet run, preserve prior artifacts.

## Public method and ordinary-prompt comparison

Version 1.19 section 42. User requested a good internet-sourced formula while keeping Claude prompt ordinary. Candidate adapts fixed+linear transaction cost modelling (Lobo/Fazel/Boyd2007, MOSEK6.2) into minimum-cost rebalancing under user allocation/cash bounds, no profit forecasts. New portfolio-method-02 package, MILP matches exhaustive ledger oracle 12/12 (9 feasible,3 infeasible), not AI results. Plain Indonesian prompt provides user goals/data/costs but no optimizer formula, solver, paper or strategy instructions. Public knowledge may already be known to model, not proprietary IP. DNS still fails in session, user terminal run required via benchmark.py --run-model. No final demo selection, proven WTP or AI superiority.

## Method 02 actual result and parser fix

Version 1.20 section 43. User CLI run succeeded but parser failed on prose before fenced JSON. Fixed extraction of one answer object, rejects malformed/ambiguous payloads. Added --grade-run, three regression tests pass. Recovered saved response without API retry. Claude ordinary prompt without optimizer formula/tools ties solver 12/12 (9 feasible minimum cost,3 infeasible), 33.48s. No demonstrated accuracy/cost advantage. C12 prose incorrectly says fees reduce unchanged asset weight, while trades/results remain correct. Rubric did not score explanations. Preserve raw outputs and do not retroactively change rubric.

## Product focus decision

Version 1.21 section 44. User ends pursuit of guaranteed method superiority over ordinary prompting. Method quality depends on creator/context. Product focuses on faithful execution, privacy and agreed protections, still unproven in implementation. User suggests performance ratings as a possibility, not finalized design or verified evidence. Stop active pool/multistep benchmark exploration. No approval of investment-return testing or real trading. Preserve past findings and operator privacy failure.

## Two-sided value, frontend use cases, guarantees, tracks (versions 1.22–1.24)

Sections 45–47. Willingness to pay is a hypothesis. The strongest value is enabling a service trade that secrecy on both sides previously blocked. Frontend shows portfolio, salary negotiation and tender, because the user judged other use cases' data not sensitive enough. Section 46 lists two-sided guarantees as proposals. The user chose not to discuss rating weakness and method extraction risk, and deferred refund and dispute definitions. Section 47 records the three tracks and the five-step demo flow.

## Pre-development alignment (version 1.25)

Section 0 summarizes current status. Section 48 records three user decisions: portfolio as MVP demo method, five protections built in the MVP, and build order steps 1–2 before 3–5. Superseded notes were added to sections 3, 4, 6, 22 and 31.

## Review desain lanjutan, 13 November 2026

Dien menyukai kemasan satu panel proses dan tab use case. Pertahankan kedua struktur. Isi tab perlu ringkas dan sejajar, bukan banyak paragraf atau label yang tersebar. Kontrol harus terlihat dapat diklik. Pilihan tahap harus jelas sebagai urutan dengan fungsi dan status aktif. Draf revisinya masih menunggu review (rancangan bagian 53.2).

## Hook hero disepakati, 13 November 2026

Pengguna memilih “Where expertise is traded, run privately, and improved together.” Gunakan sudut pandang netral yang mewakili keahlian penjual dan data pembeli secara setara. Pesan utama mencakup perdagangan keahlian, eksekusi privat dan pengembangan bersama. Jangan mengganti pilihan ini dengan opsi imperatif yang direkomendasikan agent.

## Background hero, 13 November 2026

Dien meminta background hero berupa gambar seperti suasana HelloNear, bukan bidang warna polos. Deskripsi harus menyampaikan perdagangan keahlian, privasi kedua pihak dan pengembangan bersama. Lanskap orisinal dan deskripsi pengganti masih berupa draf untuk review. Hook terpilih tetap berlaku.

## Kesatuan adegan hero, 13 November 2026

Background lanskap disukai. Foreground perlu menjadi satu adegan yang menyatu dengan lanskap serta menggambarkan privacy, expertise dan pengembangan bersama. Pengguna mengizinkan percobaan metode modular dengan kontribusi yang bergabung dan eksekusi terlindungi. Hasil percobaan belum disetujui.

## Ilustrasi produk yang konkret, 13 November 2026

Dien menolak ilustrasi hero yang hanya menunjukkan objek abstrak dan tiga tahap privat. Ilustrasi harus menjelaskan siklus nyata dari expert mempublikasikan/menjual metode, pembeli membeli dan memakai data privat, menerima hasil, aliran uang dan perbaikan metode. Metode yang diperbaiki, sedangkan kasus privat memerlukan izin tersendiri. Draf enam tahap dibuat, belum disetujui. Adegan modular abstrak sebelumnya digantikan.

- Hero harus memakai ilustrasi kegiatan konkret, minim teks, auto-next dan kontrol kecil di hero. Hapus navigasi enam kartu terpisah. Draf 53.7 menunggu review.

- Dien meminta Three.js, warna ilustrasi menyatu dengan lanskap, serta layout dan aksesibilitas mengikuti pedoman UI UX dan WCAG. Caption tidak boleh melayang atau menutupi kontrol.

## Preferensi tanpa karakter bullet points, 13 November 2026

Dien tidak ingin penggunaan karakter bullet points dalam desain. Jangan gunakan simbol bullet sebagai penanda daftar atau pemisah teks. Susun informasi dengan paragraf singkat, jarak, dan hierarki tipografi yang jelas. Preferensi ini berlaku untuk pekerjaan desain berikutnya.

## Istilah contoh marketplace

Sebut contoh portofolio, tender dan negosiasi gaji sebagai metode yang dijual di marketplace, bukan use case. Pengguna ingin pembahasan aplikasi dimulai dari sidebar untuk setiap peran.

## Arah halaman aplikasi

Review 14 November 2026. Dien menolak badge status dengan latar hijau muda, kuning muda dan abu-abu muda pada draf aplikasi. Hindari perlakuan pastel tersebut. Gunakan nama metode yang konsisten, ringkas dan umum, dengan kapitalisasi konsisten. Keterangan preview, file contoh dan privasi harus berada dekat objek atau tindakan yang dijelaskan, bukan teks mengambang di toolbar atau bidang kosong. Tidak semua teks perlu kartu, tetapi pengelompokan dan alignment harus jelas. Halaman detail metode perlu pola halaman produk yang familiar, contoh hasil, pembuat, biaya, kebutuhan input dan akses, serta bukti dan batas metode. Susunan pengganti masih usulan.

Dien memilih arah minimalis dan bersih dari dua screenshot Corbel Supply Co., dengan posisi elemen jelas dan wadah yang sederhana. Gunakan impeccable serta RYUX design-intelligence. Settings diganti dropdown nama pengguna dengan tepat tiga tujuan, Account, Connections, Permissions & preferences. Lima tujuan utama pada draf adalah Workspace, Marketplace, Community, Activity dan Balance dalam satu akun tanpa switch role. Penggunaan topnav dan rail utilitas mengikuti referensi sebagai draf untuk review. Jangan memakai karakter bullet pada copy UI.


## Rating dan prioritas Marketplace

Dien menegaskan rating pengguna harus terlihat pada metode yang dijual, termasuk katalog dan detail. Mekanisme yang belum final tidak boleh menjadi alasan menghilangkan rating dari desain. Gunakan keadaan kosong yang jujur jika belum ada ulasan. Prioritas revisi saat ini seluruh halaman Marketplace.


Dien memilih katalog dan detail OKX AI (okx.ai/agents, okx.ai/agents/5537) sebagai referensi tambahan Marketplace. Pelajari penggunaan gambar, deskripsi, layout, posisi, perilaku serta pengemasan informasi. Ringkasan sumber dan arah penerapan ada di design/app/OKX_REFERENCE.md.


## Fokus audit cakupan frontend

Pengguna memprioritaskan kelengkapan halaman/komponen/fitur berdasarkan seluruh rancangan, bukan optimasi UI UX. Gunakan design/app/COVERAGE.md sebagai matriks untuk melanjutkan. Halaman kosong atau form draf tidak dihitung sebagai fitur end-to-end selesai. Keputusan escrow berbasis tahap dan laporan eksekusi pada bagian bernomor ganda harus tetap dibaca.


Pengguna mengubah prioritas menjadi integrasi frontend dengan backend yang sudah ada, menunda pemeriksaan konsistensi mock. Mode /connected dan batas integrasi dicatat di app/web/BACKEND_INTEGRATION.md. Jangan menganggap read-only API proof sebagai bukti alur paid berhasil.


Pengguna meminta seluruh integrasi backend ke frontend sebagai fokus, bukan satu atau dua halaman. Route utama memakai backend mode secara default, mock demo terpisah eksplisit. Perbedaan method kind WASM/prompt dan batas bukti prompt harus mengikuti backend terbaru.


Dien meminta kebutuhan backend yang kurang disusun untuk Claude, sementara Codex tetap menangani frontend dan integrasi. Handoff ada di app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md. Endpoint dan DTO baru adalah usulan teknis, bukan persetujuan policy yang masih terbuka.
