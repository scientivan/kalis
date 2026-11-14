# Domain dan hosting Kalis

Status 15 November 2026. Backend dan frontend sudah di-deploy. DNS di Cloudflare ditambahkan Dien sendiri. Ejaan domain memakai Kalis dengan K (`kalis.scientivan.dev`), menggantikan rencana lama `calis`.

| Host | Tujuan | Sumber |
|---|---|---|
| https://kalis.scientivan.dev | Landing (sementara redirect ke aplikasi) | Proyek Vercel `kalis`, `app/web` |
| https://app.kalis.scientivan.dev | Aplikasi | Proyek Vercel `kalis`, `app/web` |
| https://api.kalis.scientivan.dev | Backend API | VPS `tinjau-vps` (15.235.146.33) |

Domain apex `scientivan.dev` tidak dipasang ke proyek ini karena dipakai website utama Dien.

## Redirect landing sementara

Landing page belum dirancang. `app/web/src/proxy.ts` (proxy Next.js 16, dulu bernama middleware) mengalihkan semua permintaan dengan host `kalis.scientivan.dev` ke path yang sama di `https://app.kalis.scientivan.dev` dengan status 307. Status 307 dipilih supaya browser tidak menyimpan redirect secara permanen. Hapus atau ganti blok ini saat landing yang disetujui Dien dibangun.

## Frontend (Vercel)

Proyek Vercel `kalis` di tim `blacknwhite03s-projects`, framework Next.js, deploy dari folder `app/web` lewat CLI. Kedua domain terpasang dan sudah terverifikasi kepemilikannya, tanpa TXT.

Variabel server produksi `KALIS_BACKEND_URL=https://api.kalis.scientivan.dev` (tanpa slash penutup). Browser memanggil `/api/backend` di origin aplikasi, lalu proxy Next.js meneruskan ke backend. Jangan memakai prefix NEXT_PUBLIC untuk rahasia, dan jangan set `NEXT_PUBLIC_KALIS_PRIVATE_DEV` di produksi.

Redeploy frontend:

```bash
cd app/web && npm test && npm run build && vercel deploy --prod --yes
```

URL `*.vercel.app` dilindungi Vercel Deployment Protection (302 ke login). Gunakan `vercel curl <path> --deployment <url>` untuk mengeceknya.

## Backend (VPS)

VPS Ubuntu 26.04 yang juga menjalankan Tinjau dan SimpleArt. Kalis berdiri sendiri dan tidak mengubah layanan lain.

| Bagian | Lokasi |
|---|---|
| Kode | `/opt/kalis/app/backend` dan `/opt/kalis/app/methods` (milik user sistem `kalis`) |
| Data persisten | `/var/lib/kalis/data` (`KALIS_DATA_DIR`) |
| Env rahasia | `/etc/kalis/backend.env` (root, 600) |
| Service | `/etc/systemd/system/kalis-backend.service`, port 8790 |
| Reverse proxy | blok `api.kalis.scientivan.dev` di `/etc/caddy/Caddyfile` (cadangan `Caddyfile.before-kalis-20261115`) |

Caddy mengurus TLS otomatis (Let's Encrypt) setelah DNS mengarah ke VPS, jadi certbot tidak dipakai. Port 8790 tidak dibuka di UFW, hanya 80/443 yang publik. Node 24 dari sistem dan `pdftotext` (poppler-utils) terpasang.

Env produksi memakai `PORT=8790`, `PUBLIC_BASE=https://api.kalis.scientivan.dev`, `CORS_ORIGIN=https://app.kalis.scientivan.dev`, `KALIS_DATA_DIR=/var/lib/kalis/data`, ditambah rahasia dari `app/backend/.env` dan `Product/.env`. `KALIS_LOCAL_RUNNER` dan `KALIS_PRIVATE_LOCAL_RUNNER` sengaja tidak diset karena keduanya hanya untuk development.

Redeploy backend dari komputer Dien (data di VPS tidak ditimpa):

```bash
cd app
ssh tinjau-vps 'sudo chown -R ubuntu /opt/kalis/app'
rsync -az --delete --exclude node_modules --exclude .env --exclude data backend/ tinjau-vps:/opt/kalis/app/backend/
rsync -az --delete --exclude node_modules methods/ tinjau-vps:/opt/kalis/app/methods/
ssh tinjau-vps 'cd /opt/kalis/app/backend && sudo chown -R ubuntu /opt/kalis/app && npm ci --omit=dev && sudo chown -R kalis:kalis /opt/kalis && sudo systemctl restart kalis-backend'
```

Log: `ssh tinjau-vps 'sudo journalctl -u kalis-backend -f'`.

Saat `PRIVATE_RUNNER_HASH` di `app/backend/src/private-release.js` atau `app/web/src/lib/backend/private-release.js` berubah, redeploy backend dan frontend.

## DNS Cloudflare (semua DNS only)

| Tipe | Nama | Target |
|---|---|---|
| A | `api.kalis` | `15.235.146.33` |
| CNAME | `kalis` | `f75e3a34f78a66ed.vercel-dns-017.com` |
| CNAME | `app.kalis` | `f75e3a34f78a66ed.vercel-dns-017.com` |

## Verifikasi

Sudah: `curl localhost:8790/api/health` di VPS sehat, `/api/privacy/config` memberi `mode: tee`, `enabled: true`, runner hash `457e260c…`. Build Vercel produksi Ready, halaman `/` memberi 200 lewat `vercel curl`. Redirect host landing diuji lokal dengan `next start`.

Setelah DNS aktif: buka https://api.kalis.scientivan.dev/api/health, https://app.kalis.scientivan.dev/api/backend/api/health, https://app.kalis.scientivan.dev/marketplace, dan pastikan https://kalis.scientivan.dev mengalihkan ke aplikasi. Jangan menjalankan smoke berbayar tanpa otorisasi.
