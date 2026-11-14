# Cakupan frontend terkini

Sinkronisasi 14 November 2026. Menggantikan matriks status sebelum integrasi. Acuan keputusan ada di ../../RANCANGAN_PRODUK.md bagian 0 dan 70. Bukti dan pertentangan lengkap ada di ../../CURRENT_STATE.md.

| Area | Route atau komponen | Tersedia pada kode | Verifikasi sekarang |
|---|---|---|---|
| Katalog | /marketplace, marketplace-next.tsx | Pencarian/filter, rating, expert, price, manifest | Browser tanpa login menampilkan katalog, GET methods berisi sembilan metode |
| Detail dan expert | method-detail.tsx, version-evidence.tsx | Overview, Inputs, Checks, Versions, Reviews dan bukti versi | Source audit, belum klik semua tab dalam audit |
| Jobs | /runs/ongoing, /runs/results, app-pages.tsx | Daftar paginated, fase, approval di Ongoing, hasil pembayaran | Halaman tanpa login terbuka. Daftar akun terautentikasi tidak diuji ulang |
| Buyer | /runs/new dan /runs/id, run-page.tsx | Input, provenance/review, consent, quote, model narrowing, sealing, demo/wallet payment, idempotency/recovery, async polling, output/checks/proof, settlement/reclaim/rating | Kode tersedia, bukti run historis terpisah. Tidak melakukan pembayaran ulang |
| Seller | /marketplace/publish, /marketplace/mine, seller-editor.tsx | Create/draft, lima langkah editor, manifest, harga/DAO, sealing, validation, wallet signing dan chain confirmation | Sign-in gate terlihat. Publikasi wallet penuh belum diuji ulang |
| Connections | /connections, data-tools.tsx | Create mock credential, scope/expiry, revoke, use | Halaman terbuka, mutasi tidak dijalankan |
| Documents | /workspace/files | Upload, extraction review, metadata/detail | Halaman terbuka, tidak upload atau memanggil AI |
| Notes | /workspace/memory | Propose, review, edit/delete dan recall | Halaman terbuka, mutasi tidak dijalankan |
| Fund | /community | Treasury, available funds, council/policy | Browser dan GET dao/community config berhasil |
| Proposals | /community/proposals | Form fixed criteria/evaluator/reviewer, unsigned request, wallet vote | List tanpa login terbuka. Tidak menandatangani proposal/bond/vote |
| Issues | /community/issues | Create, detail, close, link proposal | List tanpa login terbuka. Tidak membuat data |
| Bounties | /community/bounties | Claim, contribution package, sealed candidate, tests, review, payout dan version request | List terbuka. Bounty legacy tanpa evaluator tidak dapat diuji melalui app |
| Private tests | community-workspace.tsx | Sealed case, separate grants, attempt/expiry/revoke, report | Kode tersedia dan runner punya bukti historis. Tidak menjalankan uji berbayar |
| Account | /account, account-tools.tsx | Profile/preferences, payment history/earnings | Halaman tanpa login terbuka, tidak edit profil |
| Activity | /activity | Feed dan history | Halaman tanpa login terbuka |
| Legacy | /connected dan fallback KalisApp | Backend surface dan toggle mock lama | Bukan route utama desain baru dan bukan sumber bukti produksi |

Build sesi ini sebelum perubahan dokumentasi berhasil, 31 tes frontend lulus. crypto.js, checks.js dan file-import.js identik dengan modul backend. Browser audit mencakup 14 halaman pada viewport default, bukan E2E wallet, mobile penuh atau sertifikasi aksesibilitas.

Batas kritis yang tidak boleh disembunyikan oleh status cakupan adalah registrasi plaintext field private ke protections/private-values saat pay. Seluruh lima perlindungan berjalan di backend biasa. File Office dibaca lokal, tetapi data hasilnya dapat lewat jalur plaintext tersebut. Lihat CURRENT_STATE.md untuk data flow dan keputusan yang belum selesai.

Tidak ada saldo kustodian, fiat nyata, model proprietary, royalti atau policy sengketa final. Role Consumer/Author hanya navigasi. Status capability dan unsigned call tidak membuktikan transaksi selesai.
