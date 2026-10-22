# Integrasi Full Supabase Cloud, Responsive Mobile Navbar, Autoplay BGM & Pembaruan Brand Logo

Rencana implementasi integrasi database cloud Supabase reaktif, perbaikan tata letak topbar mobile tanpa overflow ke kanan, fitur pemutaran otomatis musik latar BGM pada interaksi pertama, serta pembaruan brand logo "Kelas Gue".

> [!IMPORTANT]
> **Keputusan Dikonfirmasi Pengguna:**
> 1. **Musik BGM Latar**: Diputar otomatis begitu pengguna mengetuk atau berinteraksi pertama kali dengan halaman aplikasi (sesuai kebijakan browser Web Audio API).
> 2. **Responsivitas Topbar Mobile**: Menerapkan menu lipat (collapsible hamburger) dan penataan tombol yang fleksibel (`flex-wrap`) agar tidak terpotong atau bergeser ke kanan pada layar smartphone.
> 3. **Integrasi Supabase & SQL Schema**: Menghubungkan SDK Supabase secara penuh (URL & Anon Key) dan menyediakan generator/eksekutor migrasi tabel Postgres RLS.

---

### 1. Overview & Core Concept

- **Tujuan Utama**: Menghubungkan aplikasi web Kelas Gue ke instance database Postgres Supabase secara permanen, memperbaiki tata letak navigasi mobile agar nyaman digunakan dari layar HP, menerapkan pemutaran musik BGM otomatis yang ramah browser, dan memperbarui logo visual aplikasi.
- **Pengguna Sasaran**: Bendahara kelas, Super Admin (`mrachmanfm@gmail.com`), serta seluruh anggota kelas yang mengakses buku kas dari laptop maupun smartphone.
- **Nilai Tambah**: Data keuangan kas tersimpan permanen di cloud Supabase, tampilan HP sangat responsif tanpa scroll horizontal yang mengganggu, dan atmosfer BGM langsung aktif saat pertama kali digunakan.

---

### 2. User Experience & Visual Design

#### A. Responsivitas Topbar Navigation (Desktop & Mobile)
- **Top Bar Contract**:
  - **Desktop ($\ge 768\text{px}$)**: Brand logo SVG + Nama Kelas $\rightarrow$ Tab Navigasi Single Line (Ringkasan, Buku Kas, Checklist, Pengaturan) $\rightarrow$ Aksi Profil & Kontrol Suara/BGM.
  - **Mobile ($< 768\text{px}$)**: Logo SVG "Kelas Gue" + Nama Kelas ringkas $\rightarrow$ Tombol Hamburger Toggle Menu & Tombol Aksi ringkas. Ketika menu dibuka, dropdown animasi halus menampilkan tab navigasi utama dan kontrol audio tanpa memotong layar ke kanan (`overflow-x-hidden`).

#### B. Autoplay Music BGM & Audio System
- **Autoplay Handling**: Memasang *global gesture listener* (`click`, `touchstart`, `keydown`) sehingga saat pengguna mengetuk bagian mana saja di layar aplikasi untuk pertama kali, musik latar BGM 60s santai otomatis memutar (*fade-in*) tanpa diblokir oleh kebijakan *browser autoplay policy*.

#### C. Visual Brand Logo Update
- **Logo Vektor Baru**: Memasang aset logo vektor SVG terbaru pada `DoodleNavbar`, `WelcomeScreen`, `AnimatedIntroScreen`, dan `PrintableBinderModal`.

---

### 3. Key Product Decisions & Trade-Offs

1. **Integrasi Supabase Realtime & Persistent Store**
   - *Pendekatan*: Mengisikan kredensial Supabase Project (`https://ireqpxgmlrsmcgidfthg.supabase.co` & Anon Key `sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV`) langsung ke dalam konfigurasi aplikasi dan menyediakan query migrasi DDL/DML di tab Pengaturan.
   - *Alasan*: Menjamin konektivitas database cloud Supabase berfungsi langsung pada preview maupun deployment Vercel.

2. **Perbaikan Touch Target & Layout Mobile**
   - *Pendekatan*: Memperluas area *hitbox* tombol minimal $44 \times 44\text{px}$ di HP dan menggunakan `max-w-full overflow-x-hidden` pada container utama agar tidak pernah bergeser ke kanan.

---

### 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           UI LAYER (React 19)                             │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌─────────────────┐  │
│  │     DoodleNavbar      │   │     KasBook       │   │  KasChecklist   │  │
│  │  (Mobile Responsive)  │   │   (Kamera OCR)    │   │ (Excel/WA Rem)  │  │
│  └───────────┬───────────┘   └─────────┬─────────┘   └────────┬────────┘  │
└──────────────│─────────────────────────│──────────────────────│───────────┘
               │                         │                      │
┌──────────────▼─────────────────────────▼──────────────────────▼───────────┐
│                      AUDIO & PERSISTENCE REPOSITORY                       │
│  ┌────────────────────────┐              ┌─────────────────────────────┐  │
│  │ SoundEngine (BGM Autoplay)            │   LocalKasRepository Sync   │  │
│  └────────────────────────┘              └──────────────┬──────────────┘  │
└─────────────────────────────────────────────────────────│─────────────────┘
                                                          │
                                         ┌────────────────▼────────────────┐
                                         │       SUPABASE CLOUD CLIENT     │
                                         │   - Realtime Broadcast          │
                                         │   - Auth & Storage (nota-kas)   │
                                         └─────────────────────────────────┘
```

#### Langkah-Langkah Eksekusi Pasca Persetujuan:
1. **Pembaruan Supabase Credentials & Init**: Pastikan `getSupabaseConfig` di `src/services/supabaseClient.ts` langsung membaca URL & Anon Key Supabase yang diberikan pengguna (`ireqpxgmlrsmcgidfthg.supabase.co`).
2. **Pembaruan Topbar Mobile di `DoodleNavbar.tsx`**:
   - Tambahkan state `isMobileMenuOpen`.
   - Bungkus tombol-tombol di header menggunakan `flex-wrap md:flex-nowrap` dan atur container utama dengan `max-w-full overflow-x-hidden`.
3. **Autoplay BGM di `soundEffects.ts` & `App.tsx`**:
   - Tambahkan *user gesture listener* otomatis yang memanggil `sfx.startBgm()` pada sentuhan/ketukan pertama pengguna.
4. **Pembaruan Logo Vektor SVG Terbaru**:
   - Pastikan komponen logo SVG menggunakan ikon vektor baru yang menarik.
5. **Verifikasi & Build**: Run `compile_applet` dan `lint_applet` untuk memastikan zero build errors.
