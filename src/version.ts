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
  version: '4.3.3',
  codename: 'Master Admin Hub & Secretary Group Lock',
  releaseDate: '2026-10-26',
  changes: [
    'Master Admin & Security: Restriksi menu Super Admin, pengaturan pengurus terpusat, manajemen siswa dengan status aktif/tidak aktif, serta scroll tabel whitelist.',
    'Sekretaris & Pembagian Kelompok: Integrasi database siswa master admin, dukungan 3-10 kelompok, penguncian permanen setelah generate, serta tombol Kirim WA.',
    'Kas & Kompresi Struk: Kompresi otomatis foto nota/kwitansi untuk penyimpanan jangka panjang di database & binder rekap cetak.',
    'Tur Panduan Interaktif: Dialog sambutan dan tur panduan langkah-demi-langkah bagi pengguna baru.',
    'Pengaturan Volume BGM & SFX: Kontrol volume audio (0-100%) tersimpan di localStorage.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Sync Presensi dengan Poin Keaktifan',
      description: 'Fitur otomatisasi yang memberikan bonus poin keaktifan secara langsung setiap kali siswa hadir dalam presensi kelas.'
    },
    {
      category: 'optimasi',
      title: 'Eksportasi Laporan PDF/Excel Lintas Modul',
      description: 'Ekspor terpadu untuk laporan gabungan kas, presensi, keaktifan, dan inventaris barang dalam satu berkas PDF berdesain doodle.'
    },
    {
      category: 'keamanan',
      title: 'Restriksi IP & Sesi Login Admin Berdurasi',
      description: 'Pembatasan durasi aktif sesi Admin dan opsi penguncian otomatis saat tidak ada aktivitas selama 15 menit.'
    }
  ]
};


