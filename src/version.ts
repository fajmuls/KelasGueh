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
  version: '2.6.0',
  codename: 'Google OAuth Mandatory, Strict Anggota Read-Only & Supabase Refactoring',
  releaseDate: '2026-10-23',
  changes: [
    'Integrasi Wajib Google Login Supabase: Super Admin (mrachmanfm@gmail.com) dan Bendahara wajib melakukan login via Google OAuth Supabase.',
    'Isolasi Akses Anggota Kelas (Read-Only): Anggota masuk langsung sebagai tamu tanpa tab Pengaturan, tanpa tombol pesan/pengingat WhatsApp, dan tanpa hak edit.',
    'Pemutakhiran Redirect OAuth Supabase: Eliminasi timeout buatan pada proses login Google OAuth untuk transisi redirect browser yang lancar.',
    'Restriksi Modul & Navigasi Mobile: Penyesuaian menu lipat topbar responsif dan proteksi penuh seluruh modal WhatsApp & pengaturan khusus Bendahara/Admin.',
    'Versi Aplikasi & Saran Pengembangan Terstruktur: Pembaruan versi v2.6.0 serta daftar rekomendasi update otomatis di tab Pengaturan.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Notifikasi Web Push / PWA Pengingat Iuran',
      description: 'Pengiriman notifikasi otomatis langsung ke perangkat HP siswa saat mendekati jadwal pembayaran iuran kas kelas.'
    },
    {
      category: 'optimasi',
      title: 'Sinkronisasi Otomatis Google Sheets Laporan Kas',
      description: 'Ekspor dan rekonsiliasi data mutasi kas secara real-time ke lembar Google Sheets kelas saat transaksi diselesaikan.'
    },
    {
      category: 'keamanan',
      title: 'Multi-Akun Bendahara & Audit Log Aktivitas',
      description: 'Pencatatan riwayat setiap aktivitas perbaikan data kas beserta identitas email Google bendahara yang bertindak.'
    },
    {
      category: 'fitur',
      title: 'Visualisasi Grafis Arus Kas Bulanan',
      description: 'Diagram batang interaktif untuk membandingkan total tren pemasukan vs pengeluaran kas kelas per semester.'
    }
  ]
};

