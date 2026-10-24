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
  version: '3.10.0',
  codename: 'Fresh Infrastructure Reset',
  releaseDate: '2026-10-24',
  changes: [
    'Infrastruktur Baru: Berhasil migrasi ke project Supabase baru yang lebih bersih dan stabil.',
    'Reset Database Total: Menghapus residu data lama yang menyebabkan konflik sinkronisasi.',
    'Optimasi Konektivitas: Default URL dan Anon Key telah diperbarui langsung di dalam inti sistem.',
    'Realtime v2: Peningkatan stabilitas pada kanal publikasi realtime untuk sinkronisasi antar perangkat.',
    'Fix Local Conflict: Menghapus mekanisme fallback yang terkadang membingungkan data lokal dan cloud.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Bulk Add Members',
      description: 'Fitur untuk menambah banyak anggota sekaligus lewat copy-paste daftar nama untuk mempercepat setup.'
    },
    {
      category: 'optimasi',
      title: 'Sync Status Indicator',
      description: 'Menambahkan indikator visual di Navbar saat data sedang dikirim ke cloud.'
    },
    {
      category: 'keamanan',
      title: 'Storage Policies',
      description: 'Mengatur keamanan folder nota di Supabase Storage agar hanya bendahara yang bisa menghapus foto.'
    }
  ]
};
