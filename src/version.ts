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
  version: '3.4.2',
  codename: 'Data Integrity & Minimalist Flux Edition',
  releaseDate: '2026-10-28',
  changes: [
    'Persistence Fix: Implementasi sinkronisasi state server-side untuk memastikan data Checklist Iuran tidak hilang saat refresh halaman.',
    'UI Minimalism: Redesain tabel Buku Kas dan Transaksi agar mengikuti gaya Checklist Iuran yang kompak dan padat informasi.',
    'QoL Buttons: Penyederhanaan desain tombol di seluruh dashboard untuk mengurangi kepadatan visual dan meningkatkan fokus pengguna.',
    'Sticky Architecture: Penerapan sticky headers dan sticky columns pada tabel besar untuk navigasi data yang lebih baik di perangkat mobile.',
    'Data Mapping Fix: Perbaikan logika pemetaan anggota pada checklist iuran untuk memastikan nama siswa selalu sinkron dengan database utama.'
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
