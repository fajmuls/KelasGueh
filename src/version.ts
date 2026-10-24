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
  version: '3.6.1',
  codename: 'Dues Auto-Cash Balance & Supabase Persistence Fix Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Otomatisasi Kaitan Checklist Iuran ke Kas Overview: Setiap kali bendahara mencentang/membatalkan checklist iuran mingguan anggota, nominal iuran (pilihan minggu x iuran mingguan) langsung otomatis menambah Total Debit (Masuk) dan Saldo Kas Bersih.',
    'Rincian Transparansi Sumber Kas: Kartu Ringkasan Kas (Overview) kini menampilkan rincian terpisah antara Iuran Siswa dan Transaksi Kas Lainnya.',
    'Sinkronisasi Realtime Supabase Multi-Perangkat: Perbaikan penyimpanan dan broadcast realtime untuk checklist iuran, transaksi baru, foto nota, dan audit log sehingga langsung terupdate di HP anggota lain tanpa refresh.',
    'Pembaruan Tren Grafik Kas Bulanan: Grafik tren bulanan kini secara otomatis menghitung akumulasi penerimaan iuran checklist mingguan.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Kuitansi Digital PDF Per-Siswa',
      description: 'Fitur cetak atau kirim PDF bukti bayar individual per-siswa yang menampilkan rincian minggu mana saja yang sudah lunas beserta total rupiah yang disetorkan ke bendahara.'
    },
    {
      category: 'optimasi',
      title: 'UI UX Swipe Checklist / Fast Tap',
      description: 'Mode centang cepat untuk bendahara saat menagih iuran di kelas, memudahkan sapu centang beberapa siswa sekaligus dengan umpan balik suara koin yang memuaskan.'
    },
    {
      category: 'keamanan',
      title: 'Antrean Offline & Sync Queue Retry',
      description: 'Jika koneksi internet terputus saat menagih iuran di kelas, checklist disimpan di antrean lokal HP dan otomatis disinkronkan ke Supabase begitu kembali ada sinyal.'
    }
  ]
};
