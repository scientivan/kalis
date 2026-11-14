> Historical artifact or handoff, retained for context. Synchronized 14 November 2026. Implementation status and earlier missing-feature claims in this file are not the current product state. Read [../../CURRENT_STATE.md](../../CURRENT_STATE.md) and [../../FRONTEND_GUIDE.md](../../FRONTEND_GUIDE.md) first. Preserve the original evidence and proposals below without interpreting them as new approval.

# Kebutuhan backend untuk melengkapi integrasi Kalis

Disusun Codex, 14 November 2026, atas permintaan Dien untuk dikerjakan Claude. Ini handoff implementasi, bukan laporan endpoint sudah dibangun. Nama endpoint dan bentuk payload baru di bawah adalah usulan kontrak integrasi. Kebijakan yang belum diputuskan tetap terbuka.

## Mulai dari kondisi yang benar

Frontend produksi ada di `app/web`, Next.js App Router. Route normal kini memakai backend mode. Mock demo terpisah dan tidak menjadi sumber data backend. Pemetaan terbaru ada di `app/web/COVERAGE.md`. Backend tetap milik Claude di `app/backend`.

Baca `AGENTS.md`, `../NEAR.md`, `BUILD_STATUS.md`, `RANCANGAN_PRODUK.md` bagian 0, 3, 7–9, 21, 23, 44–56, laporan eksekusi dan escrow yang nomornya berulang, serta kedua bagian 65. Cocokkan lagi dengan `app/backend/API.md` dan kode aktual sebelum membangun, karena ada pekerjaan paralel.

Sudah tersedia dan tidak perlu dibuat ulang adalah config, registry reads, version/manifest reads, run creation, execute, settle, DAO reads dan lima protection APIs. Formulir utama sudah memanggil Memory, Credentials, Documents, Browser, Outbound dan Audit. Wallet payment sudah dapat menghasilkan unsigned contract call dari `POST /api/runs`, tetapi koneksi wallet dan signing UI belum dibuat. Ini tugas frontend/integrasi, bukan bukti backend wallet API tidak ada.

Kontrak market juga sudah memiliki `register_method`, `publish_version` dan `refund_expired`. Utamakan adapter terhadap fungsi tersebut, bukan kontrak pengganti. Dana bersama tetap Sputnik DAO. Jangan membangun multisig baru atau memakai NFT.

Jenis metode harus mengikuti manifest terbaru. Portofolio adalah WASM tanpa AI, tender direncanakan WASM yang memakai AI, salary-counteroffer adalah prompt privat. Prompt wajib menampilkan risiko bocor dan verdict paling tinggi attention. Jalur proprietary masih belum didukung runner, sehingga manifest/quote harus jujur tentang runnable capability.

## Hasil yang diminta dari Claude

Implementasikan bagian yang sudah mempunyai dasar keputusan, dengan penyimpanan tahan restart, kontrak API terdokumentasi dan tes. Jangan mengubah frontend pada tugas ini. Usulan teknis dapat disesuaikan, tetapi catat bentuk final di API.md agar Codex menyambungkan UI tanpa menebak.

Untuk keputusan terbuka, sediakan status/capability yang eksplisit dan tandai blocked-by-product-decision. Jangan membuat kebijakan trial, royalti, lisensi, sengketa mutu, gateway fiat nyata atau kewenangan DAO baru secara sepihak.

Pengembangan dan unit/integration tests lokal diizinkan dalam lingkup tugas. Signing, spending, deployment kontrak, mainnet, push dan publikasi mengikuti konfirmasi eksplisit yang berlaku di sesi Claude. Dokumen ini tidak memberikan otorisasi baru untuk tindakan tersebut.

## Aturan lintas endpoint

| Kebutuhan | Kontrak yang diperlukan |
| --- | --- |
| Identitas | `X-Kalis-Workspace` saat ini hanya identitas demo yang dapat dipilih caller. Jangan menjadikannya bukti kepemilikan, pembelian, voting atau hak menerima bounty |
| Otorisasi | Resource privat diikat ke principal yang diverifikasi, atau diberi label demo dengan batas akses eksplisit. Server memeriksa hak, bukan mempercayai `owner`, `role`, `approved_by` atau `reviewer` dari body |
| Penandatanganan | Untuk operasi milik pengguna, kembalikan contract_call unsigned atau gunakan mekanisme delegasi yang memang telah disetujui. Jangan diam-diam memakai key platform sebagai penjual/pembeli sembarang |
| Nilai finansial | Gunakan integer string dalam unit terkecil, beserta asset, decimals dan network. Jangan mencampur mock USD dengan NEAR. Timestamp nanosecond juga string |
| Retry | Mutasi finansial/publikasi/payout memakai idempotency key. Key sama + payload sama mengembalikan operasi yang sama. Key sama + payload berbeda ditolak |
| Operasi lama | Balas operation_id dan status bila proses panjang. GET status dapat dipoll setelah refresh. Tidak bergantung pada satu request browser yang hidup terus |
| Error | Pertahankan `{error:{code,message}}`, tambah details yang aman bila diperlukan. Bedakan validation, forbidden, conflict, insufficient funds, not configured dan outcome unknown |
| Daftar | Pagination stabil berbasis cursor, filter dan urutan terdokumentasi. Jangan mengandalkan localStorage sebagai daftar run atau transaksi |
| Privasi | Tidak menyimpan plaintext input, keluaran, seller prompt/kode privat atau session decryption secret pada log/chain. Artifact privat disegel sebelum keluar perangkat pemilik |
| Capability | Server menyatakan fitur enabled/read-only/unavailable beserta alasan. Frontend tidak perlu mengarang keadaan kosong yang menyembunyikan fungsi belum ada |

Usulan identitas awal adalah challenge sekali pakai dengan expiry dan verifikasi kepemilikan akun, lalu session aman. Pemilihan email/wallet/provider belum diputuskan. Kebutuhan verified identity untuk write tetap wajib untuk klaim akses produksi. Demo-only principal boleh dipertahankan bila dilabeli jelas.

## A. Prioritas pertama, kelengkapan alur pembeli yang sudah ada

| Endpoint usulan | Input utama | Respons minimum | Alasan frontend |
| --- | --- | --- | --- |
| `GET /api/capabilities` atau tambahan config | Tidak ada | network, capabilities, auth_mode, payment_modes, supported method kinds, unavailable reasons | Menampilkan fitur yang benar-benar dapat dipakai |
| `GET /api/me` | Session/principal | id, display_name, linked accounts, permissions, demo flag | Account dan ownership tanpa menebak nama tampilan |
| `PATCH /api/me` | display_name dan profil publik yang diizinkan | Profil tersimpan | Perubahan akun tidak hanya di browser |
| `GET /api/runs` | cursor, limit, status, method_id | items milik caller, next_cursor | Workspace, daftar pekerjaan dan pemulihan setelah reload |
| `POST /api/run-drafts` | method_id, version, data reference/hash, model selection bila didukung, izin dan nama pekerjaan | draft_id, revision, version snapshot, state | Menyimpan metadata pekerjaan tanpa mengirim plaintext input |
| `PATCH /api/run-drafts/:id` | expected_revision + metadata yang berubah | revision baru, consent invalidated bila terms berubah | Input/izin/harga yang berubah perlu persetujuan ulang |
| `POST /api/run-drafts/:id/quote` | expected_revision dan ukuran/input metadata yang aman | quote_id, expiry, method price, storage deposit, infra fee, gas estimate/bound jika ada, total/max dan allocation_base | Checkout memakai biaya yang dapat dijelaskan |
| `POST /api/runs` perluasan kompatibel | idempotency_key, quote_id/revision bila dipakai, data_ct_sha256, payment, method_id/version | run_id yang stabil, payment operation, status/contract_call/tx | Request payment timeout tidak membuat pembayaran kedua |
| `GET /api/operations/:id` atau pencarian idempotency | Principal dan operation/key | pending/succeeded/failed/unknown, run_id, tx jika diketahui | Recovery sebelum retry pembayaran |
| `GET /api/runs/:id/events` atau progress field | run_id | phase, timestamps, retryable, error, execution/settlement refs | Status antrean, executing, completed, failed dan settling |
| `POST /api/runs/:id/reclaim` | Explicit caller action, idempotency key | refundable, deadline, unsigned call atau tx/status | UI timeout harus memakai `refund_expired`, bukan simulasi clock |

Draft/quote adalah usulan cara menautkan data. Bila backend memilih struktur lebih sederhana, pertahankan kebutuhan immutable paid snapshot, persetujuan terikat revision dan recovery pembayaran. Jangan mengubah endpoint lama secara breaking tanpa compatibility window.

Quote harus menjelaskan deposit storage 0.01 NEAR yang saat ini ditambahkan server dan bagaimana excess dikembalikan. Bedakan itu dari harga metode, gas dan tagihan infrastruktur. Dasar pembagian persentase masih perlu diselaraskan dengan keputusan serta implementasi kontrak. Jangan menagih satu komponen dua kali.

Run detail perlu memuat method_id, paid version, buyer, status, amount/asset, payment tx, expiry/deadline, completion/settlement refs serta kegagalan yang aman ditampilkan. Jangan mengembalikan decryption secret. Refresh tidak bisa membuka jawaban tanpa key lokal, dan harus dinyatakan sebagai batas bila key recovery belum dirancang.

Kriteria penerimaan A. Retry request yang sama tidak membayar ulang. Payload berbeda dengan idempotency key yang sama ditolak. Daftar tidak membuka run privat principal lain. Draft berubah menghapus consent lama. Run yang sudah Paid tidak berubah versi. Reclaim hanya setelah deadline dan sekali saja. Seluruh sukses/gagal/no-solution mengikuti aturan escrow tahap, bukan rating hasil atau klaim cek lokal pembeli.

## B. Penjual, publikasi dan metadata Marketplace

| Endpoint usulan | Input utama | Respons minimum |
| --- | --- | --- |
| `GET /api/creators/:id` | Creator identifier | Profil publik yang sah, metode, attribution refs |
| `GET /api/me/methods` | cursor, state | Listing dan draft yang benar-benar dimiliki principal |
| `POST /api/method-drafts` | title, description, category, cover reference, kind | draft_id, revision, validation status |
| `PATCH /api/method-drafts/:id` | expected_revision, input/output/limits, price/asset, DAO share, manifest | Draft dan buyer-visible preview |
| `POST /api/method-drafts/:id/artifact` | Sealed WASM atau sealed prompt, code hash, metadata ukuran/type | artifact reference, ciphertext hash, validation result |
| `POST /api/method-drafts/:id/validate` | draft revision | Per-field errors, supported capability, manifest_hash, kind, buyer_note, runnable status |
| `POST /api/method-drafts/:id/publish` | expected_revision, parent/version, idempotency_key | Unsigned contract call atau authorized publication operation, kemudian method/version/tx refs |
| `GET /api/methods/:id/versions/:n/evidence` | Version | Dataset synthetic/protocol reference, metrics, test date, scope/limitations dan verifier provenance |

Gunakan `register_method` dan `publish_version` yang sudah tersedia. Simpan deskripsi, kategori dan cover sebagai metadata publik off-chain bila kontrak tidak membutuhkannya, dengan binding versi yang jelas. Jangan mengubah price unit dan ownership dari display name saja.

Manifest mencakup jenis metode, AI allowlist, konektor/operasi, format dokumen, tujuan outbound, akses memori, domain/aksi browser, nama parameter rahasia tanpa nilainya, steps, buyer-checkable rules, parent dan kontribusi. Validasi kemampuan runner aktual. Manifest yang meminta fitur belum didukung tidak boleh dilabeli runnable.

Untuk prompt, API config menyediakan seller_prompt_warning. Form seller mengirim acceptance terhadap versi warning. Tidak menerima raw prompt melalui upload publik, dan tidak menyimpan secret di log. Metode prompt tetap memiliki risiko paraphrase leakage dan jawaban tidak deterministik. Bukti uji dipisahkan dari rating.

Kriteria penerimaan B. Bukan pemilik tidak dapat mengedit/publish. Draft incomplete tidak dapat terbit. Harga, DAO share minimum dan platform share ditolak bila invalid. Publish retry tidak membuat versi ganda. Registry hash cocok dengan artifact/manifest. Versi lama dan parent tetap dapat dibaca. Prompt leakage warning dan kind muncul dari data backend.

## C. Rating dan ulasan pengguna

Rating wajib terlihat menurut keputusan Dien. Mekanisme agregasi dan eligibility rinci belum final. API harus membedakan ulasan pengguna dari benchmark dan tidak membuka input/hasil privat untuk membuktikan review.

| Endpoint usulan | Input utama | Respons minimum |
| --- | --- | --- |
| `GET /api/methods/:id/reviews` | cursor, version, sort | items berisi review_id, author public label, rating, comment, version, created_at, purchase_verified |
| `GET /api/methods/:id/rating-summary` atau field pada listing | Optional version | count, average atau null, star distribution, scope versi |
| `GET /api/runs/:id/review-eligibility` | Caller identity | eligible, reason, existing_review_id, version |
| `POST /api/methods/:id/reviews` | run_id, rating, comment, privacy acknowledgment, idempotency key | Review tersimpan dan summary terkini |

Usulan awal eligibility adalah pembeli dari run yang telah dieksekusi. Penanganan run gagal/refunded, satu review per run atau per pembeli-versi, edit/hapus dan moderation perlu diputuskan, bukan diasumsikan dari mock reducer. Backend menyatakan reason sehingga frontend tidak menebak. Jangan menetapkan hanya review positif atau hanya hasil yang dinilai aman boleh masuk tanpa keputusan. Jangan membahas ulang kelemahan rating yang pengguna sudah keluarkan dari ruang diskusi.

Kriteria penerimaan C. Rating 1–5 tervalidasi. Orang tidak dapat mereview run orang lain. Ulasan terikat versi yang benar. Retry tidak menggandakan ulasan. Listing dan detail memakai summary yang sama. Nol ulasan menghasilkan null average, bukan 0/5 atau angka buatan. Komentar tidak otomatis menyertakan input atau hasil.

## D. Community, dana, bounty dan kontribusi

`GET /api/dao` sudah ada. Perlu resource aplikasi dan adapter write ke Sputnik DAO yang ada. Hak anggota, reviewer, kuorum dan aturan acceptance aktual harus dibaca dari policy/keputusan yang sah. Tanda `approved:true` atau nama reviewer pada request tidak menciptakan kewenangan.

| Endpoint usulan | Data dan transisi |
| --- | --- |
| `GET/POST /api/issues`, `GET /api/issues/:id` | method/version/module, problem, expected behavior, synthetic reproduction, owner. Open → proposed/funded/closed dengan alasan |
| `GET/POST /api/proposals`, `GET /api/proposals/:id` | issue reference, budget/asset, module, fixed acceptance criteria, evaluator, reviewer, deadline, DAO proposal_id |
| `POST /api/proposals/:id/vote` | Vote intent dan unsigned contract call. Status akhir dibaca ulang dari chain, bukan optimistic approval |
| `GET/POST /api/bounties`, `GET /api/bounties/:id` | proposal dan dana approved/reserved, base version, editable scope, criteria/evaluator refs, budget, deadline, reviewer |
| `POST /api/bounties/:id/contributions`, `GET /api/contributions/:id` | candidate artifact, patch, description/impact, regression cases dan author binding |
| `POST /api/contributions/:id/tests`, `GET /api/test-runs/:id` | Immutable evaluator/base/candidate, optional private grant, output/attempt budget. pending → running → passed/failed/error |
| `POST /api/contributions/:id/reviews` | Authorized accept/reject/request_changes dengan reason dan immutable test-report references |
| `POST /api/bounties/:id/payout` | Accepted candidate, approved budget, unsigned call/operation. Sekali per acceptance yang sah |
| `POST /api/contributions/:id/publish-version` atau bagian workflow payout | New method version, parent, contributors, hashes dan payout refs. Bisa retry tanpa pembayaran atau versi ganda |

Rangkaian yang perlu dapat dinavigasi adalah issue → approved budget → bounty → contribution → independent test → review → payout → published version. Setiap response membawa ID hubungan dan allowed_actions. Jangan memaksa urutan payout/publish baru bila backend memilih transaksi terpisah, tetapi tampilkan partial failure dan recovery dengan tepat.

Candidate tidak boleh mengganti evaluator, kriteria atau kasus penentu pembayaran. Report menunjukkan baseline/candidate, per-check status, sebelum/sesudah dan scope kasus yang diizinkan. Review tidak dilakukan oleh kandidat terhadap dirinya sendiri tanpa otoritas yang memang disepakati. Payout tidak sama dengan royalti atau hak kepemilikan metode.

Aturan claimer bersaing, sengketa, reviewer, kuorum dan deadline yang belum final wajib menjadi configuration/precondition yang terlihat. Jangan membuka bounty berbayar dengan syarat acceptance yang belum ditetapkan. Bila belum disepakati, balas capability unavailable dengan alasan dan simpan proposal draft saja.

Kriteria penerimaan D. Dana pribadi, treasury dan pendapatan platform terpisah. Approval budget mereservasi sekali. Bounty tanpa anggaran tidak terbuka. Candidate gagal tidak bisa dipay. Revisi kandidat mengharuskan tes dan review baru. Orang tidak berwenang tidak bisa vote/accept/payout. Retry payout maupun publish tidak duplikat. Semua hubungan versi/contributor dapat ditelusuri.

## E. Kasus uji privat dan izin terpisah

| Endpoint usulan | Kontrak minimum |
| --- | --- |
| `POST /api/private-test-cases` | Owner, method/version association, sealed case reference dan izin penggunaan awal. Bukan plaintext |
| `GET /api/private-test-cases` | Hanya metadata kasus milik caller, tanpa data mentah |
| `POST /api/private-test-cases/:id/grants` | Candidate/scope, purpose testing, allowed output fields, attempt limit, expiry, explicit separate consent |
| `GET /api/test-grants` | Owner, case, scope, usage counter, expiry dan status |
| `POST /api/test-grants/:id/revoke` | Idempotent revocation dan kebijakan untuk tes yang sudah berjalan |

Ordinary run tidak memberi izin shared testing atau training. Candidate hanya mendapat informasi masalah yang diizinkan dan contoh sintetis. Pemberian akses ke inti metode privat tidak otomatis terjadi melalui bounty. Tentukan trust boundary key release, evaluator dan output control sebelum menyebut pengujian privat terpenuhi.

Kriteria penerimaan E. Grant hanya oleh pemilik. Salah candidate/method, revoked, expired atau exhausted ditolak. Attempt counter atomik untuk request paralel. Report tidak membuka dokumen mentah, arbitrary logs atau keluaran yang melampaui scope. Retensi/penghapusan dan efek revoke pada tes in-flight perlu keputusan eksplisit.

## F. Keuangan, riwayat dan Activity

| Endpoint usulan | Data minimum |
| --- | --- |
| `GET /api/me/transactions` | Payment, escrow hold, release, stage refund, timeout reclaim, bounty; amount/asset/network, run/proposal refs, tx_url, status dan timestamp |
| `GET /api/me/earnings` | Seller allocation dan bounty income terpisah, actual paid/pending dan periode, source refs |
| `GET /api/me/balance` bila ada ledger | Available/reserved/settled dengan asset dan definisi kustodi yang jelas. Jangan mengarang fiat balance dari saldo akun testnet |
| `GET /api/activity` | Events lintas run, protection, contributions, reviews, DAO dan payment dengan resource ID, actor, status, occurred_at dan safe summary |

GET protection audit sudah ada dan tetap dipakai. Activity aplikasi tidak boleh membuka data privat atau token. Backend mengembalikan resource type dan ID, frontend menentukan tautan. Transaksi on-chain dipisahkan dari mock fiat top-up. Tidak diminta gateway kartu/QRIS nyata pada tugas ini.

Kriteria penerimaan F. Rekonsiliasi ledger cocok dengan run/receipt/chain. Tidak menghitung alokasi DAO sebagai keuntungan platform. Income bounty tidak dihitung dua kali. Riwayat dan pagination konsisten setelah restart. Tidak ada selisih karena floating point.

## G. Batas yang bukan sekadar endpoint kurang

| Bagian | Pekerjaan yang sebenarnya |
| --- | --- |
| Wallet signing | Backend sudah menyiapkan contract_call. Frontend masih perlu wallet adapter, network/account check, confirmation dan finality handling |
| Refresh decryption key | Keputusan client-side key custody/recovery, bukan mengirim secret ke backend. Tetap jelaskan key hilang jika belum ada desain recovery |
| Upload privat | API dokumen sekarang menerima plaintext base64 melalui operator. Menambah endpoint upload saja tidak menghasilkan privasi dari operator. Butuh protokol enkripsi dan pemrosesan/key release yang disepakati |
| Auth | Backend perlu principal/session yang dapat dipercaya. Provider login belum dipilih. Demo identity tidak setara login |
| Proprietary model | Konfigurasi lama boleh mengizinkan, tetapi runner aktual belum mendukung. Jangan menawarkan sebagai runnable sebelum path consent/redaction/enforcement dibangun |
| Trezu | DAO testnet sudah ada. Tampilan Trezu mainnet bukan alasan untuk deploy mainnet tanpa persetujuan |
| Trial, lisensi, royalti, sengketa kualitas | Masih keputusan terbuka. Tidak diminta ditetapkan atau dijanjikan di sini |
| Refund | Refund tahap gagal dan reclaim timeout sudah disepakati. Jangan ikut menundanya hanya karena sengketa kualitas belum dirancang |

## H. Tambahan setelah penelusuran ulang rancangan

Bagian ini melengkapi A–G setelah membaca ulang bagian 3, 9, 11, 21, 30, 49–52 dan keputusan terbaru 65/65.1. Ini bukan daftar endpoint yang semuanya harus dibuat terpisah. Perluasan response atau fungsi internal dapat memenuhi kebutuhan tanpa membuat layanan publik tambahan.

### H1. Kontrak input, output dan cek pembeli per versi

Dasar adalah bagian 5, 42, 49, 52, laporan 55 dan 65.1. Handoff sebelumnya menyebut input dan evidence, tetapi belum menetapkan bagaimana frontend mendapatkan field yang benar untuk setiap metode. Memakai form portofolio untuk metode prompt atau tender tidak cukup.

Usulan adalah menambah `input_schema`, `output_schema`, `schema_version`, batas ukuran/unit, dan `buyer_checks` pada manifest/version response. Alternatifnya `GET /api/methods/:id/versions/:n/input-schema` dan `…/output-schema`. Definisikan required fields, unit, enum, array lengths serta nama field privat tanpa menyertakan contoh data pengguna nyata. Beri `sample_input` sintetis berlabel atau reference, bukan data pelanggan.

`buyer_checks` perlu mencantumkan id, deskripsi, scope dan checker version yang dapat diverifikasi klien. Server tidak boleh menganggap hasil cek lokal yang dikirim pembeli sebagai bukti escrow. Jangan menjalankan kode JavaScript arbitrer dari penjual di browser hanya karena manifest menamainya checker. Gunakan checker platform yang diketahui atau mekanisme sandbox yang benar-benar disepakati.

Kriteria penerimaan. Versi berbeda dapat mempunyai schema berbeda. Salah bentuk input ditolak sebelum pembayaran sejauh dapat divalidasi tanpa membocorkan input. Invalid input tidak membuat run dibayar atau charge ulang. Checker mendukung tiga keadaan per aturan, yaitu pass, fail dan cannot-check. Tidak adanya checker terlihat jelas dan tidak disamakan dengan pass. Cek biaya minimum/kemungkinan menang tidak diklaim bila tidak dapat dibuktikan.

### H2. Alur tender nyata sebagai metode, bukan hanya API proteksi terpisah

Keputusan baru bagian 65.1 belum terinci pada handoff sebelumnya. Tender harus menjadi WASM yang dapat memanggil AI privat untuk ekstraksi/penjelasan, sementara perhitungan harga dilakukan kode penjual. Adanya browser, OCR dan memory routes saja belum membuktikan metode tender dapat dijalankan.

Tidak perlu membuat `/api/tender` khusus bila jalur generik `methods → quote → runs → execute` dapat melayaninya. Backend perlu menyediakan versi tender yang benar-benar runnable, manifest final, input schema, artifact tersegel, status tahap, bukti setiap panggilan AI, serta fixture sintetis untuk pengujian. Referensi dokumen, hasil ekstraksi yang ditinjau pembeli, memori yang diizinkan dan konteks browser harus terikat run yang sama.

Input mencakup harga pokok, margin minimum, HPS, kategori, riwayat relevan, waktu kirim, garansi serta persyaratan dokumen sesuai schema final. Pengetahuan rahasia penjual tentang penetapan harga tidak dikirim ke form pembeli. Output mencakup harga usulan, alasan, syarat wajib, checklist dan status infeasible bila batas tidak dapat dipenuhi.

Perlu checker perangkat untuk batas harga pokok × (1 + margin minimum), HPS, persentase jaminan yang memang dinyatakan dokumen, checklist dokumen dan batas waktu kirim. Tidak mengklaim harga paling mungkin menang. Detail tempat dokumen dibaca masih dibahas. Jangan memilih jalur plaintext operator sebagai keputusan privasi final. Peringatan regulasi dalam 65.1 memuat catatan verifikasi yang belum selesai, sehingga bukan kewajiban menanam aturan hukum final pada kode.

Kriteria penerimaan. Tender berjalan melalui runtime yang sama dan bukan fixture response. AI yang tidak terattestasi atau di luar manifest ditolak. Tahap ekstraksi gagal tidak menghasilkan bid yang tampak selesai. Harga dan aturan pembeli dapat dihitung ulang tanpa membuka formula privat penjual. Dokumen tidak lengkap dan kombinasi batas yang infeasible menghasilkan alasan yang terlihat. Pengiriman bid tetap merupakan aksi outbound yang ditinjau terpisah.

### H3. Pemilihan model, preflight kemampuan dan biaya pemakaian

Dasar bagian 30, 49, 52 dan 65. Backend kini mempunyai method kind dan model di manifest, tetapi belum menyediakan negosiasi pilihan pembeli per run atau perbandingan kemampuan yang bisa dipakai UI.

Usulan adalah memperluas config atau `GET /api/models` dengan id, provider, supported route, attestation capability, availability, safe pricing metadata bila tersedia, `checked_at` dan alasan unavailable. Daftar katalog bukan bukti attestation yang sudah diverifikasi.

Tambahkan selected model/route yang diizinkan pada draft/quote A. Backend menghitung irisan antara allowlist versi penjual, batas pembeli dan kemampuan runner aktual, bukan menerima model bebas dari body execute. Bila metode tidak memakai AI, response menyatakan `uses_ai:false` dan UI tidak diminta memilih model. Budget mencakup batas call/token/time yang memang dapat ditegakkan. Model tidak tersedia harus menghasilkan capability/error yang jelas, bukan diam-diam mengganti provider.

Jalur proprietary tetap unavailable selama runner belum mendukungnya. Untuk implementasi berikutnya, perlu redaction plan/result, destination provider, explicit consent terikat request/revision dan pencegahan fallback yang keluar dari izin. API status boleh dibuat sekarang tanpa mengklaim eksekusi proprietary sudah ada.

Kriteria penerimaan. Pembeli tidak bisa memperluas allowlist. Model terpilih dan cap disimpan pada snapshot run. Perubahan provider/model/isi keluar memerlukan persetujuan ulang bila mengubah cakupan. Panggilan tidak melampaui cap secara diam-diam. Setiap laporan AI menyatakan model, tahap, proof/signature status dan refused/error, tanpa mempublikasikan prompt atau data pembeli.

### H4. Konteks izin yang sama di run dan lima proteksi

Dasar bagian 3 dan 49–52. Route protection saat ini menyelesaikan manifest versi terbaru berdasarkan method_id. Itu belum memastikan operasi memakai versi yang sama dengan run yang sudah dibayar. Handoff A membekukan versi pembayaran, tetapi perlu diperluas sampai connector, browser, memory dan outbound.

Perluas request protection yang berlaku dengan `run_id` atau context token yang ditandatangani server dan terikat principal, paid/draft version, manifest_hash, operation dan scope. Server menurunkan policy dari snapshot itu. Endpoint draft-local tetap boleh ada dengan label draft, tetapi tidak disamakan dengan paid run.

Usulan receipt persetujuan berisi consent_id, resource/action revision, manifest/policy reference, destination, content commitment, expiry bila disepakati, actor dan keputusan. Ini dapat berupa resource pada run draft atau `POST /api/run-drafts/:id/consents`, bukan wajib kontrak baru. Outbound action_hash yang sudah ada dipertahankan dan diperluas binding-nya bila konteks relevan berubah. Audit receipt bukan klaim semua log lengkap atau tidak ada kebocoran di jalur lain.

Kriteria penerimaan. Menerbitkan versi baru tidak mengubah policy run lama. `method_id` yang tidak cocok dengan run ditolak. Izin satu run tidak dapat dipakai run lain. Perubahan destination/content/params/policy yang relevan membuat approval lama tidak berlaku. Kredensial dicabut/expired tidak bisa dipakai hanya karena run pernah disetujui. Nilai token tetap tidak masuk ke model, penjual atau audit.

### H5. Artifact, dokumen dan hasil turunan yang tetap dapat ditelusuri

Dasar bagian 3, 9, 10, 49–51 dan 65.1. Documents list/get sudah ada. Kebutuhan tambahan adalah hubungan dokumen → ekstraksi → input yang ditinjau → sealed run → hasil, serta label privat yang ikut pada data turunan. Jangan membuat duplikat documents CRUD tanpa alasan.

Perlu metadata `artifact_id`, owner, run/draft reference, source_refs, processing/version reference, classification dan revision. Untuk jalur privat baru, usulan `POST /api/artifacts` menerima ciphertext dan binding metadata minimum, dengan GET metadata/ciphertext yang hanya dapat diakses pihak berhak. Pilihan storage/key-release belum menjadi keputusan produk. Artefak penjual dan input pembeli tidak boleh memakai ACL publik yang sama.

Dokumen scan membutuhkan provenance ekstraksi dan status verifikasi, hasil OCR/tabel/bahasa yang dapat ditinjau dan dikoreksi pembeli sebelum dipakai, serta hubungan koreksi ke versi sumber. Koreksi ekstraksi tidak otomatis menjadi perubahan memori atau izin training. Operasi ekstraksi dapat memakai job/status dari A bila memakan waktu lama. Browser download yang menghasilkan dokumen harus membawa ID dokumen yang sama ke daftar Files dan run.

Daftar private-values saat ini mencocokkan nilai/varian teks. Itu tidak cukup untuk mengklaim pelacakan seluruh data turunan seperti ringkasan. Perlu policy/provenance service internal yang mempertahankan sensitivitas sesuai batas yang dapat ditegakkan. Bila belum dibangun, laporkan keterbatasan tersebut, bukan hanya menambah field `private:true` pada JSON.

Kriteria penerimaan. Run menampilkan sumber dan revision input yang benar. Koreksi input memerlukan review baru. Output OCR gagal/meragukan tidak menjadi fakta diam-diam. Derived summary yang membawa data privat tetap melalui review outbound. Tidak ada kebocoran raw text melalui public artifact URL, logs atau error. Retensi dan penghapusan mengikuti keputusan terpisah, tanpa masa simpan rekaan.

### H6. Paket bukti run dan preflight key/build yang dapat diperiksa klien

Dasar bagian 11, 47, 51–52, laporan 55 dan 65. Execute response sudah memuat completion, attestation comparison dan chain hashes. Yang perlu dilengkapi adalah retrieval/recovery serta provenance yang cukup untuk verifikasi mandiri, bukan boolean tambahan yang diklaim sebagai bukti penuh.

Usulan adalah memperluas `GET /api/runs/:id` atau menambah `GET /api/runs/:id/evidence`. Kembalikan ciphertext hasil yang memang sudah public/terotorisasi, signed completion, expected version/manifest/runner hashes, input/output ciphertext commitments, call_id, proof references, timestamps serta verification status dan batasnya. Plaintext answer/report tetap dibuka di klien. Jangan membuat endpoint yang meminta answer key atau mengembalikan jawaban privat dalam plaintext.

Preflight dapat memperluas config dengan runner build, key identifier/version, policy binding dan proof reference. Bila runtime menyediakan nonce challenge, respons harus terikat nonce klien yang baru dan dapat diperiksa. Jangan mengarang bahwa API attestation menyediakan fitur nonce tertentu bila belum diverifikasi di implementation. Rotasi key/build harus terlihat sehingga ciphertext tidak dikirim ke build berbeda tanpa pemeriksaan.

Laporan memisahkan runner stages, seller-declared steps, missing/failed/out-of-order, AI calls/proofs, dan local checker capabilities. Prompt leak-check gagal harus terbaca sebagai kegagalan tahap dengan refund sesuai signed completion. Local checker failure tetap tidak memicu escrow sendiri. Status Intel/NVIDIA certificate chain harus tetap `not_verified` selama root validation belum dilakukan.

Kriteria penerimaan. Bukti dari run lain, nonce salah bila didukung, key/build berubah dan hash input/output tidak cocok terdeteksi. Public completion tidak membuka data atau jawaban. Prompt tidak mendapat verdict safe. Membuka ulang public evidence setelah reload tidak dianggap berhasil mendekripsi jawaban tanpa secret lokal.

### H7. Paket kontribusi yang benar-benar bisa dikerjakan tanpa membuka inti privat

Dasar bagian 7, 9, 21 dan 23. CRUD bounty/candidate D belum cukup bila kontributor tidak dapat memperoleh interface dan modul yang boleh diubah.

Usulan `GET /api/methods/:id/versions/:n/contribution-package` atau perluasan version/module endpoints mengembalikan spesifikasi input/output, interface/ABI, daftar modul terbuka, artifact source yang memang boleh dibaca, contoh sintetis, evaluator contract reference, batas perubahan dan cara menyerahkan patch. Inti privat hanya menampilkan interface yang diizinkan, bukan raw source atau prompt.

API candidate validate perlu memeriksa target module/base version, artifact integrity, imports/network policy, resource/output limits dan usaha mengganti evaluator sebelum private testing. Ini fungsi internal atau bagian validate D, bukan endpoint yang membocorkan data uji. Hak membuat turunan dan lisensi tetap gating yang belum diputuskan, bukan otomatis terbuka karena package dapat diunduh.

Kriteria penerimaan. Source yang dibuka benar-benar sesuai pilihan penjual. Candidate tidak dapat mengganti modul lain atau mengubah evaluator tanpa proses review yang sah. Private-core fix yang membutuhkan informasi tambahan ditandai needs-owner-access, bukan dijanjikan selalu dapat dikerjakan tanpa akses. Paid version baru terikat candidate hash yang diuji dan diterima, bukan artifact lain yang diunggah setelah review.

### H8. Preferensi tersimpan, observabilitas perubahan izin dan batas operasional

Dasar bagian 3, 18, 30, 52 dan pemetaan navigasi 56. Handoff sebelumnya mempunyai profil dan Activity, tetapi belum merinci penyimpanan preferensi serta status perubahan izin yang dibutuhkan akun lintas perangkat.

Usulan `GET/PATCH /api/me/preferences` untuk preferensi yang memang disepakati, misalnya pembatasan model default dan aksesibilitas. Preferensi UI seperti reduced motion juga dapat tetap client-side bila belum memerlukan sinkronisasi akun. Default preference tidak otomatis menjadi consent spesifik bagi setiap run atau proprietary provider.

Usulan read API pada daftar grant/connection/memory menambahkan effective state, expiry, version/revision, revoked/changed_at, source dan allowed_actions agar frontend tidak menebak dari timestamp atau label. Kebutuhan revoke existing credentials dan delete/edit memory sudah memiliki API, sehingga tambahkan semantik/receipt yang kurang, jangan menulis CRUD ulang.

Status antrean/cancellation/retry dari A harus membedakan cancel-before-payment, cancel-requested, externally-running, completed dan outcome-unknown jika jalur mendukungnya. Ini desain operasional usulan. Jika runtime tidak dapat menghentikan eksekusi yang sudah berjalan, API harus menyatakan tidak cancellable dan menjelaskan biaya yang masih mungkin terjadi. Jangan menjanjikan refund atau pembatalan penuh dari tombol Cancel lokal.

Kriteria penerimaan. Preferensi tidak memperluas hak metode. Edit paralel memakai revision check bila dapat mengubah izin. Retry execution tidak membuat tagihan/payment baru. Timeout jaringan tidak diperlakukan sebagai bukti operasi eksternal gagal. Penghapusan/retensi lintas dokumen, memori, hasil dan grants tetap memerlukan policy produk sebelum diberi janji permanen.

### Ringkasan audit tambahan

| Tambahan | Dasar rancangan | Posisi pekerjaan |
| --- | --- | --- |
| Schema input/output dan checker per versi | 5, 42, 49, 52, 55, 65.1 | Perluasan manifest/API dan client SDK |
| Metode tender runnable beserta input/output dan cek | 49–50, 65.1 | Implementasi metode/runtime, bukan hanya route proteksi |
| Model capability dan pilihan pembeli yang ditegakkan | 30, 52, 65 | Backend/runtime, proprietary tetap unavailable saat ini |
| Run-bound protection context dan consent receipts | 3, 11, 49–52 | Perluasan policy enforcement API yang ada |
| Provenance dokumen, artifact privat dan turunan | 3, 9–10, 49–51 | Protokol/pipeline, lokasi pemrosesan masih perlu keputusan |
| Evidence retrieval dan key/build preflight | 11, 47, 51–52, 55, 65 | Perluasan read/SDK, jangan mengklaim root attestation sudah diverifikasi |
| Contribution package dan candidate validation | 7, 9, 21, 23 | Akses modul dan binding artifact yang diuji |
| Preferensi, effective permission state dan cancellation semantics | 3, 18, 30, 52, 56 | Usulan teknis, bukan kebijakan pembatalan/retensi baru |

## Urutan handoff implementasi

Tahap pertama melengkapi daftar run, quote/biaya yang jujur, payment idempotency/recovery, timeout reclaim dan capabilities. Ini memperkuat alur berbayar yang sudah terhubung.

Tahap kedua melengkapi identity/ownership yang diperlukan untuk seller drafts/publication dan rating. Profil atau rating yang membutuhkan keputusan policy dapat dilaporkan blocked, sedangkan kontrak DTO dan read capabilities tetap didokumentasikan.

Tahap ketiga menyambungkan Community dan private-test workflow ke DAO/runtime yang ada, beserta ledger dan Activity. Gunakan demo/synthetic fixtures untuk tes sebelum operasi berbayar yang memerlukan otorisasi.

Setiap tahap menyerahkan API.md yang diperbarui, typed examples/schema, supported capabilities, status transitions, authorization rules, test results, migration/restart steps dan daftar keputusan yang masih terbuka. Catat command mana yang read-only dan mana yang signing/spending. Jangan menyebut route yang hanya mengembalikan fixture sebagai fitur live.

## Prompt singkat untuk Claude

Lanjutkan backend Kalis berdasarkan seluruh bagian A–H dokumen ini dan rancangan terbaru, termasuk keputusan tender 65.1. Pertahankan pembagian kerja, backend oleh Claude dan frontend/integrasi oleh Codex. Verifikasi gap terhadap kode aktual sebelum membuat endpoint baru. Implementasikan kebutuhan yang sudah disepakati melalui adapter kontrak/runtime yang ada, mulai dari run-list, payment idempotency/recovery, quote dan timeout reclaim. Bedakan usulan API dari keputusan produk. Jangan menetapkan policy terbuka atau menjalankan signing/spending/deployment tanpa otorisasi sesi yang berlaku. Perbarui API.md, BUILD_STATUS.md dan dokumen produk/PDF. Kembalikan kontrak final dan bukti pengujian agar Codex dapat mengintegrasikan frontend.

Pemeriksaan aturan NEAR tidak menemukan konflik untuk penyusunan dokumen ini. Tidak ada pesan yang dikirim ke Claude atau pihak lain, perubahan backend, deployment, signing atau spending pada sesi handoff ini.
