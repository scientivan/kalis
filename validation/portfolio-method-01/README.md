# Strategi yang dijalankan pada portofolio sintetis

## Hasil

42 dari 42 kasus lolos perbandingan status, kepatuhan batas dan nilai objective dengan enumerasi seluruh kombinasi delta yang diizinkan. Ini mencakup 12 skenario terarah serta 30 variasi pseudoacak dengan seed tetap. Satu kasus input negatif ditolak. Data, solver dan oracle dibuat oleh assistant yang sama. Implementasi oracle memakai hitungan ledger langsung, tidak memakai matriks constraint solver, tetapi bukan validasi domain independen.

Strategi contoh menghitung skor tiap aset sebagai preferensi pasar sintetis dikurangi penalti konsentrasi posisi pengguna, kemudian memilih jumlah beli/jual integer dengan batas pengguna dan biaya. Regime normal menggunakan preferensi [3,2,1], stress [-1,-2,-3], penalti konsentrasi 4 × posisi/NAV. Objective adalah skor tertimbang transaksi dikurangi 0,05 × turnover. Ini utility buatan untuk uji logika, bukan prediksi return atau strategi ahli.

Tiga aset A/B/C masing-masing berharga satu unit nilai. Satu unit dapat dibaca sebagai Rp10 juta untuk ilustrasi, bukan data pasar. Biaya proporsional diterapkan pada nilai absolut semua transaksi. NAV pascatransaksi berkurang sebesar biaya. A dan B berbagi satu sektor. Batas mencakup kas minimum, bobot aset, bobot sektor, turnover, ukuran pembelian dan izin menjual. Tidak ada short, leverage, pajak, spread, slippage, lintas mata uang atau perubahan harga saat fill. Batas berlaku pada keadaan akhir simulasi, bukan jaminan setiap urutan fill intraday.

## Portofolio memengaruhi strategi

Dengan kondisi pasar sama, input [3,2,1] dan kas 4 menghasilkan delta [0,0,+1]. Input [7,1,1] kas 1 menghasilkan [-5,+2,+1]. Input [3,3,3] kas 1 menghasilkan [0,-1,-3]. Input [0,0,0] kas 10 menghasilkan [+3,+2,+2]. Angka adalah hasil eksperimen, bukan saran investasi. Nilai objective negatif pada suatu kasus tetap dapat optimal karena kewajiban memenuhi batas memaksa perubahan.

Kandidat transaksi statis [+2,0,0] pada kasus dasar melanggar kas minimum, cap aset dan cap sektor setelah biaya. Ini kontrol sederhana yang sengaja dipilih untuk memeriksa deteksi, bukan keluaran AI dan bukan bukti AI akan salah.

## Pembuktian

run_tests.py menjalankan strategi melalui SciPy MILP. Validator menghitung ulang posisi, kas, fee dan NAV secara langsung. Oracle exhaustive memeriksa semua delta per aset dari minus posisi (atau nol bila jual dilarang) hingga batas pembelian dan memilih objective feasible maksimum. Hasil optimum dicocokkan menurut nilainya, bukan urutan transaksi identik karena solusi seri mungkin ada. Solver failure tidak diperlakukan sebagai infeasible.

Jalankan `rtk proxy python3 validation/portfolio-method-01/run_tests.py`. results.json memuat input/output audit serta oracle. Harga dan kasus sintetis, tidak ada akun broker atau API trading. Dokumentasi solver https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.milp.html .

## Batas

Tidak ada backtest return, pengujian model A/B/C atau pengukuran waktu manusia. Tidak ada TEE/attestation, enkripsi dua pihak, pengujian log/egress atau bukti menyembunyikan strategi. Kode dan data berada lokal serta dapat dibaca pengembang. Arsitektur yang memenuhi privasi harus diuji tersendiri. Riwayat timeout akses model sebelumnya tidak diubah menjadi hasil benchmark di sini.

Kesimpulan yang sah adalah strategi dapat dikondisikan pada portofolio pengguna dan hasilnya dapat diverifikasi dalam model uji terbatas. 42/42 bukan jaminan strategi investasi aman/untung, bukan akurasi umum, dan bukan bukti unggul dibanding prompt atau software optimasi yang sudah ada. Tidak memilih aset nyata atau melakukan transaksi.
