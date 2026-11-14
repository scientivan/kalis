# Referensi website untuk Kalis

Riset 14 November 2026. Fokus pada marketplace metode yang dapat dijalankan, ruang kerja AI privat, dan pendanaan perbaikan. Contoh pengguna Kalis mencakup pengelola portofolio, peserta tender, dan profesional yang menegosiasikan tawaran kerja. Tidak ada penetapan pasar eksklusif.

## Status bukti

Halaman publik dan dokumentasi brand dibaca melalui web reader. Struktur konten, label navigasi, CTA dan wording dapat diperiksa dari sumber. Sesi ini tidak mengaudit render desktop/mobile, posisi piksel, hover, animasi, proses login atau checkout. Layout Kalis di bawah adalah usulan berdasarkan informasi yang tersedia. Token visual hanya disebut sebagai fakta jika tersedia dalam dokumentasi resmi. Klaim privasi produk pembanding merupakan klaim penyedianya, bukan hasil audit keamanan.

## Pilihan utama

| Referensi | Kedekatan dengan Kalis | Bagian yang paling berguna | Batas pemakaian |
|---|---|---|---|
| Apify | Katalog alat buatan penjual yang dapat dijalankan | Katalog, detail metode, informasi sebelum memakai | Tidak membuktikan privasi dua pihak |
| Replicate | Menemukan dan menjalankan model | Contoh hasil, playground, pemisahan panduan/API | Model bukan selalu metode keahlian |
| TradingView | Memakai strategi dengan source tersembunyi | Menjelaskan nilai metode tanpa membuka implementasi | Bukan bukti privasi data dari operator |
| n8n | Menemukan workflow menurut pekerjaan dan integrasi | Discovery, persiapan koneksi, brand system | Template terbuka berbeda dari metode privat |
| Lumo | AI untuk data pribadi | Penjelasan manfaat privasi dengan bahasa pengguna | Tidak memiliki marketplace metode dalam halaman yang dibaca |
| iExec | Komputasi privat dan pembayaran | Positioning perlindungan pemilik data dan logika | Infrastruktur developer berbeda dari workspace pengguna |
| Phala | Eksekusi AI privat dengan bukti | Penjelasan apa yang berjalan dan apa yang dibuktikan | Pembuktian eksekusi bukan jaminan mutu hasil |
| Opire | Pendanaan perbaikan dan imbalan kontributor | Halaman Community, alur bounty dan review | Bukan model dana DAO atau core privat Kalis |

## 1. Apify sebagai acuan informasi marketplace

[Store](https://apify.com/store) menyediakan pencarian serta kategori pekerjaan. [Website Content Crawler](https://apify.com/apify/website-content-crawler) memperlihatkan pembuat, model harga, rating/jumlah ulasan, serta tab Input, Pricing, API, Reviews, Issues dan Changelog.

**Usulan untuk Kalis.** Kartu katalog berisi nama metode, pekerjaan yang diselesaikan, pembuat, rating/jumlah ulasan dan biaya yang tersedia. Detail memisahkan kebutuhan input, harga, ulasan dan versi. Tampilkan izin dekat tindakan memakai metode. Keadaan tanpa ulasan tetap terlihat dengan label No ratings yet.

**Pelajaran wording.** Jelaskan pekerjaan dan hasil konkret dalam satu kalimat. Hindari nama metode panjang yang hanya menjelaskan teknologi. Jangan menyalin jumlah pengguna, rating atau penanda verified tanpa bukti Kalis sendiri.

## 2. Replicate sebagai acuan mencoba dan menilai hasil

[Explore](https://replicate.com/explore) memiliki kelompok berdasarkan pekerjaan. [FLUX dev](https://replicate.com/black-forest-labs/flux-dev) memisahkan Playground, API, Examples dan README, serta menjelaskan keterbatasan.

**Usulan untuk Kalis.** Contoh hasil menjadi bahan utama sebelum pembeli menjalankan metode. Untuk portofolio, tampilkan transaksi yang disarankan beserta biaya dan batas yang dipakai. Untuk tender, tampilkan struktur keluaran dan batas analisis. Bedakan contoh sintetis dari hasil privat milik pengguna. Informasi teknis tersedia sebagai detail lanjutan.

**Batas.** Tab playground yang terdeteksi bukan bukti bahwa sesi ini menjalankan model atau memeriksa form interaktifnya. Jumlah run juga tidak sama dengan mutu metode.

## 3. TradingView sebagai acuan metode tertutup

[Community Scripts](https://www.tradingview.com/scripts/) mempertemukan strategi/indikator dan pembuat. [Dokumentasi visibilitas](https://www.tradingview.com/support/solutions/43000482573-what-are-the-different-types-of-published-scripts/) menjelaskan source tersembunyi pada protected dan invite-only. [Aturan publikasi](https://www.tradingview.com/support/solutions/43000590599-script-publishing-rules/) tetap mengharuskan penjelasan script tertutup.

**Usulan untuk Kalis.** Kerahasiaan implementasi tidak menghapus kebutuhan menjelaskan manfaat, input, asumsi, keluaran dan batas. Label Private implementation dapat ditemani penjelasan tentang apa yang dapat diperiksa pembeli. Pisahkan ulasan pengalaman dari bukti uji versi.

**Batas.** Ini analogi distribusi keahlian tertutup. Tidak menunjukkan bahwa TradingView menjamin kerahasiaan data dari operator atau bahwa strategi menguntungkan. Kebijakan komersial sedang berubah dalam sumber yang ditemukan, sehingga tidak dipakai sebagai acuan aturan pembayaran Kalis.

## 4. n8n sebagai acuan discovery dan design system

[Workflow library](https://n8n.io/workflows/) memakai pencarian berdasarkan aplikasi, peran dan use case, kategori pekerjaan serta jalur menurut integrasi.

**Usulan untuk Kalis.** Pencarian berorientasi pekerjaan, misalnya rebalancing, tender atau salary negotiation. Koneksi yang diperlukan terlihat sebelum run. Istilah metode tetap dipakai untuk produk keahlian Kalis. WASM/prompt dapat menjadi metadata bentuknya.

[Brand system](https://guidelines.n8n.design/) menyediakan sumber resmi berikut.

| Area | Fakta dokumentasi n8n | Pelajaran yang diusulkan untuk Kalis |
|---|---|---|
| [Colors](https://guidelines.n8n.design/colors) | Satu aksen utama dengan warna netral. Contoh token #FF91AC, #191919 dan #FAFAFA | Tetapkan fungsi warna secara konsisten. Pilihan aksen Kalis tetap terbuka |
| [Typography](https://guidelines.n8n.design/typography) | Font khusus n8n Baumer, bobot 400/500, ukuran dan line height kelipatan 4px | Hierarki dari ukuran dan penempatan. Font custom mereka bukan pilihan font Kalis otomatis |
| [Grid](https://guidelines.n8n.design/the-grid) | Modul dan spacing kelipatan 8, atau 4 untuk penyesuaian | Definisikan skala spacing, alignment dan padding antarkomponen |
| [Voice](https://guidelines.n8n.design/tov) | Sentence case, kalimat aktif, bahasa konkret, klaim didukung fakta | Pakai nama metode ringkas dan CTA yang menjelaskan tindakan |

Belajar dari konsistensi sistemnya tidak mengharuskan meniru warna pink, kapsul atau panel dekoratif. Penolakan Dien terhadap badge pastel tetap berlaku.

## 5. Lumo sebagai acuan menjelaskan privasi

[Halaman Lumo](https://lumo.proton.me/) menjelaskan siapa yang dapat membaca percakapan, penggunaan data dan kontrol pengguna. [Halaman produk](https://proton.me/lumo) menyediakan jalur ke security model.

**Usulan untuk Kalis.** Jelaskan siapa yang dapat melihat input, metode dan hasil di dekat objek terkait. Tampilkan ringkasan sederhana lalu tautan ke bukti dan batas. Untuk model proprietary, peringatan dan consent harus sesuai jalur yang benar-benar tersedia.

**Batas.** Hindari menyalin klaim zero-access atau no logs Lumo ke seluruh Kalis. Dokumen, konektor dan lima proteksi memiliki lokasi pemrosesan serta batas yang perlu dijelaskan sendiri.

## 6. iExec sebagai acuan positioning dua pihak

[iExec](https://iex.ec/) menghubungkan komputasi rahasia, aplikasi yang dapat dibayar, dan bukti run. Halamannya menyebut data yang tidak dilihat pemilik model serta model yang tidak diunduh pemilik data.

**Usulan untuk Kalis.** Jelaskan kedua kepentingan secara berpasangan. Pembeli ingin memakai keahlian pada data sensitif, penjual ingin memperoleh pendapatan dari metode tanpa menyerahkan implementasinya. Setelah manfaat, jelaskan cara kerja dan batas teknis.

**Batas.** Halaman aplikasi marketplace iExec tidak dapat dibaca pada sesi ini. Jangan menganggap layout katalog atau checkout sudah diperiksa. Tidak ada dasar dari riset ini untuk menyebut Kalis pertama di dunia.

## 7. Phala sebagai acuan bukti eksekusi

[Phala](https://phala.com/) menghubungkan eksekusi privat dengan bukti tentang runtime dan menyediakan jalur Verify Attestation. Contoh terminal menjadi bagian penjelasan produk.

**Usulan untuk Kalis.** Ringkas status run dengan bahasa pengguna. Detail lanjutan memuat versi metode, build runner, kecocokan hash input/output, laporan langkah dan cek pembeli yang memang tersedia. Bedakan tahap selesai, batas input terpenuhi dan kualitas rekomendasi.

**Batas.** Jangan menyalin klaim verifikasi sertifikat penuh. Catatan Kalis menyebut root certificate verification belum selesai. Halaman hasil harus menjelaskan lingkup pemeriksaan yang benar-benar dilakukan.

## 8. Opire sebagai acuan Community

[Opire](https://opire.dev/home) menjelaskan alur memilih issue, mendanainya, meninjau solusi dan mengatur pembayaran setelah disetujui. Halaman membedakan pemilik kode, pengembang dan pendukung. Akses repo privat membatasi siapa yang bisa menyelesaikan pekerjaan.

**Usulan untuk Kalis.** Detail bounty berisi masalah, metode/versi terkait, modul yang dapat diakses, acceptance criteria, dana, status, kontribusi dan keputusan review. Tampilkan manfaat konkret dana bersama melalui perbaikan yang dibiayai.

**Batas.** Pembayaran dan pendanaan Opire tidak disamakan dengan escrow run atau Sputnik DAO Kalis. Menyalin alur kontribusi terbuka sepenuhnya akan mengabaikan private core dan data pembeli.

## Rekomendasi lintas halaman

Seluruh bagian ini adalah usulan untuk review, bukan keputusan desain yang disahkan.

| Halaman Kalis | Susunan yang diusulkan | Referensi utama |
|---|---|---|
| Landing | Manfaat, beberapa pekerjaan nyata, contoh input/hasil, cara kerja, privasi dua pihak, kontribusi, CTA | Lumo, iExec, Replicate, Opire |
| Marketplace | Cari pekerjaan, filter seperlunya, kartu konsisten, pembuat, rating dan biaya tersedia | Apify, n8n |
| Detail metode | Nama/manfaat/pembuat, contoh hasil sebagai konten utama, panel biaya dan tindakan, input/akses, batas, reviews, versi dan kontribusi | Apify, Replicate, TradingView |
| Workspace | Pekerjaan terakhir, lanjutkan run, status yang jelas, file/hasil terkait | Struktur mengikuti alur Kalis. Shell aplikasi pembanding belum diaudit |
| Review sebelum run | Input, versi, model/koneksi, izin, rincian biaya dan konsekuensi tindakan | Apify dan kebutuhan Kalis |
| Hasil | Jawaban, cek aturan pembeli, status tahap, bukti lanjutan | Replicate, Phala |
| Community | Dana, proposal, bounty, kriteria penerimaan, review, versi hasil | Opire |

## Usulan positioning dan wording

Konsep positioning utama adalah memakai metode keahlian pada pekerjaan sensitif dengan perlindungan pembeli dan penjual yang dapat dijelaskan. Dana bersama menjelaskan bagaimana metode bisa diperbaiki. Contoh demo portofolio tidak membatasi produk menjadi aplikasi investasi.

Contoh copy asli untuk review, bukan kutipan website atau klaim fitur baru.

- Hero “Expert methods for sensitive work.”
- Pendukung “Find a method for your next portfolio review, tender bid, or salary negotiation.”
- CTA katalog “Explore methods”.
- CTA detail “Review inputs and cost”.
- CTA run “Run method”, hanya pada metode yang benar-benar tersedia.
- Label bentuk “WASM method” atau “Prompt method”.
- Label contoh “Sample result · synthetic data”.
- Penjelasan implementasi “Use the method without downloading its private implementation.”
- Bukti “See what was checked”.
- Dana bersama “Help fund the next improvement”.

Kalimat tentang data privat harus mengikuti kemampuan jalur aktual. Persetujuan penuh terhadap klaim operator-blind tidak ditarik dari hasil riset website. Harga, trial, rating, refund mutu dan jaminan hasil tidak diciptakan.

## Kandidat yang tidak dijadikan dasar utama

OKX AI tetap referensi pilihan Dien dari sesi sebelumnya, tetapi https://okx.ai/agents tidak dapat dibaca pada sesi ini. Lihat design/app/OKX_REFERENCE.md sebagai catatan terdahulu. Algora sekarang menampilkan positioning perekrutan engineer pada homepage yang terbaca, sehingga tidak dipakai sebagai referensi utama alur bounty. Numerai tersedia sebagai kandidat evaluasi model, tetapi tidak diprioritaskan karena dapat menggeser persepsi Kalis ke kompetisi investasi.

## Langkah review visual yang masih terbuka

Shortlist utama untuk inspeksi render berikutnya adalah Apify detail, Replicate detail, katalog n8n, halaman Lumo dan alur Opire. Periksa desktop/mobile, form, loading/error, komposisi biaya, fokus keyboard dan penempatan izin. Dokumentasi brand n8n sudah memberi acuan sistem resmi, tetapi bukan bukti semua halaman aplikasi menerapkannya dengan pola yang sama.

Compliance gate NEAR diperiksa. Riset publik dan dokumentasi lokal tidak berkonflik dengan aturan. Tidak ada publikasi, push, signing, spending atau perubahan frontend. Rekomendasi tetap harus dipetakan ke fitur yang benar-benar berjalan sesuai Q-017.
