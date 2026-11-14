# Regenerasi PDF

Edit `pdf-pages.json` sesuai keputusan pada Markdown, lalu jalankan dari root workspace di macOS. Generator memeriksa teks yang melampaui halaman dan mengekstrak teks ke `/tmp/near-product-pdf-extracted.txt`.

```sh
rtk proxy clang -w -framework AppKit -framework CoreText -framework PDFKit document-tools/render-pdf.m -o /tmp/near-product-render
rtk proxy /tmp/near-product-render "$PWD/RANCANGAN_PRODUK.pdf" "$PWD/document-tools/pdf-pages.json"
```

Periksa cakupan dan tampilan PDF setelah regenerasi. Ringkasan tidak boleh mengubah status usulan menjadi keputusan.
