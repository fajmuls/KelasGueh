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
  version: '2.1.0',
  codename: 'Supabase Cloud & Audio Pack Edition',
  releaseDate: '2026-10-22',
  changes: [
    'Integrasi langsung kredensial Cloud Supabase Proyek: https://ireqpxgmlrsmcgidfthg.supabase.co.',
    'Penerapan Publishable Key Supabase resmi sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV.',
    'Integrasi paket audio kustom pengguna: 01_button_tap.mp3, 02_success_chime.mp3, 04_page_switch_whoosh.mp3, dan 05_reminder_ping.mp3.',
    'Fitur pemutar musik latar santai (Chill Cheerful BGM Player 60s) dengan tombol putar/jeda interaktif di navigasi atas.',
    'Auto-fallback audio ke Web Audio API synthesizer jika file audio offline atau diblokir browser.',
    'Penyempurnaan form Settings dengan tombol uji konektivitas Supabase secara langsung.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Supabase Realtime Postgres Broadcast',
      description: 'Aktifkan Supabase Realtime channel (postgres_changes) agar saat bendahara mencatat kas di ponsel, layar laptop anggota kelas langsung terupdate seketika tanpa perlu reload.'
    },
    {
      category: 'keamanan',
      title: 'Supabase Row Level Security (RLS) & Auth Policy',
      description: 'Terapkan RLS policy di PostgreSQL database Supabase untuk memastikan tabel kas_transactions hanya bisa di-INSERT/UPDATE oleh role bendahara/superadmin.'
    },
    {
      category: 'optimasi',
      title: 'Supabase Storage Bucket untuk Foto Nota Kwitansi',
      description: 'Gunakan Supabase Storage bucket (misal: "nota-kas") untuk menyimpan file gambar nota asli dengan kompresi webp otomatis agar tidak membebani database.'
    },
    {
      category: 'fitur',
      title: 'Ekspor Rekap Kas PDF Bergaya Nota Kertas Binder',
      description: 'Download rekap kas per bulan dalam format dokumen cetak resmi berlogo kelas gue untuk arsip fisik.'
    }
  ]
};
