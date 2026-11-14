# Penelusuran penghalang privasi dan TEE

14 November 2026. Permintaan Dien adalah mencari alasan penggunaan backend dan penghalang pemenuhan rancangan. Social Money ditunda sementara. Ini hasil investigasi dan urutan kerja yang diusulkan, bukan persetujuan desain protokol baru.

## Kesimpulan

Tidak ada bukti bahwa OutLayer secara umum tidak mampu menjalankan layanan privasi yang dibutuhkan. Dokumentasi resmi menjelaskan HTTP WASI P2, encrypted storage dan encryption keys. Dukungan fitur pada deployment testnet Kalis belum dibuktikan lewat probe baru, dan tidak boleh dianggap sudah teruji hanya dari dokumentasi.

Backend tidak dipilih karena ada bukti TEE mustahil. Dokumen justru menunjukkan implementasi bertahap dengan pengecualian yang dinyatakan. Bagian 52 mempertahankan browser agent di backend. Bagian 65.1 secara eksplisit menyepakati dokumen publik diproses backend tanpa penyimpanan teks, dengan pembacaan dokumen privat dalam TEE sebagai pekerjaan berikutnya. Bagian 65.3 mengizinkan konektor mock dan menyatakan impor Office di perangkat lebih privat daripada konektor. Jangan menyebut semua penggunaan backend otomatis melanggar keputusan tersebut.

Alasan spesifik historis di luar yang tertulis tidak diketahui. Tidak ditemukan dasar untuk menyatakan bahwa semua kompromi dibuat karena deadline, biaya atau keterbatasan platform tertentu.

## Temuan yang terbukti dari source

| Bagian | Keadaan aktual | Penghalang atau pekerjaan yang diperlukan |
|---|---|---|
| Checkout | pay pada run-page.tsx otomatis mengirim semua field private ke protections/private-values. outbound.markPrivate menyimpan values melalui store.js | Bukan kebutuhan OutLayer. Ini desain deteksi outbound di backend. Harus berhenti mengirim plaintext tanpa menghilangkan pemeriksaan kiriman keluar |
| Runner | Hanya pubkey, run dan evaluate. Sandbox seller hanya menyediakan kalis.ai_chat. Host allowlist hanya cloud-api.near.ai | Tidak ada operasi memory, credentials, policy outbound atau dokumen. Tambahkan layanan yang dikendalikan platform, jangan beri jaringan bebas ke seller |
| Persistence | Runner belum memakai OutLayer storage SDK, WIT yang ada hanya signing keys | Perlu format record tersegel, namespace pengguna, revision dan anti-replay. Encrypted storage tersedia pada platform menurut docs, integrasi Kalis belum dibuat |
| Identitas | Backend menentukan principal. Semua callRunner memakai satu payment key server dan secretsRef project yang sama | Tidak boleh menganggap user isolation platform otomatis sama dengan akun pengguna Kalis. TEE perlu bukti otorisasi pemilik yang tidak dapat dipalsukan operator |
| Kredensial/konektor | Token diterima dan dibuka backend, kemudian fetch ke config.publicBase, default localhost | TEE jarak jauh tidak dapat memakai localhost komputer Dien. Perlu adapter mock dalam TEE atau endpoint yang dapat dijangkau, host allowlist dan hasil yang tetap terenkripsi |
| Memori | Note, source/history dan approval ada pada JSON backend | Pindahkan konten dan keputusan sensitif ke state tersegel dengan operasi bertanda tangan pemilik. Menaruh ciphertext saja tanpa otorisasi masih memungkinkan penyalahgunaan operasi |
| Outbound/browser | Isi, params, private-values dan persetujuan action_hash berada pada backend | Hash persetujuan, pemilik, tujuan, revisi dan expiry perlu diverifikasi di jalur tepercaya. Pihak tujuan yang memang diizinkan tetap menerima data yang disetujui |
| Dokumen | PDF teks memakai proses pdftotext, gambar lewat privateChat backend ke NEAR AI | pdftotext sebagai executable host tidak dapat langsung dipindahkan ke WASI component. Gunakan parser/rasterisasi di perangkat atau parser WASM, lalu input tersegel ke TEE. Dokumen publik boleh mempertahankan pengecualian yang disepakati |
| Trust upgrade | Runner key dilock pada build dan versi market mencatat runner_hash | Build baru, lock secret dan migrasi/publikasi versi harus dilakukan dengan otorisasi signing/spending/deploy yang sesuai, bukan mengganti hash diam-diam |
| Data lama | Backend mungkin memiliki private-values dan data proteksi yang sudah tersimpan | Perubahan jalur baru tidak menghapus salinan lama. Audit metadata dan migrasi/penghapusan perlu lingkup eksplisit, tanpa mencetak rahasia atau menghapus data sepihak |

Tidak ada probe berbayar atau perubahan kontrak dilakukan untuk investigasi ini. Ketersediaan SDK, host interface dan model dokumen pada worker testnet harus diverifikasi dengan probe terpisah.

## Status implementasi

Status per 15 November 2026. Migrasi dikerjakan Codex dan diselesaikan Claude. Semua bukti di bawah adalah **mode native development di satu mesin, bukan TEE**.

Jalur plaintext checkout sudah ditutup. run-page.tsx tidak lagi memanggil protections/private-values. Nilai private disimpan hanya di IndexedDB browser selama 24 jam untuk pemeriksaan outbound di perangkat. Proxy web menolak semua request ke api/protections/.

Lima perlindungan (credentials, memory, documents, outbound, browser agent) serta audit kini berjalan lewat protokol tersegel. Browser mengenkripsi setiap operasi ke kunci runner privat dan menandatanganinya dengan kunci perangkat yang tidak bisa diekspor. Backend hanya meneruskan ciphertext lewat POST /api/privacy/execute. Runner (app/kalis-runner/src/privacy.rs) memeriksa tanda tangan pemilik, revisi state dan nonce anti-replay, lalu mengembalikan hasil terenkripsi. Relay memakai ulang call OutLayer yang sama saat retry dan hanya menyimpan commitment serta output terenkripsi.

Bukti lokal. privacy-local-test.mjs 27 cek lulus, termasuk isolasi antar-pemilik, tanda tangan palsu ditolak, replay ditolak, PDF privat ditolak tanpa fallback plaintext, dan semua state tersimpan berupa ciphertext. privacy-http-test.mjs 13 cek relay lulus, termasuk endpoint plaintext lama ditolak. Regresi eksekusi portofolio lulus. Frontend build lulus dan 32 tes lulus (29 dan 3). Bukti browser (privacy-browser-test.mjs) menyimpan catatan berisi sentinel, reload, lalu memastikan sentinel tidak muncul di request mana pun, kunci perangkat non-extractable, dan tidak ada request ke endpoint lama. Hasil ada di audit/2026-11-14-private-migration/.

Yang belum saat itu, diperbarui oleh paragraf runner privat aktif di bawah. PRIVATE_RUNNER_HASH masih not-built, jadi belum ada build TEE yang di-attest dan dikunci. Dukungan storage/HTTP pada worker OutLayer testnet belum diprobe. Deploy runner privat, penguncian secret dan versi market memerlukan persetujuan Dien. Tanpa itu, halaman proteksi di deployment biasa menolak dengan private_runner_unavailable. Data lama di backend tidak dimigrasi atau dihapus. Kepemilikan data terikat ke satu browser, belum ada pemulihan atau multi-perangkat. Konektor di runner tetap mock berlabel. Dokumen publik tetap boleh diekstrak backend setelah opt-in eksplisit sesuai 65.1.

**Probe storage OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/storage-probe` (app/storage-probe, WASM `1ae28f54...`) memakai fungsi storage yang sama dengan runner privat. Call `6fb25965-de3b-4c85-9159-6207ebd6f00d` lulus enam langkah: key kosong terbaca kosong, set_if_absent berhasil, set_if_absent ulang ditolak, set_if_equals v1 ke v2 berhasil, set_if_equals dengan nilai basi ditolak, dan nilai terbaca v2. Call kedua `475453f1-2a40-448c-94ca-804faa3dc5d3` membaca v2, jadi data bertahan antar-eksekusi. Biaya compute 1000 per call. HTTP keluar dari TEE sudah terbukti sebelumnya (6.6 dan runner 0.5). Probe ini tidak menguji runner privat itu sendiri, kunci tersegelnya, atau batas ukuran storage.

**Runner privat aktif di OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/kalis-private`, build `457e260ccbb47381049266363c0f9c2fab5161f5c80fc439479dfe95e95d547e` (kalis-runner/0.6). `PROTECTED_SEAL_KEY` dibuat di dalam TEE dengan `--generate` dan dikunci ke build itu (profile `private`, whitelist `scientivan.testnet`). `NEAR_AI_API_KEY` disalin ke profile yang sama tanpa dicetak. Kunci publik TEE `685012c942a97e6d16266f6aefd00371d183b5fad120b2a1cdc315c9a096e959`, kunci tanda terima `0fc41697787c6c3623482a6726eecf8b148cb9ef9ccd9e7bac477c3ab93394a7` (call `47f7fc97-88d8-4514-8970-c90f2c92670d`). `PRIVATE_RUNNER_HASH` di backend dan web dipasang ke hash build ini. Backend mengaktifkan jalur TEE lewat `KALIS_PRIVATE_ENABLED=1`, `KALIS_PRIVATE_TEE_KEY` dan `KALIS_PRIVATE_RECEIPT_KEY` di `app/backend/.env` (gitignored).

Uji end-to-end `app/backend/scripts/privacy-remote-test.mjs` lewat relay backend ke TEE lulus 6 cek. Catatan berisi sentinel tersimpan (call `93e7ab28-f1af-4777-b619-1f1bfd02f142`), dibaca kembali pemiliknya di call terpisah (`86b804e5-db47-4289-b850-2487b3535ff2`), tidak terlihat oleh pemilik lain (`e2cfb716-4a08-432f-b2d0-cde15f79cec1`), dan revisi basi ditolak di dalam TEE. Setiap respons lolos pemeriksaan attestation terhadap build yang dipasang. Sentinel tidak muncul di request, respons, atau data backend. Uji ini hanya mencakup memory. Credentials, documents, outbound dan browser agent memakai jalur kode yang sama tetapi belum diuji satu per satu di TEE. Bukti browser terhadap TEE dan deployment web belum dilakukan. Data lama backend belum dimigrasi.

## Urutan perbaikan yang diusulkan untuk ditinjau

Pertama, tutup pengiriman otomatis private-values dari checkout. Untuk metode tanpa outbound, data tersebut tidak dibutuhkan backend. Untuk metode dengan outbound, pertahankan pemindaian dan persetujuan di perangkat sebagai langkah transisi, tanpa mengklaim perangkat saja bisa menegakkan perilaku operator jahat. Jalur TEE kemudian harus menjadi enforcement akhir. Jangan sekadar menghapus call lalu menyatakan perlindungan outbound tetap setara.

Kedua, bangun protokol operasi proteksi tersegel dengan identitas yang dibuktikan pengguna di dalam TEE, otorisasi terikat operasi/revisi/nonce dan respons terenkripsi ke pengguna. Persistence menggunakan ciphertext dan operasi atomik, dengan uji salah pemilik, replay dan rollback. Pemilihan mekanisme ownership serta anti-rollback perlu ditinjau sebelum implementasi.

Ketiga, port memory dan outbound, lalu credential connector dan dokumen privat sesuai dependensinya. Pertahankan batas publik/privat yang sudah disepakati, scoped operations dan larangan real trading. Agent HTTP tidak perlu berubah menjadi browser headless hanya untuk memenuhi privasi.

Keempat, buktikan lokal terlebih dahulu, lalu probe dan deployment testnet dengan persetujuan yang diperlukan. Keberhasilan unit test lokal bukan bukti TEE, sementara dokumentasi platform bukan bukti worker yang dipakai mendukung fitur.

## Kriteria bukti

Gunakan input sintetis sentinel dan rekam request yang meninggalkan browser. Sentinel tidak boleh muncul pada request backend biasa, log, database atau metadata. Buktikan bahwa grant/approval salah pemilik, hash berubah dan replay ditolak. Buktikan revoke dan expiry tetap berlaku, serta seller tidak mendapat token atau jaringan bebas.

Untuk setiap pemrosesan privat, cocokkan build yang di-attest, input/output commitment dan pinned version, lalu buka respons hanya di pemilik. Uji regression run serta outbound rejection, bukan hanya ciphertext terlihat acak. Jangan memperluas klaim Intel/NVIDIA certificate-chain verification yang belum lengkap.

## Sumber resmi dan batasnya

[OutLayer WASI](https://app.outlayer.ai/docs/wasi) menjelaskan WASI P2 HTTP dan host interfaces. [Storage](https://app.outlayer.ai/docs/storage) menjelaskan encrypted persistence dan caller namespaces. [Encryption keys](https://app.outlayer.ai/docs/encryption-keys) menjelaskan key binding dan raw sealed records. [HTTPS API](https://app.outlayer.ai/docs/https-api) menjelaskan payment-key caller dan network testnet.

Source utama Kalis ada di app/kalis-runner/src/main.rs, ai.rs, Cargo.toml dan wit/signing-keys.wit, app/backend/src/outlayer.js serta protections/*, dan app/web/src/components/run-page.tsx. Keputusan historis ada di rancangan bagian 52 dan 65.1–65.3.

Compliance gate NEAR tidak menemukan konflik pada investigasi dan persiapan lokal. Tidak ada signing, spending, deployment, upload data privat, penghapusan atau mutation backend.
