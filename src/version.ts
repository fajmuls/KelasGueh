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
  version: '3.8.1',
  codename: 'SQL Migration Resilience Edition',
  releaseDate: '2026-10-24',
  changes: [
    'SQL Script Refinement: Skrip SQL kini menyertakan logika migrasi otomatis untuk mengganti nama kolom "target_amount" menjadi "kas_target_amount" agar sinkronisasi tidak error.',
    'Fix RecordedBy Column: Menambahkan kolom "recorded_by" yang hilang pada tabel transaksi untuk kompatibilitas riwayat audit cloud.',
    'Enhanced Self-Healing: Perintah ALTER TABLE kini lebih agresif dalam memastikan struktur database Supabase cocok dengan aplikasi tanpa menghapus data.',
    'Peningkatan Stabilitas Sync: Mengatasi error not-null constraint pada pengaturan kelas saat melakukan paksa upload ke cloud.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Reconcile Iuran dengan Catatan Pemasukan',
      description: 'Fitur otomatisasi yang mencatat transaksi pemasukan kas setiap kali bendahara mencentang iuran siswa.'
    },
    {
      category: 'optimasi',
      title: 'Dukungan Foto Nota Berbasis Kamera HP',
      description: 'Optimasi kompresi gambar langsung dari kamera smartphone untuk bukti struk yang lebih tajam namun hemat storage.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Rollback Transaksi',
      description: 'Kemampuan Super Admin untuk melakukan undo/rollback transaksi langsung dari tabel Audit Log.'
    }
  ]
};
