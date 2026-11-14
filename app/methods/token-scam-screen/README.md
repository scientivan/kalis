# token-scam-screen

Stop your trading agent from buying a scam token. ALLOW, WARN or BLOCK for a token your agent wants to buy, with the evidence: failed sell simulation, taxes, owner powers, liquidity lock, holder concentration, your block list and injected instructions, plus the largest amount allowed.

- Track AI Security & Defense: Scam detection sebelum agent membeli token: honeypot (sell simulation gagal), pajak jual, kuasa owner, lock likuiditas, konsentrasi holder, block list pembeli, dan instruksi agent yang di-inject. Demo serangan (`fixtures/attack-input.json`, honeypot + 'ignore the safety screen') dijalankan di TEE dan di-BLOCK.
- Bentuk: WASM tanpa AI, versi aktif v1, runner `kalis-runner` build `823e9913…`. Konektor: tidak ada (input diketik atau ditempel; data sintetis di `fixtures/`).
- Penjual demo fiktif `yoga-prasetyo.scientivan.testnet`, harga 0,08 NEAR, DAO 10%. Pembeli uji `auth-test.scientivan.testnet` membayar dari wallet sendiri.
- Aturan penjual (bagian rahasia) ada di `app/guests/token-scam-screen/` (di-gitignore). Yang dipublikasi hanya `method.wasm`, blob tersegel di `sealed/`, dan manifest.
- Bukti testnet (daftar, publikasi, bayar, call OutLayer, settle, ulasan) di `evidence/testnet-runs.json`. Uji lokal `node app/kalis-runner/client/trading-methods-local-test.mjs`.
- Bukan nasihat keuangan, tanpa klaim profit, tidak menempatkan order.

## v2: aturan struktural dan pembacaan on-chain (15 Nov 2026)

- Daftar kata kunci diganti aturan struktural yang sama dengan `wallet-allowance-guard` v3 (klaim otoritas, permintaan override, teks tersembunyi zero-width, huruf mirip dari alfabet lain, base64/hex yang di-decode lalu dipindai ulang). Metode ini tetap tanpa AI.
- On-chain: dengan `onchain_request: {"token": <contract>}` di runner guard `scientivan.testnet/kalis-guard-runner` (build `57abddb0…`), runner membaca code hash, ukuran storage, daftar export WASM (dicari metode admin seperti mint, pause, blacklist, upgrade, set_owner), `ft_metadata` dan owner dari `rpc.testnet.near.org` di dalam TEE. Fakta chain menimpa fakta ketikan pembeli. Tanpa kode, tanpa `ft_transfer`, simbol beda, atau code hash berubah dari yang dipercaya menjadi BLOCK. Pajak, likuiditas dan sebaran holder tetap diketik (tidak ada di RPC NEAR).
- Versi market v2 oleh `yoga-prasetyo.scientivan.testnet`, tx `D5c8CiGiu3uL5vgVcmwedX6oHVwpZQoyazbiUmYn84tt`, kode `9e0f8a40…`, runner `823e9913…`. Manifest v1 disimpan sebagai `manifest-prev.json`. Belum ada run berbayar untuk v2. Detail di `docs-ai-security.md`.
