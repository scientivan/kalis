> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Prompt untuk Codex: bangun ulang frontend Kalis di Next.js

Salin seluruh isi di bawah garis ini ke Codex.

---

Kamu mengerjakan frontend Kalis di `Product/app/web` (Next.js App Router, TypeScript). Kalis adalah marketplace metode privat untuk NEAR Hackathon 2026. Seorang ahli menjual metode (program WASM atau prompt) tanpa membukanya. Pembeli menjalankan metode itu atas data sensitifnya tanpa membuka data tersebut. Metode berjalan di TEE OutLayer, AI-nya model privat NEAR AI Cloud yang teratestasi, dan pembayaran ditahan di escrow kontrak NEAR lalu dibagi ke penjual, dana komunitas (Sputnik DAO), dan platform hanya bila semua tahap run berhasil. Deadline submission 14 November 2026 23:59 UTC. Semua berjalan di NEAR testnet.

Pembagian kerja: kamu memegang `app/web` saja. Backend (`app/backend`), runner, kontrak, dan metode milik Claude Code. Jangan mengubah file di luar `app/web`. Bila butuh endpoint atau data yang belum ada, tulis kebutuhannya di `app/web/BACKEND_REQUESTS.md` dan lanjutkan dengan state "unavailable" yang jujur, jangan membuat data atau endpoint palsu.

## 1. Baca dulu, berurutan, sebelum menulis kode

1. `Product/AGENTS.md`, `../NEAR.md` (aturan hackathon dan Compliance gate, laporkan hasil cek gate di setiap laporanmu).
2. `Product/FRONTEND_GUIDE.md`. Ini **aturan yang mengikat** untuk UX, visual, palet, font, layout, animasi, peta navigasi, dan wording. Bila bertentangan dengan dokumen lama (termasuk `design/app/DESIGN.md`, draf Corbel, batik, HelloNear, atau kode `app/web` yang ada), FRONTEND_GUIDE.md yang menang.
3. Mock acuan yang sudah disetujui Dien: `Product/design/app/marketplace-luno-crypto.html`. Buka di browser. Tiru struktur, token warna, komponen, dan perilakunya untuk halaman Marketplace, lalu turunkan pola yang sama ke halaman lain.
4. `Product/app/backend/API.md`. Kontrak semua endpoint. Bagian penting: Buyer flow, Runs (draft, quote, idempotency, async execute, events, reclaim), Method kinds, Manifest v5 and buyer checks, Five protections, Connectors, Document text retention, File import, Ratings, Transactions and activity, Sign in with a NEAR account (NEP-413), Seller publication, Preflight and run evidence, Community, Private test cases, Contribution package, Run-bound protections.
5. `Product/app/methods/MANIFEST_V5.md`. Skema manifest. Form input dan tampilan hasil **dibuat otomatis** dari `inputs.fields`, `outputs.fields`, dan `buyer_checks`, tidak ditulis tangan per metode.
6. `Product/README.md` bagian "Limits" dan `Product/BUILD_STATUS.md` 6.13 sampai 6.18 untuk apa yang sudah terbukti di testnet.

Kode `app/web` yang ada sekarang ditulis sebelum backend berubah besar. Pakai ulang yang masih benar (proxy `src/app/api/backend/[...path]/route.ts` dengan allowlist dan cek Origin, modul kripto browser `src/lib/backend/crypto.js` yang harus tetap identik dengan `app/backend/src/kalis-crypto.js`), tetapi tampilan dan struktur halaman dibangun ulang sesuai FRONTEND_GUIDE.md.

## 2. Aturan desain yang tidak boleh dilanggar

Ringkasan dari FRONTEND_GUIDE.md. Baca file aslinya untuk detail.

1. Tema terang saja. Latar `#F4F4F4`, kartu `#FFFFFF`, teks `#101010`, aksen utama biru listrik `#0038FF`. Jangan ada latar gelap, juga saat sistem pengguna dark mode (`color-scheme: light`).
2. Font **Inter saja**, semua variasi 100 sampai 900, dimuat lewat `next/font/google` (`Inter({ subsets: ["latin"], weight: "variable", display: "swap", variable: "--font-inter" })`). Jangan memakai SF Pro, Nunito, Geist, atau font lain. Teks biasa minimal 500. Thin, ExtraLight, dan Light hanya untuk teks display 32px ke atas.
3. Jangan pernah memakai em dash dan bullet point di UI. Jangan memakai ":" untuk menjelaskan kalimat sebelumnya. Jangan menaruh label kecil di atas judul.
4. Tidak boleh ada teks mengambang. Semua teks informasi berada di dalam elemen (kartu, panel, baris, chip, note card), termasuk judul halaman.
5. Elemen yang bersebelahan dalam satu baris harus sama tinggi dan ujung bawahnya sejajar. Kolom yang lebih pendek direnggangkan, footer atau blok terakhirnya ditempel ke dasar dengan `margin-top: auto`.
6. Gaya Luno Crypto: sidebar 280px berwarna sama dengan halaman, kelompok menu dalam kotak dashed radius 12px, **ikon duotone di setiap item menu** dan di sebagian besar baris informasi, kartu putih border 1px dashed radius 12px tanpa bayangan saat diam, header 74px dengan garis putih 4px, breadcrumb biru, kartu statistik dengan glyph biru besar, kartu metode bergaya kartu koin dengan warna identitas per metode, strip kategori horizontal, tabel yang setiap barisnya kartu dashed, kartu form dengan label menempel di dalam input.
7. Warna identitas metode memakai aksen keras dengan teks atau ikon hitam di atasnya: oranye `#FF5F04`, pink `#FF77CD`, butter `#FEE897`, periwinkle `#9FA9F5`, merah `#F44A32`, dan biru `#0038FF` dengan ikon putih. Tidak ada gradien, glass, atau glow.
8. Animasi harus bermakna dan berhenti sendiri: halaman fade in, trek langkah metode tergambar balok demi balok (satu balok per langkah di manifest, tinggi sama, bukan grafik nilai), kartu terangkat saat hover, titik berdenyut beberapa kali untuk persetujuan yang menunggu. Semua mati bila `prefers-reduced-motion`.
9. WCAG 2.2 AA: kontras teks minimal 4.5:1, focus ring biru 3px, semua kontrol bisa dipakai dengan keyboard, label di setiap input, `aria-current` di menu aktif.
10. Skala halaman aplikasi kecil: judul halaman 22 sampai 24px, judul kartu 15 sampai 17px, isi 13 sampai 15px, kontrol 38px. Tombol aksi besar 50px.

## 3. UX dan navigasi

Pakai bahasa umum yang bisa dibayangkan orang awam. Semua kegiatan harus terjangkau dari navbar. Halaman yang informasinya berkaitan erat digabung. Peta navigasi wajib (detail di FRONTEND_GUIDE.md bagian 4):

| Kelompok | Item |
|---|---|
| Use methods (Find one and run it on your data) | Marketplace, My runs, Waiting for my approval |
| Your private data (What methods may read, under your control) | Connected apps, Documents, Saved notes |
| Sell and improve (For experts and contributors) | My methods, Community fund, Paid improvements |
| Account (Profile, payments and history) | Account and balance, Activity |

Alur pembeli yang harus mulus dan nyata (bukan mock):

1. Marketplace menampilkan metode dari `GET /api/methods` (sembunyikan yang `listed: false`). Kartu dan tabel menampilkan bentuk metode dari `version.method_kind`, jumlah langkah dari `manifest.steps`, jumlah cek dari `manifest.buyer_checks`, harga dari `version.price_amount`, penjual demo dari `manifest.listing.seller`, rating dari `GET /api/methods/:id/rating-summary` ("No ratings yet" bila average null).
2. Detail metode: listing (outcome, urgency, limits, sample_output, not_advice), langkah, model AI, izin (konektor, dokumen, tujuan kirim, memori, browser), cek pembeli, riwayat versi dengan parent dan kontributor, bukti uji (`/versions/:n/evidence`), ulasan.
3. Persiapan data: form dari `manifest.inputs.fields`. Sumber nilai sesuai `source`: ketik, konektor (`POST /api/protections/credentials/:id/use` dengan `run_id` bila sudah ada), impor file di perangkat (`GET /file-import.js`, file tidak pernah diunggah), dokumen (`POST /api/protections/documents`, dengan peringatan bahwa backend melihat dokumen), memori (`/api/protections/memory/recall`). Nilai bertanda `private` ditandai di UI dan didaftarkan ke `POST /api/protections/private-values`.
4. Draft, consent, dan quote: `POST /api/run-drafts`, `POST /api/run-drafts/:id/consents` (wajib `prompt_method_nature` untuk metode prompt), `POST /api/run-drafts/:id/quote`. Tampilkan harga metode, deposit storage, biaya infrastruktur (0, dibayar platform), batas gas, dan dasar pembagian 80/10/10.
5. Segel di browser (`sealData` dari modul kripto), lalu bayar: `POST /api/runs` dengan `quote_id` dan `idempotency_key`. "Test top-up (no real money)" untuk `demo_topup`, atau wallet NEAR (NEAR Wallet Selector, testnet) menandatangani `contract_call`. Jangan pernah mengulang pembayaran otomatis; pakai `GET /api/operations/:id` untuk pemulihan.
6. Jalankan: `POST /api/runs/:id/execute` dengan `async: true`, poll operasi, tampilkan `GET /api/runs/:id/events` sebagai trek langkah yang menyala.
7. Buka jawaban di perangkat (`openAnswer`), jalankan `runChecks(manifest, input, answer)`, tampilkan setiap cek (pass, fail, cannot_check, not_applicable), bukti panggilan AI (`report.ai_calls`), dan verdict dari `runVerdict` ("Safe to use", "Needs your attention", "Do not use"). Metode prompt paling tinggi "Needs your attention".
8. Settle (`POST /api/runs/:id/settle`), tampilkan pembagian dana dan tautan transaksi. Setelah batas waktu, "Take my payment back" lewat `POST /api/runs/:id/reclaim`.
9. Beri rating (`GET /api/runs/:id/review-eligibility`, `POST /api/methods/:id/reviews`).
10. Secret pembuka jawaban hanya disimpan di memori perangkat dan tidak pernah dikirim ke server. Setelah reload, jawaban tidak bisa dibuka lagi; katakan itu terus terang di UI.

Area lain: Waiting for my approval (outbound held, setujui `action_hash` yang persis), Connected apps (sambungkan, scope, kedaluwarsa, cabut, `effective_state`, `allowed_actions`), Documents, Saved notes, My methods (login NEAR, draft, unggah artefak tersegel, validasi, peringatan bocor untuk prompt yang wajib diterima, publish lewat wallet), Community fund dan Paid improvements (issue, proposal, vote, bounty, kontribusi, uji privat di TEE, review, payout, versi baru, semua langkah uang lewat wallet), Account and balance (login NEP-413 lewat Wallet Selector, profil, preferensi, transaksi, earnings, status saldo), Activity.

Tampilkan hanya fitur yang `GET /api/capabilities` nyatakan aktif. Fitur `unavailable` ditampilkan dengan alasannya, bukan disembunyikan diam-diam dan bukan dipalsukan.

## 4. Kejujuran dan batas yang wajib terlihat di UI

1. Semua penjual adalah akun demo, aturannya ditulis untuk demo. Metode 4, 5, dan 8 (DeFi, token, term sheet) bukan nasihat keuangan atau hukum.
2. "Test top-up (no real money)". Tidak ada uang sungguhan.
3. Lima perlindungan berjalan di backend Kalis, bukan di TEE. Konektor dan portal pengadaan adalah mock berlabel. Dokumen yang diunggah dibaca backend.
4. Rantai sertifikat Intel dan NVIDIA belum diverifikasi sendiri (`not_verified`).
5. Jangan menulis angka, testimoni, pengguna, atau rating yang tidak berasal dari API.

## 5. Larangan dan otorisasi

Tanpa konfirmasi eksplisit Dien: tidak ada push, membuat repo publik, deploy (termasuk Vercel), transaksi mainnet, submission, atau posting. Transaksi testnet untuk menguji alur berbayar boleh, tetapi catat hash-nya. Jangan menyimpan secret atau private key di frontend atau di repo.

## 6. Cara kerja dan definisi selesai

1. Mulai dari kerangka aplikasi (shell, sidebar, header, token, font Inter), lalu Marketplace sesuai mock, lalu alur pembeli lengkap untuk metode tender dan portofolio, lalu halaman lain sesuai peta navigasi.
2. Jalankan backend dengan `cd Product/app/backend && npm start` (port 8787). Jangan mematikan proses backend yang sedang jalan milik sesi lain; bila perlu instance sendiri, pakai `PORT=8794 PUBLIC_BASE=http://localhost:8787 KALIS_DATA_DIR=<folder sendiri> node src/server.js`.
3. Setiap selesai satu halaman: `npm run typecheck`, `npm run build`, `npm test`, lalu render di 1440px dan 390px dan cek terhadap aturan bagian 2 (em dash, bullet, teks mengambang, tinggi sejajar, tema terang, kontras, font Inter).
4. Satu alur berbayar nyata (tender) harus berhasil dari browser sampai settle di testnet, dengan bukti hash di laporan.
5. Perbarui `app/web/COVERAGE.md` dan laporkan ke Dien dalam bahasa Indonesia: apa yang selesai, buktinya, apa yang belum, dan hasil Compliance gate. Jangan menyebut sesuatu selesai bila belum dijalankan.
