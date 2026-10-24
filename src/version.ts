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
  version: '3.7.0',
  codename: 'Fast-Tap Swipe Checklist & Visual Currency Formatting Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Mode Centang Cepat HP (Fast-Tap Swipe Checklist): Mode khusus bendahara untuk menagih iuran di kelas secara praktis dengan sentuhan/usapan jari pada kartu siswa disertai suara koin interaktif.',
    'Pembersihan UI Navbar & Banner Overview: Menghapus tombol "Bagikan Link" di topbar dan boks semester ganjil sesuai instruksi agar tampilan aplikasi lebih bersih.',
    'Pemisah Ribuan Titik pada Angka & Nominal Uang: Seluruh tampilan angka, saldo, grafik tren kas bulanan (Y-Axis & Tooltip), serta tabel kini wajib menggunakan pemisah titik (misal Rp 50.000, 1.500.000).',
    'Lencana Pratinjau Terbaca & Tombol Pintas Nominal Input: Menambahkan lencana pratinjau nominal terformat secara live saat mengisi catatan transaksi beserta tombol pintas (+5rb, +10rb, +50rb, +100rb, +500rb) agar bendahara tidak keliru membedakan jumlah angka nol.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Kuitansi Digital PDF Per-Siswa',
      description: 'Fitur cetak atau kirim PDF bukti bayar individual per-siswa yang menampilkan rincian minggu mana saja yang sudah lunas beserta total rupiah yang disetorkan ke bendahara.'
    },
    {
      category: 'optimasi',
      title: 'Offline Queue & Retry Sync',
      description: 'Menahan perubahan checklist di antrean lokal jika sinyal internet di kelas terputus dan otomatis mengirimkannya ke Supabase begitu terhubung kembali.'
    },
    {
      category: 'keamanan',
      title: 'Pencegahan Duplikasi Realtime Broadcast Guard',
      description: 'Pengamanan guard otomatis untuk mencegah duplikasi notifikasi saat jaringan HP berganti seluler/Wi-Fi secara simultan.'
    }
  ]
};
