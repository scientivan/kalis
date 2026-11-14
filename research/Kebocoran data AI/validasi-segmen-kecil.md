# Validasi hipotesis segmen kecil (UMKM, sekolah, klinik kecil, freelancer)

Tanggal riset 2026-11-11. Sekitar 30 pencarian dan pembukaan sumber. Semua angka di bawah adalah cuplikan dari sumber yang disebut. Banyak sumber berupa liputan sekunder atau blog vendor, jadi status kekuatannya ditulis per baris.

Hipotesis yang diuji: "UMKM, sekolah, klinik kecil, dan freelancer sering menempel data pribadi orang lain ke AI seperti ChatGPT, tidak punya tim keamanan, dan tidak terlayani oleh solusi DLP/AI security yang ada karena solusi itu dibuat dan dihargai untuk perusahaan besar."

## Ringkasan putusan

- **Bagian 1 (mereka menempel data)**: terbukti sebagian. Bukti kuat untuk pendiri usaha kecil dan tenaga kesehatan. Untuk guru dan freelancer tidak ditemukan angka langsung.
- **Bagian 2 (tidak punya tim keamanan)**: terbukti kuat.
- **Bagian 3 (tidak terlayani)**: terbukti untuk alat DLP/AI security khusus. Melemah karena ada jalur murah lain (paket AI bisnis Rp ~300 ribu per orang per bulan, Chrome Enterprise Premium, AI khusus HIPAA seperti BastionGPT).
- **Celah yang paling nyata ada di klinik kecil**, bukan di UMKM umum.

## 1. Pemakaian AI dan kebiasaan menempel data

### [Fakta]

- Survei Startups.co.uk dengan Sage, lebih dari 400 pendiri, pemilik, dan eksekutif startup UK: 50% mengaku membagikan informasi sensitif perusahaan ke chatbot publik (ChatGPT, Gemini) dalam 30 hari terakhir, dan lebih dari seperempatnya melakukannya tiap minggu. 90% pengguna AI khawatir data mereka melatih model orang lain. Sumber: https://startups.co.uk/?p=167396 (diperbarui 28 Jul 2026, tanggal survei tidak disebut).
- LayerX Enterprise AI and SaaS Data Security Report 2025: 77% karyawan menempel data ke prompt GenAI, 22% pernah menempel data PII/PCI (data pribadi atau data kartu pembayaran). Sumber: https://www.esecurityplanet.com/news/shadow-ai-chatgpt-dlp/ . Ini data **perusahaan besar** (pelanggan LayerX), bukan segmen kecil.
- Black Book Market Research (Des 2025, 228 karyawan sistem kesehatan AS): 58% memakai AI umum (ChatGPT, Gemini, Copilot) untuk kerja minimal sebulan sekali. 17% pengguna shadow AI (AI yang tidak disetujui kantor) mengaku "kadang atau sering" memasukkan data pasien yang bisa diidentifikasi, dan 27% lagi bilang "jarang, tapi bisa terselip". Sumber: https://www.beckershospitalreview.com/healthcare-information-technology/ai/shadow-ai-goes-mainstream-in-healthcare-5-notes/ (sekunder, sampel kecil, rumah sakit bukan klinik kecil).
- Wolters Kluwer Health (Des 2025, 518 tenaga kesehatan dan administrator): 40% pernah melihat alat AI tidak resmi di tempat kerja, 17% memakainya sendiri. Sekitar setengah beralasan alur kerja lebih cepat, sepertiga karena tidak ada alat resmi. Sumber: https://healthjournalism.org/blog/2026/02/shadow-ai-on-the-rise-in-health-care-as-patients-report-less-trust-surveys-say/
- RAND (data tahun ajaran 2024–2025, >16.000 responden): 53% guru ELA, matematika, dan sains memakai AI untuk perencanaan atau mengajar pada musim semi 2025, naik lebih dari 25 poin dari tahun sebelumnya. Kurang dari setengah kepala sekolah bilang sekolahnya punya kebijakan AI. Sumber: https://www.route-fifty.com/artificial-intelligence/2025/10/state-leaders-can-shape-responsible-ai-use-schools-report-finds/408693/
- EdWeek Research Center: 58% pendidik belum pernah dilatih soal AI (musim gugur 2024), turun ke 50% (musim gugur 2025) dan 42% (Feb–Mar 2026). Survei Okt 2025: hanya 13% bilang distriknya punya kebijakan AI yang jelas bagi guru dan siswa. Sumber: https://chalkbeat.org/2024/12/13/ai-tools-used-by-teachers-can-put-student-privacy-and-data-at-risk dan https://www.edweek.org/technology/rising-use-of-ai-in-schools-comes-with-big-downsides-for-students/2025/10
- Chalkbeat tidak menemukan kasus terkonfirmasi guru menempel data siswa ke AI. Distrik Moore Public Schools menyuruh kepala sekolah yang memakai AI untuk laporan perilaku agar "You must omit any personally identifiable information." Sumber: Chalkbeat di atas.
- Census Bureau AS (Des 2025–Mei 2026): kurang dari 20% firma dengan 4 karyawan atau kurang memakai AI dalam operasi bisnis, tanpa perubahan signifikan; firma 250+ karyawan 37%. Sumber: https://census.gov/library/stories/2026/05/ai-use-businesses.html
- Indonesia: survei ICCI.id (30 Mei–15 Jun 2025) menyebut sekitar 67,65% responden UMKM sudah memakai AI, terutama konten promosi. Survei Lalamove (2026, >300 UMKM) menyebut 36,8%, dengan hanya 23,5% memakai AI untuk layanan pelanggan. Sumber: https://ukmindonesia.id/baca-deskripsi-posts/laporan-survey-penggunaan-artificial-intelligence-ai-oleh-umkm-pemanfaatan-ai-belum-dioptimalkan-untuk-dongkrak-produktivitas-usaha dan https://www.inews.id/playlists/makin-melek-teknologi-368-persen-umkm-indonesia-mulai-manfaatkan-ai
- Freelancer: tidak ditemukan survei yang mengukur freelancer menempel data klien. Paper arXiv 2603.07459 membahas pengungkapan pemakaian AI antara freelancer dan klien, bukan kebocoran. Angka "67% karyawan memakai ChatGPT pada data klien" yang beredar berasal dari postingan promosi vendor dan tidak terverifikasi.

### [Inferensi]

- Perilaku menempel data paling terbukti pada **pemilik usaha kecil** dan **tenaga kesehatan**. Dasarnya dua survei di atas yang langsung menanyakan perilaku itu.
- Untuk guru dan freelancer, hipotesis masih berupa dugaan. Yang terbukti hanya pemakaian AI tinggi dan pelatihan rendah, bukan perilaku menempel data siswa atau klien.
- Pemakaian AI di firma sangat kecil (Census <20%) lebih rendah dari kesan "semua orang pakai". Ini berarti pasar segmen mikro yang aktif memakai AI untuk data pelanggan lebih sempit dari yang dibayangkan.
- Di UMKM Indonesia, AI dipakai terutama untuk konten promosi, yang jarang memuat data pribadi pelanggan. Risiko kebocoran di sini lebih rendah dari segmen klinik.

## 2. Staf dan anggaran keamanan TI

### [Fakta]

- Guardz (Des 2025, 800 pemilik SMB AS dengan >10 karyawan): 52% bergantung pada pemilik usaha atau karyawan tanpa pelatihan untuk keamanan siber. Sepertiga pemilik merespons alert sendiri. 16% berinvestasi "less than $50 per user annually". 31% tidak tahu total belanja keamanannya. 27% tidak punya asuransi siber. Sumber: https://www.channelinsider.com/security/guardz-smb-security-research/
- DigitalOcean (Jul 2025): 38% SMB tidak punya satu pun karyawan yang khusus menangani keamanan, 42% punya satu orang. Techaisle: hanya 3% usaha kecil punya staf keamanan TI internal penuh waktu (sampel 5.505 SMB). Sumber: ringkasan pencarian, tautan https://techaisle.com/blog/tags/387-cybersecurity?start=28 (belum dibuka langsung).
- Uswitch (UKM UK 2025): 31% menyebut kurangnya staf khusus sebagai hambatan, 20% anggaran terbatas. Sumber: https://ifamagazine.com/training-barriers-leave-smes-exposed-as-cyber-attacks-hit-one-in-five-uk-businesses/ (via pencarian).

### [Inferensi]

- Bagian "tidak punya tim keamanan" adalah bagian hipotesis yang paling kuat. Tiga survei independen menunjukkan pola yang sama.
- Konsekuensinya untuk produk: pembeli adalah pemilik usaha, bukan CISO. Produk harus bisa dipasang tanpa admin TI (misalnya tanpa Intune, tanpa konsol kebijakan).

## 3. Harga dan syarat solusi yang ada

### [Fakta]

| Solusi | Harga | Syarat minimum | Sumber |
|---|---|---|---|
| LayerX (AWS Marketplace) | US$8,50/user/bulan | Minimum 50 user | aws.amazon.com/marketplace/pp/prodview-mlnz4sz37fx7c |
| Harmonic Explore (AWS) | US$163/user/tahun | Minimum 200 user, kontrak 12–36 bulan | aws.amazon.com/marketplace/pp/prodview-rdb3b4ogktlu2 |
| Nightfall | Harga tidak dipublikasi | Kuota lewat sales, per user per tahun | nightfall.ai/pricing |
| Chrome Enterprise Premium | US$6/user/bulan | Lewat "Talk with an expert" | chromeenterprise.google/pricing |
| ChatGPT Business | US$20/user/bulan tahunan, US$25 bulanan | Minimal 2 kursi, tidak melatih data workspace | help.openai.com (via pencarian, halaman 403) |
| Claude Team | US$20/user/bulan tahunan, US$25 bulanan | Minimal 2 kursi sejak Jul 2026 (sebelumnya 5) | blog pihak ketiga, belum dicek di claude.com |

- Microsoft Purview DLP untuk AI di Edge: perlindungan teks ke aplikasi AI tak dikelola (ChatGPT consumer, Gemini, DeepSeek, dll.) hanya berlaku di perangkat Windows 10/11 yang **dikelola Intune**, dan sejak 31 Okt 2025 ditagih pay-as-you-go lewat meter In Transit Protection. Skenario aplikasi terkelola masuk lisensi Microsoft 365 E5 atau setara. Admin butuh peran Intune, Edge, dan Directory Reader. Sumber: https://learn.microsoft.com/purview/dlp-browser-dlp-learn dan https://www.itelio.com/en/microsoft-message-center/MC1154787
- Harmonic punya tiga paket (Explore, Guide, Command) tanpa harga publik, harus "Book a demo". Sumber: https://www.harmonic.security/pricing
- Netskope dan Cyberhaven: tidak ditemukan harga atau minimum publik dalam pencarian ini.
- ChatGPT Business **tidak** bisa ditandatangani BAA (Business Associate Agreement, kontrak wajib HIPAA agar vendor boleh memproses data pasien AS). BAA tersedia lewat ChatGPT for Healthcare (diluncurkan 8 Jan 2026, ditujukan ke institusi) atau API. Sumber: https://www.knack.com/blog/is-chatgpt-hipaa-compliant/ dan https://aptible.com/hipaa-compliant-ai-tools/openai-baa (sekunder, halaman OpenAI 403).
- Claude: "Team plans and individual plans (Free, Pro, Max, and Ultra) can't enable HIPAA." HIPAA hanya untuk paket Enterprise (self-serve dan sales-assisted). Sumber: https://support.claude.com/en/articles/13296973
- Google Workspace Business Starter US$7/user/bulan (tahunan) dan sudah menyertakan Gemini terbatas. Status "tidak melatih data" tidak terverifikasi di pencarian ini.

### [Inferensi]

- Untuk organisasi 1–50 orang, **alat DLP AI khusus memang tidak terjangkau secara struktur**. LayerX butuh 50 user (sekitar US$5.100/tahun minimum), Harmonic 200 user (sekitar US$32.600/tahun minimum), Purview butuh Intune, E5, dan admin. Ini membuktikan bagian 3 hipotesis untuk kategori DLP.
- Tapi "tidak terlayani" hanya benar kalau masalahnya adalah **karyawan memakai akun pribadi**. Kalau masalahnya hanya "data melatih model", ChatGPT Business atau Claude Team US$20/orang sudah menyelesaikan itu, dengan minimum 2 kursi.
- Paket AI bisnis tidak menyelesaikan masalah kepatuhan klinik AS (tanpa BAA) dan tidak mencegah data tetap terkirim ke vendor. Di sinilah celah klinik muncul.

## 4. Produk yang sudah menyasar segmen kecil

### [Fakta]

- Caviard (ekstensi Chrome redaksi PII untuk ChatGPT dan DeepSeek, lokal di browser): listing agregator menyebut sekitar 272–301 pengguna Chrome Web Store, rating 5,0 dari 1 ulasan. Situsnya mengklaim 50K+ pengguna (tidak terverifikasi). TrustMRR (terverifikasi Stripe): pendapatan sepanjang masa **US$74**, "No active subscriptions". Harga: tier gratis dan lisensi seumur hidup US$9. Sumber: https://trustmrr.com/startup/caviard-ai?metric=mrr dan https://extpose.com/ext/411115
- AmbientMeta Privacy Guard: gratis 50 sanitasi/hari, Pro US$10/bulan. Shield by Infinium: gratis lokal, Pro US$8/bulan. PII Shield mulai US$19/bulan. NICH GPT Anonymizer, Private Prompt, Ai4Privacy, ChatGPT Privacy Shield: gratis. Sumber: https://elephas.app/resources/best-chatgpt-anonymizer-tools dan listing Chrome Web Store (via pencarian, angka pengguna tidak didapat).
- BastionGPT (AI chat khusus kesehatan dengan BAA di semua paket, termasuk trial 7 hari): Professional US$20, Professional Plus US$45, Ultra US$75 per user per bulan. Paket Professional disebut untuk "individual clinicians and small practices". Sumber: https://bastiongpt.com/medical-chatgpt dan https://www.getapp.com/all-software/a/bastiongpt/ (klaim vendor).
- AI scribe (pencatat medis) untuk praktik kecil: kisaran US$39–150 per klinisi per bulan, BAA sering disertakan di tier berbayar (misalnya Twofold US$49–69/bulan dengan BAA). Sumber: https://www.commure.com/blog-scribe/scribe-pricing dan https://www.trytwofold.com/blog/best-ai-scribe-small-practice-medical (blog vendor).

### [Inferensi]

- Pasar ekstensi redaksi PII untuk individu **sudah ramai tapi tidak menghasilkan uang**. Caviard dengan US$74 seumur hidup adalah sinyal keras bahwa individu tidak mau membayar untuk redaksi saja.
- Di klinik, orang **sudah membayar** US$20–150 per bulan, tapi untuk AI yang patuh (BastionGPT, scribe), bukan untuk lapisan redaksi di atas ChatGPT. Pembeli memilih "ganti alat" ketimbang "pasang pelindung".

## 5. Bukti segmen ini membayar untuk keamanan atau kepatuhan

### [Fakta]

- Omdia (via WatchGuard): belanja keamanan siber SMB naik 11% pada 2025 menjadi US$64,3 miliar. Definisi SMB tidak disebut. Sumber: https://www.watchguard.com/wgrd-news/blog/smb-cybersecurity-spending-rises-zero-trust-secure-access-now-essential
- Guardz: pendorong terkuat outsourcing ke MSP (penyedia layanan TI terkelola) adalah ketakutan serangan (52%), diikuti ekspektasi pelanggan dan pemangku kepentingan (40%), lalu kepatuhan dan premi asuransi. 16% belanja kurang dari US$50/user/tahun. Sumber: Channel Insider di atas.
- Harga referensi per user yang sudah dibayar segmen kecil: ChatGPT Business atau Claude Team US$20–25/bulan, BastionGPT US$20–75/bulan, Chrome Enterprise Premium US$6/bulan.

### [Inferensi]

- Segmen kecil membayar untuk keamanan, tetapi terutama **lewat MSP** dan dalam bundel, bukan membeli alat DLP AI langsung. Jalur distribusi realistis adalah MSP atau marketplace vertikal (software praktik klinik), bukan penjualan langsung ke pemilik.
- Kisaran harga yang masuk akal untuk lapisan perlindungan AI di segmen kecil sekitar US$3–10 per user per bulan, berdasarkan Chrome Enterprise Premium US$6 dan fakta 16% SMB belanja <US$50/user/tahun untuk seluruh keamanan. Ini tebakan, belum divalidasi dengan wawancara pembeli.

## 6. Insiden dan sanksi di segmen kecil

### [Fakta]

- Autoriteit Persoonsgegevens (regulator privasi Belanda), 7 Agu 2024: menerima "meerdere gevallen" (beberapa laporan) kebocoran data karena chatbot. Salah satunya karyawan **praktik dokter umum (huisartsenpraktijk)** yang memasukkan data medis pasien ke chatbot AI, melanggar aturan kantornya. Kasus lain: karyawan telekomunikasi memasukkan file berisi alamat pelanggan. Tidak ada denda yang disebut; AP mengeluarkan peringatan. Sumber: https://nos.nl/l/2532234 dan https://www.dutchitchannel.nl/news/466398/ap-gebruik-ai-chatbot-kan-leiden-tot-datalekken
- OVIC (regulator privasi Victoria, Australia), 24 Sep 2024: pekerja perlindungan anak di DFFH memasukkan data pribadi anak dan keluarga ke ChatGPT untuk laporan pengadilan. DFFH dinyatakan melanggar IPP 3.1 dan 4.1, ditemukan 100 kasus dengan indikasi pemakaian ChatGPT dalam setahun, dan diperintahkan memblokir alat GenAI. Sumber: https://ovic.vic.gov.au/regulatory-action/investigation-into-the-use-of-chatgpt-by-a-child-protection-worker/ . Ini lembaga pemerintah, bukan organisasi kecil.
- Tidak ditemukan denda atau sanksi regulator terhadap UMKM, sekolah, klinik kecil, atau freelancer yang spesifik karena menempel data ke AI.

### [Inferensi]

- Insiden di segmen kecil **nyata tapi jarang dihukum**. Tanpa denda yang terlihat, rasa takut pembeli kecil lemah, dan ini memperlambat kemauan membayar.
- Kasus dokter umum Belanda adalah bukti paling dekat dengan segmen klinik kecil, dan menunjukkan aturan internal saja tidak cukup.

## Kesimpulan

### [Inferensi] Apakah celahnya nyata

- **Nyata, tapi lebih sempit dari hipotesis.** Celah harga untuk alat DLP AI terbukti (minimum 50–200 user, butuh Intune atau E5). Kebiasaan menempel data terbukti untuk pemilik usaha kecil dan tenaga kesehatan.
- Celah itu **tidak berlaku sama** untuk semua segmen. Untuk UMKM umum, ChatGPT Business atau Claude Team US$20/orang sudah menutup kebutuhan "data tidak dipakai melatih", dan kebanyakan UMKM memakai AI untuk konten promosi.

### [Inferensi] Segmen terkuat

1. **Klinik kecil dan praktik mandiri** (dokter, psikolog, terapis). Data paling sensitif, ada kewajiban hukum (HIPAA, GDPR, UU PDP), paket AI bisnis murah tidak memberi BAA, dan sudah ada bukti mereka membayar US$20–150 per bulan.
2. **Usaha jasa profesional kecil** (akuntan, konsultan hukum kecil, agen HR) yang memegang data klien. Bukti perilaku ada (survei Sage 50%), tapi tidak ada angka per sub-segmen.
3. Sekolah dan freelancer lebih lemah. Sekolah membeli lewat distrik (bukan unit kecil mandiri), dan untuk freelancer tidak ada data perilaku.

### [Inferensi] Siapa yang membayar dan berapa

- Pemilik klinik atau praktik, sekitar US$20–75 per user per bulan, tapi untuk **AI yang sudah patuh**, bukan untuk pelindung di atas ChatGPT.
- Pemilik usaha kecil lewat MSP, kemungkinan US$3–10 per user per bulan untuk lapisan perlindungan dalam bundel. Belum divalidasi.
- Individu (guru, freelancer) praktis tidak membayar. Buktinya Caviard US$74 seumur hidup.

### [Inferensi] Yang melemahkan hipotesis

1. **ChatGPT Business dan Claude Team US$20/orang dengan minimum 2 kursi** sudah menjawab kekhawatiran utama (data melatih model) bagi UMKM. Yang tersisa hanya kebocoran ke vendor itu sendiri dan pemakaian akun pribadi.
2. **Kompetitor vertikal sudah ada di segmen terkuat.** BastionGPT dan AI scribe menawarkan BAA mulai US$20/bulan, jadi klinik bisa "ganti alat" tanpa butuh pelindung.
3. **Ekstensi redaksi gratis sudah banyak dan tidak laku dibayar.** Fitur redaksi PII saja bukan produk yang bisa dijual.
4. **Pemakaian AI di firma mikro masih <20%** (Census AS) dan datar, jadi pasar aktif lebih kecil dari kesan.
5. **Hampir tidak ada sanksi** ke organisasi kecil, jadi pendorong kepatuhan lemah.
6. Banyak angka berasal dari survei vendor (LayerX, Guardz, Black Book) dengan metodologi tidak lengkap. Tidak ada data primer dari wawancara pembeli segmen kecil.

### Yang belum diverifikasi

- Halaman harga resmi ChatGPT Business dan Claude Team (OpenAI 403, Claude dari blog pihak ketiga).
- Harga Netskope, Cyberhaven, dan tarif pay-as-you-go Purview.
- Jumlah pengguna Chrome Web Store untuk ekstensi selain Caviard.
- Apakah Gemini di Workspace Business Starter tidak melatih data.
