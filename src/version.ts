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
  version: "4.8.0",
  codename: "Multi-Device Sync, Dark Chocolate Theme, Backup JSON & Whitelist Student Sync",
  releaseDate: "2026-10-29",
  changes: [
    "Sinkronisasi Multi-Device & Tarif Iuran Spesial: Memperbaiki bug perbedaan tarif iuran bulanan antar perangkat dengan penyimpanan cloud Supabase otomatis.",
    "Tema Cokelat (Dark Chocolate Espresso): Hadir dengan warna kopi gelap elegan dan tipografi krem kontras tinggi anti-glare.",
    "Ekspor & Impor Cadangan Data JSON Pengurus: Memungkinkan Bendahara, Sekretaris, dan Super Admin mengunduh serta memulihkan data lengkap dengan konfirmasi audit log.",
    "Penetapan Siswa di Whitelist Role: Super Admin dapat langsung menetapkan dan menghubungkan No. Absen/NIM serta nama siswa dari data kelas pada daftar Whitelist.",
    "Pencarian & Akordeon Kelompok Tersimpan: Mempermudah pencarian nama matkul/kelompok serta fitur minimize/collapse per mata kuliah.",
    "Optimalisasi Checklist Iuran Cepat: Respons instan 0.5 detik dengan animasi centang ringkas untuk pencatatan kas massal.",
    "Opsi 3 Periode Rekap WhatsApp: Pilihan periode Minggu Ini, Bulan Ini, dan Keseluruhan sebelum menyalin dan mengirim laporan ke WhatsApp."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Pemberitahuan Tagihan Iuran Otomatis ke WhatsApp",
      description: "Kirim pesan reminder personal ke siswa yang menunggak iuran mingguan dengan 1 klik dari checklist."
    },
    {
      category: "optimasi",
      title: "Kompresi Cadangan JSON Otomatis",
      description: "Mengompresi file cadangan JSON menjadi format ringkas gzip saat diekspor untuk menghemat kuota data seluler."
    },
    {
      category: "keamanan",
      title: "Verifikasi Dua Langkah untuk Restore Data",
      description: "Meminta PIN Keamanan Master sebelum menimpa database dari file cadangan JSON."
    }
  ]
};
