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
  version: '4.1.0',
  codename: 'Laporan Akhir Semester Terpadu & Modul Inventaris-Akademik',
  releaseDate: '2026-10-26',
  changes: [
    'Laporan Akhir Semester Terpadu (PDF & Visual): Modal pratinjau resmi yang menggabungkan neraca keuangan kas semester dan rekapitulasi poin keaktifan serta kehadiran siswa, siap cetak/ekspor PDF dengan lembar KOP kelas dan kolom 4 tanda tangan resmi.',
    'Harmonisasi Navigasi Hub: Top bar disederhanakan dengan tombol 🏠 Hub tunggal, dan ranah Bendahara kini memiliki sub-navigasi baris yang sejajar dan presisi seperti ranah Sekretaris.',
    'Ceklis Iuran Anti-Spam & Loading UX: Animasi putaran loading interaktif saat bendahara menekan tombol Centang Semua untuk menjamin perhitungan saldo tuntas, disertai chime sukses unik dan proteksi cooldown klik cepat manual.',
    'Pemisahan Tab Iuran Khusus & Kolektif: Kategori ditata terpisah menjadi Tab Tagihan Acara Bersama dan Tab Patungan Belanja, serta perbaikan tombol Split Bill agar tidak pernah keluar frame.',
    'Modul Inventaris Kelas: Pencatatan aset barang kelas dengan jumlah, kondisi (Baik/Rusak), lokasi simpan, dan indikator pengadaan dari kas kelas.',
    'Modul Jadwal & Tugas Kuliah: Pengelolaan mata kuliah, nama dosen/guru, SKS, jadwal hari/jam, dan daftar tugas deadline yang otomatis terhubung ke filter Poin Keaktifan dan Presensi.',
    'Audio Concurrency & Pembersihan Bug Ikon: Suara lama otomatis fade-out saat suara baru berbunyi, serta pembersihan dekorasi pin yang menimpa teks pada kartu dan banner.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Scan QRIS Dinamis Khusus Tagihan Acara',
      description: 'Menampilkan barcode QRIS interaktif langsung pada modal tagihan acara agar mahasiswa cukup scan dari layar ponsel untuk membayar iuran kolektif.'
    },
    {
      category: 'optimasi',
      title: 'Backup & Restore Database Format JSON Terenkripsi',
      description: 'Fitur unduh cadangan satu file lengkap berisi seluruh buku kas, presensi, notulensi, dan inventaris untuk antisipasi saat pembersihan cache browser.'
    },
    {
      category: 'fitur',
      title: 'Peringatan Otomatis Deadline Tugas via Web Notification',
      description: 'Notifikasi browser otomatis H-1 sebelum deadline tugas kuliah yang tercatat pada modul Jadwal & Tugas berakhir.'
    }
  ]
};

