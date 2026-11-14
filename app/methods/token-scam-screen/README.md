# token-scam-screen

Stop your trading agent from buying a scam token. ALLOW, WARN or BLOCK for a token your agent wants to buy, with the evidence: failed sell simulation, taxes, owner powers, liquidity lock, holder concentration, your block list and injected instructions, plus the largest amount allowed.

- Track AI Security & Defense: Scam detection sebelum agent membeli token: honeypot (sell simulation gagal), pajak jual, kuasa owner, lock likuiditas, konsentrasi holder, block list pembeli, dan instruksi agent yang di-inject. Demo serangan (`fixtures/attack-input.json`, honeypot + 'ignore the safety screen') dijalankan di TEE dan di-BLOCK.
- Bentuk: WASM tanpa AI, versi aktif v1, runner `kalis-runner` build `823e9913…`. Konektor: tidak ada (input diketik atau ditempel; data sintetis di `fixtures/`).
- Penjual demo fiktif `yoga-prasetyo.scientivan.testnet`, harga 0,08 NEAR, DAO 10%. Pembeli uji `auth-test.scientivan.testnet` membayar dari wallet sendiri.
- Aturan penjual (bagian rahasia) ada di `app/guests/token-scam-screen/` (di-gitignore). Yang dipublikasi hanya `method.wasm`, blob tersegel di `sealed/`, dan manifest.
- Bukti testnet (daftar, publikasi, bayar, call OutLayer, settle, ulasan) di `evidence/testnet-runs.json`. Uji lokal `node app/kalis-runner/client/trading-methods-local-test.mjs`.
- Bukan nasihat keuangan, tanpa klaim profit, tidak menempatkan order.
