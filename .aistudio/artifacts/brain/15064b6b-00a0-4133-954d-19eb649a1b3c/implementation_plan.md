# Kelas Gue v2.2.0: Realtime Live Sync, Supabase Storage, & Ekspor Binder PDF

Rencana implementasi penambahan 3 fitur tingkat lanjut (Supabase Realtime Broadcast, Supabase Storage Bucket `nota-kas`, dan Ekspor Laporan Kas PDF bergaya binder resmi dengan tanda tangan) serta perbaikan error Google OAuth 400 (*validation failed unsupported provider*) dengan panduan interaktif langsung di aplikasi.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan dan preferensi penting yang telah dikonfirmasi oleh pengguna:

- **Confirmed Decision 1 (Solusi Error 400 Google OAuth Supabase)**:
  - **Penyebab**: Error `400: validation failed: unsupported provider` terjadi karena di dashboard Supabase proyek `ireqpxgmlrsmcgidfthg`, toggle provider **Google** masih dalam keadaan nonaktif (*disabled*) dan belum diisi Google Client ID & Client Secret dari Google Cloud Console.
  - **Solusi**: Disediakan panduan interaktif step-by-step di modal aplikasi (dan di rangkuman) yang menjelaskan cara mengaktifkannya dalam 4 langkah mudah, lengkap dengan *Callback URL* yang harus di-copy ke Google Cloud Console.
  - **Penanganan Error Resilien**: Jika pengguna mengklik login Google saat provider belum aktif, aplikasi tidak akan macet/crash, melainkan menampilkan pop-up panduan aktivasi instan + opsi login langsung dengan email `mrachmanfm@gmail.com`.
- **Confirmed Decision 2 (Ekspor PDF Laporan Kas Binder)**:
  - Menggunakan format **Lembaran Binder Kertas Resmi**: Dilengkapi kop kelas resmi ("Kelas Gue"), periode semester, ringkasan saldo kas, tabel rincian transaksi debit/kredit, serta kolom tanda tangan basah untuk Bendahara Kelas dan Super Admin / Ketua Kelas.
  - Dapat langsung dicetak (*Print*) atau diunduh sebagai PDF dengan tata letak printer-friendly (A4 / F4).
- **Confirmed Decision 3 (Supabase Storage Bucket `nota-kas`)**:
  - Foto struk kuitansi yang diunggah bendahara akan dikompres secara otomatis (kualitas WebP/JPEG optimal) lalu di-upload langsung ke bucket `nota-kas` di Supabase Storage (`https://ireqpxgmlrsmcgidfthg.supabase.co/storage/v1/object/public/nota-kas/`).
  - Disediakan panduan instan jika bucket `nota-kas` belum di-*create* di dashboard Supabase (cukup 1-klik membuat bucket publik).
- **Confirmed Decision 4 (Supabase Realtime Broadcast `postgres_changes`)**:
  - Mengaktifkan WebSocket channel Supabase Realtime di `src/services/supabaseClient.ts` untuk mendengarkan mutasi data secara langsung.
  - Setiap kali ada transaksi kas baru atau centang iuran di satu perangkat, semua perangkat lain (HP bendahara, laptop siswa) langsung memperbarui tampilan tanpa perlu refresh halaman.

---

## 1. Overview & Core Concept

### What It Does
Pembaruan **Kelas Gue v2.2.0** membawa aplikasi kas kelas ini ke standar aplikasi cloud modern:
1. Data kas live-sync secara realtime multi-perangkat via Supabase Realtime.
2. Nota belanja kasir tidak lagi membebani local storage, melainkan tersimpan di cloud storage CDN Supabase Storage.
3. Transparansi kas dapat diunduh dan dicetak menjadi lembaran fisik resmi dengan tanda tangan bendahara untuk pertanggungjawaban ke dosen atau pihak kampus.

### Target Audience & Persona
- **Bendahara Kelas**: Memotret nota langsung dari kamera HP, nota otomatis terupload ke Supabase Storage, data kas langsung sinkron ke seluruh kelas tanpa jeda.
- **Super Admin (`mrachmanfm@gmail.com`)**: Mengontrol database cloud, mencetak dokumen laporan resmi untuk pertanggungjawaban kelas.
- **Anggota Kelas**: Melihat mutasi kas secara live saat rapat kelas berlangsung.

---

## 2. User Experience & Visual Design

### Alur Fitur Baru

```
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│  1. UPLOAD NOTA KE SUPABASE     │        │ 2. REALTIME LIVE BROADCAST       │
│  • Kompresi otomatis browser    │ ─────> │ • Supabase Channel Subscription  │
│  • Upload ke bucket "nota-kas"  │        │ • postgres_changes event         │
│  • Simpan CDN public URL        │        │ • Seluruh device update seketika │
└─────────────────────────────────┘        └──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. MODAL EKSPOR PDF BINDER RESMI                                            │
│ • Lembaran Binder A4: Kop Kelas Gue, Periode, Ringkasan Saldo               │
│ • Tabel Rincian Mutasi Pemasukan & Pengeluaran                              │
│ • Kolom Tanda Tangan: Bendahara Kelas & Super Admin / Ketua                 │
│ • Tombol Doodle: "Cetak / Simpan PDF" (Window Print Styling Khusus)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Visual & Document Layout
- **Lembaran Binder PDF**:
  - Header: Logo Doodle Coin, Nama Kelas ("Kelas Gue"), Periode Semester, Tanggal Cetak Dokumen.
  - Kotak Ringkasan Kas: Total Penerimaan, Total Pengeluaran, dan Saldo Akhir Kas.
  - Tabel Mutasi: Tanggal, Keterangan, Kategori, Debit (Masuk), Kredit (Keluar), dan Saldo Kumulatif.
  - Lembar Pengesahan: Dua kolom tanda tangan resmi ("Mengetahui, Ketua Kelas / Super Admin" dan "Dibuat Oleh, Bendahara Kelas").
  - CSS `@media print` terisolasi: Menyembunyikan navbar dan tombol UI saat mode print aktif sehingga hasil cetak bersih tanpa elemen navigasi website.

---

## 3. Step-by-Step Cara Mengatasi Error 400 Google OAuth di Supabase

Berikut adalah langkah-langkah konkret yang harus dilakukan di Dashboard Supabase untuk mengaktifkan login Google:

```
Langkah 1: Buka Dashboard Supabase (https://supabase.com/dashboard)
          Pilih proyek Anda: "ireqpxgmlrsmcgidfthg"

Langkah 2: Masuk ke menu "Authentication" di sidebar kiri -> Klik "Providers"
          Cari "Google" pada daftar provider.

Langkah 3: Buka tab Google dan centang "Enable Google provider".
          Di sana akan terlihat "Callback URL (for OAuth)":
          Contoh: https://ireqpxgmlrsmcgidfthg.supabase.co/auth/v1/callback
          (Salin / Copy URL Callback ini!)

Langkah 4: Buka Google Cloud Console (https://console.cloud.google.com/)
          -> Masuk ke "APIs & Services" -> "Credentials"
          -> Buat atau Edit "OAuth 2.0 Client IDs" (Web application)
          -> Pada bagian "Authorized redirect URIs", tempel (Paste) Callback URL dari Langkah 3 tadi.
          -> Simpan dan salin "Client ID" & "Client Secret".

Langkah 5: Kembali ke Supabase -> Masukkan Client ID & Client Secret -> Klik "Save".
```

*(Panduan interaktif bergambar juga akan disematkan di dalam modal aplikasi agar pengguna dapat melihatnya kapan saja tanpa perlu membuka catatan terpisah).*

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KELAS GUE v2.2.0 ARCHITECTURE                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐                 ┌─────────────────────────┐  │
│   │   Supabase Client   │ ──────────────> │ Supabase Realtime Chan  │  │
│   │ ireqpxgmlrsmcgidfthg│                 │ • kas_transactions     │  │
│   └──────────┬──────────┘                 │ • kas_members           │  │
│              │                            └───────────┬─────────────┘  │
│              │                                        │                │
│              ▼                                        ▼                │
│   ┌─────────────────────┐                 ┌─────────────────────────┐  │
│   │   Supabase Storage  │                 │    Live UI Re-render    │  │
│   │  Bucket: "nota-kas" │                 │  (Semua device synced)  │  │
│   └─────────────────────┘                 └─────────────────────────┘  │
│                                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    Printable Binder Export Engine               │  │
│   │  • Printable Binder Modal with Official Signatures              │  │
│   │  • @media print CSS optimization                                │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Execution Plan (Post-Approval)

1. **Supabase Realtime Implementation**:
   - Tambahkan fungsi `subscribeToRealtimeKas()` di `src/services/supabaseClient.ts` menggunakan channel `supabase.channel('public:kas_transactions')`.
   - Sinkronisasi state transaksi dan checklist secara reaktif saat ada event `INSERT`, `UPDATE`, atau `DELETE`.
2. **Supabase Storage Integration**:
   - Tambahkan fungsi `uploadReceiptToSupabase(file)` di `src/services/supabaseClient.ts` yang mengompresi gambar dan mengunggahnya ke bucket `nota-kas`.
   - Mengambil public URL file dari CDN Supabase untuk disimpan di `receiptUrl`.
3. **Modal Ekspor PDF Laporan Kas Binder**:
   - Buat komponen `src/components/Doodle/PrintableBinderModal.tsx`.
   - Tata letak resmi: Kop Kelas, Rekapitulasi Kas, Tabel Debit/Kredit, Lembar Tanda Tangan Bendahara & Super Admin.
   - Tambahkan tombol "Ekspor Dokumen PDF" di halaman Ringkasan Kas dan Buku Kas.
4. **Interactive Google Auth Setup Modal & Resilient Error Handling**:
   - Buat modal panduan `GoogleAuthGuideModal.tsx` yang menerangkan 5 langkah aktivasi Google OAuth di Supabase secara ramah.
   - Tangani error 400 provider secara anggun tanpa crash.
5. **App Version Bump**:
   - Naikkan versi di `src/version.ts` menjadi `v2.2.0` ("Realtime, Storage & Binder PDF Edition").
6. **Kompilasi & Verifikasi**:
   - Jalankan `lint_applet` dan `compile_applet` untuk menjamin 0 kesalahan kompilasi.
