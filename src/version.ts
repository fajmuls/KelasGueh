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
  version: '4.2.0',
  codename: 'Pengaturan Admin Terpadu, Audit Log Hub & Pembagian Kelompok',
  releaseDate: '2026-10-26',
  changes: [
    'Pengaturan Admin & Whitelist Terpusat: Menu khusus Super Admin di drawer hamburger untuk mengelola Whitelist Roll (Super Admin, Bendahara, Sekretaris), Audit Log lintas modul, Kelamin Siswa, dan PIN Keamanan.',
    'Audit Log Lintas Ranah: Laporan aktivitas terpadu yang dapat difilter berdasarkan modul (Transaksi, Iuran, Sekretaris, Sistem) serta role pengguna dengan fitur ekspor ringkasan.',
    'Pembagian Kelompok Siswa (Secretary Hub): Fitur pembagian kelompok kelas otomatis dengan opsi Acak Campur atau Seimbang Gender (proporsional L/P) lengkap dengan tombol ekspor Salin ke WhatsApp.',
    'Pembersihan Cache Lokal Per-Pengguna: Pembersihan memori lokal browser individual tanpa memengaruhi atau menghapus data utama di database Supabase.',
    'Penyempurnaan UI & Banner Doodle Compact: Desain banner ranah Sekretaris & Bendahara dibuat lebih ringkas dan proporsional sesuai style stempel doodle khas KasOverview.',
    'Buku Kas Filters & Edit Transaksi: Fitur Sembunyikan Iuran Mingguan pada Buku Kas agar fokus ke transaksi kas umum, serta modal edit detail transaksi kas.',
    'Restriksi Hak Akses Anggota: Kalkulator Split Bill dan opsi ekspor keuangan kini dibatasi khusus untuk Bendahara, Sekretaris, dan Admin.',
    'Pembersihan Ikon Tambah Ganda & SFX Optimization: Menghilangkan ikon plus ganda pada tombol aksi Sekretaris dan menyelaraskan sound effects UI di seluruh aplikasi.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Notifikasi Otomatis WhatsApp untuk Tagihan Acara & Kelompok',
      description: 'Integrasi tautan WhatsApp otomatis untuk mengirimkan rincian tagihan acara atau hasil pembagian kelompok langsung ke grup kelas.'
    },
    {
      category: 'optimasi',
      title: 'Filter Lanjutan Presensi & Keaktifan Berdasarkan Kelompok',
      description: 'Menampilkan rekapitulasi poin keaktifan dan tingkat kehadiran mahasiswa berdasarkan kelompok diskusi yang telah dibentuk.'
    },
    {
      category: 'keamanan',
      title: 'Verifikasi Otentikasi Biometrik / PIN 2-Langkah untuk Transaksi Kas',
      description: 'Fitur penguncian ekstra dengan PIN 6-digit setiap kali Bendahara melakukan pengeluaran kas di atas ambang batas tertentu.'
    }
  ]
};


