export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  changes: string[];
  suggestedUpdates: {
    category: 'fitur' | 'optimasi' | 'keamanan';
    title: string;
    description: string;
  }[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '3.0.0',
  codename: 'Realtime Multi-User Audit Logs, 6-Digit PIN Security & Google Sheets Sync Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Aktivitas Log Realtime Multi-User: Pencatatan riwayat otomatis setiap kali Bendahara atau Admin mencatat pengeluaran, mencentang iuran, atau merubah status dengan penanda waktu & nama pengubah.',
    'Autentikasi PIN 6-Digit SHA-256 Tambahan: Verifikasi PIN modal keamanan wajib untuk pengeluaran kas bernilai besar di atas Rp 500.000 (PIN Default: 123456).',
    'Ekspor Rekap Kas ke Google Sheets: Fitur ekspor CSV terstruktur lengkap dengan panduan link impor otomatis ke lembar kerja Google Sheets.',
    'Pembersihan Total Residual Firebase: Aplikasi kini 100% tersambung ke Supabase Cloud Postgres & Realtime Broadcast tanpa beban dependensi Firebase.',
    'Dropdown Topbar Overlay Fix: Menu profil & role switcher melayang rapi di atas konten tanpa pergeseran layout topbar.',
    'Super Admin Role Preview Switcher: Super Admin dapat menguji tampilan sebagai Bendahara atau Anggota (Read-Only) kapan saja.',
    'Panduan Step-by-Step Supabase SQL Editor: Dokumentasi panduan lengkap pemasangan tabel SQL & RLS di dalam aplikasi.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Notifikasi Otomatis PWA Push Notification',
      description: 'Pengiriman notifikasi otomatis langsung ke ponsel siswa saat mendekati tenggat iuran kas kelas mingguan.'
    },
    {
      category: 'optimasi',
      title: 'Auto Sync Background Worker Supabase',
      description: 'Sinkronisasi kas offline-first ke Supabase secara otomatis saat koneksi internet kembali pulih.'
    },
    {
      category: 'keamanan',
      title: 'Enkripsi Multi-Factor Authentication (MFA)',
      description: 'Otentikasi dua langkah (2FA/MFA) khusus untuk peran Super Admin pemilik saat mengakses dashboard keuangan.'
    },
    {
      category: 'fitur',
      title: 'Multi-Kelas / Multi-Jurusan Dashboard',
      description: 'Pengelolaan kas paralel untuk beberapa angkatan atau jurusan sekaligus dalam satu akun.'
    }
  ]
};


