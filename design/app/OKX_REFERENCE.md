> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Referensi Marketplace OKX AI

Dipilih Dien, 14 November 2026. Sumber https://www.okx.ai/agents dan https://www.okx.ai/agents/5537. Kajian HTML server-rendered dan CSS publik. Detail 5537 berhasil diambil melalui curl meskipun web reader gagal. Tidak ada pengujian klik, hover, scroll atau hasil transaksi melalui browser. Usulan berikut belum diterapkan.

## Katalog

Kartu merupakan tautan ke detail dan memuat gambar agent, nama, deskripsi, rating, proporsi ulasan positif, total terjual dan harga dengan satuan pemakaian. Filter kategori berada di atas daftar. CSS AgentCard membagi avatar dan nama/deskripsi dalam grid. Pada breakpoint yang lebih lebar, gambar memakai area sekitar 150 piksel, sedangkan mobile memakai 64 piksel. Statistik berada dalam baris yang sama, jenis pembayaran dan harga memiliki posisi tersendiri dengan harga didorong ke ujung. Radius kartu sekitar 6 piksel. Tidak mengasumsikan semua metadata OKX diperlukan di Kalis.

## Detail Asia Pulse

Identitas agent memuat gambar yang sama dengan katalog, nama dan deskripsi. Ringkasan memuat Score, Positive, Total Sold dan Agent ID. Gambar identitas dipakai kembali sebagai latar dengan blur 15 piksel dan opacity 0,2. Pada layar lebih lebar, CSS menetapkan area header identitas selebar 260 piksel. Deskripsi dibatasi beberapa baris dan HTML menyediakan View all. Hasil klik belum diuji.

Services mengemas setiap layanan dengan nama, uraian, jumlah terjual, harga per penggunaan dan Use now. CSS menaruh isi serta tindakan pada bagian yang konsisten melalui flex justify-content space-between. Deskripsi kartu dibatasi tiga baris, dengan varian bar yang membiarkan uraian penuh. Jangan mengasumsikan ini berarti semua deskripsi perlu disalin atau dipanjangkan di Kalis.

Reviews berada di halaman detail dengan skor agregat, jumlah ulasan, distribusi bintang serta entri berisi avatar, nama, waktu dan isi. CSS memisahkan ulasan dengan divider dan membatasi teks panjang. Explore More tampil setelah ulasan. Urutan ini membuat ulasan bagian dari evaluasi produk sebelum rekomendasi tambahan. Nilai nyata OKX tidak dipindahkan sebagai data Kalis.

## Penerapan yang diusulkan untuk Kalis

| Bagian | Arah |
| --- | --- |
| Gambar | Cover atau logo metode yang konsisten pada katalog dan detail. Foto pembuat hanya untuk identitas pembuat yang benar, bukan stok yang menyiratkan orang nyata |
| Katalog | Identitas gambar, nama, deskripsi pendek, pembuat, rating dan jumlah ulasan, harga/satuan dan tindakan dalam susunan berulang. Deskripsi dipotong dengan akses ke versi penuh di detail |
| Detail | Identitas dan ringkasan rating dekat judul. Deskripsi manfaat dan contoh hasil mendapat area jelas. Biaya dan tindakan konsisten, kebutuhan akses sebelum komitmen |
| Reviews | Ringkasan rating dan ulasan terlihat pada overview. Halaman Reviews tetap untuk membaca seluruh ulasan. Tampilkan versi yang dinilai dan pisahkan bukti uji |
| Interaksi | Seluruh area identitas kartu dapat menuju detail dengan fokus keyboard jelas. Filter punya status terpilih, hasil kosong dan pemulihan. View more untuk teks panjang dan keadaan tombol sesuai ketersediaan |
| Responsif | Gambar mengecil dan informasi ditumpuk mengikuti urutan baca. Hindari perubahan panjang teks yang membuat posisi harga/tombol antar kartu melompat |

OKX memisahkan agent dengan banyak services. Kalis saat ini menjual metode. Jangan menambah hierarki agent/services, subscription, persentase positif atau statistik penjualan tanpa kebutuhan dan data yang sah. Gunakan foto/cover untuk membantu mengenali metode, bukan memperbesar dekorasi. Palet Kalis tetap mengikuti preferensi pengguna, tema gelap OKX bukan keputusan baru.

Batas review ini adalah tidak ada render native atau interaksi yang terverifikasi. HTML/CSS mendukung observasi struktur dan aturan responsif, tetapi tidak membuktikan perilaku klik, dialog Use now, animasi atau sticky.
