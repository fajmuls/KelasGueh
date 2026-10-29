# Rencana Implementasi Pembaruan Terpadu KelasGue (v4.8.0)

Rencana ini merinci perbaikan sinkronisasi antar-perangkat, sistem cadangan data JSON pengurus ke Supabase, integrasi penetapan siswa pada Whitelist Role, pencarian dan accordion kelompok, penambahan Tema Cokelat gelap kontras tinggi, optimasi checklist iuran cepat, serta opsi 3 periode rekap WhatsApp.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan yang Telah Dikonfirmasi Pengguna:**
> 1. **Nuansa Tema Cokelat**: Cokelat Kopi Gelap (*Espresso Roast*) dengan teks krem kontras tinggi (`#1E1510` & `#F7EBD9`) untuk memastikan semua elemen terbaca jelas dan tidak ada teks yang membaur dengan background.
> 2. **Mekanisme Sinkronisasi Multi-Device**: Realtime auto-sync langsung dari Supabase saat aplikasi dibuka, memperbaiki isu inkonsistensi data antar HP (seperti iuran spesial September Rp15.000).
> 3. **Penempatan Ekspor & Impor Data JSON**: Ditempatkan pada menu/tab khusus **"Cadangan Data"** di Pengaturan Pengurus (Bendahara & Sekretaris) serta Master Admin (Super Admin).

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**:
  Aplikasi web manajemen kelas yang terintegrasi penuh untuk Pengurus Kelas (Super Admin, Bendahara, Sekretaris) dan Anggota Siswa. Pembaruan v4.8.0 memfokuskan pada stabilitas sinkronisasi data antar-perangkat, portabilitas data melalui ekspor/impor JSON terenkapsulasi, kemudahan pengorganisasian kelompok belajar, pengalaman visual baru yang ramah mata (Tema Cokelat), serta efisiensi operasional pengurus.
- **Sasaran Pengguna**: Seluruh pengurus kelas (Bendahara, Sekretaris, Super Admin) dan anggota kelas pada perangkat mobile maupun desktop.
- **Nilai Utama**: Menghilangkan ketidaksesuaian data antar-HP, mempercepat pencatatan kas mingguan, dan memberikan kontrol penuh kepada pengurus dalam membackup serta merestore seluruh data kelas.

---

## 2. User Experience & Visual Design

### 2.1 Tema Cokelat (Dark Espresso & Cream High Contrast)
Aplikasi mempertahankan ciri khas Doodle Notebook dengan estetika gelap baru:
- **Latar Belakang Utama (`--bg-paper`)**: `#1A120B` (Dark Coffee Espresso) dengan tekstur dot halus `#2C1E14`.
- **Kartu Konten (`--bg-card`)**: `#261A13` (Roasted Mocha) dengan batas kontras `#D4A373` dan bayangan tebal offset `#0D0805`.
- **Teks Utama (`--text-main`)**: `#FDF8F0` / `#F7EBD9` (Krem Susu Hangat) dengan kontras tinggi (WCAG AAA compliant), menghilangkan masalah teks gelap tertelan latar.
- **Aksen Doodle**:
  - Kuning Emas: `#EAB308`
  - Mint Sage: `#86EFAC`
  - Sky Blue: `#7DD3FC`
  - Karamel/Amber: `#F59E0B`
  - Rose/Merah: `#FDA4AF`

### 2.2 Alur Pengguna Baru
1. **Penetapan Siswa pada Whitelist Role (Master Admin)**:
   - Pada tabel Whitelist, terdapat kolom baru: **"Siswa Terhubung (No. Absen & Nama)"**.
   - Admin dapat langsung memilih siswa dari daftar anggota yang sinkron secara dua arah dengan data manajemen siswa.
2. **Pencarian & Minimalkan Kelompok (Sekretaris & Mahasiswa)**:
   - Bar pencarian instan di atas daftar kelompok tersimpan (bisa mencari nama matkul, judul tugas, nama kelompok, atau anggota).
   - Accordion toggle (tombol Buka/Tutup atau Minimize) per mata kuliah, sehingga daftar matkul yang banyak tidak memanjang ke bawah.
3. **Modal Opsi Rekap WhatsApp Bendahara**:
   - Saat klik tombol "Bagikan ke WhatsApp" atau "Salin Rekap", muncul dialog 3 pilihan:
     1. 📅 **Minggu Ini**
     2. 🗓️ **Bulan Ini**
     3. 📊 **Keseluruhan**
   - Setelah memilih, teks terformat otomatis digenerate dengan opsi Salin Teks dan Buka WhatsApp.
4. **Ceklis Iuran Responsif**:
   - Optimistic update langsung berubah dalam hitungan milidetik tanpa jeda.
   - Delay animasi dan debounce sync ditekan menjadi 0,5 detik agar pengisian massal lancar tanpa lagging.
5. **Cadangan Data JSON Terpadu (Semua Pengurus)**:
   - Menu **"Cadangan Data"** di Pengaturan Pengurus & Master Admin.
   - Tombol **"Ekspor Seluruh Data JSON"**: mengunduh file `.json` lengkap dan opsional mengunggah snapshot ke Supabase.
   - Tombol **"Impor Cadangan JSON"**: validasi schema, modal konfirmasi peringatan, dan pencatatan riwayat ke Audit Log sehingga dapat di-undo.

---

## 3. Key Product Decisions & Trade-Offs

| Keputusan | Pendekatan Terpilih | Rationale / Alasan | Alternatif Dipertimbangkan |
| :--- | :--- | :--- | :--- |
| **Penyimpanan Pengaturan Spesial Iuran** | Menyimpan `monthlyDuesOverrides` di Supabase (`class_settings.monthly_dues_overrides` jsonb / column) serta sinkron otomatis saat app load | Mengatasi bug di mana HP A menyimpan iuran September Rp15.000 hanya di `localStorage` lokal sedangkan HP B masih membaca default Rp5.000 | Mengandalkan localStorage saja (ditolak karena tidak sinkron antar gadget) |
| **Skema Ekspor Data JSON** | Format JSON terpadu yang memuat seluruh relasi (transaksi, anggota, pengaturan, tagihan kolektif, presensi, kelompok, audit) | Semua pengurus (Bendahara, Sekretaris, Admin) dapat saling membackup data kelas tanpa format terpecah | File CSV terpisah per modul (merepotkan saat restore) |
| **Toleransi Undo untuk Impor** | Sebelum data lama ditimpa oleh data impor, snapshot data sebelumnya disimpan ke snapshot audit | Memungkinkan super admin membatalkan impor jika pengurus salah memasukkan file JSON cadangan | Impor satu arah tanpa undo (berisiko kehilangan data kelas) |
| **Respon Ceklis Iuran** | Optimistic UI update dengan debounce sync 500ms | Pengurus dapat mencentang iuran dengan cepat tanpa menunggu roundtrip server | Menunggu respon jaringan sebelum centang berganti (membuat UI terasa lambat) |

---

## 4. Technical Architecture & Data Strategy

### 4.1 System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APLIKASI KELASGUE                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────┐   ┌───────────────┐   │
│   │    BENDAHARA       │   │    SEKRETARIS     │   │  SUPER ADMIN  │   │
│   │ • Buku Kas         │   │ • Presensi        │   │ • Whitelist   │   │
│   │ • Ceklis Iuran     │   │ • Kelompok &      │   │ • Kelola      │   │
│   │ • Rekap WA (3 opsi)│   │   Pencarian/Min.  │   │   Siswa       │   │
│   │ • Cadangan JSON    │   │ • Cadangan JSON   │   │ • Audit Log   │   │
│   └─────────┬──────────┘   └─────────┬─────────┘   └───────┬───────┘   │
│             │                        │                     │           │
│             └────────────────┬───────┴─────────────────────┘           │
│                              │                                         │
│                ┌─────────────▼─────────────┐                           │
│                │   LocalKasRepository      │                           │
│                │ • Auto-Sync saat Start    │                           │
│                │ • Optimistic Dues (0.5s)  │                           │
│                │ • Import/Export JSON      │                           │
│                └─────────────┬─────────────┘                           │
│                              │                                         │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │ Realtime Sync
                               ▼
        ┌──────────────────────────────────────────────┐
        │              SUPABASE CLOUD DB               │
        │ • kas_transactions   • class_settings        │
        │ • kas_members        • class_group_coll.     │
        │ • app_audit_logs     • json_snapshots        │
        └──────────────────────────────────────────────┘
```

### 4.2 Pembaruan File & Modul yang Terlibat
1. `src/types/kas.ts`:
   - Menambahkan field `monthlyDuesOverrides` pada sync `ClassSettings`.
   - Menambahkan tipe skema `ClassBackupData` untuk ekspor/impor JSON.
2. `src/services/supabaseClient.ts`:
   - Menambahkan serialisasi dan deserialisasi `monthly_dues_overrides` ke dalam Supabase `class_settings`.
   - Menambahkan fungsi `exportFullBackupJSON()` dan `importFullBackupJSON()`.
   - Mengoptimalkan auto-sync saat aplikasi dibuka agar data dari Supabase selalu menimpa cache lokal yang usang.
3. `src/context/ThemeContext.tsx` & `src/index.css`:
   - Menambahkan `'chocolate'` ke dalam `ThemeType`.
   - Menambahkan variabel kelas `.theme-chocolate` dengan latar belakang espresso dan teks krem kontras tinggi serta styling card doodle khusus tema cokelat.
4. `src/components/Doodle/AdminSettingsView.tsx`:
   - Menambahkan kolom interaktif "Siswa Terhubung" (dengan No. Absen & Nama) di tabel Whitelist Role.
   - Menambahkan sub-tab "Cadangan Data" untuk ekspor dan impor JSON.
5. `src/components/Doodle/Secretary/KelompokTab.tsx`:
   - Menambahkan input pencarian kelompok/anggota/mata kuliah.
   - Menambahkan tombol collapsible (buka/tutup/minimize) per mata kuliah.
6. `src/components/Doodle/KasChecklist.tsx`:
   - Menerapkan optimistic toggle dengan delay animasi 0.5 detik dan background debounce sync.
7. `src/components/Doodle/WhatsAppShareModal.tsx` / `KasRecapView.tsx`:
   - Menambahkan selector 3 pilihan periode (Minggu Ini, Bulan Ini, Keseluruhan) sebelum menampilkan teks rekap dan tombol salin/kirim WA.
8. `src/version.ts`:
   - Menaikkan versi aplikasi menjadi `v4.8.0` dengan patch notes lengkap dan rekomendasi pembaruan masa depan.

---

## 5. Verification Plan

1. **Sinkronisasi Multi-Device**:
   - Menguji perubahan tarif iuran spesial (misal September menjadi Rp15.000) dan memastikan tersimpan serta terbaca konsisten saat dibuka di sesi baru/perangkat lain tanpa ter-reset ke Rp5.000.
2. **Ekspor & Impor Data JSON**:
   - Mengekspor data dalam format JSON.
   - Mencoba melakukan impor kembali dan memeriksa apakah modal konfirmasi muncul serta tercatat di audit log.
3. **Whitelist Siswa**:
   - Mengubah penetapan siswa pada akun Google di whitelist dan memeriksa apakah No. Absen & Nama Siswa tersinkronisasi.
4. **Pencarian & Minimize Kelompok**:
   - Memasukkan kata kunci pencarian pada kelompok dan menguji toggle collapse/expand kelompok per mata kuliah.
5. **Tema Cokelat**:
   - Berpindah ke tema Cokelat dan memverifikasi kontras keterbacaan teks, navbar, kartu, serta elemen form.
6. **Responsivitas Ceklis**:
   - Menguji kecepatan pencentangan iuran berturut-turut untuk memastikan tidak ada lagging.
7. **Rekap WhatsApp**:
   - Menguji pemilihan 3 opsi periode (Minggu Ini, Bulan Ini, Keseluruhan) dan memastikan teks rekap sesuai periode yang dipilih.
8. **Kompilasi & Lint**:
   - Menjalankan `lint_applet` dan `compile_applet` untuk menjamin 0 error TypeScript.
