export interface AppVersionInfo {
  version: string;
  codename: string;
  releaseDate: string;
  changes: string[];
  suggestedUpdates: {
    category: "fitur" | "optimasi" | "keamanan";
    title: string;
    description: string;
  }[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: "4.11.0",
  codename: "Supabase Unified Auth, Akses Anggota Transparan & Dual Ekspor .xlsx / .json",
  releaseDate: "2026-11-16",
  changes: [
    "Sistem Login 100% Supabase (Tanpa Firebase Auth / Google Workspace): Pengurus masuk langsung via Email + PIN/Password terverifikasi Supabase atau tombol OAuth Popup Supabase tanpa pencatatan ke Firestore.",
    "Panduan Setup Login Preview AI Studio di Aplikasi: Tersedia modal interaktif berisi daftar URL preview (ais-dev, ais-pre) dan Callback URL Supabase dengan tombol Salin 1-Klik.",
    "Akses Anggota Kelas Instan & Transparan: Tombol 'Masuk sebagai Anggota Kelas' langsung membuka Beranda dalam mode baca (read-only) dan bebas memilih kelas aktif tanpa pemeriksaan keanggotaan yang lambat atau tunggu konfirmasi admin.",
    "Dual Ekspor Manual — Spreadsheet Rapi (.xlsx 8 Tab) vs Cadangan (.json): Tersedia ekspor Excel 8 sheet siap unggah manual ke Google Sheets/Excel di menu Bendahara & Super Admin, terpisah dari file cadangan teknis JSON.",
    "Migrasi Penuh window.open di Seluruh Modul: Seluruh tombol WhatsApp, Kalender, Mailto, dan Cetak PDF (via iframe aman) kini bekerja mulus di dalam iframe preview maupun mode PWA terinstal."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Impor Pembaruan Siswa dari Excel (.xlsx) dengan Pratinjau Diff",
      description: "Izinkan Bendahara/Super Admin mengunggah kembali file .xlsx yang sudah diedit di Google Sheets untuk memperbarui nomor WhatsApp atau status aktif siswa setelah meninjau perubahan."
    },
    {
      category: "fitur",
      title: "Antrean Tagihan WhatsApp Bertahap untuk Banyak Siswa",
      description: "Tambahkan daftar centang siswa penunggak agar Bendahara bisa mengirim pesan pengingat satu per satu secara berurutan tanpa harus menutup modal."
    },
    {
      category: "keamanan",
      title: "Ganti Password Email Pengurus Mandiri di Pengaturan Akun",
      description: "Sediakan form ubah password Supabase dan reset PIN per-perangkat langsung dari menu Pengaturan Pengurus agar tidak bergantung pada reset manual."
    }
  ]
};
