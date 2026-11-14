> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Audit cakupan frontend terhadap rancangan produk

14 November 2026. Acuan seluruh bagian 0–61, termasuk bagian 55 tentang laporan eksekusi dan bagian 56 tentang escrow yang nomornya berulang. Urutan keputusan dan isi terbaru dipakai, bukan hanya nomor bagian. Bagian 6, 22 dan 31 yang digantikan tidak dijadikan kebutuhan metode demo baru. Riset pasar dan riwayat benchmark bukan fitur aplikasi baru.

Hasil awal audit menunjukkan frontend belum lengkap. Sesi ini menambah 23 rute workflow di flows.js serta tautan dari area terkait. Ini memperluas cakupan layar dan kontrol, bukan menyelesaikan integrasi produk. Jangan melaporkan semua fitur sudah berfungsi.

## Arti status

Interaktif sesi berarti kontrol mengubah state lokal tanpa backend. Draf berarti formulir dan catatan dapat disimpan serta dilihat, tetapi tidak mengeksekusi operasi yang dinamai. Viewer sintetis berarti contoh state berlabel yang dapat dipilih. Parsial berarti halaman ada tetapi alur atau data belum lengkap. Terbuka berarti dokumen belum menetapkan mekanismenya, sehingga tidak dibuat aturan produksi sepihak.

## Pemetaan kebutuhan

| Kebutuhan | Acuan bagian | Alamat frontend | Cakupan dan batas |
| --- | --- | --- | --- |
| Lima tujuan utama dan tiga tujuan akun | 55–57 | Shell index.html | Interaktif sesi, tanpa switch role |
| Login/onboarding | 51, 56 navigasi | account/start | Draf akses, belum autentikasi dan belum gerbang sebelum shell |
| Profil akun | 57 | account | Nama tampilan interaktif sesi |
| Profil pembuat dan keahlian | 45, 56, 59 | marketplace/creator | Draf, belum profil penjual terhubung ke listing |
| Katalog, kategori dan pencarian | 5, 45, 59 | marketplace | Interaktif, tiga penawaran contoh |
| Detail, input/output, batas dan harga | 5, 29–30, 59 | marketplace/{id} | Ada. Harga dan penjual belum terhubung |
| Rating dan jumlah ulasan | 44, 46, 59 | marketplace/{id}/reviews | Keadaan kosong jujur, bukan rating buatan |
| Menulis rating per versi dan konteks | 44, 46, 59 | marketplace/review | Draf dengan run reference dan persetujuan tanpa data privat. Belum verifikasi pembeli/publikasi |
| Portofolio, tender dan gaji | 45, 48, 50 | Tiga listing | Portofolio hasil historis, tender flow preview, gaji konsep |
| Metode milik penjual | 5, 56 | marketplace/mine | Draf sesi dan cover tersimpan |
| Pembuatan listing | 5, 21, 59 | marketplace/publish | Nama, deskripsi, input/output, akses, batas dan alokasi tersimpan |
| Harga penjual dan version manifest | 29–30, 52, 54 | marketplace/configure | Draf harga/hash/versi, belum registry atau publikasi |
| WASM dan parameter privat | 52 | marketplace/configure | Pemilihan metadata artifact dan nama parameter. Tidak membaca file atau mengumpulkan secret |
| Kode, manifest, runner dan parent hash | 47, 52, laporan 55 | marketplace/configure | Draf hash dan lineage, belum verifikasi |
| Model yang diizinkan penjual | 52 | marketplace/configure | Draf kebijakan private only atau private/proprietary |
| Modul terbuka, antarmuka dan inti privat | 21, 52 | marketplace/configure | Draf batas akses modul |
| Atribusi versi/kontributor | 7, 21, 47 | marketplace/configure, marketplace/{id}/versions | Draf dan viewer parsial, belum versi baru tercatat |
| Daftar pekerjaan dan hasil | 2, 56–57 | workspace, workspace/all, workspace/work/{id} | Interaktif sesi, hasil historis tidak dihitung ulang |
| Pekerjaan baru | 56–57 | workspace/new | Wizard menyimpan metode, nama dan batas sederhana |
| Input, PDF, scan, OCR, gambar, tabel, bahasa | 3, 49–50 | workspace/input | Pilihan format dan metadata file, belum upload/OCR/ekstraksi |
| Batas portofolio dan margin tender | 42, 48, 50 | workspace/input, workspace/new | Draf batas, belum solver baru |
| File privat | 3, 56 | workspace/files | Metadata contoh, belum penyimpanan terenkripsi |
| Memori, sumber dan persetujuan | 3, 49 | workspace/memory, activity/memory | Approval menambah catatan sesi, penghapusan sesi tersedia |
| Koreksi memori dengan provenance | 3 | workspace/memory-edit | Draf koreksi, belum diterapkan ke catatan asal |
| Pilihan model pembeli | 52 | workspace/model | Batas seller dibaca dari konfigurasi sesi, default private only |
| Peringatan proprietary, redaksi dan consent | 52 | workspace/model | Redaction plan dan consent wajib pada jalur proprietary. Tidak menjalankan privacy-filter |
| Konektor dan pembatasan kredensial | 3, 49 | connections, connections/scope | Toggle mock, draf scope/expiry, tidak mengumpulkan token |
| Browser domain dan aksi | 3, 49–50 | connections/scope, marketplace/configure | Draf domain/aksi. Belum browser backend |
| Pengiriman eksternal terikat isi/tujuan/revisi | 3, 11 | workspace/action-review, activity/outbound | Draf exact content dan keputusan, contoh approval tidak mengirim apa pun |
| Harga, infrastruktur dan maksimum pembayaran | 29–30, escrow 56 | workspace/checkout | Draf, validasi total dan alokasi. Bukan quote backend |
| Fiat top-up | 50 | balance | Mock interaktif, gagal/retry/cancel dan catatan top-up |
| Crypto | 50 | balance/crypto | Draf testnet request, tidak menghubungkan wallet/signing |
| Escrow per run | escrow 56 | balance/escrow | Viewer sintetis held/released/returned/timeout |
| Pengembalian tahap gagal dan reclaim timeout | escrow 56 | balance/escrow | Contoh fixture dan simulasi reclaim, bukan transfer |
| Pembagian seller/DAO/platform | 54 | Konfigurasi, checkout, escrow | Aturan 10% minimum DAO dan platform 10%. Dasar persentase tetap terbuka |
| Pendapatan, biaya dan distribusi | 30, 50, 54 | balance/earnings, balance/transactions | Top-up sesi tersedia, pendapatan/settlement masih kosong |
| Laporan tujuh tahap runner | laporan 55 | workspace/run | Viewer sintetis lengkap/gagal, belum membaca laporan tersegel |
| Langkah seller hilang/tidak berurutan | laporan 55 | workspace/run | Viewer sintetis missing step dan out-of-order |
| Cek ulang pembeli penuh/parsial/tidak tersedia | laporan 55, escrow 56 | workspace/run | Penjelasan scope, contoh pemeriksaan gagal dan no local checks, belum evaluator perangkat |
| Hash input/output/runner dan attestation | 51–52, laporan 55 | workspace/run | Contoh mismatch. Bukan verifikasi kriptografi |
| Peringatan hasil gagal dan no-solution | laporan 55, escrow 56 | workspace/run | Kegagalan ditampilkan, tanpa safe-to-use certification |
| Masalah metode dan reproduksi sintetis | 8–9, 23 | community/issues | Draf, belum issue publik |
| Proposal anggaran dan voting berwenang | 8, 23, 54 | community/proposals, community/vote | Draf dengan referensi authority, belum membership/quorum DAO |
| Bounty, scope, kriteria, evaluator dan tenggat | 23 | community/bounty/new | Draf lengkap, belum membuka bounty berpendanaan |
| Pengajuan patch, dampak dan kasus regresi | 21, 23 | community/submit | Draf kandidat, belum upload/PR atau perubahan kode |
| Izin terpisah kasus privat | 9 | workspace/test-consent | Draf scope, batas output, percobaan, expiry, consent terpisah training |
| Pencabutan izin kasus privat | 9, 18 | records/{id}, preferences/data | Interaktif sesi, bukan pencabutan akses pada server |
| Pengujian independen dan perbandingan | 9, 23 | community/testing, community/review | Draf request dan referensi report. Belum evaluator atau viewer report kandidat lengkap |
| Review menerima/menolak dengan alasan | 23 | community/review | Draf keputusan, bukan otorisasi penerimaan |
| Payout sekali sesudah penerimaan | 23 | community/payout | Draf acceptance/payment reference, belum enforcement satu pembayaran |
| Activity lintas area | 56 | activity dan tautan catatan workflow | Approval contoh interaktif, draf tambahan terlihat. Belum event history backend |
| Privasi, koneksi dan preferensi aksesibilitas | 56–57 | preferences, connections | Reduced motion dan mock connection interaktif |
| Retensi dan penghapusan | 18, 46 | preferences/data | Kebijakan produksi terbuka, tidak mengklaim server deletion |
| Trial, lisensi, royalti dan sengketa mutu | 5, 7, 18, 46 | Dicatat sebagai terbuka | Tidak menetapkan mekanisme atau janji. Escrow tahap gagal tetap berlaku sesuai keputusan terbaru |
| NFT, swarm dan metode historis digantikan | 6, 12–13, 22, 31 | Tidak ditambahkan | NFT ditolak. Swarm opsional. Eksperimen lama bukan fitur katalog wajib |

## Celah yang tetap harus dituntaskan

Halaman dan formulir di atas belum membentuk semua perjalanan yang utuh. Input/model/checkout/run belum satu objek run terintegrasi, meski metode terpilih dipertahankan dan konfigurasi seller dipakai untuk membatasi model. Catatan kontribusi memiliki tautan ke catatan sesi dan langkah berikutnya, tetapi belum state machine issue → budget → bounty → kandidat → test → acceptance → payout → versi baru. Memasukkan authority reference tidak memberikan kewenangan sebenarnya.

Seller profile dan konfigurasi manifest belum dipasangkan ke publikasi listing. Koreksi memori dan scope koneksi belum memperbarui state sumbernya. Login belum mendahului shell. Laporan yang benar-benar berasal dari backend, koneksi API, auth, file upload, enkripsi, attestation, evaluator, kontrak escrow dan DAO belum terhubung ke artifact design/app. Backend mungkin sudah mempunyai kemampuan tersebut, statusnya mengikuti BUILD_STATUS.md, bukan disimpulkan dari preview.

Karena itu hasil audit bukan “100% selesai”. Semua kelompok kebutuhan utama sudah punya pemetaan dan representasi layar, tetapi beberapa cakupan masih draf, viewer sintetis atau parsial. Artifact produksi Next.js yang disepakati juga belum digantikan oleh preview HTML ini.

## Verifikasi

Enam belas controller checks menggunakan DOM doubles lolos. Termasuk rute workflow, seller model boundary, consent proprietary, batas biaya/alokasi, escaping catatan, revoke permission dan fixture report/escrow. Sintaks diperiksa. Tidak ada verifikasi render browser atau audit WCAG menyeluruh. Reviewer independen menemukan celah perjalanan yang dicatat di atas, sehingga halaman kosong tidak dihitung sebagai fitur selesai.
