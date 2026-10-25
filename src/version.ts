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
  version: '3.14.0',
  codename: 'Mobile Ergonomics & UI/UX Polish',
  releaseDate: '2026-10-24',
  changes: [
    'Header & Navigasi HP: Rampingkan header, tab bar otomatis auto-scroll ke tab aktif dengan scroll cue pudar, dan hamburger menu kini berupa overlay modal "Lainnya" tanpa mendorong konten.',
    'Tata Letak Tombol & Grid: Tombol Catat Transaksi, Cetak/PDF, dan Rekap WA tersusun rata; checklist iuran menggunakan susunan grid 2x2 yang seragam dengan touch target minimal 44px.',
    'UI Dropdown & Date Picker Kustom: Mengganti seluruh <select> dan date picker bawaan browser dengan bottom sheet & popover bergaya doodle yang konsisten.',
    'Toast & Modal Dialog Kustom: Menghilangkan alert/confirm/prompt bawaan OS/browser dan menggantikannya dengan Doodle Toast & Modal konfirmasi.',
    'Input Nominal & Tipografi: Input iuran dan target kas kini memiliki format ribuan otomatis (Rp 5.000, Rp 2.960.000) dengan tabular-nums, tanpa spasi renggang.',
    'Peningkatan Checklist Iuran: Kolom nama mendukung 2 baris atau sentuhan detail, badge ALL diperbesar area sentuhnya, serta tabel dilengkapi petunjuk geser horizontal.',
    'SEO, PWA & Pratinjau WhatsApp: Menggunakan URL absolut kelasgueh.vercel.app, menambahkan robots.txt, sitemap.xml, manifest.json, dan fallback noscript.'
  ],
  suggestedUpdates: [
    {
      category: 'optimasi',
      title: 'PWA Offline Background Sync Queue',
      description: 'Menyimpan antrean transaksi lokal saat jaringan offline dan otomatis mengirim ke cloud saat koneksi internet kembali pulih.'
    },
    {
      category: 'fitur',
      title: 'Kalkulator Pembagian Biaya Acara (Split Bill)',
      description: 'Fitur cepat bagi bendahara untuk menghitung pembagian biaya perlengkapan atau konsumsi per kelompok siswa.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Export Multi-Format (PDF & CSV)',
      description: 'Menambahkan opsi cetak PDF langsung untuk arsip resmi audit log kas kelas selain file spreadsheet CSV.'
    }
  ]
};
