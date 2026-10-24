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
  version: '3.5.2',
  codename: 'Strict Google RLS & WhatsApp Crawler Fix Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Ultra-Light WhatsApp Preview (43KB JPEG): Menghasilkan whatsapp-preview.jpg (400x400 piksel, kanvas putih solid, 43KB) serta menautkan link rel="image_src" dan itemprop="image" agar bot WhatsApp tidak timeout dan pasti menampilkan logo aplikasi.',
    'Skrip SQL Mode Ketat Supabase RLS (Anti-Hack): Menambahkan opsi Skrip SQL Mode Ketat di Pengaturan yang menolak penulisan data jika email pengguna Google tidak cocok dengan Super Admin (mrachmanfm@gmail.com) atau bendahara whitelist.',
    'Dual Mode SQL Switcher: Super Admin dapat memilih antara Mode Ketat (Anti-Hack Google Auth) atau Mode Terbuka (Quick Start) dengan 1-klik salin.',
    'Proteksi Data Publik Transparan: Seluruh siswa dan anggota kelas tetap dapat membaca (SELECT) laporan kas dan checklist iuran tanpa perlu login atau terhalang izin.'
  ],
  suggestedUpdates: [
    {
      category: 'keamanan',
      title: 'Supabase Storage Bucket Policy',
      description: 'Mengunci upload bucket nota-kas di Supabase Storage hanya untuk akun bendahara/superadmin yang login dengan Google.'
    },
    {
      category: 'fitur',
      title: 'Buku Catatan & Agenda Kelas',
      description: 'Menambahkan tab khusus untuk jadwal piket, tugas/PR mingguan, dan pengumuman kelas selain catatan kas.'
    },
    {
      category: 'optimasi',
      title: 'Auto Domain Mirroring',
      description: 'Dukungan otomatis sinkronisasi Open Graph URL saat beralih ke custom domain Vercel baru.'
    }
  ]
};
