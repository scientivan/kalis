# Konteks bersama untuk semua pembanding

Data sepenuhnya sintetis. Event order/amendment menyatakan target per order dan line. Amendment hanya berlaku bila konteks menyatakan disetujui sebelum pemrosesan. Qty pada pick/pack/ship adalah jumlah tambahan yang dicatat tahap tersebut, bukan saldo kumulatif. Jangan menjumlahkan unit lintas tahap. Tidak semua tahap selalu terekam.

Alias dan substitusi hanya sah jika tercantum dalam context. ID event identik dengan payload identik adalah replay satu kejadian. ID sama dengan payload berbeda adalah konflik data. Waktu dalam satu hari yang sama. Keluhan adalah laporan, bukan rekaman pemeriksaan barang independen. Status consistent berarti catatan tersedia konsisten, bukan jaminan barang fisik benar.

Tugas adalah mencari ketidaksesuaian SKU atau jumlah per order/line, menentukan tahap pertama yang teramati bila bukti cukup, dan memisahkan fakta dari hipotesis penyebab. Tahap pertama teramati tidak otomatis lokasi awal kesalahan. Jangan menyalahkan orang atau mengklaim sebab pasti tanpa bukti.

Keluaran harus mencantumkan case_id, status (mismatch/consistent/insufficient/data_conflict), first_observed (pick/pack/ship atau null), affected_lines, evidence_ids, explanation, uncertainty, next_action dan verification_plan. Jangan mengungkap data lain yang tidak diperlukan. Nama framework opsional, tidak diberi nilai hanya karena disebut.
