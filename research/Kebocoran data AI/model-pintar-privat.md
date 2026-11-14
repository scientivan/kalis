# Model pintar tapi tetap privat: peta cara per 11 Nov 2026

Pertanyaan: "apakah ada cara untuk bisa menggunakan model pintar dengan tetap private?"

Jawaban singkat: ada, tapi belum ada satu cara yang sekaligus paling pintar, bisa diverifikasi privat, dan bisa dipakai developer biasa. Model frontier tertutup (Claude, GPT, Gemini) hanya bisa dipakai dengan janji kontrak (ZDR), bukan bukti kriptografis. Model yang bisa dibuktikan privat lewat TEE adalah model open-weight, dan per Oktober 2026 skornya tertinggal jauh.

Kompas istilah:
- **TEE** (trusted execution environment) = area chip yang terenkripsi. Operator server pun tidak bisa membaca isinya, dan chip bisa memberi "bukti" (attestation) kode apa yang sedang jalan.
- **ZDR** (zero data retention) = janji kontrak penyedia untuk tidak menyimpan prompt. Penyedia tetap melihat prompt saat diproses.
- **Open-weight** = bobot model dirilis publik sehingga bisa dijalankan di server siapa saja, termasuk di TEE.

Metode: 18 pencarian web, 20+ halaman dibuka, plus panggilan langsung ke API `https://cloud-api.near.ai/v1/model/list` pada 11 Nov 2026. Klaim yang hanya berasal dari cuplikan hasil pencarian (halaman tidak dibuka) ditandai **(cuplikan)**.

## 1. Model frontier dengan perlindungan dari penyedianya sendiri

### [Fakta]

- Anthropic ZDR: "Even with ZDR or HIPAA arrangements in place, Anthropic may retain data where required by law or where it has been flagged by Anthropic's automated trust and safety systems. As a result, if a chat or session is flagged, Anthropic may retain inputs and outputs for up to 2 years." (https://platform.claude.com/docs/en/manage-claude/api-and-data-retention, dibuka 11 Nov 2026).
- Halaman yang sama: Claude Fable 5.2, Mythos 5.2, Fable 5.1, Mythos 5.1, Fable 5, dan Mythos 5 adalah "Covered Models" yang "require 30-day data retention; ZDR is therefore not available for any of them unless expressly authorized by Anthropic."
- Anthropic tentang confidential inference (TEE untuk Claude): "just a sketch of our research to start a conversation" dan "We're working on a system based on this design for our own implementation." Terbit 18 Jun 2025 (https://www.anthropic.com/research/confidential-inference-trusted-vms). Tidak ada produk untuk pelanggan di halaman itu.
- OpenAI: ZDR dan Modified Abuse Monitoring "subject to prior OpenAI approval", dan OpenAI "reserves the right to make models ineligible for ZDR or MAM" (https://developers.openai.com/api/docs/guides/your-data) **(cuplikan)**.
- OpenAI mengumumkan "Private Safety Processing" (deteksi penyalahgunaan otomatis yang diklaim tanpa staf membaca prompt) dan ZDR untuk model frontier, 20 Agu 2026. Artikel tidak menyebut TEE atau confidential computing. ChatGPT konsumen (Free, Plus, Go, Pro) tidak tercakup (https://thenextweb.com/news/openai-zero-data-retention-private-safety-processing). Halaman resmi `openai.com/index/our-commitment-to-zero-data-retention` menolak diakses (HTTP 403), jadi belum diverifikasi langsung.
- Google: Gemini di Google Distributed Cloud (GDC) air-gapped GA sejak 28 Agu 2025, dengan "Confidential Computing support for both CPUs (with Intel TDX) and GPUs (with NVIDIA's confidential computing)". Pelanggan awal adalah lembaga pemerintah Singapura, KDDI, dan Liquid C2 (https://cloud.google.com/blog/topics/hybrid-cloud/gemini-is-now-available-anywhere).
- Gemini 3.5 Flash GA di GDC air-gapped per 29 Okt 2026, sasaran "defence, intelligence, critical infrastructure and other regulated sectors" (https://itbrief.co.uk/story/google-adds-ai-partner-tools-to-air-gapped-cloud). Artikel tidak menyebut confidential computing.
- Azure: GPU confidential tersedia sebagai VM `NCCadsH100v5` (AMD SEV-SNP + NVIDIA H100), "TEE spans confidential VM on the CPU and attached GPU" (https://learn.microsoft.com/en-us/azure/confidential-computing/gpu-options, update 2 Feb 2026). Halaman itu tidak menyebut layanan Azure OpenAI untuk model GPT.
- Azure AI Confidential Inferencing preview Sep 2024 hanya untuk Whisper, lewat Oblivious HTTP (https://techcommunity.microsoft.com/blog/azure-ai-services-blog/azure-ai-confidential-inferencing-preview/4248181) **(cuplikan)**. Status terbaru untuk model GPT tidak ditemukan.
- Apple Private Cloud Compute: "personal data leaves no trace in the PCC system", tanpa remote shell, dan bisa diperiksa peneliti (https://security.apple.com/blog/private-cloud-compute/).
- Blog pihak ketiga (9 Jun 2026, update 29 Okt 2026): model PCC Apple adalah AFM 3 Cloud, ADM 3 Cloud, AFM 3 Cloud Pro. "AFM 3 Cloud Pro runs on NVIDIA GPUs in Google Cloud, but within Apple's Private Cloud Compute (PCC) enclave." Developer bisa memanggil model PCC lewat Foundation Models framework (https://www.kunalganglani.com/blog/apple-gemini-foundation-models-developers). Sumber resmi Apple (AppleInsider, Neowin) menolak diakses, jadi detail ini belum terverifikasi dari Apple.

### [Inferensi]

- Untuk developer umum, belum ada jalur "model frontier tertutup + bukti TEE". Dasarnya: Anthropic masih riset, OpenAI tanpa TEE, Azure confidential terbukti hanya Whisper, Gemini GDC hanya untuk pembeli perangkat keras on-prem kelas pemerintah.
- Apple PCC adalah yang paling dekat ke "frontier + bisa diverifikasi", tapi terkunci di ekosistem Apple (aplikasi iOS/macOS) dan modelnya bukan setara GPT-6/Claude Opus 5.5. Tidak bisa dipakai dari backend atau smart contract NEAR.

## 2. Model open-weight di TEE GPU

### [Fakta] NEAR AI Cloud (dari API live, 11 Nov 2026)

API mengembalikan 63 model. Field `verifiable: true` hanya ada pada model open-weight. Semua model Claude, GPT, Gemini, Grok tercatat `providerType: external`, `verifiable: false`, `attestationSupported: false`. Deskripsi Claude Sonnet 4.5 di katalog berbunyi "Anonymized, not TEE-protected."

Model teks utama yang `verifiable: true` (harga per 1 juta token input / output):

| Model | Jalur TEE | Harga | Catatan |
|---|---|---|---|
| Kimi K3 | Chutes TEE | $3,30 / $16,50 | konteks 1M |
| GLM-5.3 | Tinfoil | $1,80 / $5,75 | konteks 1M |
| DeepSeek V4.1 Flash 1017 | NEAR vLLM | $0,30 / $1,20 | konteks 1M |
| GLM-5.3 Flash | NEAR vLLM | $0,08 / $0,50 | multimodal |

Model `verifiable` lain: Kimi K2.6, Qwen3.8-27B, Qwen3.6-35B-A3B, Qwen3-VL-30B, DeepSeek V3.2 (Chutes, `isReady: false`), versi "abliterated" (refusal dibuang) dari DeepSeek dan Qwen, Whisper, embedding/reranker Qwen, FLUX.2 (gambar), dan `openai/privacy-filter` (deteksi PII, $0,01 per 1M token input).

Pembanding harga model eksternal di katalog yang sama: Claude Opus 5.5 $4 / $20, GPT-6 Sol $2 / $10.

Jaminan resmi NEAR untuk Private LLM Node: "Infrastructure providers, model providers, and NEAR cannot access your data at any point in the process", dan "A response without an available signature is not response-verified" (https://docs.near.ai/cloud/private-inference/). Halaman itu tidak membahas model eksternal.

### [Fakta] Penyedia lain

- Tinfoil: GPU NVIDIA Hopper dan Blackwell dalam mode confidential computing, isolasi "even [from] Tinfoil itself", attestation dan transparency log, kode open-source (https://tinfoil.sh/technology). Daftar model tidak tercantum di halaman itu. GLM-5.3 di NEAR dilayani lewat Tinfoil (API NEAR).
- Tinfoil Containers (Mar 2026): sampai 8 GPU H200 atau B200 per container (https://tinfoil.sh/blog/2026-03-10-tinfoil-containers) **(cuplikan)**.
- Phala: GPU TEE H100/H200, klaim "99% of native performance", gateway RedPill dengan "14+ models running in GPU TEE" (docs.phala.com) **(cuplikan)**.
- Privatemode (Edgeless Systems): AMD SEV-SNP + H100 mode confidential. Daftar model terbaru tidak ditemukan, peluncuran 2025 memakai Llama 3.3 70B (https://www.edgeless.systems/press-release-edgeless-systems-to-launch-privatemode-ai) **(cuplikan)**.
- Maple (kini "Maple Research"): enclave AWS Nitro, model open-weight seperti DeepSeek R1 dan GPT-OSS, mulai $5,99/bulan menurut SourceForge **(cuplikan)**.

### [Fakta] Seberapa pintar (Artificial Analysis Intelligence Index v5, 27 Okt 2026)

Sumber: https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5 (dibuka).

| Model | Skor | Bobot dirilis? | Tersedia di TEE NEAR? |
|---|---|---|---|
| Claude Opus 5.5 (max) | 58 | tidak | tidak |
| GPT-6 Astra (max) | 57 | tidak | tidak |
| Gemini 4 Argon (high) | 50 | tidak | tidak |
| Kimi K3.1 Pro | 46 | belum | tidak (external) |
| Claude Haiku 5.5 (max) | 36 | tidak | tidak |
| GLM-5.3 (max) | 32 | ya | ya, via Tinfoil |
| DeepSeek V4.1 Flash 1017 (max) | 32 | ya | ya |

- Kutipan: "The open weights gap widens from 3 points to 12." Selisih 12 poin itu dihitung terhadap Kimi K3.1 Pro yang bobotnya belum dirilis. Model open-weight yang benar-benar dirilis tertinggi di 32, atau 26 poin di bawah Claude Opus 5.5.
- v5 menyatakan "60% of the Index is now based on evaluations with private test sets or held-out answers."
- Kimi K3 (yang ada di TEE NEAR) tidak diberi skor di artikel v5. Di v4.3 (7 Sep 2026) artikel hanya menulis "GLM-5.3 and Kimi K3 continue to lead open weights models" tanpa angka (https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-3).

### [Inferensi]

- Ini satu-satunya cara yang memberi privasi **bisa dibuktikan** sekaligus bisa dipakai developer hari ini. Tingkat kepercayaannya bergeser dari "percaya perusahaan" ke "percaya Intel/NVIDIA dan kode yang diaudit".
- Kualitasnya kira-kira setara model kelas murah Anthropic, bukan setara frontier. Dasarnya: model rilis tertinggi skor 32, sedangkan Claude Haiku 5.5 skor 36.
- Kimi K3 kemungkinan model TEE terpintar di katalog NEAR karena harganya paling mahal dan disebut memimpin open-weight di v4.3. Skor v5-nya belum terverifikasi.
- Risiko sisa TEE: bug side-channel pada chip, dan jalur "attested 3p" (Chutes, Tinfoil) menambah satu pihak yang harus dipercaya meski NEAR menyebutnya "verified end-to-end". Saya belum memeriksa detail verifikasi end-to-end itu.

## 3. Pseudonimisasi dan delegasi hybrid

Idenya: model lokal atau di TEE menyamarkan data pribadi, lalu hanya versi tersamar yang dikirim ke model frontier. Jawaban dikembalikan ke data asli secara lokal.

### [Fakta]

- PAPILLON (NAACL 2025, Llama-3.1-8B lokal + GPT-4o-mini): pipeline terbaik "maintains high response quality for 85.5% of user queries while restricting privacy leakage to only 7.5%" (https://arxiv.org/abs/2410.17127).
- PrivScope (arXiv 2605.16630, 100 alur booking medis, tiga LLM cloud komersial): "eliminates profile leakage (0.0% vs. 17.7%)" dan "more than halves attacker re-identification (23.1% vs. 64.3%)". Utilitas "close to the unprotected baseline" pada GPT-4o-mini dan Gemini 2.5 Flash, tanpa angka pasti di abstrak (https://arxiv.org/abs/2605.16630).
- Attic Security (proxy token antara agen SOC dan API Anthropic): placeholder seperti "[User_Email_1]" membuat Claude berhalusinasi ("We had asked for a triage report and got fan fiction"). Pseudonim realistis menghilangkan sinyal seperti impossible travel. Awalnya "82% of the pseudonym mappings were false positives". Solusinya pseudonim valid, IP diganti dari ASN dan subnet yang sama, dan skiplist istilah teknis. Penulis menyebutnya jaring pengaman, bukan jaminan, dan model lokal tetap lebih aman bila cukup (https://atticsecurity.com/en/blog/why-llms-hate-fake-data-token-proxy/).
- Katalog NEAR menyediakan `openai/privacy-filter` (deteksi PII) dengan `verifiable: true` (API NEAR).

### [Inferensi]

- Cara ini satu-satunya yang memberi kecerdasan frontier penuh pada bagian tugas yang tidak sensitif. Harganya sama dengan API frontier ditambah biaya model penyamar.
- Masalah akarnya tidak selesai: yang disembunyikan hanya identitas (nama, email, IP). Isi rahasia lain seperti strategi bisnis, kode, atau ide tetap terkirim ke penyedia. Untuk data yang "rahasia karena isinya", cara ini lemah.
- Angka 7,5% bocor (PAPILLON) dan 23,1% re-identifikasi (PrivScope) berarti privasinya statistik, bukan jaminan.

## 4. FHE, MPC, differential privacy

### [Fakta]

- FHE (komputasi atas data terenkripsi): Llama-3-8B, "On 8 NVIDIA RTX PRO 6000 GPUs, 128 encrypted tokens take 20s for summarization and 18s/token for generation" (https://arxiv.org/abs/2601.18511, revisi Jun 2026).
- MPC (komputasi dibagi antar pihak): PermLLM melaporkan ChatGLM-6B sekitar 3 detik per token pada jaringan 10 ms RTT dan 1 Gbps (https://arxiv.org/html/2405.18744v1) **(cuplikan)**. PUMA menargetkan LLaMA-7B "in five minutes" (https://arxiv.org/pdf/2307.12533) **(cuplikan)**.
- Differential privacy untuk prompt: metode seperti DP-Prompt, Cape (ICML 2025), DP-Fusion, dan DP3 (ACL Findings 2026) mengacak token prompt dengan batas privasi formal. Penulis DP-Fusion menyebut metode lain "either over-sanitize the input or provide weak or no formal guarantees" **(cuplikan, angka utilitas tidak diperiksa)**.

### [Inferensi]

- FHE dan MPC belum praktis untuk model pintar. 18 detik per token pada model 8B berarti jawaban 500 token butuh sekitar 2,5 jam, dan model frontier ratusan kali lebih besar. Lagi pula penyedia frontier tidak menawarkan jalur ini.
- Differential privacy memperburuk kualitas karena prompt sengaja dirusak, dan tidak cocok untuk prompt yang setiap detailnya penting (kode, dokumen hukum).

## 5. ZDR dan batasnya

### [Fakta]

- Perintah pengadilan NYT v. OpenAI (Mei 2025) memaksa OpenAI menyimpan semua log ChatGPT. Perintah itu dicabut lewat order Hakim Ona T. Wang tertanggal 9 Okt 2025, berlaku sejak 26 Sep 2025. Log yang sudah tersimpan tetap bisa diakses, dan OpenAI tetap wajib menyimpan data akun yang ditandai NYT (https://www.engadget.com/ai/openai-no-longer-has-to-preserve-all-of-its-chatgpt-data-with-some-exceptions-192422093.html).
- Pelanggan API dengan ZDR serta Enterprise/Edu tidak terkena perintah itu (beberapa liputan, **cuplikan**).
- Anthropic ZDR tetap bisa menyimpan data "where required by law" atau bila ditandai sistem keamanan, sampai 2 tahun (dokumen Anthropic di atas).
- OpenAI ZDR butuh persetujuan dan bisa ditarik per model (dokumen OpenAI, **cuplikan**).

### [Inferensi]

- ZDR adalah cara paling murah untuk tetap memakai model terpintar, tapi privasinya berbasis kontrak dan hukum, tidak bisa diverifikasi pengguna. Kasus NYT menunjukkan bahwa kebijakan penyimpanan bisa berubah karena pengadilan, dan pengguna baru tahu setelahnya.
- ZDR hanya tersedia untuk pelanggan bisnis yang disetujui. Model teratas Anthropic (Fable/Mythos) justru dikecualikan dari ZDR. Artinya "model paling pintar" dan "tanpa retensi" makin sulit didapat bersamaan.

## Ringkasan per cara

### [Inferensi] (disusun dari fakta di atas)

| Cara | Privasi | Kepintaran | Bisa di NEAR? |
|---|---|---|---|
| ZDR frontier | janji kontrak, ada pengecualian | tertinggi (skor 57–58) | ya, tapi NEAR hanya proxy, `verifiable: false` |
| Open-weight di TEE | bisa diverifikasi lewat attestation | menengah (skor rilis 32) | ya, native di NEAR AI Cloud |
| Hybrid pseudonim | statistik, isi non-PII tetap bocor | hampir frontier | ya: privacy-filter TEE + model eksternal |
| Apple PCC | bisa diverifikasi, ekosistem Apple | di bawah frontier | tidak |
| Gemini GDC | on-prem + TEE | Gemini 3.5 Flash | tidak, hanya pembeli perangkat keras |
| FHE / MPC | matematis terkuat | model kecil, sangat lambat | tidak praktis |

## Relevansi untuk NEAR hackathon

### [Fakta]

- NEAR AI Cloud punya API kompatibel OpenAI di `https://cloud-api.near.ai/v1` dengan model TEE dan model eksternal dalam satu katalog (API NEAR).
- `NEAR.md` (Q-011) menyebut TEE sebagai petunjuk, bukan integrasi wajib.

### [Inferensi]

- Desain yang paling jujur dan bisa dibangun di NEAR: router dua jalur. Data sensitif diproses di model TEE (Kimi K3 atau GLM-5.3) dengan attestation yang ditampilkan ke pengguna. Bagian non-sensitif yang butuh kecerdasan tinggi dikirim ke model eksternal setelah disaring `openai/privacy-filter` di TEE.
- Klaim "privat" harus spesifik per jalur. Menyebut jalur model eksternal NEAR sebagai privat adalah overclaim, karena katalog NEAR sendiri menandainya `verifiable: false`.
- Pertanyaan terbuka yang belum diverifikasi: skor Kimi K3 di Index v5, isi "verified end-to-end by NEAR AI" untuk Chutes, dan apakah Apple membuka PCC untuk backend non-Apple.

Pemeriksaan compliance gate `NEAR.md`: catatan ini riset saja, tidak ada konflik dengan aturan hackathon.
