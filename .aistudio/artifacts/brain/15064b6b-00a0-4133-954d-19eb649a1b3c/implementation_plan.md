# Plan: Checklist Clean Look, Settings Member Management & PDF Verification

Pembaruan ini bertujuan untuk merampingkan UI/UX halaman **Checklist Iuran** agar berfokus murni pada pemantauan dan pencatatan iuran, memindahkan manajemen data siswa (Tambah & Impor Siswa) ke menu **Pengaturan**, menyempurnakan area profil user & Google Auth di header, memformat nama siswa otomatis menjadi Title Case, serta menambahkan Stempel Digital Doodle & Kode QR Verifikasi pada PDF Binder Laporan Kas.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Seluruh pilihan desain dan alur di bawah ini disesuaikan dengan permintaan pengguna dan hasil konfirmasi.

- **Penyederhanaan Checklist Iuran**: Menghapus tombol berat (*Tambah Siswa*, *Import Siswa*) dari halaman Checklist Iuran. Di atas tabel kini hanya tersisa baris ramping minimalis berisi tombol **Mode Kartu** (ikon tangan ringkas) dan **Tagih WA**.
- **Perpindahan Manajemen Siswa**: Tombol *Tambah Siswa* dan *Import Siswa (Excel/CSV)* dipindahkan ke tab **Pengaturan** pada seksi baru "Manajemen Anggota Siswa".
- **Google Auth Profile & Logout**:
  - Di header, pengguna yang sudah Login (Google Auth/Custom) kini memiliki **Profil Dropdown Lengkap** dengan info email/role, akses cepat ke **Pengaturan**, dan tombol **Keluar (Logout)**.
  - Menghilangkan tombol/teks "Masuk akun Google" yang tidak perlu jika user sudah berada dalam sesi login aktif.
- **Pembersihan Badge "Mode Lihat Saja"**: Badge "🔒 Mode Lihat Saja" di Buku Kas dihapus agar tampilan lebih bersih.
- **Auto Title Case & Font Nama Siswa**:
  - Nama siswa otomatis diformat Title Case (kapital di awal setiap kata, e.g. `m rachman fajri m` -> `M Rachman Fajri M`).
  - Font nama siswa disederhanakan dan diperbaiki agar mudah dibaca di layar HP dan desktop.
- **Pengesahan & Stempel PDF Binder**:
  - Layout dokumen cetak dijadikan full-page A4 (`margin: 10mm`).
  - Menambahkan **Stempel Digital Doodle Kelas** dan **Kode QR Verifikasi Cloud** pada dokumen PDF.
  - Nama Super Admin diperbarui menjadi **`M Rachman Fajri M`**.

---

## 1. Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DoodleNavbar (Header)                         │
│  [Logo / Title] ── [Nav Tabs] ── [User Avatar / Profile Dropdown]      │
│                                       └─ Profil Info, Pengaturan, Keluar│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐
│    KasBook       │    │    KasChecklist    │    │     KasSettings     │
│ - Clean Toolbar  │    │ - Clean Bar Minimal│    │ - Pengaturan Iuran  │
│ - (No "Mode      │    │   (Mode Kartu, WA) │    │ - Manajemen Siswa   │
│   Lihat Saja")   │    │ - Auto Title Case  │    │   (Tambah & Import) │
└──────────────────┘    └────────────────────┘    └─────────────────────┘
                                   │
                                   ▼
                       ┌──────────────────────┐
                       │ PrintableBinderModal │
                       │ - Stempel Doodle QR  │
                       │ - M Rachman Fajri M  │
                       │ - Full Page A4 Print │
                       └──────────────────────┘
```

---

## 2. Proposed Changes

### A. Auto Title Case Helper Utility (`src/utils/textFormatting.ts` or inline helper)
- Fungsi `toTitleCase(text: string)`:
  1. Mengubah string menjadi lowercase lalu mengonversi huruf pertama setiap kata menjadi Uppercase.
  2. Contoh: `"m rachman fajri m"` $\rightarrow$ `"M Rachman Fajri M"`.
  3. Diterapkan saat menampilkan nama siswa di `KasChecklist`, `KasOverview`, `KasBook`, `PrintableBinderModal`, dan saat menyimpan siswa baru.

### B. Header & Navigasi (`src/components/Doodle/DoodleNavbar.tsx`)
- Memperbarui area User Account / Profile Dropdown:
  - Ketika user sudah login, menampilkan avatar/inisial dengan indikator status terverifikasi.
  - Mengklik avatar membuka popover dropdown menu yang berisi:
    - Nama User & Email (`mrachmanfm@gmail.com`).
    - Status Peran / Role (Super Admin / Bendahara / Anggota).
    - Tombol pintas **Pengaturan** (jika memiliki hak akses).
    - Tombol **Keluar (Logout)** yang langsung mengakhiri sesi.
  - Mengonsolidasikan menu hamburger agar tetap rapi.

### C. Pembersihan Checklist Iuran (`src/components/Doodle/KasChecklist.tsx`)
- Menghapus tombol *Tambah Siswa* dan *Import Siswa* dari header halaman Checklist.
- Membuat baris di atas tabel checklist menjadi **Baris Ramping Minimalis**:
  - Tombol **Mode Kartu** (dengan ikon tangan ringkas & tooltip).
  - Tombol **Tagih WA**.
  - Pemilih Bulan/Tahun, Filter "Belum Lunas", dan Kotak Cari Nama/NIM.
- Menerapkan formatting Title Case dan font nama yang lebih bersih & jelas pada tabel checklist.

### D. Tab Pengaturan & Manajemen Siswa (`src/components/Doodle/KasSettings.tsx`)
- Menambahkan seksi baru **"Manajemen Anggota Siswa Kelas"**:
  - Memindahkan fungsi **+ Tambah Siswa Baru** (modal/form).
  - Memindahkan fungsi **Import Daftar Siswa (Excel / CSV)**.
  - Menampilkan daftar ringkas anggota siswa dengan opsi ubah data/hapus.

### E. Pembersihan UI Buku Kas (`src/components/Doodle/KasBook.tsx`)
- Menghapus badge `"🔒 Mode Lihat Saja"` agar tampilan bersih dan konsisten bagi seluruh peran.

### F. Refinemat Dokumen Cetak & PDF (`src/components/Doodle/PrintableBinderModal.tsx`)
- Memperbarui gaya cetak CSS:
  - `@page { size: A4; margin: 10mm; }`
  - Memperlebar margin konten & mengecilkan proporsi font agar dokumen muat pas 1 halaman A4 tanpa terpotong.
- Menambahkan elemen **Stempel Digital Doodle Kelas** ("TERVERIFIKASI CLOUD SUPABASE") dan elemen **Kode QR Verifikasi** di pojok bawah dokumen.
- Memperbarui nama Super Admin di kolom tanda tangan menjadi **`M Rachman Fajri M`**.

---

## 3. Verification Plan

1. **Pengujian Tampilan Checklist Iuran**:
   - Buka tab *Checklist Iuran* di HP (360px) dan Desktop (1440px).
   - Pastikan header checklist bersih tanpa tombol Tambah/Import Siswa.
   - Pastikan nama siswa tampil dengan format Title Case (misal: "M Rachman Fajri M").
2. **Pengujian Menu Pengaturan Siswa**:
   - Buka tab *Pengaturan*, verifikasi adanya seksi *Manajemen Anggota Siswa*.
   - Uji penambahan siswa baru dan impor Excel/CSV.
3. **Pengujian Profil Dropdown Header**:
   - Klik avatar profil di header saat login.
   - Verifikasi munculnya info user, tombol Pengaturan, dan tombol Keluar.
4. **Pengujian Pratinjau Cetak / PDF**:
   - Buka modal *Cetak / PDF*.
   - Verifikasi tanda tangan Super Admin tertulis **M Rachman Fajri M**.
   - Verifikasi hadirnya Stempel Doodle Terverifikasi & Kode QR.
5. **Kompilasi & Linting**:
   - Jalankan `compile_applet` dan `lint_applet` untuk memastkan tidak ada error TypeScript/ESLint.
