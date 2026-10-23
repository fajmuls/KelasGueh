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
  version: '3.2.0',
  codename: 'Supabase Real-Sync & Advanced Analytics Edition',
  releaseDate: '2026-10-23',
  changes: [
    'Integrasi Supabase Real-Sync: Seluruh data kini tersinkronisasi secara real-time ke database Supabase (Transactions, Members, Audit Logs).',
    'Dashboard Grafik Statistik Lanjutan: Visualisasi tren pemasukan vs pengeluaran bulanan menggunakan Recharts interaktif.',
    'PWA Push Notifications: Dukungan notifikasi aplikasi (Progressive Web App) untuk pengingat iuran kas kelas.',
    'Perbaikan UI Dropdown Super Admin: Dropdown role kini muncul di atas konten (layering fix) dan tidak lagi merusak layout top bar.',
    'Fix Horizontal Overflow: Optimasi CSS global untuk menghilangkan scroll samping yang mengganggu di perangkat mobile dan desktop.',
    'Skema Database SQL Otomatis: File database.sql kini tersedia sebagai panduan setup tabel Supabase yang kokoh.',
    'Audit Log Atribusi Akurat: Pencatatan audit kini 100% menggunakan identitas akun Google yang masuk untuk keamanan transparansi.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Ekspor Rekap Kas ke Google Sheets Otomatis',
      description: 'Sinkronisasi laporan kas kelas langsung ke lembar Google Sheets secara berkala untuk backup eksternal.'
    },
    {
      category: 'optimasi',
      title: 'Offline-First Data Persistence',
      description: 'Peningkatan kemampuan aplikasi agar tetap bisa digunakan mencatat data saat tidak ada sinyal, dan auto-sync saat online.'
    },
    {
      category: 'keamanan',
      title: 'Enkripsi Multi-Factor Authentication (MFA)',
      description: 'Otentikasi tambahan (2FA) khusus untuk akses data sensitif oleh Super Admin.'
    }
  ]
};
