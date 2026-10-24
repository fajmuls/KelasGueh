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
  version: '3.8.0',
  codename: 'Auto-Link Iuran & Transaksi Edition',
  releaseDate: '2026-10-24',
  changes: [
    'Fitur Auto-Link Iuran: Mencentang iuran di Checklist kini otomatis mencatat transaksi pemasukan di Buku Kas, lengkap dengan nama siswa dan periode minggu.',
    'Sinkronisasi Dua Arah: Menghapus transaksi iuran di Buku Kas akan otomatis membatalkan status lunas (uncheck) di Checklist Iuran.',
    'Audit Log Pintar: Setiap aksi iuran (tunggal maupun massal) kini terekam dengan detail yang lebih informatif di log aktivitas.',
    'Pembaruan Engine Sinkronisasi: Memastikan konsistensi data antara checklist dan buku besar kas saat terjadi perubahan di perangkat berbeda.'
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
