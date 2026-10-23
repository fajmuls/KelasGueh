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
  version: '3.1.0',
  codename: 'bcryptjs Security, Monthly Checklist & Zero-Overflow Layout Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Enkripsi bcryptjs PIN Transaksi: PIN keamanan kini dienkripsi menggunakan standar industri bcryptjs (Salt: 10) untuk proteksi maksimal.',
    'Checklist Iuran Bulanan: Tampilan checklist kini berbasis Bulan (Jan-Des) dengan 4 minggu per bulan dan rentang tanggal spesifik.',
    'Perbaikan Bug Atribusi Audit Log: Aksi Super Admin kini dicatat dengan identitas asli Super Admin (bukan lagi default "Bendahara").',
    'Layout Zero-Horizontal-Overflow: Optimasi CSS untuk memastikan aplikasi tidak pernah meluap ke samping (no horizontal scroll) di HP maupun Desktop.',
    'Verifikasi Koneksi Supabase Real-Table: Tombol tes koneksi kini memverifikasi keberadaan tabel fisik di database Anda.',
    'Integrasi bcrypt pada Modal PIN: Proses verifikasi PIN 6-digit kini berjalan lebih cepat dan sinkron dengan bcrypt.',
    'Pembersihan Residual Kode Firestore: Memastikan seluruh logika 100% cloud-native Supabase.'
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
      title: 'Dashboard Grafik Statistik Lanjutan',
      description: 'Visualisasi grafik garis dan batang untuk tren pemasukan vs pengeluaran bulanan yang lebih detail.'
    }
  ]
};


