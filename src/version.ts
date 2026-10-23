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
  version: '3.3.1',
  codename: 'Doodle Ultra-Smooth & Data Shield Edition',
  releaseDate: '2026-10-25',
  changes: [
    'Enkripsi PIN Transaksi (Bcrypt): Keamanan berlapis untuk verifikasi pengeluaran besar (>500rb) menggunakan algoritma hashing standar industri.',
    'Fix ReferenceError PWA Button: Memperbaiki bug kritis import yang menyebabkan aplikasi crash saat memuat bilah navigasi.',
    'Fitur "Centang Semua Mingguan": Kemudahan massal bagi Bendahara untuk melunasi iuran seluruh kelas hanya dengan satu klik (Khusus Bendahara).',
    'Restorasi Logo SVG Vektor: Mengembalikan identitas visual logo "Kelas Gue" ke format SVG yang tajam, ringan, dan profesional.',
    'Optimasi Tipografi & Layout: Ukuran font tabel diperkecil dan padding dikurangi agar muat lebih banyak data tanpa scroll horizontal.',
    'Fix Double BGM Playback: Menghilangkan bug suara musik latar yang terputar ganda saat aplikasi pertama kali dimuat.',
    'Integrasi Font "Bricolage Grotesque": Memperkuat karakter visual doodle pada semua judul dan heading aplikasi.',
    'Audit Log Accuracy: Memperbaiki bug label role pada log aktivitas impor massal anggota.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Sync Google Sheets API',
      description: 'Integrasi langsung ke Google Sheets untuk rekap kas otomatis tanpa perlu ekspor/impor CSV manual.'
    },
    {
      category: 'fitur',
      title: 'Laporan PDF Kuitansi Massal',
      description: 'Fitur untuk mencetak seluruh foto nota pengeluaran dalam satu file PDF rapi untuk arsip fisik.'
    },
    {
      category: 'optimasi',
      title: 'Offline-First Persistence',
      description: 'Peningkatan Service Worker untuk memastikan semua data tetap tersimpan dan dapat diakses meski tanpa koneksi internet.'
    }
  ]
};
