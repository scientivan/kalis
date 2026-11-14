# Paket uji metode 01

## Status dan batas

Paket siap untuk eksperimen, belum ada hasil model. Seluruh kasus sintetis. Metode C adalah kandidat prosedur, belum produk atau metode ahli terverifikasi. Kasus dibuat oleh assistant yang juga menyusun prosedur, sehingga ada risiko bias pembuat. Delapan kasus evaluasi terpisah secara file, bukan holdout independen yang benar-benar tidak pernah dilihat perancang. Setelah versi dibekukan, gunakan evaluator terpisah dan batch baru sebelum klaim umum.

## Tugas

Temukan ketidaksesuaian SKU/jumlah pada pesanan dan log, tahap pertama yang teramati, serta batas kesimpulan. Berikan bukti, tindakan berikutnya dan cara verifikasi. Ini menguji komponen diagnosis, belum keberhasilan seluruh framework atau pengurangan salah kirim di bisnis nyata.

## Susunan

- inputs/development memuat C01–C04 untuk menyetel metode dan prompt.
- inputs/evaluation memuat C05–C12 untuk evaluasi setelah pembekuan.
- evaluator/answer-key.json hanya untuk evaluator, jangan dikirim ke model peserta.
- prompts/shared-context.md diberikan ke semua lengan, diikuti prompt A, B atau C dan satu kasus.
- manifest.json menyimpan hash input, kunci dan prompt. Perubahan harus menghasilkan versi serta manifest baru.
- runs.csv adalah templat kosong, bukan hasil eksperimen.

## Pelaksanaan

Gunakan model/snapshot yang sama, parameter generasi sama, konteks baru per kasus dan batas total 12.000 token keluaran serta 180 detik per run. B dan C mendapat sandbox analisis lokal setara, tanpa jaringan. A tanpa alat. Semua mendapat data dan definisi identik. Kunci dan keluaran kasus lain tidak boleh masuk konteks. Jalankan setiap kasus evaluasi tiga kali per lengan, total 72 run. Acak urutan lengan. Catat timeout, kegagalan alat dan semua retry sebagai biaya, jangan membuang kegagalan dari hasil. Bila batas tidak cukup bagi seluruh lengan, ubah protokol sebelum run resmi dan ulangi seluruh perbandingan.

Bekukan prompt setelah pengembangan. Jangan menyetel C dari hasil evaluasi lalu menyebut batch yang sama holdout. Bila revisi diperlukan, versi berikutnya memerlukan batch evaluasi baru. Sediakan keluaran anonim kepada reviewer agar nama lengan tidak memengaruhi nilai. Semua data dummy, tidak memerlukan pengunggahan data privat nyata.

## Rubrik per run, total 100

Status benar 25, tahap pertama dan batas observasi benar 20, bukti yang tepat dan benar-benar mendukung 20, ketidakpastian/alternatif 15, tindakan proporsional 10, rencana verifikasi terukur 10. Untuk status dan tahap gunakan kunci. Kualitas bukti penuh jika semua fakta utama didukung ID yang tersedia, separuh jika dukungan parsial tanpa fabrikasi, nol jika bukti dibuat-buat. Untuk tiga dimensi terakhir beri penuh bila jelas serta sesuai kasus, separuh bila relevan tetapi kabur, nol bila salah/absen. Set bukti ekuivalen yang sah diterima, tidak wajib persis daftar kunci. Framework berbeda dapat sama-sama benar.

Kesalahan kritis adalah mengarang bukti, mengklaim akar penyebab pasti tanpa dukungan, atau menetapkan tahap pertama pasti ketika konflik/missing log membuatnya tidak diketahui. Mismatch pada ship dengan pack hilang boleh bila batas lokasi dijelaskan. Klaim barang fisik pasti benar dari log konsisten juga kritis. Menyarankan sanksi pada orang tanpa bukti adalah tindakan kritis. Evaluator mencatat alasan, bukan hanya skor AI. Penilaian AI saja tidak menjadi bukti final kualitas.

## Ambang awal yang diusulkan

C rata-rata minimal 90/100 pada 24 run evaluasi dan nol kesalahan kritis. Rata-rata kualitas serta jumlah status/tahap benar C sekurang-kurangnya setara masing-masing A dan B. Pengurangan total waktu aktif manusia minimal 50% dibanding A, tanpa kenaikan waktu manusia dibanding B. Tampilkan median dan total, hasil per kasus serta variasi tiga run. Sampel kecil hanya saringan awal, bukan signifikansi statistik atau akurasi populasi.

Waktu manusia mencakup persiapan, membaca, memeriksa dan memperbaiki jawaban. Gunakan orang dan instruksi yang sama dengan urutan diseimbangkan agar efek belajar tidak memenangkan lengan tertentu. Jangan mengganti waktu manusia dengan latency model atau estimasi buatan assistant. Jika belum diukur, tandai klaim efisiensi manusia belum teruji. Waktu membuat metode dicatat terpisah dan dialokasikan pada skenario volume penggunaan.

Catat semua token, biaya alat dan model, latency, retry dan biaya metode bila nanti ditetapkan. Tanpa harga metode final, laporkan biaya teknis saja. Tidak ada ambang biaya universal yang disahkan. Jika biaya meningkat, tampilkan harga tambahan per menit kerja yang dihemat sebagai pertimbangan, jangan otomatis menyebut layak dibeli.

## Keputusan

Lolos teknis mendukung pendalaman, bukan otomatis klaim produk efisien 50%. Klaim waktu membutuhkan pengukuran manusia. Bila C setara B, keunggulan atas AI bertools belum terbukti dan nilai yang mungkin tersisa adalah kemudahan alur, yang perlu diuji. Bila gagal, catat alasan dan revisi atau ganti kandidat. Kegagalan data tidak cukup bukan kegagalan metode bila ketidakpastian dilaporkan benar. Dampak operasional memerlukan data serta observasi sesudah intervensi di tahap lanjutan.
