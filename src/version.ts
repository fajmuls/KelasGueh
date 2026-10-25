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
  version: '3.13.4',
  codename: 'Kas Book Transaction Persistence Fix',
  releaseDate: '2026-10-24',
  changes: [
    'Kas Book Transaction Saving Fix: Memperbaiki fungsi penyimpanan transaksi kas (debit/kredit) agar langsung masuk ke tabel kas_transactions database Supabase dan Buku Kas.',
    'Zero Double-Counting Fix: Ringkasan kas dan total saldo dihitung murni dari Buku Kas tanpa duplikasi.',
    'Auto-Clear Cache on Version Update: Sistem otomatis membersihkan cache lokal lama saat pembaruan versi agar data tidak nyangkut.',
    'Google User Detection in Super Admin: Whitelist & pengaturan Super Admin menggabungkan user_profiles dan authorized_whitelist.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Monthly PDF Export & Receipt Printing',
      description: 'Ekspor laporan keuangan bulanan lengkap dengan cetak kuitansi otomatis.'
    },
    {
      category: 'optimasi',
      title: 'Transaction Audit Trail Badge',
      description: 'Indikator aktivitas pencatatan transaksi kas secara real-time di dashboard Super Admin.'
    }
  ]
};
