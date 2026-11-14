# Hasil penilaian dan rekomendasi

## Rekomendasi desain

Kandidat paling layak diperdalam adalah metode penyelidikan kegagalan operasional berulang berbasis bukti. Use case konkret adalah tim operasi toko online/fulfillment menyelidiki salah varian atau jumlah pada pesanan, menentukan batas masalah yang dapat dibuktikan dan memilih tindakan korektif. Rekomendasi framework menjadi bagian penalaran, bukan keluaran utama. Tidak memilih framework universal atau mengklaim akar penyebab dari log saja.

Luaran berupa daftar kasus terdampak, tahap pertama yang teramati, bukti per kejadian, ketidakpastian, hipotesis yang perlu diperiksa, tindakan sementara, rencana perbaikan dan ukuran keberhasilan. Pengguna dapat meninjau bukti dan memutuskan tindakan. Metode tidak mengeksekusi perubahan operasional otomatis.

Dibanding kandidat churn, fakta ketidaksesuaian lebih mudah diperiksa tanpa menunggu pelanggan membeli lagi. Dibanding kandidat hambatan tim, contoh kesalahan pesanan memberi label kejadian yang lebih jelas. Diagnosis hambatan juga layak, tetapi perubahan kapasitas dan akibat antrean membutuhkan data proses lebih rinci. Perbandingan ini analisis desain, bukan tiga eksperimen yang semuanya sudah dijalankan.

## Yang benar-benar dikerjakan

Dibuat prototipe lokal `analyze.py` untuk memeriksa konsistensi event sesuai skema sintetis. Lolos status/tahap pada 12 kasus awal, stabil pada 120 pengacakan urutan input. Pada 1.000 pesanan dengan 4.000 event, menemukan 100 pesanan salah yang sengaja ditanam pada tahap pack. Waktu tercatat dalam hasil lokal, bukan perbandingan dengan manusia atau model.

Pemeriksaan tambahan menemukan tiga kekurangan awal dari lima kasus. Ekspor kosong dianggap konsisten, pengambilan parsial yang masih berlangsung dianggap kekurangan, dan keluhan yang bertentangan dengan log tidak ditandai belum terselesaikan. Setelah guard ditambahkan, kelima kasus tambahan dan 12 kasus awal lolos. Ini regresi pengembangan setelah melihat kasus, bukan validasi independen.

Batas prototipe meliputi skema contoh, satu hari, alias satu tingkat, snapshot jumlah tahap, amendment yang telah dinyatakan sah, serta penanganan konservatif stage terbuka. Belum ada konektor sistem, ekstraksi dokumen, perancangan intervensi, keamanan TEE, evaluasi semantik 100 poin atau pengujian bounty. Hasil consistent hanya konsistensi log. Prototype tidak membuktikan benar secara fisik atau selesai secara bisnis.

## Perbandingan AI dan klaim efisiensi

Akses inference pembanding melalui CLI mode tanpa tools dicoba dengan batas waktu. Catatan ada di results/access-probe*.json. Dua percobaan berakhir timeout setelah 45 dan 90 detik tanpa keluaran benchmark. Penyebab timeout belum diketahui. Tidak mengisi runs.csv dengan hasil buatan atau memakai penalaran assistant yang sudah melihat kunci sebagai baseline independen.

Karena tidak ada hasil A/B/C lengkap atau pengukuran waktu manusia, belum dapat dinyatakan metode lebih akurat daripada prompting, menghemat 50% waktu manusia, layak dibayar pada harga tertentu atau paling unggul secara empiris. AI umum dengan kode dapat mereplikasi pemeriksaan ini. Nilai produk yang perlu dibuktikan adalah kerja berulang yang lebih sedikit melalui impor data, aturan yang konsisten dan keluaran yang mudah diaudit. Rekonsiliasi biasa sendiri bukan keahlian rahasia yang kuat.

## Keputusan

Pilih kandidat operasional sebagai rekomendasi desain paling dapat diuji dari tiga pilihan, dengan metode diperkuat oleh pemeriksaan bukti sebelum rekomendasi tindakan. Jangan menandainya sudah lolos kriteria pembelian atau efisiensi. Tidak ada kandidat yang saat ini boleh dinyatakan terbukti jauh lebih baik daripada AI umum.

Pekerjaan yang masih diperlukan untuk klaim itu adalah akses model yang menghasilkan respons, run pembanding terkontrol, kasus baru dari pembuat independen dan pengukuran waktu pengguna. Tanpa itu, menambah skor atau contoh tidak mengatasi kekurangan bukti. Ini batas hasil, bukan permintaan wawancara sebagai prasyarat.

## Reproduksi

Jalankan `rtk proxy python3 validation/method-01/verify.py` dari root. Lihat hasil terstruktur di results/final-local-checks.json. Kunci evaluator tidak dibaca oleh analyze.py. Semua data sintetis. Jangan memakai 12/12 sebagai akurasi umum.
