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
  version: '4.3.2',
  codename: 'Kas Module Polish & Aesthetic Refinement',
  releaseDate: '2026-10-26',
  changes: [
    'Kas Module Polish: Optimalisasi seluruh komponen Buku Kas, Ringkasan, dan Checklist Iuran dengan standardisasi rounded-xl dan border doodle.',
    'Penyelarasan SFX: Menambahkan feedback suara unik untuk seluruh interaksi di modul administrasi kas (Buku Kas, Nota, Checklist).',
    'Standardisasi Kontainer: Mengganti rounded-2xl yang tersisa menjadi rounded-xl agar konsisten dengan desain doodle yang lebih pas.',
    'Penyempurnaan Table Header: Memberikan styling doodle yang lebih tegas pada header tabel Buku Kas dan Matriks Iuran.',
    'Doodle Select Integration: Memastikan seluruh dropdown menggunakan komponen DoodleSelect untuk konsistensi visual.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Sync Presensi dengan Poin Keaktifan',
      description: 'Fitur otomatisasi yang memberikan bonus poin keaktifan secara langsung setiap kali siswa hadir dalam presensi kelas.'
    },
    {
      category: 'optimasi',
      title: 'Eksportasi Laporan PDF/Excel Lintas Modul',
      description: 'Ekspor terpadu untuk laporan gabungan kas, presensi, keaktifan, dan inventaris barang dalam satu berkas PDF berdesain doodle.'
    },
    {
      category: 'keamanan',
      title: 'Restriksi IP & Sesi Login Admin Berdurasi',
      description: 'Pembatasan durasi aktif sesi Admin dan opsi penguncian otomatis saat tidak ada aktivitas selama 15 menit.'
    }
  ]
};


