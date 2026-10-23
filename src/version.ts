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
  version: '3.4.1',
  codename: 'Financial Clarity & Grid Precision Edition',
  releaseDate: '2026-10-27',
  changes: [
    'Refaktor Terminologi: Mengubah label "Pemasukan" menjadi "Debit" dan "Pengeluaran" menjadi "Kredit" untuk standardisasi akuntansi kas.',
    'Optimasi Tabel Checklist: Implementasi "Sticky Name Column" dan "Sticky Header" untuk memudahkan pemantauan data anggota yang banyak.',
    'Data Persistence Fix: Memperbaiki bug sinkronisasi Supabase saat melakukan update nama, NIM, atau nomor HP anggota.',
    'High Information Density: Mengecilkan ukuran sel tabel checklist agar lebih banyak data terlihat dalam satu layar tanpa scroll berlebih.',
    'Mobile UI Polish: Penyesuaian ukuran font dan logo di navbar untuk mencegah overflow kanan dan pemotongan menu dropdown pada ponsel.',
    'Audio Engine Lock: Peningkatan sistem pengunci audio intro untuk memastikan suara pembuka hanya diputar satu kali dengan durasi 5 detik.',
    'Fitur Edit Anggota: Kini Bendahara dapat langsung mengubah informasi anggota (Nama/NIM/WA) secara inline di tabel checklist.',
    'PWA Branding: Memperbaiki ikon aplikasi saat instalasi PWA agar menggunakan logo resmi "Kelas Gue".'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Automated PWA Push Notifications',
      description: 'Pengiriman notifikasi otomatis ke HP siswa saat ada iuran yang belum lunas di akhir bulan.'
    },
    {
      category: 'optimasi',
      title: 'Real-time Multi-device Sync',
      description: 'Peningkatan background worker untuk memastikan data terupdate seketika di semua perangkat yang membuka aplikasi.'
    },
    {
      category: 'fitur',
      title: 'Audit Trail Detail',
      description: 'Penambahan rincian perubahan data pada log audit untuk transparansi penuh siapa mengubah apa dan kapan.'
    }
  ]
};
