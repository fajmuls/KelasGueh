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
  version: '3.15.0',
  codename: 'Split Bill Calculator & Smart Preview Overhaul',
  releaseDate: '2026-10-25',
  changes: [
    'Fitur Baru: Kalkulator Split Bill Acara Kelas — Menghitung pembagian biaya kegiatan/perlengkapan per siswa secara otomatis, generate teks rekap WA, dan opsional 1-click simpan ke Buku Kas.',
    'Navigasi Banner Ringkasan Kas: Tombol Catat Transaksi, Cetak/PDF, dan Rekap WA di banner utama kini otomatis berpindah ke tab Buku Kas & Nota lalu membuka modal sesuai fungsinya.',
    'Pratinjau Ekspor CSV & Google Sheets: Tombol Ekspor di Buku Kas kini menampilkan Modal Pratinjau Tabel Rapi dengan ringkasan Debit, Kredit, Saldo Bersih, serta tombol download CSV dan panduan Google Sheets.',
    'Pembersihan UI Buku Kas: Menghilangkan bug ikon ganda pada tombol Catat, menghapus tombol "Atur" yang redundan (sudah ada di Pengaturan), dan menambahkan tombol cepat Split Bill.',
    'Perbaikan Bug Saldo Checklist Iuran: Mengisolasi perhitungan saldo kas bersih dari tabel transaksi utama (mencegah double-counting saldo iuran).',
    'Perbaikan Scroll & Respon Touch Checklist: Menambahkan isolasi gesture scroll (touch-action pan-x pan-y & overscroll-contain) agar scrolling tabel tidak menggeser background halaman.',
    'Pengesahan Dokumen Cetak/PDF: Memperbarui kolom tanda tangan dokumen binder cetak — Mengetahui & Menyetujui: Super Admin (M. Rahman FM - mrachmanfm@gmail.com) dan Dibuat dengan sebenarnya oleh: Bendahara Umum Kelas.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Stempel Doodle Digital & Tanda Tangan QR Verification',
      description: 'Menambahkan stempel visual bergaya doodle kelas dan kode QR unik pada laporan PDF untuk verifikasi keaslian dokumen.'
    },
    {
      category: 'optimasi',
      title: 'Auto Reminder WhatsApp H-1 Tenggat Iuran via Web Worker / Scheduled Push',
      description: 'Pengingat otomatis H-1 tenggat iuran kas mingguan untuk siswa yang belum lunas.'
    },
    {
      category: 'keamanan',
      title: 'Backup Data Otomatis ke Google Drive / Local Storage Encrypted Vault',
      description: 'Fasilitas cadangan data berkala yang terenkripsi untuk mencegah kehilangan catatan kas jika perangkat berganti.'
    }
  ]
};
