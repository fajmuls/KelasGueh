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
  version: '3.7.4',
  codename: 'Cloud-First Authority & OAuth Troubleshooting Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Arsitektur Cloud-First (Source of Truth): Repositori aplikasi kini diprioritaskan sepenuhnya pada database Supabase Cloud. LocalStorage hanya digunakan sebagai cache sementara & buffer respons instan UI. Data antar-HP dipastikan sinkron lebih akurat.',
    'Penanganan Error 403 Google Login: Menambahkan panduan solusi error 403 (access_denied) pada tab Pengaturan untuk Bendahara agar dapat menambahkan Redirect URI yang tepat di Google Cloud Console.',
    'Auto-Resync Transaksi Tertunda: Jika penulisan ke Supabase sempat gagal (offline/RLS block), aplikasi akan mencoba mengunggah ulang data tersebut secara otomatis setiap kali daftar transaksi dimuat ulang.',
    'Peningkatan Stabilitas Realtime: Optimalisasi listener realtime untuk mencegah duplikasi data saat sinkronisasi data dari berbagai perangkat secara bersamaan.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Reconcile Iuran dengan Catatan Pemasukan',
      description: 'Fitur otomatisasi yang mencatat transaksi pemasukan kas setiap kali bendahara mencentang iuran siswa.'
    },
    {
      category: 'optimasi',
      title: 'Kuitansi Digital PDF Per-Siswa',
      description: 'Fitur cetak atau kirim PDF bukti bayar individual per-siswa.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Rollback Transaksi',
      description: 'Kemampuan Super Admin untuk melakukan undo/rollback transaksi langsung dari tabel Audit Log.'
    }
  ]
};
