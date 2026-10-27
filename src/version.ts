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
  version: "4.5.0",
  codename: "Student Active State, Kasbook Edit & Multi-Select, Group Project Sync",
  releaseDate: "2026-10-27",
  changes: [
    "Manajemen Siswa Terpadu: Penggantian gender (L/P) perorangan seketika, penghapusan siswa, serta toggle status 'Aktif' vs 'Tidak Aktif / Pindah' yang tersimpan otomatis ke database.",
    "Integrasi Siswa Non-Aktif di Kas: Siswa non-aktif tetap tampil di checklist dengan nomor absen asli, ditandai coret (line-through), dikecualikan dari tagihan dan perhitungan tunggakan.",
    "Perbaikan Bug Check ALL Iuran: Sinkronisasi data menyeluruh sebelum eksekusi centang massal, mencegah pemotongan data parsial dan mencegah saldo minus saat uncheck.",
    "Edit Transaksi Buku Kas: Penambahan modal Edit Transaksi lengkap (uraian, nominal, kategori, tanggal, nota) khusus untuk Bendahara & Super Admin.",
    "Hapus Massal Transaksi Kas (Multi-Select): Checkbox pilihan ganda pada tabel kas dengan floating bar aksi hapus transaksi terpilih sekaligus.",
    "Pencatatan Kelompok & Tugas Terintegrasi: Pemilihan mata kuliah, penamaan otomatis per matkul dengan fitur inline rename kelompok, pencatatan proyek per kelompok, dan tombol simpan langsung ke Jadwal & Tugas.",
    "Pengelolaan Audit Log Master Admin: Pengembalian tombol hapus log individual dan tombol bersihkan seluruh log audit dengan konfirmasi aman.",
    "Slider Volume Universal: Slider volume BGM dan SFX (0-100%) ditempatkan di drawer hamburger agar dapat diakses semua pengguna, serta tab audio dihapus dari Master Admin."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Sinkronisasi Otomatis Progres Tugas Kelompok",
      description: "Menghubungkan status penyelesaian tugas proyek kelompok dari modul Kelompok ke kartu penugasan di Jadwal & Tugas secara dua arah."
    },
    {
      category: "optimasi",
      title: "Riwayat Perubahan Transaksi Kas (Audit Trail Edit)",
      description: "Mencatat nilai awal sebelum diedit dan nilai baru setelah diedit ke dalam audit log agar seluruh riwayat revisi transparan."
    },
    {
      category: "keamanan",
      title: "Konfirmasi PIN Keamanan untuk Hapus Massal Transaksi",
      description: "Mewajibkan verifikasi PIN keamanan kelas jika menghapus lebih dari 5 transaksi kas sekaligus atau total nominal melebihi Rp 500.000."
    }
  ]
};
