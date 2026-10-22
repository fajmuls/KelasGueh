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
  version: '2.5.0',
  codename: 'Full Supabase Cloud, Responsive Mobile & Autoplay BGM Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Integrasi Penuh Supabase Cloud: Koneksi database Postgres & Realtime Broadcast aktif secara default (ireqpxgmlrsmcgidfthg.supabase.co) dengan dukungan generator RLS SQL di tab Pengaturan.',
    'Overhaul Responsif Navigasi Topbar Mobile: Topbar kini memiliki menu lipat (collapsible drawer) dan wrapping tombol fleksibel sehingga tidak pernah keluar atau terpotong ke kanan pada layar HP.',
    'Pemutaran Otomatis Musik BGM Latar: Musik BGM santai otomatis memutar pada gestur/ketukan pertama pengguna di layar sesuai kebijakan Web Audio API.',
    'Pembaruan Branding Logo Vektor SVG: Penggunaan logo vektor "Kelas Gue" terbaru di seluruh header, layar pembuka, dan laporan binder.',
    'Pindai Nota Kamera HP (OCR Pembaca Nominal): Kamera HP mendeteksi total rupiah struk dan auto-fill nominal transaksi.',
    'Import Daftar Siswa Excel/CSV (1-Klik) & Pengingat WA Tunggakan: Kemudahan mengimpor puluhan nama siswa masal dan mengirim pesan WA pengingat iuran kas.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Grafik Visualisasi Arus Kas & Tren Bulanan',
      description: 'Grafik batang dan garis interaktif untuk melihat perbandingan pemasukan vs pengeluaran kas kelas setiap bulan.'
    },
    {
      category: 'optimasi',
      title: 'Backup & Restore Data JSON Offline (1-Klik)',
      description: 'Fitur ekspor seluruh data transaksi dan anggota ke file JSON untuk pengarsipan atau pemulihan cadangan data offline.'
    },
    {
      category: 'fitur',
      title: 'Manajemen Kategori Pengeluaran Kustom',
      description: 'Fleksibilitas bagi bendahara untuk menambahkan atau mengedit label kategori pengeluaran kas kelas sendiri.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Perubahan Data Transaksi Kas',
      description: 'Pencatatan riwayat setiap kali ada penambahan, pencentangan iuran, atau penghapusan transaksi beserta waktu dan nama pengubah.'
    }
  ]
};
