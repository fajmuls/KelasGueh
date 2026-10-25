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
  version: '3.13.7',
  codename: 'Doodle UI Enhancements & Bug Fixes',
  releaseDate: '2026-10-24',
  changes: [
    'Whitelist Bug Fix: Memperbaiki masalah sinkronisasi user dalam pengaturan whitelist bendahara.',
    'UI Improvement: Standardisasi tampilan dropdown dengan gaya doodle yang lebih konsisten.',
    'Clear Audit Log: Fitur pembersihan catatan audit log.',
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
