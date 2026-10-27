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
  version: "4.4.0",
  codename: "Admin Isolation, WhatsApp Direct Actions & Student Active Toggle",
  releaseDate: "2026-10-27",
  changes: [
    "Hak Akses Super Admin: Isolasi mutlak menu Master Admin dari Anggota, Bendahara, dan Sekretaris.",
    "Menu Pengaturan Pengurus: Pengaturan Iuran & Semester diganti menjadi Pengaturan Pengurus dengan opsi Bendahara & Sekretaris di drawer hamburger.",
    "Preview Role Sekretaris & Ikon Baru: Penambahan opsi simulasi Sekretaris di akun terhubung serta pembaruan ikon Bendahara (Koin), Sekretaris (Dokumen), dan Anggota (Mata/Hanya Lihat).",
    "Perbaikan Tampilan Master Admin: Perbaikan z-index layer banner Master Admin agar tidak tertimpa dan tabel Whitelist kini dapat di-scroll horizontal pada HP.",
    "Penyatuan Manajemen Siswa: Penyatuan form siswa dan kelamin, fitur edit nama/NIM/gender, serta toggle status aktif/keluar yang tersimpan ke database.",
    "Pembagian Kelompok Sekretaris: Terhubung database siswa master admin (siswa tidak aktif otomatis dilewati), rentang 3-10 kelompok, penguncian permanen setelah generate, dan posisi tombol acak ulang.",
    "Integrasi Kirim WA Pengurus: Mengganti semua tombol salin WA di modul Sekretaris menjadi Kirim WA langsung via WhatsApp Web/App, khusus pengurus.",
    "Perbaikan Audio & Kas Checklist: Chime suara tunggal tanpa spam saat toggle massal ALL dan loading screen menunggu sinkronisasi database selesai penuh.",
    "Kompresi Struk & Kwitansi: Kompresi otomatis gambar struk transaksi kas (maks 800px) untuk arsip jangka panjang di database dan binder cetak.",
    "Slider Volume Audio: Pengaturan volume BGM dan SFX (0-100%) tersimpan di preferensi lokal.",
    "Dialog Sambutan Pengguna Baru: Pop-up sambutan ramah saat login pertama menawarkan tur panduan interaktif."
  ],
  suggestedUpdates: [
    {
      category: "fitur",
      title: "Auto-Sync Presensi dengan Poin Keaktifan",
      description: "Memberikan bonus poin keaktifan otomatis saat siswa hadir dalam presensi sesi kelas."
    },
    {
      category: "optimasi",
      title: "Smart Batching Transaksi Kas Offline",
      description: "Antrian transaksi lokal yang otomatis melakukan batch sync saat koneksi internet kembali stabil."
    },
    {
      category: "keamanan",
      title: "Audit Trail Detail untuk Perubahan Kelompok & Presensi",
      description: "Pencatatan riwayat perubahan kelompok dan presensi ke dalam log audit Super Admin."
    }
  ]
};
