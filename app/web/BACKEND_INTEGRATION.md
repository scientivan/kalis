# Integrasi backend terkini

Diperbarui 14 November 2026. Route utama Next.js memakai backend. Catatan awal /connected-only dan mock-only sudah historis.

## Menjalankan lokal

Mulai backend dari app/backend dengan npm ci lalu npm start. Mulai frontend dari app/web dengan npm ci lalu npm run dev. Port default Next.js adalah 3000 dan backend 8787. Override frontend port melalui npm run dev -- --port 3311 jika diperlukan. Atur KALIS_BACKEND_URL pada server frontend jika backend berbeda origin. Restart server setelah mengubah environment. Detail lengkap di ../../README.md dan DEPLOYMENT.md.

Browser memakai /api/backend/api/... pada origin frontend. Proxy menerapkan allowlist endpoint dan pemeriksaan Origin untuk mutasi, meneruskan bearer session serta workspace yang valid, dan tidak meneruskan cookie browser. API.md dan kode backend adalah kontrak teknis, bukan bukti bahwa setiap alur sudah diuji dari browser.

## Modul yang terhubung

run-page.tsx menyediakan draft/consent/quote, pembayaran mock testnet atau wallet, async execution, pemeriksaan bukti dan hasil lokal, settlement, reclaim dan review. data-tools.tsx menyediakan sumber input, mock connections, dokumen dan memory. seller-editor.tsx menyediakan manifest, sealed artifact, validasi dan publication. community-workspace.tsx menyediakan issue sampai proposal, bounty, kontribusi, private test, review serta unsigned payout/publication. account-tools.tsx menyediakan profil, preferensi dan history.

GET capabilities membedakan enabled, demo, read_only dan unavailable. Tidak ada saldo kustodian. Model proprietary belum didukung. Call unsigned harus ditandatangani akun yang tepat dan status dibaca kembali dari chain.

## Privasi dan persistence

Modul crypto.js, checks.js dan file-import.js di browser identik byte per byte dengan backend pada audit. Sealing dan answer opening dilakukan pada browser, answer key hanya di memori tab.

Batas penting ada pada run-page.tsx pay. Nilai field private juga dikirim plaintext ke protections/private-values untuk outbound detection dan disimpan backend. Jadi jalur UI keseluruhan belum memenuhi janji bahwa operator hanya melihat ciphertext. Lima protections, dokumen, notes dan connector berjalan di backend biasa. Tidak mengubah implementasi ini dalam tugas sinkronisasi.

Private test case disegel di browser dan hanya dievaluasi runner, grant terpisah dari izin menjalankan metode. Tidak menyamakan evaluator baseline/candidate dengan penilaian kualitas metode di dunia nyata.

## Bukti

Audit GET health/capabilities/config/methods/community config/dao/issues/proposals/bounties berhasil. Browser tanpa login membuka 14 halaman, dan proxy health memberi HTTP 200. Snapshot ada di ../../audit/2026-11-14-doc-sync/. Build dan 31 tes frontend sesi yang sama lulus sebelum perubahan dokumentasi.

Bukti pembayaran dan DAO testnet historis ada di BUILD_STATUS.md 6.11–6.18. Laporan Chrome oleh Claude dan run portofolio oleh Dien tetap diberi atribusi. Audit ini tidak sign in, membuat data, memanggil AI berbayar, menandatangani transaksi, settle atau deploy. Full authenticated browser E2E belum dibuktikan ulang.
