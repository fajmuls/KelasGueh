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
  version: '3.7.5',
  codename: 'Custom Redirect Authority & Schema Sync Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Dukungan Production Redirect URL: Menambahkan opsi "Production Site URL" di tab Pengaturan agar Bendahara dapat mengunci domain utama sebagai target redirect login Google, mencegah masalah URL otomatis yang berubah-ubah.',
    'Pembaruan Schema Database: Menambahkan kolom site_url pada tabel class_settings di skrip SQL Supabase untuk sinkronisasi konfigurasi domain antar-HP.',
    'Logika Redirect Cerdas: Aplikasi kini memprioritaskan domain produksi yang dikonfigurasi saat login, namun tetap mendukung domain preview AI Studio secara otomatis.',
    'Perbaikan Arsitektur Cloud-First: Sinkronisasi pengaturan kelas kini mencakup konfigurasi domain untuk menjamin konsistensi akses login.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Reconcile Iuran dengan Catatan Pemasukan',
      description: 'Fitur otomatisasi yang mencatat transaksi pemasukan kas setiap kali bendahara mencentang iuran siswa.'
    },
    {
      category: 'optimasi',
      title: 'Export Laporan Excel Per-Semester',
      description: 'Fitur untuk mengunduh rekapitulasi seluruh transaksi dan checklist iuran dalam format Excel yang rapi.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Rollback Transaksi',
      description: 'Kemampuan Super Admin untuk melakukan undo/rollback transaksi langsung dari tabel Audit Log.'
    }
  ]
};
