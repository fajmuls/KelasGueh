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
  version: '3.13.5',
  codename: 'Supabase User Sync & SQL Schema Integration',
  releaseDate: '2026-10-24',
  changes: [
    'Supabase User Profile Sync: Integrasi otomatis user login Google ke tabel user_profiles dan authorized_whitelist agar terdeteksi di panel Super Admin.',
    'Kas Book Transaction Persistence Fix: Memperbaiki fungsi penyimpanan transaksi kas ke database Supabase.',
    'Zero Double-Counting Fix: Ringkasan kas dan total saldo dihitung murni dari Buku Kas tanpa duplikasi.',
    'Auto-Clear Cache on Version Update: Sistem otomatis membersihkan cache lokal lama saat pembaruan versi agar data tidak nyangkut.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Automatic Role Request Notification',
      description: 'Notifikasi email otomatis saat ada user baru yang login dan meminta akses bendahara.'
    },
    {
      category: 'keamanan',
      title: 'Row Level Security (RLS) Policy Audit',
      description: 'Pemeriksaan berkala kebijakan akses database Supabase untuk keamanan data kas kelas.'
    }
  ]
};
