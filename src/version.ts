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
  version: '4.0.0',
  codename: 'Dual Hub Bendahara & Sekretaris + Kolektif Bill',
  releaseDate: '2026-10-26',
  changes: [
    'Dual Hub Beranda Utama: Portal awal aplikasi yang membagi secara bersih antara Ranah Bendahara (Kas & Keuangan) dan Ranah Sekretaris (Akademik & Presensi) dengan switcher instan di navbar.',
    'Ranah Sekretaris Komprehensif: Sistem Poin Keaktifan Siswa (leaderboard & riwayat apresiasi), Presensi Rapat & Kelas (H/I/S/A dengan rekap otomatis), dan Notulensi Rapat & Generator Format Surat Resmi.',
    'Tab Iuran Khusus & Kolektif: Pencatatan tagihan non-rutin (seminar, patungan kaos/jaket, dana sosial) berdampingan dengan Ceklis Iuran, lengkap dengan filter peserta, checklist bayar, salin WA, dan sinkronisasi ke Buku Kas.',
    'Perbaikan Race Condition Ceklis Iuran: Pengamanan idempoten dan locking proses massal sehingga tidak ada lagi transaksi kas ganda atau transaksi masuk saat tidak ada siswa yang diceklis.',
    'Iuran Fleksibel per Bulan & Rekap Semester: Pengaturan nominal iuran spesifik per bulan serta dashboard Rekap Kas Bulanan dan Semester Ganjil/Genap.',
    'Quality of Life URL Routing: Sinkronisasi URL browser (HTML5 History) untuk setiap tab dan modul utama memudahkan bookmark dan navigasi back/forward.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Scan OCR Bukti Transfer & Kwitansi Otomatis',
      description: 'Pemindaian struk pembayaran atau bukti transfer bank/e-wallet untuk mencentang nama siswa di Ceklis Iuran atau Kolektif secara instan.'
    },
    {
      category: 'optimasi',
      title: 'Kop Surat Digital & Ekspor PDF Notulensi',
      description: 'Ekspor dokumen notulensi rapat dan surat izin kelas langsung ke format PDF ber-kop surat resmi dan cap digital kelas.'
    },
    {
      category: 'fitur',
      title: 'Gamifikasi & Lencana Apresiasi Keaktifan',
      description: 'Penghargaan lencana doodle kustom (Mahasiswa Kritis, Notulis Handal, Terdisiplin) yang dapat diunduh siswa sebagai portofolio keaktifan.'
    }
  ]
};
