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
  version: '3.13.3',
  codename: 'Zero Double-Counting & Cloud Sync Realtime Fix',
  releaseDate: '2026-10-24',
  changes: [
    'Zero Double-Counting Fix: Ringkasan kas dan total saldo kini dihitung murni dari Buku Kas (kas_transactions) tanpa penjumlahan ganda dari checklist iuran.',
    'Auto-Clear Cache on Version Update: Sistem otomatis membersihkan cache lokal lama saat pembaruan versi agar tidak ada data nyangkut.',
    'Google App Studio & Supabase Cloud Persistence: Sinkronisasi penuh antara checklist iuran, buku kas, dan database cloud.',
    'Google User Detection in Super Admin: Whitelist & pengaturan Super Admin menggabungkan user_profiles dan authorized_whitelist.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Monthly PDF Export',
      description: 'Ekspor laporan keuangan bulanan lengkap dengan grafik kas masuk dan keluar.'
    },
    {
      category: 'optimasi',
      title: 'Realtime Badge Counter',
      description: 'Indikator jumlah permohonan role baru yang belum disetujui di header Super Admin.'
    }
  ]
};
