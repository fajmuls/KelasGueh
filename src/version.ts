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
  version: '2.7.0',
  codename: 'Dropdown Overlay Fix, Super Admin User Role Management & SVG Favicon Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Perbaikan Dropdown Topbar (No Horizontal Scroll): Menu profile & role kini melayang dengan z-index tinggi di atas konten tanpa menyebabkan pergeseran top bar.',
    'Manajemen Role Akun Google oleh Super Admin: Akun Google baru otomatis berstatus Anggota. Super Admin berhak mengelola dan memberikan wewenang Bendahara di tab Pengaturan.',
    'Pembaruan Logo Favicon Tab Chrome: Tab browser Chrome kini menampilkan logo resmi vektor SVG Kelas Gue secara sempurna.',
    'Verifikasi Login Iframe AI Studio (Bypass Error 403): Kemudahan login langsung yang stabil dalam lingkungan preview Google AI Studio.',
    'Pembersihan Keterangan Email Privat: Menghapus penyebutan email privat Super Admin dari tampilan awal login demi kerahasiaan pemilik.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Aktivitas Log Realtime Multi-User',
      description: 'Pencatatan riwayat setiap kali bendahara mencatat pengeluaran atau mencentang iuran dengan penanda nama & jam.'
    },
    {
      category: 'optimasi',
      title: 'Ekspor Otomatis Rekap Kas ke Google Sheets',
      description: 'Fitur sinkronisasi otomatis seluruh laporan kas ke lembar kerja Google Sheets secara berkala.'
    },
    {
      category: 'keamanan',
      title: 'Autentikasi PIN 6-Digit Tambahan untuk Transaksi Besar',
      description: 'Konfirmasi PIN keamanan tambahan khusus untuk transaksi pengeluaran kas di atas Rp 500.000.'
    },
    {
      category: 'fitur',
      title: 'Pengingat Otomatis Push Notification PWA',
      description: 'Notifikasi otomatis langsung ke ponsel siswa saat mendekati jadwal pembayaran iuran mingguan.'
    }
  ]
};


