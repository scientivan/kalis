# Gap frontend dan bukti yang masih diperlukan

Diperbarui 14 November 2026 dari source, API lokal dan 14 halaman browser tanpa login. Daftar gap lama yang menganggap editor, wallet request, async execution atau community writes belum ada sudah digantikan. Cakupan saat ini ada di COVERAGE.md dan ../../CURRENT_STATE.md.

| Gap | Bukti | Tindak lanjut yang belum dilakukan |
|---|---|---|
| Privasi terhadap operator | run-page.tsx pay mengirim field private ke protections/private-values, outbound.js menyimpan values | Selaraskan implementasi dengan keputusan privasi. Jangan mengklaim seluruh buyer flow ciphertext-only |
| Bukti browser berotorisasi | UI signing tersedia, audit ini tanpa login | Verifikasi login, wallet payment, publikasi, proposal/bond/vote/claim/payout dengan otorisasi transaksi tersendiri |
| Bounty legacy | Tiga record yang teramati tanpa evaluator lokal | Jangan presentasikan sebagai alur kontribusi privat siap jalan. Tentukan migrasi atau skenario baru secara terpisah |
| Reviewer yang ditunjuk | Form menetapkan reviewer, backend menerima council selain kontributor | Putuskan apakah reviewer eksklusif atau council mana pun yang memenuhi syarat, lalu selaraskan kode dan copy |
| Policy revoke selama test | Kode menahan hasil setelah revoke, keputusan sebelumnya usulan | Minta keputusan produk sebelum menyebutnya policy disetujui |
| Penyimpanan dan restart | Decryption key hanya dalam memori tab, JSON persistence backend | Buktikan recovery yang dibutuhkan. Server tidak dapat mengembalikan kunci jawaban |
| Mobile dan aksesibilitas | Audit 14 halaman hanya viewport browser default | Audit mobile, keyboard/focus dan dialog wallet secara khusus |
| Bukti per versi | Data aktif sembilan metode, receipt historis tidak seluruhnya versi terbaru | Pertahankan receipt per versi. Jangan menganggap catalog presence bukti run berbayar |
| Klaim mutu dan rating | Seed review testnet dan verdict/checks tersedia | Jangan memakai rating demo atau safe sebagai bukti pelanggan, kualitas atau profit |

Trial, licensing, royalti, sengketa mutu dan pemeringkatan pengklaim tetap keputusan terbuka. Proprietary AI, fiat nyata dan saldo kustodian tidak tersedia. Catatan hasil Claude dan laporan pengguna tetap bukti teratribusi, bukan pengujian ulang Codex.

Pekerjaan yang diminta sekarang hanya sinkronisasi dokumen. Tidak ada perbaikan fitur, transaksi atau deployment dilakukan. Setelah itu pembahasan inovasi Social Money dimulai dari mekanisme yang sudah tersedia.
