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
  version: '3.5.0',
  codename: 'Quality of Life & Mobile Refinement Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Doodle Button Unification: Menyeragamkan seluruh tombol di seluruh aplikasi (navbar, buku kas, pengaturan, dan modal) dengan gaya btn-doodle yang konsisten dan interaktif.',
    'Mobile Pixel Compaction: Mengoptimalkan ukuran padding, font, dan elemen tombol pada layar HP agar lebih padat, ringkas, dan tidak memerlukan scrolling berlebih.',
    'Super Admin Member Binding: Super Admin kini dapat menghubungkan akun Google pengguna ke nama siswa di tabel iuran secara langsung dengan dropdown interaktif dan 2 badge status (Role & Nama Siswa).',
    'Live Cloud Sync Badge: Indikator status sinkronisasi Supabase realtime di navbar (🟢 Sinkron / 🟡 Menyimpan... / ⚪ Lokal) untuk kepastian data tersimpan ke server.',
    'Filter Cepat Siswa Menunggak: Tombol filter instan [Semua Siswa] vs [Hanya Belum Lunas] di tabel Checklist Iuran beserta counter siswa menunggak.',
    'WhatsApp Reminder & Recap Remake: Format pesan WhatsApp disederhanakan menjadi laporan resmi ringkas tanpa emoji berlebih, menampilkan saldo kas dan daftar tunggakan, serta dibatasi khusus bendahara/super admin.',
    'Audio Preference Relocation: Memindahkan toggle efek suara (SFX) dari navbar ke menu Pengaturan Kelas (Preferensi Suara & Tampilan) untuk menghemat ruang navbar mobile.',
    'Printable Binder & Google Sheets Revamp: Pratinjau lembaran binder resmi dengan aksen lubang ring buku, kop resmi bergaris ganda, serta ekspor CSV Google Sheets yang lengkap dengan data anggota.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Download Arsip Foto Nota ZIP',
      description: 'Fitur 1-klik untuk mengunduh seluruh berkas foto kuitansi/nota belanja kas yang tersimpan di Supabase Storage dalam satu file ZIP terkompresi.'
    },
    {
      category: 'optimasi',
      title: 'Grafik Tren Arus Kas Mingguan',
      description: 'Visualisasi grafik doodle interaktif untuk memantau perbandingan pemasukan iuran vs pengeluaran kas kelas dari minggu ke minggu.'
    },
    {
      category: 'keamanan',
      title: 'Auto-Lock Session Bendahara',
      description: 'Kunci otomatis sesi otorisasi bendahara setelah 15 menit tidak aktif untuk mencegah modifikasi tidak sengaja pada perangkat bersama.'
    }
  ]
};
