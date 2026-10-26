# Implementation Plan - Doodle UI Total Overhaul & Dedicated Admin Settings View (v4.3.0)

Penyelarasan komprehensif tampilan visual aplikasi **Kelas Gue** ke gaya **Full Hand-Drawn Doodle**, pemindahan menu Pengaturan Admin dari modal pop-up menjadi **Tab View Mandiri**, isolasi manajemen anggota/whitelist ke ranah Master Admin dengan dropdown pencarian otomatis (Nama & NIM), reset data awal (Inventaris, Jadwal, Keaktifan) menjadi kosong, serta penegakan format Title Case untuk seluruh penulisan nama mahasiswa.

> [!IMPORTANT]
> **Keputusan Utama yang Telah Dikonfirmasi (Phase 1 Confirmation)**
> - **Navigasi Pengaturan Admin**: Dibuka sebagai **Tab View tersendiri** (`admin_settings`) dengan header doodle, pita/badge doodle, dan sub-tab navigasi lengkap (Whitelist Roll, Manajemen Siswa, Audit Log, PIN Keamanan, Pembersihan Cache, Catatan Pembaruan).
> - **Reset Data Awal**: Inisialisasi awal data *Inventaris Barang*, *Jadwal & Tugas*, dan *Poin Keaktifan* dikosongkan secara total (`[]`), sehingga data bersih hingga diisi manual oleh pengurus/admin.
> - **Input & Whitelist Siswa Auto-complete**: Penambahan siswa dan whitelist di Pengaturan Admin menggunakan dropdown pencarian doodle yang secara otomatis mencocokkan nama dan NIM siswa.
> - **Kerapihan Penulisan Nama**: Semua tampilan nama siswa di Presensi, Keaktifan, Notulensi, Inventaris, dan Kelompok diwajibkan menggunakan format **Title Case** (contoh: "Ahmad Budi Pratama").
> - **Pembaruan Versi Aplikasi**: Pengkinian versi aplikasi ke `v4.3.0` di file `src/version.ts` beserta catatan pembaruan dan saran update fitur/keamanan sesuai instruksi sistem.

---

## 1. Overview & Core Concept

Aplikasi **Kelas Gue** akan ditingkatkan ke versi `v4.3.0` ("Doodle UI Total & Admin Tab Alignment") dengan penyempurnaan menyeluruh pada estetika doodle hand-drawn dan perbaikan arsitektur navigasi menu Pengaturan Admin.

### Target Pengguna & Fitur Utama:
- **Admin / SuperAdmin**: Memiliki hak akses khusus ke Tab View **Pengaturan Admin** tersendiri untuk mengelola Whitelist Roll (Super Admin, Bendahara, Sekretaris), mengimpor/menambah data siswa dengan gender, melihat Audit Log lintas modul, mengatur PIN keamanan, serta mengelola cache lokal.
- **Sekretaris Kelas**: Mengelola presensi, notulensi, jadwal/tugas, inventaris barang, poin keaktifan, dan pembagian kelompok siswa dengan data yang bersih serta nama berformat Title Case.
- **Bendahara Kelas**: Mengelola kas, ringkasan kas, buku kas, checklist iuran, dan iuran kolektif melalui menu Pengaturan Kas yang khusus mengatur iuran dan semester saja (tanpa manajemen anggota siswa).

---

## 2. User Experience & Visual Design

### Estetika Full Doodle Hand-Drawn:
1. **Garis Tepi & Bayangan Khas Doodle**:
   - Setiap tombol, kartu, input, select, dan badge menggunakan `border-2 border-slate-900 shadow-[2px_2px_0px_#000]` atau `border-3 border-slate-900 shadow-[4px_4px_0px_#000]`.
   - Latar belakang bertema kertas bergaris/kertas doodle (`bg-amber-50/90`, `bg-yellow-100`, `bg-white`).
   - Aksesori visual seperti isolasi/selotip doodle (`tape-decoration`), stempel doodle (`stamp-badge`), dan ikon bertema sketsa pensil.
2. **Kerapihan Penulisan Nama (Title Case)**:
   - Fungsi pembantu `toTitleCase` akan memformat setiap nama yang ditampilkan di seluruh tabel dan kartu (misal: `"AHMAD BUDI"` atau `"ahmad budi"` -> `"Ahmad Budi"`).
3. **Bentuk Tab Dedicated Pengaturan Admin**:
   - Pengaturan Admin tidak lagi tampil sebagai modal overlay sederhana, melainkan berupa **Tab Utama** dengan header doodle besar, stempel "ADMINISTRATOR ONLY", dan 6 sub-tab internal yang rapi.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [★ PENGATURAN MASTER ADMIN]                    [Versi App v4.3.0 - Doodle]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Whitelist Roll│ │Manajemen Siswa│ │ Audit Log    │ │ PIN & Cache │ │ Ver Notes│ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ └──────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Cari / Auto-complete Nama Siswa & NIM:                                        │
│   ┌─────────────────────────────────────────────────┬────────────────────────┐  │
│   │ 🔍 Ketik Nama atau NIM...                       │ [ Dropdown Matching ]  │  │
│   └─────────────────────────────────────────────────┴────────────────────────┘  │
│                                                                                 │
│   Pilih Role Hak Akses: [ Bendahara Kelas  ▼ ]                                  │
│   [ + Tambahkan Ke Whitelist Roll ]                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

1. **Tab View Dedicated vs Modal Overlay untuk Admin**:
   - *Pilihan*: Mengganti `AdminSettingsModal` dengan `AdminSettingsView.tsx` yang di-render sebagai halaman/tab penuh (`currentTab === 'admin_settings'`).
   - *Alasan*: Memberikan ruang yang luas untuk filter Audit Log, tabel Whitelist, serta Form Import & Input Siswa tanpa terasa sesak.

2. **Isolasi Manajemen Siswa ke Admin**:
   - *Pilihan*: Menghapus opsi *Import Siswa* dan *Tambah Siswa* dari `KasSettings.tsx` milik Bendahara dan memindahkannya secara total ke `AdminSettingsView.tsx`.
   - *Alasan*: Mengikuti spesifikasi pengguna di mana pengaturan Bendahara difokuskan khusus pada Kas & Semester, sedangkan data siswa merupakan wewenang Master Admin.

3. **Reset Inisialisasi Data Inventaris, Jadwal, dan Keaktifan**:
   - *Pilihan*: Mengubah nilai default di `src/services/supabaseClient.ts` dari array sampel contoh menjadi array kosong (`[]`).
   - *Alasan*: Menjamin bahwa pengguna baru memulai aplikasi dari keadaan bersih tanpa data placeholder dummy.

4. **Pembaharuan Versi (v4.3.0)**:
   - *Pilihan*: Memperbarui `src/version.ts` dengan changelog lengkap dan menyajikan opsi saran pembaruan (fitur, optimasi, keamanan) pada bagian Pengaturan.

---

## 5. Summary of Verification & Testing Plan

1. **Kompilasi & Linting**: Build aplikasi menggunakan `compile_applet` untuk memastikan tidak ada kesalahan TypeScript atau sintaksis.
2. **Pengujian Tampilan Doodle**: Verifikasi bahwa seluruh komponen pada `KelompokTab` dan `AdminSettingsView` memiliki border hitam tebal hand-drawn (`border-2/3 border-slate-900`) dan shadow offset khas doodle.
3. **Pengujian Navigasi Admin**: Buka Pengaturan Admin melalui Hamburger Menu dan pastikan ia terbuka sebagai Tab View tersendiri dengan sub-navigasi yang berfungsi penuh.
4. **Pengujian Auto-complete & Whitelist**: Coba ketik Nama atau NIM pada form penambahan Whitelist dan pastikan pencarian otomatis memberikan saran pilihan siswa yang sesuai.
5. **Pengujian Formatting Nama**: Pastikan nama-nama siswa yang tampil di seluruh tabel menggunakan huruf kapital di awal setiap kata (Title Case).
