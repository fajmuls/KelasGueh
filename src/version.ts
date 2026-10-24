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
  version: '3.11.0',
  codename: 'Auto-Role & Excel Power-Up',
  releaseDate: '2026-10-24',
  changes: [
    'Auto-Redirect Super Admin: Login otomatis mendeteksi email Ketua dan memberikan akses penuh.',
    'Excel Export System: Ditambahkan sistem laporan iuran dan kas dalam format .xlsx (Excel).',
    'Integrasi Vercel: Penyiapan konfigurasi untuk deployment cloud yang lebih lancar.',
    'Enhanced Auth Flow: Perbaikan pada pemetaan profil user saat pertama kali login menggunakan Google.',
    'PWA Update: Peningkatan performa aplikasi saat diinstal di perangkat mobile.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Send Email Report',
      description: 'Fitur untuk mengirim laporan Excel otomatis ke email setiap akhir bulan.'
    },
    {
      category: 'optimasi',
      title: 'Receipt Image Compression',
      description: 'Kompresi gambar nota yang lebih efisien untuk menghemat kuota storage Supabase.'
    },
    {
      category: 'keamanan',
      title: 'Action Confirmation',
      description: 'Pop-up konfirmasi saat ingin menghapus data transaksi yang sudah tersimpan.'
    }
  ]
};
