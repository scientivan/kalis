---
target: design/app/index.html
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-11-13T17-15-11Z
slug: design-app-index-html
---
# Review screenshot aplikasi Kalis

14 November 2026. Target `design/app/index.html`. Analisis dan usulan, belum perubahan frontend atau persetujuan rancangan baru. Bukti visual berasal dari enam screenshot Dien. Pemeriksaan interaksi native browser belum tersedia.

## Temuan dari screenshot

| Area | Masalah | Arah perbaikan yang diusulkan |
| --- | --- | --- |
| Status | Banyak bidang pastel memberi bobot dekoratif pada metadata kecil. Dien menolak perlakuan ini. | Status ringkas dengan ikon dan teks, penekanan hanya pada keadaan yang perlu tindakan. Tetap terbaca tanpa warna. |
| Nama metode | Nama kategori, nama metode dan tindakan bercampur. Kapital bukan satu-satunya masalah. | Satu nama per metode konsisten lintas halaman. Tabel boleh memakai nama singkat. Tombol memakai kata kerja. Sentence case konsisten. Jangan menyingkat sampai tujuan metode hilang. |
| Sample workspace dan fictional files | Label terpisah dari objek yang diterangkannya dan berulang di heading. | Satu pemberitahuan preview pada shell. Keterangan data contoh melekat pada file atau contoh hasil yang relevan. |
| Your work stays in your space | Kalimat jaminan umum mengambang di toolbar. | Jelaskan siapa dapat mengakses input dan hasil pada pemeriksaan izin. Hindari klaim privasi mutlak. |
| Find a method | Slogan dan tiga tombol berjauhan. Tidak membantu pekerjaan utama di tabel. | Tautan Browse methods pada pemilihan metode atau keadaan kosong. Hilangkan strip promosi berulang pada workspace yang sudah berisi pekerjaan. |
| Detail metode | Kartu About besar berisi fakta datar. Informasi pembelian, contoh hasil, pembuat dan bukti tidak membentuk urutan keputusan. | Halaman produk dengan contoh hasil utama, pembuat, kebutuhan input/akses dan panel biaya serta tindakan utama yang jelas. |

Warna pastel bukan bukti bahwa desain dibuat AI. Masalah yang dapat ditindaklanjuti adalah ketidaksesuaian preferensi Dien, penekanan visual yang merata, copy generik, serta hubungan informasi dan tindakan yang lemah. Teks juga tidak selalu perlu kartu. Kedekatan, judul, alignment dan jarak dapat membentuk kelompok yang jelas.

## Pembanding yang dibaca

| Sumber resmi | Pola informasi yang teramati | Penerapan yang diusulkan |
| --- | --- | --- |
| [Replicate FLUX dev](https://replicate.com/black-forest-labs/flux-dev) | Identitas pembuat/model, Playground, Examples, README dan batas penggunaan | Contoh hasil nyata atau sintetis berlabel menjadi konten utama untuk menilai metode |
| [Template invoice n8n](https://n8n.io/workflows/21455-upload-invoices-via-form-and-extract-validate-dedupe-and-log-to-ledger/) | Pembuat, ringkasan, cara kerja, setup, requirements dan tindakan memakai template | Kebutuhan input, layanan dan persiapan sebelum memakai metode mudah ditemukan |
| [Hugging Face Model Cards](https://huggingface.co/docs/hub/model-cards) | Tujuan penggunaan, keterbatasan dan hasil evaluasi | Bukti terikat versi dan batas klaim, terpisah dari rating pengguna |

Ini riset konten dan pola navigasi dari sumber publik, bukan audit visual browser atas produk pembanding.

## Kebutuhan halaman detail berdasarkan rancangan produk

Bagian 5, 21, 29–30, 44–46, 49–52 dan 54–57 menjadi acuan, dengan keputusan terbaru mengalahkan riwayat.

| Lokasi usulan | Informasi yang dibutuhkan |
| --- | --- |
| Header produk | Nama metode yang menjelaskan hasil, deskripsi singkat, identitas pembuat dan versi yang ditawarkan |
| Konten utama | Contoh keluaran yang konkret, kecocokan kebutuhan, input dan format yang diperlukan, batas penggunaan |
| Panel pemakaian | Harga metode, satuan penagihan, biaya infrastruktur dan total atau estimasi yang dijelaskan sebelum komitmen. Tindakan utama sesuai status tersedianya metode |
| Persiapan dan akses | Model yang digunakan, konektor dan cakupan akses, dokumen, memori, browser serta tujuan pengiriman luar sesuai kebutuhan metode. Pembeli meninjau detail sebelum menjalankan |
| Pengujian dan versi | Hasil uji dengan konteks dan batas, riwayat versi, perubahan dan atribusi. Rating pengguna terpisah dan hanya jika mekanismenya tersedia |
| Perbaikan | Modul yang boleh dikontribusikan, masalah/bounty, syarat uji dan review, riwayat kontribusi dan dana bersama. Tautan harus menuju metode yang sama |
| Sesudah run | Hasil privat, laporan langkah, cek ulang pembeli dan bukti versi/attestation. Ringkasan kemampuan pemeriksaan dapat dijelaskan di detail, laporan aktual milik run |

Usulan komposisi desktop memakai konten utama lebih lebar dan satu panel tindakan di kanan. Detail pendukung dapat memakai tab Overview, Requirements, Versions dan Contributions, dengan pemeriksaan biaya/izin tetap dalam alur sebelum eksekusi. Mobile mengikuti urutan baca yang sama. Nama tab dan komposisi ini belum disetujui.

Dana DAO minimal 10%, platform 10%, sisanya penjual mengikuti bagian 54. Dasar persentase terhadap harga metode atau total masih perlu diperjelas. Jangan mengarang nominal, profil pembuat, rating, jumlah pembeli atau durasi. Trial, refund, sengketa dan lisensi belum final. Preview memakai satu pengungkapan global dan label lokal pada aksi mock yang relevan.

## Batas pemeriksaan

Dua assessment independen dilakukan atas izin pengguna sesuai impeccable. Assessment A menilai desain sebelum hasil detector masuk sintesis. Assessment B memeriksa sumber dan menjalankan detector. Temuan teknis dan skor ditambahkan setelah kedua assessment selesai. Tidak ada deployment, transaksi, perubahan backend atau klaim lolos audit WCAG.

## Sintesis dua assessment independen

Assessment A selesai sebelum hasil B dibaca oleh parent. Skor sementara berbasis screenshot dan source, bukan pengujian native browser.

| Heuristik | Skor / 4 |
| --- | --- |
| Status sistem | 3 |
| Kesesuaian bahasa dunia nyata | 2 |
| Kendali pengguna | 3 |
| Konsistensi | 2 |
| Pencegahan kesalahan | 2 |
| Pengenalan tanpa mengingat | 2 |
| Efisiensi | 2 |
| Minimalisme | 2 |
| Pemulihan kesalahan | 3 |
| Bantuan | 2 |
| Total | 23 / 40 |

Prioritas P1 adalah urutan keputusan detail metode, keterangan preview/privasi yang terfragmentasi dan penamaan metode yang berubah. Prioritas P2 adalah strip promosi marketplace dan badge pastel. Tidak ada P0 terbukti. Kandidat perintah tindak lanjut adalah impeccable shape untuk struktur, clarify untuk penamaan dan akibat tombol, distill untuk promosi/helper berulang, serta polish untuk status.

Kekuatan draf adalah judul dan tombol utama mudah dikenali, label/nilai terbaca, serta data membedakan sample, planned dan illustration. Beban kognitif moderat berasal dari pengelompokan keterangan, perubahan nama yang harus diingat dan prioritas disclosure yang terbalik. Lima tujuan global bukan otomatis lima keputusan pembelian yang bersaing.

Pembeli baru kesulitan menilai siapa pembuat dan apa akibat tombol. Pengguna berpengalaman menemui jalur discovery berulang dan panel kontribusi besar saat menilai metode. Pengguna keyboard mendapat kontrol semantik/fokus di source, tetapi urutan fokus, zoom dan pembaca layar belum diuji native. Perjalanan terasa tenang di awal, kemudian tidak pasti saat menjumpai harga belum terhubung dan tombol sample yang hasilnya draf sesi.

B menjalankan detector nyata, exit 2, menghasilkan 47 advisory di app.css. Ada 39 ukuran font, 5 radius dan 3 warna. Mode regex terbatas karena htmlparser2, css-select, css-tree dan domutils tidak tersedia. Banyak ukuran font sudah dijelaskan di prosa DESIGN.md tetapi tidak di metadata, sehingga hitungan tidak setara jumlah cacat visual. Source app.js baris 147 memberi setiap keputusan non-Pending gaya ready, termasuk Declined. Baris 104 mengarahkan Explore community ke overview umum. Metadata data.js belum memuat identitas penjual dan informasi evaluasi lengkap.

Pertanyaan tindak lanjut adalah akibat utama tombol preview, melihat hasil contoh atau membuat draf, serta cakupan revisi, detail metode dahulu atau seluruh pola lintas halaman. Nama final metode tetap perlu konsisten dan menjelaskan manfaat. Tidak ada perubahan kode aplikasi pada audit ini.
