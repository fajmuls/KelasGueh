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
  version: '3.13.2',
  codename: 'Cloud Finance & Whitelist Fix',
  releaseDate: '2026-10-24',
  changes: [
    'Supabase Transaction Persistence: Transaksi non-iuran (pemasukan/pengeluaran manual) kini terhubung langsung ke tabel Supabase dan otomatis memperbarui ringkasan kas.',
    'Google User Detection in Super Admin: Panel Whitelist & Pengaturan Super Admin sekarang menggabungkan user_profiles dan authorized_whitelist sehingga seluruh pengguna yang login dengan Google terdeteksi.',
    'Unified Database Sync: Penyelarasan penuh antara ApiService dan LocalKasRepository untuk memastikan tidak ada data transaksi yang tersimpan secara lokal semata.',
    'Auth Resilience & Stale Session Cleared: Peningkatan stabilitas sesi login dan pembersihan otomatis cache lama.'
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
