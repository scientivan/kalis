# Kelayakan teknis fitur NEAR untuk "Secret broker untuk agent coding"

Tanggal riset 11 Nov 2026. Deadline build 14 Nov 2026 23:59 UTC (sekitar 3,5 hari dari tanggal riset; brief memakai asumsi sekitar 2,5 hari kerja efektif).

Cara baca: setiap bagian dipisah menjadi **[Fakta]** (ada URL, output command, atau kutipan) dan **[Inferensi]** (penalaran agent). Perintah yang dijalankan hanya baca saja: `curl` ke docs dan API publik, view call RPC, `gh api`. Tidak ada akun dibuat, tidak ada deploy, tidak ada kunci dipakai.

## Ringkasan

| Fitur | Ada? | Status | Catatan pendek |
|---|---|---|---|
| OutLayer secrets + HTTP keluar | Ya | Mainnet dan testnet live | WASI saja, tidak bisa menjalankan shell |
| MPC CKD | Ya | Mainnet dan testnet live | Butuh deposit 1 yocto dan TEE pemegang kunci efemeral |
| NEAR AI Cloud (TEE, PII) | Ya | Live | Model Anthropic/OpenAI di sana tidak berjalan di TEE |
| yield/resume | Ya | Protokol, live | Batas tunggu 200 blok (sekitar 2 menit) |
| Function-call access key | Ya | Protokol, live | Tidak bisa melampirkan deposit |
| Shade Agents | Ada, deprecated | Jangan dipakai | Docs resmi melarang |

**Temuan paling penting [Fakta]:** OutLayer sudah punya produk "Connectors" yang hampir sama dengan ide ini. Ada konektor `github` (live di mainnet dan testnet) yang menyimpan login pemilik di enclave, memeriksa policy di luar AI, meminta persetujuan pemilik untuk setiap write, dan mengembalikan attestation. Sumber: https://app.outlayer.ai/docs/connectors, https://app.outlayer.ai/docs/tasks, https://skills.outlayer.ai/github-connector/SKILL.md. Dampaknya dibahas di bagian "Risiko".

## 1. OutLayer

### [Fakta]

- Identitas dan jaringan. Kontrak mainnet `outlayer.near`, testnet `outlayer.testnet`. API `https://api.outlayer.ai` dan `https://testnet-api.outlayer.ai`. Sumber: https://app.outlayer.ai/llms.txt. Kedua endpoint `/health` menjawab `{"status":"ok"}` pada 11 Nov 2026 (output `curl`). `GET https://api.outlayer.ai/public/stats` melaporkan `total_executions: 1355463`.
- Repo sumber `out-layer/outlayer`, lisensi Apache-2.0, dibuat 2025-10-09, push terakhir 2026-11-11 (output `gh api repos/out-layer/outlayer`). Isi folder `connectors/`: `github-connector`, `gmail-connector`, `mercury-connector`, `hyperliquid-connector`, `polymarket-connector`, `connector-probe`, `tasks-probe`, `subkey-probe`.
- Kode yang dijalankan adalah program WASI. Bahasa apa pun yang bisa dikompilasi ke WASM dengan WASI (Rust disarankan, juga C/C++, Go, AssemblyScript). HTTP keluar hanya di WASI Preview 2 (`wasm32-wasip2`). P2 "No files and no raw sockets". Sumber: https://app.outlayer.ai/docs/wasi.
- Host function NEAR dari dalam WASM: `view()`, `call()`, `transfer()` ke RPC NEAR. `call()` memakai kunci penanda tangan yang diberikan lewat secrets. Sumber: https://app.outlayer.ai/docs/wasi.
- Batas sumber daya per eksekusi: instruksi maks 500 miliar, memori maks 4096 MB (default 128 MB), waktu maks 180 detik (default 60 detik). Sumber: https://app.outlayer.ai/docs/near-integration dan https://app.outlayer.ai/docs/pricing.
- Batas jaringan untuk konektor: setiap request ke host punya 30 detik, bisa dinaikkan per host sampai 180 detik. Konektor hanya boleh menjangkau host di `capabilities.network` manifest. Project biasa (bukan konektor) "outbound network: open". Sumber: https://app.outlayer.ai/docs/connectors.
- Biaya. Rumus `base_fee + instruksi × tarif + waktu × tarif`, kelebihan deposit dikembalikan, eksekusi gagal tidak dikembalikan. View call `estimate_execution_cost` untuk 1 miliar instruksi, 128 MB, 60 detik mengembalikan `7000100000000000000000` yoctoNEAR (sekitar 0,007 NEAR) di testnet dan mainnet (output RPC 11 Nov 2026). Mode HTTPS dibayar dengan payment key berisi saldo USD (USDC). Ada trial 50 panggilan konektor dalam 7 hari pertama wallet. Sumber: https://app.outlayer.ai/docs/pricing, https://app.outlayer.ai/docs/web2-integration, https://app.outlayer.ai/docs/connectors.
- Secrets. Dienkripsi di browser dengan ECIES (X25519 + HKDF-SHA256 + ChaCha20-Poly1305), ciphertext disimpan on-chain, didekripsi hanya di TEE, lalu disuntikkan ke WASM sebagai environment variable. Akses diatur dengan kondisi: Whitelist akun, Until (kedaluwarsa), One build only (hash WASM), saldo NEAR/FT/NFT, regex akun, dan gabungan AND/OR/NOT. Pemilik bisa meminjamkan secret ke akun agent lewat `secrets_ref` tanpa menyalin nilainya. Secret `PROTECTED_*` dibuat di dalam TEE dan tidak pernah dilihat siapa pun. Sumber: https://app.outlayer.ai/docs/secrets.
- Batas keamanan secrets yang ditulis OutLayer sendiri: "it reaches your code as an environment variable, and code that prints or sends it has leaked it." Sumber: https://app.outlayer.ai/docs/secrets.
- Biaya simpan secret sebanding ukuran data plus sekitar 64 byte, dikembalikan saat dihapus. Secret "for an agent" sekitar 0,1 NEAR. Sumber: https://app.outlayer.ai/docs/secrets.
- Kunci per pemanggil. Fitur Encryption Keys menurunkan kunci simetris 256-bit di keystore TEE "for this project (or this exact build) and this caller", maksimal 5 kunci per manifest, hanya untuk `wasm32-wasip2`. Sumber: https://app.outlayer.ai/docs/encryption-keys.
- Dipanggil dari kontrak: `request_execution` ke `outlayer.near` dengan `source` (Project atau WasmUrl), `resource_limits` (wajib), `input_data`, `secrets_ref`, `response_format`, `payer_account_id`. Hasil (stdout) kembali ke callback kontrak. Lampirkan deposit NEAR. Sumber: https://app.outlayer.ai/docs/near-integration. Docs NEAR menyebut integrasi kontrak memakai mekanisme yield/resume. Sumber: https://docs.near.org/primitives/off-chain-compute/what-is.md.
- Dipanggil dari luar: `POST https://api.outlayer.ai/call/{project_owner}/{project_name}` dengan header `X-Payment-Key: {owner}:{nonce}:{secret}` atau `Authorization: Bearer wk_...`. Mode sync atau `async: true` dengan polling. Respons berisi `attestation_url` (`/attestations/by-call/{call_id}`). Sumber: https://app.outlayer.ai/docs/https-api.
- Attestation. Worker Intel TDX diverifikasi sekali saat registrasi di on-chain (Intel DCAP QVL, lima measurement MRTD dan RTMR0-3). Setiap eksekusi menghasilkan quote TDX yang REPORTDATA-nya (offset 568) berisi hash tugas: hash WASM, input, output, pemanggil, pembayaran. Cara cek: verifikasi rantai tanda tangan quote ke Intel Root CA, hitung ulang task hash, bandingkan hash input/output dengan transaksi, unduh WASM dan cocokkan sha256, opsional rebuild reproducible. Dashboard menjalankan verifier DCAP versi WASM di browser. Sumber: https://app.outlayer.ai/docs/tee-attestation, https://app.outlayer.ai/docs/trust-verification. Status worker live: https://workers.outlayer.ai.
- Yang dibuktikan attestation menurut OutLayer: "It proves what ran, not that what ran is trustworthy." Sumber: https://app.outlayer.ai/docs/tee-attestation.
- Persetujuan pemilik (Tasks). Run agent membuat task, pemilik membaca di inbox dan menyetujui dengan satu pesan yang ditandatangani wallet, "no transaction". Platform lalu menjalankan operasi `confirm`. Konektor GitHub bisa menahan setiap write (`file_put`, `commit`, `pr_create`, `pr_merge`, dan lainnya). Sumber: https://app.outlayer.ai/docs/tasks.

### [Inferensi]

- **Bisa dipakai sebagai worker TEE broker**, dengan satu batas besar. WASI tidak bisa menjalankan `git`, `aws`, `gh`, atau shell. Jadi "menyisipkan secret ke perintah" tidak bisa dilakukan di OutLayer. Yang bisa adalah menyisipkan secret ke **panggilan HTTP** (GitHub REST API, API cloud yang punya REST). Dasar: docs WASI P2 menyebut hanya HTTP client, tanpa file dan raw socket.
- AWS butuh tanda tangan SigV4. Bisa ditulis di Rust untuk wasip2, tapi belum diverifikasi apakah crate yang ada terkompilasi bersih. Untuk demo, GitHub API (header `Authorization: Bearer`) jauh lebih aman.
- Penyaringan output (menghapus nilai secret yang terpantul, termasuk versi base64 atau URL-encoded) cukup mudah ditulis di WASM sendiri. Ini justru celah yang OutLayer akui sendiri (kode yang mencetak secret membocorkannya).
- Mode on-chain menaruh output di callback kontrak, artinya **publik di chain**. Jawaban API (misalnya isi repo privat) tidak boleh lewat jalur ini. Jalur yang masuk akal: eksekusi lewat HTTPS (output hanya ke agent), lalu WASM menulis log ke kontrak NEAR memakai host function `call()` dengan kunci `PROTECTED_` ed25519 yang dibuat di TEE.
- Biaya bukan penghalang untuk demo (sekitar 0,007 NEAR per eksekusi), tapi memerlukan akun NEAR dan saldo, yang belum dibuat.

## 2. MPC CKD (confidential key derivation)

### [Fakta]

- Metode kontrak MPC `request_app_private_key(request: CKDRequestArgs)`, argumen `app_public_key` (format `AppPublicKey` atau `AppPublicKeyPV` yang bisa diverifikasi on-chain), `derivation_path`, `domain_id` (harus domain BLS12-381). Deposit minimal 1 yoctoNEAR, gas minimal 10 Tgas (efektif sekitar 7 Tgas). Sumber: https://github.com/near/mpc/blob/main/crates/contract/README.md.
- Kontrak di mainnet `v1.signer` dan testnet `v1.signer-prod.testnet`. Sumber yang sama.
- View call `public_key({"domain_id":2})` mengembalikan kunci `bls12381g2:...` di kedua jaringan (output RPC FastNEAR 11 Nov 2026). Artinya domain CKD aktif di testnet dan mainnet.
- Hasil CKD deterministik per `(akun pemanggil, derivation_path)`. Respons `{big_c, big_y}` dienkripsi ElGamal ke kunci efemeral pemohon; kunci akhir diturunkan dengan HKDF-SHA256. Contoh CLI: https://github.com/near/mpc/blob/main/crates/ckd-example-cli/README.md (CLI ini "does not cover anything related to TEE apps").
- Alasan deposit 1 yocto: function-call access key secara default tidak bisa melampirkan deposit, sehingga frontend jahat tidak bisa diam-diam meminta. Sumber: README kontrak MPC.
- Rilis terbaru repo `near/mpc` adalah 3.18.0 tanggal 2026-10-28 (output `gh api`).
- OutLayer memakai CKD untuk keystore: keystore TEE meminta kunci derivasi lewat kontrak DAO (`request_key`) ke MPC "once at keystore startup", lalu memakai kunci itu untuk mendekripsi secret aplikasi. Sumber: https://app.outlayer.ai/docs/secrets.

### [Inferensi]

- Klaim produk "kunci per pengguna diturunkan lewat MPC CKD" **benar secara tidak langsung** bila memakai OutLayer: CKD menghasilkan master keystore, lalu kunci per pemanggil diturunkan keystore (Encryption Keys). Bukan satu panggilan CKD per pengguna. Klaim ini harus ditulis seperti itu, jangan dibesar-besarkan.
- CKD langsung per pengguna (kontrak sendiri memanggil `request_app_private_key` dengan `derivation_path = akun pengguna`) secara teknis mungkin, tapi butuh TEE sendiri yang memegang kunci efemeral ElGamal dan membuktikan diri ke kontrak. Itu berarti TEE container sendiri (Phala dstack) plus verifikasi attestation di kontrak. Tidak realistis dalam 2,5 hari.
- Karena butuh deposit, agent dengan function-call key tidak bisa memanggil CKD secara langsung. Kontrak broker yang harus membayar dari saldonya.

## 3. NEAR AI Cloud

### [Fakta]

- Endpoint `https://cloud-api.near.ai`, API kompatibel OpenAI. Sumber: https://docs.near.ai/llms.txt.
- `GET https://cloud-api.near.ai/v1/model/list` (11 Nov 2026) berisi 63 model. Yang `verifiable: true` antara lain `deepseek-ai/DeepSeek-V4.1-Flash-1017`, `Qwen/Qwen3.8-27B`, `z-ai/glm-5.3`, `z-ai/glm-5.3-flash`, `moonshotai/kimi-k3`, `openai/privacy-filter`. Model `anthropic/*` dan `openai/gpt-*` di daftar itu bertanda `verifiable: false`, `providerType: external`.
- `openai/privacy-filter`: deskripsinya "PII detection (token classification) returns spans for emails, phones, addresses, names, account numbers, secrets. NEAR AI runs this model in a TEE". Harga input 0,01 USD per sejuta token (dihitung dari field `inputCostPerToken`). Endpoint `POST /v1/privacy/classify` (span berlabel dengan skor) dan `POST /v1/privacy/redact`. Sumber: https://docs.near.ai/cloud/guides/specialized-endpoints.md dan output model list.
- Verifikasi: minta attestation gateway dan model dengan nonce dari klien sebelum mengirim request (`/v1/attestation/report`), simpan byte request dan respons persis, ambil tanda tangan `GET /v1/signature/<CHAT_ID>`. `provider_tee` menandatangani `<MODEL_ID>:<request_hash>:<response_hash>`, `gateway` menandatangani `<request_hash>:<response_hash>`. Algoritma `ecdsa` (EIP-191) atau `ed25519`. Sumber: https://docs.near.ai/cloud/verification/cloud-api/response-signatures.md.
- Keterbatasan yang ditulis NEAR AI sendiri: bukti preflight plus satu tanda tangan "do not yet form a complete model-to-Gateway-to-final-response chain". Sumber yang sama.
- Indeks docs NEAR AI tidak memuat layanan hosting container TEE milik pengguna (hasil `grep` atas https://docs.near.ai/llms.txt untuk "container", "agent", "deploy").

### [Inferensi]

- **Cocok untuk deteksi secret dan PII di output** sebagai lapisan kedua setelah pencocokan nilai secret yang pasti. Model klasifikasi bisa meleset, jadi jangan jadikan satu-satunya penyaring.
- Panggilan dari WASM OutLayer ke `cloud-api.near.ai` mungkin (docs konektor memberi contoh host itu dengan `timeout_secs`). Kunci API NEAR AI disimpan sebagai author secret. Ini butuh akun NEAR AI Cloud yang belum dibuat.
- Kalau broker juga menawarkan "agent coding pakai model privat", hanya model `verifiable: true` yang boleh diklaim privat. Claude dan GPT lewat NEAR AI tidak privat.

## 4. yield/resume

### [Fakta]

- `Promise::new_yield(callback, args, gas, weight)` mengembalikan promise dan `YieldId`. Pihak luar memanggil fungsi kontrak yang menjalankan `yield_id.resume(bytes)`. Callback menerima `#[callback_result] Result<T, PromiseError>`; `Err` berarti timeout. Contoh memakai `near-sdk` 5.29.1. Sumber: https://docs.near.org/smart-contracts/anatomy/yield-resume.md, kode https://github.com/near-examples/yield-resume.
- "The contract can wait for 200 blocks before timing out." Fungsi resume publik, jadi wajib menjaga siapa pemanggilnya. Jangan panic di callback. Sumber yang sama.
- Rata-rata waktu blok testnet 0,58 detik (diukur dari 1000 blok terakhir lewat RPC, 11 Nov 2026).

### [Inferensi]

- 200 blok × 0,58 detik sekitar **116 detik**. Persetujuan manusia lewat yield/resume harus terjadi dalam sekitar 2 menit, kalau tidak permintaan gagal. Untuk demo ini cukup (pengguna memegang notifikasi), untuk produk nyata terlalu pendek.
- Pola persetujuan: agent memanggil `request_release` → kontrak cek policy → kalau berisiko tinggi, kontrak menyimpan permintaan dan `yield` → pemilik memanggil `approve(request_id)` dari wallet (cek `predecessor == owner`) → `resume` → callback mencatat log dan menandai izin.
- Alternatif yang lebih tahan waktu: persetujuan sebagai state biasa (bukan yield), worker TEE membaca state lewat host `view()` sebelum melepas secret. Ini tetap on-chain dan bisa diaudit, hanya tidak memakai yield.
- OutLayer Tasks juga menyediakan persetujuan, tapi lewat pesan bertanda tangan off-chain. Kalau dipakai apa adanya, bagian "aturan dan log di kontrak NEAR" hilang.

## 5. Function-call access key

### [Fakta]

- Function-call key dibatasi `receiver_id` (satu kontrak), `method_names` (opsional, daftar metode), `allowance` (opsional, batas NEAR untuk gas), dan tidak bisa melampirkan token NEAR. Sumber: https://docs.near.org/protocol/accounts-contracts/access-keys.md.
- Untuk secret OutLayer: function-call key milik akun sendiri menandatangani langsung, jadi aturan "Direct calls only" tidak bisa membedakan dapp yang memegang kunci itu. Sumber: https://app.outlayer.ai/docs/secrets.

### [Inferensi]

- Cocok untuk membatasi agent: kunci dengan `receiver_id = broker contract`, `method_names = ["request_release"]`, allowance kecil. Agent tidak bisa mengubah policy, menyetujui sendiri, atau menarik dana.
- Konsekuensi: karena tidak bisa melampirkan deposit, biaya OutLayer (deposit) dan CKD (1 yocto) harus dibayar oleh kontrak broker dari saldonya. Kontrak perlu mekanisme prabayar dari pemilik.
- Pemisahan kunci hanya berlaku untuk jalur on-chain. Jalur HTTPS OutLayer memakai payment key atau `wk_`, bukan access key NEAR.

## 6. Alternatif bila OutLayer tidak cocok

### [Fakta]

- Shade Agent Framework: "Do not use the Shade Agent Framework. It has not been maintained since April 19, 2026." Sumber: https://docs.near.org/getting-started/tools-for-ai.md (bagian "Shade Agent Framework (Deprecated)").
- Phala dstack: repo `Dstack-TEE/dstack`, Apache-2.0, 575 bintang, push 2026-11-11, rilis `verifier-v0.6.3` 2026-11-02 (output `gh api`). Phala Cloud menjalankan Docker Compose di CVM TEE; encrypted secrets dienkripsi di klien (X25519 + AES-256-GCM) dan hanya CVM yang bisa mendekripsi saat boot. Ada panduan ambil dan verifikasi attestation. Sumber: https://docs.phala.com/llms.txt dan https://docs.phala.com/phala-cloud/cvm/set-secure-environment-variables.md.
- NEAR AI Cloud: tidak ditemukan layanan container TEE milik pengguna di indeks docs (lihat bagian 3).

### [Inferensi]

- Phala dstack adalah satu-satunya alternatif yang bisa menjalankan **perintah sungguhan** (`git`, `aws`, `gh`) di TEE, karena isinya container Linux. Harganya: akun Phala, biaya CVM (harga tidak diverifikasi), verifikasi attestation dstack di kontrak NEAR harus ditulis sendiri, dan integrasi NEAR jadi lebih tipis kecuali kontrak tetap memegang policy dan log.
- Untuk 2,5 hari, OutLayer jauh lebih realistis karena secrets, attestation, dan pembayaran sudah tersedia.

## Arsitektur minimal (sekitar 2,5 hari)

[Inferensi] Disusun dari fakta di atas. Semua di testnet.

1. **Kontrak `broker` (Rust, near-sdk 5.x)**. Menyimpan aturan per secret (host tujuan yang diizinkan, metode HTTP, tingkat risiko, butuh persetujuan atau tidak), daftar agent, permintaan pending, dan event log `release` (siapa, secret mana, tujuan, hash request, hash attestation, disetujui siapa). Metode `request_release` untuk agent, `approve` untuk pemilik dengan yield/resume, `record_release` hanya untuk kunci TEE.
2. **Project OutLayer (Rust, `wasm32-wasip2`)**. Menerima `{request_id, secret_name, http_request}`. Membaca kontrak lewat host `view()` untuk memastikan permintaan diizinkan atau disetujui. Mengambil secret pemilik dari env var (`secrets_ref`, kondisi Whitelist agent + Until + One build only). Mengirim HTTP ke GitHub REST API. Menyaring output (hapus nilai secret persis dan varian base64 dan URL-encoded). Menulis log ke kontrak lewat host `call()` dengan kunci `PROTECTED_` yang dibuat di TEE dan didaftarkan sebagai function-call key ke `broker`. Mengembalikan output tersaring.
3. **CLI atau server MCP kecil untuk agent coding** (Node atau Python). Agent memanggil `request_release` dengan function-call key, lalu memanggil OutLayer HTTPS dengan payment key, dan hanya menerima output tersaring. Agent tidak pernah memegang nilai secret.
4. **Halaman web kecil**. Pemilik melihat permintaan pending, menyetujui dengan wallet, melihat log dari event kontrak, dan membuka `attestation_url` OutLayer. Verifikasi penuh quote TDX cukup dengan tautan ke verifier dashboard OutLayer, ditambah cek hash WASM sendiri.
5. Opsional bila waktu ada: panggil `POST /v1/privacy/classify` NEAR AI dari WASM untuk menandai PII di output.

Urutan kerja yang disarankan: hari 1 kontrak + project OutLayer "hello HTTP dengan secret", hari 2 log on-chain dari TEE + CLI agent + yield approve, setengah hari 3 halaman web, README, video.

## Risiko teknis terbesar

[Inferensi] Diurutkan dari yang paling berbahaya.

1. **Originalitas, bukan teknis.** OutLayer sudah menjual hampir seluruh alur ini sebagai konektor GitHub: login di enclave, policy di luar AI, persetujuan pemilik, attestation (lihat Fakta bagian 1). Juri yang mengenal OutLayer akan bertanya "apa bedanya dengan memakai konektor GitHub OutLayer?". Pembeda yang masih jujur: policy dan log pelepasan di kontrak NEAR (punya OutLayer di coordinator dan inbox off-chain, belum diverifikasi apakah ada log on-chain), tujuan HTTP bebas di luar konektor kurasi, penyaringan output, dan pintu masuk khusus agent coding (CLI/MCP). Ini harus divalidasi ke Dien sebelum build.
2. **Kunci `PROTECTED_` untuk menulis log on-chain dari WASM.** Fitur generate dan host `call()` terdokumentasi, tapi belum dicoba. Kalau gagal, log harus ditulis oleh server biasa, dan klaim "log tidak bisa dipalsukan" melemah.
3. **Akses secret di jalur on-chain.** Kondisi secret dinilai terhadap akun penanda tangan transaksi. Belum diverifikasi siapa "signer" saat eksekusi dipicu dari callback setelah resume. Karena itu arsitektur di atas memakai jalur HTTPS untuk eksekusi.
4. **Jendela yield 2 menit.** Demo harus disetel agar pemilik menyetujui cepat. Kalau terlewat, permintaan gagal.
5. **Kesiapan akun.** Butuh akun NEAR testnet, saldo untuk kontrak dan OutLayer, payment key OutLayer, token GitHub demo, dan opsional kunci NEAR AI. Semua belum dibuat. Pembuatan dan pembayaran butuh konfirmasi Dien (compliance gate poin 7).
6. **Toolchain.** Docs OutLayer memperingatkan salah target build (`wasm32-unknown-unknown` vs `wasm32-wasip2`) dan versi near-sdk yang tidak cocok. Ini sumber kehilangan waktu yang umum.

## Yang harus dipalsukan atau disederhanakan untuk demo

[Inferensi] Ditandai jujur. Semua ini harus disebut di README.

- **"Menyisipkan secret ke perintah" tidak ada.** Hanya panggilan HTTP ke GitHub REST API. Perintah `git push` atau `aws` tidak didukung di OutLayer. Jangan diklaim.
- **"Kunci per pengguna lewat MPC CKD" disederhanakan.** Yang nyata: OutLayer keystore memperoleh master dari MPC CKD, lalu menurunkan kunci per pemanggil. Tidak ada panggilan CKD per pengguna dari kontrak broker. Tulis dengan kalimat itu.
- **Hanya satu tujuan (GitHub) dan satu jenis secret (token GitHub demo dengan scope repo sandbox).** API cloud lain dikeluarkan dari scope.
- **Penyaringan output** berupa penghapusan nilai pasti plus encoding umum. Ini bukan jaminan anti-bocor; agent jahat masih bisa meminta API mengembalikan data sensitif yang bukan secret itu sendiri.
- **Verifikasi attestation di aplikasi** cukup menampilkan hash WASM, `attestation_url`, dan tautan ke verifier OutLayer. Verifikasi quote TDX penuh di aplikasi sendiri tidak dibangun.
- **Persetujuan** memakai yield/resume dengan batas sekitar 2 menit. Mode tunggu lama tidak dibangun.
- **Deteksi PII NEAR AI** opsional. Kalau tidak sempat, hapus dari klaim.
- Semua di testnet (diizinkan, NEAR.md Q-010). Data dan repo demo diberi label demo.

## Cek compliance gate (NEAR.md)

- Waktu: semua kode di atas baru, ditulis setelah 19 Okt 2026, sesuai Q-001. Tidak ada konflik.
- Integrasi NEAR nyata: ada kontrak sendiri di testnet plus OutLayer, sesuai Q-002 dan Q-011.
- Testnet diizinkan (Q-010). Tidak ada secret di repo; token demo disimpan lewat OutLayer secrets, bukan di kode.
- Agent limits (poin 7): membuat akun, membayar, dan deploy belum dilakukan dan butuh konfirmasi Dien.
- Track fit dan originalitas belum dicek di catatan ini. Risiko originalitas terhadap OutLayer Connectors perlu keputusan Dien.
