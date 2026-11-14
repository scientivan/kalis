# Pengujian lanjutan portofolio

13 November 2026. Data dan strategi seluruhnya sintetis. Tidak menguji keuntungan investasi dan tidak menjalankan transaksi.

## Hasil

| Klaim | Status | Bukti |
|---|---|---|
| Metode lebih baik daripada AI dengan prompt baik | Seri 42/42 (lihat bagian hasil nyata di bawah) | Status awal: probe CLI timeout tanpa jawaban. Diganti setelah pengguna menjalankan benchmark dari terminalnya |
| Operator tidak dapat membaca portofolio dan strategi pada prototipe sekarang | Gagal | Empat percobaan akses operator berhasil, termasuk observasi saat runtime |
| Privasi deployment TEE | Belum diuji | Belum ada deployment, kunci layanan yang tersedia pada environment yang diperiksa, atau attestation eksekusi ini |

Tidak adanya jawaban AI bukan skor nol dan bukan kemenangan metode. Kegagalan lokal bukan bukti bahwa TEE gagal atau bahwa privasi dua pihak mustahil dibangun.

## Percobaan privasi nyata

`test_claims.py` menjalankan subprocess terpisah dengan akses operator ke host Python biasa. Subprocess membaca input dan source, lalu memasang tracer saat fungsi strategi asli dijalankan. Tidak membutuhkan modifikasi fungsi strategi. Ini kemampuan operator yang mengendalikan host, bukan serangan remote atau eskalasi privilege.

Empat percobaan berhasil membaca file portofolio, membaca source strategi, menangkap portofolio pada runtime, dan menangkap parameter strategi pada runtime. Nilai sintetis yang tertangkap mencakup posisi [3,2,1], kas 4 dan preferensi strategi [3,2,1]. Solver tetap menghasilkan keluaran feasible. Bukti ada di `privacy-results.json`.

Prototipe memang belum memiliki isolasi rahasia. Uji ini memberikan bukti kegagalan kondisi saat ini, bukan audit menyeluruh. Hak pembeli vs penjual, serangan side-channel, kebocoran jaringan, inferensi strategi dari keluaran berulang dan TEE belum diuji. Menambahkan enkripsi penyimpanan saja tidak menyelesaikan observasi host saat data dibuka untuk komputasi.

## Pembandingan AI yang disiapkan

`prompt.txt` dibekukan sebelum menerima jawaban model. Seluruh 42 kasus dipakai, nama deskriptif seperti infeasible dihapus dari ID. AI mendapat seluruh formula strategi dan kendala yang sama dengan solver, termasuk biaya dan NAV sesudah biaya. Tidak ada answer key, solver source, tools, atau hasil solver dalam prompt.

Metrik utama adalah status benar, semua batas terpenuhi dan objective optimum dengan toleransi 1e-6. Solusi seri diterima. Metrik sekunder menghitung status benar atau transaksi feasible tanpa menuntut optimum. Grader telah diuji dengan keluaran solver yang benar pada 42 kasus, jawaban kosong, dan transaksi yang melanggar batas. Ini pengujian grader, bukan hasil AI.

Rencana awal satu respons berisi 42 kasus. Satu batch/model tidak mengukur stabilitas lintas model dan dapat terpengaruh panjang respons. Belum membandingkan AI dengan tools, waktu kerja manusia atau biaya per tugas valid. Kasus sintetis dibuat penulis metode, bukan holdout independen. Hasil kelak tidak boleh digeneralisasikan ke AI secara keseluruhan atau profit investasi.

Reproduksi uji lokal dengan `python3 validation/portfolio-method-01/followup/test_claims.py`. Ketika akses layanan model telah berfungsi, `--run-model` menjalankan inference CLI tanpa tools dan menyimpan respons asli serta penilaiannya. Pilihan model mengikuti konfigurasi CLI dan metadata aktual harus diperiksa saat pelaporan. Tidak ada benchmark model yang berhasil dijalankan dalam sesi ini.

## Syarat percobaan privasi berikutnya

Usulan arsitektur, belum implementasi atau keputusan stack final. Enkripsi portofolio dan strategi harus dilakukan di sisi pemilik masing-masing. Pelepasan kunci perlu terikat pada runtime serta kode yang diizinkan dan diverifikasi attestation-nya. Gateway/operator tidak boleh menerima plaintext. Hasil hanya untuk penerima yang berhak, dengan egress, logging dan akses kontributor dibatasi.

Uji deployment harus memeriksa penolakan attestation palsu/kedaluwarsa atau measurement berubah, penolakan recipient/key salah, ketiadaan plaintext di log/storage operator, penggantian kode, serta usaha strategi mengeluarkan data pengguna. Keberadaan attestation tidak membuktikan logika strategi aman atau bebas kebocoran. Memindahkan source privat ke WASM publik juga tidak memenuhi kerahasiaan kode.

[Dokumentasi OutLayer](https://app.outlayer.ai/docs/tee-attestation) menjelaskan pengikatan eksekusi pada hash WASM/input/output dan membatasi klaim attestation terhadap apa yang berjalan, bukan kejujuran kode. [HTTPS API](https://app.outlayer.ai/docs/https-api) membutuhkan payment key. Rujukan ini panduan kandidat infrastruktur, bukan hasil deployment produk kita. [Verifikasi NEAR AI](https://docs.near.ai/cloud/verification) juga harus dibedakan dari eksekusi solver Python privat, yang belum diintegrasikan.

## Percobaan ulang

Percobaan ulang benchmark penuh berakhir gagal setelah 173,6 detik. CLI melaporkan connection_failed dan DNS ENOTFOUND, dengan nol token input/output. Tidak ada jawaban atau skor AI. DNS kedua API gagal, curl Anthropic exit 6. Bukti ada di retry-network.json dan model-run.json. Jalankan `rtk proxy python3 validation/portfolio-method-01/followup/test_claims.py --model-only` dari workspace pada terminal yang memiliki koneksi dan autentikasi.


## 40. Hasil nyata pembanding AI setelah dijalankan pengguna

Pengguna menjalankan runner dari terminalnya dan memperoleh respons model sukses. Respons asli di `validation/portfolio-method-01/followup/model-run.json`, hasil penilaiannya di `model-grade.json`. Metadata CLI menyebut model `claude-opus-5-5`. Ini identitas yang dilaporkan runtime, bukan verifikasi eksternal nama/model. Tools dinonaktifkan oleh runner, model diberi seluruh aturan strategi dan kendala yang sama dengan solver, tanpa oracle.

### Hasil terverifikasi

| Pembanding | Benar dan optimum atau status benar |
|---|---|
| Metode berbasis solver | 42/42 |
| Claude dengan prompt lengkap, tanpa tools | 42/42 |

Terdiri dari 32 kasus feasible dengan objective optimum dan tanpa pelanggaran batas, 9 infeasible yang dikenali dengan benar, serta 1 input invalid. Assistant menghitung ulang penilaian dari respons mentah dan memastikan hasil sama dengan file grade. Hash prompt cocok dengan protokol. Respons berisi 42 ID kasus lengkap. Solusi seri dinilai berdasarkan objective, bukan harus identik dengan delta solver.

Durasi subprocess inference sekitar 84,99 detik untuk satu batch 42 kasus. Metadata CLI mencatat USD0,220036 sebagai estimasi biaya berdasarkan harga daftar, bukan bukti tagihan tambahan pada langganan pengguna. Ada 5.436 token pembuatan cache, 2 token input noncache dan 8.827 token output termasuk 7.736 thinking menurut metadata. Jangan membaca dua token input sebagai keseluruhan prompt. Tidak ada benchmark waktu kerja manusia atau perbandingan biaya infrastruktur yang setara.

### Implikasi terhadap pemilihan metode

Pada benchmark ini hasilnya seri. Klaim metode lebih akurat daripada prompting lengkap tidak didukung. Ini melemahkan alasan memilih contoh tiga aset sintetis ini sebagai bukti utama keunggulan metode. Tidak berarti seluruh produk gagal atau setiap kasus dunia nyata akan seri.

Prompt sengaja memuat aturan strategi lengkap untuk menguji pelaksanaan perhitungan secara adil. Eksperimen tidak menguji kemampuan AI menemukan strategi tersebut, akses legal ke strategi komersial, keunikan pengetahuan ahli atau kesediaan membayar. Jangan memakai perbedaan akses rahasia sebagai bukti keunggulan hitungan.

Batas pengujian tetap satu model, satu batch, 42 kasus sintetis tiga aset buatan penulis metode. AI dengan tools, stabilitas lintas percobaan, efisiensi manusia, portofolio realistis dan kemampuan privat belum diukur. Keuntungan investasi tetap tidak diuji sesuai arahan pengguna.

Usulan berikutnya adalah menetapkan terlebih dahulu pekerjaan target yang nyata dan ukuran efisiensinya, lalu menguji data representatif, konsistensi, waktu dan biaya pada prompt baik serta AI bertools. Jangan menambah kerumitan semata-mata sampai AI gagal atau memilih hasil yang menguntungkan. Jika tetap setara tanpa keunggulan operasional berarti, perbaiki atau ganti kandidat. Ini rekomendasi tindak lanjut, bukan persetujuan pengguna atas benchmark baru atau pemilihan demo final.
