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
  version: '3.5.3',
  codename: 'OAuth Custom Domain Preservation Edition',
  releaseDate: '2026-10-29',
  changes: [
    'OAuth Redirect Clean URL: Menjamin parameter redirectTo pada Supabase OAuth menyertakan origin dan path persis tempat pengguna berada (misal kelasgue.vercel.app).',
    'Panduan URL Configuration Supabase: Menyediakan solusi pengaturan Site URL & Additional Redirect URLs di Supabase Dashboard agar hasil login Google tidak terlempar ke domain otomatis Vercel lama.',
    'Ultra-Light WhatsApp Preview (43KB JPEG): Penggunaan whatsapp-preview.jpg (400x400 piksel, kanvas putih solid, 43KB) dengan rel="image_src" agar logo aplikasi pasti dirender oleh WhatsApp.',
    'Strict Google RLS Security Script: Pilihan skrip SQL Mode Ketat Anti-Hack di Pengaturan untuk mengunci database Supabase khusus untuk Super Admin (mrachmanfm@gmail.com) dan Bendahara terdaftar.'
  ],
  suggestedUpdates: [
    {
      category: 'optimasi',
      title: 'Auto Wildcard Redirect URL',
      description: 'Menambahkan pendaftaran https://*.vercel.app/** di Supabase Redirect URLs agar semua subdomain preview Vercel otomatis didukung.'
    },
    {
      category: 'keamanan',
      title: 'Supabase Storage Policy',
      description: 'Membatasi upload nota di Supabase Storage khusus untuk pengguna terautentikasi.'
    },
    {
      category: 'fitur',
      title: 'Buku Agenda & Piket Kelas',
      description: 'Menambahkan fitur jadwal piket kebersihan dan pengingat PR kelas.'
    }
  ]
};
