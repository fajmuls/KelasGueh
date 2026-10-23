# Rencana Implementasi: Sistem Audit Log Supabase, Keamanan PIN Transaksi, Ekspor Google Sheets & Super Admin Role Preview

Rencana ini mencakup pembersihan total residu Firebase, penguatan koneksi Supabase Postgres & Realtime, sistem Audit Log lengkap, verifikasi PIN 6-digit terenkripsi hash untuk transaksi > Rp 500.000, serta panduan manual *step-by-step* Supabase SQL untuk pengguna.

---

## 1. Tujuan Utama Perubahan

1. **Pembersihan Total Firebase & Penghapusan Residu**:
   - Menghapus ketergantungan Firebase/Firestore yang membingungkan.
   - Mengarahkan seluruh transaksi, status iuran, dan riwayat aktivitas 100% ke **Supabase Postgres & Realtime Broadcast**.

2. **Sistem Audit Log Multi-User Realtime (Tabel Supabase & Tab Khusus)**:
   - Membuat tabel `audit_logs` di Supabase untuk mencatat setiap aktivitas (pencatatan transaksi, penghapusan, pencentangan iuran, perubahan pengaturan).
   - Menyediakan tab **Laporan Audit Log** khusus bagi Super Admin untuk memantau siapa, kapan, dan apa yang diubah.

3. **Verifikasi Keamanan PIN 6-Digit (Hash Terenkripsi)**:
   - Mengimplementasikan verifikasi PIN 6-digit terenkripsi hash (SHA-256) khusus untuk pengeluaran kas bernilai tinggi di atas Rp 500.000.
   - Memasukkan modal konfirmasi PIN sebelum transaksi disimpan.

4. **Super Admin Role Preview Switcher**:
   - Memberikan fitur bagi Super Admin untuk mensimulasikan/mempratinjau tampilan aplikasi sebagai **Super Admin**, **Bendahara**, atau **Anggota (Read-Only)** secara instan.

5. **Ekspor Laporan Kas ke Google Sheets**:
   - Menyediakan fitur ekspor CSV terstruktur yang dioptimalkan untuk diimpor langsung ke Google Sheets.

6. **Panduan Manual Step-by-Step Supabase SQL di Chat & Tab Pengaturan**:
   - Menyediakan petunjuk langkah demi langkah yang sangat detail bagi pemula untuk menjalankan query SQL pembuat tabel (`kas_transactions`, `kas_members`, `audit_logs`) dan kebijakan RLS di Supabase Dashboard.

---

## 2. Arsitektur & Perubahan Komponen

### A. Utilitas Keamanan & Hashing (`src/utils/security.ts`)
- Fungsi enkripsi SHA-256 bawaan Browser Web Crypto API untuk menyimpan dan memverifikasi hash PIN 6-digit tanpa menyimpan teks polos (*plain text*).

### B. Penguatan Service Supabase (`src/services/supabaseClient.ts`)
- Fungsi pencatatan otomatis `logAuditEvent(action, details, performedBy, userRole)`.
- Langganan Realtime Broadcast Supabase untuk memperbarui tabel mutasi kas, checklist iuran, dan audit log secara simultan di semua perangkat.

### C. Komponen Laporan Audit Log (`src/components/Doodle/KasAuditLog.tsx`)
- Tampilan tabel linier bergaya *notebook paper doodle* khusus Super Admin.
- Pencarian dan filter aksi audit (Tambah Transaksi, Hapus, Checklist Iuran, Ganti Role).

### D. Modal Verifikasi PIN 6-Digit (`src/components/Doodle/PinVerificationModal.tsx`)
- Modal khusus yang otomatis muncul saat nominal pengeluaran kas >= Rp 500.000.

### E. Super Admin Role Preview di Topbar (`src/components/Doodle/DoodleNavbar.tsx`)
- Dropdown khusus Super Admin untuk dengan mudah beralih mode pratinjau (*Preview Mode*) antara Super Admin, Bendahara, dan Anggota.

### F. Panduan Lengkap Supabase SQL di Tab Pengaturan (`src/components/Doodle/KasSettings.tsx`)
- Penambahan generator script SQL lengkap untuk pembuatan tabel `kas_transactions`, `kas_members`, `audit_logs`, dan kebijakan RLS.

---

## 3. Langkah Verifikasi Build

1. Menjalankan `lint_applet` untuk memastikan tidak ada kesalahan sintaks TypeScript.
2. Menjalankan `compile_applet` untuk memverifikasi aplikasi berhasil terkompilasi tanpa *error*.
