# perp-risk-limit-fit

Let a trading agent place orders only inside your spending and risk policy. ALLOW, WARN or BLOCK for every order your trading agent proposes, checked against your per-trade and daily caps, approved venues and assets, leverage and liquidation buffer, with the reason for each block. Withdrawals and prompt-injected orders are always blocked.

- Track AI Security & Defense: Policy engine dan spending limit untuk agent trading: per-trade cap, daily cap, venue/aset yang disetujui, leverage dan buffer likuidasi. Withdraw/transfer dan order hasil prompt injection selalu BLOCK. Agent tidak memegang kunci; signer hanya boleh meneruskan ALLOW, dan WARN setelah persetujuan pemilik.
- Bentuk: WASM tanpa AI, versi aktif v2, runner `kalis-runner` build `823e9913…`. Konektor: tidak ada (input diketik atau ditempel; data sintetis di `fixtures/`).
- Penjual demo fiktif `rizky-saputra.scientivan.testnet`, harga 0,08 NEAR, DAO 10%. Pembeli uji `auth-test.scientivan.testnet` membayar dari wallet sendiri.
- Aturan penjual (bagian rahasia) ada di `app/guests/perp-risk-limit-fit/` (di-gitignore). Yang dipublikasi hanya `method.wasm`, blob tersegel di `sealed/`, dan manifest (v1 disimpan sebagai `manifest-v1.json`).
- Bukti testnet (daftar, publikasi, bayar, call OutLayer, settle, ulasan) di `evidence/testnet-runs.json`. Uji lokal `node app/kalis-runner/client/trading-methods-local-test.mjs`.
- Bukan nasihat keuangan, tanpa klaim profit, tidak menempatkan order.
