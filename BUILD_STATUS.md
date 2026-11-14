# Status pengerjaan MVP

Dokumen ini mencatat apa yang **sudah** dan **belum** dikerjakan, beserta buktinya. Tujuannya agar agent atau sesi baru bisa melanjutkan tanpa salah informasi.

- **Update terakhir:** 15 November 2026, runner privat aktif di TEE, vault perangkat, deployment, logo, dan label Connectors (rancangan bagian 73).
- **Deadline submission:** 14 November 2026 23:59 UTC (15 November 06:59 WIB).
- **Penulis update terakhir:** Claude.


## Ringkasan aktual 14 November 2026

Aplikasi aktif app/web terhubung backend. GET lokal dan 14 halaman Chrome tanpa login berhasil. Katalog saat audit berisi sembilan metode. Runner aktif 823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d. Source dan bukti direkonsiliasi di CURRENT_STATE.md serta rancangan bagian 70, dengan indeks dokumen di DOCUMENTATION_INDEX.md.

Jalur plaintext checkout sudah ditutup dan lima protections memakai protokol tersegel (lihat 6.19). Runner privat kini aktif di OutLayer testnet (build `cd95487f…`) dan data proteksi milik pemilik disimpan di vault perangkat (rancangan bagian 73). Social Money sudah punya DAO fund, issue/proposal/bounty/private evaluation/review dan unsigned payout/version, tetapi legacy bounty tanpa evaluator serta beberapa policy belum selesai. Deployment sudah dilakukan 15 November 2026 (app.kalis.scientivan.dev dan api.kalis.scientivan.dev, commit e07d4ef). Eksplorasi Social Money tetap ditunda.

## 0. Cara membaca dan aturan update

**Urutan acuan keputusan** bila ada pertentangan. Ini bukan urutan untuk mengabaikan bukti runtime. Source/runtime membuktikan kondisi aktual, sedangkan keputusan menetapkan perilaku yang seharusnya. Selisih keduanya dicatat sebagai gap.

1. `../NEAR.md` bagian "Compliance gate" (aturan hackathon). Selalu menang.
2. `RANCANGAN_PRODUK.md` bagian 0 dan bagian bernomor terbesar (keputusan produk, "apa dan kenapa").
3. Dokumen ini (status teknis, "sudah sampai mana dan bagaimana menjalankannya").
4. Kode di `app/`.

**Status yang dipakai:**

- ✅ selesai dan ada buktinya
- 🟡 berjalan sebagian
- ⬜ belum dimulai
- ⛔ terblokir

**Aturan update (wajib bagi setiap agent):**

- Perbarui dokumen ini sebelum sesi berakhir, termasuk bagian "Changelog".
- Setiap status ✅ wajib punya bukti yang bisa dibuka (tx hash, path file, output perintah). Tanpa bukti, statusnya paling tinggi 🟡.
- Jangan menulis nilai rahasia (private key, API key, seal key). Tulis lokasinya saja.
- Jangan menaikkan klaim. Yang belum diuji ditulis "belum diuji".
- Keputusan produk baru dicatat di `RANCANGAN_PRODUK.md` dan PDF-nya, bukan di sini. Di sini cukup rujukan bagiannya.

## 1. Ringkasan produk (satu paragraf)

Ringkasan berikut adalah tujuan produk. Batas aktual adalah runner privat untuk lima protections baru terbukti lokal mode native dan belum di-deploy sebagai TEE, sebagaimana 6.19 dan CURRENT_STATE.md.

Nama produk **Kalis**. Marketplace metode AI privat. Penjual menjual metode yang tetap rahasia. Pembeli menjalankannya pada data sensitif miliknya tanpa membukanya ke penjual maupun operator. Sebagian pembayaran masuk dana DAO yang membayar bounty perbaikan metode. Track: Privacy & Private AI, Social Money, Open Innovation. Rincian di `RANCANGAN_PRODUK.md` bagian 0, 47–52.

## 2. Keputusan teknis yang berlaku

| Topik | Keputusan | Sumber |
|---|---|---|
| Tempat metode berjalan | TEE OutLayer (Intel TDX), program WASM `wasm32-wasip2` | Bagian 51 |
| AI | NEAR AI Cloud. Default model privat yang lolos attestation | Bagian 51–52 |
| Model proprietary | Boleh, wajib peringatan + `privacy-filter` + persetujuan pembeli | Bagian 52 |
| Bentuk metode penjual | Opsi B: kode penjual berjalan di sandbox runner platform | Bagian 52 |
| Jenis metode | Penjual memilih `kind`: `wasm` (boleh memanggil AI lewat `kalis.ai_chat`) atau `prompt`. Label terlihat pembeli, peringatan bocor di form penjual. Tender = WASM + AI | Bagian 65 |
| Jaringan blockchain | NEAR testnet untuk development | Bagian 51, `NEAR.md` Q-010 |
| Publikasi WASM | FastFS (repo belum publik) | Bagian 51 |

### Opsi B secara singkat (dua kotak)

1. **Kotak luar (OutLayer).** Runner membawa manifest di custom section `outlayer.manifest`. Sejak runner 0.5 isinya `{"capabilities":{"network":[{"host":"cloud-api.near.ai","timeout_secs":120}]},...}`, jadi runner hanya bisa menghubungi NEAR AI Cloud (sampai 0.4 daftarnya kosong). Worker OutLayer menegakkan daftar host ini. Sumber: `resolve_network_policy` di `worker/src/connector_manifest.rs` repo `out-layer/outlayer`.
2. **Kotak dalam (runner platform).** Runner menjalankan WASM penjual dengan interpreter `wasmi`. Satu-satunya import yang boleh adalah `kalis.ai_chat`, dan hanya bila manifest metode mencantumkan model. Import lain ditolak sebelum dijalankan. Kode penjual tidak pernah mendapat socket.

Alasan kotak dalam wajib: manifest OutLayer hanya mengatur jaringan. Fungsi lain seperti storage OutLayer dan transaksi NEAR tidak tercakup (struct `ProjectManifest`, inferensi agent dari daftar field).

## 3. Akun dan resource

Build aktif runner kini 823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d, sesuai config.js dan versi market yang teramati. Hash dalam tabel resource lama adalah sejarah dan bukan konfigurasi deployment terbaru.

Nilai rahasia **tidak** ditulis di sini.

| Resource | Nilai publik | Lokasi rahasia |
|---|---|---|
| Akun NEAR testnet | `scientivan.testnet` (dibuat lewat faucet, tx `D2Z4qWBxCWHr2CNmoSpC8ePd1YJVWqgt3UE9Zs6rk9Dh`) | macOS Keychain (near-cli-rs) |
| OutLayer CLI | v0.2.3, login testnet sebagai `scientivan.testnet` | `~/.outlayer/testnet/` dan Keychain |
| Akun NEAR mainnet | `scientivan.near` (dipakai login NEAR Builders) | Wallet milik Dien |
| NEAR AI Cloud | Key dari klaim builder $10 (penawaran ditutup 15 Nov 2026). Organisasi Dien sendiri juga punya kredit gratis $1 | `Product/.env` variabel `NEAR_API_KEY` (masuk `.gitignore`) |
| Wallet trial OutLayer | `wallet_id ccb2363e-...`, scope hanya `connectors.outlayer.testnet/*`, tidak bisa memanggil project kita | `scratchpad/wk.json` sesi 13 Nov (sementara) |
| USDC testnet | `usdc.fakes.testnet` (token yang dipakai `outlayer.testnet`, cek `get_payment_token_contract`). Fungsi `mint` terbuka, 10 USDC (6 desimal) di-mint ke `scientivan.testnet`, tx `C16uMhG8sA9sUtN3wrwNMbUmC5SZzd2C4vqFSMZXNgpD` | Tidak ada rahasia |
| Payment key OutLayer testnet | nonce 1, hanya untuk `scientivan.testnet/*`, saldo awal $2 | `~/.outlayer/testnet/payment-keys.json` (dibuat CLI, owner-only) |
| Kontrak market (registry + escrow) | `market.scientivan.testnet`, tx buat `8p4Z3j6wQChrBdnDuW6dVhKYU7cpvxMCE47qmANvF25h`, deploy+init `Hse7t6a6rfXVVaZJaueJbxgWmrWSYy4tUjaLHuqp1n7x`. Config: platform `platform.scientivan.testnet`, DAO `kalis-fund.sputnik-v2.testnet`, kunci runner `8b77ffa184b87d84d0302813f74d7bab21cf96ab8b88a1e781d3af2744f3c7a7`, timeout 30 menit | macOS Keychain |
| DAO dana bersama | `kalis-fund.sputnik-v2.testnet` (Sputnik DAO v2, factory `sputnik-v2.testnet`, council `scientivan.testnet`, proposal bond 1 NEAR), tx `GWQMKv1yqnq8mjgJYKUKjYqJv9isiFaLj7yZE3tUfaEg` | Tidak ada rahasia, dikendalikan council |
| Akun pembeli uji | `kalis-buyer.testnet` (faucet, 10 NEAR testnet, 3 NEAR dipindah ke `scientivan.testnet`) | macOS Keychain |
| Akun kontributor uji | `kalis-contrib.testnet` (faucet, 10 NEAR testnet) | macOS Keychain |
| Akun platform | `platform.scientivan.testnet` (penerima porsi platform 10%) | macOS Keychain |
| Kontrak registry (lama) | `registry.scientivan.testnet` (sub-akun, diisi 3 NEAR testnet, tx buat `AyUSK64AQiaBsaHzEFsFX8hF6FCnKKbsonwVkPAyLP8g`, tx deploy `2XzVsT4nkVEkYgmnq7WL6tHXN5Ni1CVUiLRC5FRMHJXV`) | macOS Keychain |

Saldo `scientivan.testnet` per 13 Nov 12:30 UTC sekitar 6,9 NEAR testnet (setelah mengisi sub-akun).

### Project OutLayer di testnet

| Project | Hash build aktif | Fungsi |
|---|---|---|
| `scientivan.testnet/sealed-probe` | `85ceaeadb5b4b7e2054d5aef076d0a872add64248406e9b67a8f52f833404064` | Uji enkripsi input/keluaran |
| `scientivan.testnet/runner-spike` | `cbf2dc310db7c2baaf29947b2de35eee0ea2c4dd473d0a5c622ce75cd9b36be6` | Uji opsi B (runner + wasmi + manifest tanpa jaringan) |
| `scientivan.testnet/kalis-runner` | `2f5773282fded8db08759228b3a3f3f564d3be485af8275fe32889c62d700232` (v0.5, sebelumnya `18404f...` v0.5 awal, `56f91d...` v0.4, `455591...` v0.3, `438512...` v0.2, `6df3e8...` v0.1) | Runner opsi B final: metode dan data tersegel, sandbox `wasmi`, jaringan hanya ke `cloud-api.near.ai`, metode `wasm` dan `prompt`. Secret `PROTECTED_SEAL_KEY` dan `NEAR_AI_API_KEY` dikunci ke build aktif. Kunci publik TEE `d4dd5b661d908c178ab83ab17e1317b42d9521f37d5220fb51ad8d1f2ce3753e` |
| `scientivan.testnet/net-open` | `ad7ce2793903f9ade203fbbaf6e406ec94c62facc699ed8adbbbec011065d966` | Kontrol uji jaringan, tanpa manifest |
| `scientivan.testnet/net-closed` | `8c73438a7a18a28bb04d917c883f1c3e8650142be8609874791d48d93385958e` | Uji jaringan dengan manifest `network: []` |
| `scientivan.testnet/manifest-spike` | `dd07c770c1096145e4ae74390eae7d4d2a7ac846bdc80fb4c592a795beca9e4b` | Program terkecil yang hanya membawa manifest |

Secret OutLayer: `PROTECTED_SEAL_KEY` (hex32, dibuat di TEE) untuk project `sealed-probe`, dikunci ke build `85ceaead...`. Kunci publiknya `b3763602ba9cdf9a018c14ea6fe0bcc97f05a79f8f08a343b58ea21ce3bdc06f`.

## 4. Peta kode

Tabel lama mencatat tahap awal. Lokasi aktif tambahan adalah app/web untuk aplikasi, app/backend untuk API dan app/market-contract untuk registry/escrow. Manifest aktif mengikuti hash versi chain, bukan otomatis manifest.json pertama. Runner hash aktif dan katalog mengikuti CURRENT_STATE.md. Status probe/spike tidak menggantikan keberhasilan runner final.

| Path | Isi | Status |
|---|---|---|
| `validation/portfolio-method-02/benchmark.py` | Solver acuan Python (MILP dan oracle enumerasi), 12 kasus | ✅ 12/12 cocok dengan enumerasi |
| `app/sealed-probe/src/main.rs` | Program TEE: kunci X25519 dari secret, buka input terenkripsi, jalankan solver, enkripsi jawaban | ✅ |
| `app/sealed-probe/client/sealed.mjs` | Sisi pembeli: enkripsi (X25519 + HKDF-SHA256 + ChaCha20-Poly1305) dan buka jawaban | ✅ |
| `app/sealed-probe/client/local-test.mjs` | Uji lokal 12 kasus | ✅ |
| `app/sealed-probe/client/remote-test.mjs` | Uji satu kasus di OutLayer testnet | ✅ |
| `app/near-ai-probe/verify.mjs` | Uji attestation dan tanda tangan NEAR AI Cloud | ✅ |
| `app/guest-spike/` | Contoh metode penjual (solver portofolio) untuk `wasm32-unknown-unknown`, tanpa import. Fitur `evil` menambah import `env::http_post` | ✅ lokal |
| `app/runner-spike/` | Runner opsi B: `wasmi`, tolak semua import, fuel meter, manifest tanpa jaringan, perintah `ping` | 🟡 lokal lolos, testnet gagal (lihat 6.4) |
| `app/kalis-runner/` | Runner opsi B final (`src/main.rs`, `src/ai.rs`) dan klien (`client/kalis.mjs`, `local-test.mjs`, `remote-test.mjs`, `ai-local-test.mjs`, `remote-ai-test.mjs`) | ✅ lokal 12/12, testnet C03 dan C09 (6.8), AI dan prompt (6.15) |
| `app/guest-ai-test/` | Metode uji kecil yang memanggil AI lewat `kalis.ai_chat` | ✅ lokal dan testnet (6.15) |
| `app/methods/salary-counteroffer/` | Metode prompt demo: `manifest.json` (`kind: prompt`), blob tersegel di `sealed/`. Prompt asli di `seller-private/` (gitignored) | ✅ di market v1 (6.15) |
| `app/guest-spike/` (v3) | Metode portofolio melaporkan langkah `read_portfolio`, `check_inputs`, `search_trades`, `pick_cheapest`, `self_check`. Fitur `lazy` untuk uji langkah hilang | ✅ |
| `app/net-probe/` | Probe HTTP, dibangun dua kali (tanpa manifest dan `--features no-network`) | ✅ (6.7) |
| `app/tools/ol-call.sh` | Panggil project OutLayer testnet lewat HTTPS dengan payment key, tanpa mencetak key | ✅ |
| `app/manifest-spike/` | Program terkecil dengan manifest tanpa jaringan | 🟡 testnet belum ada hasil |
| `app/market-contract/` | Kontrak market: registry versi berharga + escrow per run + pembagian dana, verifikasi tanda selesai ed25519 | ✅ unit test 9/9, testnet (6.11) |
| `app/methods/portfolio-rebalance/method-v2-pruning.wasm` | Binary metode v2 hasil bounty (`646d4690...`). Binary yang dipublikasikan disimpan di sini karena build Rust tidak reproducible setelah source disunting | ✅ |
| `app/kalis-runner/client/escrow-e2e.mjs` | Uji alur penuh bayar, jalankan, settle, cek saldo | ✅ |
| `app/backend/` | API backend Node (tanpa framework): market, OutLayer, escrow, DAO. Kontrak API di `app/backend/API.md`. Modul kripto browser `src/kalis-crypto.js` (@noble) | ✅ smoke test sukses dan gagal (6.13) |
| `app/methods/portfolio-rebalance/sealed/` | Blob metode tersegel milik penjual (publik, hanya TEE yang bisa membuka), dibuat `scripts/seal-method.mjs` | ✅ |
| `app/registry-contract/` | Kontrak registry metode (Rust, near-sdk 5.27.0 karena rustc lokal 1.89) | ✅ deploy dan uji di testnet |
| `PRODUCT.md` | Fakta produk untuk skill desain impeccable (tanpa keputusan visual) | ✅ |
| `design/kalis-hero.html` | Draf hero dengan lanskap dan ilustrasi UI siklus produk enam tahap. CSS/JS aktif di `design/kalis-story.*`. Draf batik tersimpan di `design/kalis-hero-v1.html` | 🟡 menunggu review visual Dien, browser pengujian diblokir sandbox |
| `app/methods/portfolio-rebalance/manifest.json` | Draf manifest metode portofolio (tanpa AI, tanpa konektor, tanpa jaringan) | 🟡 draf, skema belum final |

Pekerjaan awal ditulis 13 November 2026 dan pengembangan berlanjut 14 November 2026, dalam jendela kode hackathon sejak 19 Oktober 2026.

## 5. Status alur demo (lima langkah, bagian 47)

| Langkah | Implementasi dan bukti | Batas verifikasi |
|---|---|---|
| 1 Publikasi metode | Market contract, sellers API dan editor/signing UI tersedia. Bukti 6.17, katalog GET aktif | Tidak melakukan publikasi wallet ulang dalam audit |
| 2 Run privat | Runner opsi B berjalan di testnet, bukti 6.8 dan 6.15–6.18, buyer UI terintegrasi | Payload inti tersegel. Plaintext checkout sudah ditutup (6.19) |
| 3 Dana DAO | Escrow split ke Sputnik DAO, bukti 6.11 dan konfigurasi live | 80/10/10 konfigurasi sekarang, DAO share versi minimal 10 persen |
| 4 Proposal dan bounty | Bukti payout 6.12, API/Community UI tersedia | Legacy bounty tanpa evaluator app tidak siap private test, wallet E2E belum diuji ulang |
| 5 Versi kontributor | Parent/contributor di market dan adapter publish versi accepted | Seluruh aturan review DAO tidak dipaksa market contract pada publikasi langsung pemilik |

Urutan build awal tetap bagian 48 sebagai riwayat. Status frontend bukan lagi mock-only.


## 6. Bukti yang sudah ada

Bagian 6.1–6.18 merekam hasil historis per tanggal/versi, termasuk kegagalan yang kemudian diselesaikan. Kalimat belum dibuat atau sedang berjalan di dalam entri lama tidak menetapkan status sekarang. Lihat ringkasan aktual dan CURRENT_STATE.md.

### 6.1 Enkripsi input dan keluaran di OutLayer (✅)

- Lokal: 12/12 kasus cocok dengan oracle Python (`node client/local-test.mjs target/release/sealed_probe`).
- Testnet kasus C03, tx `2m9XzLb8SD3MkChhZzfUpT5Ms2anVpYFPxDKfwjY8uHs`, request 38119. Argumen transaksi dan nilai kembalian hanya berisi ciphertext. Kata `holdings`, `fee_rates`, `delta`, `cost` dan angka `[7,1,1]`, `[-3,0,2]` tidak ditemukan. Jawaban yang dibuka pembeli `delta [-3,0,2]`, biaya 0,18, sama dengan oracle.
- Attestation `https://testnet-api.outlayer.ai/attestations/by-request/38119`: `executed_wasm_sha256` sama dengan build `85ceaead...`. `input_hash` dan `output_hash` sama dengan SHA-256 input dan keluaran di transaksi.

### 6.2 Koordinator OutLayer dapat melihat input tanpa enkripsi (temuan)

`ExecutionRequest.input_data` di `worker/src/api_client.rs` berupa `String` biasa yang diantrekan koordinator (closed source) sebelum diambil worker TEE. Karena itu data pembeli wajib dienkripsi di perangkat pembeli (6.1).

### 6.3 NEAR AI Cloud privat (✅)

`node app/near-ai-probe/verify.mjs` dengan model `deepseek-ai/DeepSeek-V4.1-Flash-1017`:

- Nonce baru muncul di laporan gateway dan model.
- `report_data` di quote TDX berisi kunci penanda tangan dan nonce.
- Laporan model membawa bukti GPU NVIDIA dengan nonce sama.
- Tanda tangan `provider_tee` ed25519 valid atas `<model>:<sha256 request>:<sha256 response>`.
- Jawaban data fiktif (harga pokok 812 juta, margin 9%) adalah 885.08, benar. Biaya sekitar 0,001 USD.
- `max_tokens` minimal sekitar 2000, karena 400 habis untuk reasoning dan jawaban kosong.

`z-ai/glm-5.3` dan `moonshotai/kimi-k3` menjawab "No provider found that supports attestation reports" untuk `provider=near`. Jangan dipakai untuk klaim privasi.

### 6.4 Opsi B runner (🟡)

- Lokal: runner menjalankan solver penjual untuk C03 dan menghasilkan `delta [-3,0,2]`, biaya 0,18, memakai 2.834.307 fuel. Guest `evil` ditolak dengan `REFUSED refused import env::http_post`.
- Runner berhasil dikompilasi ke `wasm32-wasip2` (2,6 MB). Custom section `outlayer.manifest` ada di file.
- **Testnet gagal.** Request 38287 (C03) dan 38322 (`ping`) berakhir `Execution promise failed`. CLI hanya menampilkan `the request failed with timeout error`.
- Diagnosis belum selesai. Pada 12:05 UTC `sealed-probe` yang sebelumnya berhasil juga tidak mendapat hasil (request 38332), begitu pula `manifest-spike` (request 38331). Keempat worker testnet online tetapi tanpa tugas aktif (`/public/workers`). Penghitung `total_tasks_failed` kedua executor naik dari 798 dan 737 menjadi 805 dan 744 selama percobaan kita, jadi tugas kita sampai ke worker lalu gagal di sana. API publik tidak memberi pesan error per eksekusi. Penyebab belum diketahui. Karena program yang tadinya berhasil ikut gagal, dugaan sementara adalah masalah di sisi OutLayer testnet. **Penelusuran 15:30 UTC (Claude):** 17 dari 22 eksekusi on-chain terbaru di `outlayer.testnet` gagal, dari sedikitnya empat akun berbeda, sehingga gangguan bersifat luas di jalur on-chain OutLayer testnet (`RANCANGAN_PRODUK.md` bagian 54). Skrip pemindai: ambil tx `outlayer.testnet` dari `tx.test.fastnear.com/v0/account`, lalu cek log `Execution completed` atau `promise failed`.

### 6.6 Jalur HTTPS OutLayer berjalan, opsi B pertama kali jalan di TEE (✅ sebagian)

Jalur on-chain OutLayer testnet terganggu luas (6.4), tetapi jalur HTTPS `POST https://testnet-api.outlayer.ai/call/scientivan.testnet/<project>` dengan header `X-Payment-Key` berjalan (13 Nov 15:45 UTC).

- `runner-spike` `{"cmd":"ping"}`, call `5c9d36a7-2bdd-4fa5-a180-ac121823e1b1`: `status completed`, output `{"guest_bytes":160504,"ok":true,"pong":true}`, waktu eksekusi 4,3 detik (total 150 detik termasuk antre). Pakai mode `"async": true` lalu poll `/calls/<id>` agar tidak menunggu lama. Attestation `/attestations/by-call/5c9d36a7-2bdd-4fa5-a180-ac121823e1b1` mencatat `project_id scientivan.testnet/runner-spike`, `executed_wasm_sha256 cbf2dc31...` (sama dengan build runner yang tercatat di registry) dan quote TDX. Attestation call C03 kosong, kemungkinan karena statusnya failed.
- `runner-spike` kasus C03, call `43bf017e-96c1-42b2-a53b-b3bc7d2b43de`: solver penjual berjalan di interpreter `wasmi` di dalam TEE dan menghasilkan `delta [-3,0,2]`, biaya 0,18, 2.834.307 fuel, 61.916.121 instruksi, 5,2 detik. Status tercatat `failed` hanya karena output spike diawali teks `OK `, bukan JSON murni. Perbaikan format masuk tugas 3.
- Cara memanggil: baca key dari file payment key ke variabel shell tanpa mencetaknya, lalu `curl -X POST ... -H "X-Payment-Key: $PK" -d '{"input":{...},"async":true}'`. Untuk project dengan secret, tambahkan `"secrets_ref":{"profile":"default","account_id":"scientivan.testnet"}`.
- CLI `outlayer run` tetap memakai jalur on-chain walau payment key ada, jadi gunakan `curl`.

### 6.7 Manifest `network: []` memblokir jaringan (✅)

Kode identik `app/net-probe`, satu GET ke `https://example.com/`, dijalankan di OutLayer testnet lewat HTTPS (13 Nov 16:20 UTC).

- Tanpa manifest (`net-open`), call `87ddd8f8-2765-4a01-b210-2ca7325f829e`: `{"reached":true,"status":200}`.
- Dengan manifest `{"capabilities":{"network":[]}}` (`net-closed`), call `ba465ddb-c3af-4d95-be24-121e695c416d`: `{"reached":false,"error":"connection reset"}`.

### 6.8 Runner opsi B dengan metode dan data tersegel (✅)

`app/kalis-runner`. Penjual menyegel WASM metode ke kunci TEE (info HKDF `kalis/v1/method`), pembeli menyegel data (`kalis/v1/request`). Runner membuka keduanya di TEE, menolak metode yang punya import apa pun, menjalankan metode di `wasmi` dengan jatah fuel 50 juta lalu membakar sisanya, memberi bantalan jawaban 1024 byte, dan menyegel jawaban ke kunci sekali pakai pembeli (`kalis/v1/answer`). Hash SHA-256 metode yang dibuka dilaporkan agar pembeli bisa mencocokkannya dengan registry.

- Lokal: 12/12 kasus cocok dengan oracle Python. Ukuran jawaban tersegel sama di semua kasus (1388 karakter base64). Metode dengan import `env::http_post` ditolak dengan pesan `method imports env::http_post, which the runner does not provide`.
- Testnet C03, call `688b596c-2a07-47e3-8972-47ba5e5b09b2`: pembeli membuka `delta [-3,0,2]`, biaya 0,18. Testnet C09, call `62e55e1d-3137-4089-b69f-000261012ab6`: `infeasible`. Keduanya sesuai oracle.
- Input dan output yang diterima OutLayer tidak memuat `holdings`, `fee_rates`, `delta`, `cost`, maupun angka posisi.
- `method_sha256` yang dilaporkan `a1be5b7c1330ad1d32a589abd8de4f3e6a982cc6360df723bebec3e9bbfb3a5c`, sama dengan `code_hash` versi 2 di registry (tx `3UWDU648gh1os1PBLBLVm6RnciNJkuGirvvetHdSfpBY`, `parent 1`, `runner_hash 6df3e836...`).
- Attestation `/attestations/by-call/688b596c-2a07-47e3-8972-47ba5e5b09b2`: `executed_wasm_sha256 6df3e836...` dan quote TDX.
- Biaya per run sekitar 0,001 USD dari payment key. Waktu eksekusi sekitar 5,3 detik.

**Batas yang diketahui.** Jumlah instruksi yang dicatat OutLayer belum benar-benar tetap: 1.707.522.905 (C03, feasible) dan 1.741.694.710 (C09, infeasible), selisih sekitar 2%. Bantalan fuel menyamakan kerja metode, tetapi kerja host di luar interpreter masih berbeda. Selisih ini masih dapat membocorkan sedikit informasi, misalnya status feasible atau infeasible. Ukuran jawaban sudah tetap.

### 6.9 Laporan eksekusi, cek ulang pembeli, dan pencocokan attestation (✅)

`kalis-runner/0.2` (build `438512869c9f8a6dd5f89e33db0e26fddb0bc524ec1a20d65f07e7b0f3c57c17`, kunci segel dipindah dengan `outlayer secrets access --build`, kunci publik tetap `d4dd5b66...`). Metode penjual v3 (`61616ac60e6124124a3c94b62836ae4a165d2bb665ff0921c031d6f0f378fd85`) melaporkan lima langkah yang dideklarasikan di `app/methods/portfolio-rebalance/manifest.json` (`e2cebb81fd2e1cf44eec8199e53a330aa48e16a88dd6000916e0411890b88a92`). Registry versi 3, tx `CKiuHbgTof3aDoYwo6HedjxRHJAoGWBAa6AUQVLzYJGf`, `parent 2`.

- Lokal (`node client/local-test.mjs target/release/kalis-runner <guest> /tmp/lazy-guest.wasm`): 12/12 benar, laporan `all_ok`, cek ulang lolos. Build `--features lazy` yang melewatkan `self_check` ditandai `missing ["self_check"]`. Jawaban palsu "sell 6 A, buy 5 C" tertangkap cek ulang dengan dua peringatan (porsi aset A 8,8% di luar 10–40%, biaya 0,18 versus 0,30).
- Testnet C03 (call `6749578f-0b51-43c6-9ba8-e2f508c06dbf`) dan C09 (call `be8be4c6-ec62-4b2a-8d47-e891c6e7695d`): jawaban benar, `report_all_ok true`, cek ulang lolos, hash metode dan manifest cocok, attestation `executed_wasm_sha256` sama dengan build runner, `input_hash` sama dengan SHA-256 body `input` yang dikirim (`JSON.stringify` apa adanya), `output_hash` sama dengan SHA-256 output dengan kunci diurutkan (format `serde_json`).

### 6.10 Tambalan jumlah instruksi (🟡 sebagian)

`kalis-runner/0.3` (build `4555910922be0e8209e6f32fa7197a1f72c2237632e585a9319578cf2a310fce`, registry versi 4). Sisa fuel tidak lagi dibakar dengan putaran kosong, tetapi dipakai menjalankan ulang metode yang sama pada data yang sama, hasilnya dibuang, sampai fuel habis.

| Kasus | Status | Instruksi v0.2 | Instruksi v0.3 |
|---|---|---|---|
| C03 | feasible | 1.707.031.311 | 574.570.781 |
| C09 | infeasible | 1.742.319.863 | 535.295.580 |
| C01 | feasible | belum diukur | 569.702.748 |
| C11 | infeasible | belum diukur | 566.244.125 |

Hasil: total kerja chip turun sekitar tiga kali. Tiga dari empat kasus berada dalam rentang 8,3 juta (1,5%), dan status feasible atau infeasible tidak lagi terpisah rapi (C11 infeasible mirip kasus feasible). C09 tetap sekitar 7% lebih rendah, sehingga selisih absolut terbesar (39 juta) belum mengecil dibanding v0.2 (35 juta). Penyebab menurut agent: biaya kerja chip per unit fuel berbeda menurut data yang diproses metode, dan runner tidak dapat membaca penghitung instruksi OutLayer. Penghapusan penuh memerlukan metode yang kerjanya tidak bergantung pada data, yang merupakan tanggung jawab kode penjual. Wajib ditulis sebagai keterbatasan di README.

### 6.11 Escrow berbasis tahap dengan tanda selesai TEE (✅)

**Tanda selesai.** `kalis-runner/0.4` (build `56f91db47c69d42c63942541498c2778c54659408dd65c57f18459187991a4c2`) mendeklarasikan signing key OutLayer `{"path":"completion","type":"ed25519","caller":"none"}` (bind project). Kunci dibuat keystore di TEE dan tidak pernah terlihat. Public key `8b77ffa184b87d84d0302813f74d7bab21cf96ab8b88a1e781d3af2744f3c7a7`. Setiap run mengeluarkan record publik `{all_ok, data_ct_sha256, manifest_sha256, method_sha256, run_id, runner}` yang ditandatangani atas `kalis-completion:v1:<record>`. Uji C03 call `ebc426f1-d410-4abf-964e-799e772a0c48`: tanda tangan valid, attestation cocok.

**Kontrak.** `market.scientivan.testnet` menggabungkan registry dan escrow agar harga, porsi DAO, dan hash versi bisa dibaca langsung saat pembayaran. Metode `portfolio-rebalance` versi 1 di market (tx `4yZ5uj1kq1go9dUqoEMgQtAs3TsGFMXJUtWmfQTEHmHE`): harga 0,1 NEAR testnet, porsi DAO 10% (sesuai `dao_share_percent` manifest), platform 10%. `settle` memeriksa tanda tangan runner, `run_id`, sidik jari data pembeli, hash metode, dan hash manifest. Unit test 9/9: release, refund, tanda tangan palsu, data lain, run lain, porsi DAO di bawah 10%, timeout belum dan sudah lewat, settle ganda.

**Uji alur penuh di testnet** (`node client/escrow-e2e.mjs <success|failure> <guest>`):

| Skenario | Bayar | Run TEE | Settle | Perubahan saldo |
|---|---|---|---|---|
| Sukses (C03) | tx `4bKekuYL5jX4QogQaD2MeE7i7L2XV1ciQyFcGqgKusS9` | call `2520289c-6cba-4d8e-b627-b2650f1c72a4`, `all_ok true` | tx `4cd1s1tGd5kmXNuBjkqfEb8Gn4wdN8YNgY6FSBsuhher`, `Released` | penjual +0,08, DAO +0,01, platform +0,01, pembeli −0,10287 |
| Gagal (batas bawah di atas batas atas) | tx `9kFBhLCgkWwQBxX64rT1hykqTpHJMYZ9xVnnbmm7GaRZ` | call `e91bd2fd-ecdb-4d29-b5cb-12b244366387`, `check_inputs` gagal, 3 langkah hilang, `all_ok false` | tx `GLnFEcjByhkNLtAde2NGxEuySqWZeCTittsLHHzjAb7x`, `Refunded` | penjual, DAO, platform 0; pembeli −0,00277 (gas dan storage) |

**Batas.** Kunci tanda selesai terikat ke project (bind project), jadi setiap versi runner yang di-deploy pemilik project dapat menandatangani dengan kunci yang sama. Pembeli dan kontrak percaya bahwa versi yang berjalan adalah runner yang tercatat, yang dapat dicek lewat attestation per call (`executed_wasm_sha256`). Pembayaran memakai NEAR testnet, bukan USDC atau fiat. Top-up fiat tetap mock (belum dibuat).

### 6.12 Bounty DAO dan versi kontributor (✅)

Siklus lengkap di testnet, 13 Nov 18:30–18:45 UTC.

1. Proposal `AddBounty` di `kalis-fund.sputnik-v2.testnet` oleh `scientivan.testnet` (bond 1 NEAR), tx `4SMGe82mtKmq4FrYhzC9KpnDVqcYQsfBnJ6vKpTBeCnj`: hadiah 0,01 NEAR untuk "make portfolio-rebalance use less compute without changing any answer". Disetujui council, tx `CFb2adkBaAR5PKLtaoaG8JfFtpVhBtHQh5c32wQ3xiNi`, bounty id 0.
2. `kalis-contrib.testnet` mengklaim bounty, tx `87vKz2ADxD1qqrt76PsTCoFwb3hW2yW7u5JDb2qpGmda` (bond 1 NEAR).
3. Perbaikan (fitur `pruning` di `app/guest-spike`): kombinasi yang biayanya tidak mungkin mengalahkan biaya terbaik dilewati sebelum cek batas penuh. Jawaban tidak berubah. Uji pada kasus yang diizinkan: lokal 12/12 benar, testnet C03 (call `3f5d48d4-dbd3-487a-a547-e45cac3b992c`) dan C09 (call `c67bd018-295f-4a3d-b18e-0a3dab3d3692`) benar dengan laporan all ok, tanda tangan valid, attestation cocok. Fuel C03 turun dari 2.936.658 ke 2.012.021 (sekitar 31%).
4. Proposal `BountyDone` oleh kontributor, tx `8LTw665i2RGWKoPUSz5DKdN2YMcqMwmvSh8kjqH8V9pe` (proposal 1), disetujui council, tx `2G1KCThMRki4nKZABxtbXd1DdNBsTbiGBEVjqMuPXajH`. Kontributor +0,01 NEAR, dana DAO −0,01 NEAR. Dana ini sama dengan porsi DAO dari run sukses sebelumnya.
5. Versi 2 di market, tx `HGmcHL2w1kDKYVgEPD5yTSXqCmeLCHW9tsdejLvhsNM`: `code_hash 646d4690...`, `parent 1`, `contributors ["kalis-contrib.testnet"]`, catatan merujuk bounty 0.
6. Run berbayar memakai versi 2: bayar tx `4YuKcstsKUwWT7BquaUDA7BhoAS9AZvUFgF1q5EdKu5L`, run call `72dfd7d3-c10c-4a77-8944-08bcf7514a31` (`method_sha256 646d4690...`, all ok), settle tx `Hg63zMq1GDEXgZ6ScNrjqTamWAD8VH8cNhaawvYpF1ta` `Released`. Penjual +0,08, DAO +0,01, platform +0,01.

**Masalah diketahui di kontrak Sputnik yang ter-deploy.** `bounty_done` menolak deposit (`Method bounty_done doesn't accept deposit`) tetapi di dalamnya membuat proposal yang mewajibkan bond (`ERR_MIN_BOND`), sehingga jalur resmi gagal selama bond proposal di atas 0. Jalan keluarnya, proposal `BountyDone` dibuat langsung lewat `add_proposal`. Akibatnya klaim tetap tercatat dan bond klaim 1 NEAR testnet milik kontributor tertahan di DAO. `bounty_giveup` juga gagal (`attempt to subtract with overflow`). Untuk demo berikutnya, ubah `bounty_bond` di policy DAO menjadi 0 lewat proposal `ChangePolicyUpdateParameters`, atau terima bond tertahan sebagai biaya testnet.

**Batas.** Kontributor hanya menerima bounty, bukan porsi dari run berikutnya. Royalti metode turunan masih terbuka (rancangan bagian 7). Versi 2 dipublikasikan oleh pemilik metode. Kontrak belum memaksa bahwa versi dengan kontributor harus disetujui DAO.

### 6.13 API backend untuk integrasi frontend (✅)

`app/backend/` (`npm start`, port 8787). Kontrak lengkap di `app/backend/API.md`. Rahasia server di `app/backend/.env` (testnet saja, gitignored): kunci `kalis-buyer.testnet` untuk top-up fiat mock, kunci `platform.scientivan.testnet` untuk mengirim `settle`, dan payment key OutLayer. Browser tidak pernah menerima rahasia ini.

- Modul `src/kalis-crypto.js` (@noble/curves, ciphers, hashes) kompatibel dengan runner: uji silang dengan runner native menghasilkan jawaban, sidik jari data, tanda tangan, cek ulang, dan status `safe` yang sama.
- Smoke test sukses (`npm run smoke`): run `run-mwfan9jh-gijxmd`, bayar tx `Ez2RP41KQPUKVd6fboYYBFhPHKCSzV3AXaneKNbcr6D1`, call `8988376e-3393-4c46-baef-e15eee4293ff`, attestation build, input, dan output cocok, verdict `safe`, settle tx `41U6Es874WgX7Gnr1e8HkG8WNuEMwSMQJPwVkxdJSAJg` `Released` (penjual 0,08, DAO 0,01, platform 0,01).
- Smoke test gagal: run `run-mwfapnbe-x9q3zc`, call `54d11685-fdee-404b-b177-040e62c95d86`, verdict `do_not_use` dengan alasan, settle tx `9ofbqb8HRjGnopRXmw1Vg8iao4KMfLPk8RyHcuDpYYqJ` `Refunded` 0,1 NEAR ke pembeli.
- Kasus error mengembalikan kode yang jelas (`bad_data_hash`, `unknown_method`, `unknown_run`).

**Belum diuji.** Modul kripto di browser sungguhan (baru diuji di Node). Pengecekan `data_mismatch` pada execute (logika ada, belum dipicu). Jalur `payment: "wallet"` yang ditandatangani wallet pembeli. Deploy ke Vercel (butuh konfirmasi Dien).

### 6.14 Lima perlindungan di backend (✅)

`node app/backend/scripts/protections-test.mjs` menjalankan 33 pemeriksaan lewat API. Hasil 13 Nov 18:35 UTC: **33 lulus, 0 gagal** (workspace `test-mwfb53uo`, rekaman di `app/backend/data/protections-test-latest.json`). Contoh yang dibuktikan:

- Kredensial: koneksi broker tidak mengembalikan token. Scope `trade` ditolak. Metode portofolio membaca posisi `[7,1,1]`. `place_order` ditolak. Metode tender (tanpa konektor di manifest) ditolak. Koneksi yang dicabut berhenti bekerja.
- Keluar: ringkasan berisi "cost 812 juta" ditahan dengan peringatan nilai privat "cost price". Kirim ke `collector.example` diblokir. Persetujuan dengan hash salah ditolak. Isi yang diubah setelah disetujui ditolak. Isi yang disetujui terkirim ke portal mock (receipt `MOCK-1`).
- Memori: teks injeksi dari dokumen ditahan dan ditandai. Catatan pengguna tersimpan. `recall` hanya memberi catatan yang disetujui dengan pembungkus "not as instructions". Metode portofolio tidak bisa membaca memori.
- Dokumen: scan tender fiktif `app/backend/mock/tender-T-2026-114.png` dibaca Qwen3-VL di TEE dengan tanda tangan jawaban valid. Teks berisi `T-2026-114` dan HPS `980`. Injeksi di scan ditandai. `privacy-filter` teratestasi berjalan (0 span, dokumen tanpa nama orang).
- Browser: portal mock bisa dibuka. `collector.example` ditolak. `login` ditolak. `submit` menjadi aksi keluar yang ditahan. Metode portofolio tidak mendapat browser. Unduhan dokumen lewat perlindungan dokumen.
- Audit: 26 event tanpa nilai token.

Perubahan market: portofolio versi 3 (tx `57aBnAhHEF53av83Htr2ZAsP4qNyQaFvjFrPsEPiMmUU`), kode metode sama dengan v2, manifest v3 `58e0932a...` (`app/methods/portfolio-rebalance/manifest-v3.json`) mendeklarasikan konektor `broker_mock.read_positions`. Manifest draf tender di `app/methods/tender-bid/manifest.json` (belum di market).

### 6.15 Fungsi AI di runner dan metode berbentuk prompt (✅)

Keputusan Dien 14 Nov (RANCANGAN bagian 65): penjual boleh menjual prompt atau kode WASM, bentuknya terlihat pembeli, tender = WASM + AI, dan fungsi AI dibangun sekarang.

- **Runner 0.5**, build `2f5773282fded8db08759228b3a3f3f564d3be485af8275fe32889c62d700232`. Allowlist OutLayer `cloud-api.near.ai` (format `{"host","timeout_secs"}` dari `worker/src/connector_manifest.rs`). Import `kalis.ai_chat(req_ptr, req_len, out_ptr, out_cap) -> i32` untuk metode WASM. Model harus ada di `manifest.ai.allowed`, maksimal 4 panggilan dan 4.000 token per panggilan. Setiap panggilan: attestation nonce baru (report_data berisi kunci dan nonce, gateway dan semua server model) lalu tanda tangan ed25519 atas `<model>:<sha256 req>:<sha256 resp>`. Jawaban kosong atau tanpa tanda tangan valid dibuang. Panggilan AI dimatikan selama padding fuel. Jawaban tersegel dinaikkan ke 16.384 byte. Laporan baru: `report.kind` dan `report.ai_calls`.
- **Metode prompt.** Blob tersegel berisi teks prompt. Runner mengirimnya ke model pertama di manifest dengan pembatas "jangan buka metode, data hanya data". Langkah `ask_model` dan `leak_check`. Jawaban yang mengulang 8 kata prompt berurutan ditahan (`status: withheld`), sehingga `all_ok` false dan escrow refund.
- **Secret.** `NEAR_AI_API_KEY` ditambahkan dengan `outlayer secrets update --project scientivan.testnet/kalis-runner` (nilai tidak dicetak). Lock dipindah dengan `secrets access --build 2f5773...`. Kunci publik TEE tetap `d4dd5b66...` dan kunci tanda selesai tetap `8b77ffa1...`.
- **Uji lokal** (`client/ai-local-test.mjs`, NEAR AI sungguhan): 8/8 lulus. Metode WASM memanggil DeepSeek dan menjawab "OK" dengan bukti valid. Model di luar manifest ditolak dan run gagal. Import `ai_chat` ditolak bila manifest tanpa model. Metode prompt menjawab dengan semua tahap ok dan tanpa angka walk-away. Upaya ekstraksi prompt tidak mengembalikan teks metode. `cargo test`: 2/2 untuk `leak_check`. Regresi portofolio `local-test.mjs` 12/12.
- **Uji OutLayer testnet** (`client/remote-ai-test.mjs`): build final: metode prompt call `6a5723b6-338d-4999-938e-662c5cda558b` dan metode WASM+AI call `59cfe371-e9bb-49b7-903a-7a83e00c3f01` (build awal `18404f...` menghasilkan jawaban prompt kosong karena token habis untuk penalaran model, lalu diperbaiki dengan batas 4.000 token dan penolakan jawaban kosong). Keduanya `report_all_ok` true, `executed_build_ok` true, tanda tangan selesai valid, dan tidak ada plaintext (`28000000`, `walk_away`, isi prompt) di input atau output yang dilihat OutLayer. Waktu prompt sekitar 45 detik, WASM+AI sekitar 9 detik.
- **Market.** Portofolio v4 (tx `4Bo4b1TpdeGz5b8rYuuPTpS67eUuhwg2BJXFyehGKuyt`, kode sama, manifest v4 `0fa1cf07...` dengan `kind: wasm`, runner `2f5773...`). `salary-counteroffer` didaftarkan (tx `FqWtCX7SzSDnfsaTjZZS6bvBADFgSa6k3FEwKw9pxM56`) dan v1 dipublikasikan (tx `6MHkw3UBDR49STKfPJywkVsGhPaSGFaz2ndti3rCe1wJ`, kode `493deb13...`, manifest `a86a171b...`, 0,05 NEAR).
- **Smoke berbayar.** Prompt: run `run-mwfpjnni-l6ob7c`, bayar `FJxj57udHFSELawHH1guVP3Kbob2zZaJnnr5ggWknh2v`, settle `AM93qg6T2ndW87fAgvDpRVEw7WL5zzzzZ6TQWRQfHLGu` Released 0,04/0,005/0,005, verdict `attention`. Portofolio v4: run `run-mwfpnp3w-h22s6e`, settle `4HP5AdVcEwRLcLLr3fBDcjGPK23EwZJue4TjLAeVi8pS` Released, verdict `safe`. `protections-test.mjs` tetap 33/33.
- **Backend.** `version.method_kind` (`kalis.methodKind`), `config.method_kinds.seller_prompt_warning` (`kalis.PROMPT_SELLER_WARNING`), verdict prompt maksimal `attention`, verdict gagal bila ada panggilan AI tanpa bukti. Manifest tender kini `kind: wasm` dengan jaringan runner `cloud-api.near.ai`. Didokumentasikan di `app/backend/API.md` bagian "Method kinds".

**Batas.** `leak_check` hanya menangkap salinan kata per kata, parafrase lolos. Jawaban prompt tidak deterministik dan kepatuhan model tidak terbukti. Ukuran dan waktu panggilan AI terlihat host OutLayer dalam bentuk terenkripsi, dan jumlah instruksi runner ikut bergantung pada panjang jawaban model. Jalur model proprietary belum ada di runner. Sertifikat Intel/NVIDIA belum diverifikasi sendiri. Metode tender belum dibangun.

### 6.16 Backend lanjutan: run berbayar yang tahan ulang, manifest v5, tender, akun penjual (✅ sebagian, 14 Nov 02:35 UTC)

- **Kelompok A** (`app/backend/src/runs-api.js`, `db.js`, `principal.js`, `capabilities.js`, `market.js`): `GET /api/capabilities`, `GET /api/runs` (cursor), draft run dengan revisi dan persetujuan yang terikat revisi, quote (harga, deposit storage, biaya infrastruktur 0, batas gas, dasar pembagian), `POST /api/runs` dengan idempotency key, `GET /api/operations/:id`, `GET /api/runs/:id/events`, eksekusi async, `POST /api/runs/:id/reclaim` lewat `refund_expired`. Penyimpanan tahan restart di `app/backend/data/db/` (tulis atomik). Uji `scripts/runs-test.mjs`: 26/26 lolos (bayar `9zKn8Y...`, settle `EGTsdf...`, ulang dengan key sama tidak membayar dua kali, key sama payload beda ditolak, run orang lain tidak terlihat).
- **Manifest v5** (`app/methods/MANIFEST_V5.md`, `src/checks.js`, `src/manifest-validate.js`): listing, skema input dan output, cek pembeli sebagai data (JSONLogic tanpa eval, status pass, fail, cannot_check, not_applicable), validator `POST /api/manifests/validate`. Cek portofolio v5 memberi hasil sama dengan `recheckPortfolio` pada 12 kasus dan 1.440 daftar transaksi acak. `scripts/checks-test.mjs` 50/50.
- **Perlindungan dokumen**: teks hasil ekstraksi tidak lagi disimpan ke disk, hanya hash dan metadata. Empat baris lama dibersihkan. `protections-test.mjs` 34/34. Impor file `.xlsx` dan `.docx` di perangkat (`src/file-import.js`, `GET /file-import.js`), 9/9.
- **Rating dan riwayat** (`reviews-api.js`, `activity-api.js`): satu rating 1–5 per run yang dieksekusi, ringkasan dengan rata-rata kosong bila belum ada ulasan, transaksi dan aktivitas per principal. `reviews-activity-test.mjs` 31/31.
- **H5** (`artifacts-api.js`): artefak tersegel dengan akses pemilik saja, plaintext ditolak. Draft mencatat `input_sources`, dan ekstraksi dokumen yang belum ditinjau ditandai. `artifacts-test.mjs` 9/9.
- **Kontrak market** di-deploy ulang dengan `transfer_method_owner` (tx `9goTYbmjEg6pUv96Ze4br2Q2yfVTMe9USJFXAvZyVT5U`, unit test 11/11, state utuh).
- **Akun penjual demo** (sub-akun `scientivan.testnet`, 0,4 NEAR testnet tiap akun): `arif-planner` (portofolio), `rani-procurement` (tender), `maya-careers` (gaji). 5 NEAR testnet dipindah dari `kalis-contrib.testnet` untuk dana (tx `AcdrJ7z5...`).
- **Market**: portofolio dipindah ke `arif-planner` lalu v5 (tx `3Vv2e2iB...`, manifest `f1d4a15c...`), gaji dipindah ke `maya-careers` lalu v2 (tx `7SgF6HrA...`, manifest `1da74aa6...`), tender didaftarkan `rani-procurement` (tx `D3aXvRDP...`) dan v1 (tx `6BY9HR2N...`, kode `5c377494...`, manifest `05798a13...`).
- **Metode tender** (WASM + DeepSeek, kode penjual di `app/methods/tender-bid/seller-private/guest`, gitignored, binary `method.wasm`): AI membaca dokumen dan menulis alasan, harga dihitung kode. Bila bacaan AI berbeda dengan persyaratan yang ditinjau pembeli, run berhenti di `match_review`. Uji lokal 9/9 (`client/tender-local-test.mjs`). Run berbayar di OutLayer: `run-mwfsdznc-d1f3d64f`, bayar `9tyVqiha...`, settle `3fRksfN9...` Released ke `rani-procurement`, harga 885,1 juta (90,3% HPS, batas bawah pembeli berlaku), kelima cek pembeli lolos, injeksi di dokumen tidak diikuti, verdict `safe`.
- **Regresi berbayar**: portofolio v5 (settle `AzSZSSCe...`, 9 cek lolos, `safe`), gaji v2 (settle `9oZ8nwg9...`, 6 cek lolos, `attention`).

Sedang berjalan (agent paralel): lima metode baru dan konektor `sheets_mock`, `docs_mock`, `wallet_mock`; login NEP-413 dan publikasi penjual; komunitas, uji privat, dan perintah runner `evaluate`. Belum: H3 (penyempitan model oleh pembeli ditegakkan runner), H4 (perlindungan terikat `run_id`), uji reclaim setelah batas waktu.

### 6.17 Login, publikasi penjual, komunitas, uji privat, runner build 823e99 (✅, 14 Nov 06:00 UTC)

- **Login NEP-413** (`src/auth.js`): challenge sekali pakai, verifikasi tanda tangan dan bahwa kuncinya full access di akun (RPC), session 12 jam, `/api/me`, profil, preferensi. `auth-test.mjs` 16/16 (akun uji `auth-test.scientivan.testnet`).
- **Publikasi penjual** (`src/sellers-api.js`): draft metode, artefak tersegel (plaintext ditolak), validasi, publish berupa contract call tanpa tanda tangan untuk wallet penjual, lalu konfirmasi dari chain. `sellers-test.mjs` 24/24 (metode uji `demo-publish-test`, disembunyikan dari daftar market). Bukti per versi (`app/methods/*/evidence/`) dan per run (`GET /api/runs/:id/evidence`).
- **Komunitas** (`src/community-api.js`): issue, proposal AddBounty, vote, bounty, klaim, kontribusi, uji, review oleh anggota council yang bukan kontributor, payout BountyDone sekali per bounty, publish versi kontributor. Wewenang dibaca dari policy DAO di chain, semua langkah uang berupa call tanpa tanda tangan. `community-test.mjs` 37/37. Proposal uji 2 dan 3 (0,001 NEAR) disetujui, bounty 1 dan 2 dibuat.
- **Uji privat**: kasus disegel ke kunci TEE, izin dengan persetujuan, tujuan, batas percobaan dan masa berlaku, pencabutan. `private-tests-test.mjs` 18/18. Usulan yang menunggu keputusan Dien: pencabutan saat uji berjalan menahan hasilnya.
- **Runner build `823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d`** (deploy 05:45 UTC, lock secret dipindah, kunci TEE dan kunci tanda selesai tetap): perintah `evaluate` (baseline dan kandidat dijalankan pada kasus tersegel, hanya status per kolom dan rekaman bertanda tangan `kalis-evaluation:v1:` yang keluar), dan `ai_restrict` (pembeli mempersempit model, H3). Regresi lokal 12/12, 8/8, 7/7, 6/6. Di OutLayer `client/evaluate-remote-test.mjs` 6/6 (call `fbdf90ea...` lolos, `67b300d6...` kandidat salah gagal di `cost`).
- **Versi baru di runner ini**: portofolio v6 (tx `2VKq39Gq...`), gaji v3 (tx `GRcHsAS7...`), tender v2 (tx `Eyc9JM3M...`). Smoke tender v2 Released (settle `HNeAKP9r...`), lima cek lolos, `safe`.
- **Reclaim setelah batas waktu**: `reclaim-test.mjs` 4/4, refund `4MuETRyfVeFpTiAQhbhWGfWAKTcF4JBYoKeXJPmYwq25`.

### 6.18 Delapan metode di market, semuanya lolos run berbayar (✅, 14 Nov 06:10 UTC)

| Metode | Penjual demo | Bentuk | Versi | Settle (Released) |
|---|---|---|---|---|
| portfolio-rebalance | `arif-planner` | WASM | v6 | `AzSZSSCe...` (v5) |
| tender-bid | `rani-procurement` | WASM + AI | v2 | `HNeAKP9r...` |
| salary-counteroffer | `maya-careers` | prompt | v3 | `9oZ8nwg9...` (v2) |
| defi-liquidation-guard | `bima-pratama` | WASM | v1 | `7AmeUtFV...` |
| cash-runway-13w | `sari-wulandari` | WASM | v1 | `4jhF6xCX...` |
| supplier-concession-plan | `dimas-hidayat` | prompt | v1 | `DxEf23Tm...` |
| token-unlock-sell-plan | `kenji-arakawa` | prompt | v1 | `Fz4BS8Ej...` |
| term-sheet-dilution | `laura-mendes` | prompt | v1 | `9HeoWmz8...` |

Semua akun penjual adalah sub-akun `scientivan.testnet` berlabel demo dan fiktif. Semua versi aktif memakai runner `823e99...`. Semua cek pembeli lolos. Verdict metode WASM `safe`, verdict metode prompt `attention`. Lima metode baru dibuat agent paralel (konektor `sheets_mock.read_range`, `docs_mock.read_document`, `wallet_mock.read_loans`, uji lokal 20/20, uji konektor 13/13, satu call OutLayer per metode). Source aturan penjual WASM di `app/guests/*` dan `seller-private/` di-gitignore.

**Masalah dan perbaikan.** Dua metode prompt kena batas 60 detik OutLayer ("WASM execution timed out after 60 seconds (penalty)"), dan run berbayarnya tertahan Paid. Backend kini meminta `resource_limits.max_execution_seconds: 180` (batas keras OutLayer) dan `X-Compute-Limit: 100000`. Setelah itu keduanya lolos. Dua run yang tertahan dijadwalkan reclaim otomatis setelah 30 menit (`data/` log di sesi).

**H3, H4, H8.** Pilihan model pembeli dikirim sebagai `ai_restrict` dan ditegakkan runner. Permintaan perlindungan dengan `run_id` memakai manifest versi yang dibayar run itu (`run-bound-test.mjs` 7/7). Daftar kredensial dan memori menampilkan status efektif dan aksi yang diizinkan. `protections-test.mjs` tetap 34/34.

### Antarmuka untuk frontend (dibuat Claude, dipakai Codex)

File `app/kalis-runner/client/kalis.mjs` (Node, perlu disesuaikan ke WebCrypto untuk browser).

- `sealMethod(teePubHex, wasmBytes)` untuk penjual. `sealData(teePubHex, caseObj)` mengembalikan `{sealed, secret}` untuk pembeli.
- Body panggilan: `POST https://testnet-api.outlayer.ai/call/scientivan.testnet/kalis-runner`, `{"input":{"cmd":"run","manifest":<teks manifest>,"method":<sealed>,"data":<sealed>},"secrets_ref":{"profile":"default","account_id":"scientivan.testnet"},"async":true}`. Payment key harus tetap di server, jangan dikirim ke browser.
- `openAnswer(secret, output)` mengembalikan `{method_sha256, manifest_sha256, answer, report}`. `report.runner_stages[]` dan `report.method_steps.reported[]` berisi `{id, ok, detail}`. `report.method_steps.missing/failed/undeclared` berisi id langkah. `report.all_ok` boolean.
- `recheckPortfolio(data, answer)` mengembalikan `{passed, checks:[{id, ok, message}], unverifiable}`. `message` adalah kalimat bahasa Inggris siap tampil.
- Usulan status tampilan: aman bila `report.all_ok`, `recheck.passed`, hash metode/manifest/runner cocok dengan registry, dan attestation cocok. Jangan dipakai bila ada salah satu yang gagal. Perlu perhatian untuk jawaban `infeasible`, karena klaim itu tidak bisa dicek di perangkat.

### 6.19 Lima perlindungan lewat runner privat tersegel (🟡 lokal saja)

Status per 15 November 2026. Migrasi dikerjakan Codex dan diselesaikan Claude. Semua bukti di bawah adalah **mode native development di satu mesin, bukan TEE**.

Jalur plaintext checkout sudah ditutup. run-page.tsx tidak lagi memanggil protections/private-values. Nilai private disimpan hanya di IndexedDB browser selama 24 jam untuk pemeriksaan outbound di perangkat. Proxy web menolak semua request ke api/protections/.

Lima perlindungan (credentials, memory, documents, outbound, browser agent) serta audit kini berjalan lewat protokol tersegel. Browser mengenkripsi setiap operasi ke kunci runner privat dan menandatanganinya dengan kunci perangkat yang tidak bisa diekspor. Backend hanya meneruskan ciphertext lewat POST /api/privacy/execute. Runner (app/kalis-runner/src/privacy.rs) memeriksa tanda tangan pemilik, revisi state dan nonce anti-replay, lalu mengembalikan hasil terenkripsi. Relay memakai ulang call OutLayer yang sama saat retry dan hanya menyimpan commitment serta output terenkripsi.

Bukti lokal. privacy-local-test.mjs 27 cek lulus, termasuk isolasi antar-pemilik, tanda tangan palsu ditolak, replay ditolak, PDF privat ditolak tanpa fallback plaintext, dan semua state tersimpan berupa ciphertext. privacy-http-test.mjs 13 cek relay lulus, termasuk endpoint plaintext lama ditolak. Regresi eksekusi portofolio lulus. Frontend build lulus dan 32 tes lulus (29 dan 3). Bukti browser (privacy-browser-test.mjs) menyimpan catatan berisi sentinel, reload, lalu memastikan sentinel tidak muncul di request mana pun, kunci perangkat non-extractable, dan tidak ada request ke endpoint lama. Hasil ada di audit/2026-11-14-private-migration/.

Yang belum saat itu, diperbarui oleh paragraf runner privat aktif di bawah. PRIVATE_RUNNER_HASH masih not-built, jadi belum ada build TEE yang di-attest dan dikunci. Dukungan storage/HTTP pada worker OutLayer testnet belum diprobe. Deploy runner privat, penguncian secret dan versi market memerlukan persetujuan Dien. Tanpa itu, halaman proteksi di deployment biasa menolak dengan private_runner_unavailable. Data lama di backend tidak dimigrasi atau dihapus. Kepemilikan data terikat ke satu browser, belum ada pemulihan atau multi-perangkat. Konektor di runner tetap mock berlabel. Dokumen publik tetap boleh diekstrak backend setelah opt-in eksplisit sesuai 65.1.

**Probe storage OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/storage-probe` (app/storage-probe, WASM `1ae28f54...`) memakai fungsi storage yang sama dengan runner privat. Call `6fb25965-de3b-4c85-9159-6207ebd6f00d` lulus enam langkah: key kosong terbaca kosong, set_if_absent berhasil, set_if_absent ulang ditolak, set_if_equals v1 ke v2 berhasil, set_if_equals dengan nilai basi ditolak, dan nilai terbaca v2. Call kedua `475453f1-2a40-448c-94ca-804faa3dc5d3` membaca v2, jadi data bertahan antar-eksekusi. Biaya compute 1000 per call. HTTP keluar dari TEE sudah terbukti sebelumnya (6.6 dan runner 0.5). Probe ini tidak menguji runner privat itu sendiri, kunci tersegelnya, atau batas ukuran storage.

**Runner privat aktif di OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/kalis-private`, build `457e260ccbb47381049266363c0f9c2fab5161f5c80fc439479dfe95e95d547e` (kalis-runner/0.6). `PROTECTED_SEAL_KEY` dibuat di dalam TEE dengan `--generate` dan dikunci ke build itu (profile `private`, whitelist `scientivan.testnet`). `NEAR_AI_API_KEY` disalin ke profile yang sama tanpa dicetak. Kunci publik TEE `685012c942a97e6d16266f6aefd00371d183b5fad120b2a1cdc315c9a096e959`, kunci tanda terima `0fc41697787c6c3623482a6726eecf8b148cb9ef9ccd9e7bac477c3ab93394a7` (call `47f7fc97-88d8-4514-8970-c90f2c92670d`). `PRIVATE_RUNNER_HASH` di backend dan web dipasang ke hash build ini. Backend mengaktifkan jalur TEE lewat `KALIS_PRIVATE_ENABLED=1`, `KALIS_PRIVATE_TEE_KEY` dan `KALIS_PRIVATE_RECEIPT_KEY` di `app/backend/.env` (gitignored).

Uji end-to-end `app/backend/scripts/privacy-remote-test.mjs` lewat relay backend ke TEE lulus 6 cek. Catatan berisi sentinel tersimpan (call `93e7ab28-f1af-4777-b619-1f1bfd02f142`), dibaca kembali pemiliknya di call terpisah (`86b804e5-db47-4289-b850-2487b3535ff2`), tidak terlihat oleh pemilik lain (`e2cfb716-4a08-432f-b2d0-cde15f79cec1`), dan revisi basi ditolak di dalam TEE. Setiap respons lolos pemeriksaan attestation terhadap build yang dipasang. Sentinel tidak muncul di request, respons, atau data backend. Uji ini hanya mencakup memory. Credentials, documents, outbound dan browser agent memakai jalur kode yang sama tetapi belum diuji satu per satu di TEE. Bukti browser terhadap TEE dan deployment web belum dilakukan. Data lama backend belum dimigrasi.

**Vault perangkat dan runner 0.7 (15 November 2026, Claude).** Atas keputusan Dien, data proteksi milik pemilik (daftar dan ubah catatan, koneksi, dokumen, persetujuan outbound, audit) kini disimpan terenkripsi di browser (IndexedDB, kunci AES-GCM non-extractable) dan diproses di perangkat. Backend tidak pernah menerima isinya. TEE hanya dipakai untuk aksi yang harus ditegakkan terhadap metode atau butuh rahasia tersegel, yaitu credentials.use, memory.recall, outbound.propose, outbound.execute, documents.ingest dan browser.act. Untuk aksi itu browser mengirim record pemilik tersegel bersama request, runner menerapkan aturan di memori, mengembalikan record baru tersegel ke pemilik, dan tidak menyimpan apa pun. Batas kedaluwarsa request naik dari 300 ke 900 detik karena antrean testnet sering lebih dari 5 menit, dan browser mengulang paket yang sama setelah timeout proxy. Build runner baru `cd95487f39bda73e054a569ac806c93cad11883d6a4e8651860e6fa7c9c39c19`, kunci segel dipindah dengan `secrets access --build`, kunci publik tidak berubah (call `4bacc9bb-e539-442f-9ff5-930852308bc7`, attestation mencatat hash build itu).

Ukuran waktu. Membaca daftar catatan lewat TEE di production butuh 295,5 detik. Lewat vault perangkat, simpan catatan 45 ms dan tampil setelah reload 165 ms (uji Chrome lokal), dan di production catatan tersimpan dan tampil kurang dari 1 detik tanpa request ke /api/privacy/execute. Uji native `privacy-vault-test.mjs` lulus 10 cek, termasuk token dan isi catatan tidak keluar dari kotak tersegel, aksi pemilik ditolak di runner, request antre 10 menit diterima, lebih dari 15 menit ditolak, dan runner tidak menyimpan apa pun. `privacy-local-test.mjs` 27 cek dan `privacy-http-test.mjs` 13 cek tetap lulus.

Batas. Aksi yang butuh TEE tetap menunggu antrean OutLayer testnet (sekitar 5 menit) dan belum diuji end-to-end di TEE pada build baru. Kepemilikan data tetap terikat satu browser. Pencegahan rollback sekarang dicek di perangkat, bukan di runner. Operator masih dapat melihat metadata seperti waktu dan ukuran request TEE.

### 6.20 Empat metode Web3 trading, tiga di antaranya penjaga agent untuk AI Security & Defense (✅, 15 Nov 2026, Claude)

Semua metode WASM tanpa AI, runner `823e9913…`, harga 0,08 NEAR, DAO 10%, penjual demo fiktif (sub-akun `scientivan.testnet`, kunci di keychain near-cli). Pembeli uji `auth-test.scientivan.testnet` login NEP-413 di production dan membayar `pay_for_run` dari wallet sendiri (`app/backend/scripts/buyer-wallet-runs.mjs`). Setiap run Released, semua cek pembeli lolos, attestation mencatat `executed_wasm_sha256 823e9913…`. Bukti lengkap per metode di `app/methods/<id>/evidence/testnet-runs.json`.

| Metode | Penjual | Versi | Verdict run | Call OutLayer | Settle |
|---|---|---|---|---|---|
| perp-risk-limit-fit (penjaga order agent) | `rizky-saputra` | v2 | BLOCK (o4 withdraw ter-inject) | `6c0905a8-8af2-457b-86ba-205e8190e39c` | `7BYjxL7R...` |
| token-scam-screen (serangan honeypot) | `yoga-prasetyo` | v1 | BLOCK | `970b6606-0080-476d-8f08-a21141a1524a` | `A7DrVZaa...` |
| token-scam-screen (token normal) | `yoga-prasetyo` | v1 | WARN | `011357a2-96be-4233-b595-d2d852463608` | `7b3Ufxue...` |
| large-swap-split (rencana sandbox) | `dewi-anggraini` | v2 | WARN (KuCoin diblok) | `65358d88-f7b0-4e90-b9f9-f7919c156362` | `379XRQjr...` |
| strategy-robustness-audit | `nadia-rahman` | v1 | fragile | `092f4c0a-b29c-4304-ad11-cb79ec298559` | `H6nXk5au...` |

v1 perp-risk-limit-fit dan large-swap-split (cek batas risiko, split penjualan) juga sudah dibayar, dijalankan dan diulas sebelum reframing (call `52dd1fe9-...`, `b9fe12ca-...`). Ulasan hanya dari run Released milik pembeli. Uji lokal `trading-methods-local-test.mjs` 19/19, termasuk jawaban yang dipalsukan (meloloskan order atau token yang diblok) selalu gagal cek perangkat. Konektor Web3 di katalog (Binance, OKX, Coinbase, KuCoin, NEAR wallet, WalletConnect, TradingView) berlabel coming soon; Hyperliquid, Ref Finance dan MetaMask tidak ada di Simple Icons 13.21.0 sehingga dilewati. Batas: pencocokan prompt injection berbasis kata kunci; fakta on-chain diberikan pembeli, metode tidak membaca chain; marketplace memberi metode baru warna dan ikon default karena daftar identitas di `marketplace-next.tsx`, `tiles.tsx`, `method-detail.tsx` belum diperbarui.

### 6.5 Kontrak registry (✅)

Kontrak `registry.scientivan.testnet`. Fungsi: `register_method`, `publish_version`, `get_method`, `list_methods`, `get_version`, `list_versions`. Setiap versi menyimpan `code_hash` (WASM penjual), `manifest_hash`, `runner_hash`, `parent`, `contributors`, `note`. Biaya storage dibayar pemanggil lewat deposit, sisanya dikembalikan. Event NEP-297 `method_registered` dan `version_published`.

- Daftar metode `portfolio-rebalance`, tx `45WWbRAnmc8qZFuyNxUSzJaHNouXX9nRJdfS4NrApx5x`.
- Publikasi versi 1, tx `JBqdPToBMRfVHMNDxpUvNJ2VmZFC3K1VTqugqW4D3rMp`. `code_hash d369c2697cc02393aaf25f7df2d6068e40ac4f6f93254f2dd932c73f6b40bc96` (guest solver), `manifest_hash 8124a6f8ba0e75842cbbacfb3fd31aa8015a35e910d743a44d2e035b0b1d01e9`, `runner_hash cbf2dc31...` (runner-spike).
- Ditolak sesuai harapan: publikasi oleh bukan pemilik (tx `9cQ2h5QPmDRHeYwrawT7HZmJ8wUqT2qN8Qn1n94t7Tbz`), hash tidak valid (`5DwQg9rz5sMjTc9DMcGXFed8PEvRZ2sQf3rsEYM13gfi`), `method_id` ganda (`8jsBLSavsKGQVBds5evQqaksVB2UFh1ttc9SDPX4B7fM`).
- `get_version` dan `list_methods` mengembalikan data versi 1 dengan benar.

**Pesan error diperbaiki (13 Nov 15:15 UTC, Claude).** Penyebabnya build dengan rustc 1.89, sedangkan `cargo-near` 0.20.3 hanya menerima rustc paling baru 1.86 untuk near-sdk ini. Kontrak dibangun ulang dengan `cargo +1.86.0 near build non-reproducible-wasm` (`rust-version = "1.86"` di `Cargo.toml`) dan di-deploy ulang tanpa init, tx `5ihYesy7FofFHu295ageUF8vAmC6yFLMcarVTkeZXjDR`. State tetap utuh, `get_version` masih mengembalikan versi 1. Uji penolakan bukan pemilik sekarang menampilkan `Smart contract panicked: only the method owner can publish a version` (tx `Aq3xdrDfAqg3CF2BoDRCzU5ueSojNqFQCCZWNd7SxpjR`). Unit test 5/5 lolos dengan `cargo test` (profil debug; profil release memakai `panic = "abort"` sehingga test `should_panic` tidak bisa berjalan).

## 7. Lima perlindungan (bagian 3 dan 49)

Implementasi backend di `app/backend/src/protections/`, bukti di 6.14. Semua ditegakkan berdasarkan manifest metode.

| Perlindungan | Status | Yang berjalan | Batas |
|---|---|---|---|
| Kredensial dan integrasi | ✅ | Token konektor `broker_mock` terenkripsi AES-256-GCM, scope baca saja, kedaluwarsa, bisa dicabut. Metode tanpa deklarasi konektor ditolak. `place_order` tidak pernah bisa. Token tidak pernah dikembalikan atau dicatat | Broker berjalan di backend, bukan TEE |
| Aliran data keluar | ✅ | Setiap kirim ditahan sampai disetujui. Persetujuan terikat hash tujuan, isi, dan parameter. Isi berubah ditolak. Nilai privat yang ditandai terdeteksi walau ditulis ulang (812000000, 812 juta). Tujuan di luar manifest diblokir | Deteksi berbasis nilai yang ditandai pengguna, bukan pemahaman makna |
| Memori persisten | ✅ | Usulan dari dokumen, web, atau metode menunggu tinjauan dan menyimpan asal. Teks mirip perintah ditandai. Metode hanya menerima catatan yang disetujui, dibungkus sebagai data. Edit, tolak, hapus | Deteksi perintah berbasis pola teks |
| Dokumen multimodal | ✅ | Scan dibaca Qwen3-VL di TEE NEAR AI dengan attestation nonce baru dan tanda tangan jawaban terverifikasi. PDF teks dibaca `pdftotext` lokal. Data pribadi dicek `privacy-filter` teratestasi. Injeksi di dokumen ditandai | Dokumen melewati backend menuju NEAR AI. PDF scan harus diunggah sebagai gambar |
| Browser agent | ✅ | Hanya domain dan aksi dari manifest (`open`, `download`). `submit` menjadi aksi keluar yang ditahan. `login` tidak pernah. Unduhan lewat perlindungan dokumen | Agent HTTP, bukan browser headless. Berjalan di backend, bukan TEE |

## 8. Daftar mock dan data sintetis

| Item | Kondisi terkini |
|---|---|
| Fiat top-up | Mock berlabel, akun platform membayar NEAR testnet, bukan saldo fiat |
| Konektor broker, sheets, docs dan wallet | Implementasi mock backend tersedia, bukan integrasi layanan atau trading nyata |
| Portal pengadaan tender | Mock HTTP tersedia, bukan browser agent headless |
| Portofolio, tender, karier dan metode demo lain | Data/seller demo fiktif, bukan nasabah atau saran profesional |
| Rating dan riwayat testnet | Bisa berasal dari seed/script, bukan bukti pelanggan nyata |
| Public deployment | Aktif sejak 15 November 2026. App di app.kalis.scientivan.dev, API di api.kalis.scientivan.dev, landing redirect sementara (commit e07d4ef) |


## 9. Buku klaim README

| Klaim | Status | Bukti atau batas |
|---|---|---|
| Runner membuka input/metode tersegel dan mengembalikan jawaban tersegel | Ada bukti historis | 6.1, 6.8, 6.15–6.18, sesuai versi |
| Seluruh website hanya mengirim ciphertext kepada backend | Tidak boleh diklaim | run-page.tsx pay mengirim field private plaintext, outbound.markPrivate menyimpannya |
| Lima perlindungan tersedia | Ya pada backend biasa | 6.14, bagian 7, CURRENT_STATE.md. Bukan lima fungsi dalam TEE |
| AI evidence dan sandbox | Ada implementasi/bukti historis | Jangan menyamakan dengan verifikasi rantai sertifikat Intel/NVIDIA penuh |
| Registry/escrow aktif | market.scientivan.testnet | registry.scientivan.testnet historis |
| Dana DAO dan bounty pernah dibayar | Bukti historis 6.11–6.12 | Bukan semua bounty sekarang siap diuji, bukan request call sudah dibayar |
| Publikasi editor dan wallet UI tersedia | Source tersedia | SellerEditor dan auth.signCalls, audit sekarang tidak signing |
| Katalog memiliki sembilan metode saat audit | GET methods berhasil | Bukan bukti run berbayar seluruh versi aktif |
| Kontributor mendapat royalti | Belum | Royalti, pengklaim bersaing dan sengketa masih terbuka |
| Produk privat dari operator tanpa batas | Tidak boleh diklaim | Jalur protections sudah tersegel secara lokal, tetapi runner privat belum di-deploy sebagai TEE (6.19) |
| Keunggulan metode, profit dan adopsi teruji | Tidak boleh diklaim | Benchmark dan rating demo tidak membuktikannya |


## 10. Belum terverifikasi

Gap terkini mencakup wallet E2E penuh, mobile/aksesibilitas, privasi checkout, enforcement reviewer, policy revoke dan legacy bounty. Daftar riset lama berikut tetap konteks dan tidak berarti seluruh fitur terblokir.

- Rantai sertifikat Intel dan NVIDIA pada quote OutLayer dan NEAR AI.
- Kecepatan interpreter `wasmi` di dalam OutLayer untuk metode yang lebih berat dari C03 (C03 sekitar 5,3 detik).
- Jalur keluaran HTTPS OutLayer melalui koordinator (inferensi, belum dicek di kode).
- Apakah fungsi storage dan transaksi NEAR OutLayer bisa dibatasi per project.
- Status hukum crypto sebagai alat bayar di Indonesia (bagian 50).

## 11. Tugas berikutnya (urut prioritas)

Status lama tentang OutLayer gagal, frontend mock-only, tender belum dibuat dan API belum terintegrasi sudah digantikan. Log lama tetap di bagian bukti/changelog.

1. Sinkronisasi dokumen dua arah berdasarkan bagian 0 dan 70 rancangan serta CURRENT_STATE.md. Audit ini tidak mengubah kode produk.
2. Bahas inovasi Social Money bersama Dien dari fund/proposal/bounty/evaluation yang sudah ada. Belum memilih fitur baru atau policy.
3. Gap privasi checkout, reviewer enforcement, revoke policy dan bounty legacy dicatat di CURRENT_STATE.md serta app/web/FRONTEND_GAPS.md untuk keputusan/perbaikan terpisah.
4. Verifikasi wallet E2E, mobile dan aksesibilitas hanya pada lingkup yang dibutuhkan dan dengan otorisasi transaksi yang sesuai. Jangan memakai seed atau pembacaan halaman sebagai bukti pembayaran.
5. README dan video mengikuti bukti versi aktual serta batas privasi. Deployment dan DNS ditunda saat itu, kemudian dilakukan 15 November 2026 (rancangan bagian 73).


### Log historis percobaan ulang OutLayer

Perintah uji: `outlayer run scientivan.testnet/sealed-probe '{"cmd":"pubkey"}' --secrets-profile default --secrets-account scientivan.testnet` (dari `app/sealed-probe`), lalu `outlayer run scientivan.testnet/runner-spike '{"cmd":"ping"}'` (dari `app/runner-spike`).

| Waktu (UTC) | sealed-probe | runner-spike ping | Catatan |
|---|---|---|---|
| 13 Nov 11:45 | ✅ (request 38119) | belum ada | Satu percobaan pertama sempat timeout, percobaan kedua berhasil |
| 13 Nov 12:00–12:05 | ❌ (38332) | ❌ (38322) | `Execution promise failed` |
| 13 Nov 12:12 | ❌ | ❌ | Masih gagal |
| 13 Nov 12:42 | ❌ | belum dicoba | Masih gagal |
| 13 Nov 15:10 | ❌ | ❌ | Masih gagal (Claude) |
| 13 Nov 15:43 | ❌ on-chain | ✅ HTTPS (call `5c9d36a7...`) | Jalur HTTPS jalan, on-chain masih gagal |

## 12. Runbook

```bash
# Build program TEE (dari folder project masing-masing)
cargo build --release --target wasm32-wasip2

# Upload ke FastFS dan deploy versi project
outlayer upload target/wasm32-wasip2/release/<file>.wasm
outlayer deploy <project> <FastFS URL>

# Jalankan (jalur on-chain testnet)
outlayer run scientivan.testnet/<project> '<json>'
outlayer run scientivan.testnet/sealed-probe '{"cmd":"pubkey"}' --secrets-profile default --secrets-account scientivan.testnet

# Uji enkripsi
cd app/sealed-probe && cargo build --release && node client/local-test.mjs target/release/sealed_probe
node client/remote-test.mjs <tee_pubkey_hex> C03 <folder sementara>

# Uji NEAR AI Cloud
node app/near-ai-probe/verify.mjs

# Cek attestation OutLayer
curl -s https://testnet-api.outlayer.ai/attestations/by-request/<request_id>

# Cek worker OutLayer testnet
curl -s https://testnet-api.outlayer.ai/public/workers
```

Catatan: CLI `outlayer run` bisa menampilkan `timeout error` walau eksekusi masih diproses. Cek hasil lewat tx di RPC atau `attestations/by-request`.

## 13. Kendala lingkungan

- **Disk laptop sempat penuh.** Pada 13 Nov 12:20 UTC sisa 122 MB dan build gagal `No space left on device`. Dien mengosongkan disk, sisa 13 GB pada 12:42 UTC. Pantau dengan `df -h /System/Volumes/Data` sebelum build besar.
- `cargo-near` terbaru (0.23.0) butuh rustc 1.95. Instalasi versi 0.20.3 sempat dihentikan akibat disk penuh, lalu dilaporkan selesai pada sesi Claude 13 Nov 13:30 UTC. Kontrak testnet sebelumnya dibangun dengan `cargo build --target wasm32-unknown-unknown --release` dan `RUSTFLAGS="-C link-arg=-s"`. Sudah dibangun ulang dengan toolchain 1.86.0 dan di-deploy ulang 13 Nov 15:15 UTC (6.5). Build kontrak NEAR berikutnya wajib `cargo +1.86.0 near build non-reproducible-wasm`.

## 14. Batas agent

Tanpa konfirmasi eksplisit Dien dilarang: submission, posting X, membuat repo publik, push, signing di mainnet, mengeluarkan dana nyata, deploy mainnet, commit secret (`../NEAR.md` Compliance gate poin 7). Transaksi testnet dengan NEAR faucet sudah diizinkan untuk development.

## 15. Changelog

- 14 November 2026, Codex. Menyimpan riset delapan website pembanding dan brand system resmi n8n. Rekomendasi tetap usulan, audit visual belum dilakukan. Lihat bagian 68 rancangan dan research/website-reference-2026-11-14.md.

- **13 Nov 2026 (Claude Code).** Akun `scientivan.testnet` dan OutLayer CLI. Uji enkripsi `sealed-probe` lolos lokal dan testnet. Temuan koordinator OutLayer. Klaim kredit NEAR AI dan uji attestation lolos. Keputusan opsi B. Spike runner lolos lokal, gagal di testnet dengan dugaan gangguan layanan. Dokumen ini dibuat.
- **13 Nov 2026 12:30 UTC (Claude Code).** OutLayer dicoba ulang, masih gagal. Kontrak registry ditulis, di-deploy ke `registry.scientivan.testnet`, metode portofolio versi 1 tercatat. Draf manifest metode portofolio. Disk penuh ditemukan dan sebagian dibersihkan.
- **13 Nov 2026 13:30 UTC (Claude Code).** Disk dikosongkan Dien (13 GB). Unit test kontrak 5/5 lolos, `cargo-near` 0.20.3 terpasang. OutLayer 12:42 masih gagal. Nama Kalis, `PRODUCT.md`, arah batik tulis, draf hero artifact v1.
- **13 Nov 2026 (Codex, serah konteks).** Membaca seluruh pesan percakapan Claude sesi `333cb961-537f-41ee-afce-3622d35df115`, jawaban pertanyaan terstruktur dan bukti unit test yang relevan. Mencocokkan dengan dokumen produk dan preferensi desain. Memperbaiki catatan unit test dan instalasi `cargo-near` yang tertinggal dari changelog. Tidak menjalankan ulang layanan atau mengubah produk.
- **13 Nov 2026 (Codex, revisi hero).** Pengguna menolak draf batik dan memilih arah HelloNear yang simpel, bersih dan interaktif. Draf hero diganti dengan adegan Three.js buatan sendiri, interaksi kursor, pilihan tiga tahap, kontrol jeda dan reduced motion. Bukti memakai sealed-probe historis dan data sintetis. Tidak ada API atau transaksi. Aset lokal, anchor, sintaks dan kontras diperiksa. Browser/localhost diblokir sandbox, sehingga review render belum selesai. Dokumen rancangan dan PDF diperbarui ke v1.31. OutLayer tidak dicoba ulang karena pekerjaan hanya preview desain.

## 16. Titik lanjut setelah serah konteks Claude ke Codex

- Permintaan Dien saat serah konteks adalah memahami pembahasan agar dapat dilanjutkan di sesi Codex. Belum ada permintaan baru untuk mengubah desain atau menjalankan build.
- Target desain terdekat adalah review pengganti hero `design/kalis-hero.html` berdasarkan HelloNear. Artifact Claude lama merupakan draf yang ditolak dan tersimpan di `design/kalis-hero-v1.html`. Bukti yang ditampilkan tetap memakai `sealed-probe`, bukan runner opsi B.
- Arah terbaru simpel, bersih dan interaktif seperti HelloNear, copy Inggris, SF Pro system stack dan warna solid. Batik boleh menjadi aksen halus. Rincian preferensi ada di `~/.claude/DESIGN-PREFERENCES.md`. Dien meminta impeccable dan UI UX Pro Max untuk pekerjaan desain.
- Dua pilihan bernama A dan B berasal dari pembahasan berbeda. Opsi A pada bagian 51 memilih OutLayer sebagai tempat eksekusi. Opsi B pada bagian 52 memilih kode penjual di sandbox runner platform. Keduanya berlaku bersama.
- Lima perlindungan adalah cakupan yang disepakati untuk dibangun, bukan lima fitur yang sudah selesai. Status implementasinya tetap mengikuti bagian 7.
- Penyebab kegagalan OutLayer belum pasti. Percobaan terakhir yang tercatat tetap 12:42 UTC. Saat melanjutkan pekerjaan implementasi, ikuti jadwal percobaan ulang di bagian 11 dan catat bukti baru.
- Belum ada keputusan baru tentang pilihan DAO, skema final manifest, pembagian pembayaran, refund atau sengketa. Jangan mengubah usulan lama menjadi keputusan.

### Review layout section pendukung, 13 November 2026

Dien meminta revisi khusus pada Private by purpose dan daftar tiga langkah. Draf kini memakai satu panel proses berurutan dan tab use case dengan panel tunggal. File tambahan `design/kalis-sections.css` dan `design/kalis-sections.js`. Sintaks dan interaksi tab diperiksa, termasuk keyboard, fokus, visibilitas panel tunggal dan orientasi mobile. Browser masih diblokir sandbox, sehingga hasil render belum diperiksa visual. Menunggu review Dien. Tidak ada transaksi, perubahan backend atau percobaan ulang OutLayer. Rancangan MD dan PDF disinkronkan pada bagian 53.1.

### Review isi tab dan kontrol, 13 November 2026

Dien menyukai kemasan panel proses dan tab use case, lalu meminta perapian isi tab, visual tombol How it works dan kejelasan kontrol tahap. Draf kini memakai tiga baris fakta yang sejajar per use case, tombol sekunder yang jelas dan stepper bernomor dengan tahap aktif serta status yang berubah. Sintaks, referensi elemen, kontrol tahap dan reduced motion lolos pemeriksaan lokal. Render browser belum diperiksa. Perubahan dicatat di rancangan bagian 53.2 dan PDF halaman 40. Tidak ada perubahan backend atau transaksi.

### Pembacaan menyeluruh untuk pembahasan hook hero, 13 November 2026

Atas permintaan Dien, Codex membaca ulang seluruh RANCANGAN_PRODUK.md dari bagian 0 sampai 53.2, termasuk riwayat benchmark, bisnis, lima perlindungan, kontribusi modular, kasus uji privat, dana bersama dan keputusan terbaru. Opsi hook sebelumnya belum dipilih. Pembahasan hook perlu mempertimbangkan workspace privat, transaksi keahlian dua pihak dan perbaikan bersama, dengan kemampuan terbangun tetap dibedakan dari rancangan. Tidak ada perubahan copy hero atau keputusan produk baru pada giliran pembacaan ini.

### Hook hero dipilih, 13 November 2026

Dien memilih “Where expertise is traded, run privately, and improved together.” Hook diterapkan di design/kalis-hero.html dengan pemenggalan responsif. Tidak ada perubahan kontrol, backend atau kemampuan produk. Keputusan dicatat di rancangan bagian 53.3, PDF dan PRODUCT_MEMORY.md. Render browser belum diperiksa karena batas sandbox.

### Deskripsi dan background hero, 13 November 2026

Atas permintaan Dien, deskripsi diselaraskan dengan perdagangan metode, privasi dua pihak dan pendanaan perbaikan. Background polos diganti lanskap orisinal melalui imagegen bawaan, disimpan di design/assets/kalis-landscape-v1.webp (1672 × 941, 76.418 byte). Prompt/provenance di file pendamping. Aset diperiksa visual, render halaman terintegrasi belum diperiksa karena sandbox. Tinggi background mengikuti ukuran hero. Rancangan bagian 53.4 dan PDF disinkronkan. Draf belum disetujui. Tidak ada transaksi atau perubahan backend.

### Adegan hero modular, 13 November 2026

Dien menyukai background dan meminta foreground menyatu dengan privacy, expertise dan pengembangan bersama. Atas izin percobaan, cincin diganti bidang kerja Three.js dengan input tersegel, ruang eksekusi, modul metode dan keluaran. Preview an improvement memperlihatkan kontribusi bergabung/reset. Konstruksi geometri nyata dan state diuji di Node memakai renderer pengganti, bukan render piksel. Sintaks lolos. Render browser tetap belum diperiksa. Draf lama script tersimpan di design/kalis-hero-orbit-v1.js. Rancangan bagian 53.5 dan PDF disinkronkan. Tidak ada backend kontribusi atau transaksi baru.

### Ilustrasi siklus produk lengkap, 13 November 2026

Dien menolak scene abstrak dan meminta alur produk lengkap. Setelah giliran terputus, pekerjaan dilanjutkan sampai CSS dan kontrol selesai. Hero aktif memakai ilustrasi UI enam tahap melalui design/kalis-story.css dan design/kalis-story.js. Tahapnya publikasi, pembelian, eksekusi privat, hasil, aliran pembayaran/dana dan perbaikan versi. Three.js tidak lagi dimuat oleh HTML aktif. File lama dipertahankan sebagai riwayat.

Pemeriksaan lokal lolos untuk sintaks, enam panel, navigasi langsung dan sebelumnya/berikutnya, batas tombol, playback selesai, jeda saat halaman tersembunyi, reduced motion manual, aset dan ARIA. Detector terbatas tidak menemukan temuan regex. Render desktop/mobile belum diperiksa karena sandbox. Rancangan bagian 53.6, PDF dan memori diperbarui. Draf menunggu review. Tidak ada API, transaksi atau backend baru. OutLayer tidak dicoba ulang dalam pekerjaan desain ini.

### Kelanjutan pemeriksaan kontrol cerita, 13 November 2026

Playback diperbaiki agar tombol putar melanjutkan tahap yang sedang dipilih atau dijeda. CTA Explore tetap memulai dari awal dan putar setelah tahap terakhir mengulang cerita. Uji Node VM lolos untuk pemilihan tahap, pause/resume, kemajuan timer, restart CTA, replay akhir dan reduced motion. Sintaks JavaScript lolos. Tidak ada keputusan produk baru, perubahan backend atau transaksi. Render browser masih belum terverifikasi karena batas sandbox yang telah dicatat.

### Pembagian kerja agent (13 Nov 2026, dari Dien)

**Diperbarui 14 Nov 2026 07:00 UTC (Dien).** Frontend `app/web` (Next.js) dikerjakan Codex mulai sekarang, mengikuti `FRONTEND_GUIDE.md` (aturan desain, palet, layout, peta navigasi, mock acuan `design/app/marketplace-luno-crypto.html`), `app/backend/API.md`, dan `app/methods/MANIFEST_V5.md`. Backend tetap Claude Code. Jangan mengubah backend dari sisi frontend; minta lewat file kebutuhan seperti sebelumnya.

**Diperbarui 14 Nov 2026 02:10 UTC (Dien).** Codex berhenti mengedit. Claude Code mengerjakan seluruh backend (10 pekerjaan rencana dan semua butir A–H di `app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md`), lalu frontend `app/web`. Urutan: inti demo dulu (kelompok A, manifest v5, tender, 8 metode), lalu rating, riwayat, login NEP-413, publikasi penjual, komunitas, uji privat, H5, H7, H8. Kebijakan di RANCANGAN 65.4.

*Pembagian lama (13 Nov):* Codex mengerjakan tampilan frontend (`design/`, nanti app Next.js). Claude Code mengerjakan semua selain frontend: OutLayer dan runner, kontrak NEAR, DAO dan bounty, lima perlindungan di sisi backend, metode tender, API yang dipakai frontend, README dan bukti. Jangan mengedit file milik agent lain tanpa koordinasi. Antarmuka backend untuk frontend dicatat di dokumen ini saat dibuat.

### Hero animasi minimal, 13 November 2026

Permintaan Dien diterapkan dalam draf 53.7. Enam adegan objek vektor menggantikan panel teks, navigasi terpisah dihapus, kontrol ringkas berada dalam hero. Auto-next 7 detik, jeda manual dan reduced motion manual. Uji Node VM lolos untuk autoplay, wrap, pause, halaman tersembunyi, reduced motion dan satu panel aktif. ID SVG/HTML dan referensi valid. PDF 45 halaman terverifikasi tanpa overflow. Render browser tetap belum diverifikasi karena pembatasan lingkungan yang tercatat. Tidak ada backend atau transaksi baru.

### Revisi screenshot hero dan Three.js

Konflik position absolute pada scene-caption diperbaiki dengan class terisolasi dan normal flow. Three.js lokal kini membangun enam kegiatan dengan warna lanskap, SVG fallback dipertahankan. Caption/controls berlatar solid, fokus menjeda, target kontrol utama 44px, titik tahap 28px. Sintaks kedua script lolos. Render WebGL/browser belum terverifikasi, tidak mengklaim audit WCAG penuh. Rancangan 53.8 dan PDF disinkronkan. Tidak ada transaksi, tidak ada konflik gate NEAR.

### Pembaruan memori preferensi desain

Preferensi Dien untuk tidak memakai karakter bullet points disimpan di PRODUCT_MEMORY.md. Tidak ada perubahan implementasi atau keputusan kemampuan produk.

### Kelanjutan kontrol dan preferensi teks

Pemisah karakter bullet pada preview dihapus. Konflik focusin pada tombol play/pause diperbaiki agar klik jeda pertama tidak menyalakan ulang cerita. Sintaks diperiksa. Batas verifikasi visual sebelumnya tetap berlaku. Rancangan 53.9 dan PDF diperbarui. Tidak ada konflik aturan NEAR atau transaksi baru.

### Orientasi halaman aplikasi

Dien mengalihkan fokus sementara dari landing page ke aplikasi dan meminta pembacaan ulang rancangan. Bagian 0–11, 21–23, 29–30, 44–52 serta keputusan 54 ditinjau untuk kebutuhan UI. Aplikasi mencakup workspace privat, penemuan/publikasi metode, izin dan hasil eksekusi, saldo/transaksi serta perbaikan dan dana bersama. Struktur beranda masih usulan, belum implementasi. Pembagian pembayaran dan Sputnik DAO mengikuti bagian 54, bukan asumsi lama. Tidak ada perubahan backend.

### Pembahasan sidebar aplikasi

Istilah metode marketplace dan perpindahan fokus aplikasi dicatat di rancangan bagian 55, PDF dan memori. Sidebar per peran masih usulan, belum diimplementasikan atau disetujui. Tidak ada perubahan backend atau transaksi.

### Audit cakupan sidebar

Pemetaan seluruh area produk ke lima parent dan alternatif enam parent dicatat sebagai usulan di rancangan 56 dan PDF. Tidak ada implementasi UI atau keputusan final. Activity diarahkan menjadi inbox, dana bersama dipisahkan dari uang pribadi, dan operasi mengikuti kewenangan. Tidak ada konflik compliance NEAR.
- **13 Nov 2026 16:45 UTC (Claude Code).** USDC testnet di-mint dari `usdc.fakes.testnet`, payment key OutLayer dibuat. Jalur HTTPS OutLayer jalan. Uji jaringan: manifest `network: []` memblokir koneksi (6.7). `kalis-runner` opsi B dengan metode dan data tersegel lolos 12/12 lokal dan C03/C09 di testnet (6.8). Versi 2 metode portofolio tercatat di registry. Kontrak registry dibangun ulang dengan rustc 1.86 sehingga pesan error tampil.

### Draf aplikasi Kalis, kelanjutan setelah usage limit

Draf frontend lokal design/app/index.html selesai untuk review. Lima tujuan utama Workspace, Marketplace, Community, Activity dan Balance, ditambah dropdown nama Dien untuk Account, Connections, Permissions & preferences. Struktur mengadaptasi screenshot Corbel. Semua data contoh dan perubahan hanya selama sesi. Tidak ada integrasi backend, transaksi atau deployment.

Alur yang dapat dicoba mencakup navigasi, pencarian metode/pekerjaan, filter, pembuatan draf pekerjaan, hasil C03 historis, persetujuan memori dan tindakan contoh, draf metode, top-up mock dengan gagal/coba lagi/batal, serta pengaturan akun. Community menampilkan keadaan kosong untuk data yang belum terhubung.

Sembilan pemeriksaan controller di design/app/verify.cjs lolos. Sintaks script lolos. Reviewer terpisah mengonfirmasi delapan temuan kode sudah resolved. Struktur shell/aset/ARIA dan tujuh pasangan kontras diperiksa. Browser tetap terblokir MachPortRendezvous permission denied 1100, sehingga belum ada screenshot valid atau klaim WCAG/visual penuh. Detector impeccable degraded regex, CLI RYUX tidak tersedia tetapi skill dibaca dari sumber resmi. Bukti dan batas lengkap di design/app/REVIEW.md.

Dokumen produk bagian 57, PDF, memori serta dokumentasi artifact disinkronkan. Skill documenter sempat terhenti karena usage limit dan dilanjutkan. Menunggu review visual Dien. Pemeriksaan compliance NEAR tidak menemukan konflik. Status backend milik Claude Code tidak diubah.
- **13 Nov 2026 17:30 UTC (Claude Code).** Laporan eksekusi, cek ulang pembeli, dan pencocokan attestation dibangun dan lolos di testnet (6.9). Registry versi 3. Antarmuka untuk frontend dicatat.


## 14 November 2026, audit screenshot aplikasi oleh Codex

Pengguna menolak beberapa pola visual draf dan meminta riset detail metode. Analisis tercatat di design/app/CRITIQUE.md, rancangan bagian 58 dan PRODUCT_MEMORY.md. Dua assessment independen diizinkan. Belum ada perubahan frontend atau backend. Bukti render berasal dari screenshot pengguna, native browser tetap tidak terverifikasi. Cek aturan NEAR tidak menemukan konflik pada analisis dan dokumentasi lokal ini.


## Revisi Marketplace, 14 November 2026

Katalog, detail, My methods dan Create method di design/app diperbarui. Ditambah Reviews, Versions dan Contributions per metode. Rating dan jumlah ulasan terlihat dengan keadaan kosong jujur. Metadata input/hasil/akses/batas draf disimpan dan di-escape. Sebelas controller checks lolos. Sintaks dua script lolos. Belum ada audit render browser. Tidak ada perubahan backend atau transaksi. Cek aturan NEAR tidak menemukan konflik.
- **13 Nov 2026 17:45 UTC (Claude Code).** Keputusan escrow berbasis tahap, aturan yang bisa dicek pembeli, dan tambalan instruksi dicatat (rancangan bagian 56). Runner 0.3 dengan padding rerun, registry versi 4. Selisih instruksi hanya berkurang sebagian (6.10).


## Kajian referensi OKX Marketplace

Dua halaman pilihan pengguna dibaca melalui HTML dan CSS publik. Temuan dan batas bukti disimpan di design/app/OKX_REFERENCE.md dan rancangan bagian 60. Tidak ada perubahan frontend pada sesi kajian ini. Tidak ada pengujian klik/browser atau klaim perilaku Use now. Cek aturan NEAR tidak menemukan konflik.


## Penerapan visual referensi OKX

Cover JPEG lokal ditambah ke design/app/assets. Katalog memakai kartu horizontal dengan satu tautan, identitas detail memakai cover yang sama, Reviews mendapat ringkasan skor/distribusi kosong, dan form pembuat menyimpan pilihan cover serta preview. Source app.js/app.css/data.js diperbarui. Sebelas controller checks dan sintaks lolos. Render browser belum terverifikasi. Dokumentasi produk/PDF diselaraskan. Tidak ada konflik aturan NEAR.


## Audit cakupan frontend menyeluruh, Codex

Pemetaan kebutuhan dan batas tersedia di design/app/COVERAGE.md. Ditambah flows.js dan 23 rute untuk konfigurasi, input/model/checkout, izin kasus, report, escrow dan draf alur komunitas. Catatan sesi mempunyai rujukan silang dan tautan kelanjutan. Viewer report/escrow memakai fixture berlabel. Enam belas controller checks dan sintaks lolos. Belum semua perjalanan terhubung utuh atau memakai backend. Jangan menyebut seluruh fitur selesai. Reviewer mengidentifikasi celah yang dipertahankan dalam matriks. Aturan NEAR diperiksa, tidak ada konflik, signing, spending atau deploy.
- **13 Nov 2026 18:15 UTC (Claude Code).** Tanda selesai bertanda tangan TEE (runner 0.4). Sputnik DAO `kalis-fund` dibuat. Kontrak market (registry + escrow + pembagian) di-deploy, unit test 9/9. Alur penuh sukses dan gagal lolos di testnet (6.11).
- **13 Nov 2026 18:50 UTC (Claude Code).** Folder build tak terpakai dibersihkan (sekitar 6 GB). Langkah 4 dan 5 selesai: bounty Sputnik DAO, perbaikan metode v2 oleh `kalis-contrib.testnet`, versi 2 di market, run berbayar dengan versi 2 (6.12).
- **13 Nov 2026 19:20 UTC (Claude Code).** API backend `app/backend/` dengan modul kripto browser, kontrak API untuk Codex, dan smoke test sukses dan gagal lewat API (6.13).
- **13 Nov 2026 18:40 UTC (Claude Code).** Lima perlindungan di backend dengan 33 uji lulus (6.14). Portofolio versi 3 dengan manifest konektor. Manifest draf tender. Dokumen tender fiktif dengan injeksi.


### Codex kembali setelah handoff Claude

Transkrip sesi Claude fa84e545-7c4f-4d63-a24d-f8561868c297 dibaca dan dicocokkan dengan rancangan bagian 63, app/web/COVERAGE.md serta struktur komponen saat ini. Konteks disimpan di app/web/HANDOFF_CODEX.md. Hasil 20 tes/build/Chrome adalah bukti yang dilaporkan Claude, belum dijalankan ulang oleh Codex pada pembacaan konteks ini. Tidak mengembalikan file lama atau mengubah backend. Integrasi tetap mengikuti instruksi pengguna, bukan dimulai otomatis karena backend tersedia.


### Integrasi frontend-backend dimulai atas instruksi pengguna

Kode Next proxy dan mode /connected ditambah. Portfolio browser sealing, version-pinned payment, encrypted execution, local completion verification/recheck/verdict dan settle tersedia pada kode UI. DAO read dan advanced protections API panel tersedia. Mock store tetap terpisah. Rincian batas dan cara restart ada di app/web/BACKEND_INTEGRATION.md. Typecheck/build lolos, 23 TS + 2 crypto tests lolos, backend GET health/config/methods sukses. Tidak ada testnet spending atau protection mutation. Server3311 lama belum memuat route, bind3312 EPERM, sehingga browser E2E belum terverifikasi. Integrasi seluruh halaman belum selesai.
- **14 Nov 2026 01:17 UTC (Claude Code).** Runner 0.5: jaringan hanya ke NEAR AI, import `kalis.ai_chat` dengan attestation dan tanda tangan per panggilan, metode berbentuk prompt dengan cek kebocoran. Deploy ke OutLayer, secret dipindah. Portofolio v4 dan metode prompt `salary-counteroffer` v1 di market, smoke berbayar keduanya Released. RANCANGAN bagian 5, 51, 55 direvisi, bagian 65 baru, PDF 65 halaman (6.15).


### Integrasi seluruh permukaan API yang tersedia ke halaman utama

Backend mode kini default pada route normal. backend-pages.tsx menghubungkan registry, Connections, Memory, Files, Browser, Activity/outbound/audit dan DAO reads; connected.tsx menyediakan encrypted buyer payment/run/settle dengan version pinning dan unsigned wallet request. Mock demo terpisah eksplisit. API yang tidak ada ditandai unavailable, bukan dibuat seolah live. Helper crypto disinkronkan dengan backend termasuk AI proof/prompt verdict. 23 TS + 3 crypto tests lolos, typecheck/build diperiksa. Matriks app/web/COVERAGE.md diperbarui. Tidak melakukan pembayaran/signing/mutasi backend. Server3311 perlu restart; pengujian browser belum diklaim. Tidak ada konflik aturan NEAR.


### Handoff kebutuhan backend untuk Claude

Atas permintaan Dien, Codex menyusun app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md berdasarkan API dan kode backend aktual. Memuat gap, usulan endpoint/DTO, izin, idempotency/recovery, transisi dan kriteria penerimaan, serta prompt handoff. Ini dokumentasi, bukan backend baru atau policy final. Tidak mengirim pesan eksternal dan tidak melakukan signing/spending. Rancangan bagian 66 dan PDF diselaraskan.


### Audit tambahan layanan backend untuk handoff Claude

Handoff app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md diperluas dengan bagian H, delapan kelompok layanan yang ditelusuri dari rancangan termasuk 65.1 tender. Menjelaskan schema/checker, runtime tender, model selection, run-bound policy, provenance/artifact, evidence/preflight, contribution package dan effective permission/cancellation. Semua bentuk API baru tetap usulan dan dibedakan dari fungsi internal atau keputusan yang terbuka. Dokumentasi saja, tidak mengubah backend dan tidak signing/spending. Cek aturan NEAR tidak menemukan konflik.
- **14 Nov 2026 02:35 UTC (Claude Code).** Kelompok A, manifest v5 dan cek pembeli, perbaikan teks dokumen, impor file, rating dan riwayat, artefak, `transfer_method_owner`, tiga akun penjual demo, tender v1 berbayar sukses di OutLayer (6.16).
- **14 Nov 2026 06:00 UTC (Claude Code).** Login NEP-413, publikasi penjual, komunitas, uji privat, runner build 823e99 dengan `evaluate` dan `ai_restrict`, tiga metode diterbitkan ulang di runner baru, reclaim teruji (6.17).
- **14 Nov 2026 06:10 UTC (Claude Code).** Delapan metode dengan delapan akun penjual demo, semua lolos run berbayar. Batas waktu OutLayer dinaikkan ke 180 detik. H3, H4, H8 selesai. Seluruh butir backend A–H terpasang (6.16–6.18). Berikutnya frontend.


## Riset website referensi, 14 November 2026

Riset publik selesai dan dicatat di research/website-reference-2026-11-14.md, dengan delapan pembanding utama, sumber resmi, matriks penerapan halaman, dokumentasi brand system n8n dan usulan wording. Rancangan bagian 68 dan PDF diselaraskan. Tidak ada perubahan kode atau status fitur. Inspeksi render dan interaksi pembanding belum dilakukan. Compliance gate tidak menemukan konflik pada riset dan dokumentasi lokal.
- **14 Nov 2026 07:00 UTC (Claude Code).** Riset referensi desain, dua mock marketplace (Luno CRM dan Luno Crypto), palet extrafazant.nl, tema terang saja. Semua aturan desain disimpan di `FRONTEND_GUIDE.md` untuk Codex. Frontend diserahkan ke Codex.


## Persiapan domain aplikasi, 14 November 2026

Persiapan lokal untuk landing calis.scientivan.dev dan aplikasi app.calis.scientivan.dev disepakati. Bukti ada di app/web/src/app/layout.tsx, app/web/vercel.json dan app/web/DEPLOYMENT.md. Pemeriksaan read-only Vercel berhasil dan nameserver domain berada di Cloudflare. Backend publik belum diberikan. Belum membuat proyek, deploy publik, memasang domain atau mengubah DNS. Verifikasi berhasil dengan npm run build dan npm test di app/web, 31 tes lulus. PDF diregenerasi menjadi 70 halaman dan generator menyatakan no overflow, isi hostname halaman domain diperiksa. Rancangan bagian 69 dan sumber PDF diselaraskan. Compliance gate NEAR tidak menemukan konflik.


## Sinkronisasi dokumentasi menyeluruh, 14 November 2026

Atas permintaan Dien, dokumen aktif direkonsiliasi dua arah dengan source, runtime dan bukti historis. Rancangan bagian 0/70, README, PRODUCT, DESIGN, coverage/gaps/integration/navigation, API notes, panduan, memori dan indeks dokumen diperbarui. Handoff/prototipe/review lama diberi status historis. Bukti di audit/2026-11-14-doc-sync/. GET sembilan endpoint dan proxy health berhasil, 14 halaman Chrome tanpa login terbuka. Build dan 31 tes frontend sesi sama lulus sebelum perubahan dokumentasi, local manifest 47 dan Office 8 lulus. Crypto/checks/file-import browser identik backend. PDF diregenerasi menjadi 72 halaman, generator memverifikasi no overflow dan isi cover serta halaman Social Money diperiksa visual. Tautan lokal dokumen aktif dan git diff --check lulus.

Tidak mengubah kode produk, login, mutasi backend, seed, signing, spending, push atau deploy. Gap private-values/reviewer/revoke/legacy bounty dipertahankan eksplisit. Deployment ditunda dan diskusi inovasi Social Money menjadi langkah berikutnya. Compliance gate NEAR tidak menemukan konflik.


## Investigasi privasi sebelum Social Money, 14 November 2026

Source runner/backend/frontend serta rancangan 52 dan 65.1–65.3 ditelusuri. Bukti dan penghalang ada di PRIVACY_TEE_INVESTIGATION.md. Tidak ditemukan bukti keterbatasan fundamental OutLayer, tetapi runner belum punya API proteksi, storage dan proof owner. Shared platform payment key, localhost connector dan pdftotext host adalah dependensi nyata untuk migrasi. Registrasi private-values bukan syarat platform. Penetapan protocol/migrasi masih usulan, worker testnet belum diprobe baru. MD/PDF diperbarui, Social Money ditunda sementara. Tidak mengubah kode, signing, spending atau deploy. Cek NEAR tidak menemukan konflik.

Verifikasi investigasi privasi. PDF 73 halaman lolos generator tanpa overflow, halaman hasil investigasi diperiksa visual. Pengujian TEE baru dan migrasi fitur belum dilakukan.

## Deployment publik (15 November 2026)

Backend berjalan di VPS tinjau-vps sebagai service kalis-backend (port 8790 di belakang Caddy) untuk https://api.kalis.scientivan.dev, health dan /api/privacy/config (mode tee, enabled) lulus di localhost VPS. Frontend di proyek Vercel kalis dengan domain kalis.scientivan.dev dan app.kalis.scientivan.dev, build produksi Ready. kalis.scientivan.dev sementara redirect 307 ke aplikasi lewat app/web/src/proxy.ts. Ejaan domain diganti dari calis ke kalis. Uji lewat host publik belum terverifikasi karena menunggu DNS Cloudflare. Rincian ada di app/web/DEPLOYMENT.md. npm test 32 lulus dan npm run build berhasil.

### 6.21 Social Money pools: bounty patungan dan beli run bersama (🟡 testnet, satu langkah menunggu vote council)

Backend `app/backend/src/pool-api.js` (didaftarkan di `server.js`), UI `app/web/src/components/pool-money.tsx` (panel di detail Bounty dan di tahap Pay halaman run), uji `app/backend/scripts/pool-test.mjs [base] bounty|refund|group|pay <pool>`. Kalis tidak memegang NEAR di kedua alur.

**Bounty patungan (pledge-then-pay, non-custodial).** Pledge tidak memindahkan NEAR. Pool selesai hanya jika proposal BountyDone untuk bounty itu, yang diajukan setelah pool dibuat, berstatus Approved di DAO (dibaca dari chain). Lalu tiap pledger menandatangani transfer langsung ke kontributor, dan backend memverifikasi tx di chain (signer, receiver, jumlah, tidak dipakai dua kali). Jika ditolak, dibatalkan pembuat, atau lewat deadline, pool `released` dan tidak ada yang perlu di-refund karena tidak ada dana yang berpindah. Batas jujur: pledge adalah janji, bukan kunci dana; pledger bisa ingkar, UI menunjukkan siapa yang sudah bayar.
- Pool `pool-mwgxeq2c-4f263623` di bounty 1, pledge 0.01 dari `auth-test.scientivan.testnet` dan 0.01 dari `platform.scientivan.testnet`.
- `bounty_claim` oleh `kalis-buyer.testnet` (bond 1 NEAR): `9zdyA7c1XAn2p9zB3zwDWgDiTTdP4j9HGBSpS9Kq879r`.
- `add_proposal` BountyDone (proposal 4, bond 1 NEAR): `YRjRPdBBPLMHS6GdAN3SjJRuPXCnjdtdJbdmFrqziuF`.
- Belum: vote council `scientivan.testnet` untuk proposal 4 (kunci council tidak tersedia untuk agent). Setelah Dien approve, jalankan `node scripts/pool-test.mjs <base> pay pool-mwgxeq2c-4f263623` untuk dua transfer pembayaran pledge.
- Jalur refund: pool deadline 15 detik di bounty 2 berubah `released`, saldo pledger tidak berubah; pool batal oleh pembuat; pledge ke pool tertutup ditolak (6/6 PASS).

**Beli run bersama.** Organizer menyebut anggota; harga versi dari chain dibagi rata. Anggota mentransfer share ke akun organizer (custody: organizer, bukan Kalis), backend memverifikasi tx. Organizer membayar satu run lewat escrow `pay_for_run`, run dieksekusi sekali di TEE, lalu run ditautkan ke grup (hanya organizer, hanya run miliknya, metode sama, dibayar setelah grup dibuat). Jawaban tersegel ke kunci data organizer; anggota mendapatkannya dari organizer. Re-seal per anggota belum dibangun.
- Grup portfolio-rebalance 0.1 NEAR, share 0.033333.
- Share `auth-test` ke organizer: `6uutdJQRRNTFXQSKzUjNdeBn1jLcUfk4d6TJF6SCQsrY`; share `platform`: `7k831QvbUeX5f9hfB65Knkkwf3q3FCwgJKvH8aXprZN8`.
- `pay_for_run` run `run-mwgxf6xi-a2771d5e`: `FndALEh7WXPU2psgmoBcrmDUmSZE1yjLQ1et2ENzvguk`; settle: `D6FRMG5m7ybgVxKiZcj7nfED7Xf6G2WAJn5v5vexZksD`. 11/11 PASS.
- Catatan: uji dijalankan pada server terisolasi (`KALIS_DATA_DIR` salinan, port 8823) agar tidak menimpa data server agent lain; `bounty_pools.json` dan `group_runs.json` disalin ke `app/backend/data/db/`, tetapi baris run itu hanya ada di data salinan. Server port 8787 belum di-restart sehingga belum memuat route pool.

Kepatuhan: tidak ada imbal hasil, bagi hasil, atau token; pledge dan share adalah pembayaran untuk pekerjaan atau run, bukan investasi. Testnet saja.

### 6.5 Kontrak registry (✅)

Kontrak `registry.scientivan.testnet`. Fungsi: `register_method`, `publish_version`, `get_method`, `list_methods`, `get_version`, `list_versions`. Setiap versi menyimpan `code_hash` (WASM penjual), `manifest_hash`, `runner_hash`, `parent`, `contributors`, `note`. Biaya storage dibayar pemanggil lewat deposit, sisanya dikembalikan. Event NEP-297 `method_registered` dan `version_published`.

- Daftar metode `portfolio-rebalance`, tx `45WWbRAnmc8qZFuyNxUSzJaHNouXX9nRJdfS4NrApx5x`.
- Publikasi versi 1, tx `JBqdPToBMRfVHMNDxpUvNJ2VmZFC3K1VTqugqW4D3rMp`. `code_hash d369c2697cc02393aaf25f7df2d6068e40ac4f6f93254f2dd932c73f6b40bc96` (guest solver), `manifest_hash 8124a6f8ba0e75842cbbacfb3fd31aa8015a35e910d743a44d2e035b0b1d01e9`, `runner_hash cbf2dc31...` (runner-spike).
- Ditolak sesuai harapan: publikasi oleh bukan pemilik (tx `9cQ2h5QPmDRHeYwrawT7HZmJ8wUqT2qN8Qn1n94t7Tbz`), hash tidak valid (`5DwQg9rz5sMjTc9DMcGXFed8PEvRZ2sQf3rsEYM13gfi`), `method_id` ganda (`8jsBLSavsKGQVBds5evQqaksVB2UFh1ttc9SDPX4B7fM`).
- `get_version` dan `list_methods` mengembalikan data versi 1 dengan benar.

**Pesan error diperbaiki (13 Nov 15:15 UTC, Claude).** Penyebabnya build dengan rustc 1.89, sedangkan `cargo-near` 0.20.3 hanya menerima rustc paling baru 1.86 untuk near-sdk ini. Kontrak dibangun ulang dengan `cargo +1.86.0 near build non-reproducible-wasm` (`rust-version = "1.86"` di `Cargo.toml`) dan di-deploy ulang tanpa init, tx `5ihYesy7FofFHu295ageUF8vAmC6yFLMcarVTkeZXjDR`. State tetap utuh, `get_version` masih mengembalikan versi 1. Uji penolakan bukan pemilik sekarang menampilkan `Smart contract panicked: only the method owner can publish a version` (tx `Aq3xdrDfAqg3CF2BoDRCzU5ueSojNqFQCCZWNd7SxpjR`). Unit test 5/5 lolos dengan `cargo test` (profil debug; profil release memakai `panic = "abort"` sehingga test `should_panic` tidak bisa berjalan).

## 7. Lima perlindungan (bagian 3 dan 49)

Implementasi backend di `app/backend/src/protections/`, bukti di 6.14. Semua ditegakkan berdasarkan manifest metode.

| Perlindungan | Status | Yang berjalan | Batas |
|---|---|---|---|
| Kredensial dan integrasi | ✅ | Token konektor `broker_mock` terenkripsi AES-256-GCM, scope baca saja, kedaluwarsa, bisa dicabut. Metode tanpa deklarasi konektor ditolak. `place_order` tidak pernah bisa. Token tidak pernah dikembalikan atau dicatat | Broker berjalan di backend, bukan TEE |
| Aliran data keluar | ✅ | Setiap kirim ditahan sampai disetujui. Persetujuan terikat hash tujuan, isi, dan parameter. Isi berubah ditolak. Nilai privat yang ditandai terdeteksi walau ditulis ulang (812000000, 812 juta). Tujuan di luar manifest diblokir | Deteksi berbasis nilai yang ditandai pengguna, bukan pemahaman makna |
| Memori persisten | ✅ | Usulan dari dokumen, web, atau metode menunggu tinjauan dan menyimpan asal. Teks mirip perintah ditandai. Metode hanya menerima catatan yang disetujui, dibungkus sebagai data. Edit, tolak, hapus | Deteksi perintah berbasis pola teks |
| Dokumen multimodal | ✅ | Scan dibaca Qwen3-VL di TEE NEAR AI dengan attestation nonce baru dan tanda tangan jawaban terverifikasi. PDF teks dibaca `pdftotext` lokal. Data pribadi dicek `privacy-filter` teratestasi. Injeksi di dokumen ditandai | Dokumen melewati backend menuju NEAR AI. PDF scan harus diunggah sebagai gambar |
| Browser agent | ✅ | Hanya domain dan aksi dari manifest (`open`, `download`). `submit` menjadi aksi keluar yang ditahan. `login` tidak pernah. Unduhan lewat perlindungan dokumen | Agent HTTP, bukan browser headless. Berjalan di backend, bukan TEE |

## 8. Daftar mock dan data sintetis

| Item | Kondisi terkini |
|---|---|
| Fiat top-up | Mock berlabel, akun platform membayar NEAR testnet, bukan saldo fiat |
| Konektor broker, sheets, docs dan wallet | Implementasi mock backend tersedia, bukan integrasi layanan atau trading nyata |
| Portal pengadaan tender | Mock HTTP tersedia, bukan browser agent headless |
| Portofolio, tender, karier dan metode demo lain | Data/seller demo fiktif, bukan nasabah atau saran profesional |
| Rating dan riwayat testnet | Bisa berasal dari seed/script, bukan bukti pelanggan nyata |
| Public deployment | Aktif sejak 15 November 2026. App di app.kalis.scientivan.dev, API di api.kalis.scientivan.dev, landing redirect sementara (commit e07d4ef) |


## 9. Buku klaim README

| Klaim | Status | Bukti atau batas |
|---|---|---|
| Runner membuka input/metode tersegel dan mengembalikan jawaban tersegel | Ada bukti historis | 6.1, 6.8, 6.15–6.18, sesuai versi |
| Seluruh website hanya mengirim ciphertext kepada backend | Tidak boleh diklaim | run-page.tsx pay mengirim field private plaintext, outbound.markPrivate menyimpannya |
| Lima perlindungan tersedia | Ya pada backend biasa | 6.14, bagian 7, CURRENT_STATE.md. Bukan lima fungsi dalam TEE |
| AI evidence dan sandbox | Ada implementasi/bukti historis | Jangan menyamakan dengan verifikasi rantai sertifikat Intel/NVIDIA penuh |
| Registry/escrow aktif | market.scientivan.testnet | registry.scientivan.testnet historis |
| Dana DAO dan bounty pernah dibayar | Bukti historis 6.11–6.12 | Bukan semua bounty sekarang siap diuji, bukan request call sudah dibayar |
| Publikasi editor dan wallet UI tersedia | Source tersedia | SellerEditor dan auth.signCalls, audit sekarang tidak signing |
| Katalog memiliki sembilan metode saat audit | GET methods berhasil | Bukan bukti run berbayar seluruh versi aktif |
| Kontributor mendapat royalti | Belum | Royalti, pengklaim bersaing dan sengketa masih terbuka |
| Produk privat dari operator tanpa batas | Tidak boleh diklaim | Jalur protections sudah tersegel secara lokal, tetapi runner privat belum di-deploy sebagai TEE (6.19) |
| Keunggulan metode, profit dan adopsi teruji | Tidak boleh diklaim | Benchmark dan rating demo tidak membuktikannya |


## 10. Belum terverifikasi

Gap terkini mencakup wallet E2E penuh, mobile/aksesibilitas, privasi checkout, enforcement reviewer, policy revoke dan legacy bounty. Daftar riset lama berikut tetap konteks dan tidak berarti seluruh fitur terblokir.

- Rantai sertifikat Intel dan NVIDIA pada quote OutLayer dan NEAR AI.
- Kecepatan interpreter `wasmi` di dalam OutLayer untuk metode yang lebih berat dari C03 (C03 sekitar 5,3 detik).
- Jalur keluaran HTTPS OutLayer melalui koordinator (inferensi, belum dicek di kode).
- Apakah fungsi storage dan transaksi NEAR OutLayer bisa dibatasi per project.
- Status hukum crypto sebagai alat bayar di Indonesia (bagian 50).

## 11. Tugas berikutnya (urut prioritas)

Status lama tentang OutLayer gagal, frontend mock-only, tender belum dibuat dan API belum terintegrasi sudah digantikan. Log lama tetap di bagian bukti/changelog.

1. Sinkronisasi dokumen dua arah berdasarkan bagian 0 dan 70 rancangan serta CURRENT_STATE.md. Audit ini tidak mengubah kode produk.
2. Bahas inovasi Social Money bersama Dien dari fund/proposal/bounty/evaluation yang sudah ada. Belum memilih fitur baru atau policy.
3. Gap privasi checkout, reviewer enforcement, revoke policy dan bounty legacy dicatat di CURRENT_STATE.md serta app/web/FRONTEND_GAPS.md untuk keputusan/perbaikan terpisah.
4. Verifikasi wallet E2E, mobile dan aksesibilitas hanya pada lingkup yang dibutuhkan dan dengan otorisasi transaksi yang sesuai. Jangan memakai seed atau pembacaan halaman sebagai bukti pembayaran.
5. README dan video mengikuti bukti versi aktual serta batas privasi. Deployment dan DNS ditunda saat itu, kemudian dilakukan 15 November 2026 (rancangan bagian 73).


### Log historis percobaan ulang OutLayer

Perintah uji: `outlayer run scientivan.testnet/sealed-probe '{"cmd":"pubkey"}' --secrets-profile default --secrets-account scientivan.testnet` (dari `app/sealed-probe`), lalu `outlayer run scientivan.testnet/runner-spike '{"cmd":"ping"}'` (dari `app/runner-spike`).

| Waktu (UTC) | sealed-probe | runner-spike ping | Catatan |
|---|---|---|---|
| 13 Nov 11:45 | ✅ (request 38119) | belum ada | Satu percobaan pertama sempat timeout, percobaan kedua berhasil |
| 13 Nov 12:00–12:05 | ❌ (38332) | ❌ (38322) | `Execution promise failed` |
| 13 Nov 12:12 | ❌ | ❌ | Masih gagal |
| 13 Nov 12:42 | ❌ | belum dicoba | Masih gagal |
| 13 Nov 15:10 | ❌ | ❌ | Masih gagal (Claude) |
| 13 Nov 15:43 | ❌ on-chain | ✅ HTTPS (call `5c9d36a7...`) | Jalur HTTPS jalan, on-chain masih gagal |

## 12. Runbook

```bash
# Build program TEE (dari folder project masing-masing)
cargo build --release --target wasm32-wasip2

# Upload ke FastFS dan deploy versi project
outlayer upload target/wasm32-wasip2/release/<file>.wasm
outlayer deploy <project> <FastFS URL>

# Jalankan (jalur on-chain testnet)
outlayer run scientivan.testnet/<project> '<json>'
outlayer run scientivan.testnet/sealed-probe '{"cmd":"pubkey"}' --secrets-profile default --secrets-account scientivan.testnet

# Uji enkripsi
cd app/sealed-probe && cargo build --release && node client/local-test.mjs target/release/sealed_probe
node client/remote-test.mjs <tee_pubkey_hex> C03 <folder sementara>

# Uji NEAR AI Cloud
node app/near-ai-probe/verify.mjs

# Cek attestation OutLayer
curl -s https://testnet-api.outlayer.ai/attestations/by-request/<request_id>

# Cek worker OutLayer testnet
curl -s https://testnet-api.outlayer.ai/public/workers
```

Catatan: CLI `outlayer run` bisa menampilkan `timeout error` walau eksekusi masih diproses. Cek hasil lewat tx di RPC atau `attestations/by-request`.

## 13. Kendala lingkungan

- **Disk laptop sempat penuh.** Pada 13 Nov 12:20 UTC sisa 122 MB dan build gagal `No space left on device`. Dien mengosongkan disk, sisa 13 GB pada 12:42 UTC. Pantau dengan `df -h /System/Volumes/Data` sebelum build besar.
- `cargo-near` terbaru (0.23.0) butuh rustc 1.95. Instalasi versi 0.20.3 sempat dihentikan akibat disk penuh, lalu dilaporkan selesai pada sesi Claude 13 Nov 13:30 UTC. Kontrak testnet sebelumnya dibangun dengan `cargo build --target wasm32-unknown-unknown --release` dan `RUSTFLAGS="-C link-arg=-s"`. Sudah dibangun ulang dengan toolchain 1.86.0 dan di-deploy ulang 13 Nov 15:15 UTC (6.5). Build kontrak NEAR berikutnya wajib `cargo +1.86.0 near build non-reproducible-wasm`.

## 14. Batas agent

Tanpa konfirmasi eksplisit Dien dilarang: submission, posting X, membuat repo publik, push, signing di mainnet, mengeluarkan dana nyata, deploy mainnet, commit secret (`../NEAR.md` Compliance gate poin 7). Transaksi testnet dengan NEAR faucet sudah diizinkan untuk development.

## 15. Changelog

- 14 November 2026, Codex. Menyimpan riset delapan website pembanding dan brand system resmi n8n. Rekomendasi tetap usulan, audit visual belum dilakukan. Lihat bagian 68 rancangan dan research/website-reference-2026-11-14.md.

- **13 Nov 2026 (Claude Code).** Akun `scientivan.testnet` dan OutLayer CLI. Uji enkripsi `sealed-probe` lolos lokal dan testnet. Temuan koordinator OutLayer. Klaim kredit NEAR AI dan uji attestation lolos. Keputusan opsi B. Spike runner lolos lokal, gagal di testnet dengan dugaan gangguan layanan. Dokumen ini dibuat.
- **13 Nov 2026 12:30 UTC (Claude Code).** OutLayer dicoba ulang, masih gagal. Kontrak registry ditulis, di-deploy ke `registry.scientivan.testnet`, metode portofolio versi 1 tercatat. Draf manifest metode portofolio. Disk penuh ditemukan dan sebagian dibersihkan.
- **13 Nov 2026 13:30 UTC (Claude Code).** Disk dikosongkan Dien (13 GB). Unit test kontrak 5/5 lolos, `cargo-near` 0.20.3 terpasang. OutLayer 12:42 masih gagal. Nama Kalis, `PRODUCT.md`, arah batik tulis, draf hero artifact v1.
- **13 Nov 2026 (Codex, serah konteks).** Membaca seluruh pesan percakapan Claude sesi `333cb961-537f-41ee-afce-3622d35df115`, jawaban pertanyaan terstruktur dan bukti unit test yang relevan. Mencocokkan dengan dokumen produk dan preferensi desain. Memperbaiki catatan unit test dan instalasi `cargo-near` yang tertinggal dari changelog. Tidak menjalankan ulang layanan atau mengubah produk.
- **13 Nov 2026 (Codex, revisi hero).** Pengguna menolak draf batik dan memilih arah HelloNear yang simpel, bersih dan interaktif. Draf hero diganti dengan adegan Three.js buatan sendiri, interaksi kursor, pilihan tiga tahap, kontrol jeda dan reduced motion. Bukti memakai sealed-probe historis dan data sintetis. Tidak ada API atau transaksi. Aset lokal, anchor, sintaks dan kontras diperiksa. Browser/localhost diblokir sandbox, sehingga review render belum selesai. Dokumen rancangan dan PDF diperbarui ke v1.31. OutLayer tidak dicoba ulang karena pekerjaan hanya preview desain.

## 16. Titik lanjut setelah serah konteks Claude ke Codex

- Permintaan Dien saat serah konteks adalah memahami pembahasan agar dapat dilanjutkan di sesi Codex. Belum ada permintaan baru untuk mengubah desain atau menjalankan build.
- Target desain terdekat adalah review pengganti hero `design/kalis-hero.html` berdasarkan HelloNear. Artifact Claude lama merupakan draf yang ditolak dan tersimpan di `design/kalis-hero-v1.html`. Bukti yang ditampilkan tetap memakai `sealed-probe`, bukan runner opsi B.
- Arah terbaru simpel, bersih dan interaktif seperti HelloNear, copy Inggris, SF Pro system stack dan warna solid. Batik boleh menjadi aksen halus. Rincian preferensi ada di `~/.claude/DESIGN-PREFERENCES.md`. Dien meminta impeccable dan UI UX Pro Max untuk pekerjaan desain.
- Dua pilihan bernama A dan B berasal dari pembahasan berbeda. Opsi A pada bagian 51 memilih OutLayer sebagai tempat eksekusi. Opsi B pada bagian 52 memilih kode penjual di sandbox runner platform. Keduanya berlaku bersama.
- Lima perlindungan adalah cakupan yang disepakati untuk dibangun, bukan lima fitur yang sudah selesai. Status implementasinya tetap mengikuti bagian 7.
- Penyebab kegagalan OutLayer belum pasti. Percobaan terakhir yang tercatat tetap 12:42 UTC. Saat melanjutkan pekerjaan implementasi, ikuti jadwal percobaan ulang di bagian 11 dan catat bukti baru.
- Belum ada keputusan baru tentang pilihan DAO, skema final manifest, pembagian pembayaran, refund atau sengketa. Jangan mengubah usulan lama menjadi keputusan.

### Review layout section pendukung, 13 November 2026

Dien meminta revisi khusus pada Private by purpose dan daftar tiga langkah. Draf kini memakai satu panel proses berurutan dan tab use case dengan panel tunggal. File tambahan `design/kalis-sections.css` dan `design/kalis-sections.js`. Sintaks dan interaksi tab diperiksa, termasuk keyboard, fokus, visibilitas panel tunggal dan orientasi mobile. Browser masih diblokir sandbox, sehingga hasil render belum diperiksa visual. Menunggu review Dien. Tidak ada transaksi, perubahan backend atau percobaan ulang OutLayer. Rancangan MD dan PDF disinkronkan pada bagian 53.1.

### Review isi tab dan kontrol, 13 November 2026

Dien menyukai kemasan panel proses dan tab use case, lalu meminta perapian isi tab, visual tombol How it works dan kejelasan kontrol tahap. Draf kini memakai tiga baris fakta yang sejajar per use case, tombol sekunder yang jelas dan stepper bernomor dengan tahap aktif serta status yang berubah. Sintaks, referensi elemen, kontrol tahap dan reduced motion lolos pemeriksaan lokal. Render browser belum diperiksa. Perubahan dicatat di rancangan bagian 53.2 dan PDF halaman 40. Tidak ada perubahan backend atau transaksi.

### Pembacaan menyeluruh untuk pembahasan hook hero, 13 November 2026

Atas permintaan Dien, Codex membaca ulang seluruh RANCANGAN_PRODUK.md dari bagian 0 sampai 53.2, termasuk riwayat benchmark, bisnis, lima perlindungan, kontribusi modular, kasus uji privat, dana bersama dan keputusan terbaru. Opsi hook sebelumnya belum dipilih. Pembahasan hook perlu mempertimbangkan workspace privat, transaksi keahlian dua pihak dan perbaikan bersama, dengan kemampuan terbangun tetap dibedakan dari rancangan. Tidak ada perubahan copy hero atau keputusan produk baru pada giliran pembacaan ini.

### Hook hero dipilih, 13 November 2026

Dien memilih “Where expertise is traded, run privately, and improved together.” Hook diterapkan di design/kalis-hero.html dengan pemenggalan responsif. Tidak ada perubahan kontrol, backend atau kemampuan produk. Keputusan dicatat di rancangan bagian 53.3, PDF dan PRODUCT_MEMORY.md. Render browser belum diperiksa karena batas sandbox.

### Deskripsi dan background hero, 13 November 2026

Atas permintaan Dien, deskripsi diselaraskan dengan perdagangan metode, privasi dua pihak dan pendanaan perbaikan. Background polos diganti lanskap orisinal melalui imagegen bawaan, disimpan di design/assets/kalis-landscape-v1.webp (1672 × 941, 76.418 byte). Prompt/provenance di file pendamping. Aset diperiksa visual, render halaman terintegrasi belum diperiksa karena sandbox. Tinggi background mengikuti ukuran hero. Rancangan bagian 53.4 dan PDF disinkronkan. Draf belum disetujui. Tidak ada transaksi atau perubahan backend.

### Adegan hero modular, 13 November 2026

Dien menyukai background dan meminta foreground menyatu dengan privacy, expertise dan pengembangan bersama. Atas izin percobaan, cincin diganti bidang kerja Three.js dengan input tersegel, ruang eksekusi, modul metode dan keluaran. Preview an improvement memperlihatkan kontribusi bergabung/reset. Konstruksi geometri nyata dan state diuji di Node memakai renderer pengganti, bukan render piksel. Sintaks lolos. Render browser tetap belum diperiksa. Draf lama script tersimpan di design/kalis-hero-orbit-v1.js. Rancangan bagian 53.5 dan PDF disinkronkan. Tidak ada backend kontribusi atau transaksi baru.

### Ilustrasi siklus produk lengkap, 13 November 2026

Dien menolak scene abstrak dan meminta alur produk lengkap. Setelah giliran terputus, pekerjaan dilanjutkan sampai CSS dan kontrol selesai. Hero aktif memakai ilustrasi UI enam tahap melalui design/kalis-story.css dan design/kalis-story.js. Tahapnya publikasi, pembelian, eksekusi privat, hasil, aliran pembayaran/dana dan perbaikan versi. Three.js tidak lagi dimuat oleh HTML aktif. File lama dipertahankan sebagai riwayat.

Pemeriksaan lokal lolos untuk sintaks, enam panel, navigasi langsung dan sebelumnya/berikutnya, batas tombol, playback selesai, jeda saat halaman tersembunyi, reduced motion manual, aset dan ARIA. Detector terbatas tidak menemukan temuan regex. Render desktop/mobile belum diperiksa karena sandbox. Rancangan bagian 53.6, PDF dan memori diperbarui. Draf menunggu review. Tidak ada API, transaksi atau backend baru. OutLayer tidak dicoba ulang dalam pekerjaan desain ini.

### Kelanjutan pemeriksaan kontrol cerita, 13 November 2026

Playback diperbaiki agar tombol putar melanjutkan tahap yang sedang dipilih atau dijeda. CTA Explore tetap memulai dari awal dan putar setelah tahap terakhir mengulang cerita. Uji Node VM lolos untuk pemilihan tahap, pause/resume, kemajuan timer, restart CTA, replay akhir dan reduced motion. Sintaks JavaScript lolos. Tidak ada keputusan produk baru, perubahan backend atau transaksi. Render browser masih belum terverifikasi karena batas sandbox yang telah dicatat.

### Pembagian kerja agent (13 Nov 2026, dari Dien)

**Diperbarui 14 Nov 2026 07:00 UTC (Dien).** Frontend `app/web` (Next.js) dikerjakan Codex mulai sekarang, mengikuti `FRONTEND_GUIDE.md` (aturan desain, palet, layout, peta navigasi, mock acuan `design/app/marketplace-luno-crypto.html`), `app/backend/API.md`, dan `app/methods/MANIFEST_V5.md`. Backend tetap Claude Code. Jangan mengubah backend dari sisi frontend; minta lewat file kebutuhan seperti sebelumnya.

**Diperbarui 14 Nov 2026 02:10 UTC (Dien).** Codex berhenti mengedit. Claude Code mengerjakan seluruh backend (10 pekerjaan rencana dan semua butir A–H di `app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md`), lalu frontend `app/web`. Urutan: inti demo dulu (kelompok A, manifest v5, tender, 8 metode), lalu rating, riwayat, login NEP-413, publikasi penjual, komunitas, uji privat, H5, H7, H8. Kebijakan di RANCANGAN 65.4.

*Pembagian lama (13 Nov):* Codex mengerjakan tampilan frontend (`design/`, nanti app Next.js). Claude Code mengerjakan semua selain frontend: OutLayer dan runner, kontrak NEAR, DAO dan bounty, lima perlindungan di sisi backend, metode tender, API yang dipakai frontend, README dan bukti. Jangan mengedit file milik agent lain tanpa koordinasi. Antarmuka backend untuk frontend dicatat di dokumen ini saat dibuat.

### Hero animasi minimal, 13 November 2026

Permintaan Dien diterapkan dalam draf 53.7. Enam adegan objek vektor menggantikan panel teks, navigasi terpisah dihapus, kontrol ringkas berada dalam hero. Auto-next 7 detik, jeda manual dan reduced motion manual. Uji Node VM lolos untuk autoplay, wrap, pause, halaman tersembunyi, reduced motion dan satu panel aktif. ID SVG/HTML dan referensi valid. PDF 45 halaman terverifikasi tanpa overflow. Render browser tetap belum diverifikasi karena pembatasan lingkungan yang tercatat. Tidak ada backend atau transaksi baru.

### Revisi screenshot hero dan Three.js

Konflik position absolute pada scene-caption diperbaiki dengan class terisolasi dan normal flow. Three.js lokal kini membangun enam kegiatan dengan warna lanskap, SVG fallback dipertahankan. Caption/controls berlatar solid, fokus menjeda, target kontrol utama 44px, titik tahap 28px. Sintaks kedua script lolos. Render WebGL/browser belum terverifikasi, tidak mengklaim audit WCAG penuh. Rancangan 53.8 dan PDF disinkronkan. Tidak ada transaksi, tidak ada konflik gate NEAR.

### Pembaruan memori preferensi desain

Preferensi Dien untuk tidak memakai karakter bullet points disimpan di PRODUCT_MEMORY.md. Tidak ada perubahan implementasi atau keputusan kemampuan produk.

### Kelanjutan kontrol dan preferensi teks

Pemisah karakter bullet pada preview dihapus. Konflik focusin pada tombol play/pause diperbaiki agar klik jeda pertama tidak menyalakan ulang cerita. Sintaks diperiksa. Batas verifikasi visual sebelumnya tetap berlaku. Rancangan 53.9 dan PDF diperbarui. Tidak ada konflik aturan NEAR atau transaksi baru.

### Orientasi halaman aplikasi

Dien mengalihkan fokus sementara dari landing page ke aplikasi dan meminta pembacaan ulang rancangan. Bagian 0–11, 21–23, 29–30, 44–52 serta keputusan 54 ditinjau untuk kebutuhan UI. Aplikasi mencakup workspace privat, penemuan/publikasi metode, izin dan hasil eksekusi, saldo/transaksi serta perbaikan dan dana bersama. Struktur beranda masih usulan, belum implementasi. Pembagian pembayaran dan Sputnik DAO mengikuti bagian 54, bukan asumsi lama. Tidak ada perubahan backend.

### Pembahasan sidebar aplikasi

Istilah metode marketplace dan perpindahan fokus aplikasi dicatat di rancangan bagian 55, PDF dan memori. Sidebar per peran masih usulan, belum diimplementasikan atau disetujui. Tidak ada perubahan backend atau transaksi.

### Audit cakupan sidebar

Pemetaan seluruh area produk ke lima parent dan alternatif enam parent dicatat sebagai usulan di rancangan 56 dan PDF. Tidak ada implementasi UI atau keputusan final. Activity diarahkan menjadi inbox, dana bersama dipisahkan dari uang pribadi, dan operasi mengikuti kewenangan. Tidak ada konflik compliance NEAR.
- **13 Nov 2026 16:45 UTC (Claude Code).** USDC testnet di-mint dari `usdc.fakes.testnet`, payment key OutLayer dibuat. Jalur HTTPS OutLayer jalan. Uji jaringan: manifest `network: []` memblokir koneksi (6.7). `kalis-runner` opsi B dengan metode dan data tersegel lolos 12/12 lokal dan C03/C09 di testnet (6.8). Versi 2 metode portofolio tercatat di registry. Kontrak registry dibangun ulang dengan rustc 1.86 sehingga pesan error tampil.

### Draf aplikasi Kalis, kelanjutan setelah usage limit

Draf frontend lokal design/app/index.html selesai untuk review. Lima tujuan utama Workspace, Marketplace, Community, Activity dan Balance, ditambah dropdown nama Dien untuk Account, Connections, Permissions & preferences. Struktur mengadaptasi screenshot Corbel. Semua data contoh dan perubahan hanya selama sesi. Tidak ada integrasi backend, transaksi atau deployment.

Alur yang dapat dicoba mencakup navigasi, pencarian metode/pekerjaan, filter, pembuatan draf pekerjaan, hasil C03 historis, persetujuan memori dan tindakan contoh, draf metode, top-up mock dengan gagal/coba lagi/batal, serta pengaturan akun. Community menampilkan keadaan kosong untuk data yang belum terhubung.

Sembilan pemeriksaan controller di design/app/verify.cjs lolos. Sintaks script lolos. Reviewer terpisah mengonfirmasi delapan temuan kode sudah resolved. Struktur shell/aset/ARIA dan tujuh pasangan kontras diperiksa. Browser tetap terblokir MachPortRendezvous permission denied 1100, sehingga belum ada screenshot valid atau klaim WCAG/visual penuh. Detector impeccable degraded regex, CLI RYUX tidak tersedia tetapi skill dibaca dari sumber resmi. Bukti dan batas lengkap di design/app/REVIEW.md.

Dokumen produk bagian 57, PDF, memori serta dokumentasi artifact disinkronkan. Skill documenter sempat terhenti karena usage limit dan dilanjutkan. Menunggu review visual Dien. Pemeriksaan compliance NEAR tidak menemukan konflik. Status backend milik Claude Code tidak diubah.
- **13 Nov 2026 17:30 UTC (Claude Code).** Laporan eksekusi, cek ulang pembeli, dan pencocokan attestation dibangun dan lolos di testnet (6.9). Registry versi 3. Antarmuka untuk frontend dicatat.


## 14 November 2026, audit screenshot aplikasi oleh Codex

Pengguna menolak beberapa pola visual draf dan meminta riset detail metode. Analisis tercatat di design/app/CRITIQUE.md, rancangan bagian 58 dan PRODUCT_MEMORY.md. Dua assessment independen diizinkan. Belum ada perubahan frontend atau backend. Bukti render berasal dari screenshot pengguna, native browser tetap tidak terverifikasi. Cek aturan NEAR tidak menemukan konflik pada analisis dan dokumentasi lokal ini.


## Revisi Marketplace, 14 November 2026

Katalog, detail, My methods dan Create method di design/app diperbarui. Ditambah Reviews, Versions dan Contributions per metode. Rating dan jumlah ulasan terlihat dengan keadaan kosong jujur. Metadata input/hasil/akses/batas draf disimpan dan di-escape. Sebelas controller checks lolos. Sintaks dua script lolos. Belum ada audit render browser. Tidak ada perubahan backend atau transaksi. Cek aturan NEAR tidak menemukan konflik.
- **13 Nov 2026 17:45 UTC (Claude Code).** Keputusan escrow berbasis tahap, aturan yang bisa dicek pembeli, dan tambalan instruksi dicatat (rancangan bagian 56). Runner 0.3 dengan padding rerun, registry versi 4. Selisih instruksi hanya berkurang sebagian (6.10).


## Kajian referensi OKX Marketplace

Dua halaman pilihan pengguna dibaca melalui HTML dan CSS publik. Temuan dan batas bukti disimpan di design/app/OKX_REFERENCE.md dan rancangan bagian 60. Tidak ada perubahan frontend pada sesi kajian ini. Tidak ada pengujian klik/browser atau klaim perilaku Use now. Cek aturan NEAR tidak menemukan konflik.


## Penerapan visual referensi OKX

Cover JPEG lokal ditambah ke design/app/assets. Katalog memakai kartu horizontal dengan satu tautan, identitas detail memakai cover yang sama, Reviews mendapat ringkasan skor/distribusi kosong, dan form pembuat menyimpan pilihan cover serta preview. Source app.js/app.css/data.js diperbarui. Sebelas controller checks dan sintaks lolos. Render browser belum terverifikasi. Dokumentasi produk/PDF diselaraskan. Tidak ada konflik aturan NEAR.


## Audit cakupan frontend menyeluruh, Codex

Pemetaan kebutuhan dan batas tersedia di design/app/COVERAGE.md. Ditambah flows.js dan 23 rute untuk konfigurasi, input/model/checkout, izin kasus, report, escrow dan draf alur komunitas. Catatan sesi mempunyai rujukan silang dan tautan kelanjutan. Viewer report/escrow memakai fixture berlabel. Enam belas controller checks dan sintaks lolos. Belum semua perjalanan terhubung utuh atau memakai backend. Jangan menyebut seluruh fitur selesai. Reviewer mengidentifikasi celah yang dipertahankan dalam matriks. Aturan NEAR diperiksa, tidak ada konflik, signing, spending atau deploy.
- **13 Nov 2026 18:15 UTC (Claude Code).** Tanda selesai bertanda tangan TEE (runner 0.4). Sputnik DAO `kalis-fund` dibuat. Kontrak market (registry + escrow + pembagian) di-deploy, unit test 9/9. Alur penuh sukses dan gagal lolos di testnet (6.11).
- **13 Nov 2026 18:50 UTC (Claude Code).** Folder build tak terpakai dibersihkan (sekitar 6 GB). Langkah 4 dan 5 selesai: bounty Sputnik DAO, perbaikan metode v2 oleh `kalis-contrib.testnet`, versi 2 di market, run berbayar dengan versi 2 (6.12).
- **13 Nov 2026 19:20 UTC (Claude Code).** API backend `app/backend/` dengan modul kripto browser, kontrak API untuk Codex, dan smoke test sukses dan gagal lewat API (6.13).
- **13 Nov 2026 18:40 UTC (Claude Code).** Lima perlindungan di backend dengan 33 uji lulus (6.14). Portofolio versi 3 dengan manifest konektor. Manifest draf tender. Dokumen tender fiktif dengan injeksi.


### Codex kembali setelah handoff Claude

Transkrip sesi Claude fa84e545-7c4f-4d63-a24d-f8561868c297 dibaca dan dicocokkan dengan rancangan bagian 63, app/web/COVERAGE.md serta struktur komponen saat ini. Konteks disimpan di app/web/HANDOFF_CODEX.md. Hasil 20 tes/build/Chrome adalah bukti yang dilaporkan Claude, belum dijalankan ulang oleh Codex pada pembacaan konteks ini. Tidak mengembalikan file lama atau mengubah backend. Integrasi tetap mengikuti instruksi pengguna, bukan dimulai otomatis karena backend tersedia.


### Integrasi frontend-backend dimulai atas instruksi pengguna

Kode Next proxy dan mode /connected ditambah. Portfolio browser sealing, version-pinned payment, encrypted execution, local completion verification/recheck/verdict dan settle tersedia pada kode UI. DAO read dan advanced protections API panel tersedia. Mock store tetap terpisah. Rincian batas dan cara restart ada di app/web/BACKEND_INTEGRATION.md. Typecheck/build lolos, 23 TS + 2 crypto tests lolos, backend GET health/config/methods sukses. Tidak ada testnet spending atau protection mutation. Server3311 lama belum memuat route, bind3312 EPERM, sehingga browser E2E belum terverifikasi. Integrasi seluruh halaman belum selesai.
- **14 Nov 2026 01:17 UTC (Claude Code).** Runner 0.5: jaringan hanya ke NEAR AI, import `kalis.ai_chat` dengan attestation dan tanda tangan per panggilan, metode berbentuk prompt dengan cek kebocoran. Deploy ke OutLayer, secret dipindah. Portofolio v4 dan metode prompt `salary-counteroffer` v1 di market, smoke berbayar keduanya Released. RANCANGAN bagian 5, 51, 55 direvisi, bagian 65 baru, PDF 65 halaman (6.15).


### Integrasi seluruh permukaan API yang tersedia ke halaman utama

Backend mode kini default pada route normal. backend-pages.tsx menghubungkan registry, Connections, Memory, Files, Browser, Activity/outbound/audit dan DAO reads; connected.tsx menyediakan encrypted buyer payment/run/settle dengan version pinning dan unsigned wallet request. Mock demo terpisah eksplisit. API yang tidak ada ditandai unavailable, bukan dibuat seolah live. Helper crypto disinkronkan dengan backend termasuk AI proof/prompt verdict. 23 TS + 3 crypto tests lolos, typecheck/build diperiksa. Matriks app/web/COVERAGE.md diperbarui. Tidak melakukan pembayaran/signing/mutasi backend. Server3311 perlu restart; pengujian browser belum diklaim. Tidak ada konflik aturan NEAR.


### Handoff kebutuhan backend untuk Claude

Atas permintaan Dien, Codex menyusun app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md berdasarkan API dan kode backend aktual. Memuat gap, usulan endpoint/DTO, izin, idempotency/recovery, transisi dan kriteria penerimaan, serta prompt handoff. Ini dokumentasi, bukan backend baru atau policy final. Tidak mengirim pesan eksternal dan tidak melakukan signing/spending. Rancangan bagian 66 dan PDF diselaraskan.


### Audit tambahan layanan backend untuk handoff Claude

Handoff app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md diperluas dengan bagian H, delapan kelompok layanan yang ditelusuri dari rancangan termasuk 65.1 tender. Menjelaskan schema/checker, runtime tender, model selection, run-bound policy, provenance/artifact, evidence/preflight, contribution package dan effective permission/cancellation. Semua bentuk API baru tetap usulan dan dibedakan dari fungsi internal atau keputusan yang terbuka. Dokumentasi saja, tidak mengubah backend dan tidak signing/spending. Cek aturan NEAR tidak menemukan konflik.
- **14 Nov 2026 02:35 UTC (Claude Code).** Kelompok A, manifest v5 dan cek pembeli, perbaikan teks dokumen, impor file, rating dan riwayat, artefak, `transfer_method_owner`, tiga akun penjual demo, tender v1 berbayar sukses di OutLayer (6.16).
- **14 Nov 2026 06:00 UTC (Claude Code).** Login NEP-413, publikasi penjual, komunitas, uji privat, runner build 823e99 dengan `evaluate` dan `ai_restrict`, tiga metode diterbitkan ulang di runner baru, reclaim teruji (6.17).
- **14 Nov 2026 06:10 UTC (Claude Code).** Delapan metode dengan delapan akun penjual demo, semua lolos run berbayar. Batas waktu OutLayer dinaikkan ke 180 detik. H3, H4, H8 selesai. Seluruh butir backend A–H terpasang (6.16–6.18). Berikutnya frontend.


## Riset website referensi, 14 November 2026

Riset publik selesai dan dicatat di research/website-reference-2026-11-14.md, dengan delapan pembanding utama, sumber resmi, matriks penerapan halaman, dokumentasi brand system n8n dan usulan wording. Rancangan bagian 68 dan PDF diselaraskan. Tidak ada perubahan kode atau status fitur. Inspeksi render dan interaksi pembanding belum dilakukan. Compliance gate tidak menemukan konflik pada riset dan dokumentasi lokal.
- **14 Nov 2026 07:00 UTC (Claude Code).** Riset referensi desain, dua mock marketplace (Luno CRM dan Luno Crypto), palet extrafazant.nl, tema terang saja. Semua aturan desain disimpan di `FRONTEND_GUIDE.md` untuk Codex. Frontend diserahkan ke Codex.


## Persiapan domain aplikasi, 14 November 2026

Persiapan lokal untuk landing calis.scientivan.dev dan aplikasi app.calis.scientivan.dev disepakati. Bukti ada di app/web/src/app/layout.tsx, app/web/vercel.json dan app/web/DEPLOYMENT.md. Pemeriksaan read-only Vercel berhasil dan nameserver domain berada di Cloudflare. Backend publik belum diberikan. Belum membuat proyek, deploy publik, memasang domain atau mengubah DNS. Verifikasi berhasil dengan npm run build dan npm test di app/web, 31 tes lulus. PDF diregenerasi menjadi 70 halaman dan generator menyatakan no overflow, isi hostname halaman domain diperiksa. Rancangan bagian 69 dan sumber PDF diselaraskan. Compliance gate NEAR tidak menemukan konflik.


## Sinkronisasi dokumentasi menyeluruh, 14 November 2026

Atas permintaan Dien, dokumen aktif direkonsiliasi dua arah dengan source, runtime dan bukti historis. Rancangan bagian 0/70, README, PRODUCT, DESIGN, coverage/gaps/integration/navigation, API notes, panduan, memori dan indeks dokumen diperbarui. Handoff/prototipe/review lama diberi status historis. Bukti di audit/2026-11-14-doc-sync/. GET sembilan endpoint dan proxy health berhasil, 14 halaman Chrome tanpa login terbuka. Build dan 31 tes frontend sesi sama lulus sebelum perubahan dokumentasi, local manifest 47 dan Office 8 lulus. Crypto/checks/file-import browser identik backend. PDF diregenerasi menjadi 72 halaman, generator memverifikasi no overflow dan isi cover serta halaman Social Money diperiksa visual. Tautan lokal dokumen aktif dan git diff --check lulus.

Tidak mengubah kode produk, login, mutasi backend, seed, signing, spending, push atau deploy. Gap private-values/reviewer/revoke/legacy bounty dipertahankan eksplisit. Deployment ditunda dan diskusi inovasi Social Money menjadi langkah berikutnya. Compliance gate NEAR tidak menemukan konflik.


## Investigasi privasi sebelum Social Money, 14 November 2026

Source runner/backend/frontend serta rancangan 52 dan 65.1–65.3 ditelusuri. Bukti dan penghalang ada di PRIVACY_TEE_INVESTIGATION.md. Tidak ditemukan bukti keterbatasan fundamental OutLayer, tetapi runner belum punya API proteksi, storage dan proof owner. Shared platform payment key, localhost connector dan pdftotext host adalah dependensi nyata untuk migrasi. Registrasi private-values bukan syarat platform. Penetapan protocol/migrasi masih usulan, worker testnet belum diprobe baru. MD/PDF diperbarui, Social Money ditunda sementara. Tidak mengubah kode, signing, spending atau deploy. Cek NEAR tidak menemukan konflik.

Verifikasi investigasi privasi. PDF 73 halaman lolos generator tanpa overflow, halaman hasil investigasi diperiksa visual. Pengujian TEE baru dan migrasi fitur belum dilakukan.

## Deployment publik (15 November 2026)

Backend berjalan di VPS tinjau-vps sebagai service kalis-backend (port 8790 di belakang Caddy) untuk https://api.kalis.scientivan.dev, health dan /api/privacy/config (mode tee, enabled) lulus di localhost VPS. Frontend di proyek Vercel kalis dengan domain kalis.scientivan.dev dan app.kalis.scientivan.dev, build produksi Ready. kalis.scientivan.dev sementara redirect 307 ke aplikasi lewat app/web/src/proxy.ts. Ejaan domain diganti dari calis ke kalis. Uji lewat host publik belum terverifikasi karena menunggu DNS Cloudflare. Rincian ada di app/web/DEPLOYMENT.md. npm test 32 lulus dan npm run build berhasil.


### Landing Next.js lokal, 15 November 2026
Draf /landing dibuat langsung di app/web. Hero gambar lanskap existing dengan Three.js r160 vendored, interaksi pointer, paket bergerak, kontrol tahap dan pause. Section putih aksen biru, metode contoh, proses, community dan batas testnet. Compile dan TypeScript lulus. PDF 76 halaman diverifikasi tanpa overflow. Belum review browser visual atau deployment. Root marketplace dipertahankan. Compliance gate tidak menemukan konflik.


### Koreksi hero landing
Logo Meeting K existing dipasang di header/footer. Carousel langkah dan ilustrasi processor bertahap dihapus, diganti satu komposisi Three.js dua volume privat dalam ruang transparan. Pause/reduced motion dipertahankan. PDF 77 halaman tanpa overflow. Review visual pengguna masih diperlukan, belum deployment.


### HelloNear adaptation for landing sections, 15 November 2026
Dien rejected static lower-section layout and requested HelloNear reference analysis and adaptation, leaving hero 3D deferred. Reference HTML/CSS fetched, browser sections inspected. Analysis in design/LANDING_HELLONEAR_REVIEW.md. Implemented landing-sections.tsx/css with selectable method deck, privacy/input/output preview, interactive consent illustration, two-party diagram/inspector tabs, fund split and version preview, FAQ, final invitation/footer. White and #0038ff retained. Hero scene unchanged.
Validation. Next production build and TypeScript passed. Browser at desktop 1440 and mobile 390 reports no document overflow, three method cards and six sections. Consent click enables preview and selects answer tab. Captures /tmp/kalis-landing-desktop.png and /tmp/kalis-landing-mobile.png. Mechanical detector reported one border-width warning, corrected to 1px. PDF regenerated with 78 pages, no overflow. No publication, wallet signature or transaction. Compliance gate no conflict. Visual result remains a draft for Dien review.


### HelloNear correction, marquee and pinned scene
Dien explicitly rejected the preceding adaptation as incomplete. Added technology identities/roles, moving connector strip with app catalog status, per-word heading reveal and a desktop pinned right-to-left clip reveal followed by scene pan to buyer checks. Product scenes use private sheet/document objects and Kalis permission/result UI. Hero unchanged. Mobile/paused/reduced motion uses vertical scenes. No new connector capability is claimed.
Evidence. Production build and TypeScript pass. Chrome desktop 1440/mobile 390 no document overflow or broken images. Desktop sticky and computed wipe 0%, pan -39.97% at sampled progress verified. Mobile pin relative. Reduced-motion pin relative and marquee animation none verified. Fixed missing visual word spacing and inherited brand-icon stroke after screenshot inspection. Captures /tmp/kalis-v3-*.png. PDF 79 pages no overflow. Local draft pending Dien visual review, no deployment. Compliance gate no conflict.


### Extrafazant landing rebuild, 15 November 2026
Dien rejected HelloNear adaptation again and supplied extrafazant.nl. Replaced lower-section components/CSS rather than adding another theme layer. Intro uses a generated cobalt still-life in tilted collage, large Barlow Condensed/Instrument Serif titles, white/blue poster stack driven by scroll, tilted protection posters, staggered community posters, FAQ/final invitation and sharp split-arrow CTAs. Technology and connector strips retained with truthful status. Hero source unchanged. OFL fonts and licenses are local. Generated WebP and exact prompt provenance are in public/landing. Reference analysis is design/LANDING_EXTRAFAZANT_REVIEW.md.
Evidence. Production build/TypeScript pass. Chrome 1440 desktop and 390 mobile report no document overflow or broken images, ten catalog connector identities, desktop sticky stack/mobile relative stack. Three illustration controls update their statuses without network actions. Reduced motion removes sticky stack and marquee animation. Screenshot inspection found overlap of outgoing cards with the heading, small protection heading from global selector specificity and a mobile poster word collision. Fixed these in one batch with stack-stage clipping, scoped display selector and smaller mobile art type. Mechanical design detector found no issues. PDF 80 pages, no overflow. Local draft, not visual approval or deployment. Compliance gate no conflict.


### Senyap reference inspection
Dien supplied https://senyap.scientivan.dev/ without further instructions. Inspected public HTML and Chrome screenshots. Observed a dark interactive hero, large light sans headings, white lower sections and interactive product demonstrations. Asked whether Senyap replaces Extrafazant or applies only to specific sections. No new visual direction inferred, no implementation changes or product decisions from the link alone. Compliance gate no conflict for read-only inspection.


### Senyap layout and fullscreen fix
Dien explicitly replaces Extrafazant with Senyap, layout/positioning only, Kalis palette/assets retained. The earlier landing inherited global main max-width 1680px and sidebar padding. Scoped .kl reset now gives width 100%, max-width none, margin/padding zero. Hero 100dvh, overlay fixed header changes to white over lower sections. Hero sculpture/landscape/logo reused, positioned upper-right with copy lower-left and preview lower-right. Lower sections replaced with sticky privacy list/interactive panels, participant views, buyer/author marketplace, community split, FAQ/final CTA. Existing UseCaseArt reused, Inter restored.
Verification. Production build and TypeScript pass. Chrome at 1440x900, 2560x1440 and 390x844 measured main/hero widths equal to viewport, main padding 0px and hero heights exactly equal viewport. No document overflow or broken images, Three.js canvas present. Sealing visual toggles, author view toggles, margin example passes at 10 percent and fails at 20 percent. Reduced motion stops marquee. Screenshot inspection completed. Header fixed styling and copy contrast backing added in final correction. PDF 81 pages, no overflow. Mechanical detector no findings. No deployment or final visual approval. Compliance gate no conflict.


### Hero typography and floating capsule revision
Dien requested Kalis product typography, Impeccable-guided hero composition, removal of workflow preview card and wide-to-compact floating navigation. Hero preview DOM removed. Inter explicit, hero 600 and section headings 500. Hero copy/CTA grouped left, existing illustration right. Navbar one large-radius capsule, starts wide then contracts after 64px scroll and moves slightly down. Mobile menu added with expanded state and matching navigation panel. Fullscreen retained.
Validation. Production build/TypeScript pass, mechanical detector no findings. Chrome desktop 1440x900 header 1392px wide/top16px becomes 1040px/top24px. Mobile 390x844 header 366px/top12px becomes 350px/top20px. Radius999px in both states. Hero equals viewport, no horizontal overflow, Inter weight600 verified, preview absent. Mobile menu expanded=true and visible display flex. Screenshots /tmp/kalis-hero-revision-*.png visually inspected. PDF 82 pages without overflow. Local review draft, no deployment. Compliance gate no conflict.

### 6.21 Social Money: royalti kontributor, tip, rating ber-stake (🟡 testnet nyata, backend lokal, belum deploy)
Kode: `app/backend/src/social-api.js` (baru, didaftarkan satu baris di `server.js`; satu baris hook di `settle` pada `runs-api.js`), `app/web/src/components/social-money.tsx` (+ `.module.css`), sisipan satu baris di `run-page.tsx`, `method-detail.tsx`, `community-workspace.tsx`, dan dukungan aksi `Transfer` di `lib/near/auth.tsx`. Kontrak market tidak di-redeploy. Detail: `docs-social-money.md`.
- Royalti. Kontrak `settle` hanya membayar seller, DAO, platform (field `contributors` versi disimpan tapi tidak dibayar). Maka setelah run Released pada versi yang punya `contributors`, akun platform (`platform.scientivan.testnet`) mengirim 5% harga dari fee platform 10% miliknya ke kontributor, transfer terpisah, idempoten per run. Bagian seller (80%) dan DAO (10%) tidak berubah. Bukti: run `run-mwgxfxq1-bb507657` (portfolio-rebalance v6, settle `6PCTUj3QxEdezuQfbKaNapngPixYj4pSJTRt81LoVDZE`), royalti 0.005 NEAR ke `kalis-contrib.testnet` tx `E3kbGoTaruMnWNxF7kWGrRkxgpFLByD6HTzsSo9TTiCS`. Run sebelumnya `run-mwgxaeg9-bfec6168` tx `9byEigUThdT4nwWD6dANcMZMApDKLCYT71A8YjKYybNw`.
- Tip. Backend mengembalikan transfer tanpa tanda tangan (`kind: "transfer"`, `signer_must_be` = pembeli on-chain); dicatat hanya setelah backend membaca tx di chain (signer, penerima seller/kontributor, 0.01 sampai 1 NEAR). Bukti: 0.02 NEAR `kalis-buyer.testnet` ke `arif-planner.scientivan.testnet` tx `AocPgXqFQi9f7esRHDuUn1EfpGGfBKgimyMuZNv3LTUa` (ditandatangani kunci demo buyer lewat skrip, bukan dompet browser).
- Rating ber-stake. 0.01 sampai 0.1 NEAR dari pembeli run ke `kalis-fund.sputnik-v2.testnet` sebagai donasi: tidak dikembalikan, tanpa imbal hasil. Ditampilkan sebagai badge "Backed by" di ulasan. Bukti: 0.02 NEAR tx `Gjvf1Vx8eMifGTrZuQeCKPPDaqzaxZpy53SXujPic3pu`.
Validasi: `node scripts/social-money-test.mjs <base> <run>` lulus (termasuk penolakan nominal di luar batas, penerima asing, tx tip dipakai untuk stake), keempat tx dicek ulang via RPC (`SuccessValue`). `app/web` `npm test` 3/3, `npm run build` lulus. Belum: alur dompet browser untuk tip/stake belum diuji di browser; catatan off-chain (tips, review_stakes, royalties) ada di data server lokal uji, bukan VPS; server produksi perlu deploy agar royalti otomatis berjalan di settle.
