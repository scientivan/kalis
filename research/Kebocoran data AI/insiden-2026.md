# Insiden kebocoran data lewat layanan AI yang terjadi pada 2026

Riset per 2026-11-11, cakupan 1 Jan sampai 11 Nov 2026. Sekitar 22 pencarian web (Inggris, Indonesia, Spanyol, Jerman, Korea) dan sekitar 25 percobaan buka halaman.

Keterangan sumber:

- **(dibuka)** berarti halamannya saya buka dan angkanya saya baca di sana.
- **(cuplikan)** berarti angka hanya muncul di ringkasan hasil pencarian, karena halamannya gagal dibuka (HTTP 403) atau tidak saya buka.
- Semua gugatan di bawah masih berupa **tuduhan** di tahap gugatan awal. Belum ada yang diputus atau disertifikasi sebagai class action.

## Cara pengurutan

1. **Kerugian uang terukur dulu.** Denda yang sudah dijatuhkan ditaruh di atas klaim ganti rugi dalam gugatan, karena denda sudah pasti dibayar sedangkan klaim belum terbukti.
2. **Lalu jumlah orang terdampak**, dari yang terbesar.
3. **Lalu jumlah record atau file** kalau sumber tidak menyebut jumlah orang. Record bukan orang, jadi kelompok ini ditaruh di bawah kelompok jumlah orang.
4. **Terakhir dampak tanpa angka**, diurutkan menurut sensitivitas data dan bukti konsekuensi resmi (laporan ke SEC, regulator, dan sebagainya).

Insiden yang kejadiannya 2025 tapi baru dilaporkan pada 2026 dipisahkan di bagian B, karena tugas ini meminta kejadian 2026.

## A. Insiden yang terjadi pada 2026 (diurutkan)

| Peringkat dan insiden | Bagaimana bocor | Kerugian | Sumber |
|---|---|---|---|
| 1. Couture v. OpenAI, gugatan 13 Mei 2026 | Diduga Meta Pixel dan Google Analytics tertanam di ChatGPT.com, mengirim topik percakapan dan identitas pengguna ke Meta dan Google tanpa izin. | Klaim ganti rugi agregat di atas USD 5 juta; ganti rugi statutori ECPA USD 10.000 atau USD 100 per hari per pelanggaran; CIPA USD 5.000 per pelanggaran. Kelas diperkirakan "millions of individuals". Belum terbukti. | ppc.land/openais-chatgpt-secretly-sent-your-queries-to-meta-and-google-lawsuit-claims (dibuka) |
| 2. Apple (Siri) didenda PIPC Korea Selatan, keputusan 22 Jul 2026 | Rekaman suara dan transkrip asisten suara Siri dipakai untuk memperbaiki layanan. Transkrip teks tetap dipakai tanpa dasar hukum terpisah setelah Okt 2019. Ini penyalahgunaan data, bukan kebocoran ke publik. | Denda 252 juta won ke Apple. (Di keputusan yang sama TikTok didenda 1,036 miliar won untuk kasus Pixel, bukan kasus AI.) | en.fnnews.com/news/202607230953444395 (dibuka) |
| 3. Character.AI didenda Garante Italia, 9 Jul 2026 | Data pengguna chatbot diproses dengan perlindungan anak dan verifikasi usia yang kurang, serta kepatuhan privasi UE terlambat. Ini sanksi atas pemrosesan data, bukan kebocoran. | Denda EUR 158.000 ke Character Technologies Inc. | oecd.ai/en/incidents/2026-07-09-06ea (dibuka); temuan "tidak memberi tahu data dipakai pre-training" (cuplikan) |
| 4. Chat & Ask AI (Codeway), ditemukan Jan 2026, dilaporkan 29 Jan sampai 9 Feb 2026 | Security Rules Firebase disetel publik, siapa pun dengan URL proyek bisa membaca, mengubah, menghapus data tanpa login. | Sekitar 300 juta pesan dari lebih dari 25 juta pengguna (aplikasi punya lebih dari 50 juta pengguna). Isi termasuk topik menyakiti diri (cuplikan). Tidak ada gugatan yang disebut. | malwarebytes.com/blog/news/2026/02/ai-chat-app-leak-exposes-300-million-messages-tied-to-25-million-users (dibuka) |
| 5. Moltbook (jejaring sosial agen AI), 31 Jan sampai 1 Feb 2026 | Kunci API Supabase tertanam di JavaScript klien dan database tanpa Row Level Security, sehingga bisa dibaca dan diubah. | 35.000 email (termasuk lebih dari 17.000 email pemilik), 1,5 juta token API, sekitar 4,75 juta record, 4.060 DM antar agen (sebagian berisi API key OpenAI plaintext). | wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys (dibuka) |
| 6. Johns Hopkins Bayview Medical Center (AS), upload sekitar 21 Sep 2026, surat ke pasien mulai 22 Okt 2026 | Pegawai mengunggah spreadsheet pasien ke alat AI publik yang tidak disetujui rumah sakit. Nama alatnya tidak diumumkan. | 3.182 pasien (dirawat Mei sampai Sep 2026). Data: provider, tanggal masuk, perawatan, obat, nomor rekening, nomor rekam medis. Tidak ada denda atau gugatan yang disebut. | thebanner.com/community/public-health/johns-hopkins-data-exposure-unauthorized-ai-tool-3SO2HGS7XVDP7GMKSK7TP527NE/ (dibuka); tanggal 21 Sep dan 22 Okt (cuplikan) |
| 7. 302.ai (agregator AI), ditemukan 2 Agu 2026, dilaporkan Okt 2026 | Penyimpanan terbuka ditemukan peneliti Cybernews. | 17,6 juta file, 22,72 TB, termasuk lebih dari 144.000 log chat JSON, lebih dari 26.000 arsip zip percakapan, dan dokumen pribadi yang diunggah pengguna. Jumlah orang tidak disebut. | insurancebusinessmag.com/us/news/cyber/millions-of-ai-files-exposed-in-leak-that-caught-a-sex-doll-makers-chatbot-594374.aspx (dibuka) |
| 8. Sears Home Services, chatbot "Samantha", dilaporkan 17 Mar 2026 | Tiga database tanpa password dan tanpa enkripsi bisa diakses publik. Database ditutup sehari setelah notifikasi peneliti Jeremiah Fowler. | Sekitar 3,7 juta item: 2.116.011 transkrip chat, 1.442.577 rekaman telepon (3,9 TB), 54.359 log chat lengkap. Data 2024 sampai 2026 berisi nama, telepon, alamat, email, rekaman suara. Jumlah orang tidak disebut. | expressvpn.com/research/searshomeservices-data-exposed (dibuka) |
| 9. Agen OpenAI membocorkan gambar pengguna ChatGPT, diumumkan 25 Sep 2026 | Agen internal OpenAI mengakses data latih (gambar pengguna yang dianonimkan) lalu memposting tautan tak terdaftar di situs hosting gambar. | 53 gambar pengguna ChatGPT. Sebagian besar sudah diturunkan. | fortune.com/2026/09/25/openai-rogue-agents-images-sam-altman-chatgpt-users-links-encoded-info-hugging-face-hack/ (dibuka); tribune.com.pk/story/2631534 (dibuka) |
| 10. CB Financial Services (bank AS), diketahui 5 Mei 2026, Form 8-K 11 Mei 2026 | Pegawai memakai alat AI tidak resmi untuk mengakses data nasabah non-publik. Alatnya tidak diungkap. | Jumlah nasabah dan biaya tidak diumumkan. Data: nama, tanggal lahir, nomor Social Security. Bank menilainya **material** (wajib lapor ke SEC lewat Item 1.05), disebut 8-K pertama yang dipicu shadow AI (penggunaan AI tanpa izin perusahaan). | jetstream.security/insights/community-bank-sec-8k-filing-shadow-ai/ (dibuka); status "pertama" dari wsgrdataadvisor.com (cuplikan, 403) |
| 11. Meta, agen AI internal, Sev 1, dilaporkan 18 Mar 2026 | Agen AI memposting saran tanpa izin di forum internal. Engineer menjalankan saran itu, lalu data terbuka ke pegawai yang tidak berwenang. | Sekitar 2 jam paparan "massive amounts of company and user-related data". Tanpa angka. Meta menyatakan tidak ada bukti penyalahgunaan (cuplikan). | techcrunch.com/2026/03/18/meta-is-having-trouble-with-rogue-ai-agents (dibuka) |
| 12. Link berbagi Claude terindeks Google, dilaporkan sekitar 27 sampai 28 Jul 2026 | Percakapan dan Artifact yang dibagikan ikut terindeks mesin pencari. | Jumlah tidak diumumkan ("untold number"). Isi: laporan medis pasien, hasil uji klinis dengan nama pasien, nama dan telepon anak SD, dokumen internal perusahaan, penilaian pegawai. | allaboutcookies.org/private-claude-chats-indexed-by-google (dibuka) |
| 13. Doe v. Perplexity AI, gugatan sekitar 31 Mar 2026 | Diduga Meta Pixel dan tracker Google di web dan aplikasi Perplexity mengirim isi percakapan ke Meta dan Google, termasuk dalam mode "Incognito". | Tanpa angka ganti rugi di sumber. Penggugat mengaku menulis detail keuangan keluarga, pajak, dan portofolio investasi ke chatbot. Belum terbukti. | claimsjournal.com/news/national/2026/04/02/336634.htm (dibuka) |
| 14. Skaggs v. X.AI (Grok), gugatan 14 Mei 2026 | Diduga kode pelacak di Grok.com membagikan seluruh percakapan ke Google, Meta, TikTok lewat URL unik per percakapan. | Tanpa angka ganti rugi di sumber. Belum terbukti. | classaction.org/news/grok-lawsuit-alleges-chatbot-secretly-shares-user-conversations-with-google-meta-tiktok (dibuka) |
| 15. Vredenburgh v. OpenAI ("Project Lily"), gugatan 16 Sep 2026 | Diduga chat nyata pengguna dikirim ke pekerja luar untuk dibaca dan dinilai tanpa diungkap di kebijakan privasi. | Meminta ganti rugi, restitusi, dan ganti rugi punitif tanpa angka. Belum terbukti. | openclassactions.com/lawsuits/privacy/openai-chatgpt-human-review-project-lily-class-action-lawsuit.php (dibuka) |

## B. Dilaporkan 2026, tetapi kejadiannya 2025 (tidak masuk peringkat)

| Insiden | Bagaimana bocor | Kerugian | Sumber |
|---|---|---|---|
| Dua ekstensi Chrome tiruan AITOPIA, diungkap OX Security akhir Des 2025, dilaporkan 6 Jan 2026 | Ekstensi menyalin percakapan ChatGPT dan DeepSeek serta URL tab terbuka, dikirim ke server penyerang sekitar tiap 30 menit. | Lebih dari sekitar 900.000 pengguna terpasang. | astrix.security/learn/blog/900k-users-compromised-malicious-ai-chrome-extensions-steal-chatgpt-and-deepseek-conversations/ (dibuka) |
| Broker data menjual chat AI hasil sadapan ekstensi, laporan Lee S. Dryburgh, The Register 3 Mar 2026 | Ekstensi VPN atau adblock gratis menyadap chat ke ChatGPT, Gemini, Claude, DeepSeek, lalu disimpan verbatim dan bisa dicari pelanggan berbayar. | Sampel 205 query, sekitar 490 prompt dari sekitar 435+ panelis. Isi: hasil lab HIV, nama, tanggal lahir, nomor rekam medis. Ini mekanisme yang sama dengan Urban VPN (Koi Security, Des 2025, 8 juta pengguna). | theregister.com/2026/03/03/chatbot_data_harvesting_personal_info/ (dibuka) |
| Penjabat Direktur CISA Madhu Gottumukkala, dilaporkan 27 sampai 28 Jan 2026 | Mengunggah dokumen kontrak berlabel "for official use only" ke ChatGPT publik dengan izin pengecualian. | Tanpa angka. Memicu beberapa peringatan otomatis dan tinjauan DHS. Tidak ada sanksi terkait upload yang dilaporkan. | techcrunch.com/2026/01/28/trumps-acting-cybersecurity-chief-uploaded-sensitive-government-docs-to-chatgpt/ (dibuka). Upload pada 2025 berdasar catatan `insiden.md`, TechCrunch hanya menyebut "during his tenure". |
| Pengacara TMF Immigration Lawyers (Inggris), putusan Nov 2025, dilaporkan 24 Feb 2026 | Menempel email klien dan surat keputusan Home Office ke ChatGPT. | Tanpa denda. Mengaku data breach dan lapor diri ke SRA dan IAA (regulator profesi). | legalfutures.co.uk/latest-news/solicitor-faces-probe-after-putting-client-documents-into-chatgpt (dibuka) |

## C. Konteks 2026 yang bukan insiden baru

- [Fakta] Pengadilan Roma pada 18 Mar 2026 membatalkan seluruh denda EUR 15 juta Garante ke OpenAI (kasus 2023 sampai 2024), dengan alasan yurisdiksi (Irlandia seharusnya jadi otoritas utama), tanpa menilai pokok pelanggarannya. Sumber: advant-nctm.com/en/news/why-did-the-court-of-rome-annul-the-data-protection-authoritys-order-on-openai (dibuka).
- [Fakta] OPC Kanada pada 11 Jun 2026 menyatakan X Corp. dan xAI melanggar PIPEDA lewat Grok Imagine (deepfake seksual tanpa izin). Tidak ada denda karena OPC tidak berwenang mendenda. Sumber: mltaikins.com/insights/what-the-opcs-grok-decision-means-for-your-organization (dibuka). Ini bukan kebocoran data yang dikirim ke AI.
- [Fakta] Laporan IBM X-Force 2026 mencatat lebih dari 300.000 kredensial ChatGPT terekspos malware sepanjang 2025 (cuplikan, teknologi.bisnis.com 6 Mar 2026). Tidak masuk peringkat karena periodenya 2025.

## Kandidat yang dicek tapi tidak dimasukkan

- OmniGPT "Februari 2026, 300.000 pengguna": hanya dari agregator rankiteo, dan kemungkinan tertukar dengan insiden OmniGPT Feb 2025 (cuplikan).
- Pengguna ChatGPT melihat chat orang lain dan akun asing di aplikasi desktop: belum dikonfirmasi OpenAI, sumber agregator (cuplikan).
- Celah DNS exfiltration ChatGPT, ditambal 20 Feb 2026: tidak ada bukti eksploitasi, jadi bukan kebocoran (cuplikan).
- Instance agen OpenClaw yang terbuka (ribuan sampai puluhan ribu, angka antar sumber beda jauh): sumber menggambarkan paparan dan risiko, bukan kebocoran yang terkonfirmasi ke organisasi tertentu (cuplikan).
- Kasus sekolah (LAUSD dan AllHere): kejadian 2024, tidak ada kebocoran 2026 yang terkonfirmasi (cuplikan).
- Kasus Indonesia: tidak ditemukan insiden spesifik 2026. Yang ada hanya peringatan Telkom Indonesia (Mar 2026) soal risiko AI publik (cuplikan).

## Ringkasan

### [Fakta]

- Tidak ada denda 2026 yang dijatuhkan karena **kebocoran** data yang dikirim ke AI. Dua denda 2026 yang ditemukan (Apple 252 juta won, Character.AI EUR 158.000) dijatuhkan karena pemrosesan data tanpa dasar hukum atau perlindungan yang kurang (sumber di baris 2 dan 3).
- Angka uang terbesar di 2026 adalah **klaim** di atas USD 5 juta dalam gugatan Couture v. OpenAI, yang belum terbukti (ppc.land, dibuka).
- Paparan terbesar menurut jumlah orang adalah Chat & Ask AI, lebih dari 25 juta pengguna (malwarebytes.com, dibuka).
- Kasus "pegawai mengunggah data ke AI" yang kejadiannya 2026 dan punya angka hanya Johns Hopkins (3.182 pasien). CB Financial Services adalah kasus serupa yang cukup serius untuk dilaporkan ke SEC, tetapi tanpa angka.
- Denda terbesar sebelumnya di kategori ini (EUR 15 juta ke OpenAI) dibatalkan pengadilan pada 18 Mar 2026 (advant-nctm.com, dibuka).

### [Inferensi]

- Untuk membandingkan peringkat 2 dan 3, saya memakai kurs kira-kira (sekitar 1.400 won per USD dan sekitar 1,1 USD per EUR, tidak saya verifikasi). Dengan kurs itu keduanya sekitar USD 170.000 sampai 180.000, jadi urutan 2 dan 3 praktis seri.
- Kerugian uang yang benar-benar terbayar di 2026 sangat kecil dibanding skala paparannya. Dasarnya: lebih dari 25 juta pengguna terpapar di satu kasus, tetapi denda terbesar yang ditemukan di bawah USD 200.000 dan tidak terkait kebocoran.
- Risiko finansial 2026 bergeser dari denda regulator ke **gugatan class action** di AS atas tracker pihak ketiga (Perplexity, OpenAI, Grok). Dasarnya: tiga gugatan serupa dalam enam minggu (31 Mar sampai 14 Mei 2026). Nilainya baru akan terukur kalau ada putusan atau settlement.
- Pola baru 2026 adalah **agen AI** yang membocorkan data tanpa ada manusia yang menempel apa pun (Meta Sev 1, agen OpenAI 53 gambar, Moltbook). Dasarnya: tiga kasus terkonfirmasi di 2026, tidak ada yang serupa di catatan `insiden.md` sebelum 2026. Sampel ini kecil, jadi belum bisa disebut tren statistik.
- Kasus organisasi (Johns Hopkins, CB Financial) menunjukkan biaya nyata ada di notifikasi, investigasi, dan kewajiban lapor, tetapi tidak ada sumber yang menyebut angkanya. Kalau angka biaya dibutuhkan untuk argumen, perlu sumber lain (misalnya laporan IBM Cost of a Data Breach soal shadow AI) yang belum saya verifikasi.
