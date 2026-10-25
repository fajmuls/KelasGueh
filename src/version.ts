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
  version: '3.16.0',
  codename: 'Checklist Clean Look & Verified Digital Stamp PDF',
  releaseDate: '2026-10-25',
  changes: [
    'Checklist Clean Look: Menghapus tombol aksi berat (Tambah & Import Siswa) dari atas Checklist Iuran agar tampilan bersih murni untuk pemantauan iuran.',
    'Pindahan Manajemen Siswa: Fungsi Tambah Siswa Baru & Import Siswa (Excel/CSV) dipindahkan ke seksi dedicated pada menu Pengaturan Kelas.',
    'Auto Title Case Nama Siswa: Seluruh penulisan nama siswa otomatis diformat Title Case (misal: "M Rachman Fajri M") dengan penulisan font yang rapi & dibersihkan.',
    'Profile & Logout Dropdown Header: Mengonsolidasikan akun aktif di header dengan menu popover berisi info akun, status peran, tombol Pengaturan, dan tombol Keluar (Logout).',
    'Pembersihan UI Buku Kas: Menghilangkan badge "Mode Lihat Saja" yang tidak diperlukan agar tampilan buku kas lebih bersih.',
    'Stempel Digital Doodle & QR Verification PDF: Menambahkan stempel visual "Verifikasi Cloud Sah & Audit" serta Kode QR Verifikasi unik pada dokumen cetak PDF Binder.',
    'Update Pengesahan Cetak PDF: Memperbarui nama Super Admin di kolom tanda tangan dokumen cetak menjadi "M Rachman Fajri M".'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto Reminder WhatsApp H-1 Tenggat Iuran via Scheduled Push',
      description: 'Fitur pengiriman notifikasi otomatis H-1 tenggat iuran kas mingguan untuk siswa yang belum melunasi iuran.'
    },
    {
      category: 'optimasi',
      title: 'Dark Mode / Sepia Antique Paper Mode',
      description: 'Mode kertas sepia/krem tua bergaya buku jurnal antik untuk kenyamanan penggunaan saat malam hari.'
    },
    {
      category: 'keamanan',
      title: 'Encrypted Vault & Backup Otomatis Google Drive',
      description: 'Penyimpanan cadangan terenkripsi secara berkala untuk menjaga keamanan catatan kas kelas.'
    }
  ]
};
