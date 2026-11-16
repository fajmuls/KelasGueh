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
  version: "4.10.0",
  codename: "Auto-Snapshot Live, Google Auth Popup, Admin Sheets Sync & Smart Multi-Semester",
  releaseDate: "2026-11-16",
  changes: [
    "Live Sync Otomatis & Status Ringkas (Online / Sinkron... / Lokal): Pemeriksaan metadata snapshot berjalan otomatis di latar belakang sehingga pengguna baru atau lama langsung memperbarui 1 file snapshot JSON tanpa perlu klik manual.",
    "Perbaikan Jalur Publik Pengajuan Masuk Kelas: Pengajuan dari browser mana pun (termasuk preview Google AI Studio) langsung tercatat real-time di daftar konfirmasi Super Admin tanpa mengubah skema SQL.",
    "Edit Kelas, Arsip Semester & Auto-Admit Nama+NIM: Super Admin dapat mengedit nama/kode kelas dan menandai semester lama sebagai Arsip; siswa dengan Nama Lengkap & NIM cocok di kelas aktif terbaru langsung diterima otomatis.",
    "Login Google Popup Resmi di Preview AI Studio + 1 Spreadsheet Admin (8 Tab): Mendukung login Google via Firebase Popup beserta integrasi Google Spreadsheet Admin otomatis untuk seluruh modul kelas.",
    "Hak Akses Pembagian Kelompok Sekretaris & Dropdown Kelas Doodle: Pembuatan/pengubahan/penghapusan kelompok dikunci khusus untuk Sekretaris & Super Admin, serta dropdown kelas menyatu dengan UI Doodle.",
    "Tombol Pasang App Desktop (PWA / PWABuilder): Panduan interaktif buka tab penuh saat berada di iframe dan siap dikemas menjadi installer desktop (.exe) lewat PWABuilder."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Notifikasi Tagihan Personal Otomatis via WhatsApp",
      description: "Kirim pesan pengingat terpersonalisasi langsung ke nomor siswa yang belum melunasi iuran mingguan dari modal rekap."
    },
    {
      category: "optimasi",
      title: "Sinkronisasi Dua Arah Google Sheets Terjadwal",
      description: "Tambahkan opsi impor pembaruan status siswa langsung dari Google Spreadsheet Admin ke dalam aplikasi kelas."
    },
    {
      category: "keamanan",
      title: "Riwayat Verifikasi PIN & Batas Percobaan",
      description: "Catat percobaan verifikasi PIN yang gagal ke Audit Log dan beri jeda pengaman otomatis bila salah berulang kali."
    }
  ]
};
