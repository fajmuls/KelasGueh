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
  version: '3.9.0',
  codename: 'Database Overhaul & Cloud-First Architecture',
  releaseDate: '2026-10-24',
  changes: [
    'Rombak Total Arsitektur Database: Seluruh logika database kini menggunakan DbService yang baru dan lebih stabil.',
    'Fix Not-Null Constraint: Perbaikan pada skrip SQL dan kode aplikasi untuk kolom kas_target_amount.',
    'Full Cloud Audit Logs: Semua log aktivitas kini tersimpan langsung di Supabase, tidak hanya di lokal.',
    'Optimasi Iuran Real-time: Perbaikan pada sinkronisasi checklist iuran agar langsung terupdate di dashboard anggota.',
    'Pembersihan API Lokal: Menghapus fragmentasi konfigurasi API lokal yang sering menyebabkan ketidaksinkronan data.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Sistem Role Claims Terintegrasi',
      description: 'Fitur permohonan role (Ketua/Bendahara) yang tersimpan di database dan menunggu persetujuan Super Admin.'
    },
    {
      category: 'optimasi',
      title: 'Peningkatan Kecepatan Load',
      description: 'Implementasi caching layer yang lebih cerdas untuk mengurangi penggunaan kuota database.'
    },
    {
      category: 'keamanan',
      title: 'RLS Hardening',
      description: 'Pengetatan Row Level Security di Supabase untuk memastikan data iuran hanya bisa diubah oleh pengurus.'
    }
  ]
};
