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
  version: "4.6.0",
  codename: "Pembagian Kelompok Matkul Terpadu & Empty State Workflow",
  releaseDate: "2026-10-28",
  changes: [
    "Refaktorisasi Pembagian Kelompok: Penyatuan tugas proyek kelompok per mata kuliah (bukan per kelompok individu) untuk efisiensi pembuatan tugas.",
    "Alur Tampilan Awal (Empty State): Area daftar kelompok kini kosong sebelum tombol 'Generate & Kunci Kelompok' diklik.",
    "Integrasi Direct ke Jadwal & Tugas: Penambahan tombol 'Simpan ke Jadwal & Tugas' langsung pada kartu proyek mata kuliah.",
    "Format WhatsApp Terstruktur: Pesan WhatsApp otomatis mencakup Nama Mata Kuliah, Tugas Proyek Terpadu, Deadline, serta daftar anggota dengan badge gender (L/P).",
    "Reset & Buka Kunci Intuitive: Fitur reset mengembalikan antarmuka ke tampilan awal bersih untuk pengacakan kelompok berikutnya."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Export Rekap Pembagian Kelompok ke PDF / Excel",
      description: "Memungkinkan bendahara dan sekretaris mengunduh dokumen rekapitulasi daftar kelompok dan tugas proyek per mata kuliah dalam format PDF resmi atau Excel."
    },
    {
      category: "optimasi",
      title: "Beban Tugas Seimbang (Skill / Academic Balance)",
      description: "Opsi algoritma distribusi lanjutan berdasarkan riwayat nilai / poin siswa agar setiap kelompok memiliki kombinasi kemampuan yang seimbang."
    },
    {
      category: "keamanan",
      title: "Preservasi Riwayat Kelompok per Semester",
      description: "Arsip otomatis riwayat kelompok mata kuliah yang sudah selesai agar tidak terhapus saat membuat kelompok baru di semester berikutnya."
    }
  ]
};

