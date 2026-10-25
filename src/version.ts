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
  version: '3.13.6',
  codename: 'Doodle UI Enhancements & Audit Log Cleanup',
  releaseDate: '2026-10-24',
  changes: [
    'Clear Audit Log: Menambahkan fitur pembersihan catatan audit log untuk menjaga kebersihan database.',
    'Doodle UI/UX Dropdowns: Standardisasi tampilan menu dropdown agar lebih konsisten dengan gaya aplikasi.',
    'Bug Fix Whitelist: Memperbaiki masalah sinkronisasi role saat anggota dihubungkan ke akun pengguna.',
    'Supabase User Sync: Integrasi otomatis user login Google ke tabel user_profiles dan authorized_whitelist.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Bulk Member Import',
      description: 'Impor daftar anggota kelas secara massal dari file CSV.'
    },
    {
      category: 'keamanan',
      title: 'Activity Log Alerts',
      description: 'Notifikasi otomatis kepada Super Admin jika terjadi penghapusan transaksi besar.'
    }
  ]
};
