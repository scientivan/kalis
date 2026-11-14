# large-swap-split

Split a large token sale across venues within your slippage limit. A sandboxed sale plan your trading agent may run step by step: only on venues you approved, within the session budget and your slippage limit, with a minimum to receive per step, an ALLOW, WARN or BLOCK verdict and every blocked step.

- Track AI Security & Defense: Sandboxed execution plan: agent hanya boleh menjalankan langkah yang dikembalikan, di venue yang disetujui untuk sesi, dalam budget sesi, dengan minimum terima per langkah. Venue tak disetujui dan instruksi yang di-inject menjadi blocked step / BLOCK.
- Bentuk: WASM tanpa AI, versi aktif v2, runner `kalis-runner` build `823e9913…`. Konektor: tidak ada (input diketik atau ditempel; data sintetis di `fixtures/`).
- Penjual demo fiktif `dewi-anggraini.scientivan.testnet`, harga 0,08 NEAR, DAO 10%. Pembeli uji `auth-test.scientivan.testnet` membayar dari wallet sendiri.
- Aturan penjual (bagian rahasia) ada di `app/guests/large-swap-split/` (di-gitignore). Yang dipublikasi hanya `method.wasm`, blob tersegel di `sealed/`, dan manifest (v1 disimpan sebagai `manifest-v1.json`).
- Bukti testnet (daftar, publikasi, bayar, call OutLayer, settle, ulasan) di `evidence/testnet-runs.json`. Uji lokal `node app/kalis-runner/client/trading-methods-local-test.mjs`.
- Bukan nasihat keuangan, tanpa klaim profit, tidak menempatkan order.
