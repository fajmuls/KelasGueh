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
  version: "4.7.0",
  codename: "Master Admin Audit Undo, Whitelist NIM Match & Sekretaris Kelompok Storage",
  releaseDate: "2026-10-28",
  changes: [
    "Fitur Undo Laporan Audit Log: Kemampuan membatalkan (undo) aksi log individual maupun massal dengan pemulihan data otomatis.",
    "Perbaikan Tabel Scroll Audit Log: Tabel audit log dapat di-scroll horizontal secara fleksibel pada seluruh ukuran layar.",
    "Preservasi & Penyimpanan Kelompok Matkul: Kelompok yang telah digenerate dapat disimpan secara permanen ke daftar 'Kelompok Tersimpan' untuk diakses seluruh anggota.",
    "Pembagian Kelompok Manual: Penambahan opsi 'Buat Kelompok Manual' untuk menyusun anggota tim secara mandiri per kelompok.",
    "Checklist & Link Pengumpulan Tugas Kelompok: Setiap kelompok dapat menandai status selesai tugas dan menyimpan URL link jawaban/drive pengumpulan.",
    "Penyatuan Tombol Tugas Baru: Tombol pencatatan tugas disatukan menjadi '+ Tugas Baru' dengan navigasi jenis tugas internal yang lebih bersih.",
    "Tautan Pengumpulan Interaktif & Share WA: Petunjuk tugas yang berisi tautan (Google Drive/e-learning) otomatis dapat diklik langsung dan dibagikan ke WhatsApp."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Export Laporan Kelompok & Link Pengumpulan ke Excel",
      description: "Memungkinkan sekretaris mengunduh rekapitulasi seluruh kelompok, status tugas, dan link pengumpulan Drive ke file Excel."
    },
    {
      category: "optimasi",
      title: "Notifikasi Otomatis Pengumpulan Tugas Kelompok",
      description: "Peringatan otomatis ke grup WhatsApp kelas jika ada kelompok yang belum mengisi link pengumpulan 1 hari sebelum deadline."
    },
    {
      category: "keamanan",
      title: "Proteksi Pengeditan Link Pengumpulan Kelompok",
      description: "Verifikasi anggota kelompok sebelum dapat mengubah link pengumpulan jawaban tugas."
    }
  ]
};



