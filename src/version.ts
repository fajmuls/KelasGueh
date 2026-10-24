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
  version: '3.5.1',
  codename: 'WhatsApp Social Share & Security Audit Edition',
  releaseDate: '2026-10-29',
  changes: [
    'WhatsApp & Social Share Logo Preview: Menambahkan Open Graph metadata (og:image, og:image:secure_url, og:image:width: 512, og:image:height: 512, og:image:type) dan Twitter Cards sehingga link Vercel saat dibagikan ke WhatsApp menampilkan logo resmi aplikasi dengan tajam.',
    'Pembaruan Deskripsi Aplikasi: Menyelaraskan deskripsi web dan kartu berbagi menjadi "Aplikasi kelas serbaguna untuk kelola kegiatan, buku kas, checklist iuran, dan catatan kelas", tidak melulu terpaku pada istilah transparansi kas.',
    'Asset Og-Image Standar Tinggi: Menyediakan file /og-image.png (512x512 PNG) di root publik server agar crawler WhatsApp / Facebook / Twitter dapat mengambil gambar preview tanpa kendala format SVG.',
    'Security Hardening: Verifikasi keamanan menyeluruh arsitektur Supabase (Anon Key aman di browser, perlindungan PIN 6-digit terenkripsi untuk mutasi besar, sanitasi payload, dan isolasi role Super Admin / Bendahara).'
  ],
  suggestedUpdates: [
    {
      category: 'keamanan',
      title: 'Restricted RLS Policies Supabase',
      description: 'Penguatan kebijakan RLS Supabase berbasis Google OAuth UID jika ingin membatasi penulisan tabel di level database hanya untuk UID Google akun bendahara terdaftar.'
    },
    {
      category: 'fitur',
      title: 'PWA Share Target API',
      description: 'Memungkinkan siswa membagikan foto struk belanja langsung dari galeri HP atau WhatsApp ke aplikasi Kelas Gue via native Android/iOS share sheet.'
    },
    {
      category: 'optimasi',
      title: 'Custom Domain Auto-Redirect',
      description: 'Konfigurasi canonical URL dan otomatisasi perpindahan link dari URL lama Vercel ke domain baru kelasgue.vercel.app.'
    }
  ]
};
