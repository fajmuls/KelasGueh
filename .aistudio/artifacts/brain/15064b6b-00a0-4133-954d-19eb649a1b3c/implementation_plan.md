# Rencana Pembaruan v3.5.0: Quality of Life & Mobile Refinement Edition

Pembaruan komprehensif untuk meningkatkan kerapian visual, keterbacaan di layar ponsel (mobile-first pixel density), konsistensi desain doodle di setiap tombol, kendali identitas siswa oleh Super Admin, serta penyempurnaan format laporan kas dan ekspor dokumen.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan desain berikut telah dikonfirmasi dan diselaraskan melalui sesi klarifikasi sebelum penyusunan arsitektur:

- **Gaya Visual Cetak & Ekspor**: Menggunakan format lembar binder kas doodle bergaris dengan kop resmi sekolah/kelas, stempel transparansi, dan garis buku tulis rapi untuk arsip fisik wali kelas atau ketua kelas.
- **Pemetaan Identitas Akun Google oleh Super Admin**: Dropdown langsung di dalam tabel Whitelist Pengguna di dashboard Pengaturan, memungkinkan Super Admin memilih nama siswa dari daftar kas untuk ditautkan ke akun Google yang terdaftar.
- **Format Pesan WhatsApp Pengingat Kas**: Format laporan resmi ringkas yang menonjolkan saldo kas terkini, pengeluaran minggu/bulan berjalan, dan rincian nominal tunggakan siswa secara langsung dan profesional tanpa tumpukan ikon berlebih.
- **Pembersihan Kontrol Navbar**: Menghapus tombol "Putar Ulang Intro Logo" dan memindahkan toggle suara SFX ke menu Pengaturan Pengguna agar bilah atas tetap ringkas dan tidak meluber di smartphone.
- **Peningkatan Nomor Versi**: Versi aplikasi dinaikkan menjadi **v3.5.0** sesuai pedoman penomoran (angka kedua dinaikkan karena terdapat penambahan fitur-fitur baru dan perubahan signifikan).

---

### 1. Overview & Core Concept

- **Tujuan Utama**: Mengoptimalkan pengalaman pengguna ponsel pintar agar informasi kas dan checklist iuran tampil padat tanpa banyak scrolling, menyatukan seluruh elemen tombol dengan identitas visual doodle art yang konsisten, serta memberikan transparansi data yang lebih matang antara akun login dan nama siswa.
- **Target Pengguna**: Bendahara kelas, Super Admin/Ketua Kelas, Wali Kelas, serta seluruh anggota kelas yang mengakses buku kas secara mandiri dari smartphone masing-masing.
- **Nilai Tambah (Key Value)**:
  - Kemudahan navigasi satu layar pada handphone dengan pengurangan padding dan margin yang berlebih.
  - Rasa tenang bagi bendahara melalui indikator status sinkronisasi cloud (Hijau = Tersinkron, Kuning = Mengirim ke Cloud).
  - Kecepatan penagihan kas dengan filter 1-klik `[Hanya Belum Lunas]` di Checklist Iuran.

---

### 2. User Experience & Visual Design

#### A. Mobile-First Pixel Density & Button Compaction
- **Pengurangan Skala Komponen Mobile**:
  - Mengurangi padding kontainer dari `p-6` menjadi `p-3.5` atau `p-4` pada layar mobile `<640px`.
  - Memperkecil tinggi tombol aksi dari `py-2.5` menjadi `py-1.5` dengan ukuran teks `text-xs` (11-12px) font tebal sans-serif.
  - Memangkas jarak antar kartu (`gap-6` menjadi `gap-3`) sehingga ringkasan kas dan tabel dapat terlihat dalam sekali pandang tanpa scrolling panjang.
- **Harmonisasi Gaya Tombol Doodle**:
  - Semua tombol aksi di Pengaturan, Buku Kas, Nota Transaksi, dan Modal dialog distandarisasi menggunakan kelas `btn-doodle`:
    - Border solid 2px hitam (`border-slate-900`)
    - Bayangan doodle datar khas (`shadow-[2px_2px_0px_#1E293B]`)
    - Sudut melengkung tegas (`rounded-md` atau `rounded-lg`)
    - Efek tekan realistis saat diklik (`active:translate-y-0.5 active:shadow-none`)
  - Menghilangkan tombol-tombol bergaya datar polos atau abu-abu standar yang sebelumnya tampak berbeda dari estetika doodle.

#### B. Indikator Status Cloud Sync di Navbar
- **Lokasi**: Di samping judul versi atau informasi kelas pada bilah navigasi utama.
- **Visual State**:
  - 🟢 **Hijau Berkedip Halus (Live Sync)**: Menandakan koneksi Supabase Realtime aktif dan seluruh data lokal telah identik dengan server cloud.
  - 🟡 **Kuning Denyut Cepat (Menyimpan...)**: Menandakan aplikasi sedang mengirim perubahan checklist atau transaksi ke server Supabase.
  - ⚪ **Abu-abu (Lokal/Offline)**: Menandakan mode offline ketika koneksi internet terputus atau API key belum disetel.

#### C. Filter Cepat Siswa Menunggak di Checklist Iuran
- Tab filter instan di atas tabel checklist iuran:
  - `[Semua Siswa]` (menampilkan seluruh siswa kelas).
  - `[Hanya Belum Lunas]` (secara dinamis menyaring hanya siswa yang memiliki tunggakan iuran pada bulan terpilih).
- Dilengkapi badge hitungan siswa menunggak secara real-time.

#### D. Desain Ekspor Binder Kas & Format Excel
- **Cetak / PDF Lembar Binder**:
  - Format kertas binder A4 dengan lubang binder di sisi kiri, aksen selotip doodle kuning di sudut kop, serta garis-garis buku kas klasik (notebook lines) berwarna biru lembut.
  - Tabel berisi Nomor, Nama Siswa, NIM, Status 4 Minggu, Total Bayar, dan kolom paraf tanda tangan bendahara.
- **Ekspor Excel / Spreadsheet**:
  - Format tabel bersih dengan header tebal berlatar warna amber lembut, pemisah ribuan Rupiah standar, dan kalkulasi otomatis total penerimaan.

#### E. WhatsApp Reminder Profesional
- **Hak Akses**: Tombol pengiriman pesan WhatsApp hanya dapat diakses dan ditekan oleh bendahara atau super admin.
- **Format Teks Baru**:
  ```text
  Yth. Orang Tua / Siswa [Nama Siswa]
  Laporan Kas [Nama Kelas] - [Bulan] [Tahun]

  • Saldo Kas Kelas: Rp [Total Saldo]
  • Iuran per Minggu: Rp [Nominal]
  • Status Iuran: Belum Lunas ([Jumlah Minggu] Minggu)
  • Total Tagihan: Rp [Nominal Tunggakan]

  Mohon dapat menyelesaikan iuran kas melalui Bendahara Kelas.
  Terima kasih atas kerja samanya.
  — Bendahara [Nama Kelas]
  ```

---

### 3. Key Product Decisions & Trade-Offs

- **Pemisahan Pengaturan Audio**:
  - *Keputusan*: Memindahkan toggle suara SFX ke menu Pengaturan di tab Pengaturan Kelas, dan menghilangkan tombol putar intro logo dari navbar.
  - *Alasan*: Bilah navigasi atas di smartphone harus bebas dari tombol dekoratif agar tidak bertumpuk dengan judul kelas dan tombol menu akun.
- **Penyimpanan Pemetaan Siswa ke Akun Google**:
  - *Keputusan*: Menambahkan properti `linkedMemberId` pada objek pengguna terdaftar di penyimpanan data dan tabel user management.
  - *Alasan*: Memungkinkan sistem mendeteksi secara otomatis apakah seorang pengguna yang login adalah siswa tertentu tanpa mengubah struktur dasar Supabase Auth.
- **Otorisasi Tombol Tagih WhatsApp**:
  - *Keputusan*: Menyembunyikan tombol WA jika akun yang login hanya bertindak sebagai anggota biasa (read-only).
  - *Alasan*: Menghindari siswa saling mengirimkan pesan tagihan palsu atau spam antar anggota kelas.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DoodleNavbar Component                          │
│  - Logo Kelas Gueh (Official SVG)                                      │
│  - Judul Kelas & Indikator Cloud Sync (🟢/🟡/⚪)                       │
│  - BGM Toggle (Sync SoundEngine)                                       │
│  - Akun Profile & Role Badge                                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        App Central State Router                        │
│  - Transactions State & Member Checklist State                         │
│  - Cloud Sync Status Listener (idle | syncing | synced)                │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌──────────────────┐    ┌────────────────────────┐   ┌───────────────────┐
│   KasBook View   │    │   KasChecklist View    │   │ KasSettings View  │
│  - Compact rows  │    │  - Filter [Belum Lunas]│   │ - User Whitelist  │
│  - Doodle button │    │  - Sticky Mobile Table │   │   & Member Binding│
│  - Binder Print  │    │  - WA (Bendahara only) │   │ - SFX Audio Toggle│
│  - Clean Excel   │    │  - Batch Upsert Guard  │   │ - Idempotent SQL  │
└──────────────────┘    └────────────────────────┘   └───────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  LocalKasRepository (Cloud-First)                      │
│  - Postgres RFC-4122 UUID Generator                                    │
│  - Realtime Broadcast & BroadcastChannel Sync                          │
│  - Single-query Batch Upsert & Supabase Storage Bucket                 │
└────────────────────────────────────────────────────────────────────────┘
```

#### Struktur Data Pengguna & Pemetaan Siswa:
```typescript
export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'bendahara' | 'anggota';
  linkedMemberId?: string; // ID siswa dari daftar tabel kas
  registeredAt: string;
}
```

#### State Indikator Cloud Realtime:
```typescript
export type CloudSyncState = 'synced' | 'syncing' | 'offline';
```
Indikator ini akan mengawasi siklus pemanggilan API Supabase: berubah menjadi `'syncing'` (kuning) saat mutasi data berlangsung, dan kembali ke `'synced'` (hijau) setelah batch query berhasil dieksekusi.
