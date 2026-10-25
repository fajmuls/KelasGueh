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
  version: '3.12.0',
  codename: 'Auto-Clear & Auth Resilience',
  releaseDate: '2026-10-24',
  changes: [
    'Auto-Clear Cache: Sistem sekarang otomatis membersihkan data konfigurasi lama di browser saat ada pembaruan versi (v3.12+).',
    'Auth Resilience: Memperbaiki error "deleted_client" dengan optimalisasi pemetaan kredensial Google Cloud.',
    'Infrastructure Refresh: Penguatan koneksi ke project Supabase baru (husymjsimolzvidunkur).',
    'Excel Power-Up: Peningkatan performa pada sistem ekspor laporan keuangan.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Bulk Add Members',
      description: 'Fitur untuk menambah banyak anggota sekaligus lewat copy-paste daftar nama.'
    },
    {
      category: 'optimasi',
      title: 'Email Notification',
      description: 'Pengiriman notifikasi otomatis saat ada transaksi kas baru yang dicatat.'
    }
  ]
};
