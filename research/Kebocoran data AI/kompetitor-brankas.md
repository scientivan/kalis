# Riset kompetitor: brankas data pribadi untuk AI

Tanggal riset 11 Nov 2026. Konsep yang diuji: rekam medis, dokumen keuangan, dan dokumen pribadi disimpan di TEE (atau penyimpanan terenkripsi). AI agent (ChatGPT, Claude) mengaksesnya lewat MCP atau API dan hanya menerima jawaban minimal yang diizinkan pengguna, bukan file mentah. Setiap akses tercatat, misalnya di NEAR.

Kesimpulan singkat. Setiap komponen konsep ini sudah ada di pasar atau di hackathon yang sama. Kombinasi lengkapnya (jawaban dihitung di TEE, kebijakan per atribut, log akses yang bisa diverifikasi, dan bisa dipakai model frontier mana pun) belum kutemukan sebagai produk. Penilaian originality: **sedang (batas bawah)**. Alasannya ada di bagian akhir.

Cara membaca label:

- **[Fakta]** punya sumber yang sudah kubuka. Ada juga yang ditandai "cuplikan saja", artinya hanya dari ringkasan hasil pencarian karena halamannya menolak diakses (HTTP 403, 404, atau kosong).
- **[Inferensi]** adalah kesimpulanku sendiri.

Metode: 20 pencarian web, 21 halaman dibuka, dan pencarian kata kunci di 431 submission pada `hasil-riset/near-submissions-2026-11-08/projects.json`.

## 1. Produk konsumen

### 1.1 Fakta

**ChatGPT Health (OpenAI)**

- [Fakta] Diluncurkan di AS pada 23 Jul 2026 untuk paket Free, Go, Plus, dan Pro, khusus pengguna 18 tahun ke atas. Sumbernya https://www.paubox.com/blog/chatgpt-health-launches-nationwide-but-medical-records-not-hipaa-protected
- [Fakta] Rekam medis masuk lewat b.well Connected Health dengan dasar hak pasien dalam Cures Act (undang-undang AS yang memberi pasien hak memindahkan rekam medisnya ke aplikasi pihak ketiga). Setelah data keluar dari penyedia layanan kesehatan, "HIPAA no longer protects it" (perlindungan hukum kesehatan AS tidak berlaku lagi). Sumbernya sama.
- [Fakta, cuplikan saja] Halaman bantuan OpenAI (https://help.openai.com/en/articles/20001036-chatgpt-health-data-privacy-and-connected-sources, HTTP 403) menyatakan data yang terhubung "not used to train our foundation models or target ads". Menurut halaman yang sama, secara default ChatGPT meminta izin sebelum memakai rekam medis, dan Memory bisa terbentuk dari percakapan Health.
- [Fakta] Seorang penasihat di EPIC (lembaga advokasi privasi di AS) menilai OpenAI "is only bound by its own disclosures and promises". Artinya perlindungannya hanya berupa kebijakan perusahaan, bukan aturan hukum. Sumbernya Paubox di atas.

**Claude untuk kesehatan (Anthropic dan HealthEx)**

- [Fakta] Konektor HealthEx dan Function dirilis dalam versi beta pada 11 Jan 2026. Apple Health dan Android Health Connect menyusul, juga beta, khusus pelanggan Pro dan Max di AS. Anthropic mengklaim "We do not use users' health data to train models". Sumbernya https://www.anthropic.com/news/healthcare-life-sciences
- [Fakta] HealthEx memakai server MCP. Claude "dynamically retrieve only the specific portions of a record needed to answer" (hanya mengambil bagian rekam medis yang dibutuhkan untuk menjawab). Datanya tidak disimpan di memori jangka panjang. HealthEx menjangkau "over 50,000 provider organizations" lewat TEFCA (kerangka pertukaran rekam medis federal AS). Sumbernya https://hitconsultant.net/2026/01/11/healthex-and-anthropic-partner-to-bring-personal-health-records-directly-to-claude/

**Aplikasi dan konektor ChatGPT**

- [Fakta, cuplikan saja] Sejak 17 Des 2025, "connectors" berganti nama menjadi "apps". Menurut whitepaper keamanan app OpenAI edisi Juni 2026, file tidak diunggah utuh. Hanya potongan yang relevan yang diproses. Whitepaper (https://cdn.openai.com/business-guides-and-resources/app-security-whitepaper.pdf) gagal dibuka karena ukurannya lebih dari 10 MB.

**Personal AI**

- [Fakta] Personal AI berhenti menerima langganan konsumen baru sejak 23 Jan 2025 ("paused new consumer subscriptions"). Kini harganya hanya enterprise dan custom. Sumbernya https://www.steno.ai/compare/steno-ai-vs-personal-ai
- [Fakta, cuplikan saja] Situs agregator lama mencantumkan harga $40 per bulan untuk paket personal.

**Kin**

- [Fakta] Kin menyimpan chat, jurnal, memori, dan metrik kesehatan di perangkat pengguna. Namun prompt ditambah "Limited, relevant context" tetap dikirim ke Anthropic, OpenAI, atau Cerebras melalui Cloudflare Workers. Kebijakan privasinya tidak menyebut confidential computing. Sumbernya https://mykin.ai/privacy-notice

**Rewind dan Limitless**

- [Fakta] Meta mengakuisisi Limitless pada 5 Des 2025. Penjualan pendant dihentikan. Aplikasi Rewind untuk Mac dimatikan dengan mematikan "all screen and audio capture starting December 19". Layanan juga dihentikan di EU, UK, dan beberapa negara lain. Sumbernya https://9to5mac.com/2025/12/05/rewind-limitless-meta-acquisition/
- [Fakta, cuplikan saja] Harga pendant $99.

**Solid dan Inrupt**

- [Fakta] Inrupt mengumumkan "agentic wallet" berbasis Solid pada 2 Mei 2025. Wallet ini menggabungkan data pribadi dan data transaksi untuk menjawab pertanyaan dan bertindak atas nama pengguna. Sumbernya https://www.schneier.com/?p=70210
- [Fakta, cuplikan saja] Prototipe "Charlie" menyamarkan informasi sebelum dikirim ke LLM, tetapi pada 2024 masih memakai data simulasi. Enterprise Solid Server mendukung MCP.
- [Fakta, cuplikan saja] Inrupt mendapat Series A sekitar $30 juta pada Des 2021 yang dipimpin Forte Ventures (https://www.techzine.eu/news/infrastructure/69572/tim-berners-lees-startup-inrupt-raises-30-million).

**Mem0 (OpenMemory)**

- [Fakta, cuplikan saja] Mem0 mengumumkan pendanaan $24 juta (Seed dan Series A) pada 28 Okt 2025, dipimpin Kindred Ventures dan Basis Set. Produk OpenMemory adalah server MCP local-first untuk memori. Sumbernya https://mem0.ai/series-a lewat ringkasan pencarian.

**Apple Private Cloud Compute (pembanding teknis)**

- [Fakta] Apple mengklaim data pribadi "isn't accessible to anyone other than the user" (Apple sendiri pun tidak bisa mengaksesnya). Apple juga menyatakan tidak ada data yang disimpan setelah respons dikirim, dan image software-nya dipublikasikan untuk audit. Klaim ini dibuat 10 Jun 2024. Sumbernya https://security.apple.com/blog/private-cloud-compute/

**Server MCP privasi open source**

- [Fakta] `personal-vault` v0.1.0 (23 Feb 2026, lisensi MIT) mengenkripsi tiap field dengan AES-256-GCM. Akses diberikan lewat token dengan cakupan dan batas waktu (TTL). Tersedia log audit dan server MCP dengan tool `vault_get` dan `vault_context`. Sumbernya https://pkg.go.dev/github.com/lovincyrus/personal-vault
- [Fakta] Server MCP Tobari membuat verifiable presentation (bukti kredensial digital) yang hanya berisi field yang diperlukan. Server ini "never shares ... full raw documents with the AI unless explicitly allowed". Sumbernya https://masanork.github.io/tobari/MCP_SERVER.html
- [Fakta, cuplikan saja] Ada beberapa proyek lain. Enclave (`zd87pl/slm-vault`) memakai RAG lokal sehingga AI eksternal yang memberi perintah lewat MCP "never see your documents". Signet memakai BBS+ untuk selective disclosure dan mencatat setiap pengungkapan. Safehold menyediakan tool `selective_share` untuk paspor. BitAtlas memakai enkripsi di sisi klien. Halaman Signet yang kubuka kosong.

### 1.2 Inferensi

- [Inferensi] Kompetitor terdekat untuk kasus medis adalah Claude dengan HealthEx dan ChatGPT Health. Keduanya sudah menjalankan "akses dengan izin, ambil potongan yang relevan, tidak dipakai untuk training". Bedanya, data mentah tetap terbaca oleh OpenAI atau Anthropic dalam bentuk plaintext, dan perlindungannya hanya janji kebijakan. Dasarnya kutipan EPIC dan Anthropic di atas.
- [Inferensi] Enclave (`slm-vault`) dan `personal-vault` paling mirip secara arsitektur, karena keduanya memakai MCP, izin per agent, dan log aktivitas. Keduanya hanya lokal, tanpa TEE, dan tanpa log yang bisa diverifikasi pihak ketiga. `personal-vault` mengembalikan nilai field mentah ke model.
- [Inferensi] Bisnis konsumen di kategori ini sulit dimonetisasi. Personal AI menutup langganan konsumen. Rewind dimatikan setelah diakuisisi. Pemain besar memberi fitur kesehatan di paket gratis. Dasarnya fakta Personal AI, Limitless, dan ChatGPT Health di atas.

## 2. Proyek Web3 dan TEE

### 2.1 Fakta

- [Fakta] Inferensi NEAR AI Cloud berjalan di TEE. Halamannya menyebut "We never see plaintext, and there is no operator backdoor". Setiap respons membawa hardware quote yang bisa diperiksa. Harganya "Pay only for the tokens you use", dan enterprise custom. Halaman itu tidak menyebut fitur unggah dokumen atau memori. Sumbernya https://near.ai/?p=171
- [Fakta] IronClaw dari NEAR AI dirilis 23 Feb 2026. IronClaw "isolates credentials in an encrypted vault" dan "ensures secrets never reach the model". Pengumumannya tidak menyebut fitur data pribadi atau dokumen. Sumbernya https://near.ai/blog/near-ai-launches-ironclaw-confidential-gpu-marketplace-and-multimodal-confidential-inference
- [Fakta] API Confidential AI dari Phala kompatibel dengan OpenAI dan berjalan di TEE dengan attestation dan tanda terima bertanda tangan. Halamannya mencatat "Confidential inference and zero data retention are separate properties". Harga per token dilihat di katalog `GET /v1/models`. Sumbernya https://docs.phala.com/phala-cloud/confidential-ai/confidential-model/confidential-ai-api
- [Fakta] Di Vana, raw data "never leaves the enclave". Aplikasi hanya menerima hasil seperti agregat atau model terlatih. Status menurut dokumentasinya: TEE, refinement, dan query sudah tersedia, sedangkan pooled job dan model akses DataDAO masih direncanakan. Sumbernya https://docs.vana.org/applications/confidential-compute
- [Fakta] Pendanaan Vana total $25 juta: seed $2 juta (Polychain), Series A $18 juta (Paradigm), dan strategis $5 juta (Coinbase Ventures), per 18 Sep 2024. Sumbernya https://vana.org/posts/vana-raises-funding-to-build-user-owned-ai-and-overcome-the-data-wall
- [Fakta, cuplikan saja] Di Nillion, nilDB memecah field terenkripsi ke beberapa node dan nilAI menjalankan model di TEE dengan attestation. Pendanaan $52,7 juta disebut di halaman riset Binance (sumber sekunder). Halaman dokumentasi Nillion kosong saat dibuka.
- [Fakta, cuplikan saja] Secret AI memakai NVIDIA confidential computing di SecretVM. Blog Secret sendiri mengakui perlindungan ini tidak mampu menahan "a physical owner of an admitted machine" (pemilik fisik mesin).
- [Fakta, cuplikan saja] Oasis ROFL menjalankan logika off-chain di TEE. Heurist memakai ROFL untuk server MCP yang berjalan di TEE (blog https://oasis.net/blog/confidential-mcp-servers-for-agents, HTTP 403).
- [Fakta, cuplikan saja] Access control condition di Lit Protocol mengatur siapa yang boleh mendekripsi data. Vincent adalah toolkit kebijakan untuk agent. Private inference atas data terenkripsi masih disebut sebagai peluang, belum produk jadi.

### 2.2 Inferensi

- [Inferensi] Phala, NEAR AI Cloud, Nillion, dan Oasis adalah infrastruktur, bukan produk brankas konsumen. Konsep ini bisa dibangun di atas mereka, jadi mereka bukan pesaing langsung. Tapi siapa pun bisa merakit hal yang sama dengan cepat.
- [Inferensi] Fokus Vana adalah pasar data gabungan untuk training. Konsep ini adalah jawaban per pengguna untuk agent milik pengguna itu sendiri. Mekanisme TEE-nya mirip, tetapi pasarnya berbeda.

## 3. Submission NEAR Hackathon yang mirip

### 3.1 Fakta

Sumbernya `projects.json`, field `text` (teks post demo) dan `product_explanation`.

| # | Proyek | Kemiripan | Repo |
|---|---|---|---|
| 11 | ÁUREA | AI di TEE membuat ringkasan FHIR (standar format rekam medis). NEAR menjadi "cartório de consentimento" (pencatat izin) yang memblokir dokter tanpa izin. | github.com/dckwai-lab/aurea-contract |
| 13 | Jurat | Enclave memeriksa saldo rahasia dan "returns only the verdict". Kontrak NEAR mencatat jawabannya di mainnet. | github.com/nftkingiii/jurat |
| 248 | Sealed Ledger | Kuitansi dan CSV bank diaudit di TEE NEAR AI. Ada bukti perangkat keras, dan postingannya mengklaim "0 bytes retained". | tidak ada di data |
| 217 | Sealed Dossier | Nama klien pengacara diganti secara lokal, lalu diproses model rahasia, dengan tanda terima bertanda tangan. | github.com/archtum66-dev/sealed-dossier |
| 127 | RedactGate | Nomor pajak (SIN) dihapus sebelum dikirim ke AI. Ujung rantai log disimpan di kontrak NEAR. | github.com/ctmakc/redactgate |
| 357 | cipherwork | Agent memverifikasi TEE, mengirim rahasia terenkripsi, dan membayar di NEAR setelah ada bukti. Punya 13 like. | github.com/wadadawadada/cipherwork |
| 43 | TEE Receipts | Jawaban AI dari TEE ditambatkan ke NEAR. | github.com/tmdry4530/tee-receipts |

- [Fakta] Tidak ada submission yang menggabungkan brankas multi-dokumen untuk satu pengguna dengan akses dari ChatGPT atau Claude lewat MCP. Pencarian kata kunci `MCP` hanya menemukan proyek pembayaran (#181, #206, #264) dan simulasi (#231).

### 3.2 Inferensi

- [Inferensi] Jurat dan ÁUREA sudah mendemokan inti konsep ini di hackathon yang sama. Jurat melakukan "jawab minimal dari data rahasia di enclave lalu catat di NEAR" untuk saldo. ÁUREA melakukan "izin di NEAR dan AI di TEE" untuk rekam medis. Juri yang melihat keduanya akan menilai brankas ini sebagai generalisasi, bukan pola baru.

## 4. Riset akademis

### 4.1 Fakta

- [Fakta] AirGapAgent (arXiv 2405.05175) membatasi akses agent ke "only the data necessary for a specific task". Serangan context hijacking (manipulasi percakapan agar agent membocorkan data) menurunkan tingkat perlindungan Gemini Ultra "from 94% to 45%", sedangkan AirGapAgent "achieves 97% protection". Sumbernya https://arxiv.org/abs/2405.05175
- [Fakta] PrivacyChecker (arXiv 2509.17488, EMNLP 2025 Findings) berbasis contextual integrity (prinsip bahwa data boleh mengalir hanya jika sesuai konteksnya). Metode ini menurunkan kebocoran "from 36.08% to 7.30% on DeepSeek-R1" dan menyebut MCP sebagai pemicu risiko. Sumbernya https://arxiv.org/abs/2509.17488
- [Fakta, cuplikan saja] AgentDAM dari Meta FAIR (arXiv 2503.09780, NeurIPS 2025 D&B) menemukan web agent sering gagal menerapkan data minimization (hanya memakai data yang benar-benar perlu) bahkan pada tugas biasa. PrivacyLens (Shao dkk., 2024) adalah benchmark kebocoran pada lintasan kerja agent.

### 4.2 Inferensi

- [Inferensi] Akademisi sudah lama membahas "pengungkapan minimal untuk agent". Hampir semua solusinya ada di sisi agent (LLM kedua sebagai penyaring, atau prompting). Belum ada yang menaruh penyaringnya di sisi pemilik data dengan jaminan perangkat keras dan log publik. Ini celah riset yang masuk akal, tapi belum kuverifikasi lewat survei literatur lengkap.
- [Inferensi] Angka AirGapAgent menunjukkan "minimizer" berbasis LLM tetap bisa ditembus 3% kasus. Jadi klaim "hanya jawaban minimal" perlu didukung kebijakan deterministik per atribut, bukan hanya penilaian LLM.

## 5. Model bisnis, harga, dan pendanaan

### 5.1 Fakta

| Pemain | Harga | Pendanaan (sumber) |
|---|---|---|
| ChatGPT Health | Masuk paket Free sampai Pro | Tidak relevan (OpenAI) |
| Claude + HealthEx | Khusus paket Pro dan Max | HealthEx tidak ditemukan |
| Personal AI | Enterprise custom, konsumen ditutup | Tidak dicari |
| Vana | Token dan biaya job TEE | $25 juta (vana.org) |
| Inrupt | Evaluasi enterprise 60 hari | Sekitar $30 juta (techzine, cuplikan) |
| Mem0 | Tidak dicek | $24 juta (cuplikan) |
| Nillion | Tidak dicek | $52,7 juta (Binance, cuplikan) |
| Phala, NEAR AI | Per token atau per jam | Tidak dicek |

- [Fakta] Harga paket Pro dan Max Claude tidak kuverifikasi dalam riset ini.

### 5.2 Inferensi

- [Inferensi] Uang di kategori ini ada di B2B dan infrastruktur, bukan di langganan privasi konsumen. Investor mendanai lapisan memori (Mem0) dan pasar data (Vana). Brankas konsumen yang berdiri sendiri belum punya bukti orang mau membayar.

## 6. Ringkasan per kompetitor

### 6.1 Inferensi

Status "sembunyi dari penyedia model" di bawah adalah penilaianku berdasarkan sumber di bagian 1 sampai 3.

| Kompetitor | Sembunyi dari penyedia model? | Celah utama |
|---|---|---|
| ChatGPT Health | Tidak. OpenAI membaca data, hanya janji tidak dipakai training. | Tidak ada TEE, tidak ada log yang bisa diverifikasi, hanya AS. |
| Claude + HealthEx | Tidak. Potongan rekam medis plaintext masuk ke Claude. | Hanya kesehatan, terkunci di satu model. |
| Kin | Sebagian. Konteks terpilih tetap dikirim ke Anthropic dan OpenAI. | Tidak ada attestation, log tidak bisa diaudit pihak luar. |
| Inrupt agentic wallet | Klaim ya, tapi belum diverifikasi. | Enterprise, data masih simulasi. |
| `personal-vault`, Enclave, Tobari | Enclave ya (RAG lokal), lainnya mengirim field mentah. | Lokal saja, tanpa TEE, tanpa log publik. |
| NEAR AI Cloud, IronClaw | Ya, untuk inferensi dan kredensial. | Bukan brankas dokumen, tanpa kebijakan jawaban minimal. |
| Vana | Ya, data mentah tetap di enclave. | Untuk pasar data gabungan, bukan agent pribadi. |
| Jurat, ÁUREA (hackathon) | Ya, di TEE. | Hanya satu domain (saldo atau medis), tanpa MCP untuk ChatGPT atau Claude. |

## 7. Celah yang belum diisi siapa pun

### 7.1 Inferensi

Semua poin di bagian ini adalah inferensi, berdasarkan tidak ditemukannya produk dalam 20 pencarian dan 431 submission.

1. Belum ada brankas yang **menghitung jawaban di dalam TEE** dan hanya mengirim hasil terbatas (misalnya "HbA1c terakhir di bawah 7: ya") ke ChatGPT atau Claude lewat MCP standar. HealthEx mengirim potongan rekam medis, bukan jawaban turunan.
2. Belum ada **log akses yang bisa diverifikasi pengguna** yang mengikat setiap jawaban ke attestation enclave dan ke kebijakan versi tertentu. Pemain besar hanya menyediakan pengaturan izin.
3. Belum ada brankas lintas domain (medis, keuangan, identitas) dengan **kebijakan per atribut** yang bisa dipakai oleh model mana pun, sehingga pengguna tidak terkunci di satu penyedia.

**Batas jujur dari celah ini.** Jawaban minimal dan pertanyaan pengguna tetap terbaca oleh OpenAI atau Anthropic. Konsep ini menyembunyikan file mentah, bukan seluruh konteks. Kalau "jawaban minimal" cukup kaya untuk berguna (misalnya ringkasan riwayat obat), selisih privasinya dibanding HealthEx mengecil. Kalau sangat sempit (ya atau tidak), kegunaannya untuk percakapan medis terbatas.

**Bukti permintaan.** ChatGPT Health dan Claude sama-sama meluncurkan fitur ini, jadi ada permintaan untuk "AI membaca rekam medis". Bukti bahwa pengguna mau menambah lapisan privasi berbayar belum ditemukan.

## 8. Penilaian originality: sedang (batas bawah)

### 8.1 Inferensi

**Alasan bukan tinggi:**

- Pola "jawab minimal dari enclave, lalu catat di NEAR" sudah didemokan Jurat (#13).
- Pola "izin di NEAR dan AI di TEE untuk rekam medis" sudah didemokan ÁUREA (#11).
- Kombinasi "MCP, izin per agent, dan log" sudah ada di beberapa repo open source.
- Pengambilan selektif lewat MCP untuk rekam medis sudah dijalankan Anthropic dan HealthEx dalam skala besar.

**Alasan bukan rendah:** belum ada yang menggabungkan keempat sifat sekaligus untuk ChatGPT dan Claude:

- jawaban dihitung di TEE;
- kebijakan per atribut;
- log yang terikat attestation;
- mencakup banyak domain.

**Konsekuensi untuk penjurian.** Originality hanya akan terlihat kalau demo menonjolkan pembeda itu. Contohnya, satu pertanyaan yang sama diajukan ke Claude+HealthEx dan ke brankas, lalu ditunjukkan apa yang sampai ke penyedia model dalam masing-masing kasus. Tanpa perbandingan seperti itu, juri akan membacanya sebagai "Jurat atau ÁUREA versi umum".

**Pemeriksaan aturan.** Dicek terhadap compliance gate di `NEAR.md`. Ini tugas riset saja dan tidak ada konflik aturan. Q-001 berlaku kalau ide ini dibangun: kode harus ditulis sejak 19 Okt 2026, dan tenggatnya 14 Nov 2026 23:59 UTC (sekitar 3 hari dari tanggal riset).
