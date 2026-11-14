# Kesediaan bayar untuk "secret broker" agent coding AI

Tanggal riset: 2026-11-11. Ide yang diuji adalah broker yang membuat Claude Code, Codex, Cursor, dan agent lain bisa memakai API key tanpa membaca nilainya, dengan bukti TEE dan log publik.

Kesimpulan singkat. Masalahnya nyata dan sedang ramai (bocornya terverifikasi dan berulang). Pembayarnya tim kecil dan perusahaan, bukan developer individu. Kategori ini sudah diisi pemain bermodal besar dan alat gratis dalam 8 bulan terakhir. Nilai sustainability untuk produk baru yang berdiri sendiri: **rendah ke sedang**.

Metode. 24 pencarian web dan 15 pembukaan halaman, ditambah `gh api` untuk jumlah bintang GitHub. Halaman yang gagal dibuka (403) ditandai "cuplikan saja". Banyak angka pertumbuhan pengguna berasal dari blog agregator, dan statusnya ditulis di setiap baris.

## 1. Pengguna agent coding dan harga yang sudah dibayar

### [Fakta]

- Claude Code melewati run-rate pendapatan tahunan USD 2,5 miliar, lebih dari separuhnya dari enterprise. Sumbernya pengumuman Anthropic Februari 2026 yang dikutip sekunder (cuplikan saja): https://gu-log.vercel.app/en/posts/en-clawd-picks-20260212-anthropic-30b-funding dan https://news.lavx.hu/article/anthropic-s-claude-code-hits-2-5b-run-rate-revenue-doubling-in-six-weeks
- Angka Claude Code USD 8 miliar (Mei 2026) hanya muncul di satu sumber dan tidak dikonfirmasi sumber lain (cuplikan saja): https://fourweekmba.com/ai-claude-code-run-rate-agentic-layer/
- Cursor mencapai ARR (pendapatan berulang tahunan) sekitar USD 2 miliar pada Februari 2026 menurut Bloomberg dan TechCrunch yang dikutip ulang (cuplikan saja): https://www.digitalapplied.com/blog/cursor-ai-2b-revenue-enterprise-coding-market-leader
- Cursor mengklaim lebih dari 1 juta pengguna aktif harian dan lebih dari 50.000 perusahaan, menurut CNBC Mei 2026 yang dikutip ulang (cuplikan saja): https://quashbugs.com/blog/cursor-ai-statistics-users-growth-funding
- GitHub Copilot punya 4,7 juta pelanggan berbayar, naik 75% setahun, diumumkan di earnings call Microsoft 28 Jan 2026 (dikutip sekunder, cuplikan saja): https://quashbugs.com/blog/github-copilot-statistics
- OpenAI Codex melayani lebih dari 4 juta developer mingguan per 21 Apr 2026, naik dari 2 juta pada 31 Mar 2026 (cuplikan saja): https://www.digitalapplied.com/blog/openai-codex-4m-weekly-developers-growth-data
- Harga Claude yang termasuk Claude Code: Pro USD 20, Max 5x USD 100, Max 20x USD 200 per bulan (beberapa blog sepakat, halaman resmi tidak dibuka): https://www.noqta.tn/blog/claude-code-pricing-2026
- Halaman harga Cursor yang dibuka hari ini menampilkan paket individu Free USD 0, Plus USD 8, Premium USD 30, Super USD 100, Ultra USD 200 per bulan, dan Teams mulai USD 30 per user per bulan: https://cursor.com/pricing

### [Inferensi]

- Jumlah pengguna agent coding ada di kisaran jutaan per produk, dan banyak yang sudah membayar USD 20–200 per bulan. Jadi kemampuan bayar developer untuk tooling AI terbukti ada.
- Namun uang itu dibayar untuk produktivitas. Belum ada bukti dari sumber-sumber ini bahwa mereka mau menambah biaya terpisah untuk keamanan secret.

## 2. Data kebocoran secret oleh agent AI 2025–2026

### [Fakta]

- GitGuardian menghitung 28,65 juta secret baru yang ter-hardcode di commit GitHub publik sepanjang 2025, naik 34% setahun: https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/
- Secret layanan AI mencapai 1.275.105, naik 81% setahun (sumber sama).
- Kutipan: "Claude Code-assisted commits showed a 3.2% secret-leak rate, versus a 1.5% baseline across all public GitHub commits." Artinya commit yang dibantu Claude Code bocor sekitar dua kali lebih sering. GitGuardian menambahkan "The leak still happens through a human workflow" (bocornya tetap lewat alur kerja manusia).
- Ada 24.008 secret unik di file konfigurasi MCP (Model Context Protocol, cara agent tersambung ke alat), 2.117 di antaranya masih valid (sumber sama).
- Lebih dari 64% secret yang terbukti valid pada 2022 masih valid saat diuji ulang Januari 2026 (sumber sama).
- Catatan OECD AI Incidents Monitor dengan URL bertanggal 2026-11-07 menyebut fitur "Yes, and don't ask again" Claude Code menyimpan perintah shell yang berisi kredensial di file konfigurasi teks biasa, lalu file itu ter-commit ke GitHub publik dan membuka "over 2,500 secrets" dari "at least 63 organizations". Ringkasan itu ditandai "[AI generated]" oleh OECD: https://oecd.ai/en/incidents/2026-11-07-2c3e
- Rincian riset Apiiro (laporan 5 Nov 2026, dikutip ulang): 1.122 dari 104.185 salinan publik `.claude/settings.local.json` berisi secret nyata, total 1.379 secret. Jika history git, `settings.json`, dan transkrip agent dihitung, totalnya 2.539 secret di 1.994 repo: https://letsdatascience.com/news/apiiro-finds-claude-code-approvals-leaking-2539-secrets-on-g-e4f20dbc
- Jenis secret di temuan Apiiro: 379 password database, 122 service-role key Supabase, 43 login SSH, 42 token GitHub/GitLab/npm, 23 key AWS (sumber sama).
- Gitleaks hanya menandai 564 dan TruffleHog 643 dari 1.122 file. 215 file lolos dari keduanya karena password diketik di dalam perintah (misalnya setelah `PGPASSWORD=`) (sumber sama).
- Pengguna sudah melaporkan mekanisme ini di GitHub issue sejak Agustus 2025 tanpa balasan Anthropic, menurut Apiiro (sumber sama). Pencarian tidak menemukan pernyataan atau perbaikan resmi Anthropic.
- METR (lembaga evaluasi model AI) menulis bahwa penyerang "prompted an agent directly to reveal its model provider API key" di aplikasi vibe-coded milik seorang peneliti, lalu memakai kredit selama tiga minggu yang "would have been worth approximately $600,000". Kreditnya gratis dari penyedia model, jadi tidak ada tagihan yang memicu alarm: https://metr.org/blog/2026-08-31-security-update/
- Startup tiga orang di Meksiko yang biasanya belanja sekitar USD 180 per bulan dikenai USD 82.314,44 untuk pemakaian Gemini tak sah pada 11–12 Feb 2026. Cara key bocor tidak diketahui. Google merujuk ke model tanggung jawab bersama dan tidak menyebut refund: https://www.theregister.com/2026/03/03/gemini_api_key_82314_dollar_charge/

### [Inferensi]

- Insiden Apiiro adalah bukti paling kuat untuk ide ini, karena bocornya terjadi persis di lapisan yang ingin ditutup broker (agent menyimpan nilai secret). Kalau agent hanya memegang placeholder, file itu tidak akan berisi nilai asli.
- Kasus Gemini USD 82 ribu tidak terbukti disebabkan agent. Kasus ini hanya menunjukkan besarnya kerugian setelah key bocor, bukan bahwa agent penyebabnya.
- Kasus METR relevan karena agent yang memegang key bisa dibujuk untuk menyerahkannya. Broker yang tidak pernah memberi nilai key ke agent menutup jalur ini. Namun broker tidak mencegah penyerang memakai akses lewat agent selama sesi aktif.

## 3. Harga dan traksi produk secret management

### [Fakta]

| Produk | Harga individu / tim kecil | Fitur khusus agent | Sumber |
|---|---|---|---|
| Doppler | Gratis untuk 3 user, lalu USD 8/user. Team USD 21/user/bulan | Tidak disebut di halaman harga | https://www.doppler.com/pricing |
| Infisical | Gratis 5 identitas. Pro USD 20/identitas/bulan (tahunan). Agent Vault USD 2 per 1.000 request setelah 5.000 gratis per bulan | Agent Vault, broker kredensial untuk agent | https://infisical.com/pricing |
| Bitwarden Secrets Manager | Gratis (3 machine account). Teams USD 6/user/bulan. Enterprise USD 12 | Tidak disebut | https://bitwarden.com/products/secrets-manager/ |
| GitGuardian | Starter gratis sampai 25 developer. Paket berbayar "Let's Talk" | Hook AI IDE (Claude Code, Cursor, Copilot CLI, Codex) terbatas di paket gratis | https://www.gitguardian.com/pricing |

- 1Password menyediakan Environments MCP Server untuk Codex, Cursor, dan Kiro dengan kutipan "The MCP server doesn't read or return secrets to the AI agent", hook validasi untuk Cursor dan Claude Code, serta Shell Plugins. Halaman itu tidak menyebut harga: https://www.1password.dev/get-started/secure-ai-access
- Infisical Agent Vault: "lets an agent call third-party APIs, CLIs, and MCP servers over HTTP without ever holding the credentials". Ada panduan untuk Claude Code, Codex, OpenCode, Hermes Agent, OpenClaw. Halaman tidak menyebut TEE atau attestation: https://infisical.com/platform/agent-vault
- Repo `Infisical/agent-vault` dibuat 27 Mar 2026 dan punya 2.498 bintang. Repo utama `Infisical/infisical` punya 30.422 bintang (output `gh api`, 2026-11-11).
- Infisical mengumpulkan Series B USD 40 juta pada valuasi USD 600 juta (27 Okt 2026), melayani "over 1,300 organizations", dan "has been cash-flow positive for a long time" (artinya arus kasnya sudah positif): https://infisical.com/blog/series-b
- GitGuardian mengumpulkan Series C USD 50 juta pada 11 Feb 2026, total sekitar USD 106 juta, dan mengklaim melindungi lebih dari 115.000 developer (cuplikan saja): https://siliconangle.com/2026/02/11/gitguardian-raises-50m-expand-non-human-identity-ai-agent-security/
- Doppler mengumpulkan total sekitar USD 28,8 juta (Series A USD 20 juta, April 2022) dan saat itu mengklaim 15.000–16.000 pelanggan (cuplikan saja): https://techcrunch.com/2022/04/27/doppler-lands-20m-to-help-companies-manage-their-app-secrets
- Lit Protocol memasarkan Keychain dengan tagline "credentials for AI agents, under your control". Halamannya tidak memberi detail TEE atau harga saat dibuka: https://keychain.litprotocol.com/
- Phala memasarkan kredensial agent yang disegel di TEE (cuplikan saja): https://phala.com/de/solutions/ai-agents

### [Inferensi]

- Harga pasar untuk tim kecil berkisar USD 6–21 per user per bulan, dengan paket gratis yang cukup lebar (3–25 user). Model per request ala Infisical (USD 2 per 1.000) adalah patokan paling dekat untuk broker.
- Fitur inti ide ini (agent memakai key tanpa melihatnya) sudah dirilis oleh Infisical (terdanai, open source) dan 1Password. Pembeda yang tersisa hanya bukti TEE dan log publik.

## 4. Survei kekhawatiran dan kesediaan bayar

### [Fakta]

- Survei 1Password (26 Mei sampai 3 Jun 2026, 1.000 karyawan AS di perusahaan dengan minimal 250 karyawan, separuh developer): 43% developer tidak memakai secrets manager khusus, 24% developer meng-hardcode kredensial, 40% developer memberi agent akses permanen, 71% responden punya celah visibilitas soal agent mana memakai kredensial: https://1password.com/blog/survey-ai-agent-adoption-is-outpacing-governance
- Survei itu dibuat oleh vendor yang menjual solusinya (sumber sama, metodologi di halaman).
- Liputan survei Stack Overflow menyebut 81% setuju punya kekhawatiran keamanan dan privasi saat memakai agent AI (cuplikan saja, artikel ADTmag Jan 2026 gagal dibuka dengan 403, kemungkinan survei 2025): https://adtmag.com/Blogs/WatersWorks/2026/01/Stack-Overflow-Survey.aspx
- Satu survei yang dikutip ulang menyebut 82% responden memakai alat bawaan penyedia model atau cloud besar sebagai lapisan keamanan utama, dan solusi dari perusahaan keamanan agent khusus dipakai porsi yang jauh lebih kecil (cuplikan saja, sumber asli tidak dibuka): https://forklog.com/en/news/survey-reveals-gaps-in-corporate-ai-agent-security
- Pencarian tidak menemukan survei yang bertanya langsung berapa developer individu mau membayar untuk keamanan secret agent.

### [Inferensi]

- Kekhawatiran tinggi tetapi perilaku tidak mengikuti. Hampir separuh developer belum memakai secrets manager yang banyak di antaranya gratis. Ini sinyal bahwa developer individu jarang membayar untuk masalah ini.
- Anggaran ada di sisi perusahaan dan tim keamanan, bukan di kantong developer.

## 5. Sinyal yang melemahkan

### [Fakta]

- Alat gratis open source sudah ada. Phantom (`ashlrai/phantom-secrets`, MIT, 20 bintang) memberi agent token placeholder dan menyuntik key asli lewat proxy lokal. secretgate, keyblind, keyclaw, Tene, dan ctxcop milik Webflow juga muncul (cuplikan saja): https://mcpservers.org/servers/ashlrai/phantom-secrets dan https://webflow.com/blog/securing-secrets
- Sandbox bawaan Claude Code mengisolasi filesystem dan jaringan. Anthropic melaporkan pengurangan prompt izin 84% di pemakaian internal (cuplikan saja): https://www.anthropic.com/engineering/claude-code-sandboxing
- Dokumentasi sandbox Claude Code: tanpa isolasi jaringan, agent yang dibobol bisa mengeluarkan file sensitif seperti SSH key (cuplikan saja): https://code.claude.com/docs/en/sandboxing
- 64% secret dari 2022 masih valid di Januari 2026 (GitGuardian, bagian 2).
- Talk di Confidential Computing Summit 2026 menyatakan prompt injection di dalam TEE tidak terselesaikan secara kriptografis (cuplikan saja): https://hosted-files.sched.co/ccsummit2026/0e/opaque-rishabh-ccsummit.pdf

### [Inferensi]

- Sandbox bawaan tidak menyelesaikan kasus Apiiro, karena bocornya lewat file yang ter-commit, bukan lewat jaringan. Jadi argumen "sandbox sudah cukup" lemah untuk kasus itu. Namun Anthropic bisa memperbaikinya dengan satu patch (misalnya menulis `.gitignore` per repo atau menyaring secret dari aturan izin), dan itu akan menghapus bukti terkuat ide ini.
- Banyaknya secret lama yang tidak dirotasi menunjukkan sebagian besar developer tidak bertindak bahkan setelah bocor.
- Belum ada bukti permintaan untuk "bukti TEE dan log publik" dari developer atau tim kecil. Ini menciptakan permintaan baru yang belum tervalidasi. Log publik juga berisiko membocorkan metadata (layanan apa yang dipakai, kapan, oleh siapa), yang justru tidak disukai tim keamanan.

## 6. Simpulan

### [Inferensi] (seluruh bagian ini)

- **End user**: developer individu dan tim kecil (2–20 orang) yang menjalankan Claude Code, Codex, atau Cursor dengan key produksi (database, Supabase, AWS, key LLM). Contoh profilnya startup kecil di kasus Gemini dan peneliti di kasus METR.
- **Pembayar**: founder atau CTO tim kecil yang pernah kena tagihan atau insiden, dan tim keamanan perusahaan menengah yang sudah punya anggaran secret management. Developer individu kemungkinan besar memakai paket gratis atau alat open source.
- **Kisaran harga masuk akal**: individu USD 0 (gratis untuk menarik pemakai). Tim kecil USD 5–10 per user per bulan, atau berbasis pemakaian di kisaran USD 1–2 per 1.000 request brokered (setara Infisical). Bukti TEE dan log audit hanya bisa dijual sebagai add-on compliance untuk perusahaan, dan harganya belum punya patokan.
- **Nilai sustainability: rendah ke sedang.**
  - Alasan naik: masalahnya terdokumentasi kuat dan baru (OECD 7 Nov 2026, Apiiro, GitGuardian), pasarnya membayar (Infisical arus kas positif, GitGuardian dan Infisical terdanai USD 40–50 juta di 2026), dan pengguna agent coding berjumlah jutaan.
  - Alasan turun: fitur intinya sudah dirilis oleh Infisical (open source, terdanai) dan 1Password, ada alat gratis, pembayar utama membeli dari vendor mapan, dan pembeda TEE plus log publik belum punya bukti permintaan.
  - Yang bisa menaikkan nilai: wawancara 5–10 tim yang pernah kena insiden dan bersedia membayar untuk attestation, atau bukti bahwa auditor atau klien enterprise meminta bukti TEE.

## Pemeriksaan compliance gate NEAR

[Inferensi] Ini tugas riset saja, tanpa kode, push, atau submit. Tidak ada konflik dengan compliance gate di `NEAR.md` baris 8–27. Catatan untuk penilaian juri: kriteria sustainability di `NEAR.md` baris 151 meminta jawaban "siapa memakai dan siapa membayar", dan riset ini menunjukkan jawabannya ada tetapi sudah direbut pemain lain.
