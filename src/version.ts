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
  version: '3.17.0',
  codename: 'Role Simulation Fix & Single Location Navigation',
  releaseDate: '2026-10-25',
  changes: [
    'Mode Simulasi Akses Super Admin Fix: Super Admin dapat berganti simulasi peran secara langsung ke preview Bendahara dan preview Anggota tanpa ter-reset otomatis.',
    'Tombol Keluar Akun (Logout) Single-Location: Diatur eksklusif hanya ada di dalam dropdown Profil Akun Terhubung.',
    'Menu Lainnya & Pengaturan Semua Peran: Tombol Pengaturan dipindahkan ke menu Lainnya (Hamburger) dan kini tersedia untuk semua pengguna (Anggota, Bendahara, Super Admin).',
    'Pembersihan Tab Strip Navigasi: Tab navigasi utama dipersingkat (Ringkasan Kas, Buku Kas, Checklist, Laporan Audit) tanpa duplikasi tombol Pengaturan.',
    'Fitur Hapus Data Lokal: Menambahkan tombol "Hapus Data Lokal" pada Pengaturan untuk membersihkan cache browser dengan aman.',
    'Font Versi Minimalis: Ukuran font teks nomor versi pada menu Lainnya diperkecil (text-[9px] font-mono) agar tampilan lebih bersih dan estetik.'
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
      title: 'Dark Mode / Sepia Antique Paper Mode',
      description: 'Mode tema kertas sepia/krem tua bergaya buku jurnal antik untuk kenyamanan penggunaan malam hari.'
    },
    {
      category: 'keamanan',
      title: 'Pencatatan Audit Trail Akses & Backup Otomatis',
      description: 'Riwayat aktivitas pencatatan transaksi kelas terenkripsi untuk transparansi penuh.'
    }
  ]
};
