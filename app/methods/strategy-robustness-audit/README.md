# strategy-robustness-audit

Find out if your trading strategy survives fees and new data. A robust, fragile or not-enough-data verdict for your strategy, from your own trade history, with every check behind it: unseen-period results, costs, drawdown, nearby settings and dependence on a few lucky trades.

- Track AI Security & Defense: Bukan metode keamanan agent. Audit ketahanan strategi (v1, dibuat sebelum reframing) dan tetap live sebagai metode Web3 trading consulting.
- Bentuk: WASM tanpa AI, versi aktif v1, runner `kalis-runner` build `823e9913…`. Konektor: tidak ada (input diketik atau ditempel; data sintetis di `fixtures/`).
- Penjual demo fiktif `nadia-rahman.scientivan.testnet`, harga 0,08 NEAR, DAO 10%. Pembeli uji `auth-test.scientivan.testnet` membayar dari wallet sendiri.
- Aturan penjual (bagian rahasia) ada di `app/guests/strategy-robustness-audit/` (di-gitignore). Yang dipublikasi hanya `method.wasm`, blob tersegel di `sealed/`, dan manifest.
- Bukti testnet (daftar, publikasi, bayar, call OutLayer, settle, ulasan) di `evidence/testnet-runs.json`. Uji lokal `node app/kalis-runner/client/trading-methods-local-test.mjs`.
- Bukan nasihat keuangan, tanpa klaim profit, tidak menempatkan order.
