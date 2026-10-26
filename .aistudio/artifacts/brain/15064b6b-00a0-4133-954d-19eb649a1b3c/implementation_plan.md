# Kelas Gueh: Dual Hub Bendahara & Sekretaris, Kolektif Bill, & Core Polish (v4.0.0)

Pembaruan besar arsitektur aplikasi Kelas Gueh: menghadirkan Hub Beranda Utama dengan dua ranah besar (Bendahara dan Sekretaris), modul Sekretaris lengkap (Poin Keaktifan, Presensi Kelas/Rapat, Notulensi Surat), Tab baru Iuran Khusus & Kolektif di samping Ceklis Iuran, penyelesaian bug race-condition transaksi ganda pada ceklis iuran, pengaturan iuran spesifik per bulan beserta rekap semester, sinkronisasi URL router, dan pembaruan versi v4.0.0.

### User Review & Critical Decisions

> [!IMPORTANT]
> - **Hub Beranda Utama**: Dikonfirmasi sebagai portal awal aplikasi dengan 2 kartu besar doodle: **Ranah Bendahara** (Administrasi Kas & Keuangan) dan **Ranah Sekretaris** (Sekretariat, Presensi & Akademik), dengan tombol "Ganti Modul" di Navbar untuk navigasi instan.
> - **Modul Sekretaris Prioritas**: Dikonfirmasi berfokus pada 3 pilar: **Poin Keaktifan Siswa** (sistem skor, badge keaktifan & leaderboard), **Presensi Rapat & Kelas** (Hadir, Sakit, Izin, Alpa dengan rekap kehadiran), dan **Notulensi Rapat & Format Surat** (catatan keputusan rapat & generator template surat resmi kelas).
> - **Tab Iuran Khusus & Kolektif**: Ditempatkan di samping Ceklis Iuran. Berisi manajemen tagihan non-rutin (seminar, patungan, seragam, dll.) dengan filter peserta (bisa cari, pilih semua / batal semua), status lunas per siswa, dan sinkronisasi otomatis ke Buku Kas.
> - **Anti Double-Entry Ceklis Iuran**: Mencegah transaksi ganda dengan in-memory processing lock (debounce tombol massal) dan pengecekan idempoten tag `LINKED_IURAN` sebelum penambahan transaksi ke kas. Jika checklist kosong, dipastikan tidak ada uang kas yang masuk.
> - **Iuran Fleksibel per Bulan**: Dukungan override besaran iuran per minggu untuk bulan spesifik (misal bulan tertentu nominalnya berbeda) serta tab Rekap Kas per Bulan dan per Semester.
> - **Quality of Life URL Routing**: Sinkronisasi URL browser (HTML5 History API) seperti `/administrasi/buku-kas`, `/administrasi/iuran-kolektif`, `/sekretaris/keaktifan` tanpa merusak Single Page Application (SPA).
> - **Versi Aplikasi & Saran**: Pembaruan versi ke `v4.0.0` di `src/version.ts` dan menampilkan detail versi serta saran update di menu pengaturan.

---

### 1. Overview & Core Concept

1. **Hub Beranda Kelas**:
   - Membagi ekosistem kelas menjadi 2 ranah kerja yang terarah: **Bendahara** (fokus perputaran uang, kas, nota, dan audit) dan **Sekretaris** (fokus pencatatan akademik, keaktifan, presensi, notulensi).
2. **Tab Iuran Khusus & Kolektif**:
   - Memfasilitasi pembayaran acara seminar atau patungan kolektif. Menghitung biaya per siswa, melacak siapa yang ikut dan siapa yang sudah lunas, menyalin format rekap WhatsApp, dan mencatatnya ke Buku Kas.
3. **Penyempurnaan Integritas Ceklis Iuran**:
   - Memastikan tidak ada duplikasi transaksi saat jaringan lambat atau tombol ditekan beruntun. Menambahkan utilitas perbaikan/rekonsiliasi otomatis bila ada data lampau yang anomali.
4. **Iuran Spesifik Bulan & Rekap**:
   - Memungkinkan bendahara menetapkan nominal iuran yang berbeda pada bulan-bulan tertentu tanpa mengubah histori bulan lainnya, disertai laporan visual per bulan dan semester.

---

### 2. User Experience & Visual Design

#### A. Hub Beranda Utama
- **Kartu 1 - Ranah Bendahara**: Kartu doodle bergambar brankas & buku kas, kartu statistik ringkas (Saldo Kas Saat Ini, % Iuran Minggu Ini), tombol CTA *"Masuk ke Administrasi Kas"*.
- **Kartu 2 - Ranah Sekretaris**: Kartu doodle bergambar buku notula & pena, statistik ringkas (Total Siswa Terdaftar, Poin Keaktifan Tertinggi, Notula Terakhir), tombol CTA *"Masuk ke Sekretariat Kelas"*.
- **Navigasi Atas**: Badge modul aktif dengan tombol cepat *"Ganti Ranah"* untuk beralih antara Bendahara dan Sekretaris tanpa harus logout.

#### B. Tab Iuran Khusus & Kolektif (Ranah Bendahara)
- Berada di posisi: `Ringkasan Kas` | `Buku Kas & Nota` | `Ceklis Iuran` | **`Iuran Khusus & Kolektif`** | `Rekap Kas` | `Pengaturan`.
- **Daftar Tagihan Kolektif**: Kartu-kartu kegiatan aktif (misal: "Seminar Nasional AI", "Patungan Kaos Angkatan", "Dana Sosial Peduli Bencana").
- **Pembuat Tagihan Kolektif**:
  - Modal input: Judul kegiatan, kategori acara, tanggal tenggat, metode perhitungan (Total Biaya dibagi peserta atau Biaya Tetap per Orang).
  - Pemilih peserta interaktif: Input pencarian nama/NIM, tombol *"Pilih Semua"*, tombol *"Batal Semua"*, dan indikator jumlah siswa terpilih.
- **Tabel Checklist Pembayaran Acara**:
  - Menampilkan nama peserta, status pembayaran (*Belum Bayar* / *Lunas*), tanggal bayar, tombol centang cepat.
  - Tombol aksi: *"Salin Rekap WhatsApp"*, *"Catat ke Buku Kas"* (mencatat total pembayaran yang terkumpul sebagai pemasukan resmi).

#### C. Modul Ranah Sekretaris
- **Tab 1: Poin Keaktifan Siswa**:
  - Papan Peringkat (Leaderboard) Siswa Paling Aktif dengan avatar doodle & lencana apresiasi.
  - Tombol *"Tambah Poin Keaktifan"*: Pilih siswa, pilih kategori aktivitas (+5 Bertanya di Kelas, +10 Presentasi Mandiri, +5 Menjawab Kuis, +10 Inisiatif Diskusi, -5 Terlambat Hadir), tanggal, dan catatan pengingat.
  - Riwayat log keaktifan per siswa dengan opsi filter dan hapus log.
- **Tab 2: Presensi Rapat & Kelas**:
  - Pemilih tanggal dan jenis pertemuan (Kuliah / Rapat Kelas / Kerja Kelompok).
  - Status kehadiran per siswa: Hadir (H), Izin (I), Sakit (S), Alpa (A).
  - Ringkasan otomatis: Total Hadir, Sakit, Izin, Alpa. Tombol *"Salin Laporan Presensi WA"*.
- **Tab 3: Notulensi Rapat & Format Surat**:
  - **Notulensi**: Judul rapat, tanggal, pimpinan rapat, notulis, poin pembahasan, poin keputusan, dan daftar tindak lanjut (*action items*).
  - **Generator Surat Resmi**: Pembuat surat siap pakai (Surat Keterangan Izin Kuliah Bersama, Undangan Rapat Orang Tua/Kelas, Surat Pengantar Kegiatan) dengan format formal yang bisa langsung di-copy atau dicetak.

#### D. Pengaturan Iuran Spesifik Bulan & Rekap Semester
- Di Pengaturan Kas: Bagian *"Penyesuaian Nominal per Bulan"* di mana bendahara dapat mengatur misal `Januari 2026 = Rp 5.000`, `Februari 2026 = Rp 10.000`, sementara bulan lainnya mengikuti nominal standar.
- Tab *"Rekap Kas"*: Menampilkan ringkasan pemasukan & pengeluaran bulanan sepanjang tahun serta komparasi Semester Ganjil vs Semester Genap.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single SPA dengan Synchronized URL Routing**
  - *Chosen Approach*: Memanfaatkan HTML5 History API (`window.history.pushState` & `popstate`) di `App.tsx` agar setiap tab merefleksikan path URL bersih (misal `/administrasi/buku-kas`, `/sekretaris/keaktifan`).
  - *Why*: Memenuhi kebutuhan navigasi pengguna tanpa memerlukan dependency router berat tambahan atau konfigurasi server SSR yang rumit.
- **Decision 2: Pencegahan Transaksi Ganda pada Ceklis Iuran**
  - *Chosen Approach*: Menyediakan lock `isProcessingBulk` selama eksekusi toggle, verifikasi idempoten sebelum insert dengan `notes === LINKED_IURAN:${m.id}:${weekKey}`, dan routine sanitasi integritas jika toggle dibatalkan.
  - *Why*: Menyelesaikan akar masalah bug race-condition di mana tombol ditekan berulang sebelum Supabase/local storage selesai merespons.
- **Decision 3: Penyimpanan Data Kolektif & Sekretaris**
  - *Chosen Approach*: Menambahkan tabel/koleksi di `supabaseClient.ts` dan `LocalKasRepository` untuk `kolektifBills`, `keaktifanPoints`, `presensiRecords`, dan `notulensiRecords` dengan fallback local storage instan.
  - *Why*: Data tersimpan aman secara offline-first dan tetap sinkron jika Supabase aktif.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Hub Beranda                           │
│           (Pilihan: Bendahara vs Sekretaris)                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│       Ranah Bendahara         │ │      Ranah Sekretaris     │
├───────────────────────────────┤ ├───────────────────────────┤
│ • Ringkasan Kas               │ │ • Poin Keaktifan Siswa    │
│ • Buku Kas & Nota             │ │ • Presensi Rapat & Kelas  │
│ • Ceklis Iuran Mingguan       │ │ • Notulensi & Format Surat│
│ • Iuran Khusus & Kolektif NEW │ │ • Rekap Sekretariat       │
│ • Rekap Bulanan & Semester    │ └───────────────────────────┘
│ • Pengaturan & Audit Log      │
└───────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│        Data Repository & Integrity Enforcement              │
│ • Idempotent Iuran Auto-Linker (Anti-Duplicate Guard)       │
│ • Monthly Dues Overrides (`monthlyDuesOverrides`)           │
│ • Collective Bills Store & Payment Statuses                 │
│ • Secretary Data (Points, Attendance, Minutes)              │
│ • HTML5 History Router Sync (`/administrasi/*`, etc.)       │
└─────────────────────────────────────────────────────────────┘
```

#### Struktur Data Baru:
1. `KolektifBill`:
   ```ts
   interface KolektifBill {
     id: string;
     title: string;
     category: string;
     amountPerPerson: number;
     totalCost?: number;
     dueDate: string;
     notes?: string;
     participantIds: string[];
     paidMemberIds: string[];
     createdAt: string;
     syncedToKas?: boolean;
   }
   ```
2. `SecretaryState`:
   - `StudentPoint`: id, memberId, pointValue, category, reason, date.
   - `ClassAttendance`: id, date, sessionType, records: Record<memberId, 'hadir' | 'sakit' | 'izin' | 'alpa'>, notes.
   - `ClassMeetingNote`: id, date, title, leader, noteTaker, agenda, discussions, decisions, actionItems.
3. `ClassSettings`:
   - Penambahan `monthlyDuesOverrides?: Record<string, number>` (key: `YYYY_M`, contoh `2026_1: 5000`).

---

### 5. Step-by-Step Implementation Strategy

1. **Phase 1: Types & Data Repositories**
   - Perbarui `src/types/kas.ts` dengan tipe `KolektifBill`, `StudentPoint`, `ClassAttendance`, `ClassMeetingNote`, dan `monthlyDuesOverrides`.
   - Perluas `src/services/supabaseClient.ts` untuk mendukung penyimpanan lokal dan cloud untuk data kolektif dan sekretaris.
2. **Phase 2: Fix Ceklis Iuran Bug (Anti-Duplikasi & Idempoten)**
   - Perbaiki `handleToggleWeek` dan `handleToggleAllWeek` di `App.tsx` dengan guards idempoten, state debounce/loading, dan fungsi pemeriksa integritas.
   - Sesuaikan kalkulasi tunggakan/iuran mingguan agar membaca `monthlyDuesOverrides` jika ada.
3. **Phase 3: Tab Iuran Khusus & Kolektif**
   - Buat komponen `src/components/Doodle/KolektifBillTab.tsx` lengkap dengan pencarian, pemilih peserta, toggle lunas, copy teks WhatsApp, dan opsi sinkronisasi kas.
   - Hubungkan modal Split Bill agar dapat langsung dikonversi menjadi tagihan kolektif baru.
4. **Phase 4: Modul Ranah Sekretaris**
   - Buat komponen induk `src/components/Doodle/SecretaryHub.tsx` dan sub-komponen:
     - `KeaktifanTab.tsx`: Leaderboard, pencatatan poin, filter log.
     - `PresensiTab.tsx`: Presensi per sesi, filter riwayat, rekap kehadiran.
     - `NotulensiTab.tsx`: Notulensi rapat, form keputusan, generator format surat kelas.
5. **Phase 5: Hub Beranda Utama & Sinkronisasi URL Routing**
   - Buat `src/components/Doodle/MainPortalHub.tsx` dengan visual doodle dua ranah.
   - Tambahkan router sync di `App.tsx` menggunakan `window.history.pushState` dan listener `popstate` untuk navigasi URL bersih.
6. **Phase 6: Rekap Kas Bulanan & Semester + Pengaturan Spesifik Bulan**
   - Tambahkan view rekap di `KasOverview.tsx` atau tab terpisah dengan tabel 12 bulan dan semester ganjil/genap.
   - Tambahkan UI override nominal iuran per bulan di `KasSettings.tsx`.
7. **Phase 7: Pembaruan Versi & Saran Update**
   - Perbarui `src/version.ts` ke versi `v4.0.0` beserta changelog lengkap dan saran update fitur mendatang.
8. **Phase 8: Verifikasi & Kompilasi**
   - Uji kompilasi dengan `compile_applet`, pastikan nol linting error dan semua alur interaktif berfungsi optimal.
