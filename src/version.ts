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
  version: '3.7.3',
  codename: 'Supabase Smart Merge & Force Cloud Resync Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Auto-Merge Transaksi Lokal ke Supabase: Aplikasi kini otomatis menggabungkan (merge) data transaksi lokal dengan Supabase Cloud. Jika ada transaksi yang sempat gagal terkirim karena RLS Policy, aplikasi akan otomatis memicu pengunggahan ulang (resync) begitu terhubung ke Supabase.',
    'Fitur Tombol 1-Click "Paksa Upload Transaksi ke Cloud": Menambahkan tombol di tab Pengaturan untuk Bendahara/SuperAdmin agar bisa mengunggah ulang seluruh transaksi, data siswa, dan pengaturan kas ke Supabase Cloud dengan sekali klik.',
    'Sinkronisasi Realtime Pemasukan & Pengeluaran: Listener Realtime Broadcast kini aktif mendeteksi entri baru pada tabel kas_transactions sehingga HP anggota lain langsung terupdate otomatis saat Bendahara mencatat transaksi.',
    'Pembaruan Mode Kartu Per-Siswa (Single-Tap): Menghapus gestur usap/swipe (drag hover) agar checklist tidak berubah tanpa sengaja saat mengusap layar HP.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto-Reconcile Iuran dengan Catatan Pemasukan',
      description: 'Fitur otomatisasi yang mencatat transaksi pemasukan kas setiap kali bendahara mencentang iuran siswa, lengkap dengan nama siswa dan minggu iuran yang dibayar.'
    },
    {
      category: 'optimasi',
      title: 'Kuitansi Digital PDF Per-Siswa',
      description: 'Fitur cetak atau kirim PDF bukti bayar individual per-siswa yang menampilkan rincian minggu mana saja yang sudah lunas beserta total rupiah yang disetorkan ke bendahara.'
    },
    {
      category: 'keamanan',
      title: 'Audit Log Rollback Transaksi',
      description: 'Kemampuan Super Admin untuk melakukan undo/rollback transaksi atau perubahan status iuran langsung dari tabel Audit Log.'
    }
  ]
};
