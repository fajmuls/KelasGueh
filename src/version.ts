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
  version: '4.3.0',
  codename: 'Doodle UI Total & Dedicated Admin Settings Tab',
  releaseDate: '2026-10-26',
  changes: [
    'Tab View Dedicated Pengaturan Admin: Memindahkan Pengaturan Admin dari modal pop-up ke Tab View utama khusus dengan 6 sub-navigasi doodle (Whitelist Roll, Manajemen Siswa, Audit Log, PIN, Cache, & Catatan Versi).',
    'Dropdown Auto-Complete Siswa & NIM: Sistem pencarian otomatis berbasis nama dan NIM pada menu Whitelist Roll untuk memudahkan penetapan role pengguna.',
    'Isolasi Manajemen Siswa ke Master Admin: Fitur Tambah & Import Siswa kini dikhususkan pada Tab Pengaturan Admin, menjaga fokus Pengaturan Kas pada iuran dan semester.',
    'Standardisasi Format Nama Title Case: Memastikan seluruh penulisan nama mahasiswa di Presensi, Keaktifan, Notulensi, Inventaris, dan Kelompok berformat Title Case rapi (contoh: "Ahmad Budi Pratama").',
    'Reset Data Inisialisasi Clean Slate: Mengosongkan data awal untuk Inventaris Barang, Jadwal & Tugas, serta Poin Keaktifan agar siap digunakan dari keadaan bersih.',
    'Penyelarasan Total Estetika Doodle: Penyegaran gaya visual doodle hand-drawn (border hitam tebal, bayangan offset, stempel, & aksen selotip) pada seluruh elemen UI termasuk Pembagian Kelompok.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Sync Presensi dengan Poin Keaktifan',
      description: 'Fitur otomatisasi yang memberikan bonus poin keaktifan secara langsung setiap kali mahasiswa hadir dalam presensi kelas.'
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


