# Regenerasi PDF

Edit `pdf-pages.json` sesuai keputusan pada Markdown, lalu jalankan dari root workspace di macOS. Generator memeriksa teks yang melampaui halaman dan mengekstrak teks ke `/tmp/near-product-pdf-extracted.txt`.

```sh
rtk proxy clang -w -framework AppKit -framework CoreText -framework PDFKit document-tools/render-pdf.m -o /tmp/near-product-render
rtk proxy /tmp/near-product-render "$PWD/RANCANGAN_PRODUK.pdf" "$PWD/document-tools/pdf-pages.json"
```

Periksa cakupan dan tampilan PDF setelah regenerasi. Ringkasan tidak boleh mengubah status usulan menjadi keputusan.


## Status ringkasan PDF

Sinkronisasi 14 November 2026 memperbarui cover menjadi kondisi terkini versi 1.32 dan menambah ringkasan audit serta dasar Social Money. Halaman lama dipertahankan sebagai riwayat. Status terbaru mengikuti cover, Markdown bagian 0/70 dan ../CURRENT_STATE.md. Hasil regenerasi terbaru 15 November 2026 adalah 75 halaman tanpa overflow, dengan cover versi 1.34 dan halaman 75 tentang perubahan sesi 15 November (bagian 73).
