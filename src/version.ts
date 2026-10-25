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
  version: '3.19.1',
  codename: 'Audio Controls Consolidation',
  releaseDate: '2026-10-25',
  changes: [
    'Konsolidasi Kontrol Suara (SFX & BGM): Tombol sakelar Efek Suara (SFX) dipindahkan ke Menu Lainnya (Hamburger) berdampingan dalam tampilan 2-kolom bersama Musik Latar (BGM).',
    'Tur Panduan Interaktif (Walkthrough): Panduan interaktif berbasis cerita doodle untuk membantu pengguna baru memahami seluruh fitur aplikasi.',
    'Perbaikan Kontras Dark Mode: Pengoptimalan legibilitas teks dan kartu di mode Dark Jurnal Antik agar tidak tertumpuk.',
    'Pembersihan Akses Menu Anggota: Tombol Pengaturan Kelas disembunyikan khusus untuk akun Anggota biasa agar lebih rapi.'
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
