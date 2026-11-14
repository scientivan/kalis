# Celah kompetitor jalur 1 sampai 3: unggah dokumen, tempel kode atau data, kebocoran dari sisi aplikasi chat

Tanggal riset 11 Nov 2026. Fokus: jalur (1) dokumen dan spreadsheet diunggah, (2) kode dan notulen ditempel, (3) isi chat bocor dari sisi aplikasi (share link, retensi, ekstensi).

Cara membaca label:

- **[Fakta]** punya sumber yang sudah kubuka. "Cuplikan saja" berarti hanya dari ringkasan hasil pencarian karena halamannya gagal dibuka (403, 404, kosong) atau tidak kubuka.
- **[Inferensi]** adalah kesimpulanku sendiri, dengan dasar singkat.

Metode: 29 pencarian web, 21 halaman dan 1 PDF dibuka, ditambah pencarian kata kunci di 431 submission `projects.json`. Lima cara pencarian celah dipakai: batas yang diakui dokumentasi (Purview, Venice, Gemini, Claude HIPAA), insiden 2025 sampai 2026 (lihat juga `Kebocoran data AI/insiden.md` dan `insiden-2026.md`, tidak diulang di sini), riset akademis (LLM-Redactor, REDACT, CAPID, Staab dkk., TEE.fail), keluhan dan survei pengguna (Cyberhaven, Kolmogorov Law, survei psikoterapis, ulasan Lumo), serta segmen yang tidak dilayani (perangkat, paket, harga).

Yang tidak berhasil kutemukan: keluhan pengguna yang spesifik untuk Caviard, Redactor, PrivacyGuard, Attic, Shakudo, Gravitee, dan Portcullis. Basis ulasan ekstensi redaksi sangat kecil (Caviard: 1 rating, sekitar 272 pengguna, cuplikan saja dari extscope.org dan Chrome Web Store). Jadi kegagalan kategori ekstensi dan gateway di bawah dibuktikan lewat riset dan dokumentasi, bukan keluhan per produk.

## 1. Ekstensi redaksi PII dan gateway redaksi

### 1.1 Fakta

- [Fakta] Redaksi dengan placeholder menurunkan mutu jawaban. Di LLM-Redactor (arXiv 2604.12064, 13 Apr 2026), juri model memilih jawaban tanpa redaksi 78% (PII) dan 80% (secret) dari waktu, dibanding 22% dan 20% untuk jawaban yang diredaksi (Tabel 10, n=50). Sumber https://arxiv.org/html/2604.12064
- [Fakta] Di paper yang sama, redaksi NER saja (opsi B) masih membocorkan **42,8% kode proprietary** secara eksak dan 58,5% eksak plus parsial. Kombinasi terbaik (model lokal, redaksi, rephrasing) masih bocor 12,3% eksak dan 31,3% gabungan untuk kode (Tabel 4 dan 5).
- [Fakta] Untuk identitas implisit (orang bisa dikenali tanpa nama), semantic leak rate redaksi regex maupun NER tetap 0,95, sama dengan tanpa perlindungan. Paper menulis "All three configurations fail" (Tabel 11, subset 20 sampel). Paper juga mengakui detektornya hanya bahasa Inggris dan datanya sintetis.
- [Fakta] Redaksi regex saja membocorkan 81,2% PII (gabungan eksak dan parsial). Nama orang (0,123) dan nama organisasi (0,259) yang paling sering lolos NER (Tabel 5 dan 7).
- [Fakta] CAPID (arXiv 2602.10074, 10 Feb 2026) menulis bahwa pendekatan sekarang "redact all PII, disregarding the fact that some of them may be contextually relevant to the user's question", sehingga mutu jawaban turun. Sumber https://arxiv.org/abs/2602.10074
- [Fakta] Benchmark REDACT (arXiv 2606.19881, 18 Jun 2026; 25 bahasa, 9 aksara) menemukan Presidio (detektor berbasis aturan yang dipakai banyak gateway) punya recall **0,07** pada kategori paling sensitif dan buruk pada bentuk yang tidak verbatim. Rincian per bahasa tidak ada di abstrak. Sumber https://arxiv.org/abs/2606.19881
- [Fakta] Dokumentasi Presidio: konfigurasi default hanya punya recognizer dan model bahasa Inggris, dan "the context words used to increase the PII detection confidence aren't" (tidak lintas bahasa). Dikutip di blog Grepture 29 Jun 2026, yang juga menyebut benchmark vendor dengan "aggregate recall in the 57–73% range". Sumber https://grepture.com/blog/presidio-not-enough-pii-redaction
- [Fakta] Staab dkk. (arXiv 2310.07298, ICLR 2024): LLM menebak atribut pribadi (lokasi, umur, pendapatan) dari teks dengan akurasi top-1 hingga 85%, dan tetap bisa menebak banyak atribut setelah teks dianonimkan dengan alat terbaik. Sumber https://arxiv.org/abs/2310.07298 (cuplikan saja, halaman tidak kubuka).
- [Fakta, cuplikan saja] Listing ekstensi menunjukkan cakupan file yang lemah. RedactChat hanya mendukung "basic text extraction" untuk PDF dan Word. Private Data Redactor hanya teks tempel, TXT, CSV, JSON. Hanya OfflineRedact yang mengklaim OCR (Tesseract.js). Sumber listing Chrome Web Store lewat hasil pencarian.

### 1.2 Inferensi

- [Inferensi] Ekstensi dan gateway redaksi gagal di dua ujung sekaligus. Kalau redaksinya ketat, jawaban rusak (78–80% kalah). Kalau longgar, kode, nama, dan identitas implisit lolos (42,8% kode, 0,95 identitas implisit). Dasarnya angka LLM-Redactor di atas.
- [Inferensi] Jalur 2 (kode dan notulen) praktis tidak tertangani redaksi. Kode proprietary tidak punya pola seperti nomor KTP, dan notulen penuh identitas implisit. Dasarnya angka WL3 dan WL4 di atas.
- [Inferensi] Teks non-Inggris (misalnya bahasa Indonesia, nama lokal, NIK) adalah titik buta default. Dasarnya dokumentasi Presidio dan REDACT. Angka recall untuk bahasa Indonesia **belum kuverifikasi**.

## 2. DLP AI untuk perusahaan (LayerX, Harmonic, Nightfall, Purview, Netskope)

### 2.1 Fakta

- [Fakta] Purview untuk aplikasi AI tak terkelola (ChatGPT consumer, Gemini, DeepSeek, Grok, Meta AI, dan lainnya) hanya berlaku di Edge for Business pada Windows 10/11 yang dikelola Intune. Batas evaluasi inline "up to 4 MB of content for uploadText, and files up to 3 MB for uploadFile". Halaman itu juga mengakui "Some unmanaged AI apps like ChatGPT, Runway and Meta AI might intermittently send content in encoded form or through dynamically generated endpoints, which can impact policy enforcement." Kebijakan tidak berlaku untuk tamu B2B. Halaman diperbarui 30 Okt 2026. Sumber https://learn.microsoft.com/en-us/purview/dlp-browser-dlp-learn
- [Fakta] Cyberhaven "The DLP Disconnect" (survei 300 pemimpin keamanan, laporan 2025, PDF dibuka): hanya **29%** yakin DLP mereka bisa mengenali dan mencegah input data sensitif ke ChatGPT atau DeepSeek, dan hanya **24%** untuk konten non-teks (screenshot, gambar). 51% alert rata-rata false positive. 60% bilang karyawan "always trying to bypass our DLP". 42% sudah mematikan inspeksi file besar, 44% inspeksi arsip zip, 39% mematikan DLP untuk divisi marketing, 34% HR, 32% finance. Sumber https://info.cyberhaven.com/hubfs/Webflow_Resources/2025-DLP-Disconnect-Report.pdf
- [Fakta] Catatan koreksi. Ringkasan mesin pencari menyebut "29% sudah mematikan inspeksi DLP untuk AI". Setelah PDF dibuka, angka 29% itu ternyata tingkat **keyakinan** bahwa DLP bisa mencegah input ke AI, bukan tingkat mematikan.
- [Fakta] Survei Kolmogorov Law via Pollfish (500 pekerja AS, 8 Jul 2026, dilaporkan 30 Jul 2026): 38% pernah memasukkan informasi kerja ke akun AI pribadi yang tidak dikontrol perusahaan. Dokumen, email, dan memo internal 23% dari semua responden, data klien 11,8%, kontrak 11,4%, kode 9%. Sebanyak 64,4% tidak tahu ini bisa melanggar hukum. Sumber https://keyt.com/stacker-ai/2026/07/30/nearly-2-in-5-us-workers-have-put-company-information-into-personal-ai-accounts-and-most-dont-know-it-can-be-illegal/
- [Fakta] Analisis NHI Mgmt Group atas pengumuman Cyera (20 Mei 2026) menyatakan kebanyakan DLP "do not inspect the browser input field where the leak actually happens", dan satu perangkat bisa punya akun AI perusahaan dan pribadi sekaligus. Sumber https://nhimg.org/articles/chatgpt-data-leak-controls-expose-the-limits-of-enterprise-dlp/
- [Fakta, cuplikan saja] Harmonic mengakui ekstensi browser saja tidak menjangkau ChatGPT Desktop, sehingga butuh endpoint agent terpisah. Sumber harmonic.security/resources/ai-has-gone-beyond-the-browser-so-has-harmonic lewat hasil pencarian.
- [Fakta, cuplikan saja] Laporan LayerX 2025: 40% file yang diunggah ke alat GenAI berisi PII atau PCI, dan 67% pemakaian AI lewat akun pribadi yang tidak dikelola. Sumber go.layerxsecurity.com lewat hasil pencarian. Angka 77% yang sering dikutip belum bisa kupastikan definisinya.
- [Fakta, cuplikan saja] Cato Networks (Jan 2026) mengakui saat teks gagal diekstrak OCR, mesin DLP tidak mendeteksi kecocokan. Halaman kosong saat dibuka.
- [Fakta] Harga dan syarat minimum DLP AI (LayerX minimum 50 user, Harmonic minimum 200 user, Nightfall lewat sales) sudah dicatat di `Kebocoran data AI/validasi-segmen-kecil.md`.

### 2.2 Inferensi

- [Inferensi] DLP AI tidak melindungi individu sama sekali. Ia hanya aktif di perangkat yang dikelola perusahaan dan akun kerja, sedangkan kebocoran jalur 1 dan 2 banyak terjadi di akun pribadi (38% pekerja, 67% pemakaian menurut LayerX). Dasarnya fakta Purview, Kolmogorov, dan LayerX di atas.
- [Inferensi] Jawaban DLP atas kebocoran adalah memblokir, bukan memberi jalan aman. Ini mendorong pengguna memakai ponsel atau akun pribadi, dan mendorong tim keamanan mematikan inspeksi karena bising. Dasarnya angka bypass 60% dan pematian inspeksi 32–44% dari Cyberhaven.

## 3. Chat privat berbasis TEE (NEAR AI Private Chat, Maple, Lumo, Brave Leo, Venice, Okara, Confident Security)

### 3.1 Fakta

- [Fakta] Venice mengakui "TEE and E2EE are currently available on text models only", dan E2EE "disables features that need plaintext outside the enclave", misalnya web search dan memory. Pada mode Anonymous, "Prompt content is still visible to that provider." Sumber https://docs.venice.ai/welcome/privacy
- [Fakta] FAQ NEAR AI Private Chat yang kubuka hanya menyebut "A growing catalog of open-weight models such as GLM and Qwen, served privately in secure enclaves". Halaman itu tidak membahas unggah file, gambar, retensi, atau berbagi chat. Sumber https://near.ai/?p=171
- [Fakta] Model open-weight yang tersedia di TEE NEAR punya skor kecerdasan 32, sedangkan frontier 57–58 (Artificial Analysis v5, 27 Okt 2026). Sudah dicatat di `Kebocoran data AI/model-pintar-privat.md`.
- [Fakta, cuplikan saja] Ulasan Lumo (TechRadar) mencantumkan kelemahan "weaker than frontier AI rivals" dan "no image upload support". Komentar Privacy Guides menyebut tidak ada dukungan unggah gambar. Halaman TechRadar terpotong saat dibuka. Thread Lemmy yang kubuka hanya berisi keluhan "Its the product offering nobody wanted" dan penolakan topik ganja yang legal.
- [Fakta, cuplikan saja] Whitepaper Okara menggambarkan enkripsi saat disimpan (kunci publik dipakai Okara untuk mengenkripsi pesan), bukan inferensi di TEE. Halaman whitepaper yang kubuka tidak memuat isi itu.
- [Fakta, cuplikan saja] Dokumen Brave Leo saling bertentangan soal hosting Claude (dihosting Brave sendiri, atau lewat AWS Bedrock dengan zero retention).
- [Fakta, cuplikan saja] TEE.fail (Okt 2025): interposer bus memori DDR5 seharga di bawah $1.000 mengekstrak kunci attestation Intel TDX dan AMD SEV-SNP dan memalsukan attestation GPU NVIDIA. Intel dan AMD menganggap serangan fisik di luar cakupan. Sumber securityweek.com dan thehackernews.com lewat hasil pencarian.

### 3.2 Inferensi

- [Inferensi] Chat privat menyelesaikan "siapa yang melihat", tetapi mengorbankan dua hal yang dibutuhkan jalur 1, yaitu model yang cukup pintar dan penanganan dokumen (gambar, PDF hasil scan, tabel). Dasarnya pengakuan Venice (hanya teks), skor 32 lawan 58, dan keluhan Lumo.
- [Inferensi] Karena itu pengguna dengan dokumen sulit tetap kembali ke ChatGPT atau Claude. Bukti langsung bahwa pengguna pindah balik **belum kutemukan**.
- [Inferensi] Okara dan Venice mode standar bukan TEE dalam arti kuat. Produk yang disebut "private" di pasar tidak setara jaminannya, dan pengguna awam tidak bisa membedakannya.

## 4. Asisten patuh HIPAA (BastionGPT, ChatGPT Health, Claude for Healthcare)

### 4.1 Fakta

- [Fakta] HIPAA di Claude hanya untuk paket Enterprise: "Team plans and individual plans (Free, Pro, Max, and Ultra) can't enable HIPAA." Cowork tanpa konfigurasi "not covered under your BAA". Fitur cloud seperti Claude Code cloud sessions tidak tersedia setelah HIPAA aktif, dan keputusan ini "a one-way decision". Sumber https://support.claude.com/en/articles/13296973
- [Fakta] Survei global 766 profesional kesehatan mental di 30 negara (dilaporkan ICT&health 6 Jul 2026): 54,6% sudah memakai AI generatif, hampir 85% pengguna AI memakai ChatGPT, 81% tanpa pelatihan. Persentase yang menempelkan data pasien tidak diukur. Sumber https://icthealth.org/news/half-of-psychotherapists-use-chatbots-not-built-for-therapy
- [Fakta, cuplikan saja] BastionGPT memakai model berlisensi OpenAI di Azure dengan BAA, menyimpan data maksimal 30 hari, dan harga per user. Sumber support.bastiongpt.com lewat hasil pencarian. Model ini tetap membaca plaintext.
- [Fakta] ChatGPT Health tidak dilindungi HIPAA setelah data keluar dari penyedia layanan kesehatan. Sudah dicatat di `Kebocoran data AI/kompetitor-brankas.md`.

### 4.2 Inferensi

- [Inferensi] Klinisi solo dan praktik kecil jatuh di celah. Claude HIPAA butuh Enterprise, ChatGPT konsumen tidak tercakup BAA, dan mereka sudah memakai ChatGPT konsumen. Dasarnya fakta Claude dan survei psikoterapis di atas.
- [Inferensi] "Patuh HIPAA" berarti ada kontrak (BAA), bukan berarti penyedia tidak bisa membaca data. Ini perlindungan hukum, bukan teknis.

## 5. Pengaturan bawaan ChatGPT, Claude, Gemini

### 5.1 Fakta

- [Fakta] Gemini: "Temporary chats and chats you have when Keep Activity is off are retained with your account for 72 hours." "A subset of chats are reviewed by human reviewers", dan "If you delete your activity, past chats already reviewed by service providers aren't deleted" (disimpan sampai 3 tahun). Foto dari galeri yang diunggah saat Keep Activity aktif dipakai untuk memperbaiki layanan dengan bantuan reviewer manusia. Diperbarui 26 Okt 2026. Sumber https://support.google.com/gemini/answer/13594961?hl=en
- [Fakta, cuplikan saja] ChatGPT: Temporary Chat disimpan sampai 30 hari. File di Library tidak ikut terhapus saat chat dihapus. File di project atau custom GPT disimpan sampai project, GPT, atau file dihapus, lalu dijadwalkan terhapus dalam 30 hari, dan backup bisa bertahan 30 hari lagi. Sumber help.openai.com/en/articles/8983778 (403 saat dibuka).
- [Fakta, cuplikan saja] Laporan pengguna: file yang dihapus dari sumber custom agent masih bisa dipanggil di chat baru berbulan-bulan kemudian. Belum dikonfirmasi OpenAI. Sumber aiweekly.co lewat hasil pencarian.
- [Fakta] Claude konsumen: sejak 28 Sep 2025 chat dipakai untuk training kecuali pengguna opt out, dengan retensi 5 tahun bagi yang ikut serta dan 30 hari bagi yang menolak. Toggle training "On" secara default di bawah tombol Accept yang besar. Sumber https://techcrunch.com/2025/08/28/anthropic-users-face-a-new-choice-opt-out-or-share-your-data-for-ai-training/ (cuplikan saja, tidak kubuka).
- [Fakta] Share link Claude dan Artifact terindeks Google sekitar 25 sampai 27 Jul 2026, termasuk laporan medis pasien, hasil uji klinis dengan nama pasien, dan nomor telepon anak SD. Anthropic menyatakan "we do not share chat directories or sitemaps with search engines" dan link bersama "may be archived by third-party services". Pengguna hanya bisa meninjau di Settings, Privacy, Shared Chats. Sumber https://techcrunch.com/2026/07/27/psa-your-claude-shared-chats-and-artifacts-may-have-ended-up-on-google/
- [Fakta] Insiden indeks ChatGPT (Jul 2025, lebih dari 4.500 link), Grok (Agu 2025, lebih dari 370.000), dan ekstensi Urban VPN yang menyadap chat 8 juta pengguna sudah dicatat di `Kebocoran data AI/insiden.md`.

### 5.2 Inferensi

- [Inferensi] Tombol "privasi" bawaan semuanya **mengurangi**, bukan **menutup**. Temporary chat tetap disimpan 30 hari (ChatGPT) atau 72 jam (Gemini), chat yang sudah direview tidak bisa dihapus, file punya siklus retensi sendiri, dan share link tidak bisa ditarik dari arsip pihak ketiga. Dasarnya kutipan Gemini, OpenAI, dan Anthropic di atas.
- [Inferensi] Share link adalah salinan permanen dokumen. Setelah link tersebar, pencabutan hanya mematikan URL asli, bukan salinan di arsip. Ini kuat untuk jalur 3, tetapi akar masalahnya ada di perilaku berbagi, dan semua penyedia sudah memasang noindex.

## 6. Submission NEAR Hackathon di jalur yang sama

### 6.1 Fakta

Sumber `projects.json`, field `text`.

| # | Proyek | Isi | Jalur |
|---|---|---|---|
| 127 | RedactGate | Menghapus SIN klien firma pajak sebelum dikirim ke AI, log hash di kontrak NEAR | 2 |
| 217 | Sealed Dossier | Nama klien pengacara ditukar lokal, ditanya ke model rahasia NEAR AI Cloud, tanda terima bertanda tangan | 1, 2 |
| 248 | Sealed Ledger | Kuitansi dan CSV bank diaudit di TEE NEAR AI Cloud, "0 bytes retained" | 1 |
| 357 | cipherwork | Agent memverifikasi TEE, mengirim rahasia terenkripsi, membayar setelah ada bukti | 1 |

- [Fakta] Tidak ada submission yang menangani share link, retensi file, PDF hasil scan atau gambar, teks non-Inggris, atau pemilihan model berdasarkan sensitivitas dokumen (pencarian kata kunci `OCR`, `share link`, `HIPAA`, `anonymi`, `pseudonym` tanpa hasil relevan).

### 6.2 Inferensi

- [Inferensi] Pola "redaksi lalu catat di NEAR" (RedactGate) dan "tukar nama lalu ke model rahasia" (Sealed Dossier) sudah ada. Celah yang hanya menawarkan redaksi atau TEE generik akan dinilai tidak original.

## 7. Daftar celah

Semua penilaian di bagian ini adalah [Inferensi], berdasarkan fakta di bagian 1 sampai 6.

### Celah A. Redaksi merusak jawaban dan tetap membocorkan kode serta identitas implisit

- Deskripsi: tidak ada produk yang membiarkan model melihat dokumen utuh (agar jawaban bagus) tanpa penyedia model ikut melihatnya; yang ada hanya memotong data (jawaban rusak) atau mengirim utuh (bocor).
- Bukti: LLM-Redactor, juri memilih jawaban tanpa redaksi 78–80%; kode bocor 42,8% dengan NER; identitas implisit 0,95; CAPID mengonfirmasi penurunan mutu.
- Kompetitor yang gagal: Caviard, Redactor, PrivacyGuard, Grepture, Gravitee, Portcullis, dan RedactGate (#127), karena semuanya bergantung pada detektor pola dan NER.
- Yang terkena: pengembang, penulis notulen, pengacara, akuntan yang butuh jawaban akurat atas dokumen penuh.
- Yang membayar: [Fakta] BastionGPT dan ChatGPT Business menjual kursi per user untuk "AI yang aman dipakai dengan data klien" (lihat bagian 4 dan `validasi-segmen-kecil.md`). Bukti orang membayar khusus untuk "tanpa redaksi" belum ada.
- Peran NEAR: TEE NEAR AI Cloud esensial, karena hanya inferensi di enclave yang memungkinkan dokumen utuh diproses tanpa terbaca operator. Batasnya, model di TEE berskor 32, bukan 58, jadi celah ini hanya tertutup untuk tugas yang cukup dikerjakan model menengah.
- Originality: **sedang**. Sealed Dossier dan Sealed Ledger sudah memakai TEE NEAR untuk dokumen. Pembedanya harus bukti terukur "jawaban tidak rusak", misalnya mengulang uji LLM-Redactor di demo.
- Sustainability: **sedang**. Permintaan nyata ada (38% pekerja memakai akun pribadi), tetapi kalah pintar dari frontier.

### Celah B. Dokumen sulit (PDF hasil scan, foto, tabel, teks non-Inggris) lolos dari semua lapisan

- Deskripsi: dokumen yang paling sering bocor (spreadsheet pasien, scan KTP, foto dokumen) justru yang paling lemah dideteksi DLP dan paling sedikit didukung chat privat.
- Bukti: Cyberhaven, hanya 24% yakin DLP menangkap screenshot atau gambar; Purview membatasi file 3 MB dan mengakui konten ChatGPT kadang terkirim "in encoded form"; Venice TEE "text models only"; Lumo tanpa unggah gambar (cuplikan); Presidio default hanya Inggris, recall 0,07 di REDACT.
- Kompetitor yang gagal: DLP (ekstraksi teks dan OCR), ekstensi redaksi (hanya teks), chat TEE (hanya model teks).
- Yang terkena: staf klinik dan pemerintah daerah yang mengunggah spreadsheet (NSW, Johns Hopkins Bayview di `insiden-2026.md`), pengguna non-Inggris.
- Yang membayar: [Fakta] Nightfall dan Cato menjual OCR dan klasifikasi gambar untuk DLP enterprise. Untuk individu, bukti pembayaran belum ada.
- Peran NEAR: TEE NEAR AI Cloud esensial kalau model multimodal di enclave tersedia ([Fakta] `model-pintar-privat.md` mencatat GLM-5.3 Flash multimodal di NEAR vLLM). Kontrak dan akun NEAR tidak esensial di sini.
- Originality: **tinggi**. Tidak ada submission dan tidak ada chat privat yang kutemukan yang fokus pada scan, foto, dan tabel non-Inggris.
- Sustainability: **sedang**. Segmennya nyata (klinik, pemerintah daerah), tetapi pembayarnya organisasi, bukan individu.

### Celah C. Proteksi hanya bekerja di perangkat kantor yang dikelola, sedangkan kebocoran terjadi di akun pribadi

- Deskripsi: semua DLP AI mensyaratkan perangkat atau browser terkelola, sehingga 38% pekerja yang memakai akun pribadi, ponsel, atau aplikasi desktop tidak terlindungi sama sekali.
- Bukti: Purview hanya Edge for Business di Windows yang dikelola Intune; Harmonic butuh agent terpisah untuk ChatGPT Desktop (cuplikan); 60% karyawan selalu mencoba melewati DLP (Cyberhaven); 38% memakai akun pribadi (Kolmogorov).
- Kompetitor yang gagal: LayerX, Harmonic, Nightfall, Purview, Netskope, karena model bisnisnya kontrol perangkat oleh admin.
- Yang terkena: freelancer, pekerja UMKM, klinisi solo, pegawai yang memakai ponsel.
- Yang membayar: [Inferensi] individu belum terbukti membayar. Satu-satunya jalur pembayar yang terlihat adalah organisasi kecil yang tidak memenuhi minimum kursi DLP (50 sampai 200 user).
- Peran NEAR: akun dan access key NEAR bisa memberi identitas pengguna tanpa admin perusahaan, tetapi **tidak esensial**; login biasa juga bisa. TEE tetap berperan untuk inferensi.
- Originality: **sedang**. Celahnya nyata, tetapi solusi "AI privat untuk individu" sudah dijual Maple, Lumo, Venice, dan Okara.
- Sustainability: **rendah**. Konsumen jarang membayar privasi, seperti dicatat di `kompetitor-brankas.md`.

### Celah D. Tombol privasi bawaan tidak benar-benar menghapus, dan share link tidak bisa ditarik

- Deskripsi: temporary chat, opt out training, dan hapus chat semuanya meninggalkan salinan (30 hari, 72 jam, 3 tahun untuk chat yang direview, file Library, arsip share link) yang tidak bisa diverifikasi pengguna.
- Bukti: kutipan Gemini (72 jam, chat yang direview tidak terhapus); OpenAI (30 hari, file Library terpisah, cuplikan); Claude 2026, share link terindeks berisi laporan medis pasien dan bisa "archived by third-party services".
- Kompetitor yang gagal: ChatGPT, Claude, dan Gemini (retensi adalah kebijakan, bukan jaminan teknis); chat TEE (fitur berbagi dan memori mati di mode E2EE Venice).
- Yang terkena: setiap pengguna yang berbagi atau menghapus chat berisi dokumen.
- Yang membayar: bukti belum ditemukan.
- Peran NEAR: kontrak NEAR bisa mencatat izin baca share link dan pencabutannya, dan TEE bisa menjadi satu-satunya tempat dokumen didekripsi. Ini **mendekati esensial** untuk "berbagi yang bisa dicabut dan bisa diaudit", tetapi tidak mencegah penerima yang sah menyalin isinya.
- Originality: **sedang**. Belum ada submission di arah ini, tetapi konsep "link terenkripsi yang bisa dicabut" sudah ada di luar AI.
- Sustainability: **rendah**. Penyedia sudah memasang noindex, sehingga rasa sakitnya menurun.

### Celah E. Klinisi solo dan praktik kecil memakai ChatGPT konsumen karena opsi patuh hanya untuk Enterprise

- Deskripsi: HIPAA di Claude hanya untuk Enterprise, ChatGPT konsumen tanpa BAA, padahal 85% psikoterapis pengguna AI memakai ChatGPT.
- Bukti: support.claude.com (Free, Pro, Max, Ultra, dan Team tidak bisa mengaktifkan HIPAA); survei 766 profesional kesehatan mental.
- Kompetitor yang gagal: Claude for Healthcare (hanya Enterprise), ChatGPT Health (bukan untuk klinisi, bukan HIPAA). BastionGPT melayani segmen ini, tetapi tetap membaca plaintext.
- Yang membayar: [Fakta, cuplikan saja] BastionGPT menjual langganan per user dengan BAA. Ini bukti pembayaran serupa yang paling dekat.
- Peran NEAR: TEE mengurangi risiko teknis, tetapi pembeli di segmen ini membayar untuk **BAA** (kontrak hukum), dan kontrak NEAR tidak menggantikan BAA. Peran NEAR **tidak esensial** bagi alasan pembelian.
- Originality: **rendah**. BastionGPT dan banyak "HIPAA ChatGPT" sudah ada, dan ÁUREA (#11) memakai TEE untuk rekam medis.
- Sustainability: **sedang**. Bukti pembayaran ada, tetapi pembedanya terhadap BastionGPT lemah.

## 8. Ringkasan per celah

### 8.1 Inferensi

| Celah | Originality | Sustainability | NEAR esensial? |
|---|---|---|---|
| A. Redaksi merusak jawaban, kode bocor | sedang | sedang | ya (TEE), dibatasi mutu model |
| B. Scan, foto, tabel, non-Inggris lolos | tinggi | sedang | ya, kalau model multimodal di TEE |
| C. Proteksi hanya di perangkat kantor | sedang | rendah | tidak |
| D. Privasi bawaan tidak menghapus, share link | sedang | rendah | sebagian (kontrak dan TEE) |
| E. Klinisi solo tanpa opsi patuh | rendah | sedang | tidak |

Catatan validasi:

- [Inferensi] Celah A dan B terbukti nyata lewat riset dan dokumentasi, bukan lewat keluhan pengguna per produk. Keluhan spesifik untuk Caviard, Attic, Shakudo, Gravitee, dan Portcullis tidak kutemukan, jadi klaim "pengguna produk X kecewa" tidak boleh dipakai.
- [Inferensi] Solusi TEE untuk celah A dan B tidak menutup risiko fisik pada TEE (TEE.fail, cuplikan), dan tidak menutup kebocoran setelah jawaban dikembalikan ke pengguna.
- [Inferensi] Hampir semua angka survei berasal dari vendor keamanan (Cyberhaven, LayerX) yang menjual solusi, jadi arahnya bisa dipercaya, tetapi besarnya mungkin dibesar-besarkan.

**Pemeriksaan aturan.** Dicek terhadap compliance gate di `NEAR.md`. Ini tugas riset saja dan tidak ada konflik aturan. Kalau salah satu celah dibangun, kode harus ditulis sejak 19 Okt 2026 (Q-001), integrasi NEAR harus benar-benar dibangun (Q-002), dan tenggatnya 14 Nov 2026 23:59 UTC (sekitar 3 hari dari tanggal riset).

## Tiga celah terbaik

1. **Celah B: dokumen sulit lolos dari semua lapisan.** Ini mencakup PDF hasil scan, foto, tabel, dan teks non-Inggris.
   Bukti terkuat: hanya 24% pemimpin keamanan yakin DLP-nya menangkap gambar atau screenshot (Cyberhaven, 300 responden). Di dokumen resminya, Venice menyatakan TEE "text models only", dan Presidio punya recall 0,07 di REDACT.
   Originality tinggi (tidak ada kompetitor maupun submission yang menyasarnya). Sustainability sedang (pembayarnya organisasi, bukan individu).
2. **Celah A: redaksi merusak jawaban, dan kode serta identitas implisit tetap bocor.**
   Bukti terkuat: di LLM-Redactor (arXiv 2604.12064), juri memilih jawaban tanpa redaksi 78–80% dari waktu. Redaksi NER masih membocorkan 42,8% kode proprietary, dan identitas implisit bocor 0,95.
   Originality sedang (Sealed Dossier dan Sealed Ledger sudah memakai TEE NEAR untuk dokumen). Sustainability sedang (model di TEE berskor 32 lawan 58 untuk frontier).
3. **Celah D: tombol privasi bawaan tidak benar-benar menghapus, dan share link tidak bisa ditarik.**
   Bukti terkuat: Gemini menyimpan chat 72 jam walau Keep Activity mati, dan chat yang sudah direview tidak ikut terhapus (sampai 3 tahun). Share link Claude terindeks Google pada Jul 2026, berisi laporan medis pasien.
   Originality sedang (belum ada submission di arah ini). Sustainability rendah (penyedia sudah memasang noindex, dan belum ada bukti orang mau membayar).
