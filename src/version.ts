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
  version: '3.13.1',
  codename: 'Secure Cloud Migration',
  releaseDate: '2026-10-24',
  changes: [
    'Security Hardening: Seluruh pintu belakang (PIN bypass, Admin login shortcut) telah dihapus secara permanen untuk menjamin keamanan whitelist.',
    'Pembersihan Legacy: Menghapus modul diagnostik Firebase/Firestore lama yang sudah tidak relevan dengan infrastruktur Supabase.',
    'Version Sync: Memastikan tampilan versi aplikasi di seluruh layar (Welcome, Splash, Settings) tersinkronisasi secara otomatis.',
    'Auth Resilience: Optimalisasi alur login Google untuk mencegah error "deleted_client" pada project baru.',
    'Cloud-First Config: Konfigurasi API sekarang sepenuhnya dikelola oleh environment variables di Vercel.'
  ],
  suggestedUpdates: [
    {
      category: 'keamanan',
      title: 'Session Timeout',
      description: 'Menambahkan fitur auto-logout jika aplikasi tidak digunakan dalam waktu tertentu.'
    },
    {
      category: 'fitur',
      title: 'Excel Export Update',
      description: 'Peningkatan format laporan Excel untuk mendukung rincian iuran mingguan lebih detail.'
    }
  ]
};
