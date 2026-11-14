# Rancangan produk hasil sesi ideasi

Catatan review frontend 14 November 2026 tersedia di bagian 58. Penolakan visual pengguna berlaku pada draf aplikasi bagian 57, bukan perubahan kemampuan backend.

Versi 1.32 • 14 November 2026 • Bahasa Indonesia

Dokumen ini merupakan acuan utama agent development. Pasangannya, `RANCANGAN_PRODUK.pdf`, merangkum seluruh bidang keputusan untuk pemahaman dan audit pemilik produk. Ini konsolidasi hasil pembahasan, bukan transkrip verbatim. Riwayat alternatif tetap dicatat agar ide yang ditinggalkan tidak dibangun kembali tanpa alasan.

## 0. Status terkini (baca dulu)

Sinkronisasi 14 November 2026, versi 1.32. Bagian ini serta bagian 70 menggantikan status implementasi lama. Keputusan Dien menetapkan apa yang seharusnya dilakukan produk. Kode/runtime menetapkan apa yang sekarang terjadi. Perbedaan di antaranya tetap gap, bukan keputusan produk baru. CURRENT_STATE.md merinci bukti dan DOCUMENTATION_INDEX.md mengelompokkan dokumen aktif, referensi dan sejarah.

**Produk dan track.** Kalis adalah marketplace metode privat, berupa WASM atau prompt. Target disepakati tetap Privacy & Private AI, Social Money dan Open Innovation. Produk berfokus pada cara eksekusi, proteksi serta transaksi, bukan menjamin metode lebih unggul, profitable atau berkualitas universal.

**Aplikasi aktif.** Next.js di app/web dan backend Node di app/backend sudah terintegrasi. design/app adalah prototipe/referensi historis. Marketplace memakai template yang disetujui dan FRONTEND_GUIDE.md terbaru, bukan lagi shell Corbel lima menu. Consumer memakai Marketplace, Jobs, Data, Community dan Activity. Author memakai Methods, Community dan Activity. Account ada di wallet menu. Label author Create teramati di kode, sementara panduan sebelumnya memakai Drafts. Ini dicatat sebagai perbedaan istilah tanpa menyimpulkan persetujuan baru.

**Metode dan versi.** Runtime audit memuat sembilan metode, termasuk delapan demo awal serta scientivanmsk-freelance-rate v2. Portofolio v6, tender v2 dan gaji v3 aktif. Portofolio tetap metode demo utama yang disepakati, tender demo kedua, dan gaji bukan lagi ilustrasi saja. Katalog tidak membuktikan setiap versi terbaru sudah diuji berbayar ulang. Bukti historis mengikuti versi pada BUILD_STATUS.md 6.18.

**Eksekusi dan kontrak.** Metode berjalan di runner OutLayer TEE dengan sandbox wasmi dan AI privat NEAR AI Cloud. Runner aktif konfigurasi adalah 823e991364e83b70dd0521aa1cdfd876b89436398b872a89da7e6af399a7647d. Registry dan escrow memakai market.scientivan.testnet. registry.scientivan.testnet adalah kontrak lama. Pembeli mempunyai draft/consent/quote, model narrowing, sealed input, async execute, device checks, settle/reclaim dan rating pada kode UI. Seller mempunyai editor manifest/harga/DAO, artifact sealing, validasi dan wallet publication/confirmation. UI tersedia tidak berarti semua langkah sudah diverifikasi browser.

**Privasi yang diinginkan dan batas aktual.** Privasi dua pihak tetap tujuan disepakati. Per 15 November 2026 jalur plaintext checkout sudah ditutup dan lima perlindungan dipindah ke protokol tersegel dengan runner privat terpisah, backend hanya relay ciphertext. Bukti baru lokal mode native, belum TEE. Runner privat belum di-build, dikunci, atau di-deploy ke OutLayer, sehingga di deployment biasa halaman proteksi menolak tanpa fallback plaintext. Rincian di bagian 72.

**Lima perlindungan.** Kredensial, outbound approval, memori, dokumen dan HTTP browser agent memakai operasi tersegel yang ditandatangani kunci perangkat. Office import membaca file di perangkat. PDF privat ditolak di jalur privat, dokumen publik tetap boleh diekstrak backend setelah opt-in sesuai 65.1. Sertifikat Intel/NVIDIA belum diverifikasi mandiri. Prompt leak check tidak menahan semua parafrase dan verdict prompt maksimal attention.

**Pembayaran.** Fiat top-up masih mock, tidak ada saldo kustodian atau gateway fiat nyata. Settlement memakai transaksi NEAR testnet. Platform 10 persen, DAO minimal 10 persen sesuai versi, penjual sisanya. Sembilan versi teramati memakai 80/10/10. Stage failure refund dan timeout reclaim sudah mempunyai mekanisme, berbeda dari sengketa kualitas yang masih terbuka. Tidak ada izin transaksi atau real trading baru.

**Social Money yang sudah ada.** Dana dan kebijakan otoritas memakai kalis-fund.sputnik-v2.testnet. Issue, proposal AddBounty, voting, claim, kandidat tersegel, private grants/evaluate, review, payout request dan versi kontribusi sudah tersedia pada adapter/UI. Call uang perlu wallet signature dan chain confirmation. Council teramati satu akun scientivan.testnet. Bounty legacy tanpa evaluator lokal tidak dapat diuji melalui aplikasi. Nominee reviewer belum eksklusif ditegakkan handler yang mengizinkan council selain kontributor. Royalti, pengklaim bersaing dan sengketa masih terbuka. Revoke saat test menahan hasil pada kode, tetapi keputusan policy sebelumnya masih usulan.

**Bukti audit terbaru.** Sembilan endpoint GET lokal serta proxy health berhasil. Chrome tanpa login membuka 14 halaman. Build dan 31 tes frontend sesi yang sama lulus sebelum perubahan dokumen. Pemeriksaan backend lokal tanpa URL menghasilkan 47 cek manifest dan 8 cek Office lulus. Modul browser crypto/checks/file-import identik dengan backend. Audit tidak login, memanggil AI berbayar, membuat record atau menandatangani transaksi. Mobile, aksesibilitas penuh dan wallet E2E tidak dibuktikan ulang.

**Domain dan prioritas.** Landing di calis.scientivan.dev dan aplikasi di app.calis.scientivan.dev tetap rencana. Konfigurasi lokal tersedia, publikasi dan DNS belum diaktifkan. Dien menunda deployment. Prioritas terbaru adalah menelusuri penghalang privasi pada bagian 71 sebelum melanjutkan Social Money. Belum ada fitur tambahan atau policy baru yang disepakati.

**Fase dan batas klaim.** Development MVP sejak 13 November 2026, deadline 14 November 2026 23:59 UTC. Kesediaan membayar, manfaat metode dunia nyata dan keunggulan atas AI biasa belum terbukti. Rating testnet/seed dan verdict safe bukan bukti pelanggan, mutu atau keamanan menyeluruh. Compliance gate NEAR diperiksa, tidak ada konflik pada audit dokumentasi dan klaim harus mengikuti Q-017.

## 1. Status dan cara membaca

Catatan sejarah. Dua paragraf pembuka bagian ini berasal dari ideasi sebelum implementasi. Status kemampuan dan keputusan terkini ada di bagian 0 dan 70.

**Disepakati** berarti arah produk atau preferensi yang diterima dalam percakapan. **Usulan implementasi** merupakan penjabaran agar rancangan dapat dikembangkan, bukan keputusan stack atau spesifikasi final yang sudah disahkan. **Terbuka** berarti belum diputuskan. Seluruh kemampuan di sini masih rancangan. Sesi ini tidak membuktikan bahwa aplikasi, integrasi, kontrak, atau perlindungannya sudah dibangun.

Nama produk, arsitektur final, harga, jaringan deployment, serta eksklusivitas segmen belum ditetapkan. Jangan menganggap contoh demo sebagai satu-satunya pasar. Jangan mengubah asumsi menjadi klaim keberhasilan atau fakta pasar.

## 2. Produk dan manfaat utama

**Disepakati.** Ruang kerja AI privat untuk menyelesaikan pekerjaan dengan data sensitif, memakai atau menjual metode AI bernilai, dan bersama-sama mendanai perbaikannya.

Tiga bagian membentuk satu alur. Ruang kerja privat melindungi pekerjaan pengguna. Marketplace mempertemukan kebutuhan dengan keahlian yang dapat dijalankan sebagai metode. Pendanaan bersama membantu memperbaiki metode menggunakan kasus nyata yang dapat tetap rahasia.

Pengguna datang untuk menyelesaikan pekerjaan. Menjual metode, menyumbang kasus uji, dan mengelola dana adalah peran pilihan. Produk harus berguna sebelum komunitas besar terbentuk. Frekuensi penggunaan diharapkan datang dari pekerjaan rutin, bukan kewajiban ikut tata kelola.

Pesan inti konseptual adalah menggunakan keahlian orang lain dan memperbaiki alat AI bersama sambil menjaga kerahasiaan data. Keunggulan kombinasi tersebut masih perlu dibuktikan melalui implementasi dan pengujian.

## 3. Masalah dan lima perlindungan fondasi

> **Status 13 November 2026.** Pengguna memutuskan kelima perlindungan tetap dibangun di MVP (bagian 48).

Kelima aspek tetap berada dalam cakupan produk. Demo boleh menonjolkan satu atau dua alur utama. Menggabungkan lima fitur bukan bukti originality.

| Aspek | Perilaku yang dituju | Bukti audit yang diperlukan |
|---|---|---|
| Kredensial dan integrasi | Rahasia dipakai melalui broker atau lingkungan tepercaya dengan izin terbatas. Model tidak memperoleh kredensial mentah secara bebas | Tunjukkan batas operasi dan akses, pencabutan izin, serta penanganan log |
| Aliran data privat ke luar | Data dari sumber privat diberi penanda. Turunan seperti ringkasan tetap membawa konteks sensitivitas. Pengiriman ke publik atau pihak luar ditahan sampai persetujuan sesuai kebijakan | Coba pengiriman langsung dan melalui ringkasan, lalu verifikasi tujuan, isi, dan argumen yang disetujui |
| Memori persisten | Konten tidak tepercaya tidak langsung menjadi instruksi atau fakta permanen. Perubahan memori memiliki asal, tinjauan, dan kontrol pengguna | Perlihatkan usulan perubahan, persetujuan, koreksi atau penghapusan |
| Dokumen multimodal | PDF, gambar, OCR, tabel, serta konten non-Inggris diproses dengan batas privasi yang konsisten | Periksa aliran data semua layanan pendukung dan ketepatan ekstraksi |
| Browser agent | Agent memakai akun dan browser dengan batas tindakan, akses, serta pengiriman data | Perlihatkan pembatasan sesi dan penahanan tindakan eksternal yang sensitif |

Persetujuan tindakan harus terikat pada tindakan konkret. Tujuan, isi, parameter, atau konteks penting yang berubah memerlukan evaluasi ulang. Pemeriksaan kebijakan harus dijalankan pada jalur eksekusi, bukan hanya menjadi instruksi prompt. Mekanisme detail dan batas sensitivitas masih perlu ditentukan.

## 4. Pengguna dan skenario yang relevan

> **Status 13 November 2026.** Untuk frontend, ilustrasi use case mengikuti bagian 45 (portofolio, negosiasi gaji, penawaran tender), karena data segmen di tabel ini dinilai pengguna kurang terasa sensitif. Prinsip membuka dengan beberapa segmen tetap berlaku.

**Disepakati.** Produk menaungi banyak segmen. Dokumen dan demo harus membuka dengan beberapa segmen beserta skenarionya, kemudian menyatakan bahwa satu contoh dipilih untuk menjelaskan alur produk.

| Segmen yang sesuai | Contoh pekerjaan |
|---|---|
| Freelancer dan profesional jasa | Penawaran proyek, negosiasi, pengolahan dokumen klien |
| Pemilik agensi dan tim jasa kecil | Pemilihan lingkup, harga, kapasitas, dan risiko proyek |
| Koordinator proyek dan operasional | Mengolah perubahan brief, percakapan, dokumen, dan tindak lanjut |
| Usaha kecil | Rekonsiliasi invoice, pembayaran, laporan dan data internal |
| Profesional dengan data kerja sensitif | Analisis dan pengambilan keputusan berbantuan metode spesialis |

Daftar ini menggambarkan kecocokan konseptual, bukan validasi permintaan. Sebelumnya koordinator proyek dan operasional di tim kecil diusulkan sebagai fokus awal. Pengguna kemudian menegaskan bahwa pembuka harus tetap luas. Tidak ada keputusan pasar eksklusif.

Calon pembayar dapat berupa individu yang membutuhkan metode atau pengelola tim yang membayar produktivitas bersama. Siapa pembeli awal paling kuat masih perlu diuji. Jangan menyamakan relevansi umum dengan kemauan membayar.

## 5. Metode AI sebagai produk keahlian

**Disepakati.** Metode adalah strategi, cara mengambil keputusan, atau prosedur bernilai yang dapat digunakan ulang. Metode tidak cukup ditampilkan sebagai prompt generik yang menghasilkan rangkuman, daftar tugas, atau balasan biasa.

**Direvisi 14 November 2026.** Bentuk prompt kini boleh dijual. Yang dijual tetap strategi atau prosedur bernilai milik penjual, hanya wadahnya berupa prompt rahasia yang dijalankan model AI privat, bukan program. Prompt generik tanpa pengetahuan penjual tetap bukan nilai yang dijanjikan. Bentuk metode (prompt atau kode WASM) wajib terlihat oleh pembeli, dan penjual prompt menerima peringatan risiko bocor (bagian 65).

Pembuat dapat menawarkan metode dengan versi, deskripsi manfaat, kebutuhan masukan, batas penggunaan, harga yang terlihat, serta bukti pengujian. Pembeli dapat mencoba metode dengan data sendiri secara privat sebelum memutuskan pembelian atau pemakaian berbayar. Ketentuan trial belum diputuskan. Metode menggunakan pembagian modul dan akses pada bagian 21.

Privasi dua pihak adalah sasaran rancangan. Data pembeli tidak otomatis diserahkan kepada penjual. Pengetahuan atau implementasi privat penjual tidak otomatis dibuka kepada pembeli. Kerahasiaan metode tidak berarti hasilnya mustahil ditiru atau diekstrak melalui penggunaan berulang. Batas tersebut perlu diuji.

Analogi pengguna adalah strategi trading yang dirahasiakan dan dibayar karena nilai keahliannya. Ini bukan permintaan membangun produk trading, jaminan kemenangan, atau bukti bahwa setiap metode akan unggul.

## 6. Contoh utama yang disepakati

> **Digantikan.** Contoh ini tidak lagi menjadi metode demo. Metode demo MVP adalah portofolio (bagian 0 dan 48). Isi di bawah disimpan sebagai riwayat.

**Disepakati pada akhir sesi.** Freelancer atau pemilik agensi memakai metode penyusunan penawaran proyek dan strategi negosiasi milik praktisi berpengalaman.

Masukan meliputi brief klien, catatan percakapan, kapasitas tim, biaya internal, dan pengalaman proyek sebelumnya. Luaran utama adalah **paket penawaran beserta rencana negosiasi yang siap ditinjau**.

- Pilihan paket dengan lingkup, harga, serta alasan pemilihan.
- Batas negosiasi berdasarkan biaya dan kapasitas pengguna.
- Urutan konsesi, misalnya penyesuaian lingkup sebelum penurunan harga.
- Syarat perubahan pekerjaan untuk menghindari pekerjaan tambahan tanpa pembayaran.

Yang dijual adalah keahlian mengenali permintaan berisiko membengkak, merancang paket alternatif, dan menentukan ruang negosiasi. Hasil harus menunjukkan hubungan antara masukan, keputusan metode, dan tindakan yang dapat diambil pengguna.

Keberhasilan awal dapat dinilai melalui kepatuhan pada batas biaya, kapasitas, dan perubahan lingkup. Klaim menaikkan keberhasilan penjualan atau mempercepat pekerjaan harus diuji, bukan diasumsikan. Rumus harga, bobot keputusan, angka demo, dan dataset belum disepakati. Contoh ini telah diperkuat dan disepakati sebagai penawaran berbasis optimasi biaya dan kapasitas pada bagian 22.

## 7. Versi, perbaikan, dan kontribusi

**Disepakati.** Ide menjual perbaikan atau bug fixing digabungkan ke marketplace metode. Metode turunan dapat memperbaiki atau mengembangkan metode lain. Hubungan versi, kontributor, dan kesepakatan pembagian pendapatan harus dapat ditelusuri.

Kasus uji membuktikan suatu masalah atau perbaikan, sedangkan perubahan metode memperbaiki perilaku. Keduanya dapat dihargai tetapi tidak identik. Pembagian pendapatan harus berdasarkan persetujuan, bukan klaim sepihak kepemilikan atas metode pihak lain.

Hak membuat turunan, lisensi, tinjauan publikasi, pembagian pembayaran, dan penanganan sengketa masih terbuka. Tidak ada persentase royalti yang telah ditetapkan.

## 8. Pendanaan perbaikan bersama

**Disepakati sebagai arah Social Money.** Sebagian biaya pemakaian dapat masuk ke dana komunitas berdasarkan aturan yang disetujui. Anggota mengusulkan masalah dan mengalokasikan dana untuk perbaikan yang berguna bersama.

Mekanisme penerimaan berbasis pengujian independen dan review telah disepakati pada bagian 23. Alur konseptual meliputi masalah yang diusulkan, persetujuan alokasi dana, syarat penerimaan, kandidat perbaikan, pengujian privat, penerimaan yang berwenang, pembayaran, dan publikasi versi baru. Usulan implementasi perlu mendefinisikan status, aktor berwenang, penolakan, dan pengujian ulang sebelum kode dibuat.

Pembayaran mengikuti pengujian dan keputusan yang ditetapkan sebelumnya. AI atau blockchain tidak otomatis mengetahui bahwa hasil kerja benar. Jumlah anggota, model voting, kuorum, pihak penilai, kontribusi dana, tenggat, dan sengketa belum ditentukan.

Tidak setiap pengguna wajib aktif dalam tata kelola. Jangan membangun multisig baru tanpa kebutuhan, karena infrastruktur yang ada dapat digunakan.

## 9. Pengujian dengan kasus privat

**Disepakati sebagai pembeda yang ingin dibuktikan.** Pemilik data dapat secara terpisah mengizinkan kasus gagal dipakai untuk menguji kandidat metode. Pengembang memperoleh informasi masalah yang disetujui dan mengirim kandidat perbaikan tanpa menerima dokumen mentah.

Sistem menjalankan kandidat di lingkungan privat dan mengembalikan hasil pemeriksaan yang dibatasi. Pengujian tidak boleh menjadi API untuk mengekstrak data melalui keluaran, log, jaringan, pertanyaan adaptif, atau percobaan berulang. Izin memakai data untuk pekerjaan biasa tidak otomatis menjadi izin pengujian bersama atau pelatihan model.

Detail pembatasan keluaran, jumlah percobaan, pemeriksaan kode, kebijakan jaringan, retensi, pencabutan izin, dan penilai tepercaya masih perlu dirancang. Lolos satu kasus belum membuktikan kualitas umum. Gunakan kasus regresi dan pembanding yang relevan untuk klaim perbaikan.

## 10. Peran NEAR, blockchain, dan komputasi privat

| Komponen | Fungsi dalam rancangan | Batas klaim |
|---|---|---|
| NEAR dan smart contract | Dana bersama, aturan keputusan, pencatatan penerimaan, pembayaran dan pembagian pendapatan | Tidak otomatis membuktikan privasi atau kualitas AI |
| NEAR AI Cloud dan TEE | Kandidat eksekusi AI serta pemrosesan data secara rahasia | TEE mempunyai asumsi hardware dan software. Attestation bukan bukti semua logika benar |
| OutLayer | Kandidat broker rahasia, eksekusi terkontrol, dan integrasi tindakan | Perlu mengecek kemampuan aktual serta batas integrasi |
| CKD atau pengelolaan kunci terkait | Kandidat pengikatan akses kunci pada eksekusi atau kebijakan | Belum menjadi pilihan arsitektur final |
| Sputnik DAO atau Trezu | Kandidat dana dan persetujuan bersama yang sudah tersedia | Logika aplikasi dan penerimaan perbaikan masih perlu dibangun |
| NEAR Intents | Opsi pembayaran lintas aset atau chain bila dibutuhkan | Tidak wajib ditambahkan demi menyebut teknologi |

Isi dokumen, kredensial, metode privat, keluaran sensitif, dan kasus uji tetap terenkripsi di luar blockchain publik. Metadata pun dapat membocorkan hubungan pengguna. Komitmen kriptografis harus dirancang agar tidak mudah ditebak dari data berentropi rendah.

Teknologi Web2 dapat membangun banyak fungsi produk. Nilai Web3 yang ingin diwujudkan adalah pengelolaan dana serta keputusan antar pihak yang bisa diperiksa dan dijalankan tanpa sepenuhnya bergantung pada database operator. Jangan mengklaim blockchain esensial untuk setiap fitur.

## 11. Bukti aturan, persetujuan, dan hasil tindakan

Pembahasan awal mengusulkan komitmen kriptografis atas versi aturan, persetujuan, dan hasil tindakan di NEAR. Ini kemampuan audit yang dapat dipertimbangkan, bukan fitur yang terbukti dibangun atau pengganti fungsi dana bersama.

Contoh penerapannya pada skenario akhir adalah aturan bahwa biaya internal tidak boleh dikirim ke klien. Pengguna menyetujui versi draf penawaran untuk penerima tertentu. Eksekusi menghasilkan kuitansi tindakan berhasil atau gagal. Pemilik, pengelola tim, atau auditor dapat memeriksa kecocokan versi aturan, isi yang disetujui, dan kuitansi dengan komitmen yang tercatat tanpa membuka seluruh dokumen ke publik.

Bukti tersebut menunjukkan konsistensi catatan tertentu. Bukti tidak membuktikan tidak ada kebocoran melalui jalur lain, tidak menjamin kelengkapan log, dan tidak membuktikan keputusan AI benar. Data offchain yang diperlukan tetap harus tersedia bagi pemeriksa yang berwenang.

## 12. Keputusan mengenai NFT

**Final untuk arah saat ini.** NFT tidak digunakan. Identitas metode, hubungan versi, royalti, escrow, dan pengembalian pembayaran tidak dengan sendirinya memerlukan NFT.

Pengguna menolak NFT generik sebagai mandat, sertifikat, bukti akses, atau transfer hak yang tidak menyelesaikan kebutuhan inti. Eksplorasi juga mencakup data pembanding privat berbayar, layanan produksi karakter kreatif, pendanaan solusi bersama, serta pesanan dengan jaminan hasil. Tidak ada yang diterima sebagai alasan esensial memakai NFT.

Inspirasi eksternal meliputi Ocean untuk compute-to-data, Molecule untuk pendanaan IP, Alethea untuk karakter AI, Boson untuk penukaran dan escrow, Nexus Mutual untuk perlindungan dan klaim, serta Uniswap untuk posisi likuiditas unik. Mekanisme pembayaran, privasi, dan jaminan tetap berbeda dari NFT. Jangan menghidupkan kembali NFT hanya untuk mencocokkan track.

## 13. Track dan AI Swarms

Privacy & Private AI mencakup eksekusi serta pengujian privat. AI Security & Defense relevan untuk lima perlindungan fondasi. Social Money mencakup dana dan keputusan perbaikan bersama. Open Innovation adalah kandidat untuk kombinasi kebutuhan privat dan pengembangan kolaboratif. Agent Economy juga relevan secara konseptual untuk perdagangan metode, tetapi fokus akhir diarahkan pada privasi, Social Money, dan potensi Open Innovation.

AI Swarms tetap opsional. Contoh perluasannya adalah agent spesialis memilih metode, menawar tugas, membagi pekerjaan, memeriksa hasil, dan membayar penyedia sesuai batas pengguna. Gunakan hanya jika hasil lebih baik atau biaya lebih rendah dapat dibuktikan. Beberapa pemanggilan model saja belum menunjukkan ekonomi antaragent.

Kecocokan track bukan jaminan originality atau kemenangan. Track resmi menjelaskan arah, bukan kewajiban menambahkan semua teknologi sekaligus.

## 14. Model bisnis dan validasi

**Acuan model bisnis terkini adalah bagian 30.** Pembuat menetapkan harga masing-masing metode saat publikasi. Pengguna metode membayar harga tersebut beserta infrastruktur sejak awal. Estimasi biaya tetap dibatasi pada server, database dan domain, tanpa gaji tim. Biaya penggunaan seperti AI, runtime dan ekstraksi tetap diperhitungkan.

Biaya platform dan sumber dana perbaikan perlu ditentukan tersendiri. Persentase komisi, tarif, unit penagihan dan aturan kegagalan masih terbuka. Paket USD 29 dan pembagian 30%/10% bagian 28 adalah simulasi historis yang telah digantikan arah harga per metode. Penerimaan kas untuk pembuat, penyedia infrastruktur atau dana komunitas tidak otomatis menjadi pendapatan platform.

Bukti kebutuhan pasar dipakai sebagai dasar asumsi adopsi sesuai keputusan bagian 27. Wawancara bukan prasyarat. Harga yang diterima, penggunaan ulang dan biaya aktual belum terukur. Risiko mutu metode, kerahasiaan, penyalahgunaan pengujian, sengketa dan pembiayaan perbaikan tetap perlu ditangani dalam implementasi.

## 15. Originality, kompetitor, dan penilaian

Kesimpulan riset sesi adalah bahwa banyak komponen sudah memiliki preseden. Tidak menemukan satu produk yang memadukan semuanya bukan bukti kebaruan. Penilaian awal originality diturunkan menjadi rendah sampai menengah. Kombinasi akhir masih perlu dibandingkan kembali dan belum layak diklaim memiliki originality tinggi.

| Pembanding | Relevansi yang dibahas |
|---|---|
| LLM Shield dan CaMeL | Kontrol aliran informasi, persetujuan, serta pertahanan prompt injection |
| OutLayer | Rahasia, integrasi terkontrol, eksekusi dan persetujuan tindakan |
| Tovel | Tata kelola tool, identitas, memori dan bukti tindakan |
| Proton Lumo dan Lit | Privasi AI atau kontrol rahasia dan akses dengan batas masing-masing |
| Ocean dan Decentriq | Komputasi atas data privat serta kolaborasi data |
| Papermark | Data room, kontrol akses dan dokumen sensitif |
| Olas | Paket atau agent, dependensi dan koordinasi ekonomi |

Technical implementation harus dibuktikan dengan alur yang benar-benar berjalan. Design dinilai dari kemudahan dan kejelasan pengguna. Impact membutuhkan masalah serta pengguna yang nyata. Originality membutuhkan pembanding alur utuh. Sustainability membutuhkan insentif dan biaya yang layak. Lima kategori ini dibahas sebagai panduan penilaian dari materi penyelenggara, bukan bobot resmi yang telah ditetapkan.

## 16. Aturan komunikasi dan demo

**Wajib sesuai preferensi pengguna.** Buka dengan beberapa segmen dan skenario, kemudian nyatakan bahwa satu segmen dipakai untuk menggambarkan inti produk. Jangan membuka dengan klaim bahwa produk khusus koordinator proyek atau hanya untuk freelancer.

Contoh pembuka yang dapat disesuaikan adalah produk membantu freelancer menyiapkan penawaran, tim operasional mengolah perubahan proyek, dan usaha kecil memeriksa dokumen bisnis secara privat. Demo kemudian memakai freelancer atau pemilik agensi yang menyusun paket penawaran dan strategi negosiasi.

Tampilkan satu alur utuh, bukan tur semua menu. Fondasi privasi, marketplace, dan perbaikan bersama harus terlihat sebagai bagian yang saling membutuhkan. Lima perlindungan tetap ada dalam rancangan walau video menyorot satu atau dua alur.

Usulan adaptasi alur demo akhir adalah memilih metode, memasukkan brief dan biaya privat, menampilkan paket dan batas negosiasi, menahan pengiriman informasi internal, menemukan kelemahan metode saat lingkup berubah, mengizinkan kasus uji privat, menerima perbaikan yang didanai komunitas, membandingkan hasil, dan memperlihatkan pembayaran nyata. Kasus gagal rinci dan urutan adegan ini adalah usulan, belum storyboard final.

Momen pembeda adalah perbaikan berhasil diuji tanpa pengembang menerima dokumen mentah. Jangan menyebutnya terbukti hanya karena UI menampilkan gembok. Tampilkan bukti batas akses serta implementasi. Semua simulasi harus berlabel.

Skenario invoice dan mutasi bank, pembayaran sebagian, serta chat menjadi daftar tugas adalah contoh terdahulu. Tetap dapat menjadi use case, tetapi sudah digantikan sebagai contoh utama oleh penawaran dan strategi negosiasi. Kalimat lama tentang mengubah chat menjadi tindak lanjut perlu disesuaikan dengan fokus baru.

## 17. Isi dokumen dan bukti untuk audit

| Materi | Fokus |
|---|---|
| Submission atau pitch | Masalah, cakupan segmen, satu contoh dan manfaat pembeda |
| README | Cara menjalankan, langkah pembuktian, kemampuan nyata dan batas implementasi |
| Dokumen teknis | Aliran data, aktor, izin, trust boundary, pengujian dan pembayaran |
| Dokumen produk atau bisnis | Alasan penggunaan berulang, insentif pembuat metode, biaya dan pendapatan |
| Pemetaan track | Kaitan perilaku produk dengan definisi track, tanpa klaim kecocokan berlebihan |

Checklist berikut adalah penjabaran audit dari arah produk, bukan laporan pengujian yang sudah dilakukan.

- [ ] Pembuka menyebut beberapa segmen dan menjelaskan pemilihan satu contoh.
- [ ] Metode menghasilkan keputusan strategis dengan alasan dan batas yang jelas.
- [ ] Data rahasia tidak muncul pada keluaran publik, log, atau panel pengembang tanpa izin.
- [ ] Kelima perlindungan memiliki implementasi atau status keterbatasan yang eksplisit.
- [ ] Persetujuan terikat tujuan dan isi tindakan, perubahan memicu evaluasi ulang.
- [ ] Pemakaian kasus uji memerlukan izin tersendiri dengan cakupan yang jelas.
- [ ] Kandidat perbaikan diuji dengan pembatasan keluaran serta jalur eksfiltrasi.
- [ ] Versi asal, perubahan dan pembagian pembayaran dapat ditelusuri.
- [ ] Dana, keputusan penerimaan dan pembayaran sesuai aturan, tanpa pembayaran berulang untuk peristiwa yang sama.
- [ ] Bukti perbaikan menyertakan hasil sebelum dan sesudah serta batas generalisasinya.
- [ ] Kontrak tidak menyimpan dokumen atau metode privat secara terbuka.
- [ ] Klaim implementasi, efektivitas, pendapatan dan originality sesuai bukti.
- [ ] NFT tidak ditambahkan dan AI Swarms tetap opsional.

## 18. Pertanyaan terbuka sebelum pembangunan rinci

1. Nama, pembeli awal, pricing, trial dan pembagian biaya.
2. Format metode, hak publikasi turunan, lisensi dan perlindungan keahlian.
3. Model, TEE, penyimpanan, pengelolaan kunci dan kemampuan nyata setiap provider.
4. Definisi data sensitif, policy engine, memori, integrasi browser serta OCR.
5. Retensi, penghapusan dan pencabutan izin data atau kasus uji.
6. Evaluator, metrik, baseline, batas keluaran dan mekanisme sengketa.
7. Bentuk komunitas, kuorum, hak keputusan, dana bounty dan aturan pembayaran.
8. Kontrak, testnet atau mainnet, asset pembayaran dan kebutuhan lintas chain.
9. Data demo sintetis, kasus gagal, angka, storyboard dan durasi video.
10. Pembagian tahap implementasi tanpa menghapus cakupan yang sudah disepakati.

Agent boleh mengusulkan jawaban, tetapi harus menandainya sebagai usulan. Jangan mengambil angka atau pilihan teknologi dari contoh sebagai keputusan final.

## 19. Riwayat keputusan dan alternatif

Awal sesi meneruskan pembahasan Claude tentang perlindungan AI dan kelayakan produk untuk NEAR Hackathon. Lima celah digabung sebagai satu ruang kerja privat. Perbandingan kompetitor menunjukkan bahwa kombinasi fitur saja belum membuktikan originality. Komitmen log di blockchain dinilai terlalu tambahan jika tidak ada kebutuhan verifikasi independen.

Eksplorasi NFT beralih dari mandat dan bukti akses ke metode AI yang dapat dijual serta dikembangkan. Pengguna menyukai mekanisme keahlian bernilai jual, bukan menetapkan bahwa setiap ide harus berupa aset yang makin berkembang. Ide perbaikan atau bug fixing digabungkan ke ide metode. Pembelian kolektif privat kurang dipilih.

Eksplorasi berikutnya mempertimbangkan pembanding data privat, karakter kreatif, dan pendanaan bersama. Lalu pesanan terjamin dan escrow diuji sebagai alasan NFT. Kesimpulannya fungsi inti tersebut dapat ditangani komponen lain. NFT dikeluarkan.

Arah kemudian bergeser ke Social Money dan Open Innovation melalui dana perbaikan serta kasus uji privat. AI Swarms menjadi opsi. Produk tetap menyeluruh, demo menggunakan satu contoh. Pengguna mengoreksi penyempitan pasar dalam pembuka serta meminta keluaran metode yang menunjukkan strategi khas. Contoh penawaran proyek dan negosiasi diterima sebagai contoh utama.

## 20. Rujukan dan konteks sumber

Rujukan berikut digunakan dalam pembahasan. Ini daftar landasan, bukan riset baru atau jaminan semua fitur pihak ketiga masih sama. Verifikasi dokumentasi sebelum integrasi. Fakta tentang produk akhir tetap berstatus rancangan.

- [NEAR Hackathon dan definisi track](https://nearhackathon.com/)
- [Prompt resmi per track](https://github.com/nearai/near-hackathon-prompt-examples)
- [LLM Shield, aliran lintas aplikasi](https://docs.shield.votal.ai/cross-app-flow-control/)
- [LLM Shield, persetujuan](https://docs.shield.votal.ai/hitl-approvals/)
- [CaMeL](https://arxiv.org/abs/2503.18813)
- [OutLayer connectors](https://app.outlayer.ai/docs/connectors)
- [OutLayer trust verification](https://app.outlayer.ai/docs/trust-verification)
- [NEAR AI Cloud dan Intel attestation](https://near.ai/blog/near-ai-cloud-integrates-intel-trust-authority)
- [Proton Lumo privacy](https://proton.me/support/lumo-privacy)
- [Lit security](https://www.litprotocol.com/security)
- [Tovel](https://tovel.io/)
- [Papermark](https://www.papermark.com/data-room)
- [Decentriq](https://www.decentriq.com/)
- [Ocean compute-to-data](https://docs.oceanprotocol.com/developers/compute-to-data/compute-to-data-datasets-algorithms)
- [Olas overview](https://stack.olas.network/protocol/technical_overview/)
- [Molecule](https://docs.molecule.to/documentation/catalyst/submit-a-project)
- [Alethea](https://www.alethea.ai/about/)
- [Boson](https://www.bosonprotocol.io/blog/buyer-experience-on-bosonapp/)
- [Nexus Mutual cover](https://docs.nexusmutual.io/protocol/cover/)
- [ERC-721](https://eips.ethereum.org/EIPS/eip-721)
- [Uniswap v3](https://app.uniswap.org/whitepaper-v3.pdf)
- [Microsoft, komunikasi kerja](https://www.microsoft.com/en-us/worklab/work-trend-index/breaking-down-infinite-workday)

Konteks awal berasal dari chat Claude Code dengan ID `8fc20442-01a7-45b6-a2eb-6109920faa87`. Acuan ini mempertahankan hasil yang dibawa ke sesi ini. Penilaian proyek submission lain dan daftar seluruh kandidat hackathon bukan bagian spesifikasi produk. Informasi deadline serta aturan acara harus dibaca ulang dari sumber resmi saat submission, bukan dianggap tetap dari catatan sesi.


## 21. Metode modular dan kontribusi pihak lain

**Disepakati pada pembahasan lanjutan.** Kontributor tidak harus pembuat asli. Penjual menentukan bagian yang dibuka untuk kontribusi sejak metode diterbitkan. Keterbukaan dapat berbeda antar metode.

| Bagian | Yang terlihat oleh kontributor | Yang boleh diubah |
|---|---|---|
| Spesifikasi | Format masukan, keluaran, batasan dan perilaku yang diharapkan | Usulan perubahan spesifikasi melalui review |
| Modul terbuka untuk kontribusi | Kode atau aturan modul, dokumentasi dan contoh sintetis | Perubahan modul melalui pengajuan dan review |
| Inti keahlian privat | Antarmuka pemanggilan dan perilaku yang dijanjikan | Pengganti atau ekstensi melalui antarmuka, sesuai izin dan lisensi |
| Data pengguna | Contoh sintetis dan informasi kesalahan yang diizinkan | Tidak dapat mengubah data asli |
| Pengujian privat | Kriteria penilaian dan laporan terbatas | Usulan kasus uji, tanpa mengubah evaluator penentu pembayaran |

Contoh pembagian adalah model estimasi durasi berdasarkan pengalaman proyek tetap privat, sedangkan modul penjadwalan serta perhitungan biaya dibuka untuk kontribusi. Kontributor bisa memperbaiki penjadwalan lintas minggu tanpa melihat model estimasi atau data klien.

Kontributor tidak dapat memperbaiki sembarang kesalahan internal pada kode yang sepenuhnya tersembunyi. Kesalahan inti privat memerlukan akses terbatas yang disetujui pemilik atau modul pengganti. Akses terbatas berarti pengetahuan tertentu memang dibagikan. Jangan menjanjikan kolaborasi penuh tanpa membuka informasi yang dibutuhkan.

## 22. Contoh utama diperkuat dengan optimasi

> **Digantikan.** Contoh ini tidak lagi menjadi metode demo. Metode demo MVP adalah portofolio (bagian 0 dan 48). Isi di bawah disimpan sebagai riwayat.

**Disepakati.** Metode menentukan paket proyek, harga minimum, dan jadwal yang layak berdasarkan biaya serta kapasitas nyata. Ini memperkuat contoh penawaran dan negosiasi sebelumnya, bukan mengganti produk menjadi aplikasi penjadwalan khusus.

Masukan meliputi brief, daftar pekerjaan aktif, kapasitas tim, tarif internal, dan batas margin. Metode menerjemahkan brief menjadi pekerjaan, ketergantungan dan estimasi durasi yang dapat ditinjau. Mesin optimasi mencari kombinasi lingkup, penugasan, jadwal dan biaya yang memenuhi batas pengguna. AI menjelaskan hasil dan menyusun penawaran serta strategi konsesi.

Luaran dapat berupa paket cepat dengan tambahan tenaga, paket standar sesuai kapasitas, atau paket lebih murah dengan pengurangan lingkup. Saat klien meminta diskon, metode menghitung penyesuaian lingkup atau jadwal agar batas margin tetap terpenuhi. Bila batasan tidak dapat dipenuhi, metode melaporkan ketidaklayakan, bukan mengarang solusi.

Alasan pembelian yang ingin dibuktikan adalah mengurangi risiko menerima proyek dengan harga, kapasitas atau tenggat yang tidak masuk akal. Solver umum tersedia gratis. Nilai komersial harus berasal dari pemodelan pekerjaan, aturan praktisi, estimasi, integrasi dan kemudahan penggunaan. Optimasi tidak membuat estimasi masukan otomatis benar.

Pembanding wajib mencakup AI umum dengan prompt yang baik, AI umum dengan bantuan perhitungan atau kode, serta metode kita dengan data dan batasan yang sama. Ukur pelanggaran batas, ketepatan hitungan, kelayakan jadwal, waktu pengerjaan dan jumlah koreksi manusia. Jangan sengaja melemahkan baseline. Klaim jauh lebih baik, peningkatan penjualan atau kemauan membayar tetap memerlukan bukti.

Dasar teknis yang diriset adalah [Google Workforce Scheduling](https://developers.google.com/optimization/service/scheduling/workforce_scheduling), yang memodelkan keterampilan, ketersediaan, preferensi, kebutuhan kerja dan anggaran. Ini mendukung kelayakan pendekatan, bukan bukti keunggulan produk kita. Solver, rumus, dataset dan angka evaluasi belum ditentukan.

## 23. Bounty berbasis perubahan yang diterima

**Disepakati.** Mekanisme mengadaptasi kontribusi software melalui pengajuan perubahan, pemeriksaan independen, dan review sebelum pembayaran. Referensi riset adalah [Algora](https://algora.io/swift) dan [Opire](https://opire.dev/). Preseden tersebut tidak berarti mereka menggunakan escrow NEAR atau pengujian privat seperti rancangan kita.

1. Tetapkan masalah dan syarat penerimaan sebelum pengerjaan. Nyatakan modul yang boleh diubah, versi awal, penguji, tenggat dan nilai bounty.
2. Sediakan contoh sintetis yang mereproduksi masalah. Kasus privat menjadi pemeriksaan tambahan dengan izin pemilik.
3. Kontributor mengirim perubahan versi, penjelasan, kasus uji dan dampaknya.
4. Jalankan pemeriksaan independen. Kandidat tidak boleh mengubah evaluator, kriteria atau data uji penentu pembayaran agar dirinya lolos.
5. Reviewer menerima atau menolak dengan alasan. Pengujian otomatis membantu keputusan. Review menilai keamanan dan kesesuaian perubahan.
6. Kontrak membayar setelah bukti penerimaan yang sah. Aturan klaim bersaing, sengketa dan pembayaran sekali harus ditetapkan sebelum bounty dibuka.

Contoh bounty yang disepakati untuk pendalaman adalah kesalahan kapasitas saat anggota tim cuti. Syarat penerimaan mencakup tidak ada tugas pada waktu cuti, tidak ada penugasan bertabrakan, hitungan biaya benar, kasus regresi tetap lolos, dan laporan ketidaklayakan jika jadwal memang tidak mungkin.

Detail identitas reviewer, hak persetujuan, kuorum, format bukti, tenggat sengketa dan nilai bounty masih terbuka. Penerimaan dan pembayaran bounty tidak otomatis memberikan royalti atau hak atas metode. Hak tersebut mengikuti kesepakatan terpisah.

## 24. Kebiasaan dokumentasi dan riwayat pembaruan

**Instruksi pengguna yang berlaku seterusnya.** Setiap pembahasan dan pertimbangan selesai atau menghasilkan keputusan, perbarui `RANCANGAN_PRODUK.md` dan `RANCANGAN_PRODUK.pdf` pada giliran yang sama tanpa menunggu permintaan tambahan. Sinkronkan memori proyek bila diperlukan. Simpan keputusan, alasan, batasan, dan pertanyaan terbuka. Gagasan yang belum diterima harus tetap ditandai sebagai usulan.

Versi 1.1 menambahkan keputusan metode modular, akses kontributor, penawaran berbasis optimasi, baseline evaluasi yang adil, mekanisme bounty berbasis pengujian serta review, dan kebiasaan sinkronisasi dokumen. Ketiga kekurangan rancangan yang memicu pembahasan telah dijabarkan lebih konkret. Ini bukan bukti bahwa skor implementasi, dampak, originality atau sustainability otomatis meningkat.

Sumber PDF ringkas dan pembangkitnya disimpan di `document-tools/` agar dapat diperbarui ulang. Semua bidang keputusan tetap perlu terwakili di PDF meskipun rincian utama berada di Markdown.


## 25. Penilaian ulang rancangan versi 1.1

Evaluasi ini ditambahkan pada versi dokumen 1.2. Statusnya adalah penilaian analitis assistant, bukan keputusan pengguna, skor resmi, hasil uji, atau prediksi kemenangan. Panduan resmi [HACKATHON.md](https://nearhackathon.com/HACKATHON.md) diperiksa kembali dan menekankan reproduksibilitas serta verifikasi fitur. Tidak ditemukan bobot kelima kriteria di panduan itu.

Angka menilai kematangan rancangan terhadap lima lensa yang digunakan dalam sesi. Skala internal menunjukkan 1–3 lemah, 4–5 parsial, 6–7 cukup kuat dengan celah penting, dan 8–10 sangat kuat dengan dukungan yang sepadan. Angka tidak merupakan ukuran objektif. Fakta dokumen dan batas bukti mendasari pertimbangannya. Implementasi aktual serta usability belum dapat diberi skor dari dokumen saja. Tidak dihitung skor agregat karena bobot resmi tidak diketahui.

| Kriteria | Sebelumnya | Penilaian ulang | Dasar dan batas |
|---|---|---|---|
| Technical implementation, kesiapan rancangan | 5/10 | 6/10 | Modul, akses, antarmuka privat dan pemisahan evaluator lebih konkret. Belum ada bukti sandbox, kebijakan egress, verifikasi penerimaan dan kontrak berjalan |
| Design, rancangan pengalaman | 6/10 | 6/10 | Hasil dan peran lebih jelas, tetapi jumlah alur dan persetujuan tetap kompleks. Belum ada prototipe atau uji pengguna |
| Impact, kekuatan manfaat yang dirancang | 6/10 | 7/10 | Harga, margin, kapasitas dan jadwal memberi konsekuensi ekonomi yang dapat diperiksa. Peningkatan skor berlaku pada ketajaman manfaat dan keterukuran, bukan bukti dampak nyata |
| Originality | 6/10 | 6/10 | Kombinasi perbaikan modular dengan kasus privat tetap kandidat pembeda. Modularitas, solver dan bounty sendiri mempunyai preseden. Tidak dilakukan riset kompetitor menyeluruh baru dalam evaluasi ini |
| Sustainability | 4/10 | 4/10 | Alasan membeli lebih konkret, tetapi biaya unit, harga, pasokan metode dan permintaan berulang belum divalidasi |

Tiga perbaikan nyata pada dokumen adalah akses kontributor yang tidak lagi menuntut seluruh inti dibuka, metode yang menghasilkan keputusan terikat batas dan bukan hanya teks, serta penerimaan bounty melalui pengujian independen dan review. Hal ini menyelesaikan sebagian ketidakjelasan rancangan, bukan seluruh risiko implementasi.

Lima hal yang masih perlu dibuktikan adalah sebagai berikut.

- Komputasi privat tetap aman ketika menjalankan kandidat dari kontributor. TEE tidak dengan sendirinya mencegah kode kandidat mengekspor data melalui keluaran, jaringan atau log.
- Jadwal yang feasible berdasarkan estimasi belum tentu tepat di dunia nyata. Kualitas pemecahan brief dan estimasi tetap menentukan manfaat metode.
- Blockchain menjalankan pembayaran berdasarkan penerimaan yang sah. Pemilihan penilai, bukti dan sengketa tetap menjadi sumber kepercayaan yang harus jelas.
- Memperbaiki bug wajib pada metode berbayar mungkin merupakan tanggung jawab penjual. Pengguna belum tentu mau membiayainya lagi melalui dana komunitas. Usulan tindak lanjut adalah membedakan pemeliharaan yang ditanggung penjual dari pengembangan tambahan yang didanai bersama. Ini belum menjadi keputusan produk.
- Marketplace memerlukan metode yang layak dibeli sejak awal. Menambah segmen tidak menggantikan bukti pasokan keahlian serta kemauan membayar.

Prioritas pembuktian yang direkomendasikan adalah satu metode nyata yang dibandingkan secara adil dengan AI umum beserta bantuan hitungan, satu perbaikan kontributor yang lolos pengujian privat dan review, serta satu alur pembayaran yang dapat direproduksi. Untuk bisnis, uji apakah calon pembeli mau membayar dan apakah harga menutup komputasi serta operasional.

Kecocokan konseptual paling kuat tetap Privacy & Private AI dan Social Money, dengan syarat mekanismenya benar-benar berjalan. Open Innovation membutuhkan bukti pembeda lebih lanjut. AI Swarms tetap opsional. Kesimpulan penilaian adalah rancangan lebih koheren dan dapat diuji, namun belum terbukti unggul secara teknis, komersial atau kompetitif. Tidak ada fitur baru yang otomatis disepakati melalui evaluasi ini.


## 26. Verifikasi kompetitor dan permintaan pasar

Riset 12 November 2026. Temuan analitis, bukan persetujuan fitur baru, audit keamanan implementasi kompetitor, atau validasi penjualan produk kita. Bagian ini memperbarui keterbatasan riset pada bagian 25. Skor sebelumnya merupakan riwayat penilaian internal dan tidak otomatis berubah.

### 26.1 Pertanyaan dan batas verifikasi

Kombinasi yang diperiksa adalah metode berbayar yang dapat digunakan ulang, perlindungan data pembeli dan inti pengetahuan penjual, kontribusi modular pihak lain, pengujian regresi menggunakan kasus privat berizin, serta penerimaan dan pembayaran dari dana bersama. Lima proteksi workspace tetap bagian rancangan. Menggabungkan daftar fitur yang panjang tidak dengan sendirinya membuktikan inovasi bernilai.

Pencarian mencakup dokumentasi penyedia, halaman produk, repositori publik, survei dan studi pelanggan. Tidak ditemukan bukti publik yang cukup bahwa satu produk yang diperiksa menjalankan seluruh alur tersebut dengan teknis identik. Ini bukan bukti bahwa produk demikian tidak ada. Kesamaan TEE atau blockchain juga tidak berarti kesamaan arsitektur, kontrol keluaran, evaluator dan mekanisme penerimaan.

### 26.2 Pembanding paling relevan

| Pembanding | Preseden yang ditemukan | Batas terhadap rancangan kita |
|---|---|---|
| [iExec](https://iex.ec/) | Eksekusi rahasia aplikasi, perlindungan data dan model, akses berbayar serta penyelesaian pembayaran onchain | Belum ditemukan alur kontribusi modular yang diuji dengan kasus privat pengguna lalu dibayar dana komunitas dalam sumber yang diperiksa |
| [Ocean Compute-to-Data](https://docs.oceanprotocol.com/developers/compute-to-data/compute-to-data-datasets-algorithms) | Algoritma dapat diberi harga dan dijalankan pada dataset privat. Algoritma privat dapat dipakai tanpa diunduh, dengan izin algoritma dari pemilik data | Mendahului gagasan menjual metode tanpa menyerahkan kode/data. Dokumentasi ini tidak membuktikan keseluruhan alur perbaikan dan bounty kita, maupun jaminan TEE yang sama |
| [PIP Labs CDR demo](https://github.com/piplabs/cdr-demo) | Satu repositori berisi marketplace data, confidential AI, agent exchange dan bounty data | Demo Story Aeneid testnet. README menandai endpoint inferensi AI dan evaluasi TEE sebagai mock. Bounty data berbeda dari patch metode dan regresi privat. Tidak diverifikasi dengan menjalankan kode |
| [bount-AI](https://github.com/maulana-tech/bount-ai) | Repositori mendeskripsikan marketplace agent, WASM, eksekusi TEE dan perlindungan kredensial | Klaim README bukan audit atau bukti adopsi. Belum ditemukan seluruh mekanisme kontribusi serta dana bersama kita |
| [Productive Skills](https://productive.io/skills/) dan [Scenario Builder](https://productive.io/budgeting/scenario-builder/) | Instruksi keahlian reusable serta pembandingan skenario biaya, penugasan, waktu mulai dan ketersediaan tim | Pesaing langsung manfaat contoh demo. Belum ditemukan marketplace metode privat dengan bounty perbaikan seperti rancangan kita. Skills yang dijelaskan berbentuk instruksi, bukan bukti solver yang sama |
| [Apify](https://apify.com/partners/actor-developers) | Marketplace alat/otomasi berbayar per penggunaan, eksekusi dan distribusi bagi pembuat | Preseden kuat monetisasi otomasi reusable. Tidak membuktikan pengujian kasus privat dan perlindungan inti penjual dengan arsitektur kita |
| [Algora](https://github.com/algora-io/algora) dan [Opire](https://opire.dev/) | Infrastruktur kontribusi software dan imbalan pekerjaan | Preseden mekanisme bounty, bukan bukti permintaan untuk membayar perbaikan metode privat kita |

Kesimpulan originality yang dapat dipertanggungjawabkan adalah belum ditemukan duplikat utuh dalam pembanding yang diperiksa, tetapi beberapa gabungan penting sudah memiliki preseden. Jangan mengklaim yang pertama menggabungkan AI privat, marketplace dan bounty. Kandidat pembeda lebih spesifik adalah perbaikan metode pihak ketiga yang dinilai pada kasus pengguna tetap privat, tanpa membuka inti pengetahuan yang tidak diizinkan, lalu diterima dan dibayar melalui aturan dana bersama. Keberhasilan serta nilai tambah kombinasi itu masih perlu dibuktikan. Pergantian chain ke NEAR saja bukan pembeda manfaat.

### 26.3 Bukti kebutuhan dan batas generalisasi

| Kebutuhan | Bukti publik | Implikasi dan batas |
|---|---|---|
| Perlindungan data saat memakai AI | [Netskope](https://www.netskope.com/blog/netskope-and-glasswing-helping-protect-and-secure-ai-at-scale) melaporkan rata-rata 223 pelanggaran kebijakan data AI per bulan pada enterprise yang dipantau | Masalah operasional teramati, bukan sekadar ide. Pelanggaran kebijakan tidak selalu kebocoran yang berhasil. Sampel enterprise vendor bukan seluruh freelancer |
| Kualitas dan evaluasi agent | [LangChain](https://www.langchain.com/state-of-agent-engineering) mensurvei lebih dari 1.300 profesional. 32% menyebut kualitas sebagai hambatan utama, 52,4% memakai evaluasi offline | Mendukung kebutuhan evaluasi dan perbaikan. Survei industri vendor tidak membuktikan permintaan atas bounty privat khusus kita |
| Pembelian dan pasokan otomasi reusable | Halaman pembuat Apify melaporkan pembayaran bulanan USD 1,7 juta dan 5.600 pengembang komunitas | Sinyal transaksi dan pemasok di pasar berdekatan. Angka laporan vendor, bukan audit independen. Tidak membuktikan bahwa pembuat metode ahli kita tersedia atau angka tersebut seluruhnya pendapatan organik tanpa insentif |
| Perencanaan kapasitas dan keuangan berulang | [Studi pelanggan Saffron](https://productive.io/customer-stories/saffron-clarity-business/) menyebut penggunaan Productive selama beberapa tahun | Bukti penggunaan berkelanjutan pada segmen relevan. Studi vendor, bukan data retensi kohort atau bukti penggunaan semua fitur AI terbaru |
| Bounty perbaikan memakai kasus privat | Ada platform bounty software dan teknologi komputasi privat | Belum ditemukan bukti permintaan langsung untuk kombinasi ini dari calon segmen kita. Kemampuan teknologi dan tersedianya platform tidak sama dengan transaksi permintaan |

Koreksi terhadap kalimat sebelumnya adalah kebutuhan komponennya mempunyai bukti pasar. Yang belum tervalidasi adalah kesediaan membeli paket kita, harga yang diterima segmen kita, tersedianya metode berkualitas untuk kasus kita, retensi pembeli kita, dan pembiayaan kolaborasi privat. Pasokan pengembang otomasi tidak identik dengan pasokan ahli yang mau mengemas pengetahuan bernilai.

### 26.4 Harga dan biaya komputasi

Daftar [model NEAR AI](https://near.ai/models) saat diperiksa mencantumkan DeepSeek V4.1 Flash 1017, provider NEAR AI, kategori Private TEE, dengan harga USD 0,30 per juta token input dan USD 1,20 per juta token output. Harga dan ketersediaan dapat berubah. Ini ilustrasi biaya, bukan pemilihan model produk. Katalog juga berisi provider dan tingkat privasi lain yang tidak boleh dianggap setara.

Dengan asumsi 20.000 token input dan 4.000 token output, biaya inferensi satu panggilan adalah (20.000 × 0,30 + 4.000 × 1,20) / 1.000.000 = USD 0,0108. Lima panggilan dengan ukuran sama adalah USD 0,054. Jumlah token dan panggilan ini hipotetis, bukan pengukuran alur produk. Belum mencakup solver, OCR, eksekusi kandidat di lingkungan privat, pengujian regresi, penyimpanan, retry, reviewer, dukungan, distribusi, transaksi serta bagian pembuat metode. Inferensi murah belum membuktikan biaya total atau margin sehat.

Apify menyediakan preseden pembayaran per penggunaan. Productive mempublikasikan [paket berbayar](https://productive.io/pricing/), tetapi harga produk sejenis tidak membuktikan harga yang diterima untuk paket kita. Belum ada dasar menetapkan harga final, pendapatan, CAC, retensi atau gross margin produk ini. Total biaya harus diukur pada alur lengkap, termasuk beban perbaikan yang terjadi sesekali, bukan hanya token.

### 26.5 Implikasi dan pembuktian berikutnya

Rekomendasi analitis, belum keputusan fitur baru.

- Klaim pasar dapat menyebut bukti kebutuhan privasi, kualitas agent, otomasi berbayar dan perencanaan operasional. Jangan menyebut seluruh bisnis sudah tervalidasi.
- Demo harus memperlihatkan nilai perbaikan dengan kasus privat, bukan hanya hasil proposal yang juga ditawarkan software operasional lain.
- Uji satu metode terhadap prompt yang baik, AI dengan perhitungan, dan alur kerja pembeli saat ini. Kompetitor langsung contoh demo perlu masuk pembahasan alternatif.
- Uji permintaan secara terpisah untuk memakai metode, menjual metode dan membiayai perbaikan. Minat salah satunya tidak membuktikan dua lainnya.
- Cari komitmen pembelian/pilot berbayar dan penggunaan ulang, ukur biaya aktual serta waktu review. Tidak ada wawancara, kontak, pembelian, atau pilot yang dilakukan melalui riset ini.
- Bedakan tanggung jawab penjual atas bug dari peningkatan yang layak didanai bersama. Ini tetap pertanyaan terbuka, bukan aturan baru.

Versi 1.3 menyimpan hasil verifikasi, koreksi batas klaim originality dan sustainability, pembanding dekat, bukti kebutuhan, ilustrasi biaya serta ketidakpastian. Seluruhnya diringkas pada PDF tanpa mengganti status rancangan menjadi implementasi.


## 27. Asumsi adopsi tanpa wawancara langsung

Disepakati pengguna pada 13 November 2026. Karena pengguna tidak dapat melakukan wawancara dengan orang lain, bukti kebutuhan pasar pada bagian 26 digunakan sebagai dasar asumsi bahwa orang bersedia menggunakan produk. Asumsi ini cukup untuk melanjutkan perancangan, tetapi bukan hasil validasi langsung. Jangan menyebut sudah ada pengguna, komitmen pembelian atau permintaan terbukti atas keseluruhan paket. Kesediaan menggunakan tidak otomatis membuktikan kesediaan membayar harga tertentu maupun mendanai perbaikan bersama. Wawancara bukan prasyarat melanjutkan pekerjaan.

Penjelasan ketidakpastian yang dimaksud pada evaluasi sebelumnya adalah sebagai berikut.

- Nilai tambahan kolaborasi privat berarti belum diketahui seberapa besar manfaat yang dirasakan pengguna ketika kontributor dapat memperbaiki metode dengan pengujian kasus privat, dibanding pembuat metode memperbaikinya sendiri. Contohnya adalah apakah bug khusus kasus klien bisa diselesaikan lebih cepat atau lebih tepat tanpa menyerahkan dokumen klien kepada kontributor.
- Ekonomi paket berarti belum diketahui apakah pendapatan dari harga yang bersedia dibayar pengguna cukup menutup komputasi, bagian pembuat metode, pengujian, review serta operasional. Tidak diperlukan wawancara untuk membuat asumsi awal, tetapi angka tersebut tetap asumsi sampai ada bukti.

Versi 1.4 mencatat keputusan penggunaan asumsi adopsi dan memperjelas dua ketidakpastian. Tidak ada perubahan fitur atau penetapan harga.


## 28. Kritik asumsi kolaborasi dan estimasi kelayakan ekonomi

Riset dan estimasi 13 November 2026. Angka harga, alokasi dan pembatasan berikut adalah usulan analitis, bukan keputusan pengguna atau hasil benchmark. Keputusan melanjutkan berdasarkan asumsi kebutuhan tetap berlaku. Tidak diperlukan wawancara sebagai prasyarat.

### 28.1 Kritik terhadap analogi ekosistem kontribusi

Pengguna berpendapat kontribusi bisa lebih baik atau tidak dibanding maintainer, sehingga tidak perlu terlalu dipikirkan. Kritik assistant adalah kita tidak perlu membuktikan kontributor selalu lebih cepat/unggul untuk membenarkan fitur. Nilai dapat berupa pilihan pemberi solusi, tambahan kapasitas atau keberlanjutan saat pembuat asli tidak tersedia. Pembanding kecepatan saja terlalu sempit.

Namun, keberadaan ekosistem kontribusi tidak membuktikan kolaborasi tanpa biaya. [Zcash Community Grants](https://zcashcommunitygrants.org/selection/) memakai review komunitas dan komite serta milestone. Analogi mendukung kemungkinan organisasinya, bukan pengabaian biaya penerimaan. Pada produk kita, data dan inti metode yang tersembunyi menambah kebutuhan reproduksi sintetis, pembatasan hasil dan pemeriksaan kandidat.

Rekomendasi adalah tidak menjadikan pembuktian keunggulan universal sebagai penghambat. Tetap tetapkan siapa menerima perubahan, anggaran review/pengujian dan langkah jika tidak ada kandidat layak. Kontributor opsional, penerimaan perubahan tetap wajib memenuhi kriteria. Klaim lebih cepat atau lebih baik tidak dibuat sebelum diukur. Ini penilaian assistant, bukan perubahan aturan yang otomatis disetujui.

### 28.2 Dasar harga publik

- [NEAR AI](https://near.ai/models), diperiksa ulang, mencantumkan DeepSeek V4.1 Flash 1017 Private TEE USD 0,30 input dan USD 1,20 output per juta token. Contoh lima panggilan masing-masing 20.000 input/4.000 output menghasilkan USD 0,054. Semua pemakaian token berbayar termasuk penalaran yang ditagih harus masuk pengukuran aktual. Pemilihan model belum diputuskan.
- [OutLayer](https://app.outlayer.ai/docs/pricing) menyatakan biaya menurut base fee, instruksi dan waktu, dengan metode estimasi sebelum eksekusi. Halaman tidak memberi satu tarif USD universal. Anggaran runtime di bawah adalah asumsi, bukan kutipan harga OutLayer. Dukungan solver/WASM dan waktu maksimum perlu diuji. Eksekusi gagal dapat tetap dikenai biaya.
- [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) mempublikasikan storage standar USD 0,015/GB-bulan, di luar operasi tertentu. Ini hanya pembanding penyimpanan ciphertext, bukan pilihan stack atau jaminan komputasi privat.
- [Stripe](https://stripe.com/pricing?locale=en-US) mempublikasikan 2,9% + USD 0,30 untuk kartu domestik AS pada harga standar. Dipakai sebagai pembanding biaya penagihan satu paket, bukan asumsi Stripe tersedia bagi badan usaha pengguna. Pembayaran lokal, lintas batas, payout marketplace, konversi aset, pajak dan biaya tambahan perlu dihitung sesuai implementasi.
- [Upwork](https://www.upwork.com/hire/software-qa-testers/cost/) menampilkan kisaran QA umum USD 12–20/jam. Itu bukan tarif auditor keamanan. Model mengasumsikan review teknis USD 40/jam, belum penawaran tenaga ahli.

### 28.3 Model biaya penggunaan rutin

Unit adalah satu pekerjaan terbatasi yang dapat memakai beberapa panggilan model, bukan satu pesan chat. Contoh paket hipotetis USD 29 per pengguna per bulan dengan 50 pekerjaan standar. Tidak termasuk browser panjang, dokumen tak terbatas, model premium atau review manusia pada tiap hasil. Biaya dan kelayakan seluruh fitur berat belum terbukti oleh model pekerjaan standar ini.

Asumsi pembagian dari pembayaran bruto adalah 30% untuk pembuat metode dan 10% untuk dana perbaikan. Keduanya dikurangkan dari kas yang tersedia bagi platform. Pembagian per metode mengikuti penggunaan dan kesepakatan, belum ditetapkan. Dana komunitas bukan laba platform, sehingga bounty yang dibayar dari dana ini tidak dikurangkan lagi sebagai biaya rutin platform.

Anggaran dasar USD 0,15 per pekerjaan terdiri dari inferensi USD 0,054, retry sekitar 25% biaya inferensi USD 0,0135, runtime/solver privat USD 0,03, OCR/ekstraksi/pemeriksaan tambahan USD 0,02, storage/log/jaringan/transaksi teralokasi USD 0,01, dan cadangan ketidakpastian USD 0,0225. Selain inferensi pada token hipotetis, angka tersebut merupakan alokasi anggaran yang perlu benchmark, bukan tarif vendor terverifikasi. OCR atau pemrosesan sensitif tidak boleh dipindahkan ke layanan nonprivat demi memenuhi anggaran.

| Komponen per pengguna per bulan | USD |
|---|---:|
| Pembayaran bruto | 29,00 |
| 50 pekerjaan × 0,15 | 7,50 |
| Bagian pembuat 30% | 8,70 |
| Dana perbaikan 10% | 2,90 |
| Penagihan 2,9% + 0,30 | 1,141 |
| Dukungan variabel, asumsi | 2,00 |
| Cadangan refund/risiko 2%, asumsi | 0,58 |
| Total pengeluaran/alokasi variabel | 22,821 |
| Sisa kontribusi sebelum biaya tetap | 6,179 |

Sisa kontribusi sekitar 21,3% pembayaran bruto, bukan laba bersih atau gross margin akuntansi. Dukungan USD 2 setara tiga menit per pengguna per bulan pada tarif USD 40/jam, sehingga dukungan intensif akan mengubah hasil. Biaya integrasi, pengembangan, keamanan dan gaji tidak tersembunyi dalam angka ini, melainkan memerlukan anggaran tetap terpisah.

### 28.4 Sensitivitas dan ambang impas

| Skenario, 50 pekerjaan pada harga USD 29 | Biaya per pekerjaan | Sisa kontribusi bulanan |
|---|---:|---:|
| Ringan | USD 0,05 | USD 11,179 atau 38,5% |
| Dasar | USD 0,15 | USD 6,179 atau 21,3% |
| Berat | USD 0,40 | Minus USD 6,321 |

Rumus sisa kontribusi adalah 0,551 × harga paket − jumlah pekerjaan × biaya pekerjaan − 2,30. Berlaku hanya untuk persentase dan asumsi pembayaran di atas. Pada harga 29 dan 50 pekerjaan, batas biaya per pekerjaan sebelum kontribusi nol adalah USD 0,27358. Untuk mempertahankan kontribusi 20%, batasnya USD 0,15758. Pada biaya dasar, paket 19 memberi USD 0,669, paket 39 memberi USD 11,689. Jadi harga 29 masih cukup sensitif, bukan margin yang sangat longgar.

Biaya tetap hipotetis USD 300/bulan, hanya operasi teknis ramping tanpa gaji tim, memerlukan 49 pembayar pada skenario dasar. Anggaran tetap USD 3.000/bulan memerlukan 486 pembayar. Ini contoh anggaran, bukan harga pasar tim atau ramalan pertumbuhan. Biaya akuisisi pelanggan, pajak dan investasi awal pembangunan/audit belum tercakup. Contoh CAC USD 30 memerlukan sekitar 4,9 bulan kontribusi dasar untuk kembali, sebelum memperhitungkan biaya tetap dan churn. Tambahan dukungan USD 5 mengurangi kontribusi dasar menjadi USD 1,179. Jika bagian pembuat menjadi 50%, kontribusi dasar tinggal USD 0,379.

### 28.5 Ekonomi perbaikan dan kecukupan dana

Contoh satu perbaikan sederhana menganggarkan bounty USD 300, review satu jam USD 40, tiga kandidat × 100 kasus uji × USD 0,15 = USD 45, serta USD 5 untuk administrasi/transaksi, total USD 390. Ini asumsi, bukan harga bug fix umum. Kasus uji bisa lebih murah jika deterministik, atau jauh lebih mahal jika banyak pemanggilan AI. Audit keamanan kompleks tidak tercakup. Jumlah kandidat harus dibatasi karena kegagalan juga memakan anggaran.

Pada kontribusi dana USD 2,90 per pengguna-bulan, diperlukan 135 pengguna-bulan ekuivalen yang dialokasikan ke metode tersebut untuk membiayai satu perbaikan USD 390. Seratus pembayar menghasilkan USD 290 per bulan hanya jika seluruh alokasi masuk ke dana yang sama. Banyak metode berbagi pengguna, sehingga jumlah pengguna platform tidak sama dengan jumlah pendukung suatu metode. Sebagai sensitivitas, 10 jam review × USD 100/jam akan menaikkan total menjadi USD 1.350 dan memerlukan 466 pengguna-bulan ekuivalen.

Dana cukup bukan jaminan ada kontributor dengan kompetensi yang bersedia menerima bounty. Untuk awal, usulan adalah membuka bounty hanya setelah dana memadai, memakai sponsor/top-up eksplisit jika dibutuhkan, dan memisahkan tanggung jawab pemeliharaan penjual dari peningkatan komunitas. Tidak menjanjikan perbaikan tak terbatas atau menganggap subsidi hackathon sebagai pendapatan rutin. Semua ini rekomendasi, belum kebijakan final.

### 28.6 Kesimpulan feasibility

Layak secara aritmetika pada skenario pekerjaan standar dengan batas penggunaan, model yang sesuai dan pembagian pendapatan tertentu. Belum terbukti layak untuk seluruh fitur, skenario berat atau skala bisnis. Risiko dominan adalah kualitas model yang memerlukan biaya lebih tinggi, dukungan/review manusia, pembagian pendapatan penjual, dan dana yang terfragmentasi antar metode.

Usulan awal adalah menguji paket setara USD 29 untuk 50 pekerjaan standar, menerapkan kredit berbobot atau tarif terpisah bagi pekerjaan berat, menagih paket/saldo alih-alih kartu per panggilan, dan memisahkan anggaran perbaikan. Ini bukan penetapan harga final atau bukti kemauan membayar. Benchmark berikutnya dapat dilakukan tanpa wawancara dengan mencatat biaya, retry, latency, review dan hasil pada skenario contoh yang sama. Artefak asumsi skenario tersedia di `document-tools/economics-scenarios.json`.


## 29. Harga per metode dan pembayaran infrastruktur oleh pengguna

Arahan pengguna pada 13 November 2026 menggantikan asumsi paket pada bagian 28 sebagai arah model harga. Setiap pembuat menentukan harga metodenya sendiri saat publikasi. Biaya infrastruktur ditambahkan dan dibayar pengguna metode sejak awal. Tidak memakai satu harga paket universal atau bagian pembuat tetap 30% sebagai keputusan. Angka pada bagian 28 dipertahankan hanya sebagai simulasi historis.

Pengguna membatasi estimasi biaya tetap pada server, database dan domain, tanpa gaji tim. Pengeluaran penggunaan seperti inferensi dan runtime tetap dihitung sebagai biaya infrastruktur yang dibebankan pada pemakai. Tidak menghitung gaji bukan bukti bahwa pekerjaan manusia tidak diperlukan. Ini batas cakupan estimasi, bukan klaim seluruh biaya perusahaan atau audit telah tertutup.

### Usulan alur harga

1. Pembuat memasukkan harga keahliannya saat publikasi, dengan penagihan per eksekusi sebagai usulan awal. Pengujian contoh dan batas input membantu sistem memperkirakan infrastruktur. Unit penagihan final belum ditetapkan.
2. Sistem memperlihatkan perkiraan total dan komponennya. Tarif pembuat dapat tetap, tetapi infrastruktur dipengaruhi dokumen, model, jumlah langkah dan percobaan ulang. Perkiraan saat publikasi bukan jaminan harga sama untuk semua masukan.
3. Sebelum eksekusi, pengguna melihat harga pembuat, perkiraan infrastruktur dan batas maksimum pembayaran. Usulan adalah membayar atau mencadangkan saldo terlebih dahulu. Sistem tidak boleh melampaui batas tanpa persetujuan baru.
4. Setelah eksekusi, biaya aktual diselesaikan dan sisa cadangan dikembalikan atau dilepas. Penagihan biaya saat eksekusi gagal, refund harga metode dan mekanisme saldo masih perlu ditetapkan. Ini rekomendasi implementasi, belum keputusan final.

Contoh hipotetis, bukan tarif resmi, adalah harga pembuat USD 1,00 ditambah anggaran infrastruktur USD 0,15, menghasilkan perkiraan USD 1,15 sebelum komisi platform, dana komunitas atau biaya pembayaran bila ada. Harga metode lebih tinggi tetap mengikuti pilihan pembuat. Asumsi ini tidak menjamin harga diterima pembeli.

### Biaya bersama dan pendapatan platform

Infrastruktur perlu membedakan biaya langsung per eksekusi dari biaya bersama server/database/domain. Penggantian biaya AI saja tidak menutup biaya bersama. Usulan adalah alokasi transparan biaya bersama pada pemakaian atau biaya platform yang terpisah. Pembuat tidak harus mendanai komputasi pengguna di muka, tetapi platform tetap perlu modal kerja untuk server/database/domain sebelum volume transaksi memadai.

Jika biaya bersama bulanan hipotetis USD 30, pada 1.000 eksekusi alokasinya USD 0,03 per eksekusi, sedangkan pada 100 eksekusi USD 0,30. Angka USD 30 hanya ilustrasi pembagian, bukan hasil riset harga infrastruktur. Pemakaian bervariasi dapat membutuhkan alokasi berbobot, bukan pembagian rata.

Mengembalikan seluruh harga ke pembuat dan seluruh penggantian infrastruktur ke penyedia tidak otomatis menghasilkan pendapatan platform atau dana komunitas. Komisi, markup transparan, dan sumber dana perbaikan tetap terbuka. Pembagian 30%/10% simulasi sebelumnya tidak berlaku otomatis. Pendanaan bersama tetap arah produk, tetapi cara mendanainya harus disesuaikan dengan harga per metode.

Kesimpulan assistant adalah arah ini lebih sesuai dengan variasi nilai dan beban metode daripada satu paket seragam. Feasibility belum dihitung ulang sebagai tarif final. Dokumen ini mencatat arah pengguna serta membedakan usulan mekanisme dan keputusan yang masih terbuka.


## 30. Konsolidasi model bisnis terkini

Versi 1.7, 13 November 2026. Pengguna menyetujui arah harga per metode pada bagian 29 dan meminta dokumentasi lengkap. Bagian ini menjadi acuan bisnis terkini. Bagian 28 mempertahankan riwayat simulasi, bukan dasar harga yang berlaku. Detail yang belum diputuskan ditandai terbuka atau usulan.

### 30.1 Nilai dan pihak yang dilayani

| Pihak | Nilai yang ditawarkan | Peran ekonomi |
|---|---|---|
| Pemakai metode, individu atau tim | Menggunakan keahlian spesialis pada data sensitif tanpa otomatis menyerahkan dokumen kepada pembuat | Membayar penggunaan metode dan infrastruktur |
| Pembuat metode | Mengemas keahlian menjadi metode yang dapat digunakan berulang dengan inti privat sesuai pengaturan akses | Menentukan harga, menerima pembayaran menurut ketentuan transaksi |
| Kontributor | Memperbaiki modul yang dibuka, dengan pengujian privat yang diizinkan | Mendapat bounty setelah perubahan diterima. Royalti hanya jika disepakati terpisah |
| Pendukung perbaikan | Mengumpulkan dana untuk perubahan yang dianggap bermanfaat | Menyumbang atau mengalokasikan dana melalui aturan bersama |
| Platform | Menyediakan workspace, distribusi metode, perlindungan data, pengukuran penggunaan dan koordinasi perbaikan | Mengganti biaya infrastruktur dan memperoleh pendapatan bila biaya/komisi platform ditetapkan |

Segmen meliputi freelancer, agensi, koordinator proyek, usaha kecil dan profesional dengan data sensitif. Contoh penawaran dan negosiasi berbasis kapasitas hanya satu ilustrasi. Pasar eksklusif belum dipilih. Pengguna tidak wajib menjadi penjual, kontributor atau peserta tata kelola untuk memperoleh manfaat.

### 30.2 Komponen model bisnis

| Komponen | Rancangan atau status |
|---|---|
| Nilai utama | Pekerjaan privat, metode spesialis reusable, perbaikan kolaboratif berizin |
| Segmen | Pemakai individu/tim dan pemasok keahlian. Asumsi kebutuhan didukung riset bagian 26 |
| Kanal | Aplikasi dan marketplace sebagai kanal pemakaian/pembelian. Komunitas profesional, pembuat metode dan demo sebagai usulan akuisisi, belum kanal yang terbukti |
| Hubungan pengguna | Penggunaan mandiri, harga terlihat sebelum berjalan, riwayat versi serta transaksi. Dukungan dan proses sengketa perlu ditentukan |
| Aktivitas utama | Publikasi dan penemuan metode, eksekusi privat, estimasi/pengukuran biaya, penyelesaian pembayaran, pengujian dan review perubahan |
| Sumber daya | Metode berkualitas, aplikasi, kebijakan privasi, runtime privat, pencatatan biaya, mekanisme penerimaan serta dana awal infrastruktur |
| Pemasok dan ekosistem | Pembuat, kontributor, reviewer, penyedia AI/runtime/storage dan jaringan NEAR. Nama penyedia adalah kandidat teknologi, bukan kemitraan komersial yang sudah ada |
| Struktur biaya | Biaya tetap server/database/domain, biaya langsung pemakaian, serta anggaran perbaikan terpisah |
| Pemasukan | Pembayaran pemakai untuk harga metode dan infrastruktur. Pendapatan platform dari biaya/komisi masih terbuka. Dana komunitas dikelola terpisah |

### 30.3 Harga yang disetujui dan alur transaksi

**Disepakati.** Setiap metode mempunyai harga yang ditentukan pembuat saat publikasi. Sistem menambahkan infrastruktur dan pengguna metode menyediakan pembayaran sejak awal. Tidak ada satu harga universal atau persentase bagian pembuat yang telah ditetapkan.

**Usulan penjabaran alur yang diterima sebagai arah pembahasan.** Pembuat mengisi harga serta kebutuhan metode, sistem menampilkan estimasi infrastruktur. Sebelum pemakaian, perkiraan dihitung sesuai masukan pengguna, karena ukuran dokumen, model dan jumlah langkah dapat berbeda. Pengguna melihat rincian total dan batas maksimum yang disetujui. Mekanisme reservasi saldo, penagihan aktual dan pengembalian sisa perlu dipilih saat implementasi. Unit per eksekusi merupakan usulan awal dan belum keputusan final.

Urutan transaksi yang direkomendasikan adalah publikasi harga → estimasi pekerjaan → persetujuan rincian dan batas pembayaran → pembayaran/reservasi → eksekusi terbatasi → pencatatan biaya aktual → penyelesaian dan distribusi → pelepasan sisa bila memakai reservasi. Perubahan harga tidak boleh mengubah tagihan pekerjaan yang telah disetujui. Ketentuan snapshot harga ini rekomendasi implementasi.

### 30.4 Pemisahan uang dan pendapatan

Rumus konseptual total adalah harga metode + infrastruktur langsung + alokasi infrastruktur bersama, ditambah biaya platform, kontribusi dana dan biaya pembayaran bila kebijakan menetapkannya. Setiap komponen harus dihitung sekali. Jika komisi dipotong dari harga metode, jangan sekaligus menambahkannya lagi ke tagihan tanpa aturan yang jelas.

Contoh ilustrasi adalah harga metode USD 1,00 dan infrastruktur USD 0,15, sehingga subtotal USD 1,15. Contoh ini belum mencakup komisi, kontribusi dana atau biaya pembayaran. Pembuat metode lain boleh memilih harga berbeda. Infrastruktur bukan angka tetap yang dijamin untuk semua masukan.

| Tujuan uang | Perlakuan |
|---|---|
| Harga metode | Hak pembuat sesuai harga serta potongan yang disepakati. Dasar harga bruto/neto perlu diputuskan |
| Infrastruktur | Membayar sumber daya langsung dan alokasi biaya bersama yang ditampilkan |
| Biaya/komisi platform | Kandidat pendapatan platform, skema serta besarannya terbuka |
| Dana perbaikan | Dana beranggaran untuk penerimaan dan pembayaran perbaikan, bukan laba platform |
| Bounty | Dibayar kepada kontributor setelah penerimaan sah, dari anggaran yang telah dialokasikan |

Menagih pengguna di awal mengurangi kebutuhan pembuat menalangi biaya pemakaian. Server/database/domain tetap memerlukan dana awal sebelum transaksi cukup. Model baru belum menghasilkan angka profit atau impas sampai biaya platform dan aturan alokasi dipilih.

### 30.5 Biaya dan pendanaan perbaikan

**Lingkup estimasi yang disetujui pengguna.** Biaya tetap hanya server, database dan domain. Gaji tim dikeluarkan dari perhitungan. Penggunaan model, runtime/solver privat, OCR, penyimpanan serta transaksi tetap masuk estimasi infrastruktur sesuai kebutuhan. Jangan menghitung server/storage yang sama dua kali pada biaya tetap dan biaya penggunaan.

Contoh anggaran bersama USD 30 per bulan menghasilkan alokasi USD 0,03 pada 1.000 eksekusi atau USD 0,30 pada 100 eksekusi, dengan asumsi pembagian rata. Ini ilustrasi matematika, bukan harga vendor. Penggunaan tidak seragam bisa memerlukan alokasi berbobot.

Perbaikan punya anggaran terpisah untuk bounty, pengujian kandidat, review dan transaksi. Sumbernya masih terbuka, dapat berupa alokasi transaksi yang disetujui, kontribusi sukarela atau sponsor. Pembahasan sebelumnya menerima arah pendanaan bersama, bukan persentase final. Pengujian/review perbaikan tidak disisipkan otomatis ke biaya setiap pemakaian tanpa kebijakan. Reviewer berbayar bila diperlukan masuk anggaran perbaikan, bukan gaji tim rutin. Jangan membukukan pengeluaran bounty dua kali setelah dananya dialokasikan.

### 30.6 Ketentuan yang masih harus dipilih

- Satuan harga metode dan dasar bruto/neto, penggantian harga, trial serta metode gratis bila nantinya didukung.
- Biaya platform, alokasi infrastruktur bersama, sumber dan besaran kontribusi dana perbaikan.
- Pembayaran/reservasi, aset dan konversi, minimum saldo, biaya pembayaran serta penarikan pembuat.
- Biaya eksekusi gagal, retry, pembatalan, refund harga metode, pengembalian cadangan dan sengketa. Biaya vendor yang sudah terpakai tidak otomatis dapat dikembalikan.
- Batas input, langkah, waktu dan biaya. Prosedur jika estimasi tidak cukup, tanpa menagih melebihi persetujuan.
- Tanggung jawab bug penjual dibanding peningkatan komunitas, anggaran reviewer dan otoritas penerimaan.
- Harga pemakaian workspace tanpa metode marketplace, karena produk juga harus bermanfaat bagi pemakai workspace. Belum ada skema final untuk alur ini.

### 30.7 Ukuran kelayakan dan pekerjaan berikutnya

Asumsi orang bersedia menggunakan produk diterima berdasarkan bukti kebutuhan pasar. Harga aktual yang diterima dan penggunaan ulang tetap asumsi. Tidak memerlukan wawancara untuk melanjutkan perancangan.

Ukur pembayaran bruto, hak pembuat, biaya infrastruktur aktual, uang platform tersisa setelah biaya, dana per metode, biaya satu perbaikan, kegagalan/retry dan selisih estimasi. Ukuran tersebut membantu menilai keberlanjutan tanpa menyamakan volume transaksi atau saldo dana dengan keuntungan. LTV/CAC belum dapat dihitung karena retensi dan biaya akuisisi belum tersedia.

Usulan urutan kerja berikutnya adalah menuntaskan aturan biaya platform dan dana perbaikan, menentukan satu metode contoh beserta data sintetis serta kriteria hasil, memilih batas MVP dan alur demo, lalu membuktikan eksekusi privat, biaya serta pembayaran dalam satu alur yang dapat diperiksa. Ini rekomendasi urutan, bukan fitur baru yang otomatis disetujui.


## 31. Usulan metode contoh untuk dinilai pengguna

> **Digantikan.** Contoh ini tidak lagi menjadi metode demo. Metode demo MVP adalah portofolio (bagian 0 dan 48). Isi di bawah disimpan sebagai riwayat.

Status usulan, 13 November 2026. Pengguna mengizinkan melanjutkan perancangan satu metode konkret. Rincian di bawah belum disetujui sebagai spesifikasi final. Ini contoh sintetis, bukan metode milik praktisi yang sudah terbukti laku atau unggul. Perubahan dokumentasi tidak berarti aplikasi atau solver telah dibangun.

### 31.1 Pendekatan dan rekomendasi

Tiga pendekatan adalah penulis proposal, kalkulator harga minimum, dan penyusun alternatif lingkup-harga-jadwal. Pendekatan pertama mudah dipahami tetapi sukar dibedakan dari prompt biasa. Pendekatan kedua terukur namun belum menyelesaikan konflik kebutuhan. Rekomendasi adalah pendekatan ketiga karena dapat menunjukkan keputusan yang konsekuensinya dapat diperiksa.

Nama kerja metode adalah Penawaran Layak dan Strategi Konsesi. Pemakainya freelancer atau agensi yang menerima brief, anggaran serta tenggat yang tidak selalu cocok. Tujuannya menentukan pekerjaan yang layak dijanjikan dan perubahan yang perlu dinegosiasikan. Contoh ini tidak membatasi seluruh pasar produk.

### 31.2 Masukan dan asumsi sintetis

Contoh adalah proyek website dengan anggaran klien Rp15 juta dan tenggat dua minggu. Angka biaya proyek di sini berbeda dari biaya memakai metode marketplace.

- Lingkup inti 80 jam, tambahan dashboard analitik 20 jam, total 100 jam. Rincian pekerjaan, ketergantungan serta estimasi perlu ditinjau pemakai sebelum dianggap mengikat.
- Kapasitas tim yang benar-benar tersedia adalah 80 jam selama dua minggu dan 120 jam selama tiga minggu, setelah proyek aktif dan cuti diperhitungkan.
- Tarif biaya internal gabungan Rp100.000/jam. Tenaga tambahan yang telah dikonfirmasi tersedia untuk tugas yang cocok sebanyak 20 jam dengan biaya Rp180.000/jam.
- Cadangan risiko 20% atas biaya tenaga. Margin proyek minimum 30% setelah cadangan, dihitung sebagai (harga penawaran − biaya beserta cadangan) / harga penawaran. Ini kebijakan sintetis, bukan rumus wajib semua metode atau margin laba bersih perusahaan.
- Tidak ada biaya lain dalam contoh hitungan sederhana. Pada pemakaian nyata, lisensi, pajak, overhead, biaya metode dan biaya lain yang relevan harus dimasukkan atau ditandai belum tersedia. Kecukupan jam agregat adalah syarat perlu, belum bukti jadwal per orang/tugas feasible.

### 31.3 Aturan keputusan

1. Ekstrak lingkup, kebutuhan wajib, anggaran, tenggat dan revisi dari brief. Informasi ambigu menjadi pertanyaan atau asumsi yang terlihat, bukan fakta tersembunyi.
2. Cocokkan pekerjaan dengan estimasi, ketergantungan, keahlian dan kapasitas. Pengguna meninjau estimasi. Saat rincian jadwal belum cukup, beri status kandidat, belum jadwal terverifikasi.
3. Hitung biaya tiap alternatif dan harga minimum = biaya termasuk cadangan / (1 − margin minimum). Bulatkan harga ke atas, jangan membulatkan sehingga melanggar margin.
4. Pertahankan kebutuhan wajib. Usulkan pengurangan tambahan opsional terlebih dahulu, kemudian perubahan jadwal, lalu tenaga tambahan bila disetujui dan tersedia. Urutan ini strategi contoh yang dapat dipersonalisasi, bukan aturan universal.
5. Tolak kombinasi yang melanggar batas. Bila tidak ada alternatif yang memenuhi seluruh batas, nyatakan konflik dan perubahan yang perlu disetujui. Jangan diam-diam mengganti anggaran atau menghapus kebutuhan wajib.
6. Hasil yang dibagikan ke klien berisi lingkup, harga, jadwal, batas revisi dan syarat perubahan. Tarif internal, margin dan strategi konsesi tetap di tampilan privat. Pengiriman eksternal mengikuti persetujuan tindakan.

### 31.4 Keluaran yang dihitung

| Kandidat | Biaya beserta cadangan | Harga penawaran contoh | Waktu | Syarat |
|---|---:|---:|---|---|
| Sesuai anggaran | 80 × Rp100.000 × 1,2 = Rp9,6 juta | Rp15 juta | Dua minggu | Dashboard analitik 20 jam ditunda dan harus opsional |
| Lingkup lengkap | 100 × Rp100.000 × 1,2 = Rp12 juta | Rp17,2 juta | Tiga minggu | Klien menyetujui tambahan anggaran dan waktu |
| Lingkup lengkap dipercepat | (80 × Rp100.000 + 20 × Rp180.000) × 1,2 = Rp13,92 juta | Rp20 juta | Dua minggu | Klien menyetujui tambahan anggaran dan tenaga tambahan yang sesuai |

Margin setelah cadangan masing-masing 36%, sekitar 30,23% dan 30,4%. Harga minimum opsi lengkap adalah sekitar Rp17,143 juta dan opsi dipercepat Rp19,886 juta. Ketiga pilihan adalah kandidat berdasarkan biaya dan kapasitas agregat, bukan jadwal terverifikasi atau jaminan penyelesaian.

Permintaan awal seluruh lingkup Rp15 juta dalam dua minggu tidak memenuhi batas contoh. Bahkan sebelum penjadwalan rinci, kapasitas internal kurang 20 jam dan margin harga Rp15 juta pada biaya lengkap Rp12 juta hanya 20%. Bila dashboard wajib, opsi pertama gugur. Jika tenggat, harga, lingkup dan tenaga tidak boleh berubah, hasilnya tidak layak.

Saat klien meminta potongan harga opsi lengkap menjadi Rp15 juta, metode tidak sekadar menulis balasan persuasif. Metode menunjukkan opsi mengurangi lingkup 20 jam dengan persetujuan, atau mempertahankan batas harga lengkap. Perpanjangan waktu sendiri tidak otomatis menurunkan jumlah jam atau biaya. Revisi dan pekerjaan tambahan harus memiliki batas eksplisit dalam penawaran.

### 31.5 Modul, kontribusi dan pembuktian

Inti privat dapat memuat aturan pemecahan brief, model estimasi berbasis pengalaman serta strategi konsesi pembuat. Dalam contoh ini aturan yang dipublikasikan adalah dokumentasi sintetis, bukan rahasia bisnis nyata. Modul biaya dan penjadwalan yang ditunjuk dapat dibuka untuk kontribusi. Data klien, tarif, proyek aktif dan cuti tetap privat. Evaluator penerimaan independen dari patch.

Contoh masalah adalah kapasitas yang tidak mengurangi jam cuti. Kontributor mendapat contoh sintetis dan mengirim patch modul kapasitas. Pengujian privat berizin memeriksa tidak ada tugas saat cuti, tidak ada benturan, biaya/margin benar, kebutuhan wajib tidak hilang, dan kasus tidak layak dilaporkan. Bukti penerimaan yang sah menjadi dasar pembayaran bounty. Rumus sederhana serta solver umum bukan bukti keahlian eksklusif.

Ukur hasil terhadap prompt yang baik dan AI dengan bantuan perhitungan pada masukan yang sama, termasuk semua aturan yang memang diberikan kepada tiap pembanding. Pisahkan pengaruh aturan metode dari keandalan alat. Gunakan kasus anggaran cukup, kurang anggaran, cuti, kebutuhan wajib, konflik kapasitas dan ketidaklayakan. Ukur pelanggaran batas, ketepatan hitungan, informasi ambigu, waktu, biaya eksekusi dan koreksi manusia. Tidak ada hasil benchmark atau klaim kemenangan bisnis pada tahap ini.

Rekomendasi berikutnya adalah menilai kecocokan contoh ini, lalu menentukan rincian tugas dan kalender sintetis untuk membuktikan jadwal, bukan menambahkan fitur baru. Harga penggunaan metode tetap ditentukan pembuat ditambah infrastruktur sesuai bagian 30.


## 32. Eksplorasi metode dengan konsekuensi lebih penting

Koreksi pengguna, 13 November 2026. Contoh penawaran website pada bagian 31 belum dirasa cukup krusial dan bermanfaat. Pemilihan contoh utama dibuka kembali. Pengguna memberi ilustrasi pemilihan framework yang sesuai untuk suatu masalah dengan alasan jelas dan akurasi tinggi. Ilustrasi itu salah satu kemungkinan, bukan kewajiban membatasi semua metode pada rekomendasi framework. Arah produk serta harga pembuat + infrastruktur tetap berlaku. Kandidat berikut usulan, belum pilihan final.

### Kriteria pemilihan

Cari masalah yang berdampak pada pelanggan, operasi atau pengambilan keputusan penting, muncul berulang, membutuhkan data privat dan mempunyai keluaran yang dapat ditindaklanjuti. Metode bernilai harus menunjukkan bukti, hipotesis alternatif, kondisi kecocokan pendekatan, tindakan dan cara menguji hasil. Sekadar menyebut nama framework masih mudah digantikan prompt umum. Akurasi tinggi adalah sasaran yang perlu diukur, bukan fakta produk.

### Kandidat pertama, menangani kegagalan operasional berulang

Contoh bisnis jasa atau toko online terus salah mengirim pesanan meskipun tim sudah diingatkan. Masukan adalah keluhan, SOP, log proses dan catatan perubahan. Metode membantu membedakan masalah instruksi, serah-terima, kapasitas atau kontrol proses. Keluaran berisi pendekatan yang disarankan, alasan dibanding alternatif, tindakan penahanan dampak, bukti tambahan dan rencana pemeriksaan perbaikan.

Pemilihan 8D dapat dipertimbangkan untuk masalah berulang lintas fungsi yang membutuhkan penanganan sementara dan tindakan korektif terverifikasi. DMAIC dapat dipertimbangkan untuk perbaikan proses dengan pengukuran yang memadai. Keduanya dapat menggunakan alat analisis lain, sehingga bukan kategori yang selalu saling eksklusif. Aturan pemilihan merupakan usulan desain yang harus ditinjau praktisi.

Nilai berbayar yang ingin dibuktikan adalah membantu pengguna memilih tindakan yang menyasar masalah dengan alasan dan bukti yang dapat diperiksa. Tidak boleh menyatakan akar penyebab pasti hanya dari korelasi atau satu keluhan. Ukur keterlacakan bukti, ketepatan fakta, kecukupan data dan hasil review praktisi. Dampak penurunan kejadian membutuhkan pemantauan nyata.

### Kandidat kedua, menyelidiki pelanggan yang berhenti membeli

Contoh pembelian ulang menurun dan pemilik hendak memberi diskon besar. Masukan privat mencakup transaksi, periode pelanggan, keluhan, pengiriman dan perubahan produk. Metode memeriksa segmen serta waktu munculnya penurunan, lalu membandingkan hipotesis harga, pengalaman awal, mutu atau layanan.

Keluaran dapat menyarankan analisis cohort terlebih dahulu, kemudian eksperimen penanganan kelompok terdampak. Bila keterlambatan layanan merupakan hipotesis yang didukung, uji perbaikannya sebelum subsidi harga menyeluruh. Ini contoh bersyarat, bukan kesimpulan dari dataset yang sudah dianalisis. Alasannya bernilai adalah membantu menghindari pengeluaran yang tidak menyasar masalah dan memprioritaskan tindakan. Mengidentifikasi pola tidak membuktikan sebab atau menjamin retensi naik.

### Kandidat ketiga, menentukan hambatan kerja sebelum menambah orang

Contoh tim terus terlambat dan mengusulkan perekrutan. Masukan berupa riwayat tugas, waktu antre, persetujuan, pekerjaan ulang dan kapasitas. Metode memisahkan waktu kerja aktif dari waktu menunggu serta menunjukkan di mana aliran tersendat.

Keluaran berupa peta aliran kerja, kandidat hambatan, bukti, dan simulasi atau eksperimen perubahan. Jika waktu menunggu persetujuan mendominasi dan kapasitas kerja cukup, usulkan menguji perubahan persetujuan sebelum menyimpulkan perlu menambah pelaksana. Bukti antrean saja tidak otomatis membuktikan hambatan kausal. Nilai yang ingin dibuktikan adalah pemilihan intervensi dengan dampak yang lebih tepat. Ukuran awal mencakup ketepatan perhitungan waktu, rekonstruksi proses dan kepatuhan pada batas kapasitas.

### Rekomendasi dan kaitan produk

Assistant merekomendasikan kandidat pertama sebagai contoh utama untuk pendalaman, karena dekat dengan ilustrasi pengguna, memiliki konsekuensi jelas dan relevan lintas organisasi. Kandidat kedua mempunyai kaitan pendapatan yang mudah dipahami. Kandidat ketiga paling mudah diperiksa dengan data waktu, tetapi tetap harus menunjukkan keahlian yang melampaui dashboard biasa. Ini perbandingan analitis, bukan ranking pasar tervalidasi.

Semua kandidat memakai pola diagnosis sementara → pemilihan pendekatan → penerapan pada kasus → rencana verifikasi. Pengetahuan pembuat yang dapat bernilai berupa aturan diagnosis domain, syarat kecocokan/pengecualian, urutan pertanyaan dan pengalaman kasus berizin. Framework publik bukan otomatis hak privat penjual. Pengemasan harus menghormati lisensi sumber.

Perbaikan komunitas dapat menargetkan aturan yang salah pada kasus tertentu. Kontributor menerima reproduksi sintetis, mengubah modul yang dibuka, dan kandidat diuji pada kasus privat berizin. Evaluator mengukur ketepatan fakta, aturan dan kualitas penalaran dengan reviewer, bukan mengklaim satu framework selalu jawaban tunggal. Jangan membayar bounty berdasarkan keyakinan AI saja. Akurasi harus dibandingkan dengan prompt yang baik dan sumber/alat relevan pada kasus yang sama, termasuk kemampuan menyatakan bukti belum cukup.

### Dasar referensi

[ASQ 8D](https://asq.org/quality-resources/eight-disciplines-8d) menjelaskan proses penanganan masalah dan tindakan korektif. [ASQ DMAIC](https://asq.org/quality-resources/dmaic) menjelaskan perbaikan proses berbasis pengukuran. [Lean Enterprise Institute](https://www.lean.org/lexicon-terms/value-stream-mapping/) menjelaskan pemetaan aliran informasi/proses dan ukuran waktu. [Amplitude](https://amplitude.com/docs/analytics/charts/retention-analysis/retention-analysis-interpret) menjelaskan interpretasi retensi/cohort. Referensi mendukung pendekatan yang tersedia, bukan bukti originality, keunggulan atau permintaan atas metode usulan kita.


### 32.1 Penegasan nilai dibanding prompting biasa

Pengguna menegaskan bahwa metode perlu berhasil menangani masalah dengan hasil jauh lebih efisien dibanding prompting biasa agar alasan pemakaiannya kuat. Ini kriteria pemilihan metode, bukan klaim bahwa kandidat pertama telah memenuhi syarat. Kandidat pertama masih perlu diperjelas dan belum disetujui.

Contoh penjelasan sintetis adalah toko online yang berulang kali mengirim varian produk yang salah. Pengguna memasukkan pesanan, catatan pengambilan/pengemasan dan keluhan. Metode menyusun kronologi, mencocokkan varian dipesan dengan catatan proses, mengelompokkan kesalahan dan membandingkan hipotesis, misalnya label produk mirip atau informasi pesanan berubah. Jika bukti mendukung, metode menyarankan pemeriksaan varian di titik tertentu dan cara mengukur apakah kejadian berkurang. Jika log tidak merekam titik kesalahan, metode meminta bukti tambahan alih-alih menyatakan penyebab pasti. Framework membantu mengatur penyelidikan dan verifikasi, sedangkan hasil yang dicari adalah penanganan masalah.

Nilai lebih terhadap prompt harus datang dari pengolahan data terstruktur, pemeriksaan konsisten, pengetahuan domain serta alur yang mengurangi kerja manual. Sekadar membaca keluhan dan menyarankan 8D belum menunjukkan nilai lebih. AI umum dapat melakukan sebagian atau seluruh langkah bila diberi konteks serta alat yang memadai.

Bandingkan masukan dan akses sumber setara pada prompt biasa yang disusun dengan baik, AI dengan alat hitung/analisis, dan metode. Ukur ketepatan mencocokkan catatan, bukti pendukung, hipotesis keliru, waktu kerja manusia, jumlah koreksi serta biaya total. Ukur penurunan kejadian setelah tindakan secara terpisah, karena diagnosis cepat belum membuktikan masalah selesai. Besar peningkatan minimum belum disepakati. Jika metode tidak menunjukkan manfaat bermakna dibanding baseline, kandidat harus diperbaiki atau diganti. Data sintetis dapat menguji logika, tetapi tidak membuktikan dampak operasional nyata.


### 32.2 Usulan uji sebelum menetapkan metode contoh

Rekomendasi assistant adalah membahas rancangan pengujian sekarang, kemudian menjalankan percobaan kecil sebelum membangun marketplace atau mengunci demo. Diskusi saja tidak membuktikan keunggulan. Tahap ini belum menghasilkan keputusan pengguna atas protokol atau hasil eksperimen.

Mulai dengan satu tugas sempit, misalnya mengidentifikasi titik ketidaksesuaian varian dari pesanan dan log proses. Susun sekitar 12 kasus sintetis beragam sebagai uji eksploratif, termasuk bukti tidak cukup dan beberapa penyebab yang masuk akal. Pisahkan kasus pengembangan dari kasus evaluasi yang tidak digunakan untuk menyetel metode. Tetapkan fakta acuan dan kriteria penilaian sebelum melihat keluaran. Data sintetis tidak membuktikan penurunan kejadian di bisnis nyata.

Bandingkan prompt umum yang baik dengan data lengkap, AI umum yang mendapat alat analisis relevan, dan rancangan metode dengan aturan serta pemeriksaan eksplisit. Gunakan model, data dan batas sumber daya yang sebanding. Nyatakan perbedaan pengetahuan domain yang memang merupakan isi metode. Ukur kualitas, total waktu manusia termasuk menyiapkan data dan koreksi, biaya komputasi, serta ketepatan menyatakan ketidakpastian. Ulangi bila variasi keluaran dapat mengubah kesimpulan. Hindari baseline yang sengaja dilemahkan.

Contoh ambang kelulusan yang diusulkan adalah waktu kerja manusia berkurang minimal 50% dengan kualitas sekurang-kurangnya setara, tanpa kenaikan kesalahan penting, dan biaya total yang masuk akal. Angka 50% belum disepakati atau tercapai. Laporkan angka per kasus, bukan hanya rata-rata. Bila kualitas naik tetapi waktu tidak turun, jelaskan jenis manfaat yang benar-benar terbukti. Sekitar 12 kasus hanya saringan awal, bukan bukti statistik akurasi umum.

Jika tidak ada manfaat yang bermakna, perbaiki metode atau ganti use case sebelum menjadikannya klaim demo. Pembandingan terhadap data operasional berizin dan dampak setelah intervensi merupakan tahap pembuktian berikutnya. Tidak perlu wawancara untuk memulai pengujian sintetis ini. Rekomendasi pekerjaan terdekat adalah merancang kasus serta aturan penilaian terlebih dahulu, lalu menjalankan percobaan ketika akses model tersedia.


## 33. Paket uji konkret metode 01

Pengguna mengizinkan pengerjaan paket uji. Artefak dibuat di `validation/method-01/`. Protokol pada `PROTOCOL.md`, 12 input JSON, kunci evaluator terpisah, konteks bersama, tiga prompt pembanding, manifest hash serta templat pencatatan `runs.csv`. Belum ada eksperimen model atau hasil keunggulan. Ambang numerik merupakan operasionalisasi awal yang masih dapat ditinjau sebelum run resmi.

Tugas sempit adalah menemukan ketidaksesuaian SKU/jumlah per order dan line, tahap pertama yang teramati, bukti, ketidakpastian, tindakan serta cara verifikasi. Ini menguji komponen diagnosis, belum seluruh pemilihan framework atau dampak operasional.

Empat kasus pengembangan meliputi kesalahan saat pick, kesalahan saat pack, bukti tidak cukup dan catatan konsisten. Delapan kasus evaluasi meliputi versi pesanan berubah, substitusi berizin, pick parsial, alias SKU, tahap pack hilang, replay duplikat, payload berkonflik dan pertukaran dua line. Kunci menjelaskan batas kesimpulan, bukan hanya jawaban label. Semua data sintetis dan ID bukti telah diperiksa.

A memakai prompt yang baik, B memakai AI umum dengan alat analisis lokal, C memakai alat setara beserta prosedur validasi/pencocokan eksplisit. Semua mendapat definisi serta data yang sama. Model/snapshot dan parameter disamakan. Usulan run adalah delapan kasus × tiga lengan × tiga pengulangan, total 72 run, dengan konteks baru dan urutan acak. Batas per run 12.000 token keluaran total serta 180 detik, kegagalan/retry ikut dicatat. Tidak ada akses jaringan atau kunci evaluator untuk peserta.

Rubrik 100 poin mencakup status 25, tahap serta batas observasi 20, bukti 20, ketidakpastian 15, tindakan 10 dan verifikasi 10. Bukti ekuivalen yang sah diterima. Nama framework tidak mendapat poin otomatis. Fabrikasi bukti, kepastian sebab tanpa bukti, lokasi pasti ketika data tidak cukup, jaminan fisik berdasarkan log saja dan menyalahkan orang tanpa bukti merupakan kesalahan kritis.

Ambang awal kandidat C adalah rata-rata minimal 90/100 dan nol kesalahan kritis, kualitas serta jumlah status/tahap benar sekurang-kurangnya setara A maupun B. Target efisiensi adalah pengurangan waktu manusia minimal 50% dari A tanpa kenaikan terhadap B. Waktu manusia mencakup persiapan, review dan koreksi, tidak boleh diganti latency model atau angka rekaan. Bila belum diukur, klaim efisiensi belum teruji. Biaya teknis, retry, variasi run dan waktu penyusunan metode dilaporkan. Harga metode final belum tersedia sehingga biaya pemakaian produk final belum dapat disimpulkan.

Pemisahan file tidak menjadikan evaluasi sepenuhnya buta. Assistant yang membuat kasus juga menyusun prosedur kandidat, sehingga terdapat risiko bias dan kebocoran desain. Bekukan prompt sebelum evaluasi, jangan kirim kunci kepada peserta, dan gunakan reviewer anonim serta batch baru yang dibuat independen sebelum klaim umum. Dua belas kasus adalah saringan eksploratif, bukan bukti statistik akurasi populasi. Jika C setara B, keunggulan atas AI bertools belum terbukti. Nilai kemudahan alur juga perlu pengukuran.

Langkah selanjutnya adalah menjalankan percobaan sesuai protokol saat akses model tersedia, mengisi templat dengan hasil nyata dan melaporkan keputusan lolos/revisi/ganti. Pada giliran penyusunan ini hanya artefak dan konsistensi input/kunci yang diverifikasi. Tidak ada API berbayar dipanggil atau hasil eksperimen dikarang.


## 34. Hasil pengujian lokal dan rekomendasi kandidat

Pengguna mengizinkan melanjutkan evaluasi sampai dapat merekomendasikan metode/use case. Laporan terperinci ada di `validation/method-01/RESULTS.md`, prototipe di `analyze.py`, reproduksi melalui `verify.py`. Status bagian ini adalah hasil lokal serta rekomendasi assistant, bukan bukti final keunggulan atas prompting atau persetujuan user mengganti contoh utama.

### Hasil nyata

Prototipe rekonsiliasi deterministik lolos pemeriksaan status/tahap pada 12 kasus sintetis awal dan stabil dalam 120 pengacakan urutan event. Batch 1.000 pesanan dengan 4.000 event menghasilkan 100 temuan sesuai 100 ketidaksesuaian yang sengaja ditanam di pack, dalam sekitar 0,012 detik pada satu pengukuran lokal. Ini bukan runtime seluruh produk atau perbandingan kecepatan terhadap model/manusia.

Lima pemeriksaan tambahan menemukan tiga kegagalan awal. Input kosong dianggap konsisten, pick parsial yang belum selesai dianggap kekurangan, dan keluhan yang belum terjawab tidak mengubah status konsisten. Setelah guard konservatif ditambahkan, 12 kasus awal dan kelima regresi tersebut lolos. Kasus tambahan dipakai untuk memperbaiki kode sehingga bukan holdout independen. Hasil terstruktur disimpan di `results/prototype-checks.json`, `results/adversarial-scope-checks.json`, `results/revised-checks.json` dan `results/final-local-checks.json`.

Prototipe terbatas pada skema sintetis, snapshot tahap, satu hari, alias satu tingkat, amendment yang dinyatakan sah dan stage terbuka yang dilaporkan belum cukup. Belum mencakup konektor, ekstraksi dokumen, pemilihan framework, intervensi, eksekusi privat TEE atau bounty. Dua percobaan inference pembanding mode tanpa tools berakhir timeout setelah 45 dan 90 detik. Penyebab belum diketahui. Catatan tersimpan dalam `results/access-probe.json` dan `results/access-probe-retry.json`. Tidak ada hasil run A/B/C yang sah dan tidak ada waktu manusia yang diukur. Templat runs.csv tetap kosong.

### Rekomendasi yang dapat diberikan

Metode yang paling layak diperdalam dari tiga kandidat adalah penyelidikan kegagalan operasional berulang berbasis bukti. Use case konkret adalah tim operasi toko online atau fulfillment menyelidiki salah varian/jumlah pesanan dan menentukan tindakan korektif. Luaran mencakup kasus terdampak, bukti per kejadian, tahap pertama teramati, batas kesimpulan, hipotesis, tindakan sementara, rencana perbaikan dan ukuran verifikasi. Framework berada di belakang pemilihan pendekatan, bukan menjadi satu-satunya keluaran. Tidak ada perubahan operasi otomatis yang disepakati.

Kandidat ini dipilih secara desain karena fakta ketidaksesuaian dapat dilabel dan diperiksa lebih langsung daripada penyebab churn. Kandidat hambatan tim tetap relevan tetapi memerlukan rincian proses serta pengujian akibat intervensi. Perbandingan antar kandidat ini analitis, bukan tiga benchmark yang telah dilakukan.

Keunggulan atas AI umum belum terbukti. AI bertools dapat mereplikasi rekonsiliasi. Nilai yang masih perlu diuji adalah pengurangan kerja berulang melalui impor, pemeriksaan konsisten dan keluaran mudah diaudit. Rekonsiliasi standar sendiri belum menunjukkan keahlian eksklusif yang kuat atau kemauan membayar. Karena itu tidak ada kandidat yang boleh disebut sudah lolos sasaran jauh lebih efisien berdasarkan hasil saat ini.

Syarat melanjutkan pembuktian adalah akses model yang berhasil mengembalikan respons, run pembanding, batch independen setelah pembekuan metode serta pengukuran waktu manusia. Data operasional setelah intervensi diperlukan untuk membuktikan masalah berkurang. Rekomendasi desain tersedia, tetapi tujuan kepastian keunggulan empiris belum selesai. Angka 12/12 bukan akurasi populasi, dan 0,012 detik bukan bukti penghematan waktu pengguna 50%.


## 35. Kandidat portofolio dan strategi trading dengan privasi dua pihak

Arahan pengguna adalah kerahasiaan data harus menjadi pertimbangan pemilihan metode/use case. Pengguna mengusulkan portofolio dan strategi trading untuk dieksplorasi, belum memilihnya sebagai contoh final. Bagian ini memperbarui konteks analogi trading sebelumnya menjadi kandidat eksplorasi sungguhan, tanpa otomatis mengubah produk menjadi aplikasi trading atau mengizinkan transaksi nyata.

### Kerahasiaan dan nilai metode

Portofolio privat dapat mencakup posisi dan saldo lintas akun, harga perolehan, riwayat transaksi, eksposur, batas risiko dan rencana order. Data harga pasar umumnya berbeda dari data pengguna yang privat. Posisi pada chain publik tidak otomatis menjadi rahasia karena diolah di TEE. Identitas terkait wallet serta agregasi lintas akun tetap dapat sensitif. Jangan menjanjikan menyembunyikan data yang memang publik.

Strategi milik pembuat dapat memiliki aturan sinyal, parameter, sizing, kriteria keluar, aturan pergantian kondisi pasar dan kode privat. Tidak semua strategi rahasia, misalnya aturan publik umum. Nilai jual membutuhkan hasil serta pembuktian, bukan semata kerahasiaan. Pembeli menghindari menyerahkan portofolio kepada penjual, penjual menghindari menyerahkan inti metode kepada pembeli. Operator runtime, log, keluaran, akses dan kredensial tetap perlu dilindungi. Demo cukup memakai data sintetis atau ekspor baca-saja tanpa kebutuhan akses penarikan.

### Tiga bentuk kandidat

| Kandidat | Keluaran | Batas pembuktian |
|---|---|---|
| Sinyal trading untuk mencari keuntungan | Entry/exit serta ukuran posisi | Paling sulit membuktikan unggul. Backtest rentan overfitting, kebocoran waktu, biaya/slippage dan perubahan kondisi. Tidak ada jaminan profit |
| Audit ketahanan strategi sebelum digunakan | Uji out-of-sample, sensitivitas parameter, biaya, drawdown dan kondisi kegagalan | Bernilai bagi pembuat/trader aktif, tetapi butuh data serta simulator yang benar. Audit baik tidak menjamin hasil masa depan |
| Pemeriksaan kesesuaian strategi dengan portofolio dan batas risiko | Dampak skenario, pelanggaran batas, kebutuhan kas, biaya serta alternatif alokasi yang feasible | Lebih mudah diuji secara numerik. Tidak membuktikan kerugian maksimum nyata atau return lebih tinggi |

Rekomendasi assistant adalah kandidat ketiga untuk pendalaman. Contoh masalahnya pengguna hendak memakai strategi berbayar tetapi belum tahu apakah strategi itu cocok dengan posisi lain, batas konsentrasi dan kebutuhan kasnya. Metode menggabungkan portofolio privat dengan aturan strategi privat, menghitung dampak dan menunjukkan tindakan/alokasi yang memenuhi batas atau menyatakan tidak feasible. Rekomendasi ini belum mengganti contoh utama yang disepakati pengguna.

### Contoh sintetis dan mekanisme

Portofolio contoh Rp100 juta, kelompok eksposur X Rp30 juta dan kas Rp20 juta. Strategi meminta pembelian X Rp15 juta dari kas. Kebijakan contoh pengguna membatasi X 40% nilai portofolio dan menyisakan kas minimal Rp10 juta. Dengan asumsi harga tetap dan sebelum biaya, usulan menghasilkan eksposur 45% serta kas Rp5 juta, sehingga melanggar dua batas. Pembelian X maksimal Rp10 juta hanya sebelum biaya. Setelah biaya transaksi, batas harus dihitung ulang, dan strategi mungkin tidak menerima perubahan ukuran tersebut. Jika begitu, laporkan konflik atau tidak feasible, jangan mengubah strategi diam-diam.

Contoh sederhana menjelaskan manfaat, bukan membuktikan lebih baik daripada prompt. Metode nyata harus menangani banyak akun/aset, klasifikasi eksposur, batas pengguna, biaya dan skenario yang ditentukan dengan jelas. Batas kerugian pada skenario tidak menjadi jaminan batas kerugian pasar sesungguhnya.

### Pembandingan dan kontribusi

Keunggulan yang dapat diuji adalah ketepatan hitungan, tidak melanggar batas, deteksi ketidaklayakan, biaya serta waktu kerja pengguna. Bandingkan dengan AI berprompt baik, AI bertools dan alat optimasi portofolio yang relevan. Optimasi serta framework publik sudah tersedia, sehingga solver saja bukan pembeda. Audit strategi perlu data kronologis terpisah untuk pengembangan/evaluasi, biaya realistis dan pencatatan semua percobaan agar tidak memilih hasil terbaik secara selektif.

Kandidat bounty dapat memperbaiki pengelompokan eksposur ganda, biaya atau batas order. Kontributor melihat modul yang diizinkan dan contoh sintetis, kandidat diuji pada portofolio privat berizin. Jangan memberikan seluruh strategi tersembunyi kepada kontributor atau menganggap hasil uji boleh membocorkan posisi. Syarat pembayaran terkait perbaikan aturan yang terukur, bukan janji profit.

### Referensi dan status

[SEC Investor.gov](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/investor-59) mendukung pentingnya perlindungan informasi akun investasi. [Cvxportfolio constraints](https://www.cvxportfolio.com/en/stable/constraints.html) dan [optimization policies](https://www.cvxportfolio.com/en/stable/optimization_policies.html) memberi preseden optimasi berbatas. [QuantConnect research guide](https://www.quantconnect.com/docs/v2/writing-algorithms/key-concepts/research-guide) serta [reconciliation](https://www.quantconnect.com/docs/v2/writing-algorithms/live-trading/reconciliation) menjelaskan risiko backtest dan perbedaan biaya/fill. Sumber tersebut tidak membuktikan metode usulan unggul.

Belum ada pengujian finansial, harga metode final, nasihat investasi individual, eksekusi trading, atau persetujuan memilih kandidat. Kekurangan bukti perbandingan pada bagian 34 tetap berlaku dan tidak hilang karena domain baru lebih sensitif.


## 36. Riset kebutuhan kerahasiaan portofolio dan strategi

Pengguna meminta bukti kebutuhan privasi sebelum pengujian kandidat finansial. Riset 13 November 2026 mendahulukan verifikasi kebutuhan ini. Tidak ada benchmark finansial atau transaksi yang dijalankan. Kesimpulan adalah kebutuhan kerahasiaan mempunyai dasar nyata, paling jelas pada pembuat strategi komersial tertutup. Preferensi privasi investor didukung bukti yang lebih umum dan praktik layanan, belum survei tepat sasaran pengguna produk kita.

### Bukti dan kekuatannya

| Bukti primer | Temuan | Batas interpretasi |
|---|---|---|
| [TradingView vendor requirements](https://www.tradingview.com/support/solutions/43000549951-vendor-requirements/) dan [jenis script](https://www.tradingview.com/support/solutions/43000482573-what-are-the-different-types-of-published-scripts/) | Invite-only menyembunyikan source code dari pengguna dan membatasi akses. Dokumen vendor mengatur akses komersial serta Paid Space | Preseden nyata menjual pemakaian tanpa membagikan kode. Bukan bukti semua strategi berkualitas, volume penjualan, atau tuntutan menyembunyikan kode dari operator |
| [QuantConnect pernyataan IP](https://www.quantconnect.com/announcements/15540/values-security-and-intellectual-property/p1) | Penyedia mengakui pernah menerima pertanyaan pengguna mengenai keamanan dan akses IP. Menjelaskan pengendalian akses dan opsi self-host | Bukti kekhawatiran yang dilaporkan penyedia, tanpa mengukur prevalensi atau kemauan membayar |
| [QuantConnect Security and IP](https://www.quantconnect.com/docs/v2/cloud-platform/security-and-ip) | Kode privat secara default dan akses untuk debugging meminta izin | Proteksi IP menjadi bagian produk. Kebijakan akses bukan bukti operator secara teknis mustahil mengakses |
| [Consumer Reports](https://www.consumerreports.org/money/personal-finance/which-banking-app-is-best-for-you-a7597989502/) | Survei Desember 2023, 2.027 orang dewasa AS, menyebut 76% menilai sangat penting bank meminta izin sebelum membagikan data ke perusahaan lain | Preferensi pembagian data keuangan, bukan survei spesifik investor Indonesia, strategi trading atau permintaan TEE |
| [Sharesight](https://help.sharesight.com/how-sharesight-protects-your-data/) | Pemilik mengendalikan siapa dapat mengakses portofolio, akses support dibatasi untuk penanganan yang diminta, pembagian data tunduk izin serta kebijakan privasi | Praktik produk yang langsung berkaitan dengan portofolio, bukan bukti tingkat adopsi atau janji zero-access operator |
| [CFA Institute III(E)](https://www.cfainstitute.org/standards/professionals/code-ethics-standards/standards-of-practice-iii-e) | Standar profesional mewajibkan kerahasiaan informasi klien dengan pengecualian yang disebutkan | Bukti norma profesional, bukan survei preferensi atau pernyataan hukum universal |

Angka survei mengacu pada tahun pengumpulan 2023, bukan tanggal crawl. Sumber Consumer Reports dibaca melalui artikel lembaga tersebut, PDF survei langsung tidak dapat diakses melalui alat pada riset ini. Tidak menggunakan persentase itu sebagai bukti 76% calon pengguna portofolio menginginkan produk kita. Ketentuan komersial TradingView berubah, sehingga riset ini hanya memakai preseden akses tertutup/berbayar dan tidak mengunci persyaratan akun atau tarif platform.

### Apa yang dilindungi dan dari siapa

Pembeli dapat melindungi saldo, posisi, harga perolehan, riwayat lintas akun dan rencana transaksi dari publik atau penjual strategi yang belum dipercaya. Penjual dapat melindungi kode, parameter dan aturan eksekusi dari pembeli atau pesaing. Privasi dari pihak-pihak tersebut memiliki dasar lebih jelas daripada klaim bahwa semua orang menolak akses penyedia infrastruktur yang dipercaya.

Pisahkan tiga tingkat kebutuhan, yaitu tidak dipublikasikan, tidak dibagikan kepada pihak lawan transaksi, dan operator/penyedia AI juga tidak dapat membaca. Bukti yang ditemukan mendukung dua tingkat pertama lebih langsung. Nilai tambahan tingkat ketiga belum dikuantifikasi untuk target kita. Fitur kode tertutup konvensional sudah mengatasi sebagian kebutuhan penjual, sehingga keberadaan kebutuhan privasi tidak membuktikan produk baru diperlukan.

Riset mendukung calon segmen lebih spesifik berupa pembuat strategi komersial atau quant independen yang menjual penggunaan tanpa kode, dan pemakai dengan portofolio privat yang ingin memeriksa kecocokan strategi tanpa membagikan seluruh posisi kepada pembuat. Ini rekomendasi segmen untuk pengujian, bukan pembatas pasar keseluruhan yang sudah disepakati. Pemilik strategi publik, copy-trader yang sengaja membagikan posisi atau orang yang hanya menanyakan harga pasar tidak mempunyai kebutuhan privasi yang sama.

### Implikasi rancangan dan status

Kandidat layak diuji dari sudut kebutuhan kerahasiaan. Pesan yang dapat dipakai sebagai hipotesis adalah menjalankan strategi privat pada portofolio privat tanpa kedua pihak saling menyerahkan data mentah. Ini masih sasaran kemampuan, belum fitur yang terbukti dibangun. Izin, output/log dan batas runtime harus memenuhi janji tersebut. Jangan menganggap TEE saja membuktikan tidak ada kebocoran.

Tidak setiap tugas memerlukan membuka strategi penuh. Jika pemeriksaan kecocokan cukup memakai usulan transaksi dan batas risiko, gunakan informasi minimum tersebut. Eksekusi inti privat baru relevan bila perhitungan memerlukan strategi dijalankan pada kondisi/portofolio pengguna. Pilihan ini menentukan apakah kebutuhan privasi dua pihak benar-benar muncul dalam alur, atau sekadar narasi.

Belum ditemukan bukti langsung kesediaan target membayar tambahan untuk TEE/blockchain, kebutuhan kolaborasi privat atas strategi, atau keunggulan atas prompting. Kerahasiaan strategi juga tidak membuktikan profit. Sesuai instruksi pengguna, riset kebutuhan diselesaikan terlebih dahulu. Tahap pengujian berikutnya harus memisahkan kegunaan metode, perlindungan dua pihak dan kemudahan dibanding alternatif yang telah ada.


## 37. Pengujian strategi yang membaca portofolio pengguna

Pengguna meminta strategi benar-benar dijalankan pada portofolio, bila memungkinkan, lalu mengizinkan pengujian. Keputusan arah ini menggantikan kemungkinan membatasi alur pada pemeriksaan daftar transaksi yang sudah dihasilkan sebelumnya. Eksekusi trading nyata tidak diizinkan melalui permintaan ini.

Paket lokal ada di `validation/portfolio-method-01/` dengan `run_tests.py`, `cases.json`, `results.json`, `README.md` dan manifest. Strategi buatan menerima posisi, kas, kondisi pasar sintetis serta batas pengguna. Skor berubah menurut konsentrasi posisi, lalu solver memilih transaksi integer yang memenuhi batas. Strategi dijalankan sebelum usulan transaksi ada, bukan sekadar memeriksa sinyal tetap.

### Desain eksperimen

Tiga aset A/B/C berharga satu unit nilai, A/B berbagi sektor. Regime normal memakai preferensi [3,2,1], stress [-1,-2,-3]. Skor adalah preferensi dikurangi empat kali proporsi posisi awal. Objective memaksimalkan skor transaksi dikurangi 0,05 kali turnover. Ini aturan sintetis untuk uji perhitungan, bukan perkiraan return atau metode ahli yang terbukti.

Batas mencakup kas minimum, konsentrasi per aset/sektor, jumlah turnover, pembelian maksimal, izin menjual dan larangan short. Biaya proporsional atas seluruh nilai transaksi mengurangi kas serta NAV. Cap dihitung terhadap NAV setelah biaya. Harga tetap, tidak ada slippage, spread, pajak, multi-currency atau model fill. Validasi berlaku pada posisi akhir, bukan semua langkah eksekusi pasar.

Strategi memakai SciPy MILP. Validator menghitung ledger langsung dan oracle enumerasi memeriksa seluruh delta yang diperbolehkan untuk mencari optimum. Implementasi ini memisahkan perhitungan oracle dari matriks solver, tetapi dibuat penulis yang sama, bukan audit independen. Referensi [SciPy milp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.milp.html).

### Hasil nyata

Sebanyak 42/42 kasus lolos pemeriksaan status, batas dan kecocokan nilai optimum dengan oracle. Terdiri dari 12 kasus terarah dan 30 variasi seed tetap. Kasus mencakup konsentrasi tinggi, kas kurang, kas saja, biaya tinggi/nol, eksposur sektor, larangan jual, kebutuhan kas mustahil, regime stress, turnover nol dan input kas negatif.

Pada kondisi pasar identik, posisi [3,2,1] kas 4 menghasilkan delta [0,0,+1]. Posisi [7,1,1] kas 1 menghasilkan [-5,+2,+1]. Posisi [3,3,3] kas 1 menghasilkan [0,-1,-3]. Posisi nol kas 10 menghasilkan [+3,+2,+2]. Ini membuktikan ketergantungan keluaran pada portofolio dalam aturan contoh. Satuan dapat dibaca Rp10 juta sebagai ilustrasi, bukan harga pasar.

Kontrol statis membeli dua unit A pada kasus dasar melanggar batas kas, aset dan sektor. Kontrol itu bukan keluaran prompt AI dan tidak boleh digunakan untuk klaim metode mengalahkan AI. Hasil per kasus, audit ledger dan objective oracle tersedia dalam results.json.

### Kesimpulan dan batas

Strategi dapat dibangun agar membaca portofolio dan menghasilkan transaksi sesuai kendala dalam model terbatas ini. Belum ada bukti profit, keunggulan terhadap prompting/alat optimasi, penghematan waktu manusia atau privasi dua pihak. Tidak ada TEE, attestation, enkripsi dua pihak atau pengujian kebocoran dalam eksperimen lokal. Kode dan portofolio sintetis dapat dibaca pengembang. Data sensitif dan metode privat nyata memerlukan arsitektur eksekusi serta pengujian tambahan.

Arah kandidat kini lebih konkret sebagai metode alokasi ulang berbasis strategi dan batas portofolio privat. Pemilihan sebagai demo final serta harga belum ditetapkan. Klaim 42/42 hanya kepatuhan pada skenario sintetis dan oracle yang ditentukan, bukan jaminan keselamatan investasi atau akurasi umum. Pengujian berikutnya untuk klaim produk mencakup privasi runtime dan pembanding AI/optimasi yang adil, bukan transaksi pasar nyata.


## 38. Uji pembanding AI dan akses operator

Pengguna meminta pengujian dua klaim, yaitu keunggulan terhadap prompting AI umum dan privasi portofolio serta strategi dari operator. Pengujian keuntungan investasi secara eksplisit dikeluarkan dari lingkup. Tidak ada transaksi nyata.

### Pembanding AI

Percobaan kesiapan Claude CLI tanpa tools timeout setelah 35 detik tanpa jawaban. Log mencatat API connection error berulang dan EPERM saat membuat OAuth refresh lock. Penyebab pasti koneksi belum dipastikan. Ini bukan jawaban benchmark dan tidak dihitung sebagai kegagalan akurasi AI atau kemenangan metode.

Paket `validation/portfolio-method-01/followup/` menyiapkan prompt 42 kasus yang sama, ID tanpa petunjuk status, formula strategi dan semua kendala lengkap, tanpa jawaban oracle atau akses tools. Penilai memeriksa status, kepatuhan batas dan objective optimum dengan toleransi 1e-6. Solusi seri diterima. Metrik sekunder mengabaikan optimum tetapi tetap menuntut status/kelayakan benar. Kontrol grader lolos pada jawaban solver 42 kasus, jawaban kosong serta contoh melanggar batas.

Belum ada hasil model, skor komparatif, estimasi biaya per hasil valid atau penghematan waktu manusia. Rencana satu batch/model belum mengukur variasi dan memiliki risiko pengaruh panjang respons. AI dengan tools belum dibandingkan. Kasus dibuat penulis metode, bukan holdout independen. Klaim keunggulan masih terbuka. Runner dapat digunakan ketika akses inference telah berfungsi, bukan alasan meminta pengguna mengirim rahasia melalui chat.

### Uji akses operator yang benar-benar dijalankan

Subprocess lokal memodelkan operator yang mengendalikan host Python biasa. Fungsi strategi asli dimuat tanpa menjalankan generator fixture dan ditelusuri saat runtime. Empat percobaan akses berhasil, yaitu membaca file portofolio, membaca source strategi, menangkap portofolio saat fungsi berjalan dan menangkap parameter strategi saat fungsi berjalan. Posisi sintetis [3,2,1], kas 4 serta preferensi strategi [3,2,1] tertangkap, sementara solver tetap selesai dengan keluaran feasible.

Dengan demikian, prototipe saat ini GAGAL memenuhi privasi dari operator. Ini bukan eksploit terhadap TEE, bukan eskalasi privilege, bukan data pengguna sungguhan dan bukan bukti privasi dua pihak mustahil. Pengujian hak pembeli/penjual terpisah, side-channel, egress jaringan serta inferensi strategi dari hasil berulang belum dilakukan. Hasil rinci dan reproduksi ada di `privacy-results.json`, `test_claims.py` dan `RESULTS.md` dalam folder followup.

### Usulan tindak lanjut dan batas kemampuan

Privasi memerlukan enkripsi dari sisi pemilik masing-masing, pelepasan kunci hanya ke runtime/kode yang diverifikasi, dan keluaran untuk penerima berhak. Operator/gateway tidak boleh memperoleh plaintext sebelum komputasi. Enkripsi disk saja tidak mengatasi pembacaan saat runtime. Kode strategi privat juga tidak boleh dipublikasikan hanya karena dikemas sebagai WASM.

[OutLayer attestation](https://app.outlayer.ai/docs/tee-attestation) menerangkan ikatan hash WASM/input/output dan batas bahwa attestation bukan bukti kode jujur. [API OutLayer](https://app.outlayer.ai/docs/https-api) memerlukan payment key. [NEAR AI verification](https://docs.near.ai/cloud/verification) menjadi rujukan verifikasi inference, bukan bukti solver kita sudah privat. Runtime lokal macOS ini bukan deployment Intel TDX. Tidak ada deployment TEE atau attestation eksekusi produk yang diuji, dan environment yang diperiksa tidak menyediakan kredensial layanan tersebut. Jangan menyimpulkan tidak ada akun/kredensial di seluruh komputer.

Uji berikutnya harus mencakup attestation salah/kedaluwarsa, measurement/kode berubah, penerima/kunci salah, plaintext dalam storage/log operator dan strategi yang mencoba membocorkan data. Isolasi dari operator tidak otomatis mencegah strategi penjual mengekstrak data lewat output. Semua ini kebutuhan pengujian dan usulan arsitektur, bukan fitur yang selesai atau keputusan stack final.

Kesimpulan sesi ini adalah privasi operator terbukti belum terpenuhi pada prototipe lokal, sedangkan keunggulan terhadap prompting belum bisa dinilai karena akses model tidak menghasilkan respons. Hasil 42/42 bagian 37 tetap hanya membuktikan logika sintetis terhadap oracle. Pengujian keuntungan investasi tidak dilanjutkan sesuai arahan pengguna.


## 39. Percobaan ulang pembanding prompting

Pengguna mengarahkan fokus berikutnya hanya ke pembanding prompting. Keuntungan investasi tetap di luar lingkup. Klarifikasi sebelumnya tetap berlaku bahwa prototipe alur privasi dapat dibuat lokal, tetapi bukti isolasi operator untuk rancangan berbasis TEE memerlukan pengujian TEE nyata, tanpa harus membangun marketplace atau pembayaran lengkap terlebih dahulu.

Benchmark 42 kasus dicoba lagi melalui Claude CLI dengan tools dinonaktifkan. Pemeriksaan jaringan pada sesi ini menemukan kegagalan resolusi DNS untuk api.anthropic.com dan api.openai.com. curl ke Anthropic menghasilkan exit code 6 tanpa header respons. Bukti disimpan di `validation/portfolio-method-01/followup/retry-network.json`. Ini temuan pada lingkungan eksekusi sesi, bukan bukti layanan sedang down atau koneksi seluruh komputer gagal.

Runner kini mendukung `--model-only` untuk hanya menjalankan inference dan penilaian, tanpa mengulang uji privasi. Jalankan dari direktori workspace dengan `rtk proxy python3 validation/portfolio-method-01/followup/test_claims.py --model-only` ketika terminal memiliki koneksi dan autentikasi Claude yang berfungsi. Respons asli disimpan di model-run.json dan penilaian di model-grade.json bila respons valid. Alternatif adalah memberikan prompt.txt ke percakapan AI baru tanpa tools dan tanpa oracle, lalu menilai JSON jawaban dengan opsi `--grade-response PATH`. Catat model dan pengaturan percakapan tersebut untuk pelaporan. Tidak meminta API key atau kredensial dikirim lewat chat.

Keunggulan terhadap prompting tetap belum terbukti tanpa respons model nyata. Persiapan runner dan keberhasilan kontrol penilai tidak menggantikan hasil benchmark. Tidak mengubah metode, kasus atau kriteria penilaian demi mendapatkan hasil yang lebih menguntungkan.

Percobaan ulang benchmark penuh berakhir gagal setelah 173,6 detik. CLI melaporkan connection_failed dan DNS ENOTFOUND, dengan nol token input/output. Tidak ada jawaban atau skor AI.


## 40. Hasil nyata pembanding AI setelah dijalankan pengguna

Pengguna menjalankan runner dari terminalnya dan memperoleh respons model sukses. Respons asli di `validation/portfolio-method-01/followup/model-run.json`, hasil penilaiannya di `model-grade.json`. Metadata CLI menyebut model `claude-opus-5-5`. Ini identitas yang dilaporkan runtime, bukan verifikasi eksternal nama/model. Tools dinonaktifkan oleh runner, model diberi seluruh aturan strategi dan kendala yang sama dengan solver, tanpa oracle.

### Hasil terverifikasi

| Pembanding | Benar dan optimum atau status benar |
|---|---|
| Metode berbasis solver | 42/42 |
| Claude dengan prompt lengkap, tanpa tools | 42/42 |

Terdiri dari 32 kasus feasible dengan objective optimum dan tanpa pelanggaran batas, 9 infeasible yang dikenali dengan benar, serta 1 input invalid. Assistant menghitung ulang penilaian dari respons mentah dan memastikan hasil sama dengan file grade. Hash prompt cocok dengan protokol. Respons berisi 42 ID kasus lengkap. Solusi seri dinilai berdasarkan objective, bukan harus identik dengan delta solver.

Durasi subprocess inference sekitar 84,99 detik untuk satu batch 42 kasus. Metadata CLI mencatat USD0,220036 sebagai estimasi biaya berdasarkan harga daftar, bukan bukti tagihan tambahan pada langganan pengguna. Ada 5.436 token pembuatan cache, 2 token input noncache dan 8.827 token output termasuk 7.736 thinking menurut metadata. Jangan membaca dua token input sebagai keseluruhan prompt. Tidak ada benchmark waktu kerja manusia atau perbandingan biaya infrastruktur yang setara.

### Implikasi terhadap pemilihan metode

Pada benchmark ini hasilnya seri. Klaim metode lebih akurat daripada prompting lengkap tidak didukung. Ini melemahkan alasan memilih contoh tiga aset sintetis ini sebagai bukti utama keunggulan metode. Tidak berarti seluruh produk gagal atau setiap kasus dunia nyata akan seri.

Prompt sengaja memuat aturan strategi lengkap untuk menguji pelaksanaan perhitungan secara adil. Eksperimen tidak menguji kemampuan AI menemukan strategi tersebut, akses legal ke strategi komersial, keunikan pengetahuan ahli atau kesediaan membayar. Jangan memakai perbedaan akses rahasia sebagai bukti keunggulan hitungan.

Batas pengujian tetap satu model, satu batch, 42 kasus sintetis tiga aset buatan penulis metode. AI dengan tools, stabilitas lintas percobaan, efisiensi manusia, portofolio realistis dan kemampuan privat belum diukur. Keuntungan investasi tetap tidak diuji sesuai arahan pengguna.

Usulan berikutnya adalah menetapkan terlebih dahulu pekerjaan target yang nyata dan ukuran efisiensinya, lalu menguji data representatif, konsistensi, waktu dan biaya pada prompt baik serta AI bertools. Jangan menambah kerumitan semata-mata sampai AI gagal atau memilih hasil yang menguntungkan. Jika tetap setara tanpa keunggulan operasional berarti, perbaiki atau ganti kandidat. Ini rekomendasi tindak lanjut, bukan persetujuan pengguna atas benchmark baru atau pemilihan demo final.


## 41. Koreksi tujuan pembanding oleh pengguna

Pengguna menegaskan nilai produk berupa akses penggunaan strategi privat yang dijual pembuat tanpa membuka aturan kepada pembeli. Pembanding utama yang diinginkan adalah AI umum dengan prompt biasa tanpa strategi penjual. Ini menggantikan fokus utama benchmark beraturan lengkap, bukan menghapus hasilnya.

Perbandingan berikutnya harus memberikan kedua jalur portofolio, kondisi pasar sintetis, tujuan pengguna dan batas risiko yang sama. Jalur produk memiliki strategi penjual di runtime privat. Jalur AI umum mendapat permintaan pengguna yang wajar serta konteks memadai, tanpa formula, parameter atau kode strategi penjual. Jangan sengaja melemahkan prompt atau menyembunyikan kebutuhan pengguna. Prompt biasa tidak berarti prompt buruk.

Tujuannya mengukur nilai tambahan akses metode berbayar dibanding bantuan AI umum. Hasil tidak boleh disebut bukti mesin perhitungan lebih akurat pada informasi sama. Hasil 42/42 vs 42/42 sebelumnya tetap valid sebagai uji menjalankan aturan yang sudah diketahui, tetapi belum menjawab nilai akses strategi privat. Kesimpulan bahwa seri tersebut melemahkan nilai keseluruhan metode perlu dibatasi pada klaim keunggulan pelaksanaan hitungan.

Kriteria baru tidak boleh menuntut AI menebak atau menyamai objective rahasia penjual. Ukur keberhasilan pada tujuan pengguna yang diketahui kedua jalur, misalnya kepatuhan batas kas/konsentrasi, biaya transaksi, kesesuaian keluaran dengan kebutuhan serta penjelasan yang dapat diperiksa. Kriteria harus disepakati sebelum menjalankan model dan tidak otomatis memenangkan strategi karena sesuai aturan ciptaan penjual. Untuk metrik yang saling bertentangan, tentukan prioritas atau laporkan tradeoff, jangan memilih metrik setelah hasil muncul.

Strategi penjual yang sudah terbukti bagus adalah gambaran nilai produk yang dimaksud pengguna, belum fakta tentang strategi sintetis saat ini. Formula tiga aset buatan belum memiliki bukti manfaat ahli atau kualitas investasi. Kerahasiaan saja bukan bukti kualitas. Karena keuntungan investasi dikeluarkan dari pengujian, kesimpulan selanjutnya hanya boleh mencakup manfaat operasional yang memang diukur, bukan alpha/profit.

Arah pembanding disepakati melalui koreksi pengguna. Protokol baru dan metode nyata belum ditetapkan atau dijalankan. Jangan mengubah prompt/hasil benchmark lama diam-diam. Simpan percobaan baru terpisah. Privasi runtime tetap kebutuhan tersendiri, belum dibuktikan oleh perbandingan jawaban AI.


## 42. Metode berbasis referensi publik dan prompt biasa

Pengguna menyetujui penilaian berdasarkan manfaat, lalu meminta formula yang baik dari internet dan pembanding Claude dengan prompt biasa. Kandidat yang disiapkan adalah penataan ulang portofolio dengan biaya transaksi minimum di bawah batas alokasi dan kebutuhan kas. Keuntungan investasi tetap di luar lingkup.

Dasarnya [Lobo, Fazel dan Boyd (2007)](https://web.stanford.edu/~boyd/papers/portfolio.html) tentang biaya linear/tetap dan [MOSEK Cookbook bagian 6.2](https://docs.mosek.com/portfolio-cookbook/transaction.html) tentang biaya tetap/proporsional serta indikator transaksi. Adaptasi kita meminimalkan biaya, bukan memaksimalkan expected return seperti formulasi referensi. Riset memberi landasan model biaya, bukan bukti implementasi kita lebih baik daripada Claude atau layak dibeli.

Formula adaptasi adalah min sum_i [r_i p_i |d_i| + f_i 1(d_i != 0)]. d_i adalah unit transaksi, p_i harga, r_i tarif proporsional dan f_i biaya tetap. Kas akhir mengurangi nilai pembelian bersih dan seluruh biaya, NAV akhir mengurangi biaya. Batas pengguna mencakup unit bulat, tidak short/meminjam, kas minimum, izin jual/batas beli, rentang bobot aset dan batas gabungan sektor terhadap NAV setelah biaya. Solusi berbeda diterima jika memenuhi kebutuhan dan biayanya sama.

Contoh manfaat adalah hanya menjual satu unit A ketika itu cukup memperbaiki batas portofolio, atau tidak bertransaksi jika seluruh kebutuhan sudah terpenuhi. Bukan prediksi aset yang menguntungkan. Harga/tarif sintetis tetap, tanpa pajak, slippage atau model fill. Batas sektor tidak mengukur seluruh risiko pasar.

Paket terpisah `validation/portfolio-method-02/` berisi benchmark.py, cases.json, prompt.txt, protocol.json, method-results.json, access-check.json dan README.md. Implementasi SciPy MILP diperiksa dengan ledger serta enumerasi menyeluruh. Hasil 12/12 cocok, yaitu 9 feasible dengan biaya minimum dan 3 infeasible. Kasus dan validator dibuat penulis yang sama, bukan audit atau data pasar independen. Kontrol grader pada keluaran metode dan respons kosong lolos.

Prompt Claude memakai bahasa kebutuhan pengguna tanpa formula optimasi, nama metode, paper, kode, petunjuk penyelesaian, oracle atau contoh jawaban. Data biaya, tujuan biaya minimum dan batas tetap diberikan karena bagian kebutuhan pengguna, bukan rahasia penjual. Format JSON untuk penilaian. Tools dinonaktifkan. Metrik utama kepatuhan batas/status, metrik kedua biaya minimum pada solusi feasible. Tidak mengejar kesamaan jawaban dengan aturan tersembunyi.

Metode publik mungkin sudah diketahui Claude dari pelatihan. Tidak mengirim formulanya bukan bukti Claude tidak mengetahuinya. Formula ini bukan IP rahasia atau inovasi baru produk. Nilai jual metode ahli, willingness to pay, keunggulan terhadap AI dan privasi masih belum terbukti. Pemilihan sebagai demo final tetap terbuka.

Belum ada respons Claude pada paket baru karena DNS sesi agent masih gagal. Pengguna dapat menjalankan `rtk proxy python3 validation/portfolio-method-02/benchmark.py --run-model` dari workspace seperti sebelumnya. Respons/skor diberi timestamp, input dibekukan, benchmark lama tidak diubah. Batas waktu 240 detik. Tidak menilai kegagalan akses sebagai kesalahan AI. Detail formula, asumsi dan sumber ada di README paket.


## 43. Pemulihan parser dan hasil metode kedua

Pengguna melaporkan JSONDecodeError setelah Claude selesai. Respons mentah sudah tersimpan pada `validation/portfolio-method-02/model-run-1794553358289888000.json`. Claude memberi kalimat pengantar, blok JSON dan penjelasan lanjutan. Parser lama hanya menangani JSON langsung atau fence di awal teks, sehingga gagal membaca jawaban yang sebenarnya lengkap. Ini kesalahan integrasi parser, bukan kegagalan menghitung metode atau koneksi.

Parser kini mengekstrak satu objek jawaban JSON lengkap dari teks, menerima pengantar/fence/penutup, menolak respons tanpa objek valid, struktur answers salah atau beberapa objek jawaban ambigu. Tidak memperbaiki angka, menebak jawaban atau memilih jawaban paling menguntungkan. Opsi `--grade-run` memungkinkan penilaian ulang file tersimpan tanpa panggilan API. Tiga tes regresi dengan beberapa variasi, termasuk respons aktual yang gagal, lolos. Respons mentah dipertahankan.

Penilaian ulang menghasilkan 12/12 benar untuk Claude dan 12/12 untuk metode. Sembilan solusi feasible memenuhi semua batas dan mencapai biaya minimum dengan selisih biaya nol terhadap oracle. Tiga kasus infeasible dikenali dengan benar. Claude memakai prompt kebutuhan biasa tanpa formula optimizer atau tools. Metadata melaporkan claude-opus-5-5, durasi 33,48 detik dan estimasi biaya daftar USD0,098144, bukan bukti tagihan tambahan langganan. Hasil tersimpan di model-grade-1794553358289888000.json.

Hasil seri berarti contoh metode kedua belum menunjukkan keunggulan kepatuhan atau biaya transaksi terhadap prompt biasa pada 12 kasus ini. Tidak ada bukti nilai tambah strategi privat dari eksperimen ini. Tidak menyimpulkan semua metode ahli tidak bernilai atau semua portofolio akan mudah ditangani. Kasus masih kecil/sintetis, satu model dan satu percobaan. Profit, efisiensi manusia, skala produksi dan privasi tidak diuji.

Skor hanya menilai transaksi/status serta biaya, bukan seluruh penjelasan bebas Claude. Ada kekeliruan penjelasan C12 yang mengatakan biaya menurunkan proporsi C ketika posisi C tetap. Dalam model ini, biaya menurunkan NAV sehingga proporsi C justru naik. Transaksi dan angka keluaran C12 tetap benar. Jangan menyebut 12/12 sebagai seluruh penjelasan akurat atau mengubah rubrik setelah hasil untuk mengklaim kemenangan metode.

Benchmark sudah berhasil dipulihkan tanpa meminta pengguna menjalankan ulang. Tidak mengubah formula, input atau kriteria penilaian. Paket README dan dokumen diperbarui untuk menggantikan status belum ada respons pada bagian sebelumnya.


## 44. Keputusan fokus produk dan batas janji kualitas metode

Pengguna memutuskan tidak melanjutkan upaya membuktikan bahwa metode pasti lebih baik daripada AI dengan prompt biasa. Kualitas serta hasil metode bergantung pada pembuat dan kondisi pemakaiannya. Produk tidak menjanjikan keunggulan universal, profit atau keberhasilan semua metode. Benchmark sebelumnya tetap disimpan sebagai bukti terbatas, bukan dasar menolak marketplace secara keseluruhan.

Fokus nilai produk adalah menjalankan metode yang dipilih sesuai versi/aturan yang disepakati, menjaga kerahasiaan data pengguna dan metode penjual, serta menegakkan izin dan perlindungan yang dirancang. Ini arah kemampuan yang hendak dijamin setelah implementasi dan pengujian, bukan klaim keamanan yang sudah terpenuhi. Prototipe lokal masih gagal melindungi dari operator sebagaimana bagian 38. Privasi bukan jaminan mutlak dan batas ancaman perlu dinyatakan.

Pengguna mengusulkan kemungkinan rating performa dari pengguna metode. Catat sebagai usulan, belum keputusan mekanisme. Pisahkan rating pengalaman pengguna dari hasil benchmark terukur, dengan konteks penggunaan, versi metode dan jumlah evaluasi. Rating tidak otomatis menjadi bukti keunggulan atau jaminan hasil. Mekanisme verifikasi, perlindungan data privat, pencegahan manipulasi dan penanganan perubahan versi masih terbuka.

Eksplorasi strategi pool dan benchmark banyak langkah tidak dilanjutkan sebagai pekerjaan aktif. Tidak ada persetujuan baru untuk pengujian keuntungan/kerugian investasi, transaksi nyata atau pengaturan hasil agar metode menang. Fokus berikutnya adalah pemenuhan janji produk yang berada dalam kendali platform. Pemilihan metode contoh final tetap terbuka.


## 45. Alasan membayar dan ilustrasi use case untuk frontend

Pengguna bertanya apakah janji produk pada bagian 44 cukup membuat calon pengguna merasa worth it, mengingat mereka membayar lebih untuk memakai metode di produk ini. Jawaban yang dicatat adalah hipotesis, bukan hasil validasi. Privasi saja belum tentu cukup menjadi alasan membayar.

Ada dua nilai yang dibayar secara terpisah. Harga metode membayar akses ke keahlian atau cara kerja yang dipercaya berguna. Biaya tambahan platform membayar kemampuan memakai metode itu pada data sendiri dengan perlindungan, kontrol izin dan proses yang praktis. Hipotesis nilai terkuat adalah produk memungkinkan transaksi jasa yang sebelumnya sulit terjadi karena kedua pihak ingin menjaga rahasia. Contohnya, pembeli tidak memperoleh kode strategi trader dan tidak perlu menyerahkan seluruh portofolionya kepada trader tersebut.

Alasan membayar melemah jika metode serupa tersedia gratis, datanya tidak sensitif, atau pengguna nyaman mempercayai penjual. Produk tidak harus menjamin setiap metode mengalahkan AI biasa, tetapi pembeli tetap perlu alasan mempercayai manfaat metode. Reputasi pembuat, contoh keluaran, batas penggunaan dan bukti pengujian membantu, sedangkan rating menjadi pelengkap. Segmen awal yang paling masuk akal adalah orang yang sudah membutuhkan metode berbayar tetapi terhambat kerahasiaan data atau strategi. Kesediaan membayar belum terbukti.

Untuk menentukan isi frontend, daftar use case awal (penentuan harga proyek, optimasi iklan, perencanaan stok, negosiasi pengadaan, diagnosis operasional, retensi pelanggan) dikoreksi pengguna. Beberapa datanya kurang dirasakan sensitif oleh pengguna. Data internal belum tentu terasa cukup sensitif sampai orang mau membayar untuk melindunginya. Use case perlu konsekuensi kebocoran yang langsung terasa.

Kandidat yang lebih kuat adalah strategi portofolio pribadi (nilai kekayaan, posisi lintas akun, kebutuhan kas, rencana transaksi), negosiasi gaji dan tawaran kerja (gaji sekarang, tawaran lain, batas minimum, kondisi pribadi), penawaran tender dan negosiasi kontrak (harga pokok, margin minimum, harga penawaran sebelum diajukan, batas konsesi), serta perencanaan kas saat bisnis kesulitan (saldo, utang, tunggakan, kemampuan membayar gaji).

**Disepakati:** frontend menampilkan tiga ilustrasi awal, yaitu portofolio, negosiasi gaji dan penawaran tender. Negosiasi gaji paling mudah dipahami banyak orang. Tender memberi gambaran konsekuensi kebocoran yang jelas. Perencanaan kas bisnis tetap kandidat cadangan. Kartu metode memakai nama hasil yang dicari, misalnya "Susun penawaran tender sesuai margin minimum", bukan nama kategori umum. Satu skenario tetap dipakai untuk mendemonstrasikan alur lengkap.

Dua syarat terpisah tetap harus dijaga pada tiap ilustrasi. Data pengguna harus terasa sensitif, dan metode penjual harus punya alasan untuk dibeli. Negosiasi gaji kuat pada sisi privasi, tetapi nilai tambah metodenya dibanding AI biasa masih perlu ditunjukkan. Pilihan tiga ilustrasi ini berdasar kecocokan masalah, bukan validasi pasar atau kesediaan membayar. Skenario demo lengkap dan metode contoh final tetap terbuka.


## 46. Jaminan dua pihak sebagai daya tarik metode (usulan)

Pengguna menegaskan bahwa berguna atau tidaknya metode tetap bergantung pada metode dan penjualnya, yang dinilai calon pembeli melalui rating. Daya tarik dari sisi produk datang dari jaminan kepada penjual dan pembeli atas privasi dan hal lain yang terkait transaksi. Jawaban untuk pertanyaan "kenapa tidak memakai ChatGPT saja" diarahkan pada pasokan. Metode tersebut tidak tersedia di AI umum karena penjualnya tidak bersedia membukanya tanpa perlindungan. Ini hipotesis, bukan bukti pasar.

Seluruh jaminan di bawah merupakan **usulan** yang belum dibangun. Prototipe lokal masih dapat dibaca operator (bagian 38 dan 44), sehingga jaminan privasi belum boleh disajikan sebagai kemampuan yang sudah terpenuhi.

Jaminan yang sudah tercatat di bagian lain dan tidak diulang rinciannya:

- Privasi dua pihak serta trial dengan data sendiri (bagian 5, ketentuan trial masih terbuka).
- Versi, batas penggunaan dan harga terlihat (bagian 5 dan 29–30).
- Atribusi, lisensi dan royalti metode turunan (bagian 7, masih terbuka).
- Izin data uji yang tidak otomatis menjadi izin pelatihan (bagian 9), serta retensi dan penghapusan (bagian 18, terbuka).
- Kontrol tindakan dan pengiriman data keluar (bagian 3).
- Kuitansi aturan, persetujuan dan hasil tindakan (bagian 11).
- Rating per versi yang dipisahkan dari benchmark (bagian 44).

Usulan baru untuk **penjual**:

- Pemakaian dihitung dan dibayar per eksekusi, sehingga pembeli tidak memperoleh akses permanen setelah sekali bayar. Mekanisme escrow atau kontrak NEAR belum ditetapkan.
- Rating hanya dapat diberikan oleh pembeli yang benar-benar menjalankan metode, untuk mengurangi rating palsu dari pesaing. Cara verifikasinya masih terbuka.

Usulan baru untuk **pembeli**:

- Versi metode yang dijalankan sama dengan versi yang ditawarkan, dibuktikan dengan hash versi dan attestation. Penjual tidak dapat diam-diam menukar metode. Attestation membuktikan kode yang berjalan, bukan kualitas atau kejujuran logikanya.
- Keluaran milik pembeli. Penjual tidak melihat keluaran maupun data masukan pembeli.
- Operator platform juga tidak dapat melihat data dan metode. Ini pembeda terhadap konsultan atau marketplace jasa biasa yang hanya mengandalkan perjanjian kerahasiaan, dan bergantung pada TEE (bagian 10).

**Keputusan pengguna tentang ruang lingkup diskusi:**

- Kelemahan rating sebagai satu-satunya sinyal kualitas (keluaran rahasia sehingga rating tanpa bukti, dan metode baru mulai dari nol rating) tidak dibahas.
- Risiko ekstraksi metode melalui banyak keluaran tidak dibahas. Catatan bagian 5 bahwa kerahasiaan metode tidak menjamin hasil mustahil ditiru tetap berlaku.
- Definisi kegagalan yang objektif untuk refund dan sengketa perlu dibahas nanti. Sampai saat itu, refund dan sengketa tidak dijadikan janji frontend.

Pemilihan jaminan yang menjadi janji utama di frontend masih terbuka.


## 47. Keputusan track dan satu alur demo lintas track

**Disepakati.** Pengguna memutuskan mengikuti minimal tiga track, yaitu Privacy & Private AI, Social Money dan Open Innovation. Satu proyek boleh masuk beberapa track dalam satu submission (`NEAR.md`). Pilihan ini menggantikan rekomendasi agent untuk hanya mengikuti Privacy.

Teks resmi track yang menjadi acuan adalah sebagai berikut. Privacy meminta komputasi rahasia dan AI yang melindungi data sensitif. Contoh prompt resminya memakai NEAR AI Cloud, verifikasi attestation dengan nonce baru, tanpa retensi di server, dan dokumen contoh fiktif. Social Money meminta anggaran bersama, reward terprogram, kepemilikan kolektif dan akses berbasis reputasi di atas Sputnik DAO dan Trezu, tanpa membangun ulang multisig. Open Innovation meminta cara baru agar uang, kecerdasan dan kepemilikan bekerja bersama.

**Usulan alur demo tunggal** agar satu alur membuktikan ketiga track, bukan tiga fitur terpisah:

1. Penjual mempublikasikan metode. Hash versi dan pemiliknya dicatat di NEAR, sedangkan isi metode tetap terenkripsi di luar chain.
2. Pembeli menjalankan metode pada data fiktif miliknya di NEAR AI Cloud/TEE. Attestation diverifikasi dengan nonce baru dan dikaitkan dengan hash versi yang dijalankan. Penjual tidak melihat data dan keluaran pembeli. Tidak ada retensi di server. (Privacy)
3. Sebagian pembayaran masuk ke dana bersama di Sputnik DAO atau Trezu yang sudah ada. (Social Money)
4. Anggota mengusulkan perbaikan metode dan menyetujui bounty melalui proposal DAO. Kontributor mengirim versi baru yang diuji pada kasus yang diizinkan. Setelah diterima, DAO membayar bounty. (Social Money)
5. Versi baru tercatat beserta hubungannya dengan versi lama dan kontributornya. Keahlian privat, dana bersama dan kepemilikan versi bekerja dalam satu siklus. (Open Innovation)

Jaminan yang dibuktikan di demo adalah data pembeli tidak terlihat penjual dan operator (bergantung TEE), versi yang dijalankan sesuai yang ditawarkan, tanpa retensi, dana bersama yang dikelola DAO, serta atribusi versi dan kontributor. Pembayaran per eksekusi lebih dekat dengan Agent Economy dan tidak dijadikan bukti utama.

Batas dan risiko:

- Open Innovation paling lemah. Bagian 3 sudah mencatat bahwa menggabungkan fitur bukan bukti originality. Klaimnya harus bersandar pada siklus yang tidak dapat dilakukan tanpa privasi dua pihak, bukan pada daftar fitur.
- Ketiga track berbagi satu sisa waktu sekitar 38 jam per 13 November 2026 09:34 UTC (deadline 14 November 23:59 UTC). Setiap langkah yang tidak berjalan harus dihapus dari README, bukan diklaim.
- Jaringan untuk DAO (testnet atau mainnet), pilihan Sputnik DAO atau Trezu, dan bentuk pengujian bounty belum diputuskan. Submission tetap memerlukan akun mainnet yang valid.
- Agent Economy, AI Security dan AI Swarms tidak menjadi target saat ini.


## 48. Keputusan sebelum development dan penyelarasan dokumen

Sebelum development, dokumen diperiksa agar agent berikutnya tidak membangun arah lama. Pengguna memutuskan tiga hal pada 13 November 2026.

1. **Metode demo MVP adalah portofolio.** Penataan ulang portofolio dengan biaya transaksi minimum di bawah batas alokasi dan kas, berbasis `validation/portfolio-method-02/` (solver lolos 12/12 terhadap enumerasi menyeluruh). Contoh penawaran proyek freelancer pada bagian 6, 22 dan 31 ditandai digantikan. Metode ini berbasis referensi publik dan bukan IP rahasia yang terbukti bernilai (bagian 42). Demo memakai data sintetis dan tidak menjanjikan keuntungan investasi.
2. **Lima perlindungan bagian 3 tetap dibangun di MVP.** Ini keputusan pengguna. Agent sebelumnya merekomendasikan menjadikannya visi dan roadmap karena sisa waktu sekitar 38 jam. Setiap perlindungan yang belum berjalan saat submission harus ditulis sebagai keterbatasan di README, bukan diklaim.
3. **Urutan build mengikuti langkah alur bagian 47.** Langkah 1–2 dibangun sampai berjalan terlebih dahulu, kemudian langkah 3–5. Jika waktu habis, bukti Privacy tetap utuh.

Bagian 0 ditambahkan sebagai ringkasan status terkini. Catatan status disisipkan pada bagian 3, 4, 6, 22 dan 31. Isi lama tidak dihapus agar riwayat keputusan tetap dapat ditelusuri.

Masih terbuka: stack teknis, jaringan DAO (testnet atau mainnet, testnet diizinkan menurut `NEAR.md`), pilihan Sputnik DAO atau Trezu, nama produk, serta urutan pengerjaan kelima perlindungan relatif terhadap langkah alur.


## 49. Lima perlindungan penuh, integrasi pihak ketiga, dan use case kedua

**Disepakati (klarifikasi bagian 48).** Kelima perlindungan dibangun dan berfungsi di MVP. Video demo hanya menampilkan sebagian alurnya. Penjelasan pembangunan seluruh fitur disampaikan di README dan dokumen pendukung lain. Ini sejalan dengan pembahasan 12 November 2026 pukul 11.10–11.16 WIB, ketika pengguna menegaskan kelima perlindungan tetap menjadi fitur produk, sedangkan demo menampilkan satu atau dua alur utama. README hanya boleh menyebut fitur yang benar-benar berjalan. Fitur yang belum berjalan saat submission ditulis sebagai keterbatasan.

**Disepakati. Penggunaan perlindungan bergantung pada metode.** Pengguna menyatakan bahwa perlindungan yang relevan bergantung pada metode yang dijual penjual. Metode portofolio terutama memerlukan aliran data keluar, dokumen dan kredensial. Metode lain dapat memerlukan memori atau browser agent.

*Usulan implementasi.* Setiap metode menyatakan kebutuhannya dalam manifest, misalnya konektor yang dipakai, akses browser, akses memori, jenis dokumen masukan, dan tujuan pengiriman keluar yang diizinkan. Platform menampilkan daftar ini kepada pembeli sebelum menjalankan metode dan menegakkannya saat eksekusi. Permintaan di luar manifest ditolak atau memerlukan persetujuan. Ini belum keputusan.

**Disepakati. Integrasi pihak ketiga.** Aplikasi difokuskan agar dapat dihubungkan ke layanan pihak ketiga, misalnya platform trading atau broker, untuk membaca portofolio dan menyiapkan transaksi. Jika API key nyata tidak tersedia, dibuat konektor mock. Mock harus diberi label mock di UI, README dan video, dan tidak boleh disajikan sebagai integrasi nyata. Integrasi ini menjadi tempat perlindungan kredensial bekerja: token disimpan di TEE atau broker rahasia, akses dibatasi, dan dapat dicabut. Metode maupun penjual tidak menerima token mentah. Eksekusi transaksi nyata tidak diizinkan. Batas ini mengikuti bagian 44 dan aturan agent tentang spending dan signing.

**Usulan, menunggu persetujuan. Use case demo kedua untuk memori persisten dan browser agent.** Pengguna bertanya apakah video dapat menambah satu use case selain portofolio untuk memperlihatkan memori persisten dan browser agent. Jawabannya mungkin. Kandidat yang diusulkan adalah **penawaran tender**, yang sudah menjadi ilustrasi frontend (bagian 45).

- Browser agent masuk ke portal pengadaan mock, mengunduh dokumen tender, lalu membaca persyaratannya.
- Dokumen tender (PDF atau scan) diproses dengan perlindungan dokumen multimodal.
- Memori menyimpan pelajaran tender sebelumnya milik perusahaan beserta sumbernya. Usulan perubahan memori dari konten luar memerlukan persetujuan.
- Dokumen tender berisi prompt injection yang mencoba menanam instruksi ke memori dan mengirim harga pokok ke pihak luar. Kedua upaya ditahan.
- Metode penjual menyusun harga penawaran dari harga pokok dan margin minimum tanpa membuka harga pokok kepada penjual.

Dengan dua use case, kelima perlindungan tampil di video. Portofolio memperlihatkan kredensial (konektor trading), aliran data keluar dan dokumen. Tender memperlihatkan browser agent, memori, dokumen dan aliran data keluar. Metode tender belum ada dan harus dibuat. Portal pengadaan dan data perusahaan bersifat mock dan sintetis.

**Catatan kelayakan (inferensi agent).** Cakupan bertambah menjadi lima perlindungan, dua use case, konektor trading dan langkah DAO dengan sisa sekitar 37 jam per 13 November 2026 10.30 UTC. Urutan build pada bagian 48 tetap berlaku, sehingga alur portofolio langkah 1–2 diselesaikan lebih dulu.

**Aturan dokumentasi dari pengguna.** Setiap keputusan atau informasi baru dari pengguna, sekarang dan seterusnya, dicatat ke `RANCANGAN_PRODUK.md` dan `RANCANGAN_PRODUK.pdf`.

**Disepakati (tambahan 13 November 2026).** Penggunaan integrasi pihak ketiga juga bergantung pada metode yang dijual. Integrasi hanya dipakai jika metode menuntut akses ke aplikasi pihak ketiga, misalnya metode portofolio yang membaca posisi dari platform trading. Metode yang cukup memakai data unggahan pembeli tidak memerlukan konektor. Kebutuhan konektor dapat dinyatakan dalam manifest metode yang diusulkan di atas.


## 50. Pembayaran hybrid dan use case tender

**Latar.** Pengguna menerima adanya use case web2 seperti tender, tetapi mempertanyakan cara pembeli web2 membayar, karena pembayaran dianggap berbasis crypto. Faktanya aset pembayaran belum pernah diputuskan (bagian 18 poin 8). Yang sudah dirancang on-chain adalah dana bersama DAO dan pembayaran bounty.

**Disepakati. Pembayaran hybrid.**

- Pembeli web2 membayar dengan top-up saldo menggunakan fiat, misalnya kartu atau QRIS.
- Pembeli web3 boleh membayar langsung dengan crypto.
- Di belakang layar, bagian penjual, alokasi ke dana DAO dan pembayaran bounty dicatat dan dibayar di NEAR oleh platform.

**Disepakati. Implementasi MVP.** Top-up fiat dibuat sebagai mock dan dilabeli mock di UI, README dan video. Integrasi payment gateway nyata tidak dikerjakan karena memerlukan badan usaha dan verifikasi. Settlement ke penjual dan dana DAO memakai transfer nyata di testnet, yang diizinkan menurut `NEAR.md`.

**Disepakati. Penekanan produk.** Pembayaran lewat jalur web2 memperkuat pesan bahwa pengguna tidak hanya berasal dari web3 dan metode tidak hanya untuk kebutuhan web3. Portofolio mewakili kebutuhan finansial dan crypto, tender mewakili kebutuhan bisnis web2.

**Disepakati. Use case demo kedua adalah penawaran tender.** Status usulan pada bagian 49 diganti. Pengguna menerima use case web2 ini setelah pertanyaan pembayaran terjawab. RFP atau grant DAO ditolak sebagai use case kedua karena budaya grant DAO cenderung menuntut rincian anggaran dibuka, sehingga alasan privasi lemah. Negosiasi market maker dicatat sebagai alternatif web3 yang tidak dipilih.

Skenario tender adalah sebagai berikut. CV Maju (fiktif) membeli metode harga penawaran tender dari konsultan pengadaan fiktif. Pembeli merahasiakan harga pokok, margin minimum dan riwayat kalah-menang. Penjual merahasiakan cara menentukan harga. Browser agent membaca portal pengadaan mock. Dokumen scan diproses privat. Memori menyimpan pelajaran tender dengan sumber. Prompt injection di dokumen yang mencoba menanam memori dan mengirim harga pokok ditahan. Metode berjalan di TEE dan menghasilkan harga penawaran, alasan dan syarat wajib. Portal, dokumen dan data bersifat mock atau sintetis. Metode tender belum ada dan perlu dibuat secara sederhana.

**Batas dan risiko.**

- Dengan fiat, platform memegang dana sementara sebagai kustodian. Ini mengurangi sifat tanpa perantara untuk pembeli web2. Pengguna menerima pertukaran ini demi kemudahan.
- Agent mencatat dari pengetahuannya, tanpa memverifikasi ulang sumber, bahwa crypto tidak diakui sebagai alat pembayaran di Indonesia. Hal ini mendukung jalur fiat, tetapi perlu diperiksa sebelum dijadikan klaim publik.
- Pembayaran fiat nyata, kepatuhan pembayaran, refund dan pajak belum dirancang.


## 51. Arsitektur eksekusi, akun, dan temuan koordinator OutLayer

**Disepakati. Opsi A.** Pengguna memilih menjalankan metode di TEE OutLayer. Dua alternatif ditolak. Phala dstack (opsi B) berada di luar ekosistem NEAR dan belum pernah dicoba. NEAR AI Cloud saja (opsi C) mengubah metode menjadi prompt, sehingga hasil optimasi kurang andal dan versi metode tidak dapat dibuktikan dengan hash kode.

**Direvisi 14 November 2026.** Opsi C tetap tidak dipakai sebagai arsitektur, karena semua metode tetap dijalankan runner di TEE OutLayer. Tetapi penolakan terhadap metode berbentuk prompt dicabut. Prompt penjual boleh dijual sebagai salah satu bentuk metode. Runner membuka prompt yang disegel lalu mengirimnya bersama data pembeli ke model privat. Alasan "tidak dapat dibuktikan dengan hash" juga dikoreksi. Hash prompt dicatat di kontrak sama seperti hash kode. Yang tidak dapat dijamin adalah konsistensi jawaban, karena model dapat diperbarui penyedianya dan jawabannya tidak deterministik (bagian 65).

**Fakta tentang OutLayer.** OutLayer adalah platform komputasi off-chain untuk NEAR yang dibuat FastNEAR dan tercantum di dokumentasi resmi NEAR (https://docs.near.org/primitives/off-chain-compute/outlayer.md). Kode berjalan sebagai WASM di enclave Intel TDX. Setiap eksekusi menghasilkan attestation berisi hash kode, input dan output. OutLayer juga partner hackathon (`NEAR.md`). NEAR AI Cloud hanya menyediakan inference model AI dan tidak menjalankan kode milik pengguna.

*Usulan implementasi (belum keputusan).* Solver portofolio ditulis ulang ke Rust (`wasm32-wasip2`) dengan logika enumerasi seperti `oracle()` di `validation/portfolio-method-02/benchmark.py`, karena kasusnya kecil. Parameter rahasia penjual disimpan sebagai secret OutLayer. Kode engine dapat terlihat publik, sedangkan parameter tetap rahasia. Bagian AI tender memakai model `verifiable: true` di NEAR AI Cloud dan `openai/privacy-filter`. Registry metode dan settlement memakai kontrak NEAR testnet. Frontend memakai Next.js. Browser agent dan portal mock berjalan di backend biasa, bukan di TEE, dan ditulis sebagai keterbatasan. WASM dipublikasikan lewat FastFS agar repo tidak perlu dibuat publik sebelum dikonfirmasi pengguna.

**Akun yang sudah dibuat (13 November 2026).**

- Akun `scientivan.testnet` dibuat lewat faucet gratis dengan saldo 10 NEAR testnet. Transaksi `D2Z4qWBxCWHr2CNmoSpC8ePd1YJVWqgt3UE9Zs6rk9Dh`. Kunci tersimpan di macOS Keychain dan tidak masuk repo.
- OutLayer CLI 0.2.3 sudah login ke testnet sebagai `scientivan.testnet`. Kredensial CLI ada di `~/.outlayer/testnet/`.
- Kredit NEAR AI Cloud dari https://nearbuilders.org/dashboard memerlukan profil builder yang sudah disetujui admin. Sumbernya kode `plugins/credits/src/services/credits.ts` di repo `NEARBuilders/nearbuilders.org`, yang mengembalikan `needs_approved_profile` tanpa profil dan menolak klaim dengan pesan "An approved builder profile is required to claim API credits". Situs memakai akun NEAR mainnet. Status jendela klaim dan jumlah kredit belum diketahui karena memerlukan login. Cadangannya membeli kredit di https://cloud.near.ai.

**Temuan. Koordinator OutLayer dapat melihat input pembeli.** Panggilan HTTPS masuk melalui koordinator, yaitu gateway dan antrean tugas yang menurut dokumentasi OutLayer "currently closed source". Di kode worker yang terbuka (`worker/src/api_client.rs`, struct `ExecutionRequest`), `input_data` berupa `String` biasa yang ditaruh koordinator di antrean Redis sebelum diambil worker TEE. Jaminan OutLayer bahwa koordinator "cannot read TEE memory, cannot forge attestations" benar, tetapi tidak mencakup input yang melewati koordinator sebelum masuk TEE. Agent menyimpulkan keluaran juga kembali melalui koordinator. Ini inferensi yang belum diperiksa di kode.

*Mitigasi (diuji 13 November 2026, lihat hasil di bawah).* Data sensitif pembeli dienkripsi di browser ke kunci yang hanya dapat dibuka di TEE, misalnya dengan mekanisme secrets OutLayer (ECIES ke kunci keystore) atau encryption keys per pemanggil. Keluaran dienkripsi WASM ke kunci efemeral milik pembeli. Dengan begitu koordinator hanya melihat ciphertext. Klaim "operator tidak dapat melihat data" baru boleh dipakai dalam batas hasil uji di bawah.

Masih terbuka: apakah profil builder disetujui sebelum deadline, sumber kredit NEAR AI Cloud, jaringan DAO, pilihan Sputnik DAO atau Trezu, dan nama produk.

**Hasil uji enkripsi di OutLayer testnet (13 November 2026).** Kode ada di `app/sealed-probe/`.

- Kunci X25519 `PROTECTED_SEAL_KEY` dibuat di dalam TEE dengan `outlayer secrets set --generate PROTECTED_SEAL_KEY:hex32`, dikunci ke satu build WASM (`--build 85ceaeadb5b4b7e2054d5aef076d0a872add64248406e9b67a8f52f833404064`). Nilainya tidak pernah terlihat oleh siapa pun, termasuk pemilik project. TEE hanya mengeluarkan kunci publik `b3763602ba9cdf9a018c14ea6fe0bcc97f05a79f8f08a343b58ea21ce3bdc06f`.
- Pembeli mengenkripsi kasus portofolio di mesinnya (X25519 + HKDF-SHA256 + ChaCha20-Poly1305, `client/sealed.mjs`). TEE membuka, menjalankan metode, lalu mengenkripsi jawaban ke kunci sesi pembeli.
- Uji lokal dengan build native: 12/12 kasus cocok dengan oracle Python di `validation/portfolio-method-02/`.
- Uji nyata kasus C03 lewat jalur on-chain, transaksi `2m9XzLb8SD3MkChhZzfUpT5Ms2anVpYFPxDKfwjY8uHs`. Di jalur ini input tercatat di transaksi publik dan keluaran di callback publik, sehingga ujinya lebih ketat daripada jalur HTTPS. Argumen transaksi dan nilai kembalian hanya berisi ciphertext. Kata `holdings`, `fee_rates`, `delta`, `cost` serta angka posisi `[7,1,1]` dan jawaban `[-3,0,2]` tidak ditemukan. Pembeli membuka jawaban `delta [-3,0,2]` dengan biaya 0,18, sama dengan oracle.
- Catatan attestation OutLayer (`/attestations/by-request/38119`) menyebut `executed_wasm_sha256` sama dengan hash build di atas. `input_hash` dan `output_hash` sama dengan SHA-256 input dan keluaran di transaksi.

Batas hasil uji:

- Yang terbukti adalah koordinator dan pengamat chain hanya melihat ciphertext. Kerahasiaan bergantung pada TEE OutLayer dan kode WASM yang menangani kunci.
- Quote TDX belum diverifikasi sendiri sampai ke Intel Root CA. Yang dicek baru catatan attestation dari API OutLayer.
- Pemilik project dapat memindahkan kunci ke build lain dengan `secrets access --build`. Pemindahan ini tercatat on-chain, tetapi pembeli perlu memeriksa hash build sebelum mengirim data.
- Kode WASM yang diunggah lewat FastFS bersifat publik. Untuk metode rahasia, parameter penjual harus menjadi secret, bukan bagian dari kode.
- Panjang ciphertext dapat membocorkan perkiraan ukuran data.

**Hasil uji NEAR AI Cloud (13 November 2026).** Kode ada di `app/near-ai-probe/verify.mjs`. API key berasal dari klaim kredit builder di https://nearbuilders.org/dashboard ($10, penawaran ditutup 15 November 2026). Profil builder `scientivan.near` disetujui otomatis karena persetujuan admin sedang dimatikan. Key disimpan sebagai `NEAR_API_KEY` di `Product/.env`, yang masuk `.gitignore`.

- Model `deepseek-ai/DeepSeek-V4.1-Flash-1017` lolos semua cek. Nonce baru dari klien muncul di laporan gateway dan model. `report_data` di dalam quote TDX berisi kunci penanda tangan dan nonce. Laporan model menyertakan bukti GPU NVIDIA dengan nonce yang sama. Tanda tangan `provider_tee` ed25519 valid atas `<model>:<sha256 request>:<sha256 response>` dengan kunci dari laporan preflight.
- Prompt uji memakai data fiktif (harga pokok 812 juta, margin minimum 9%). Jawaban model 885.08 benar. Biaya sekitar 0,001 USD.
- `z-ai/glm-5.3` dan `moonshotai/kimi-k3` mengembalikan "No provider found that supports attestation reports" untuk `provider=near`, meskipun katalog menandainya `verifiable: true`. Model ini tidak dipakai untuk klaim privasi sampai attestation-nya dapat diperiksa.
- Rantai sertifikat Intel dan NVIDIA belum diverifikasi sendiri. Pemeriksaan itu dapat dilakukan di NEAR AI Verification Center.
- Model reasoning ini menghabiskan banyak token untuk berpikir. `max_tokens` 400 menghasilkan jawaban kosong, sehingga aplikasi perlu batas sekitar 2000.


## 52. Manifest metode dan dokumen status pengerjaan

*Usulan (belum keputusan).* Setiap versi metode memiliki manifest yang ditulis penjual: model AI yang diizinkan, konektor dan izinnya, jenis input dan dokumen, tujuan pengiriman keluar, akses memori, domain dan aksi browser, parameter rahasia penjual, harga dan pembagian pembayaran, serta versi induk dan kontributor. Pembeli melihat manifest sebelum menjalankan metode. Hash manifest dicatat di NEAR bersama hash versi.

**Disepakati. Pilihan model AI.** Penjual boleh mengizinkan dua jalur. Jalur privat memakai model open-weight yang lolos attestation di NEAR AI Cloud (per 13 November 2026 baru DeepSeek V4.1 Flash yang terbukti). Jalur proprietary memakai model seperti Claude atau GPT yang menurut katalog NEAR `verifiable: false`, sehingga data keluar dari TEE ke penyedia model. Jalur proprietary wajib disertai peringatan yang jelas kepada pembeli, penyaringan data dengan `openai/privacy-filter`, dan persetujuan eksplisit pembeli. Pembeli boleh mempersempit pilihan model, tetapi tidak boleh memperluasnya.

**Disepakati. Opsi B, kode penjual berjalan di sandbox.** Pengguna ingin metode tetap dikerjakan oleh kode penjual, bukan hanya parameter untuk mesin platform. Kode penjual berupa WASM yang dijalankan runner milik platform di dalam TEE OutLayer, dengan dua lapis pembatas. Lapis luar adalah manifest OutLayer `{"capabilities":{"network":[]}}` pada custom section `outlayer.manifest`, yang menurut kode worker (`resolve_network_policy`) membuat program tidak dapat menghubungi host mana pun. *Diperbarui 14 November 2026 (runner 0.5).* Allowlist lapis luar kini berisi satu host, `cloud-api.near.ai`, agar fungsi panggil AI dapat bekerja. Kode penjual tetap tidak mendapat jaringan. Ia hanya dapat meminta runner memanggil model yang tercantum di manifest metode (bagian 65). Lapis dalam adalah interpreter `wasmi` di runner, yang hanya memberi fungsi yang diizinkan manifest metode (baca input, panggil AI, panggil konektor, kembalikan hasil) dan menolak import lain. Lapis dalam wajib karena manifest OutLayer hanya mengatur jaringan, tidak storage atau transaksi NEAR. Runner juga memakai jatah instruksi dan panjang keluaran tetap agar kode penjual tidak membocorkan data lewat jumlah instruksi yang tercatat publik di log OutLayer. Kode penjual dapat disimpan terenkripsi sebagai secret sehingga tetap rahasia bagi pembeli.

Batasan opsi B: runner dan bahasa fungsi untuk penjual harus dibuat platform, kecepatan interpreter di OutLayer belum diukur, kualitas keluaran tetap tanggung jawab penjual, dan browser agent tetap berjalan di backend biasa. Opsi A (parameter untuk runner platform) dan C (kode bebas) tidak dipilih. Spike lokal di `app/runner-spike/` dan `app/guest-spike/` menjalankan solver portofolio penjual dengan hasil benar dan menolak guest yang mencoba `env::http_post`. Eksekusi spike di OutLayer testnet belum berhasil (status di `BUILD_STATUS.md`).

**Disepakati. Dokumen status pengerjaan.** Dibuat `Product/BUILD_STATUS.md` dalam bahasa Indonesia sebagai acuan apa yang sudah dan belum dikerjakan, terpisah dari rancangan produk ini. Formatnya Markdown saja, karena dibaca agent dan sering berubah.

**Disepakati (13 November 2026). Stack frontend.** Next.js dengan deploy ke Vercel. Deploy publik tetap menunggu konfirmasi pengguna (batas agent di `NEAR.md`). Demo hosted harus tetap hidup sampai 18 November 2026 (Q-012).

**Disepakati (13 November 2026). Nama produk Kalis.** Dari KBBI, kalis berarti tidak dapat kena air atau tidak dapat basah (seperti daun keladi), kebal, dan terhindar dari bahaya. Kalis air berarti kedap air. Maknanya untuk produk: data pembeli dan rahasia penjual tidak tembus keluar. Ketersediaan merek dagang dan domain belum diperiksa. Kandidat lain yang tidak dipilih: Wangsit, Kriya, Saripati. Desain frontend dimulai dengan diskusi rancangan, lalu satu section hero landing page sebagai target pertama.

**Disepakati (13 November 2026). Arah visual landing page: batik tulis.** Prinsip batik tulis dipakai sebagai metafora: lilin malam melindungi bagian kain sehingga pewarna tidak meresap, sama dengan arti kalis. Palet solid nila, cokelat soga, putih mori, dengan amber malam sebagai tanda bagian yang terlindungi. Copy landing page berbahasa Inggris untuk juri internasional. Alternatif yang tidak dipilih: glovebox isolator laboratorium (hasil pengacak skill impeccable), papan split-flap, dan landing fintech standar. Risiko yang dicatat: kesan kerajinan atau wisata, dan metafora lilin belum tentu langsung dipahami juri luar negeri, sehingga hero harus tetap menampilkan potongan UI produk yang nyata. Skill UI UX Pro Max hanya dipakai untuk checklist UX, karena saran palet ungu-hijau dan font IBM Plex bertentangan dengan preferensi desain pengguna. Referensi struktur deltacafes.com dipakai untuk urutan dan ritme, bukan isi atau gaya.



## 53. Revisi hero berdasarkan HelloNear

**Disepakati, 13 November 2026.** Pengguna menilai draf hero batik dari Claude terlalu terasa AI generated atau AI slop. Pengguna memilih https://hellonear.xyz/ sebagai referensi tampilan yang simpel, bersih dan interaktif, lalu meminta pengerjaan dimulai. Preferensi SF Pro, warna solid, teks jelas, tanpa label di atas judul dan animasi bermakna tetap berlaku. Batik dapat menjadi aksen halus, bukan adegan utama. Arah ini menggantikan komposisi hero pada bagian 52.

**Implementasi draf, belum persetujuan hasil desain.** File `design/kalis-hero.html` diganti dengan komposisi lapang, latar terang dan satu adegan geometri 3D menggunakan Three.js lokal. Interaksi kursor dan tombol memperlihatkan data pembeli, metode penjual dan hasil privat. Draf sebelumnya disimpan di `design/kalis-hero-v1.html`. Visual baru dibuat sendiri, tanpa memakai artwork atau kode HelloNear. Teknologi animasi situs referensi belum dipastikan.

**Batas klaim.** Ini preview lokal, bukan aplikasi terintegrasi. Tombol memutar ilustrasi dan tidak memanggil API, wallet atau transaksi. Hasil memakai data sintetis C03 dan menautkan bukti sealed-probe historis. Runner opsi B tetap belum berhasil di testnet. Tidak ada perubahan cakupan produk atau keputusan arsitektur.

**Verifikasi dan titik lanjut.** Sintaks JavaScript, aset, anchor dan kontras teks diperiksa. Browser pengujian dan server localhost diblokir sandbox, sehingga render desktop/mobile dan tampilan WebGL belum diperiksa visual. Pengguna perlu melihat draf sebelum desain dianggap disetujui. Port ke Next.js dan publikasi belum dilakukan.


### 53.1 Review pengguna terhadap dua section pendukung

Pengguna menilai kemasan tiga use case pada Private by purpose dan penempatan daftar tiga langkah pada Share the outcome kurang rapi, lalu meminta kedua bagian direvisi terlebih dahulu. Revisi draf mengelompokkan tiga langkah ke satu panel berurutan dengan contoh visual yang sejajar. Tiga use case menjadi tab dengan satu panel contoh aktif, agar informasi tidak tersebar dalam tiga kolom. Status testnet probe, planned demo dan illustration only tetap terlihat pada contoh terkait. Pada layar kecil alur menjadi vertikal dan tab menjadi horizontal. Tidak ada perubahan kemampuan produk. Hasil revisi belum disetujui dan belum diperiksa dalam browser karena batas sandbox.


### 53.2 Kemasan disukai, isi tab dan kontrol diperjelas

Pengguna menyukai panel proses Share the outcome dan struktur tab Private by purpose. Persetujuan ini khusus kemasan kedua section, bukan persetujuan keseluruhan desain. Pengguna menilai isi masing-masing tab masih terlalu banyak teks dengan penempatan berantakan. Pengguna juga meminta tombol How it works terlihat jelas dapat diklik dan tiga pilihan tahap memiliki fungsi serta status yang jelas.

Revisi draf mempertahankan kedua struktur yang disukai. Isi setiap tab menjadi judul, satu kalimat dan tiga baris konsisten untuk masukan privat pembeli, metode ahli dan keluaran. Status implementasi berada pada satu baris tersendiri. How it works menjadi tombol sekunder berbidang putih, border dan ikon menuju section penjelasan. Kontrol ilustrasi menjadi urutan bernomor yang terhubung dengan keterangan fungsi, tahap aktif dan status Step 1 of 3 yang berubah mengikuti pilihan. Pada layar kecil, urutan menjadi vertikal. Kemampuan dan batas klaim produk tidak berubah. Pemeriksaan sintaks, referensi elemen dan perilaku tahap aktif lolos. Render browser masih belum diperiksa karena pembatasan sandbox. Hasil revisi ini menunggu review.


### 53.3 Hook hero yang dipilih pengguna

**Disepakati.** Pengguna memilih kalimat “Where expertise is traded, run privately, and improved together.” sebagai hook hero, lalu meminta penerapannya dilanjutkan. Kalimat ini menggambarkan keahlian yang diperdagangkan, dijalankan secara privat dan dikembangkan bersama. Pengguna menginginkan sudut pandang setara bagi penjual serta pembeli, tanpa keberpihakan melalui kata your atau their. Opsi imperatif “Trade expertise. Run it privately. Improve it together.” tidak dipilih.

Hook diterapkan pada draf lokal. Kalimat ini menyatakan arah produk, bukan bukti bahwa marketplace, eksekusi privat dan perbaikan bersama sudah terintegrasi penuh. Label preview dan batas implementasi tetap berlaku. Kemasan dua section pendukung yang disukai tetap dipertahankan.


### 53.4 Deskripsi pendukung dan background bergambar

Pengguna meminta deskripsi di bawah hook diselaraskan dengan kalimat yang dipilih. Pengguna juga meminta background berupa gambar seperti suasana HelloNear, bukan bidang warna polos. Draf deskripsi menjadi “Buy and sell expert methods in a private AI workspace. Keep methods and sensitive data protected, and fund improvements together.” Kalimat ini mencakup marketplace, workspace privat, perlindungan kedua pihak dan pendanaan perbaikan bersama.

Draf memakai background lanskap orisinal yang dibuat melalui imagegen bawaan. Langit lapang, bukit hijau kebiruan dan batu terang menjadi latar adegan Three.js, tanpa menyalin artwork HelloNear. Aset lokal design/assets/kalis-landscape-v1.webp berukuran 1672 × 941 dan sekitar 76 KB. Prompt serta provenance disimpan di file pendamping. Tinggi gambar mengikuti area header dan hero. Teks tetap berupa HTML. Kontrol kecil memakai bidang solid untuk menjaga keterbacaan di atas gambar.

Aset gambar sudah diperiksa visual. Sintaks dan referensi aset diperiksa lokal. Render halaman terintegrasi desktop/mobile masih belum diperiksa karena batas sandbox. Draf menunggu review pengguna. Hook pilihan pengguna, struktur section yang disukai dan batas klaim preview tetap berlaku. Tidak ada perubahan arsitektur atau transaksi.


### 53.5 Adegan hero menyatukan privasi, keahlian dan kontribusi

Pengguna menyukai background lanskap, tetapi menilai elemen foreground belum menyatu dengan tema privacy, expertise dan pengembangan bersama. Pengguna mengizinkan percobaan adegan pengganti berupa metode modular yang dikembangkan bersama dan dijalankan dalam ruang terlindungi.

Draf mengganti cincin mengambang dengan satu bidang kerja 3D yang berpijak di lanskap. Masukan tersegel, ruang eksekusi tertutup, modul metode dan keluaran berada pada satu susunan. Warna keramik terang, biru, hijau redup dan amber mengikuti pencahayaan lanskap. Tombol Preview an improvement memperlihatkan satu modul kontribusi bergabung ke susunan metode dan dapat direset. Pemilihan tahap tetap memperlihatkan proses privat dan keluaran sintetis. Background dan hook yang dipilih tetap dipertahankan.

Bentuk geometri Three.js, kontrol bergabung/reset kontribusi dan keluaran diperiksa dengan renderer pengganti di Node. Ini memeriksa konstruksi scene dan state, bukan piksel WebGL. Render browser terintegrasi tetap belum diperiksa karena sandbox. Draf menunggu review pengguna. Tidak ada sistem kontribusi, DAO atau eksekusi backend baru yang dibangun melalui ilustrasi ini.


### 53.6 Ilustrasi siklus produk lengkap menggantikan abstraksi tiga tahap

Pengguna menolak ilustrasi hero sebelumnya karena tidak menjelaskan cara kerja Kalis dengan benar. Pengguna menginginkan alur sejak expert mendaftarkan dan menjual expertise, pembeli membelinya, metode diterapkan ke data pribadi, hasil diterima, perbaikan dilakukan dan aliran uang dijelaskan. Instruksi melanjutkan setelah giliran terputus mengizinkan penyelesaian alur ini.

Draf mengganti scene geometri Three.js dengan ilustrasi UI produk dan diagram konkret dalam enam tahap yang dapat dipilih.

1. Expert mempublikasikan metode privat, menetapkan harga dan mencatat pemilik serta hash versi di NEAR.
2. Pembeli meninjau metode, izin dan biaya. Harga metode serta infrastruktur dibayar di awal, dengan jalur fiat atau crypto. Top-up fiat MVP tetap mock.
3. Metode privat dijalankan pada data pembeli yang dienkripsi di perangkat, di dalam runtime terlindungi.
4. Pembeli membuka keluaran terenkripsi. Contoh C03 menunjukkan jual 3 A, beli 2 C dan biaya 0,18, dari sealed-probe historis.
5. Diagram menjelaskan pendapatan expert, biaya infrastruktur dan dana perbaikan bersama. Proposal DAO mendanai bounty. Tidak ada angka persentase baru yang ditetapkan.
6. Kontributor mengajukan patch pada modul yang dibuka. Pengujian privat memerlukan izin pemilik data. Setelah pemeriksaan dan penerimaan, bounty dibayar dan versi baru beserta kontributor dicatat. Ilustrasi v2 kembali ke marketplace.

Yang diperbaiki adalah metode, bukan data pribadi pengguna. Pemakaian data untuk pekerjaan biasa tidak otomatis memberi izin untuk pengujian perbaikan. Metode dan data tidak dibuka kepada pihak lawan. Detail pembagian pembayaran, DAO dan ketentuan penerimaan tetap mengikuti keputusan serta pertanyaan terbuka sebelumnya.

File aktif memakai design/kalis-story.css dan design/kalis-story.js. Tombol tahap, sebelumnya/berikutnya dan play/pause mengatur cerita yang sama. Tidak ada autoplay saat halaman dibuka. Reduced motion memakai navigasi manual tanpa perpindahan otomatis. Hook, background yang disukai dan struktur section pendukung dipertahankan.

**Batas bukti.** Ini ilustrasi alur produk yang dituju, bukan integrasi selesai. Tidak ada API, wallet, pembayaran atau perubahan versi sungguhan. Registry dan sealed-probe historis tetap dibedakan dari marketplace, distribusi pembayaran, DAO, bounty dan v2 yang masih ilustratif. Sintaks, keenam panel, navigasi, timer playback, jeda saat halaman tersembunyi, reduced motion, aset dan referensi elemen diperiksa lokal. Detector layout berjalan terbatas tanpa parser lengkap. Render browser masih belum diperiksa karena batas sandbox. Draf menunggu review pengguna.


## 53.7 Ilustrasi hero minimal dan otomatis

Dien meminta ilustrasi yang menggambarkan kegiatan tiap tahap, minim teks, animasi dan auto-next. Navigasi enam kartu terpisah dihapus. Kontrol sebelumnya, jeda/putar, berikutnya serta titik tahap berada di hero.

Draf memakai objek vektor animasi dalam lanskap yang telah dipilih. Metode dipublikasikan ke marketplace, pembeli membayar akses, metode dan data masuk runtime privat, hasil kembali ke pembeli, pembayaran menuju expert/infrastruktur/dana bersama, lalu kontribusi diuji menuju versi baru. Setiap adegan memiliki judul pendek dan satu kalimat.

Perpindahan otomatis setiap tujuh detik, melingkar. Navigasi manual menjeda cerita. Halaman tersembunyi menghentikan timer dan animasi. Reduced motion menggunakan langkah manual. Hook, background dan section pendukung dipertahankan.

Ini ilustrasi rancangan, bukan eksekusi atau pembayaran nyata. Pembagian biaya belum final. Perbaikan adalah pada metode/modul terbuka, bukan penggunaan otomatis data privat. Pengujian kasus privat tetap membutuhkan izin pemilik. Detail batas implementasi tersedia melalui tautan bukti. Draf visual menunggu review pengguna.


## 53.8 Perbaikan layout dan ilustrasi Three.js

Screenshot Dien memperlihatkan caption keluar dari area ilustrasi dan menimpa kontrol. Penyebabnya class scene-caption mewarisi position absolute dari CSS lama. Class baru kalis-caption memakai alur dokumen biasa dalam kolom ilustrasi, dengan kanvas, caption dan kontrol berurutan.

Atas permintaan Dien, draf memakai Three.js lokal dengan enam kegiatan yang sama. Objek metode, marketplace, dompet, runtime, hasil, dana dan modul versi menggunakan warna langit, hijau dan batu terang. SVG menjadi fallback bila WebGL tidak tersedia.

Caption dan kontrol berada di bidang terang solid agar kontras tidak bergantung foto. Tombol utama kontrol 44 piksel, pilihan tahap 28 piksel, fokus terlihat, tahap aktif dibedakan bentuk dan warna. Autoplay dapat dijeda, navigasi/fokus keyboard menjeda, reduced motion manual dan halaman tersembunyi menghentikan animasi. Rujukan WCAG 2.2 mencakup 1.4.3, 2.2.2 dan 2.5.8. Ini bukan klaim lulus audit WCAG menyeluruh.

Sintaks JavaScript diperiksa. Render WebGL dan layout browser belum terverifikasi di lingkungan terbatas. Hasil perlu review pengguna. Tidak ada perubahan kemampuan backend atau transaksi.


## 54. Pembagian pembayaran, temuan Trezu, dan penyebab kegagalan OutLayer

**Disepakati (13 November 2026). Pembagian pembayaran per eksekusi.** Penjual menentukan porsi dana DAO di manifest metodenya, dengan minimal 10%. Porsi platform tetap 10%. Sisanya untuk penjual, sehingga penjual menerima paling banyak 80%. Angka ini berlaku untuk demo testnet dan dapat ditinjau sebelum produk nyata. Penegakan batas minimal dilakukan kontrak pembayaran, bukan hanya UI.

**Temuan Trezu (riset agent, belum keputusan).** Menurut dokumentasi resmi (`NEAR-DevHub/trezu-docs`, `what-is.mdx`), treasury Trezu adalah kontrak multisig Sputnik DAO di NEAR, dan DAO `.sputnikdao.near` yang sudah ada otomatis muncul di Trezu. Trezu juga punya treasury konfidensial di private shard NEAR. Menurut README frontend di repo `NEAR-DevHub/trezu`, backend produksinya hanya mainnet, dan DAO testnet hanya dapat dilihat lewat backend mock lokal untuk development. Implikasi menurut agent: DAO dibangun dengan kontrak Sputnik DAO di testnet agar tetap kompatibel dengan Trezu, sedangkan tampilan di aplikasi Trezu memerlukan DAO mainnet. Pilihan akhir menunggu pengguna.

**Penyebab kegagalan OutLayer (penelusuran agent).** Program yang sempat berhasil adalah `sealed-probe` (request 38119, sekitar 11:45 UTC). Pada 13 November 15:17–15:30 UTC, dari 22 eksekusi jalur on-chain terbaru di kontrak `outlayer.testnet`, 17 gagal dan 5 berhasil. Kegagalan menimpa sedikitnya empat akun berbeda (`enclave.parry.testnet`, `tredio-oracle.testnet`, `zyx-dev.testnet`, `scientivan.testnet`). Statistik publik pada menit yang sama menunjukkan eksekusi lain tetap berhasil, kemungkinan lewat jalur HTTPS. Kegagalan kita tercatat sebagai `failed_executions` umum, bukan kegagalan kompilasi, akses, atau pembayaran. Kesimpulan agent: jalur on-chain OutLayer testnet sedang terganggu secara luas dan tidak disebabkan kode Kalis. Penyebab teknis di sisi OutLayer belum diketahui.

**Disepakati (13 November 2026). Dana bersama memakai Sputnik DAO di testnet.** Alasannya, treasury Trezu adalah kontrak Sputnik DAO, sehingga DAO yang dibuat tetap kompatibel dengan Trezu. Tampilan di aplikasi Trezu memerlukan DAO mainnet dan menunggu konfirmasi pengguna. Pengguna memutuskan tidak melaporkan gangguan OutLayer ke tim OutLayer. Agent mencari faucet USDC testnet untuk mencoba jalur HTTPS OutLayer.


## 53.9 Preferensi karakter bullet dan kelanjutan kontrol

Dien meminta preferensi desain tanpa karakter bullet points disimpan. Pemisah middle dot pada halaman preview diganti tanda titik dan kalimat biasa. Indikator interaktif tahap tetap merupakan kontrol navigasi, bukan bullet dalam teks.

Fokus pada tombol putar/jeda tidak lagi mengubah status sebelum klik diproses, sehingga klik jeda pertama tidak memulai ulang animasi. Fokus pada kontrol lain tetap menjeda. Tidak ada perubahan kemampuan produk.


## 55. Pembahasan navigasi aplikasi dan istilah metode

Keputusan pengguna. Fokus sementara berpindah dari landing page ke halaman aplikasi. Portofolio, tender dan negosiasi gaji disebut metode yang dijual di marketplace, menggantikan penyebutan use case untuk contoh penawaran tersebut. Status implementasi masing-masing tetap mengikuti BUILD_STATUS.md.

Pembahasan dimulai dari nav items sidebar untuk setiap peran pengguna. Struktur berikut adalah usulan Codex, belum disetujui.

Peran yang dipetakan adalah pemakai/pembeli, pembuat/penjual, kontributor, serta anggota atau pengelola dana bersama. Reviewer adalah kewenangan yang diberikan pada alur kontribusi, bukan otomatis setiap kontributor. Satu orang dapat menjalankan beberapa peran.

Usulan navigasi bersama adalah Workspace, Marketplace, Activity, Balance dan Settings. Workspace menampung pekerjaan dan hasil privat, Activity memusatkan status dan kebutuhan persetujuan, Balance mencakup saldo serta transaksi, dan Settings memuat akun serta koneksi/izin.

Penjual mendapat My methods untuk publikasi, versi dan modul serta Earnings untuk pendapatan. Kontributor mendapat Bounties dan My contributions. Anggota dana mendapat Shared fund yang memuat saldo dana, proposal, voting sesuai hak akses, dan pembayaran. Reviewer melihat antrean review sesuai kewenangan.

Pilihan arsitektur yang dibahas adalah sidebar adaptif dengan tambahan peran, pergantian mode peran, atau seluruh menu ditampilkan bersama. Rekomendasi sementara adalah sidebar adaptif agar pengguna dasar tetap sederhana dan pengguna multirole tidak harus berpindah akun. Belum ada keputusan final hak akses, struktur sidebar, atau implementasi halaman.


## 56. Audit cakupan lima menu aplikasi (usulan)

Pengguna meminta semua halaman dan alur dipetakan sebagai child Workspace, Marketplace, Activity, Balance dan Settings, serta penilaian sidebar gabungan tanpa switch role. Ini audit arsitektur informasi, belum persetujuan menu atau penambahan kemampuan produk.

Workspace menampung daftar pekerjaan, pekerjaan baru, input/dokumen, pemilihan metode dan model, pemeriksaan izin/biaya sebelum eksekusi, status run dan hasil, file privat, memori serta izin kasus uji. Form portofolio dan tender merupakan detail metode, bukan nav utama. Negosiasi gaji masih ilustrasi.

Marketplace menampung katalog/pencarian, detail metode dan profil pembuat, metode yang dipakai, My methods, editor publikasi/harga/manifest, versi dan modul kontribusi, serta ruang perbaikan per metode. Ruang perbaikan mencakup masalah, bounty, pengajuan kontribusi, pengujian, review dan lineage. Direktori bounty lintas metode dapat menjadi tab tambahan. Profil pembuat, harga dan hasil uji membantu evaluasi, mekanisme rating dan trial tetap belum final.

Activity adalah inbox lintas area untuk riwayat kejadian, status pekerjaan, permintaan persetujuan, pembaruan kontribusi, review dan proposal. Item Activity mengarah ke halaman asal, bukan menjadi salinan halaman pengelolaan. Persetujuan tindakan melekat pada run, review melekat pada kontribusi, voting melekat pada proposal.

Balance menampung saldo pribadi, top-up mock/crypto, pembayaran dan rincian biaya, pendapatan penjual, pembayaran bounty serta catatan distribusi. Dalam pemetaan lima menu, Shared fund ditempatkan di sini dengan saldo/arus dana, proposal, voting, alokasi bounty dan pencairan sesuai kewenangan. Dana bersama harus terpisah jelas dari uang pribadi dan pendapatan platform. Ini penempatan yang lemah secara semantik karena governance lebih luas daripada balance. Dasar persentase terhadap harga metode atau total berikut infrastruktur perlu diperjelas saat checkout, tanpa mengarang kebijakan baru.

Settings menampung akun/profil, preferensi aksesibilitas, koneksi layanan dan pencabutan akses, kontrol privasi/retensi serta preferensi model dalam batas metode. Konfigurasi browser/kredensial berada pada koneksi, persetujuan operasi spesifik berada pada run. Retensi, penghapusan, penarikan saldo, refund, sengketa dan trial belum menjadi mekanisme final. Login/onboarding berada sebelum shell aplikasi. Notifikasi dan akun dapat memakai header/footer sidebar. Admin platform belum dirancang dan tidak diasumsikan sebagai role MVP.

Hasil audit sementara. Seluruh area inti dapat memiliki alamat di lima parent, tetapi Marketplace menjadi padat dan Balance kurang tepat untuk governance. Alternatif yang direkomendasikan adalah enam parent dengan penambahan Community untuk dana bersama, proposal, bounty, kontribusi dan review. Tidak perlu switch role. Kewenangan mengontrol aksi dan akses data, bukan perpindahan akun. Jika lima parent wajib, struktur lima menu di atas tetap dapat digunakan dengan tab pada halaman, tanpa membuka semua child di sidebar.

Menggabungkan semua item usulan bagian 55 secara datar menghasilkan 11 item, berisiko berat untuk pengguna awal. Lima atau enam parent dengan child kontekstual menjaga sidebar ringkas. Hak melihat menu tidak otomatis memberi akses data privat atau hak menandatangani transaksi.


## 57. Draf halaman aplikasi dengan referensi Corbel

Keputusan pengguna. Settings tidak menjadi item navigasi utama. Nama pengguna dapat diklik untuk membuka dropdown dengan tiga tujuan, yaitu Account, Connections, dan Permissions & preferences. Pengguna meminta draf frontend memakai impeccable dan skill design-intelligence dari ryuxdsgn, dengan dua screenshot Corbel Supply Co. sebagai arah visual minimalis, bersih, penempatan jelas dan pengemasan sederhana.

Implementasi draf berada di design/app/index.html. Lima tujuan utama adalah Workspace, Marketplace, Community, Activity dan Balance, tanpa switch role. Draf menafsirkan susunan referensi sebagai navigasi horizontal di atas dan rail alat bantu kecil di kiri. Ini pilihan komposisi draf yang menunggu review pengguna, bukan persetujuan final seluruh desain. Pada mobile rail disembunyikan, pencarian tetap tersedia di header, dan tabel pekerjaan berubah menjadi susunan ringkas yang dapat dibaca.

Workspace menampilkan pekerjaan terakhir, hasil portofolio sintetis historis, permintaan persetujuan tender, daftar pekerjaan, file contoh dan memori. Form pekerjaan baru memilih metode portofolio atau tender, menerima nama dan batas input, menampilkan review, lalu menyimpan draf sesi. Batas input disimpan tetapi tidak menghitung ulang hasil C03.

Marketplace memiliki pencarian, filter kategori, tiga metode contoh, detail dan draft My methods. Publikasi hanya menyimpan draf sesi. Tidak ada harga penjual atau rating yang dikarang. Negosiasi gaji tetap ilustrasi yang tidak dapat dijalankan. *Diperbarui 14 November 2026.* Negosiasi gaji kini dapat dijalankan sebagai metode prompt `salary-counteroffer` di backend, sehingga UI perlu menampilkannya sebagai metode yang dapat dijalankan beserta label bentuknya (bagian 65). Editor draf memakai aturan alokasi dana bagian 54, tanpa menjalankan pembayaran.

Community menampilkan penjelasan alur kontribusi, tab bounty, kontribusi dan dana bersama. Halaman dengan data yang belum terhubung memakai keadaan kosong yang jelas. Activity memungkinkan peninjauan contoh permintaan memori dan tindakan eksternal. Keputusan memperbarui jumlah tertunda serta status pekerjaan terkait, dan persetujuan memori menambahkan catatan contoh ke daftar memori.

Balance memiliki keadaan belum terhubung, top-up mock, proses pemuatan, simulasi gagal/coba lagi, pembatalan dan catatan transaksi mock individual. Account mengubah nama tampilan selama sesi. Connections dapat mengubah status konektor mock. Permissions & preferences menampilkan kebijakan izin serta kontrol reduced motion.

Batas draf. HTML/CSS/JavaScript lokal dapat dibuka langsung tanpa server. Ini artifact review visual, bukan pengganti keputusan stack produksi Next.js. Semua perubahan berada di memori sesi dan hilang setelah reload. Tidak ada autentikasi, enkripsi, unggahan dokumen asli, panggilan API, penandatanganan, transaksi, publikasi metode atau eksekusi model. Status teknis backend tetap mengikuti BUILD_STATUS.md dan tidak disimpulkan dari draf UI.

Verifikasi. Sintaks dua script lolos, sembilan pemeriksaan controller memakai DOM doubles lolos, struktur shell/aset/referensi/karakter bullet diperiksa, dan tujuh pasangan warna teks yang dihitung melampaui rasio 4,5. Reviewer terpisah memeriksa delapan temuan kode dan menyatakan perbaikannya resolved. Itu bukan audit render. Chromium gagal dengan izin MachPortRendezvous 1100, sehingga layout desktop/mobile, fokus native dan kesesuaian visual belum terverifikasi. Detector impeccable berjalan dalam mode regex terbatas. CLI RYUX tidak terpasang karena akses Git dari terminal gagal, tetapi SKILL.md dan modul terkait dibaca lewat sumber resmi GitHub.

Dokumentasi artifact berada di design/app/README.md, DESIGN.md dan REVIEW.md. Preview menunggu review Dien. Tidak ada perubahan backend atau deployment publik.

## 55. Laporan eksekusi dan cek ulang di perangkat pembeli

**Disepakati (13 November 2026).** Pengguna ingin memastikan setiap tahap yang dijalankan metode benar-benar selesai tanpa kendala, tidak hanya bahwa jawaban akhirnya ada. Tiga tambahan disepakati dan sudah dibangun.

1. **Laporan eksekusi di dalam jawaban tersegel.** Runner mencatat tujuh tahap miliknya: membuka metode, membuka data, mengecek bahwa metode tanpa import, menjalankan metode, membaca jawaban, menghabiskan sisa fuel, menyegel jawaban. Setiap tahap diberi status berhasil atau gagal beserta keterangannya. Sejak runner 0.5, tahap cek import menerima satu import, `kalis.ai_chat`, bila manifest mengizinkan model AI. Setiap panggilan AI juga dicatat di laporan beserta bukti attestation dan tanda tangannya (bagian 65). Metode penjual mendeklarasikan daftar langkahnya di manifest (bidang `steps`) dan melaporkan setiap langkah saat berjalan. Runner membandingkan laporan dengan manifest, lalu menandai langkah yang hilang, gagal, tidak dideklarasikan, atau tidak berurutan. Batasnya, langkah metode adalah klaim penjual tentang kodenya sendiri. Runner hanya bisa memastikan semua langkah dilaporkan dan ditandai berhasil.
2. **Cek ulang di perangkat pembeli.** Setelah jawaban dibuka, aplikasi pembeli menghitung ulang dengan data miliknya sendiri: batas kas, porsi aset, batas sektor, larangan short dan jual, serta biaya. Setiap pemeriksaan menghasilkan kalimat yang bisa langsung ditampilkan. Cek ini menangkap jawaban yang melanggar batas atau salah menyebut biaya, tetapi tidak dapat membuktikan jawaban adalah yang termurah, dan tidak dapat memastikan klaim "tidak ada transaksi yang memenuhi semua batas".
3. **Pencocokan bukti chip.** Klien mencocokkan `input_hash` dan `output_hash` di attestation OutLayer dengan pesan yang benar-benar dikirim dan diterima, serta `executed_wasm_sha256` dengan `runner_hash` di registry.

**Mekanisme peringatan (usulan agent, tampilan dikerjakan Codex).** Hasil laporan dan cek ulang diringkas menjadi satu status per run: aman untuk dipakai, perlu perhatian, atau jangan dipakai. Bila ada pemeriksaan yang gagal, aplikasi menampilkan kalimat penyebabnya dan menyarankan agar transaksi yang direkomendasikan tidak dijalankan. Mekanisme refund atau sengketa belum dirancang (bagian 46), jadi peringatan tidak menjanjikan pengembalian dana.



## 58. Review visual aplikasi dan kebutuhan detail metode

Keputusan pengguna, 14 November 2026. Dien menolak bidang pastel pada status, istilah metode panjang atau tidak umum dan kapitalisasi tidak konsisten, keterangan preview serta privasi yang terlepas dari konteks, strip promosi marketplace yang penempatannya tidak jelas, dan pengemasan detail metode yang tidak familiar. Pengguna meminta analisis, riset produk pembanding dan pembacaan ulang rancangan. Pengguna mengizinkan dua assessment independen sesuai impeccable.

Analisis dan usulan Codex dicatat di design/app/CRITIQUE.md. Pembanding resmi yang dibaca adalah halaman model Replicate FLUX dev, template invoice n8n, dan dokumentasi Hugging Face Model Cards. Pola yang relevan adalah contoh keluaran, identitas pembuat, cara kerja serta persiapan, batas penggunaan dan hasil evaluasi. Riset ini berdasarkan konten publik, bukan audit visual browser pembanding.

Detail metode perlu mendukung keputusan pembeli melalui nama dan manfaat, pembuat, versi, contoh hasil, input dan format, batas penggunaan, harga metode serta biaya infrastruktur sebelum komitmen, dan kebutuhan model/konektor/izin sesuai metode. Bukti uji harus terikat versi dan terpisah dari rating pengalaman. Riwayat versi, atribusi dan ruang kontribusi harus mengarah ke metode yang sama. Laporan eksekusi aktual, cek ulang pembeli dan bukti run tampil setelah eksekusi, bukan dipalsukan sebagai hasil di halaman katalog.

Usulan layout adalah konten utama dengan contoh hasil dan satu panel biaya/tindakan, lalu informasi pendukung melalui kelompok atau tab yang jelas. Preview cukup diberitahukan di shell dan pada aksi/data contoh yang relevan. Ini bukan persetujuan layout atau perubahan frontend. Tidak mengarang nominal, penjual, rating, trial, refund atau lisensi. Aturan pembagian dana mengikuti bagian 54, dengan dasar persentase tetap perlu diperjelas.

Audit penuh tersedia di design/app/CRITIQUE.md dan snapshot impeccable. Pemeriksaan native browser tetap terbatas. Tidak ada perubahan backend, publikasi atau transaksi.


## 59. Revisi seluruh area Marketplace dan penegasan rating

Keputusan pengguna. Rating dari pengguna metode merupakan informasi yang harus terlihat di Marketplace. Catatan mekanisme rating yang belum final tidak menjadi alasan menghilangkan informasi rating dari rancangan UI. Pengguna meminta perbaikan seluruh halaman Marketplace terlebih dahulu.

Draf katalog kini menampilkan nama metode konsisten, kategori, deskripsi, pembuat, rating dan jumlah ulasan, serta status ketersediaan. Detail metode memakai contoh hasil sebagai konten utama dengan panel pemakaian, harga dan biaya, kebutuhan input/akses, bukti serta batas. Reviews, Versions dan Contributions memiliki alamat per metode. Label preview berulang di heading Marketplace dihapus, pemberitahuan global tetap tersedia. Badge pastel tidak digunakan pada halaman Marketplace baru.

Karena data pengguna belum terhubung, rating dinyatakan No ratings yet dan jumlah ulasan nol. Tidak ada rating, ulasan, penjual atau harga yang dikarang. Rating pengalaman tetap berbeda dari bukti pengujian. My methods dan Create method dirapikan, dengan input, keluaran, akses dan keterbatasan tersimpan dalam draf sesi. Publikasi dan pembayaran tidak dijalankan.

Sebelas pemeriksaan controller lolos termasuk rute detail turunan, keadaan rating kosong, penyimpanan metadata draf dan escaping. Ini pemeriksaan DOM doubles, bukan render browser. Tampilan responsif telah diatur dalam CSS tetapi belum diperiksa melalui browser native karena batas lingkungan. Preview di design/app/index.html.

## 56. Escrow berbasis tahap, aturan yang bisa dicek pembeli, dan tambalan jumlah instruksi

**Disepakati (14 November 2026). Escrow.** Pembayaran per eksekusi ditahan kontrak escrow di NEAR dan hanya dilepas bila semua tahap eksekusi berhasil. Pelepasan tidak bergantung pada bagus atau buruknya hasil metode. Mekanisme yang disetujui:

1. Pembeli membayar ke kontrak escrow dengan nomor run unik.
2. Runner di TEE mengeluarkan tanda selesai yang ditandatangani kunci yang dibuat di dalam TEE (fitur Signing Keys OutLayer). Isinya nomor run, status semua tahap, dan sidik jari data pembeli. Tanda ini terpisah dari jawaban tersegel.
3. Kontrak memverifikasi tanda tangan. Bila semua tahap berhasil, dana dibagi ke penjual, dana DAO, dan platform sesuai bagian 54. Bila ada tahap gagal atau langkah metode yang hilang, dana dikembalikan ke pembeli.
4. Bila tanda selesai tidak datang dalam batas waktu, pembeli dapat menarik dananya sendiri.

Konsekuensinya, metode yang menjawab "tidak ada solusi" dengan semua tahap berhasil tetap dibayar. Status berhasil atau tidaknya sebuah run menjadi publik, sedangkan data dan jawaban tetap rahasia. Cek ulang di perangkat pembeli tidak memicu escrow, karena hasilnya dapat diklaim sepihak.

**Disepakati. Aturan yang bisa dicek pembeli.** Pengecekan di perangkat tidak menjalankan ulang metode. Pengecekan hanya memeriksa apakah jawaban mematuhi aturan milik pembeli sendiri (data, batas, tarif). Penjual mendeklarasikan di manifest aturan mana yang dapat dicek pembeli. Bila tidak ada, aplikasi menulis bahwa hasil tidak dapat dicek di perangkat. Portofolio dapat dicek penuh untuk batas dan biaya, tender hanya sebagian.

**Disepakati. Selisih jumlah instruksi ditambal.** Tujuannya memperkecil selisih jumlah instruksi publik antar run. Penjelasan agent: tambalan dapat memperkecil selisih tetapi tidak menjamin angka persis sama, karena runner tidak dapat membaca penghitung instruksi OutLayer.

**Hasil tambalan (13 November 2026 17:45 UTC).** Runner 0.3 memakai sisa fuel untuk menjalankan ulang metode yang sama. Total kerja chip turun sekitar tiga kali dan status feasible atau infeasible tidak lagi terpisah rapi, tetapi satu kasus (C09) masih sekitar 7% lebih rendah. Selisih tidak dapat dihapus penuh dari sisi platform. Keterbatasan ini ditulis di README. Rincian di `BUILD_STATUS.md` 6.10.


## 60. Referensi katalog dan detail OKX AI

Pengguna meminta halaman okx.ai/agents dan okx.ai/agents/5537 dipelajari sebagai referensi gambar, deskripsi, layout, positioning, perilaku dan pengemasan elemen. Kajian disimpan di design/app/OKX_REFERENCE.md. HTML dan CSS kedua halaman berhasil dibaca. Interaksi browser belum diuji.

Temuan sumber adalah gambar identitas konsisten dari katalog ke detail, pengelompokan nama/deskripsi/statistik/harga dalam kartu, identitas di detail, layanan dengan biaya dan tindakan konsisten, serta ringkasan rating, distribusi bintang dan ulasan di halaman detail. CSS mengatur avatar, batas baris deskripsi dan variasi responsif. Tombol View all dan Use now ditemukan tetapi hasil klik tidak diklaim sudah diuji.

Usulan penerapan adalah gambar metode, nama dan deskripsi ringkas, pembuat dan rating/jumlah ulasan, harga/satuan, serta ringkasan Reviews langsung di detail. Semua memakai data nyata atau keadaan kosong jujur. Foto pembuat tidak boleh berasal dari stok yang menyiratkan identitas nyata. Tidak menyalin nilai rating/penjualan OKX atau otomatis menambahkan agent dengan banyak services. Palet, aturan akses dan versi mengikuti keputusan Kalis. Ini pembelajaran referensi, belum implementasi baru.


## 61. Penerapan referensi OKX pada draf Marketplace

Pengguna menyetujui penerapan pembelajaran bagian 60. Draf design/app memakai foto cover lokal pada katalog, identitas detail, subhalaman metode dan draf penjual. Foto adalah suasana arsitektur/ruang kerja, bukan identitas pembuat. Sumber foto Unsplash dicatat di design/app/assets/README.md. Aset OKX dan data rating/penjualnya tidak disalin.

Kartu katalog horizontal dengan cover, kategori, nama/deskripsi, pembuat, rating/jumlah ulasan, ketersediaan dan tempat harga yang konsisten. Seluruh kartu merupakan satu tautan tanpa tautan bersarang. Detail mengulang gambar yang sama dan mengelompokkan identitas dengan rating. Reviews di overview dan halaman tersendiri menampilkan skor kosong dan distribusi nol, tanpa ulasan buatan. Form pembuat dapat memilih tiga cover, melihat preview dan menyimpan pilihan ke draf sesi.

CSS mengatur susunan dua kolom katalog lalu satu kolom pada layar lebih kecil, pengecilan cover, pembungkusan judul, fokus keyboard dan reduced motion. Panel penggunaan sticky hanya pada desktop cukup tinggi dan kembali statis pada mobile. Sintaks script dan sebelas pemeriksaan controller lolos, termasuk aset cover dan penyimpanan pilihan. Ini bukan verifikasi native browser. Tidak ada perubahan backend, pembelian, eksekusi atau publikasi.


## 62. Audit cakupan seluruh frontend terhadap rancangan

Permintaan pengguna. Fokus sementara bergeser dari optimasi UI UX menjadi memastikan komponen, halaman dan fitur rancangan terwakili di frontend. Audit lengkap tersimpan di design/app/COVERAGE.md dengan acuan bagian, rute, status interaktif/draf/viewer/parsial serta batas integrasi. Bagian bernomor ganda 55 tentang laporan eksekusi dan 56 tentang escrow dibaca berdasarkan isinya, bukan diabaikan karena nomor berulang.

Hasil awal. Draf belum lengkap. Celah utama meliputi manifest dan harga penjual, model proprietary dan consent, input multimodal, izin kasus privat, rangkaian kontribusi dan DAO, laporan tahap dan cek ulang pembeli, serta escrow. Dua puluh tiga rute workflow ditambahkan melalui design/app/flows.js. Form menyimpan catatan sesi dengan tautan langkah berikutnya. Model pembeli dibatasi kebijakan seller pada konfigurasi sesi, default private only. Proprietary memerlukan rencana redaksi dan consent. Checkout memeriksa maksimum total dan rentang dana bersama. Izin kasus privat terpisah dari training dan dapat dicabut pada sesi.

Viewer report memakai fixture sintetis untuk tahap lengkap, langkah hilang/tidak berurutan, mismatch hash, cek pembeli gagal dan tidak ada aturan yang bisa dicek. Viewer escrow menampilkan contoh held, released, returned dan timeout dengan reclaim simulasi. Tidak ada transaksi atau verifikasi kriptografi yang diklaim. File hanya metadata nama, tanpa membaca atau mengunggah isinya.

Cakupan belum 100% operasional. Halaman baru masih draf atau viewer. Input/model/checkout/run belum satu perjalanan terintegrasi penuh. Rangkaian issue–budget–bounty–candidate–test–review–payout–versi belum state machine otoritatif. Profil pembuat dan manifest belum terhubung ke publikasi. Koreksi memori dan scope koneksi belum memperbarui state sumber. Login belum menjadi gerbang sebelum shell. Backend, auth, enkripsi, upload, evaluator, attestation, escrow serta DAO tidak diimplementasikan oleh preview ini. Status backend aktual tetap mengikuti BUILD_STATUS.md.

Enam belas controller checks dengan DOM doubles lolos, termasuk rute baru, batas model, consent, checkout, escaping, revoke dan state fixture. Sintaks diperiksa. Review independen dipakai untuk menemukan celah perjalanan, bukan mengklaim halaman kosong sebagai fitur selesai. Browser native tetap belum terverifikasi. Tidak ada perubahan keputusan trial/lisensi/royalti/sengketa mutu yang masih terbuka, tidak ada NFT atau perdagangan nyata.

**Implementasi escrow (13 November 2026, catatan teknis).** Registry dan escrow digabung di kontrak `market.scientivan.testnet` agar harga, porsi DAO, dan hash versi dapat dibaca saat pembayaran. Dana bersama adalah Sputnik DAO `kalis-fund.sputnik-v2.testnet`. Pembayaran demo memakai NEAR testnet dengan harga contoh 0,1 NEAR per run. Alur sukses (dana terbagi 80/10/10) dan alur gagal (dana kembali ke pembeli) terbukti di testnet. Rincian bukti di `BUILD_STATUS.md` 6.11.

## 57. Bounty DAO dan versi kontributor (implementasi)

Langkah 4 dan 5 alur demo (bagian 47) terbukti di testnet pada 13 November 2026. Council DAO `kalis-fund` menyetujui bounty 0,01 NEAR untuk membuat metode portofolio lebih hemat komputasi tanpa mengubah jawaban. Akun kontributor demo `kalis-contrib.testnet` mengklaim bounty dan mengirim perbaikan. Kode perbaikan ditulis agent atas nama akun demo tersebut. Perbaikan diuji pada 12 kasus sintetis dan dua kasus di TEE OutLayer, jawabannya tetap sama dan fuel C03 turun sekitar 31%. DAO menyetujui `BountyDone` dan membayar kontributor dari dana yang berasal dari porsi DAO run sebelumnya. Versi 2 tercatat di market dengan `parent 1` dan kontributornya, lalu dipakai pada run berbayar yang dananya terbagi 80/10/10.

Masalah yang dicatat: kontrak Sputnik DAO yang ter-deploy menolak deposit di `bounty_done` padahal memerlukan bond, sehingga `BountyDone` dibuat langsung lewat `add_proposal` dan bond klaim 1 NEAR testnet tertahan. Yang masih terbuka: royalti kontributor dari run berikutnya, dan aturan kontrak bahwa versi dengan kontributor wajib disetujui DAO. Rincian di `BUILD_STATUS.md` 6.12.

**API backend (13 November 2026, catatan teknis).** Backend terpisah di `app/backend/` melayani frontend: daftar metode dan riwayat versi dari kontrak market, pembuatan run dengan top-up fiat mock atau wallet pembeli, eksekusi di runner OutLayer, settle escrow, dan tampilan DAO. Data pembeli disegel di browser sehingga server hanya melihat ciphertext. Kontraknya didokumentasikan di `app/backend/API.md` untuk integrasi dengan frontend Codex. Rincian bukti di `BUILD_STATUS.md` 6.13.

## 58b. Lima perlindungan di backend (implementasi, 13 November 2026)

Kelima perlindungan bagian 3 dibangun di backend dan ditegakkan menurut manifest metode. Hasil uji 33 lulus, 0 gagal. Kredensial disimpan terenkripsi dengan scope baca saja dan dapat dicabut, tanpa pernah sampai ke metode atau penjual. Setiap pengiriman keluar ditahan sampai pengguna menyetujui isi persisnya, dan nilai privat yang ditandai terdeteksi meski ditulis ulang dalam ringkasan. Memori dari konten luar menunggu tinjauan, menyimpan asal, dan teks mirip perintah ditandai. Dokumen scan dibaca model visi di TEE NEAR AI dengan attestation dan tanda tangan jawaban, lalu dicek data pribadinya. Browser agent hanya membuka domain dan menjalankan aksi yang dideklarasikan, sedangkan aksi kirim menjadi aksi keluar yang ditahan.

Batas yang wajib ditulis di README: kredensial, aksi keluar, memori, dan browser agent berjalan di backend Kalis, bukan TEE, sehingga operator secara teknis dapat membacanya. Browser agent berupa agent HTTP, bukan browser headless. Deteksi nilai privat bergantung pada nilai yang ditandai pengguna, dan deteksi perintah berbasis pola teks. Rincian bukti di `BUILD_STATUS.md` 6.14.


## 63. Audit ulang aplikasi Next.js terhadap rancangan (14 November 2026)

Permintaan pengguna. Seluruh rancangan dibaca ulang untuk memastikan komponen, halaman dan fitur ada di aplikasi Next.js `app/web/`, yang menggantikan prototipe HTML `design/app/`. Semua data masih mock di browser. Integrasi ke `app/backend/` belum dimulai. Matriks lengkap ada di `app/web/COVERAGE.md`.

Celah yang ditemukan lalu ditambahkan dengan data mock:

- Manifest per versi mengikuti `app/methods/*/manifest.json` (bagian 49 dan 52). Detail metode dan halaman run menampilkan model, koneksi, dokumen, tujuan kirim, memori, browser agent dan nama rahasia penjual. Form penjual mengisi semuanya. Metode portofolio kini tercatat tanpa model AI, sesuai manifest aslinya.
- Laporan eksekusi (bagian 55). Tujuh tahap runner, langkah metode, cek di perangkat per aturan dengan kalimat penyebab, pencocokan bukti chip, dan satu status per run (aman, perlu perhatian, jangan dipakai).
- Perlindungan tender (bagian 3, 49 dan 50). Log browser agent dengan login yang ditolak, hasil dokumen scan, nilai privat yang ditandai pembeli, pengiriman keluar yang ditahan bila memuat nilai privat atau tujuan tidak dideklarasikan, serta usulan memori dari dokumen yang menunggu tinjauan. Teks yang mirip perintah tidak dapat disimpan.
- Impor posisi dari broker mock hanya bila manifest dan koneksi mengizinkan (bagian 49).
- Bukti uji per versi terpisah dari rating (bagian 44 dan 58). Nama metode memakai nama hasil (bagian 45).
- Onboarding sebelum shell aplikasi (bagian 56), tanpa password atau wallet.

Yang belum ada atau sengaja tidak dibuat: autentikasi nyata, unggah dan enkripsi dokumen asli, koneksi ke backend, pembayaran crypto yang ditandatangani wallet, trial, lisensi, royalti, refund dan sengketa (masih terbuka menurut bagian 18 dan 46), serta tampilan Trezu. Render mobile belum terverifikasi.


## 64. Mulai integrasi frontend dengan backend yang tersedia

Keputusan pengguna. Integrasi frontend dan backend menjadi fokus saat ini, menggantikan rencana menunda integrasi untuk memeriksa konsistensi mock terlebih dahulu. Backend tidak diubah pada sesi ini.

Jalur /connected di Next.js ditambahkan dan ditautkan dari banner aplikasi. Konfigurasi, metode dan versi/harga dibaca dari API. Jalur pembeli portofolio menyegel input di browser, membuat escrow dengan demo_topup hanya melalui persetujuan pembayaran testnet eksplisit, mengirim ciphertext, membuka hasil lokal, memeriksa tanda tangan completion serta ikatan run/data dan snapshot versi, menampilkan cek pembeli, lalu menyediakan tombol settlement. Secret hanya dalam memori perangkat. Reload kehilangan kemampuan membuka jawaban, tetapi public run reference tetap dapat diperiksa. Tidak ada retry pembayaran otomatis.

Dana/proposal/bounty DAO dapat dibaca melalui API. Panel integrasi kelima perlindungan mengirim request ke API backend dan menyediakan review/revoke/action berdasarkan record, dengan action_hash untuk outbound. Panel ini masih advanced API console, belum menggantikan seluruh formulir mock pada UI utama. Operasi protection tertentu memproses plaintext di backend di luar TEE dan batasnya ditampilkan. Auth, wallet payment, upload terenkripsi lengkap dan DAO write tetap belum terintegrasi.

Typecheck dan build lolos. Dua puluh tiga tes TypeScript serta dua tes kriptografi lokal lolos. Health/config/methods backend berhasil dibaca. Tidak ada pembayaran, settlement atau mutasi protection yang dijalankan alat Codex. Server frontend lama port 3311 belum memuat API baru, sementara proses pengganti ditolak bind dengan EPERM. Browser end-to-end memerlukan restart frontend dan belum diklaim lolos. Panduan ada di app/web/BACKEND_INTEGRATION.md.


## 65. Bentuk metode: prompt atau kode WASM (14 November 2026)

**Disepakati.** Penjual memilih bentuk metode yang dijual, yaitu prompt atau kode WASM. Bentuk itu tercatat di manifest (bidang `kind`), sehingga ikut tercatat di kontrak lewat hash manifest. Pembeli melihatnya di detail metode dan checkout. Form penjual menampilkan peringatan risiko bocor ketika penjual memilih prompt. Keputusan ini merevisi bagian 5 dan bagian 51 (penolakan opsi C).

**Disepakati.** Metode tender berbentuk kode WASM yang memanggil AI. Metode tender dibangun setelah fungsi AI di runner siap.

**Disepakati. Fungsi panggil AI dibangun sekarang.** Cara metode memakai AI mengikuti bagian 51. Sandbox memberi fungsi panggil AI yang dibatasi manifest.

| Bentuk | Yang dijual penjual | Yang dapat dicek pembeli |
|---|---|---|
| Kode WASM tanpa AI | Program dengan langkah yang sama setiap kali | Laporan tahap dan cek ulang di perangkat |
| Kode WASM dengan AI | Program yang meminta bantuan model privat di manifest | Laporan tahap dan bukti setiap panggilan AI |
| Prompt | Prompt rahasia yang dijalankan satu model privat | Laporan tahap, bukti panggilan AI, cek kebocoran. Status terbaik "perlu perhatian" |

**Implementasi (runner 0.5, build `2f5773282fded8db08759228b3a3f3f564d3be485af8275fe32889c62d700232`).**

- Allowlist jaringan OutLayer berisi satu host, `cloud-api.near.ai`. Kode penjual tidak mendapat jaringan. Satu-satunya import yang boleh dipakainya adalah `kalis.ai_chat`, dan hanya bila manifest mencantumkan model.
- Runner menolak model di luar manifest, membatasi empat panggilan dan 4.000 token per panggilan, serta memeriksa attestation dengan nonce baru dan tanda tangan jawaban setiap model. Jawaban yang gagal pemeriksaan dibuang. Key NEAR AI disimpan sebagai secret OutLayer yang terkunci ke build runner.
- Metode prompt dijalankan runner tanpa kode penjual. Prompt yang disegel dikirim ke model pertama di manifest bersama data pembeli, dengan perintah agar model tidak membuka prompt. Jawaban yang mengulang delapan kata prompt atau lebih secara berurutan ditahan. Tahap `leak_check` kemudian gagal, sehingga escrow mengembalikan dana pembeli.
- Contoh metode prompt adalah `salary-counteroffer` (negosiasi gaji, data fiktif). Prompt aslinya hanya ada di folder `seller-private/` yang tidak ikut ke repo, dan yang dipublikasikan hanya versi tersegel. Run berbayar di testnet berhasil dengan pembagian 80/10/10.

**Batas yang wajib ditulis di README.**

- Cek kebocoran hanya menangkap salinan kata per kata. Prompt yang diparafrasekan model tetap bisa bocor kepada pembeli.
- Jawaban prompt tidak deterministik, dan runner tidak dapat membuktikan model mengikuti semua aturan penjual.
- Ukuran dan waktu panggilan AI terlihat oleh host OutLayer dalam bentuk lalu lintas terenkripsi. Jumlah instruksi runner juga ikut bergantung pada panjang jawaban model. Padding fuel hanya menutup kerja di dalam sandbox.
- Jalur model proprietary (bagian 51) belum dibangun di runner. Runner baru melayani model privat yang lolos attestation.
- Rantai sertifikat Intel dan NVIDIA belum diverifikasi sendiri.

Rincian bukti di `BUILD_STATUS.md` 6.15.

### 65.1 Rancangan metode tender (disepakati 14 November 2026)

- **Peran AI.** AI (DeepSeek, model privat) hanya mengubah teks dokumen tender menjadi data terstruktur dan menulis kalimat alasan. Harga dihitung kode penjual, sehingga angkanya deterministik dan dapat dicek.
- **Aturan rahasia penjual.** Rasio menang tipikal per kategori terhadap HPS (contoh furnitur 86–90%), koreksi dari riwayat menang/kalah pembeli, premi atau potongan untuk waktu kirim dan garansi, batas bawah harga pokok ditambah margin minimum, dan batas atas HPS.
- **Peringatan 80% HPS.** Bila harga di bawah 80% HPS, metode memberi peringatan bahwa panitia dapat meminta klarifikasi kewajaran harga (SE LKPP 4/2022). Besaran jaminan pelaksanaan tambahan belum diverifikasi dan tidak dijadikan klaim. Peraturan terbaru (Perpres 46/2025) belum diperiksa.
- **Cek ulang pembeli.** Harga ≥ harga pokok × (1 + margin minimum), harga ≤ HPS, jaminan penawaran sesuai persentase dokumen, semua dokumen wajib ada di checklist, waktu kirim ≤ batas tender. Tidak ada cek yang dapat membuktikan harga paling mungkin menang.
- **Tempat dokumen dibaca.** Opsi A disepakati. Dokumen publik seperti dokumen tender dibaca di backend lewat perlindungan 4. Backend berhenti menyimpan teks dokumen ke disk, dan UI serta README menyatakan bahwa dokumen yang diunggah dibaca backend, sehingga dokumen privat jangan diunggah. Membaca dokumen di dalam TEE OutLayer (opsi B) dicatat sebagai pekerjaan berikutnya.

### 65.2 Isi marketplace untuk demo (disepakati 14 November 2026)

- Marketplace berisi delapan metode. Semua metode yang tampil harus dapat dijalankan, tanpa listing kosong.
- Setiap metode harus memperlihatkan urgensi tinggi dalam menangani data sensitif (alasan memakai Kalis) dan terlihat sebagai keahlian seorang konsultan.
- Setiap metode memiliki akun penjual demo yang berbeda di testnet, berlabel demo dan fiktif.
- Daftar delapan metode disetujui: (1) rebalance portofolio dengan biaya minimum, (2) penawaran tender di atas margin minimum, (3) counter-offer gaji tanpa membuka batas bawah, (4) selamatkan pinjaman DeFi sebelum likuidasi, (5) jadwal jual token unlock tanpa menjatuhkan harga, (6) rencana kas 13 minggu agar gaji tetap terbayar, (7) urutan konsesi negosiasi kontrak pemasok, (8) cek dilusi term sheet sebelum tanda tangan. Empat berbentuk WASM (1, 2, 4, 6) dan empat berbentuk prompt (3, 5, 7, 8). Aturan penjual ditulis untuk demo dan diberi label demo. Metode 4, 5 dan 8 diberi keterangan bukan nasihat keuangan atau hukum.

### 65.3 Konektor aplikasi produktivitas (disepakati 14 November 2026)

- Konektor tidak terbatas keuangan atau Web3. Dua konektor mock berlabel ditambahkan dengan izin baca saja, yaitu `sheets_mock` (`read_range`, gaya spreadsheet Excel atau Google Sheets) untuk metode kas 13 minggu dan tender, serta `docs_mock` (`read_document`, gaya Word atau Google Docs) untuk metode konsesi pemasok dan dilusi term sheet. Datanya milik perusahaan fiktif.
- Pembeli juga dapat mengimpor file `.xlsx` atau `.docx` yang dibaca di perangkatnya sendiri lalu disegel, minimal untuk metode kas 13 minggu dan dilusi term sheet. Pilihan ini lebih privat karena backend tidak melihat token maupun isi file. Konektor memberi kemudahan, bukan privasi tambahan dari operator, dan UI wajib menjelaskan bedanya.
- Koneksi OAuth asli ke Microsoft atau Google dicatat sebagai langkah setelah hackathon dan memerlukan konfirmasi pengguna.

### 65.4 Pembagian kerja dan kebijakan backend lanjutan (disepakati 14 November 2026)

- **Pembagian kerja.** Claude Code mengerjakan seluruh backend: sepuluh pekerjaan yang direncanakan, ditambah seluruh kebutuhan di `app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md` (A–H). Codex berhenti mengedit. Setelah backend selesai, frontend `app/web` juga dikerjakan Claude Code. Pengguna memilih tetap mengerjakan semua butir, termasuk yang dinilai agent tidak realistis untuk deadline.
- **Urutan.** Inti demo dikerjakan lebih dulu: kelompok A, manifest v5, tender, delapan metode dan publikasinya. Setelah itu rating, riwayat, login, publikasi penjual, komunitas, kasus uji privat, H5, H7, dan H8. Butir yang belum selesai saat deadline ditulis jujur di README.
- **Login.** Memakai tanda tangan akun NEAR. Server menerbitkan challenge sekali pakai, pengguna menandatanganinya dengan kunci akun NEAR (NEP-413), server memverifikasi kunci itu lewat RPC, lalu memberi session. Identitas workspace demo tetap tersedia dengan label demo.
- **Rating.** Pembeli dengan run yang sudah dieksekusi (Released maupun Refunded) boleh memberi satu rating 1–5 per run. Tanpa ulasan, rata-rata bernilai kosong dan UI menampilkan "No ratings yet".
- **Wewenang komunitas.** Wewenang dibaca dari policy Sputnik DAO `kalis-fund` di chain. Council memberi vote, anggota council yang bukan kontributor mereview, dan pembayaran terjadi saat proposal BountyDone disetujui. Backend tidak menciptakan kewenangan baru.
- **Kasus uji privat.** Kasus disegel ke kunci TEE runner dan hanya dibuka di dalam runner bersama evaluator yang tetap. Kandidat hanya menerima lulus atau gagal per cek beserta jumlahnya. Jatah percobaan dan masa berlaku ditegakkan backend.
- **Akun penjual demo.** Sub-akun `scientivan.testnet`, satu per metode, berlabel demo dan fiktif.

**Status implementasi (14 November 2026 06:10 UTC).** Seluruh butir backend A–H terpasang dan teruji. Delapan metode tercatat di market dengan delapan akun penjual demo dan semuanya lolos run berbayar di OutLayer testnet. Runner build `823e99...` menambah evaluasi kandidat di TEE dan penyempitan model oleh pembeli. Kontrak market menambah `transfer_method_owner`. Rincian di `BUILD_STATUS.md` 6.16–6.18. Frontend belum disesuaikan.

**Usulan yang menunggu keputusan pengguna.** Bila izin uji privat dicabut saat uji sedang berjalan, hasil uji itu ditahan dan tidak diberikan kepada kandidat.

### 65.5 Frontend (disepakati 14 November 2026)

- Frontend `app/web` didesain ulang lalu diintegrasikan dengan backend, dikerjakan Claude Code. Design system dibahas lebih dulu lewat artifact arah visual.
- Prioritas halaman untuk video demo, semuanya penting: marketplace dan detail metode, alur pembeli lengkap, tender dengan lima perlindungan, serta komunitas dan penjual.
- Login dan tanda tangan di browser memakai NEAR Wallet Selector di testnet, untuk login NEP-413, pembayaran, publikasi, dan vote DAO.
- **Diperbarui 14 November 2026.** Arah visual disepakati lewat mock marketplace: struktur mengikuti template admin Luno varian Crypto, warna mengikuti extrafazant.nl, tema terang saja (latar putih, teks hitam, aksen biru listrik). Aturan UX dan visual Dien (bahasa umum, semua use case di navbar, halaman berkorelasi digabung, tanpa em dash dan bullet, tanpa teks mengambang, elemen sebaris sama tinggi, WCAG) dicatat di `FRONTEND_GUIDE.md` beserta palet, layout, peta navigasi, dan mock acuan `design/app/marketplace-luno-crypto.html`.
- **Font disepakati.** Inter beserta semua variasinya (100 sampai 900), berlisensi SIL Open Font License 1.1. SF Pro tidak dipakai karena lisensi Apple tidak mengizinkannya ditanam di web. Thin dan Light hanya untuk teks display besar.
- **Pembagian kerja diubah.** Frontend di Next.js dikerjakan Codex dengan `FRONTEND_GUIDE.md`, `app/backend/API.md`, dan `app/methods/MANIFEST_V5.md` sebagai acuan. Backend tetap milik Claude Code.


## 65. Integrasi halaman utama ke API backend

Pengguna menegaskan semua integrasi frontend-backend menjadi fokus, tanpa membatasi jumlah halaman. Halaman utama kini memakai backend mode sebagai default, sementara mock demo dipisahkan dengan toggle eksplisit. Katalog, detail/versi, koneksi, memori, dokumen, browser, outbound/Activity dan DAO menggunakan endpoint yang tersedia. UI menyediakan scope/expiry/revoke/use broker, sumber/edit/approve/reject/delete/recall memori, upload PDF/gambar dan extraction proof, request browser, private-value registration dan approval action_hash, serta status/settlement run.

Backend terbaru membedakan WASM dan prompt. Label dan buyer_note ditampilkan sebelum pembayaran. Helper kriptografi diselaraskan dengan backend agar signature AI yang gagal menolak pemakaian dan hasil prompt paling tinggi berstatus attention. Versi terpilih, harga dan hash dipertahankan sampai payment/verification. Input invalid tidak menandai payment attempt sebelum request dikirim. Wallet route dapat menyiapkan contract_call dari API, tetapi signing wallet belum terintegrasi.

API tidak menyediakan autentikasi/profil, ratings/reviews, seller publication, private-test grants, DAO writes atau ledger agregat. Backend mode menampilkan keadaan belum tersedia untuk fungsi tersebut, bukan menggunakan reducer mock diam-diam. Mock masih dapat dicoba terpisah. Dokumen upload dan operasi protection tertentu melalui plaintext di backend di luar TEE, dengan batas yang ditampilkan.

Matriks terbaru di app/web/COVERAGE.md, riwayat mock di MOCK_COVERAGE_ARCHIVE.md. Dua puluh tiga tes TypeScript dan tiga tes kriptografi lolos, typecheck/build diperiksa. Tidak ada pembayaran, signing, settlement atau mutasi protection yang dijalankan alat. Browser end-to-end dan server restart tetap belum terverifikasi dalam lingkungan ini.


## 66. Handoff kebutuhan backend untuk Claude

Pengguna meminta Codex menyusun kebutuhan backend yang belum tersedia agar dikerjakan Claude. Dokumen app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md menjadi handoff, bukan implementasi atau persetujuan kebijakan baru. Dokumen membandingkan API.md, route backend dan fungsi market contract yang sudah ada. Tidak ada kode backend yang diubah atau pesan yang dikirim ke pihak lain.

Kelompok kebutuhan adalah kelengkapan run-list/draft/quote, idempotency dan recovery pembayaran, reclaim timeout melalui refund_expired yang sudah ada, profil dan ownership, draft/publikasi metode dengan register_method/publish_version, rating pengguna, Community writes, private-test grants, ledger dan Activity. Nama endpoint dan DTO baru berstatus usulan kontrak integrasi yang boleh diselaraskan Claude dan dicatat final di API.md.

Urutan usulan adalah menuntaskan keselamatan/recovery alur pembeli terlebih dahulu, lalu identity/ownership untuk penjual dan rating, kemudian Community/private tests/ledger. Setiap kelompok memuat data, aturan izin, transisi status dan acceptance criteria. Trial, lisensi, royalti, sengketa mutu, provider login dan policy rating rinci tetap terbuka. Refund tahap gagal dan timeout reclaim tetap keputusan yang berlaku.

Wallet contract_call sudah ada di backend. Wallet signing masih pekerjaan frontend, sedangkan key recovery tidak boleh diselesaikan dengan mengirim secret pembeli ke backend. Upload plaintext dokumen saat ini juga tidak otomatis menjadi privat dengan endpoint tambahan. Jalur proprietary belum didukung runner dan tidak boleh ditawarkan sebagai runnable.

Dokumen tidak memberikan otorisasi signing/spending/deployment baru. Claude tetap mengikuti otorisasi sesi serta aturan NEAR. Handoff meminta kontrak API final, capabilities, skema/state/izin, hasil tes, perubahan penyimpanan dan langkah restart sebelum frontend disambungkan.


## 67. Penelusuran tambahan kebutuhan layanan backend

Pengguna meminta rancangan ditelusuri lagi untuk menambahkan layanan API yang terlewat pada handoff Claude. Bagian H ditambahkan ke app/web/BACKEND_REQUIREMENTS_FOR_CLAUDE.md, dengan delapan kelompok dan pemetaan acuan serta kriteria penerimaan. Nama endpoint dan bentuk teknis tambahan tetap usulan, bukan fitur yang sudah dibangun atau keputusan policy baru.

Kelompok tambahan mencakup schema input/output dan buyer checker per versi, implementasi tender runnable sesuai 65.1, model capability/selection, policy proteksi yang terikat run dan versi, provenance dokumen/artifact serta data turunan, evidence retrieval dan key/build preflight, contribution package dan validasi kandidat, serta preferensi/effective permission/cancellation semantics. Perluasan API atau fungsi internal boleh dipakai, tidak wajib membuat endpoint baru untuk setiap kebutuhan.

Koreksi cakupan yang ditekankan adalah adanya route browser/OCR/memori tidak membuktikan metode tender berjalan. Penjual perlu interface dan modul yang benar-benar dapat dibaca kontributor, sedangkan candidate terbit harus sama dengan artifact yang diuji. Proteksi yang mengambil manifest terbaru harus diselaraskan dengan versi run yang dibayar. Katalog model bukan bukti attestation, dan endpoint upload bukan bukti data privat dari operator.

Lokasi pembacaan dokumen tender masih dibahas, proprietary runner belum didukung, root certificate verification belum dilakukan, dan policy retensi/cancel/refund di luar escrow tahap tetap tidak ditetapkan sepihak. Tidak ada kode atau endpoint backend diubah. Rancangan dan PDF diselaraskan untuk handoff.


## 68. Riset website pembanding untuk referensi desain

Permintaan Dien, 14 November 2026. Riset website dengan use case serupa untuk layout, design system, positioning dan wording disimpan di research/website-reference-2026-11-14.md. Sumber resmi dibaca langsung. Apify menjadi rekomendasi untuk informasi marketplace, Replicate untuk contoh hasil dan mencoba metode, TradingView untuk menjelaskan implementasi tertutup, n8n untuk discovery dan brand system, Lumo untuk bahasa privasi, iExec untuk positioning dua pihak, Phala untuk bukti eksekusi, serta Opire untuk alur bounty dan review. Ini rekomendasi agent, bukan persetujuan desain baru.

Brand system publik n8n menyediakan aturan warna, tipografi, grid dan voice. Fakta dari dokumentasi dipisahkan dari usulan penerapan. Tidak ada penggantian identitas visual Kalis. Penolakan badge pastel, rating yang tetap terlihat, nama metode konsisten dan konteks izin dekat tindakan tetap berlaku.

Usulan susunan detail mengutamakan manfaat, pembuat dan contoh hasil, lalu panel biaya/tindakan serta input, akses, batas, ulasan, versi dan kontribusi. Usulan headline adalah “Expert methods for sensitive work.” Semua copy memerlukan review dan klaim kemampuan harus mengikuti jalur aktual. Metode tertutup bukan bukti mutu hasil. Bukti eksekusi bukan jaminan rekomendasi benar.

Batas riset. Halaman dibaca lewat web reader, bukan audit render atau pengujian interaksi. Spacing, posisi, hover, responsivitas dan shell aplikasi privat belum diverifikasi. OKX AI tidak dapat dibaca ulang. Homepage Algora kini berfokus pada perekrutan sehingga tidak dipakai sebagai acuan utama bounty. Tidak ada perubahan frontend, publikasi atau transaksi. Compliance gate diperiksa dan tidak ada konflik.


## 69. Pemisahan domain landing dan aplikasi

Disepakati Dien, 14 November 2026. Landing page ditempatkan di https://calis.scientivan.dev dan aplikasi yang sudah ada di https://app.calis.scientivan.dev. Domain memakai ejaan calis sesuai percakapan, nama produk tetap Kalis. Domain apex scientivan.dev tetap untuk website yang sudah ada.

Implementasi persiapan memakai proyek Vercel terpisah untuk aplikasi Next.js di app/web dan landing mendatang. Path aplikasi tetap berlaku tanpa prefix /app atau basePath. Metadata aplikasi memakai origin aplikasi. Konfigurasi build Vercel dan panduan aktivasi berada di app/web/vercel.json serta app/web/DEPLOYMENT.md. Pekerjaan ini tidak membuat desain landing baru.

Pemeriksaan read-only menemukan akun Vercel tersedia, domain scientivan.dev tercatat di Vercel, dan nameserver aktif dikelola Cloudflare. URL HTTPS publik backend belum diberikan. Default backend loopback hanya berlaku lokal. Deploy aplikasi harus mengisi KALIS_BACKEND_URL pada server Vercel. Jangan mengklaim aplikasi hosted terhubung sebelum API health dan alur terkait diverifikasi.

Status masih persiapan lokal. Belum deploy publik, membuat proyek Vercel, memasang domain atau mengubah DNS. Aktivasi publik mengikuti konfirmasi pada bagian 52. Compliance gate NEAR diperiksa dan tidak ada konflik. Tidak ada push, signing atau spending.


## 70. Sinkronisasi rancangan, website dan seluruh dokumen aktif

Permintaan Dien, 14 November 2026. Audit dokumen harus dua arah. Implementasi tidak otomatis lebih benar daripada keputusan tertulis, dan dokumen lama tidak otomatis menggambarkan kemampuan sekarang. Setelah sinkronisasi selesai, pembahasan dilanjutkan ke inovasi Social Money. Deployment ditunda. Tidak ada fitur Social Money baru yang dipilih dalam tugas ini.

CURRENT_STATE.md memetakan sumber keputusan, source, runtime, bukti historis dan gap. DOCUMENTATION_INDEX.md menginventaris dokumen aktif, prototipe, handoff dan riset/benchmark historis. README, PRODUCT, DESIGN, BUILD_STATUS, coverage/integration/gap/navigation frontend, API privacy notes, memori dan PDF diselaraskan. Handoff/review lama ditandai historis tanpa menghapus bukti atau mengubah usulan lama menjadi persetujuan.

Audit GET langsung berhasil untuk health, capabilities, config, methods, community/config, dao, issues, proposals dan bounties. Chrome membuka 14 halaman Next.js tanpa login pada port 3000, proxy health HTTP 200. Sembilan metode terdaftar teramati, termasuk scientivanmsk-freelance-rate v2 selain delapan demo awal. Runner aktif 823e99, portofolio v6, tender v2 dan gaji v3. Build dan 31 tes frontend pada sesi yang sama lulus sebelum perubahan dokumentasi. Local checks manifest 47 lulus dan Office 8 lulus, tanpa URL/API mutation. Modul browser crypto, checks dan file-import identik dengan backend.

Bukti browser itu hanya pembacaan halaman tanpa login dan bukan wallet E2E, audit mobile/WCAG penuh, publikasi metode baru atau pembayaran ulang semua versi. Bukti testnet historis 6.1–6.18 dipertahankan sesuai versi/tanggalnya. Snapshot dan screenshot disimpan di audit/2026-11-14-doc-sync/.

Temuan yang membatasi klaim privasi adalah fungsi pay di run-page.tsx mengirim field private plaintext ke protections/private-values. outbound.markPrivate menyimpan values melalui store.js ke JSON backend. Jadi ciphertext-only benar pada payload runner, bukan keseluruhan perjalanan website. Lima perlindungan, dokumen, konektor, note dan outbound juga berada di backend biasa. Ini bertentangan dengan janji operator-blind menyeluruh dan dicatat sebagai gap yang belum diperbaiki. Tidak ada persetujuan baru atas penyimpanan plaintext.

Social Money sudah mempunyai Sputnik DAO fund, pembagian run, issue/proposal/bounty, kandidat privat, grant/evaluate, review dan request payout/version. Platform 10 persen, DAO minimal 10 persen sesuai versi dan penjual sisanya, sedangkan 80/10/10 adalah konfigurasi versi teramati. Proposal bond dan bounty bond saat audit 1 NEAR testnet. Council satu anggota pada demo, bukan bukti desentralisasi komunitas.

Tidak menyamakan request call dengan hasil chain. Tiga bounty legacy teramati tanpa evaluator/proposal link lokal dan tidak dapat diuji di aplikasi. Review handler mengizinkan council selain kontributor, tidak membatasi hanya reviewer yang ditunjuk. Pencabutan grant saat test menahan hasil pada kode, tetapi policy itu sebelumnya belum disahkan. Publikasi langsung pemilik melalui kontrak market tidak dipaksa mengikuti seluruh review DAO adapter. Royalti, pengklaim bersaing, sengketa dan manfaat sosial terukur masih terbuka.

Keputusan eksplorasi Social Money tetap aktif. Audit ini menyiapkan dasar yang benar untuk diskusi berikutnya, bukan implementasi inovasi baru. Compliance gate NEAR tidak menemukan konflik pada audit dan sinkronisasi. Tidak ada deploy, push, login, signing, spending, seed atau mutation backend.


## 71. Penelusuran penghalang pemenuhan privasi

Permintaan Dien, 14 November 2026. Sebelum melanjutkan inovasi Social Money, telusuri alasan bagian privasi masih berada di backend dan apakah ada penghalang untuk development yang memenuhi rancangan. Batas publik/privat yang telah disepakati tidak perlu didefinisikan ulang.

Hasil source dan riset resmi disimpan di PRIVACY_TEE_INVESTIGATION.md. Tidak ditemukan bukti bahwa OutLayer secara umum tidak mampu mendukung HTTP, penyimpanan terenkripsi atau layanan privat. Namun fitur tersebut belum terintegrasi sebagai layanan proteksi Kalis dan belum diprobe ulang pada worker testnet. Jangan menyamakan dokumentasi platform dengan bukti deployment.

Penggunaan backend sebagian memang keputusan eksplisit. Bagian 52 mempertahankan HTTP browser agent pada backend. Bagian 65.1 mengizinkan dokumen publik dibaca backend tanpa menyimpan teks, sedangkan dokumen privat dalam TEE adalah pekerjaan berikutnya. Bagian 65.3 mengakui mock connector bukan privasi operator, dan Office import lokal lebih privat. Karena itu bukan semua backend otomatis pelanggaran. Alasan historis lain seperti deadline atau biaya tidak ditetapkan sebagai fakta tanpa bukti.

Penghalang implementasi nyata adalah runner hanya memiliki pubkey/run/evaluate dan import AI, belum punya layanan memory/credential/outbound/document. Allowlist host hanya NEAR AI. Storage host belum diimpor. Identitas principal berada di backend sementara callRunner memakai satu payment key platform. TEE tidak boleh mempercayai klaim owner dari operator tanpa proof pengguna. Mock connector memakai localhost backend dan tidak dapat langsung dipanggil TEE jarak jauh. PDF teks memakai proses pdftotext, bukan parser WASM.

Registrasi otomatis field private plaintext saat checkout merupakan jalur deteksi outbound yang dibuat aplikasi, bukan syarat OutLayer. Menutup jalur ini bisa menjadi tahap pertama, tetapi jangan menghapusnya sambil mengklaim deteksi outbound tetap setara tanpa pengganti. Urutan usulan adalah menutup pengiriman plaintext, menyiapkan operasi/proof owner dan state tersegel, lalu port memory/outbound, credential/connector dan dokumen privat. Pilihan protokol teknis baru tetap usulan untuk ditinjau, bukan keputusan sepihak.

Runner baru memerlukan bukti build, penguncian kunci dan versi market yang tepat. Signing/spending/deploy tetap mengikuti konfirmasi eksplisit. Data lama tidak dihapus sepihak. Investigasi ini tidak mengubah kode produk atau melakukan operasi berbayar. Prioritas bergeser sementara ke privasi, eksplorasi Social Money ditunda. Compliance gate NEAR tidak menemukan konflik.

## 72. Migrasi lima perlindungan ke runner privat

Status per 15 November 2026. Migrasi dikerjakan Codex dan diselesaikan Claude. Semua bukti di bawah adalah **mode native development di satu mesin, bukan TEE**.

Jalur plaintext checkout sudah ditutup. run-page.tsx tidak lagi memanggil protections/private-values. Nilai private disimpan hanya di IndexedDB browser selama 24 jam untuk pemeriksaan outbound di perangkat. Proxy web menolak semua request ke api/protections/.

Lima perlindungan (credentials, memory, documents, outbound, browser agent) serta audit kini berjalan lewat protokol tersegel. Browser mengenkripsi setiap operasi ke kunci runner privat dan menandatanganinya dengan kunci perangkat yang tidak bisa diekspor. Backend hanya meneruskan ciphertext lewat POST /api/privacy/execute. Runner (app/kalis-runner/src/privacy.rs) memeriksa tanda tangan pemilik, revisi state dan nonce anti-replay, lalu mengembalikan hasil terenkripsi. Relay memakai ulang call OutLayer yang sama saat retry dan hanya menyimpan commitment serta output terenkripsi.

Bukti lokal. privacy-local-test.mjs 27 cek lulus, termasuk isolasi antar-pemilik, tanda tangan palsu ditolak, replay ditolak, PDF privat ditolak tanpa fallback plaintext, dan semua state tersimpan berupa ciphertext. privacy-http-test.mjs 13 cek relay lulus, termasuk endpoint plaintext lama ditolak. Regresi eksekusi portofolio lulus. Frontend build lulus dan 32 tes lulus (29 dan 3). Bukti browser (privacy-browser-test.mjs) menyimpan catatan berisi sentinel, reload, lalu memastikan sentinel tidak muncul di request mana pun, kunci perangkat non-extractable, dan tidak ada request ke endpoint lama. Hasil ada di audit/2026-11-14-private-migration/.

Yang belum saat itu, diperbarui oleh paragraf runner privat aktif di bawah. PRIVATE_RUNNER_HASH masih not-built, jadi belum ada build TEE yang di-attest dan dikunci. Dukungan storage/HTTP pada worker OutLayer testnet belum diprobe. Deploy runner privat, penguncian secret dan versi market memerlukan persetujuan Dien. Tanpa itu, halaman proteksi di deployment biasa menolak dengan private_runner_unavailable. Data lama di backend tidak dimigrasi atau dihapus. Kepemilikan data terikat ke satu browser, belum ada pemulihan atau multi-perangkat. Konektor di runner tetap mock berlabel. Dokumen publik tetap boleh diekstrak backend setelah opt-in eksplisit sesuai 65.1.

Compliance gate NEAR tidak menemukan konflik. Tidak ada signing, spending, deployment atau penghapusan data.

**Runner privat aktif di OutLayer testnet (15 November 2026, Claude).** Project `scientivan.testnet/kalis-private`, build `457e260ccbb47381049266363c0f9c2fab5161f5c80fc439479dfe95e95d547e` (kalis-runner/0.6). `PROTECTED_SEAL_KEY` dibuat di dalam TEE dengan `--generate` dan dikunci ke build itu (profile `private`, whitelist `scientivan.testnet`). `NEAR_AI_API_KEY` disalin ke profile yang sama tanpa dicetak. Kunci publik TEE `685012c942a97e6d16266f6aefd00371d183b5fad120b2a1cdc315c9a096e959`, kunci tanda terima `0fc41697787c6c3623482a6726eecf8b148cb9ef9ccd9e7bac477c3ab93394a7` (call `47f7fc97-88d8-4514-8970-c90f2c92670d`). `PRIVATE_RUNNER_HASH` di backend dan web dipasang ke hash build ini. Backend mengaktifkan jalur TEE lewat `KALIS_PRIVATE_ENABLED=1`, `KALIS_PRIVATE_TEE_KEY` dan `KALIS_PRIVATE_RECEIPT_KEY` di `app/backend/.env` (gitignored).

Uji end-to-end `app/backend/scripts/privacy-remote-test.mjs` lewat relay backend ke TEE lulus 6 cek. Catatan berisi sentinel tersimpan (call `93e7ab28-f1af-4777-b619-1f1bfd02f142`), dibaca kembali pemiliknya di call terpisah (`86b804e5-db47-4289-b850-2487b3535ff2`), tidak terlihat oleh pemilik lain (`e2cfb716-4a08-432f-b2d0-cde15f79cec1`), dan revisi basi ditolak di dalam TEE. Setiap respons lolos pemeriksaan attestation terhadap build yang dipasang. Sentinel tidak muncul di request, respons, atau data backend. Uji ini hanya mencakup memory. Credentials, documents, outbound dan browser agent memakai jalur kode yang sama tetapi belum diuji satu per satu di TEE. Bukti browser terhadap TEE dan deployment web belum dilakukan. Data lama backend belum dimigrasi.

**Vault perangkat dan runner 0.7 (15 November 2026, Claude).** Atas keputusan Dien, data proteksi milik pemilik (daftar dan ubah catatan, koneksi, dokumen, persetujuan outbound, audit) kini disimpan terenkripsi di browser (IndexedDB, kunci AES-GCM non-extractable) dan diproses di perangkat. Backend tidak pernah menerima isinya. TEE hanya dipakai untuk aksi yang harus ditegakkan terhadap metode atau butuh rahasia tersegel, yaitu credentials.use, memory.recall, outbound.propose, outbound.execute, documents.ingest dan browser.act. Untuk aksi itu browser mengirim record pemilik tersegel bersama request, runner menerapkan aturan di memori, mengembalikan record baru tersegel ke pemilik, dan tidak menyimpan apa pun. Batas kedaluwarsa request naik dari 300 ke 900 detik karena antrean testnet sering lebih dari 5 menit, dan browser mengulang paket yang sama setelah timeout proxy. Build runner baru `cd95487f39bda73e054a569ac806c93cad11883d6a4e8651860e6fa7c9c39c19`, kunci segel dipindah dengan `secrets access --build`, kunci publik tidak berubah (call `4bacc9bb-e539-442f-9ff5-930852308bc7`, attestation mencatat hash build itu).

Ukuran waktu. Membaca daftar catatan lewat TEE di production butuh 295,5 detik. Lewat vault perangkat, simpan catatan 45 ms dan tampil setelah reload 165 ms (uji Chrome lokal), dan di production catatan tersimpan dan tampil kurang dari 1 detik tanpa request ke /api/privacy/execute. Uji native `privacy-vault-test.mjs` lulus 10 cek, termasuk token dan isi catatan tidak keluar dari kotak tersegel, aksi pemilik ditolak di runner, request antre 10 menit diterima, lebih dari 15 menit ditolak, dan runner tidak menyimpan apa pun. `privacy-local-test.mjs` 27 cek dan `privacy-http-test.mjs` 13 cek tetap lulus.

Batas. Aksi yang butuh TEE tetap menunggu antrean OutLayer testnet (sekitar 5 menit) dan belum diuji end-to-end di TEE pada build baru. Kepemilikan data tetap terikat satu browser. Pencegahan rollback sekarang dicek di perangkat, bukan di runner. Operator masih dapat melihat metadata seperti waktu dan ukuran request TEE.
