# Kepatuhan penyedia model AI terhadap hukum perlindungan data

Tanggal riset: 2026-11-11. Pertanyaan: apakah OpenAI, Anthropic, Google, Microsoft, Meta, xAI, dan DeepSeek sudah patuh pada GDPR, UU PDP, CCPA, HIPAA, dan sejenisnya? Kalau data tetap bocor, penyebabnya penyedia belum patuh, penyedia kebobolan, atau pengguna/organisasi yang menempel data?

Status sumber: sebagian besar dibaca lewat cuplikan hasil pencarian (ditandai "cuplikan"). Yang dibuka langsung ditandai "dibuka". Beberapa halaman resmi (openai.com, axios.com, wsgr.com) menolak akses otomatis (HTTP 403), jadi isinya hanya dari cuplikan atau liputan sekunder.

## Jawaban singkat

[Inferensi] Ketiga penyebab nyata, tetapi bobotnya berbeda.

- Penyedia **belum sepenuhnya patuh** di level dasar hukum pelatihan, transparansi, dan akurasi. Regulator Eropa sudah menyatakan ini secara awal, tetapi hampir tidak ada denda besar yang bertahan di pengadilan per November 2026.
- Penyedia **kebobolan** beberapa kali (bug, vendor analitik, database terbuka). Yang bocor kebanyakan metadata akun, kecuali kasus DeepSeek (riwayat chat).
- Volume terbesar kebocoran sehari-hari kemungkinan berasal dari **pengguna dan organisasi** yang menempel data pihak lain ke paket konsumen, karena paket itu tidak punya DPA (kontrak pemrosesan data) dan default-nya boleh dipakai untuk pelatihan.

## 1. Tindakan regulator terhadap penyedia AI

### [Fakta]

| Penyedia | Regulator, tanggal | Tindakan | Status per Nov 2026 |
|---|---|---|---|
| OpenAI | Garante Italia, 20 Des 2024 | Denda EUR 15 juta (dasar hukum pelatihan, transparansi, breach Maret 2023 tidak dilaporkan) | Dibatalkan Tribunale di Roma 18 Mar 2026 |
| DeepSeek | Garante Italia, Jan 2025 | Blokir pemrosesan data pengguna Italia | Belum ada sumber resmi soal pencabutan |
| DeepSeek | PIPC Korea, Feb dan Apr 2025 | Unduhan baru dihentikan; temuan transfer data ke Volcano Engine tanpa persetujuan | Rekomendasi korektif |
| Luka (Replika) | Garante Italia, 10 Apr 2025 | Denda EUR 5 juta (tanpa dasar hukum, tanpa verifikasi umur) | Sedang dilawan pihak Luka |
| Character.AI | Garante Italia, Jul 2026 | Denda EUR 158.000 (info privasi, DPIA terlambat, perlindungan anak) | Diumumkan |
| X/xAI (Grok) | DPC Irlandia, Apr 2025 | Inquiry atas pelatihan Grok dengan post publik pengguna EU | Belum ada putusan |
| Meta | OLG Koln, 23 Mei 2025 | Gugatan darurat konsumen ditolak; pelatihan AI dengan dasar kepentingan sah diizinkan | Putusan sementara |
| OpenAI, Anthropic | FTC AS, 14 Okt 2026 | Civil investigative demand (permintaan dokumen) soal insiden keamanan dan kebijakan privasi | Penyelidikan, bukan temuan pelanggaran |

Sumber dan cuplikan:

- Denda OpenAI EUR 15 juta, termasuk karena tidak melapor breach 20 Maret 2023 sesuai Pasal 33 GDPR (cuplikan): https://www.lewissilkin.com/insights/2025/01/14/openai-faces-15-million-fine-as-the-italian-garante-strikes-again-102jtqc dan https://www.euronews.com/2024/12/20/italys-privacy-watchdog-fines-openai-15-million-after-probe-into-chatgpt-data-collection
- Pembatalan: Tribunale di Roma, sentenza n. 4785 tanggal 18 Maret 2026, menerima keberatan pertama OpenAI soal kewenangan. Sejak 15 Februari 2024 OpenAI punya kantor tunggal di Irlandia, jadi mekanisme one-stop-shop (satu regulator utama, yaitu DPC Irlandia) berlaku. Alasan lain tidak diperiksa (cuplikan): https://ntplusdiritto.ilsole24ore.com/art/chatgpt-tribunale-roma-annulla-sanzione-15-milioni-garante-decide-l-autorita-capofila-AI88UIRD dan https://www.wsgr.com/en/insights/openai-prevails-in-landmark-italian-ai-and-gdpr-enforcement-case.html
- DeepSeek Korea: PIPC menyatakan DeepSeek mengirim data ke Volcano Engine (terkait ByteDance) tanpa persetujuan dan merekomendasikan penghapusan isi prompt yang sudah ditransfer (cuplikan): https://www.koreatimes.co.kr/amp/southkorea/globalcommunity/20250424/deepseek-transferred-korean-users-data-abroad-without-permission-govt
- DeepSeek Italia (cuplikan): https://garanteprivacy.it/garante/doc.jsp?ID=10098369
- Replika EUR 5 juta (cuplikan): https://garanteprivacy.it/home/docweb/-/docweb-display/docweb/10132048
- Character.AI EUR 158.000 dan klaim "per September 2026 DPC Irlandia belum mengeluarkan putusan atau denda di inquiry apa pun soal model AI" (cuplikan, sumber sekunder): https://www.enzuzo.com/blog/ai-privacy-violations
- Grok inquiry DPC (cuplikan): https://www.williamfry.com/knowledge/dpc-launches-investigation-into-xs-data-usage-for-ai-training/
- OLG Koln, Az. 15 UKl 2/25, menerima Pasal 6(1)(f) GDPR sebagai dasar pelatihan AI Meta (cuplikan): https://www.verbraucherzentrale.nrw/urteile/olg-koeln-weist-eilantrag-der-verbraucherzentrale-nrw-gegen-meta-wegen-kitraining-zurueck-108065
- FTC Oktober 2026 (cuplikan, laman asli 403): https://axios.com/2026/10/15/ftc-openai-anthropic-ai-safety-investigation

### Pandangan regulator EU (EDPB)

[Fakta] Laporan ChatGPT Taskforce EDPB, 23 Mei 2024 (dibuka, PDF): https://edpb.europa.eu/system/files/2024-05/edpb_20240523_report_chatgpt_taskforce_en.pdf

- Para 7: "technical impossibility cannot be invoked to justify non-compliance".
- Para 17: penilaian dasar hukum "is still subject to pending investigations".
- Para 24: tanggung jawab GDPR "should not be transferred to data subjects, for example by placing a clause in the Terms and Conditions that data subjects are responsible for their chat inputs".
- Para 25: kalau input pribadi masuk ke model lalu dibagikan, "OpenAI remains responsible for complying with the GDPR and should not argue that the input of certain personal data was prohibited in first place."
- Para 30: model "may also produce biased or made up outputs", dan prinsip akurasi tetap wajib dipenuhi.

[Fakta] EDPB Opinion 28/2024 (17 Des 2024): model yang dilatih dengan data pribadi tidak otomatis anonim; kepentingan sah bisa dipakai lewat uji tiga langkah; pemakaian model hasil pelatihan yang melanggar tidak otomatis ilegal (cuplikan): https://edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf

### [Inferensi]

- Pola penegakan: regulator berkali-kali menyatakan masalah (dasar hukum, akurasi, anak), tetapi denda terbesar terhadap penyedia frontier justru gugur karena soal yurisdiksi, bukan karena OpenAI dinyatakan patuh. Jadi "belum dihukum" tidak sama dengan "sudah patuh".
- One-stop-shop memusatkan pengawasan OpenAI, Google, Meta, Microsoft, dan X di DPC Irlandia. Per sumber sekunder, DPC belum memutus satu pun kasus model AI. Ini titik lemah penegakan, bukan bukti kepatuhan.
- Penyedia di luar EU tanpa kantor EU (DeepSeek) paling mudah diblokir, tetapi paling sulit didenda.

## 2. Pembagian tanggung jawab: siapa controller, siapa processor

### [Fakta]

- GDPR Pasal 2(2)(c) mengecualikan pemrosesan oleh orang perorangan untuk kegiatan "purely personal or household" (teks resmi): https://eur-lex.europa.eu/eli/reg/2016/679/oj
- UU PDP Pasal 2 ayat (2): "Undang-Undang ini tidak berlaku untuk pemrosesan Data Pribadi oleh orang perseorangan dalam kegiatan pribadi atau rumah tangga" (dibuka): https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-2
- Paket konsumen OpenAI di EEA: OpenAI Ireland Limited adalah controller sejak 15 Februari 2024 (cuplikan): https://techcrunch.com/2024/01/02/openai-dublin-data-controller/
- Paket bisnis OpenAI: DPA Februari 2024 menyebut OpenAI memproses Customer Data sebagai processor atas instruksi pelanggan (cuplikan): https://openai.com/policies/feb-2024-data-processing-addendum/
- OpenAI menyatakan data ChatGPT Enterprise, Business, Edu, dan API tidak dipakai melatih model secara default, dan organisasi yang memenuhi syarat bisa memilih zero data retention (ZDR, data tidak disimpan) di API (cuplikan): https://openai.com/business-data/
- ZDR hanya untuk endpoint tertentu dan perlu persetujuan; Assistants, vector store, file, dan fine-tuning tetap menyimpan data sampai dihapus (cuplikan, sumber konsultan): https://redresscompliance.com/openai-data-privacy-enterprise-agreement-clauses
- Anthropic: pembaruan ketentuan konsumen tidak berlaku untuk layanan di bawah Commercial Terms (Claude for Work, Claude Gov, Claude for Education, API, Bedrock, Vertex AI) (dibuka): https://www.anthropic.com/news/updates-to-our-consumer-terms
- HIPAA: OpenAI menyediakan BAA (perjanjian business associate, syarat wajib HIPAA) hanya untuk produk tertentu (ChatGPT for Healthcare, Enterprise dengan Regulated Workspace, API). Paket konsumen tidak memenuhi syarat (cuplikan): https://help.openai.com/en/articles/20001069

### [Inferensi]

Tiga skenario saat seseorang menempel data orang lain ke chatbot:

| Skenario | Controller atas data pihak ketiga | Kontrak yang melindungi | Penilaian |
|---|---|---|---|
| Pribadi, urusan rumah tangga, paket konsumen | Pengguna dikecualikan; penyedia controller atas yang ia simpan | Tidak ada DPA | Celah hukum paling lebar |
| Karyawan pakai akun konsumen untuk kerja | Organisasi (pemberi kerja) | Tidak ada DPA, default boleh dilatih | Organisasi kemungkinan melanggar |
| Organisasi pakai paket bisnis/API dengan DPA | Organisasi; penyedia jadi processor | DPA, opsi ZDR, BAA kalau perlu | Paling patuh, risiko tersisa di vendor |

- Pengecualian rumah tangga tidak berlaku begitu pemakaian bersifat pekerjaan. Contoh: karyawan Samsung menempel kode sumber dan notulen rapat ke ChatGPT pada Maret 2023, lalu Samsung melarang AI generatif di perangkat kerja (cuplikan): https://techcrunch.com/2023/05/03/ai-is-just-someone-elses-computer
- EDPB para 24–25 berarti penyedia tidak bisa sepenuhnya lepas tangan hanya dengan klausul "pengguna bertanggung jawab atas input". Tanggung jawab dibagi, bukan dipindahkan.
- Pembagian "controller/processor" untuk paket bisnis di atas berasal dari DPA 2024 dan panduan sekunder. Teks DPA terbaru tidak berhasil dibuka (403), jadi belum terverifikasi untuk versi 2026.

## 3. UU PDP Indonesia (UU 27/2022) dan status penegakan 2026

### [Fakta]

- Pasal 2 ayat (1): berlaku juga untuk pihak di luar Indonesia yang perbuatannya berakibat hukum di Indonesia atau bagi WNI di luar negeri (dibuka): https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-2
- Pasal 46 ayat (1): saat terjadi kegagalan pelindungan data, pengendali wajib memberi tahu tertulis "paling lambat 3 x 24 (tiga kali dua puluh empat) jam" kepada subjek data dan lembaga (dibuka): https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-46
- Pasal 57 ayat (3): denda administratif "paling tinggi 2 (dua) persen dari pendapatan tahunan atau penerimaan tahunan terhadap variabel pelanggaran". Ayat (4): sanksi "diberikan oleh lembaga" (dibuka): https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-57
- PP 33/2026 (peraturan pelaksana UU PDP) ditandatangani 16 Juli 2026, 225 pasal, berlaku 16 Januari 2027 menurut beberapa sumber (cuplikan): https://siplawfirm.id/resources/pp-33-2026-pelindungan-data-pribadi dan https://katadata.co.id/amp/finansial/makro/6a9979b7c5745/pp-pelindungan-data-pribadi-berlaku-januari-2027-ini-aturan-baru-data-anak
- Lembaga pengawas PDP belum terbentuk. Per 5 November 2026, Komdigi menyatakan rancangan Perpres "Sudah diajukan kepada Presiden melalui Kementerian Sekretariat Negara", dan fungsi PDP sementara dijalankan Komdigi (dibuka): https://katadata.co.id/digital/teknologi/6aec368e80c97/komdigi-perpres-lembaga-pengawas-pdp-masuk-tahap-final
- Pengamat menilai aturan PDP belum efektif tanpa lembaga (cuplikan): https://teknologi.bisnis.com/read/20260908/84/2002386/uu-dan-pp-sudah-ada-pengamat-aturan-pdp-belum-efektif-tanpa-lembaga

### [Inferensi]

- Secara hukum, UU PDP sudah menjangkau penyedia AI asing yang melayani WNI (Pasal 2 ayat 1). Secara praktik, denda 2% belum bisa dijatuhkan karena Pasal 57 ayat (4) mensyaratkan "lembaga" yang belum ada, dan PP 33/2026 baru berlaku Januari 2027.
- Belum ditemukan satu pun tindakan otoritas Indonesia terhadap OpenAI, Google, Meta, atau DeepSeek terkait UU PDP. Ini hasil pencarian yang tidak menemukan, bukan bukti bahwa tidak ada.
- Untuk organisasi Indonesia yang menempel data pelanggan ke ChatGPT konsumen, risiko hukumnya nyata di atas kertas (mereka pengendali), tetapi risiko penegakannya rendah sampai lembaga berjalan. Pengamat memperkirakan efektif penuh sekitar 2028 (cuplikan Bisnis.com di atas).

## 4. Pelatihan data dan retensi di paket konsumen

### [Fakta]

- Anthropic (berlaku sejak 28 Agustus 2025): pengguna konsumen memilih apakah chat dipakai untuk pelatihan. Kalau diizinkan, retensi "five years"; kalau tidak, tetap 30 hari. Batas pilihan bagi pengguna lama 8 Oktober 2025 (dibuka): https://www.anthropic.com/news/updates-to-our-consumer-terms
- Liputan menyebut toggle pelatihan Anthropic diset "On" secara default di pop-up (cuplikan): https://www.techcrunch.com/2025/08/28/anthropic-users-face-a-new-choice-opt-out-or-share-your-data-for-ai-training/
- OpenAI konsumen: EDPB mencatat OpenAI memakai prompt sebagai "Content" untuk melatih model dengan dasar Pasal 6(1)(f), dengan opsi opt out (dibuka, para 21 laporan EDPB di atas).
- Google Gemini: chat yang sudah dibaca peninjau manusia "are not deleted when you delete your activity" dan disimpan sampai tiga tahun; saat Keep Activity mati, Google tetap memakai chat untuk merespons dan melindungi pengguna, termasuk dengan peninjau manusia (cuplikan): https://support.google.com/gemini/answer/13594961
- Perintah pengadilan NYT v. OpenAI: perintah Mei 2025 memaksa OpenAI menyimpan semua log output yang mestinya dihapus. Kewajiban itu berakhir 26 September 2025 lewat perintah Hakim Ona Wang 9 Oktober 2025. Log yang sudah tersimpan tetap ada, dan akun yang ditandai NYT tetap disimpan (cuplikan): https://engadget.com/ai/openai-no-longer-has-to-preserve-all-of-its-chatgpt-data-with-some-exceptions-192422093.html dan https://openai.com/index/response-to-nyt-data-demands/
- Perintah 7 November 2025 memerintahkan OpenAI menyerahkan 20 juta log ChatGPT ke penggugat (cuplikan, status lanjutan tidak dicek): https://the-decoder.com/openai-pushes-back-as-the-new-york-times-demands-access-to-120-million-chatgpt-chat-logs/
- Meta memakai opt out (bukan opt in) untuk pelatihan AI dengan data pengguna EU mulai 27 Mei 2025 (cuplikan): https://thehackernews.com/2025/05/meta-to-train-ai-on-eu-user-data-from.html

### [Inferensi]

- "Hapus chat" di paket konsumen tidak menjamin hilang. Ada tiga pengecualian yang berulang lintas penyedia: tinjauan manusia (Google, 3 tahun), perintah pengadilan (OpenAI, 2025), dan retensi keamanan/penyalahgunaan.
- Opt out sebagai default (Meta, Anthropic konsumen) sah menurut OLG Koln untuk data publik Meta, tetapi tetap jadi sengketa utama di EU. Ini zona abu-abu hukum, bukan pelanggaran yang sudah diputus.

## 5. Kebobolan di sisi penyedia

### [Fakta]

| Insiden | Tanggal | Yang terekspos | Penyebab |
|---|---|---|---|
| OpenAI, bug redis-py | 20 Mar 2023 | Judul chat pengguna lain; data bayar 1,2% pelanggan Plus dalam 9 jam (4 digit akhir kartu, bukan nomor penuh) | Bug library pihak ketiga |
| DeepSeek, database ClickHouse | Jan 2025 | Lebih dari 1 juta log, riwayat chat teks biasa, API key | Database terbuka tanpa autentikasi |
| xAI Grok, link share | Agu 2025 | Lebih dari 370.000 chat terindeks Google | Fitur share tanpa noindex |
| OpenAI lewat Mixpanel | 9 Nov 2025 | Data analitik dan profil terbatas (nama, email, lokasi kasar) pengguna API dan sebagian ChatGPT | Vendor analitik dibobol |

Sumber dan cuplikan:

- Redis (cuplikan): https://thehackernews.com/2023/03/openai-reveals-redis-bug-behind-chatgpt.html
- DeepSeek: database itu "accessible without any authentication at all" (dibuka): https://www.wiz.io/blog/wiz-research-uncovers-exposed-deepseek-database-leak
- Grok (cuplikan): https://www.forbes.com.au/news/innovation/xai-published-hundreds-of-thousands-of-grok-chatbot-conversations/
- Mixpanel: OpenAI menghentikan Mixpanel; kredensial dan token tidak terdampak; klarifikasi 19 Desember 2025 bahwa sebagian pengguna ChatGPT juga terdampak (cuplikan, laman asli 403): https://openai.com/index/mixpanel-incident/ dan https://www.theregister.com/2025/11/27/openai_mixpanel_api/

### [Inferensi]

- Kebobolan di penyedia besar sejauh ini lebih sering mengenai metadata akun daripada isi percakapan. Pengecualian terbesar adalah DeepSeek, yang lebih tepat disebut kelalaian dasar (database tanpa kata sandi) daripada serangan canggih.
- Kasus Grok dan fitur share ChatGPT (Juli 2025) ada di tengah: penyedia merancang fitur yang membuat pengguna tanpa sadar mempublikasikan chat. Ini kesalahan desain penyedia yang dipicu tindakan pengguna.
- Breach redis 2023 ikut menjadi alasan denda Garante (tidak lapor 72 jam). Artinya kebobolan bisa berubah jadi ketidakpatuhan kalau prosedur notifikasi gagal.

## 6. Kesimpulan: memisahkan tiga penyebab

### A. Penyedia belum patuh

[Fakta] Garante menemukan OpenAI melatih tanpa dasar hukum yang memadai dan melanggar transparansi (Des 2024). EDPB menyatakan disclaimer tidak cukup untuk prinsip akurasi (Mei 2024). PIPC menemukan DeepSeek mentransfer data ke luar negeri tanpa persetujuan (Apr 2025).

[Inferensi] Masalah struktural ini (data latih hasil scraping, halusinasi soal orang nyata, opt out sebagai default) belum diselesaikan oleh penyedia mana pun. Penegakan tertunda karena one-stop-shop dan banding, bukan karena masalahnya hilang. Penyedia Barat cenderung "patuh secara prosedural" (kantor EU, DPA, opt out). Penyedia seperti DeepSeek tidak patuh bahkan secara prosedural.

### B. Penyedia patuh secara kontrak, tetapi kebobolan

[Fakta] Insiden redis (2023), Mixpanel (2025), dan DeepSeek (2025) terjadi di sisi penyedia atau vendornya.

[Inferensi] Kategori ini paling jarang membocorkan isi chat dari penyedia besar. Paket bisnis dengan ZDR mengurangi dampaknya karena isi prompt tidak disimpan, tetapi tidak menghapus risiko metadata dan vendor.

### C. Kewajiban sebenarnya ada di pengguna atau organisasi

[Fakta] Pengecualian rumah tangga (GDPR Pasal 2(2)(c), UU PDP Pasal 2 ayat (2)) hanya melindungi pemakaian pribadi. Paket konsumen tidak memiliki DPA atau BAA. Kasus Samsung 2023 menunjukkan kebocoran oleh karyawan.

[Inferensi] Untuk kebocoran data pihak ketiga (pasien, pelanggan, karyawan), penyebab paling sering kemungkinan besar adalah organisasi yang membiarkan karyawannya memakai akun konsumen. Di sini penyedia secara teknis "patuh" karena kontraknya memang tidak menjanjikan perlindungan bisnis, dan pelanggarannya ada di organisasi sebagai pengendali. Namun EDPB para 24–25 mencegah penyedia memakai alasan ini untuk lepas tangan sepenuhnya.

## Yang belum diverifikasi

- Teks DPA OpenAI versi 2026 dan syarat ZDR terkini (laman 403).
- Apakah Garante mengajukan banding atas putusan Tribunale di Roma.
- Status blokir DeepSeek di Italia per 2026.
- Hasil inquiry DPC atas Grok dan isi penuh CID FTC Oktober 2026.
- Angka "72 jam" retensi Gemini saat Keep Activity mati (hanya dari sumber pihak ketiga, tidak dimasukkan).
- Microsoft (Copilot) tidak dicari secara khusus di riset ini.
