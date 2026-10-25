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
  version: '3.19.0',
  codename: 'Guided Experience & Dark Theme Polish',
  releaseDate: '2026-10-25',
  changes: [
    'Tur Panduan Interaktif (Walkthrough): Menambahkan tur panduan cerita berbasis ilustrasi doodle untuk membantu pengguna baru memahami fungsi menu utama.',
    'Opsi Ulangi Panduan: Tersedia tombol "Ulangi Tur Panduan App" di Menu Lainnya (Hamburger) agar dapat dibuka kembali sewaktu-waktu.',
    'Perbaikan Kontras Dark Mode: Mengoptimalkan kontras warna font dan kartu di mode Dark Jurnal Antik agar teks sangat legibel dan tidak tertumpuk.',
    'Penanganan Cloud Halus: Menyembunyikan pesan error fetch berlebih dan beralih ke Mode Lokal secara transparan tanpa mengganggu pengalaman pengguna.',
    'Pembersihan Akses Menu Anggota: Menyembunyikan tombol Pengaturan Kelas di menu burger untuk akun Anggota biasa agar lebih rapi.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto Reminder WhatsApp H-1 Tenggat Iuran via Scheduled Push',
      description: 'Pengiriman notifikasi otomatis H-1 tenggat iuran kas mingguan untuk siswa yang belum melunasi iuran.'
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
