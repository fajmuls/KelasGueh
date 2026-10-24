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
  version: '3.7.2',
  codename: 'Supabase Transactions & Target Kas Sync + Single-Tap Card Mode Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Sinkronisasi Database Supabase & Target Kas: Menambahkan handler fetchSettingsFromSupabase() serta listener realtime untuk class_settings & kas_transactions agar nominal Target Kas, Tarif Iuran, dan Catatan Transaksi (Pemasukan/Pengeluaran) otomatis tersimpan dan sinkron antar-perangkat via Supabase cloud.',
    'Pembaruan Mode Kartu Per-Siswa (Single-Tap): Menghapus gestur usap/swipe (drag hover) agar checklist tidak berubah tanpa sengaja saat mengusap layar HP, serta mempertahankan tampilan Mode Kartu Per-Siswa yang praktis dengan sekali ketuk (single tap).',
    'Penataan Kebijakan RLS SQL Supabase: Memperbarui panduan skrip SQL di tab Pengaturan agar tabel kas_transactions dan class_settings mengizinkan penulisan/pembaruan data.',
    'Restorasi Tombol Bagikan Link: Tombol "Bagikan Link" portal kelas dipertahankan di Topbar Navigasi dan dihapus dari Banner Ringkasan Kas agar tampilan lebih bersih.'
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
