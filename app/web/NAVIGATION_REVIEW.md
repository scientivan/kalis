# Navigasi aplikasi terkini

Audit 14 November 2026 berdasarkan shell.tsx, page.tsx dan browser tanpa login. Usulan lima tujuan dan Account rail pada laporan lama sudah digantikan. FRONTEND_GUIDE.md bagian terbaru tetap acuan persetujuan desain.

| Role | Parent | Child dan alamat |
|---|---|---|
| Consumer | Marketplace | Methods di /marketplace |
| Consumer | Jobs | Ongoing di /runs/ongoing, Results di /runs/results |
| Consumer | Data | Connections di /connections, Documents di /workspace/files, Notes di /workspace/memory |
| Author | Methods | Create di /marketplace/publish, Published di /marketplace/mine |
| Kedua role | Community | Fund di /community, Proposals di /community/proposals, Bounties di /community/bounties, Issues di /community/issues |
| Kedua role | Activity | History di /activity |
| Menu wallet | Account dan Sign out | Account di /account, sign-out action |

Consumer dan Author menyusun navigasi, bukan permission. Permissions tetap diverifikasi backend dan chain. Label Create teramati di kode/browser, sedangkan panduan sebelumnya menyebut Drafts. Perbedaan ini dicatat, bukan diasumsikan sebagai persetujuan pengguna baru.

Ongoing memuat outbound approvals. /approvals membuka permukaan Ongoing yang sama. /runs dan /workspace tetap alias Ongoing, /balance alias Account. Method detail dan tab di /marketplace/id/tab, expert di /experts/account, dan run di /runs/id. /connected serta fallback KalisApp mempertahankan permukaan lama, bukan navigasi utama.

Parent/child rail, ukuran, ekspansi dan perilaku responsif mengikuti FRONTEND_GUIDE.md. Audit ini tidak merancang ulang navigasi atau menghapus route. Browser tanpa login membuka seluruh 14 tujuan utama, bukan bukti izin atau transaksi akun.
