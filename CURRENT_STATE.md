# Kondisi produk dan rekonsiliasi dokumen

Audit 14 November 2026. Catatan ini menghubungkan keputusan Dien, implementasi, data runtime, dan batas bukti. Audit hanya membaca API serta website tanpa login. Tidak ada transaksi, seed data, mutasi backend atau perubahan fitur.

## Cara menentukan kebenaran

Aturan NEAR dan batas agent berlaku terlebih dahulu. Rancangan bagian 0 serta keputusan terbaru menetapkan perilaku yang disetujui. Kode dan runtime membuktikan perilaku aktual, bukan otomatis membatalkan keputusan. Bukti testnet lama tetap bukti pada versi dan tanggalnya. Perbedaan yang belum disepakati dicatat sebagai gap, bukan dijadikan keputusan baru.

Dokumen historis, riset dan benchmark dipertahankan sebagai riwayat. Daftar dokumen dan klasifikasinya ada di DOCUMENTATION_INDEX.md. Status aktif mengikuti catatan ini, BUILD_STATUS.md dan rancangan bagian 70.

## Produk sekarang

Kalis adalah marketplace metode privat, berupa program WASM atau prompt. Next.js di app/web adalah aplikasi aktif. design/app berisi prototipe lama dan referensi, bukan aplikasi backend saat ini. Backend Node ada di app/backend. Registry dan escrow aktif memakai market.scientivan.testnet. registry.scientivan.testnet adalah registry historis. Dana komunitas memakai kalis-fund.sputnik-v2.testnet, bukan multisig baru dan bukan NFT.

Runner aktif yang dikonfigurasi adalah 823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d. Metode dibuka dan dijalankan dalam OutLayer TEE, kode penjual memakai sandbox wasmi, dan AI privat memakai NEAR AI Cloud. Jalur model proprietary belum tersedia.

## Apa yang diperiksa langsung

| Pemeriksaan | Hasil dan batas |
|---|---|
| API lokal | GET health, capabilities, config, methods, community/config, dao, issues, proposals dan bounties berhasil |
| Website lokal | 14 halaman dibuka dengan Chrome headless pada port 3000, tanpa login |
| Proxy aplikasi | GET /api/backend/api/health berhasil dengan HTTP 200 |
| Katalog | Sembilan metode terdaftar dan delapan metode demo awal tetap tersedia |
| Modul browser | crypto.js, checks.js dan file-import.js identik byte per byte dengan sumber backend |
| Pemeriksaan lokal backend | checks-test.mjs tanpa URL menghasilkan 47 lulus, file-import-test.mjs tanpa URL menghasilkan 8 lulus |
| Build dan tes frontend | Hasil sesi yang sama sebelum perubahan dokumentasi adalah build berhasil dan 31 tes lulus |
| Tampilan | Tidak ada overflow horizontal pada 14 halaman dalam viewport browser audit. Screenshot Marketplace dan Fund diperiksa. Ini bukan audit mobile atau WCAG penuh |
| Alur uang dan otorisasi | Tidak dijalankan ulang. Pembayaran, publikasi, voting dan payout tetap memerlukan bukti transaksi atau verifikasi wallet yang sesuai |

Bukti tersimpan di audit/2026-11-14-doc-sync/. Snapshot berisi data publik dan teks halaman tanpa login. Waktu observasi ada di snapshot. Nilai saldo, jumlah record dan rating dapat berubah.

## Navigasi dan permukaan yang tersedia

| Area | Implementasi aktual | Batas bukti |
|---|---|---|
| Consumer | Marketplace → Methods, Jobs → Ongoing dan Results, Data → Connections, Documents dan Notes | Role hanya mengatur navigasi, bukan memberi izin |
| Author | Methods → Create dan Published | Label Create yang teramati menggantikan sebutan Drafts dalam sebagian catatan lama. Persetujuan perubahan istilah tidak disimpulkan dari kode |
| Kedua role | Community → Fund, Proposals, Bounties dan Issues, Activity → History | Account dan Sign out di menu wallet |
| Marketplace | Pencarian/filter, detail, expert, versi, review, input/check dan biaya | Rating testnet dapat berasal dari seed. Bukan bukti pelanggan atau mutu metode |
| Buyer | Form dari manifest, sumber input dan review, consent/quote, sealing, test top-up atau wallet request, async execution, bukti/cek lokal, settle, reclaim, rating | Kode tersedia. Alur wallet lengkap tidak diuji ulang dalam audit ini. Kunci jawaban hanya di memori tab |
| Seller | Editor lima langkah, manifest, harga/porsi DAO, file disegel di browser, validasi, wallet publication dan konfirmasi chain | Bukan lagi draft-only. Keberadaan editor bukan bukti setiap publikasi lewat browser berhasil |
| Data | Koneksi mock dengan scope/expiry/revoke, upload dan review dokumen, catatan/approval/edit/delete, impor Office lokal, sumber input | Jalur backend bisa membaca plaintext. Hanya sumber yang dideklarasikan manifest yang tersedia |
| Account | Profil/preferensi, riwayat pembayaran dan earnings | Tidak ada saldo kustodian atau fiat nyata |
| Community | Issue, proposal, vote request, claim, kandidat tersegel, uji privat, review, payout request dan publikasi versi kontribusi | Call unsigned harus ditandatangani wallet yang berwenang dan dikonfirmasi chain |

## Katalog yang teramati

| Method ID | Versi saat audit | Bentuk |
|---|---|---|
| portfolio-rebalance | 6 | WASM |
| salary-counteroffer | 3 | Prompt |
| tender-bid | 2 | WASM dan AI |
| defi-liquidation-guard | 1 | WASM |
| cash-runway-13w | 1 | WASM |
| supplier-concession-plan | 1 | Prompt |
| token-unlock-sell-plan | 1 | Prompt |
| term-sheet-dilution | 1 | Prompt |
| scientivanmsk-freelance-rate | 2 | Prompt |

Metode kesembilan dimiliki scientivanmsk.testnet. Keberadaannya terbukti dari API, bukan bukti run berbayar ulang dalam audit. Bukti delapan metode awal ada di BUILD_STATUS.md 6.18 dan merujuk versi yang ditulis di sana. Portofolio dan gaji pada tabel historis tersebut memakai receipt versi sebelumnya. Jangan mengklaim seluruh versi terbaru sudah diuji ulang.

## Batas privasi yang harus konsisten

Jalur run inti mengirim ciphertext ke runner dan mengembalikan jawaban terenkripsi. Ini tidak membuktikan semua alur website privat dari operator.

Riwayat audit 14 November, sudah diperbaiki pada migrasi 15 November (lihat bagian akhir). Temuan kode penting ada di run-page.tsx pada fungsi pay. Nilai input yang ditandai private dikirim sebagai plaintext ke POST protections/private-values sebelum pembayaran. outbound.markPrivate menyimpan nilai tersebut pada JSON backend melalui protections/store.js. Ini berlaku ketika field private terisi, termasuk metode yang tidak mendeklarasikan outbound. Karena itu klaim umum bahwa backend hanya pernah melihat ciphertext adalah salah untuk keseluruhan alur website saat ini. Penilaian ini berasal dari inspeksi kode, bukan pengiriman ulang data privat.

Riwayat audit 14 November. Koneksi, catatan, kiriman keluar, HTTP browser agent dan upload PDF/gambar saat itu juga diproses backend biasa. Impor .xlsx/.docx membaca file di perangkat, tetapi nilai yang kemudian dipilih untuk field private masih terkena jalur registrasi di atas. Teks ekstraksi dokumen dikembalikan sekali dan tidak disimpan sebagai teks dokumen oleh modul ekstraksi, tetapi tidak berarti salinan yang dipakai sebagai catatan, outbound atau private-values ikut dihapus.

Lima perlindungan tersedia sebagai fungsi backend, bukan lima perlindungan dalam TEE. Sertifikat Intel/NVIDIA belum diverifikasi mandiri. Prompt leak check menangkap salinan literal, bukan seluruh parafrase. Prompt mendapat verdict paling tinggi attention. Status safe di UI adalah hasil cek yang dinyatakan, bukan jaminan mutu atau audit keamanan.

Keputusan produk tetap menginginkan privasi dua pihak. Gap implementasi di atas belum diperbaiki dalam tugas dokumentasi dan tidak mengubah keputusan itu menjadi persetujuan penyimpanan plaintext.

## Dasar Social Money yang sudah ada

Pembayaran run ditahan market contract. Platform mengambil 10 persen, versi menetapkan bagian DAO minimal 10 persen dan penjual mendapat sisanya. Semua sembilan versi yang teramati memakai pembagian 80/10/10. Jangan menganggap pembagian 80/10/10 wajib untuk setiap versi mendatang.

Sukses tahap melepas pembayaran. Tahap gagal memberi refund. Setelah timeout, pembeli dapat meminta reclaim. Ini terpisah dari sengketa kualitas hasil yang masih terbuka.

Dana memakai Sputnik DAO. Saat audit council berisi scientivan.testnet, dengan proposal bond dan bounty bond masing-masing 1 NEAR testnet. Ini konfigurasi demo satu anggota, bukan bukti tata kelola komunitas yang terdistribusi.

Issue, acceptance criteria dan evaluator dicatat backend. Proposal AddBounty dan keputusan uang berlangsung lewat DAO di chain. Kandidat tidak boleh mengganti evaluator. Uji privat membandingkan baseline dan kandidat di TEE pada field yang ditetapkan, dengan izin kandidat, expiry dan batas percobaan. Hasil membuktikan kecocokan pada field/kasus tersebut, bukan otomatis kualitas baru atau dampak dunia nyata.

Backend menolak self-review dan meminta council untuk review. Konfigurasi memiliki reviewer yang ditunjuk, tetapi handler review saat ini mengizinkan anggota council selain kontributor, bukan hanya reviewer yang ditunjuk. Ini gap antara label reviewer dan enforcement yang perlu keputusan atau perbaikan terpisah.

Payout membutuhkan kandidat accepted, permintaan BountyDone dan persetujuan DAO. Pembuatan unsigned call bukan pembayaran selesai. Proteksi replay dan satu payout request per bounty ada pada adapter backend. Market contract tidak menegakkan seluruh aturan review DAO untuk publikasi langsung oleh pemilik.

Bounty lama yang tidak mempunyai proposal_link/evaluator lokal diberi label tidak dapat diuji di aplikasi. Saat audit tiga bounty yang ditampilkan memiliki batas ini. Jangan menyebut ketiganya siap untuk alur kontribusi privat. Bounty 0 menyimpan teks historis rtk make pada chain dan tidak diubah.

Royalti kontributor, pemeringkatan beberapa pengklaim dan sengketa penolakan masih terbuka. Pencabutan grant ketika uji berjalan menahan hasil pada implementasi, tetapi keputusan policy itu sebelumnya masih ditandai usulan. Tetap catat sebagai perilaku kode yang belum otomatis menjadi persetujuan produk.

## Pertentangan yang direkonsiliasi

| Catatan lama | Hasil rekonsiliasi |
|---|---|
| Opsi B gagal atau belum berjalan di testnet | Kendala historis. Bukti sukses 6.8 dan setelahnya tetap berlaku |
| Frontend mock-only atau belum terintegrasi | Digantikan aplikasi Next.js dengan route backend utama |
| Seller hanya membuat draft dan tidak ada signing UI | Digantikan seller-editor dan WalletReview, verifikasi wallet penuh tetap terpisah |
| DAO/bounty dan lima perlindungan belum dibuat | Implementasi dan bukti historis tersedia, dengan batas backend/TEE yang dijelaskan |
| Gaji hanya ilustrasi, tender belum dibuat | Keduanya punya metode aktif dan bukti historis |
| Jumlah metode selalu delapan | Snapshot runtime sekarang sembilan, jangan jadikan hitungan tetap sebagai invariant |
| Hash runner lama sebagai build aktif | Build aktif konfigurasi dan sembilan versi adalah 823e99… |
| Platform tidak dapat melihat data dalam semua alur | Ditolak sebagai klaim implementasi umum. Privasi inti dibatasi dan gap private-values dicatat |
| Royalti/kontributor atau inovasi Social Money sudah final | Tidak. Fitur baru dan policy belum disepakati |
| Proyek sudah deployed di Vercel | Hanya rencana dan konfigurasi lokal. Deployment ditunda Dien |

## Langkah setelah sinkronisasi

Dien meminta eksplorasi inovasi Social Money setelah audit ini, berdasarkan mekanisme di atas. Belum ada fitur baru dipilih atau diimplementasikan. Pisahkan ide produk baru dari gap verifikasi, keputusan policy dan bug implementasi. Deployment serta DNS tetap ditunda. Compliance gate NEAR tidak menemukan konflik pada audit dan dokumentasi, dan klaim README dibatasi sesuai Q-017.


## Prioritas terbaru dan koreksi pengecualian privasi

Dien meminta investigasi penghalang privasi sebelum Social Money. Hasil ada di PRIVACY_TEE_INVESTIGATION.md dan rancangan bagian 71. Tidak semua backend otomatis melanggar keputusan. Browser agent backend tercatat pada bagian 52, dokumen publik backend disepakati pada 65.1, dan mock connector backend diakui pada 65.3. Masalah utama tetap field private checkout dan jalur yang harus memenuhi privasi operator. Platform mendokumentasikan kemampuan yang diperlukan, tetapi Kalis belum mengintegrasikan owner proof, state tersegel dan operasi proteksi pada runner. Dukungan worker testnet belum diprobe ulang. Tidak ada perubahan kode atau deployment.

## Migrasi privasi 15 November 2026

Status per 15 November 2026. Migrasi dikerjakan Codex dan diselesaikan Claude. Semua bukti di bawah adalah **mode native development di satu mesin, bukan TEE**.

Jalur plaintext checkout sudah ditutup. run-page.tsx tidak lagi memanggil protections/private-values. Nilai private disimpan hanya di IndexedDB browser selama 24 jam untuk pemeriksaan outbound di perangkat. Proxy web menolak semua request ke api/protections/.

Lima perlindungan (credentials, memory, documents, outbound, browser agent) serta audit kini berjalan lewat protokol tersegel. Browser mengenkripsi setiap operasi ke kunci runner privat dan menandatanganinya dengan kunci perangkat yang tidak bisa diekspor. Backend hanya meneruskan ciphertext lewat POST /api/privacy/execute. Runner (app/kalis-runner/src/privacy.rs) memeriksa tanda tangan pemilik, revisi state dan nonce anti-replay, lalu mengembalikan hasil terenkripsi. Relay memakai ulang call OutLayer yang sama saat retry dan hanya menyimpan commitment serta output terenkripsi.

Bukti lokal. privacy-local-test.mjs 27 cek lulus, termasuk isolasi antar-pemilik, tanda tangan palsu ditolak, replay ditolak, PDF privat ditolak tanpa fallback plaintext, dan semua state tersimpan berupa ciphertext. privacy-http-test.mjs 13 cek relay lulus, termasuk endpoint plaintext lama ditolak. Regresi eksekusi portofolio lulus. Frontend build lulus dan 32 tes lulus (29 dan 3). Bukti browser (privacy-browser-test.mjs) menyimpan catatan berisi sentinel, reload, lalu memastikan sentinel tidak muncul di request mana pun, kunci perangkat non-extractable, dan tidak ada request ke endpoint lama. Hasil ada di audit/2026-11-14-private-migration/.

Yang belum saat itu, diperbarui oleh paragraf runner privat aktif di bawah. PRIVATE_RUNNER_HASH masih not-built, jadi belum ada build TEE yang di-attest dan dikunci. Dukungan storage/HTTP pada worker OutLayer testnet belum diprobe. Deploy runner privat, penguncian secret dan versi market memerlukan persetujuan Dien. Tanpa itu, halaman proteksi di deployment biasa menolak dengan private_runner_unavailable. Data lama di backend tidak dimigrasi atau dihapus. Kepemilikan data terikat ke satu browser, belum ada pemulihan atau multi-perangkat. Konektor di runner tetap mock berlabel. Dokumen publik tetap boleh diekstrak backend setelah opt-in eksplisit sesuai 65.1.

Setelah migrasi ini, langkah berikutnya adalah build dan probe runner privat di OutLayer testnet dengan persetujuan Dien, lalu deployment yang ditunda. Eksplorasi Social Money menyusul.

**Runner privat aktif di OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/kalis-private`, build `457e260ccbb47381049266363c0f9c2fab5161f5c80fc439479dfe95e95d547e` (kalis-runner/0.6). `PROTECTED_SEAL_KEY` dibuat di dalam TEE dengan `--generate` dan dikunci ke build itu (profile `private`, whitelist `scientivan.testnet`). `NEAR_AI_API_KEY` disalin ke profile yang sama tanpa dicetak. Kunci publik TEE `685012c942a97e6d16266f6aefd00371d183b5fad120b2a1cdc315c9a096e959`, kunci tanda terima `0fc41697787c6c3623482a6726eecf8b148cb9ef9ccd9e7bac477c3ab93394a7` (call `47f7fc97-88d8-4514-8970-c90f2c92670d`). `PRIVATE_RUNNER_HASH` di backend dan web dipasang ke hash build ini. Backend mengaktifkan jalur TEE lewat `KALIS_PRIVATE_ENABLED=1`, `KALIS_PRIVATE_TEE_KEY` dan `KALIS_PRIVATE_RECEIPT_KEY` di `app/backend/.env` (gitignored).

Uji end-to-end `app/backend/scripts/privacy-remote-test.mjs` lewat relay backend ke TEE lulus 6 cek. Catatan berisi sentinel tersimpan (call `93e7ab28-f1af-4777-b619-1f1bfd02f142`), dibaca kembali pemiliknya di call terpisah (`86b804e5-db47-4289-b850-2487b3535ff2`), tidak terlihat oleh pemilik lain (`e2cfb716-4a08-432f-b2d0-cde15f79cec1`), dan revisi basi ditolak di dalam TEE. Setiap respons lolos pemeriksaan attestation terhadap build yang dipasang. Sentinel tidak muncul di request, respons, atau data backend. Uji ini hanya mencakup memory. Credentials, documents, outbound dan browser agent memakai jalur kode yang sama tetapi belum diuji satu per satu di TEE. Bukti browser terhadap TEE dan deployment web belum dilakukan. Data lama backend belum dimigrasi.
