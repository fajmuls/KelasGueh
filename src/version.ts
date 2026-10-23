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
  version: '3.3.2',
  codename: 'Doodle Pure-Polish & Audio Fix Edition',
  releaseDate: '2026-10-26',
  changes: [
    'Fix Sound Playback: Memperbaiki bug suara SFX/BGM yang terputar ganda atau tiga kali saat aplikasi dimuat.',
    'Fix Navbar Visibility: Bilah navigasi kini hanya muncul setelah intro selesai, mencegah UI bertumpuk.',
    'Restorasi Logo Brand: Mengganti ikon placeholder dengan logo resmi "Kelas Gue" SVG di bilah navigasi.',
    'Cleanup Versi UI: Menghapus teks versi yang berlebihan di Tren Kas dan Data Real-Sync agar tampilan lebih bersih.',
    'Sinkronisasi Tipografi: Memastikan font "Bricolage Grotesque" diterapkan secara konsisten di seluruh elemen teks aplikasi.',
    'Optimasi Scroll Layout: Menghilangkan overflow horizontal di mobile dan PC untuk pengalaman navigasi yang lebih nyaman.',
    'PWA Compliance: Memastikan fitur instalasi PWA aktif dan terdeteksi dengan benar di berbagai browser.'
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
