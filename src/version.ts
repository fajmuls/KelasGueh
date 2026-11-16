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
  version: "4.9.0",
  codename: "Multi-Class Gateway, Smart Snapshot Sync & Reliable WhatsApp Share",
  releaseDate: "2026-11-16",
  changes: [
    "Perbaikan Total Berbagi WhatsApp (Bendahara & Sekretaris): Memperbaiki link wa.me yang gagal membuka aplikasi WhatsApp di HP/Android dengan fallback Salin Otomatis & Share Sheet Native.",
    "Arsitektur Multi-Kelas Tanpa Ubah Struktur SQL: Seluruh data awal aman di kelas 01 SAKP 014, serta Super Admin kini dapat membuat kelas baru dan berpindah antar kelas secara terstruktur.",
    "Gerbang Pemilihan Kelas & Persetujuan Super Admin: User baru memilih kelas tujuan saat pertama kali login dan menunggu konfirmasi Super Admin sebelum mengakses data kelas.",
    "Smart Snapshot Sync Hemat Kuota & Panel Live Sync: Unduhan awal 1 file snapshot ringkas (meta.json + snapshot.json) langsung diterapkan tanpa me-load ulang seluruh tabel berulang kali.",
    "Pengaturan Saklar & Batas Nominal PIN Transaksi: Super Admin dapat mengaktifkan/menonaktifkan PIN transaksi besar, menentukan batas nominalnya, dan menyinkronkan PIN 6-digit lintas perangkat.",
    "Penyempurnaan UI Doodle Premium & Tabular Numerals: Angka keuangan lebih rapi sejajar, pemisah metadata bersih, dan kontras Tema Cokelat lebih tajam."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Notifikasi Tagihan Personal Otomatis via WhatsApp",
      description: "Kirim pesan pengingat terpersonalisasi langsung ke nomor siswa yang belum melunasi iuran mingguan dari modal rekap."
    },
    {
      category: "optimasi",
      title: "Kompresi Snapshot GZIP & Delta Incremental",
      description: "Memperkecil ukuran file snapshot JSON di Supabase Storage agar tetap di bawah 1 MB meskipun transaksi ribuan baris."
    },
    {
      category: "keamanan",
      title: "Riwayat Verifikasi PIN & Batas Percobaan",
      description: "Catat percobaan verifikasi PIN yang gagal ke Audit Log dan beri jeda pengaman otomatis bila salah berulang kali."
    }
  ]
};
