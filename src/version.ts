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
  version: '2.4.0',
  codename: 'Binder Print Fix, Kamera OCR & Excel Import Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Perbaikan Bug Pratinjau Lembaran Binder: Modal lembaran binder laporan kas kini tersembunyi dengan benar saat awal muat aplikasi, tombol "X" berfungsi normal, dan mendukung penutupan via tombol Escape atau klik backdrop.',
    'Pemisahan Fungsi Cetak & Simpan PDF: Tombol "Cetak" untuk printer fisik dan "Simpan PDF" dengan penamaan file otomatis (Laporan_Kas_[Kelas]_[Tanggal].pdf) serta styling kertas A4 bersih tanpa elemen UI.',
    'Import Daftar Siswa dari File Excel / CSV (1-Klik): Memudahkan bendahara memasukkan puluhan nama siswa & NIM sekaligus dari file .xlsx/.xls/.csv atau paste teks, lengkap dengan template CSV.',
    'Pindai Nota dengan Kamera HP (OCR Pembaca Nominal Otomatis): Kamera HP bendahara langsung memindai total rupiah pada struk belanja via Tesseract OCR engine dan mengisi form nominal transaksi secara otomatis.',
    'Pengingat Otomatis Tunggakan Kas via WhatsApp: Tombol WA personal dan massal dengan format pesan sopan yang memuat detail nama siswa, minggu belum bayar, dan total rupiah tunggakan.',
    'Script Generator Row Level Security (RLS) Supabase di Tab Pengaturan: Tombol 1-klik untuk menyalin query SQL pengamanan database Postgres Supabase agar hak tulis hanya dimiliki Bendahara & Super Admin (mrachmanfm@gmail.com).'
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
