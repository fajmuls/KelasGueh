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
  version: '3.18.0',
  codename: 'Sepia Paper & Antique Dark Mode',
  releaseDate: '2026-10-25',
  changes: [
    'Dukungan Multi-Tema Visual: Kini tersedia 3 pilihan tema untuk kenyamanan mata (Kertas Terang, Kertas Sepia, dan Dark Jurnal Antik).',
    'Theme Switcher Quick Access: Pengubah tema dapat diakses dengan cepat melalui "Menu Lainnya" (Hamburger) untuk semua pengguna.',
    'Peningkatan Kontras Malam Hari: Mode Dark Jurnal Antik dirancang khusus untuk mengurangi kelelahan mata bendahara saat mencatat kas di malam hari.',
    'Konsistensi Cetak PDF: Dokumen PDF laporan kas tetap dipertahankan putih bersih (High Contrast) agar rapi dan hemat tinta saat dicetak fisik.',
    'Sistem Transisi Halus: Perpindahan antar tema kini memiliki animasi transisi warna yang lembut dan nyaman.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto Reminder WhatsApp H-1 Tenggat Iuran via Scheduled Push',
      description: 'Pengiriman notifikasi otomatis H-1 tenggat iuran kas mingguan untuk siswa yang belum melunasi iuran.'
    },
    {
      category: 'fitur',
      title: 'Export PDF Laporan Bertanda Tangan & Doodle Stamp',
      description: 'Stempel digital doodle kelas & kode QR verifikasi keabsahan dokumen PDF kas kelas.'
    },
    {
      category: 'optimasi',
      title: 'Virtual Scrolling Tabel Checklist Iuran',
      description: 'Optimasi performa scroll pada daftar siswa yang sangat panjang agar tetap responsif dan ringan.'
    },
    {
      category: 'keamanan',
      title: 'Pencatatan Audit Trail Akses & Backup Otomatis',
      description: 'Riwayat aktivitas pencatatan transaksi kelas terenkripsi untuk transparansi penuh.'
    }
  ]
};
