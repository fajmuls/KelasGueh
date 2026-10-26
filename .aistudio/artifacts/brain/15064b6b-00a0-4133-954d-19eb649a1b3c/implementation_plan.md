# Rencana Implementasi Pembaruan & Penyempurnaan Aplikasi "Kelas Gue"

Berikut adalah rencana langkah demi langkah untuk menyelesaikan pembaruan besar, perbaikan bug, penyempurnaan UI, serta penambahan fitur baru sesuai permintaan.

---

### 1. Pemadatan Banner UI & Penyelarasan Doodle Box
- **Tujuan**: Mengubah ukuran banner header pada setiap menu (`KeaktifanTab`, `PresensiTab`, `NotulensiTab`, `InventarisTab`, `JadwalTugasTab`, `BendaharaHub`, `KasRecapView`) agar lebih ringkas dan pas, serupa dengan gaya box doodle klasik pada `Ringkasan Kas` dan `Buku Kas`.
- **Perubahan**:
  - Mengurangi padding vertical banner dari `p-5` / `p-6` menjadi `p-3.5` / `p-4`.
  - Merapikan posisi stempel / ScotchTape agar tidak menutupi teks atau tombol aksi.

---

### 2. Reorganisasi Menu Pengaturan & Akses Admin (SuperAdmin)
- **Pengaturan Kas (Bendahara)**:
  - Difokuskan khusus untuk pengaturan besaran iuran mingguan (`weeklyDuesAmount`), target kas, dan tahun akademik/semester.
- **Pengaturan Admin (Khusus SuperAdmin di Menu Hamburger)**:
  - Memindahkan **Laporan Audit Log** ke dalam Modal Pengaturan Admin dengan filter lengkap (kategori transaksi, iuran, perubahan role, perspektif bendahara vs sekretaris).
  - **Manajemen Role ("Whitelist Role")**: Mengatur email whitelist dan simulasi hak akses.
  - **Manajemen Jenis Kelamin Siswa**: Pengaturan manual gender ('L' | 'P') untuk seluruh anggota kelas.
  - **Pembersihan Cache Lokal**: Tombol reset cache browser per pengguna tanpa menghapus database cloud Supabase.
  - **Pin Keamanan & Catatan Rilis**: Pengaturan PIN khusus admin dan penampil changelog rilis.

---

### 3. Data Jenis Kelamin (L/P) & Auto-Detection
- **Struktur Data**: Menambahkan field `gender?: 'L' | 'P'` pada interface `KasMember`.
- **Auto-Detect**:
  - Pada inisialisasi awal, nama siswa dipindai secara otomatis:
    - Kata kunci laki-laki (misal: *Ahmad, Budi, Muhammad, Fajri, Putra, Rian, Rizky, Kevin, Hendra, Agung, Irfan*) -> `'L'`
    - Kata kunci perempuan (misal: *Siti, Putri, Anisa, Dewi, Nur, Ayu, Fitri, Sarah, Rahma, Indah, Maya*) -> `'P'`
- **Pengaturan Manual**: Admin dapat mengubah jenis kelamin kapan saja dari daftar anggota atau Pengaturan Admin.

---

### 4. Tab Baru Sekretaris: Pembagian Kelompok Kelas
- **Sub-Tab Ke-6 di Sekretaris Hub**: `Pembagian Kelompok` (Group Generator).
- **Fitur Utama**:
  - Input jumlah kelompok yang diinginkan (misal: 2 hingga 10 kelompok).
  - Mode Pembagian:
    1. **Campur Acara (Full Random)**
    2. **Seimbang Gender (L/P Proporsional)**: Membagi siswa laki-laki dan perempuan secara merata ke setiap kelompok.
  - Tampilan Kartu Hasil Kelompok yang rapi.
  - Tombol **Salin Daftar Kelompok ke WhatsApp** untuk dibagikan ke grup kelas.

---

### 5. Peningkatan Buku Kas & Arsip Nota
- **Edit Transaksi**:
  - Menambahkan tombol **Edit** pada setiap baris transaksi di Buku Kas untuk mengubah Judul, Nominal, Kategori, Tanggal, dan Catatan/Nota.
- **Toggle Filter "Sembunyikan Iuran Mingguan"**:
  - Menyediakan switch/toggle pada header Buku Kas untuk menyembunyikan transaksi iuran mingguan otomatis, sehingga daftar fokus pada transaksi umum (pengeluaran/pemasukan kelas non-iuran).

---

### 6. Perbaikan Bug & UI Polish
- **Perbaikan Double Plus Icon**:
  - Menghapus pembacaan plus ganda pada tombol-tombol Sekretaris (*Tambah Matkul, Tambah Tugas, Tambah Barang, Tambah Notulensi, Tambah Sesi Presensi*).
- **Penghapusan Label "New"**:
  - Menghapus badge/tulisan "New" pada tab Iuran Khusus & Kolektif.
- **Efek Suara (Sound Effects) Lengkap**:
  - Memastikan setiap tombol interaktif memicu SFX yang unik dan konsisten.
- **Dukungan Tema Visual**:
  - Memastikan semua komponen baru dan modal beradaptasi dengan sempurna pada tema **Terang, Sepia, dan Dark**.
- **Delai Loading Ceklis Massal**:
  - Menyelaraskan animasi spinner loading saat "Centang Semua Lunas" diproses agar saldo kas dan mutasi ter-update dengan pasti sebelum modal ditutup.
- **Pembatasan Hak Akses Anggota**:
  - Kalkulator Split Bill dan opsi ekspor keuangan dibatasi hanya untuk Bendahara, Sekretaris, dan Super Admin.

---

### Langkah Pembuktian & Pengujian
1. **Pengujian Kompilasi (`compile_applet`)**: Memastikan seluruh kode TypeScript bebas dari syntax / type error.
2. **Pengujian Linter (`lint_applet`)**: Memastikan tidak ada import yang terlewat atau variabel tidak terdefinisi.
3. **Pengujian Fungsional**: Memeriksa navigasi sub-tab, pembuatan kelompok, edit transaksi di Buku Kas, dan filter iuran.
