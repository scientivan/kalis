# Domain dan hosting Kalis

Status terbaru 14 November 2026. Dien menunda deployment dan DNS. Jangan meminta ulang aktivasi selama pembahasan sinkronisasi dokumen dan Social Money. Persiapan di bawah disimpan untuk nanti.

Keputusan Dien, 14 November 2026. Nama domain memakai ejaan `calis`, sedangkan nama produk tetap Kalis.

| Tujuan | URL | Sumber |
|---|---|---|
| Landing page | https://calis.scientivan.dev | Proyek landing terpisah, belum dibuat dalam pekerjaan ini |
| Aplikasi | https://app.calis.scientivan.dev | `app/web` |

## Konfigurasi aplikasi

Gunakan proyek Vercel khusus aplikasi dengan framework Next.js. Jika mengimpor repo Product, set Root Directory ke `app/web`. Jika deploy dari CLI, jalankan dari folder `app/web`. Jangan mengatur keduanya sehingga path berulang. `vercel.json` menyediakan perintah install dan build. Tidak perlu basePath atau rewrite untuk memindahkan aplikasi ke subdomain. Halaman utama tetap marketplace dan seluruh path yang ada tetap berlaku.

Set variabel server `KALIS_BACKEND_URL` ke origin HTTPS backend yang dapat dijangkau Vercel, tanpa slash penutup. URL publik backend belum diberikan. Default kode `http://127.0.0.1:8787` hanya untuk development lokal dan tidak mengarah ke komputer Dien dari Vercel. Jangan memakai prefix NEXT_PUBLIC untuk rahasia. Backend tetap memerlukan host persisten sendiri beserta konfigurasi dan penyimpanan yang sudah ditetapkan backend.

Browser mengakses API melalui `/api/backend` pada origin aplikasi. Proxy meneruskan permintaan ke backend. Tidak diperlukan pemindahan browser ke origin API atau pelonggaran pemeriksaan origin.

## Domain dan DNS

Pemeriksaan read-only Vercel menemukan domain scientivan.dev di akun yang tersedia. Nameserver aktif adalah Cloudflare, boyd.ns.cloudflare.com dan eva.ns.cloudflare.com. Belum ada proyek Calis yang terlihat pada halaman pertama daftar proyek Vercel. Tidak ada proyek yang dibuat, domain yang dipasang atau record DNS yang diubah dalam pekerjaan ini.

Saat aktivasi, pasangkan hanya `app.calis.scientivan.dev` ke proyek aplikasi. Pasangkan `calis.scientivan.dev` ke proyek landing setelah landing siap. Jangan menambahkan domain apex scientivan.dev ke proyek ini karena sudah dipakai website utama.

Tambahkan record CNAME eksplisit di Cloudflare. Nama relatifnya adalah `app.calis` untuk aplikasi dan `calis` untuk landing. Ambil target masing-masing dari Settings → Domains pada proyek Vercel yang sesuai. Jangan menebak target atau menyalin target proyek lain. Gunakan DNS only saat verifikasi awal. Ikuti instruksi TXT jika Vercel meminta verifikasi kepemilikan. Kedua hostname harus tercantum eksplisit di Vercel, termasuk untuk penerbitan TLS.

Rujukan resmi [Vercel custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) dan [Vercel DNS](https://vercel.com/docs/domains/managing-dns-records).

## Verifikasi setelah aktivasi

Buka root aplikasi dan /marketplace pada HTTPS. Pastikan /api/backend/api/health memberi respons backend sehat, lalu periksa navigasi dan login tanpa menandatangani transaksi. Pastikan origin asing tetap ditolak pada mutasi API. Jangan menjalankan smoke berbayar tanpa otorisasi yang sesuai. Periksa landing menuju aplikasi lewat URL absolut https://app.calis.scientivan.dev.

Status saat ini adalah persiapan lokal. Aktivasi publik belum dijalankan. Bagian 52 rancangan mensyaratkan konfirmasi Dien sebelum deploy publik. Domain/DNS dan backend publik belum terverifikasi end-to-end.
