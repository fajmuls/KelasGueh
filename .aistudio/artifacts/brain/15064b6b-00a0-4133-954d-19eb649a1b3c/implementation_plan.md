# Rencana Implementasi: Laporan Akhir Semester Terpadu, Navigasi Presisi, Modul Akademik & Inventaris (v4.1.0)

Pembaruan arsitektur besar-besaran untuk menyelaraskan antarmuka pengguna antara ranah Bendahara dan Sekretaris, menambahkan laporan visual akhir semester terpadu dengan ekspor PDF, menyelesaikan masalah tumpang tindih ikon dan luapan tombol split bill, menambahkan modul Inventaris Kelas & Jadwal Kuliah/Tugas, serta mengoptimalkan sound engine dan loading state ceklis iuran.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan sesi klarifikasi interaktif (Phase 1), berikut keputusan desain utama yang dikonfirmasi pengguna:
> - **Top Bar & Navigasi Utama:** Top bar hanya mempertahankan tombol **🏠 Hub** utama. Navigasi tab spesifik dipindahkan ke sub-navigasi di dalam masing-masing ranah (diselaraskan antara Bendahara dan Sekretaris).
> - **Laporan Akhir Semester:** Diwujudkan dalam bentuk **Modal Pratinjau Visual Terpadu Siap Cetak dan Ekspor PDF** yang menggabungkan neraca keuangan kas semester dan skor rekapitulasi keaktifan serta kehadiran siswa.
> - **Iuran Khusus & Kolektif:** Dibagi secara terpisah menggunakan tab: **Tagihan Acara** (seminar, seragam, dll.) dan **Patungan Belanja** (kolektif split bill pengadaan barang bersama).

---

## 1. Overview & Core Concept

### What It Does
1. **Laporan Akhir Semester Terpadu (PDF & Visual):** Menyajikan dokumen laporan akhir semester resmi kelas yang mencakup ringkasan keuangan (pemasukan, pengeluaran, surplus kas, status iuran siswa) bersanding dengan rekapitulasi poin keaktifan dan persentase kehadiran per mahasiswa/siswa, dilengkapi lembar KOP kelas dan kolom tanda tangan resmi (Wali Kelas / Dosen Pembina, Ketua Kelas, Bendahara, dan Sekretaris) siap ekspor PDF via cetak browser.
2. **Harmonisasi Sub-Navigasi & Top Bar:** Menyederhanakan Top Bar menjadi satu tombol akses Hub utama. Menu Bendahara kini memiliki sub-header navigasi yang elegan (`<- Beranda Hub | Administrasi Kas & Keuangan`) setara dengan Sekretaris, menghilangkan tombol-tombol yang tidak dapat diklik atau membingungkan.
3. **Ceklis Iuran Anti-Spam & Loading UX:** Menerapkan dialog animasi loading interaktif saat bendahara menekan tombol *Centang Semua* agar proses pembukuan saldo kas terhitung tuntas sebelum layar diperbarui, disertai audio chime khusus dan proteksi jeda klik cepat (cooldown) untuk mencegah pengetukan manual beruntun yang tidak wajar.
4. **Pemisahan Iuran Khusus:** Menata tab Iuran Khusus menjadi dua bagian terfokus: *Tagihan Acara Bersama* dan *Patungan Belanja*. Tombol pada modal Split Bill diperbaiki agar tidak pernah keluar dari batas frame (overflow).
5. **Ekspansi Modul Sekretaris (5 Sub-Menu):**
   - *Poin Keaktifan Siswa:* Terintegrasi dengan pilihan Mata Kuliah/Pelajaran.
   - *Presensi Rapat & Kelas:* Terintegrasi dengan jadwal dan mata kuliah.
   - *Notulensi & Format Surat:* Template surat resmi dan risalah musyawarah.
   - *Inventaris Kelas (Baru):* Pencatatan aset barang kelas (kondisi, jumlah, lokasi, sumber kas).
   - *Jadwal & Tugas Kuliah (Baru):* Pengelolaan mata kuliah/pelajaran, nama dosen/guru, SKS, jadwal jam kuliah, dan deadline tugas kelas.
6. **Audio Concurrency & Bug Icon Overlap:** Mengatur sound engine agar suara lama otomatis fade-out ketika efek baru dimainkan, serta menyingkirkan elemen pin/marker lokasi dekoratif yang menimpa teks judul dan lapisan banner.

---

## 2. User Experience & Visual Design

### Key User Flows
```
                           ┌────────────────────────┐
                           │    🏠 HUB BERANDA      │
                           │  (Portal Pilihan Ranah)│
                           └───────────┬────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
 ┌─────────────────────────────┐               ┌─────────────────────────────┐
 │       RANAH BENDAHARA       │               │       RANAH SEKRETARIS      │
 │  Sub-nav: Hub | Bendahara   │               │  Sub-nav: Hub | Sekretariat │
 ├─────────────────────────────┤               ├─────────────────────────────┤
 │ • Ringkasan Kas             │               │ • Poin Keaktifan (Filter MK)│
 │ • Buku Kas & Nota           │               │ • Presensi Kelas (Filter MK)│
 │ • Ceklis Iuran (Loading UX) │               │ • Notulensi & Format Surat  │
 │ • Iuran Khusus (Acara/Split)│               │ • Inventaris Kelas (Baru)   │
 │ • Rekap Kas 12 Bln & Smt    │               │ • Jadwal MK & Tugas (Baru)  │
 ├─────────────────────────────┤               ├─────────────────────────────┤
 │ 🖨️ [Laporan Akhir Semester] │               │ 🖨️ [Laporan Akhir Semester] │
 └──────────────┬──────────────┘               └──────────────┬──────────────┘
                └──────────────────────┬──────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │   MODAL LAPORAN SEMESTER      │
                       │ • Rangkuman Kas & Neraca      │
                       │ • Skor Keaktifan & Kehadiran  │
                       │ • KOP Kelas & Lembar TTD      │
                       │ • Tombol Cetak / Simpan PDF   │
                       └───────────────────────────────┘
```

### Visual Identity & Theme
- **Gaya Desain:** Neo-Brutalism Doodle yang bersih, bergaris tepi tegas (`border-slate-900`), bayangan balok berkarakter (`shadow-[2px_2px_0px_#1E293B]`), aksen warna fungsional (Amber untuk Bendahara, Sky untuk Sekretaris, Emerald untuk Transaksi Lunas & Kehadiran).
- **Anti-Slop & Zero-Pill:** Metadata disajikan dengan tipografi bersih tanpa kapsul bertingkat yang berlebihan.
- **Pembersihan Icon Menimpa:** Semua `PushPin` yang melayang sembarangan dan menutupi teks dihapus atau diposisikan ke zona aman tanpa `pointer-events`.

---

## 3. Data Strategy & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LocalKasRepository / Supabase                   │
├────────────────────────────────────────────────────────────────────────┤
│ • classSettings (mataKuliahList, inventoryList, monthlyDuesOverrides) │
│ • kasTransactions (kas masuk, keluar, link iuran)                     │
│ • kasMembers (nama, nim/nis, status bayar mingguan)                   │
│ • kolektifBills (type: 'acara' | 'patungan', peserta, status)         │
│ • studentPointLogs (memberId, courseId, points, category, notes)      │
│ • attendanceRecords (date, courseId, type, statuses: H/I/S/A)         │
│ • meetingMinutes (agenda, hasil, action items)                         │
│ • classInventory (id, name, qty, condition, location, purchasedFromKas)│
│ • courseSchedules (id, name, lecturer, sks, day, time, assignments)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Penambahan Tipe Data Baru (`src/types/kas.ts`):
1. `ClassInventoryItem`:
   - `id: string`, `name: string`, `quantity: number`, `condition: 'baik' | 'rusak_ringan' | 'rusak_berat'`, `location: string`, `purchasedFromKas: boolean`, `price?: number`, `notes?: string`.
2. `CourseSchedule`:
   - `id: string`, `courseName: string`, `lecturerName: string`, `sks: number`, `day: string`, `time: string`, `room?: string`.
   - `assignments: CourseAssignment[]` (`id: string`, `title: string`, `deadline: string`, `status: 'pending' | 'selesai'`).
3. Pembaruan `StudentPointLog` & `AttendanceRecord`:
   - Menambahkan field opsional `courseId?: string` untuk klasifikasi per mata kuliah.
4. Pembaruan `KolektifBill`:
   - Menambahkan field `billType: 'acara' | 'patungan'` untuk segregasi tab.

---

## 4. Rincian Langkah Pengerjaan

### Tahap 1: Penguatan Tipe Data & Repositori Lokal
- Tambahkan interface `ClassInventoryItem`, `CourseSchedule`, dan perbarui tipe kolektif bill serta point/attendance logs.
- Tambahkan metode CRUD di `src/services/supabaseClient.ts` untuk inventaris dan jadwal kuliah dengan persistensi aman ke localStorage.

### Tahap 2: Sound Engine & Loading State Ceklis
- Modifikasi `src/utils/soundEffects.ts`:
  - Tambahkan tracking instance audio yang sedang aktif; lakukan `fade-out` atau `pause()` pada efek sebelumnya sebelum memutar efek baru agar tidak bising saat ada banyak interaksi.
  - Tambahkan metode `playBulkLoadingSuccess()`.
- Modifikasi `src/components/Doodle/KasChecklist.tsx`:
  - Saat tombol *Centang Semua* diklik, munculkan overlay loading doodle putar dengan pesan edukatif (*"Sedang mengalkulasi data kas & mencatat pembukuan..."*).
  - Terapkan cooldown debouncing pada tombol centang satuan siswa untuk mencegah spam kilat (20 klik dalam 5 detik).

### Tahap 3: Restrukturisasi Navigasi & Pembersihan Bug Ikon
- Update `src/components/Doodle/DoodleNavbar.tsx`:
  - Sederhanakan tombol navigasi atas: Hanya tampilkan tombol **🏠 Hub** di top bar. Hilangkan tombol quick switch B/S atau tab-tab yang duplikat dan tidak bisa diklik.
- Buat sub-navigasi di ranah Bendahara (sama seperti di Sekretaris):
  - Banner baris rapi dengan `<- Beranda Hub | Administrasi Kas & Keuangan` dan tab-tab aktif yang dapat diklik langsung.
- Periksa seluruh file komponen (`MainPortalHub.tsx`, `PresensiTab.tsx`, `KeaktifanTab.tsx`, `KasRecapView.tsx`) dan bersihkan ikon `PushPin` yang menimpa teks.

### Tahap 4: Tab Iuran Khusus & Perbaikan Split Bill Modal
- Perbarui `KolektifBillTab.tsx`:
  - Tambahkan sub-tab: **Tagihan Acara** vs **Patungan Belanja**.
- Perbaiki `SplitBillModal.tsx`:
  - Sesuaikan ukuran tombol, gunakan layout responsif (`flex-wrap sm:flex-nowrap`, padding proporsional) agar tidak ada tombol yang meluap keluar dari batas frame.

### Tahap 5: Modul Inventaris & Jadwal Kuliah di Ranah Sekretaris
- Buat komponen `src/components/Doodle/Secretary/InventarisTab.tsx`:
  - Tabel dan kartu inventaris barang kelas (Jumlah, Kondisi dengan lencana warna, Lokasi simpan, Filter kondisi, Tambah/Edit/Hapus barang).
- Buat komponen `src/components/Doodle/Secretary/JadwalTugasTab.tsx`:
  - Jadwal kuliah per hari, nama dosen, SKS, dan kartu checklist tugas deadline.
- Hubungkan daftar mata kuliah ke dropdown filter di `KeaktifanTab.tsx` dan `PresensiTab.tsx`.

### Tahap 6: Modal Laporan Akhir Semester Terpadu (Kas & Keaktifan)
- Buat komponen `src/components/Doodle/SemesterReportModal.tsx`:
  - Pratinjau visual formal nan rapi (KOP Kelas, Rangkuman Semester, Statistik Saldo & Iuran Siswa, Top Siswa Teraktif & Persentase Kehadiran).
  - Kolom tanda tangan resmi 4 pihak (Dosen/Wali Kelas, Ketua Kelas, Bendahara, Sekretaris).
  - Tombol **Cetak / Simpan PDF** yang memicu `window.print()` dengan CSS print terisolasi rapi.
  - Tombol **Salin Ringkasan WA** untuk pengumuman di grup kelas.

### Tahap 7: Versi v4.1.0, Saran Pengembang & Verifikasi
- Perbarui `src/version.ts` ke versi `v4.1.0` beserta changelog dan rekomendasi saran pembaruan.
- Jalankan `compile_applet` dan `lint_applet` untuk menjamin 0 error sebelum verifikasi tuntas.
