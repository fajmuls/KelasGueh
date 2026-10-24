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
  version: '3.7.6',
  codename: 'Database Schema Self-Healing & Singleton Auth Edition',
  releaseDate: '2026-10-24',
  changes: [
    'Self-Healing Schema Database: Skrip SQL Supabase kini dilengkapi perintah "ALTER TABLE" otomatis untuk memastikan kolom "academic_year" dan "site_url" tersedia tanpa menghapus data lama.',
    'Penyempurnaan Auth Singleton: Memperbaiki peringatan "Multiple GoTrueClient instances" untuk stabilitas sesi login Google yang lebih baik.',
    'Validasi Sinkronisasi Ketat: Fitur "Paksa Upload" kini mendeteksi kegagalan spesifik per tabel dan memberikan instruksi perbaikan yang jelas jika struktur database belum sesuai.',
    'Pembaruan Tahun Akademik Default: Mengatur tahun akademik default ke 2026/2027 pada skrip database baru.',
    'Peningkatan UI Feedback: Menampilkan status sinkronisasi yang lebih akurat dan informatif saat proses upload data ke cloud.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Reconcile Iuran dengan Catatan Pemasukan',
      description: 'Fitur otomatisasi yang mencatat transaksi pemasukan kas setiap kali bendahara mencentang iuran siswa.'
    },
    {
      category: 'optimasi',
      title: 'Dukungan Foto Nota Berbasis Kamera HP',
      description: 'Optimasi kompresi gambar langsung dari kamera smartphone untuk bukti struk yang lebih tajam namun hemat storage.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Rollback Transaksi',
      description: 'Kemampuan Super Admin untuk melakukan undo/rollback transaksi langsung dari tabel Audit Log.'
    }
  ]
};
