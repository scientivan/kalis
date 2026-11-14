# Kandidat metode 02 — penataan portofolio dengan biaya minimum

## Dasar yang ditemukan di internet

[Lobo, Fazel dan Boyd, 2007](https://web.stanford.edu/~boyd/papers/portfolio.html) meneliti optimasi portofolio dengan biaya linear dan tetap. Paper membedakan biaya tetap yang tidak langsung dapat diselesaikan sebagai optimasi konveks, lalu membahas pendekatan dan batas solusi. Ini mendukung dasar matematis, bukan bukti metode kita unggul terhadap AI.

[MOSEK Portfolio Optimization Cookbook, bagian 6.2](https://docs.mosek.com/portfolio-cookbook/transaction.html) memodelkan biaya tetap ditambah biaya proporsional dan indikator biner untuk transaksi. Biaya nol ketika tidak bertransaksi. Formulasi mixed-integer memungkinkan keputusan transaksi aktif/tidak aktif.

Adaptasi kita mengganti sasaran expected return dengan meminimalkan biaya transaksi di bawah rentang alokasi dan kas yang ditetapkan pengguna. Ini bukan salinan seluruh model riset, tidak memerlukan prediksi profit. Implementasi memakai SciPy MILP, tidak memerlukan lisensi solver MOSEK. Formula publik dapat diketahui model dari pelatihan meski tidak disertakan dalam prompt. Tidak dapat diklaim rahasia atau inovasi orisinal.

## Formula adaptasi

Untuk transaksi unit integer d_i dengan harga tetap p_i, tarif proporsional r_i dan biaya tetap f_i, pilih

min C(d) = sum_i [r_i p_i |d_i| + f_i * 1(d_i != 0)]

Posisi akhir q_i = h_i + d_i, kas akhir = kas awal - sum_i p_i d_i - C(d), NAV akhir = NAV awal - C(d).

Batas wajib mencakup unit bulat, tidak short atau meminjam, izin menjual, batas beli, kas minimum, rentang bobot aset terhadap NAV akhir dan batas gabungan A/B satu sektor. Tiap aset hanya boleh beli atau jual dalam satu keputusan. Tidak ada ramalan return, pajak, perubahan harga, slippage atau biaya di luar input. Nilai dan tarif sintetis, bukan rekomendasi transaksi atau representasi tarif broker tertentu. Tidak mengklaim batas sektor mengukur seluruh risiko pasar.

Solver memakai variabel unit beli/jual dan indikator binernya, dengan batas keterkaitan serta larangan beli dan jual aset yang sama sekaligus. Pengujian memakai ledger langsung dan enumerasi seluruh kombinasi integer untuk memastikan biaya minimum. Keduanya dibuat penulis sama, bukan audit independen.

## Manfaat pengguna yang dinilai

Pengguna ingin memenuhi batas alokasi dan kas dengan biaya serendah mungkin. Nilai metode adalah memilih perubahan yang perlu tanpa transaksi berlebih. Misalnya kasus C01 cukup menjual satu unit A, biaya 0,07 unit nilai. C02 tidak perlu transaksi dan biaya nol. Bukan alasan membeli saham tertentu atau bukti keuntungan pasar.

Metrik utama adalah memenuhi semua batas atau benar mendeteksi infeasible. Metrik kedua adalah biaya aktual minimum pada solusi feasible. Selisih biaya hanya dihitung pada solusi feasible. Tidak menilai AI berdasarkan kemampuan menebak aturan rahasia. Solusi berbeda dengan biaya sama diterima. Tujuan biaya murah dinyatakan terang-terangan dalam prompt.

## Paket pengujian terpisah

Ada 12 kasus terarah, tiga aset dengan harga berbeda, rentang alokasi, kas, biaya tetap/proporsional, izin jual dan batas sektor. Solver sesuai enumerasi 12/12, terdiri dari 9 feasible dan 3 infeasible. Kontrol penilai juga menguji keluaran solver dan respons kosong. Ini bukan hasil perbandingan model atau holdout independen. Kasus belum representatif untuk pasar nyata.

Prompt bahasa Indonesia di prompt.txt hanya memberikan kebutuhan pengguna dan data. Tidak menyertakan nama metode/paper, formula optimizer, source, contoh jawaban atau oracle. Format JSON hanya untuk penilaian otomatis. Tidak ada prompt khusus berisi langkah penyelesaian. Claude boleh memakai pendekatan sendiri. Tools dinonaktifkan. Model mungkin sudah mengetahui metode publik, tidak ada jaminan ketidaktahuan.

Jalankan dari folder proyek dengan

```bash
rtk proxy python3 validation/portfolio-method-02/benchmark.py --run-model
```

Respons dan penilaian disimpan dengan timestamp agar percobaan tidak tertimpa. File cases dan prompt dibekukan terhadap perubahan. Penilaian tanpa respons model tidak boleh diberi skor nol. Batas waktu inference 240 detik. Lingkungan agent masih gagal DNS, tercatat di access-check.json, sehingga belum ada hasil Claude untuk paket ini.

## Batas nilai produk

Metode ini lebih beralasan secara matematis daripada skor preferensi sintetis sebelumnya. Itu tidak membuktikan orang mau membeli, penjual memiliki IP unik, atau AI biasa tidak mampu menyamainya. Ini contoh pengujian akses metode, belum metode rahasia komersial. Formula yang ditemukan di internet tidak boleh dipasarkan sebagai rahasia milik kita. Pengujian keuntungan investasi tetap tidak dilakukan. Kerahasiaan runtime juga tidak dibuktikan di sini.


## 43. Pemulihan parser dan hasil metode kedua

Pengguna melaporkan JSONDecodeError setelah Claude selesai. Respons mentah sudah tersimpan pada `validation/portfolio-method-02/model-run-1794553358289888000.json`. Claude memberi kalimat pengantar, blok JSON dan penjelasan lanjutan. Parser lama hanya menangani JSON langsung atau fence di awal teks, sehingga gagal membaca jawaban yang sebenarnya lengkap. Ini kesalahan integrasi parser, bukan kegagalan menghitung metode atau koneksi.

Parser kini mengekstrak satu objek jawaban JSON lengkap dari teks, menerima pengantar/fence/penutup, menolak respons tanpa objek valid, struktur answers salah atau beberapa objek jawaban ambigu. Tidak memperbaiki angka, menebak jawaban atau memilih jawaban paling menguntungkan. Opsi `--grade-run` memungkinkan penilaian ulang file tersimpan tanpa panggilan API. Tiga tes regresi dengan beberapa variasi, termasuk respons aktual yang gagal, lolos. Respons mentah dipertahankan.

Penilaian ulang menghasilkan 12/12 benar untuk Claude dan 12/12 untuk metode. Sembilan solusi feasible memenuhi semua batas dan mencapai biaya minimum dengan selisih biaya nol terhadap oracle. Tiga kasus infeasible dikenali dengan benar. Claude memakai prompt kebutuhan biasa tanpa formula optimizer atau tools. Metadata melaporkan claude-opus-5-5, durasi 33,48 detik dan estimasi biaya daftar USD0,098144, bukan bukti tagihan tambahan langganan. Hasil tersimpan di model-grade-1794553358289888000.json.

Hasil seri berarti contoh metode kedua belum menunjukkan keunggulan kepatuhan atau biaya transaksi terhadap prompt biasa pada 12 kasus ini. Tidak ada bukti nilai tambah strategi privat dari eksperimen ini. Tidak menyimpulkan semua metode ahli tidak bernilai atau semua portofolio akan mudah ditangani. Kasus masih kecil/sintetis, satu model dan satu percobaan. Profit, efisiensi manusia, skala produksi dan privasi tidak diuji.

Skor hanya menilai transaksi/status serta biaya, bukan seluruh penjelasan bebas Claude. Ada kekeliruan penjelasan C12 yang mengatakan biaya menurunkan proporsi C ketika posisi C tetap. Dalam model ini, biaya menurunkan NAV sehingga proporsi C justru naik. Transaksi dan angka keluaran C12 tetap benar. Jangan menyebut 12/12 sebagai seluruh penjelasan akurat atau mengubah rubrik setelah hasil untuk mengklaim kemenangan metode.

Benchmark sudah berhasil dipulihkan tanpa meminta pengguna menjalankan ulang. Tidak mengubah formula, input atau kriteria penilaian. Paket README dan dokumen diperbarui untuk menggantikan status belum ada respons pada bagian sebelumnya.
