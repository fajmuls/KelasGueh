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
  version: '3.4.3',
  codename: 'Supabase Cloud-First & Resilient Engine Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Supabase SQL Fix: Pembaruan skrip SQL dengan blok exception aman (idempotent) untuk mencegah error 42710 (relation is already member of publication) dan konfigurasi Public RLS Policies agar anon key dapat membaca & menyimpan data secara instan.',
    'Cloud-First Data Persistence: Memperbaiki fetch anggota dan transaksi dengan auto-sync dari lokal ke cloud, memastikan nama siswa dan status checklist tidak tereset/hilang saat halaman di-refresh.',
    'Crash Prevention: Menghilangkan bug crash (blank putih) saat menekan tombol "All" (Pilih Semua) di checklist iuran melalui optimasi batch upsert dan proteksi null-safety.',
    'Audio State Sync: Menyelaraskan status visual tombol musik latar (BGM) di navbar sehingga langsung menyala/ter-highlight aktif saat audio mulai berputar otomatis.',
    'Official PWA App Icon: Mengganti ikon biru generik saat instalasi PWA dengan logo resmi "Kelas Siapa? Kelas Gueh!" beresolusi tinggi (192px, 512px, maskable safe-zone, dan iOS apple-touch-icon).'
  ],
  suggestedUpdates: [
    {
      category: 'optimasi',
      title: 'Offline-to-Online Visual Indicator',
      description: 'Menambahkan badge status koneksi cloud realtime di navbar agar bendahara dan siswa tahu saat data berhasil tersinkronisasi ke Supabase.'
    },
    {
      category: 'fitur',
      title: 'Ekspor Rekap Kas & Nota PDF',
      description: 'Fitur 1-klik untuk mengunduh rekap laporan keuangan kas bulanan lengkap beserta lampiran foto nota transaksi dalam format PDF siap cetak.'
    },
    {
      category: 'fitur',
      title: 'Filter Cepat Siswa Menunggak',
      description: 'Tab filter instan di Checklist Iuran untuk menampilkan hanya siswa yang belum lunas pada bulan terpilih guna mempermudah penagihan.'
    }
  ]
};
