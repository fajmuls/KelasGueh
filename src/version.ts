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
  version: '3.6.0',
  codename: 'Custom Domain Share & Overview Enhancement Edition',
  releaseDate: '2026-10-29',
  changes: [
    'Fitur Bagikan Link Portal Kelas (Custom Domain): Menambahkan tombol "Bagikan Link" di Navbar dan Ringkasan Kas (Overview) untuk menyalin tautan domain kustom aktif (misal https://kelasgue.vercel.app) secara 1-klik.',
    'Pratinjau Kartu Berbagi Interaktif: Dialog khusus berbagi dengan simulasi kartu WhatsApp (Logo HD 43KB, judul aplikasi, deskripsi serbaguna, dan tombol kirim pesan ke WhatsApp).',
    'Panduan Wildcard Redirect URL Supabase: Menambahkan instruksi pendaftaran https://*.vercel.app/** dan https://kelasgue.vercel.app/** di Supabase Redirect URLs agar login Google OAuth selalu berjalan mulus di semua domain Vercel.',
    'Optimasi Tampilan Overview: Penataan tombol aksi di Ringkasan Kas agar lebih rapi, modern, dan informatif saat dibagikan ke anggota kelas.'
  ],
  suggestedUpdates: [
    {
      category: 'fitur',
      title: 'Auto Generated QR Code Kelas',
      description: 'Fitur membuat kode QR gambar portal yang bisa dicetak dan ditempel di mading/papan tulis kelas untuk scan cepat lewat kamera HP siswa.'
    },
    {
      category: 'keamanan',
      title: 'Supabase Storage Bucket Lock',
      description: 'Membatasi hak upload foto nota di Supabase Storage khusus untuk akun bendahara/superadmin terdaftar.'
    },
    {
      category: 'optimasi',
      title: 'PWA Share Target Native',
      description: 'Dukungan menerima foto struk belanja langsung dari galeri HP atau grup WhatsApp ke aplikasi Kelas Gue via Android/iOS Share Sheet.'
    }
  ]
};
