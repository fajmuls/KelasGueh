import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { api } from '../../../services/api.ts';
import { testFirestoreConnection, FirestoreConnectionResult } from '../../../services/firebase.ts';
import { RoleClaimApprovalPanel } from '../../Admin/RoleClaimApprovalPanel.tsx';
import { exportClassBackupJSON } from '../../../services/firestoreSync.ts';
import {
  Settings,
  Save,
  Download,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Tag,
  ShieldCheck,
  Send,
  Bell,
  MessageSquare,
  Bot,
  Zap,
  Globe,
  Smartphone,
  Layers,
  Plus,
  CalendarCheck,
  History,
  X,
  Database,
  RefreshCw,
  ExternalLink,
  FileJson,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { classInfo, setClassInfo, hasPermission, allUsers, switchUser, role, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: classInfo?.name || 'Teknik Informatika 2024 - Kelas A',
    code: classInfo?.code || 'TI-24A',
    semester: classInfo?.semester || 3,
    academic_year: classInfo?.academic_year || '2025/2026',
    department: classInfo?.department || 'Teknik Informatika',
    university: classInfo?.university || 'Universitas Sains & Teknologi',
    academic_advisor: classInfo?.academic_advisor || 'Dr. Ir. Hendra Wijaya, M.Kom.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // App version according to user instruction
  const APP_VERSION = 'v3.3.0';
  const BUILD_DATE = '10 September 2026 (Google Login First Flow, Restricted Class Editor to Super Admin, Zero-Friction Student Profile Selection & Clean Minimalist Online Status UI)';

  const PATCH_NOTES = [
    {
      version: 'v3.3.0',
      date: '10 September 2026',
      type: 'Google Login First Flow, Restricted Class Management & Clean Minimalist UI',
      notes: [
        'Alur Autentikasi Google di Awal: Pengguna melakukan login Google terlebih dahulu di layar awal sebelum diarahkan untuk memilih kelas perkuliahan.',
        'Akses Pengelolaan Kelas Khusus Super Admin: Tombol Tambah, Edit, dan Hapus kelas di layar selamat datang hanya dapat diakses oleh Super Admin (mrachmanfm@gmail.com). Pengguna biasa tidak memiliki akses manipulasi kelas.',
        'Masuk Kelas Cepat Tanpa Login Ulang: Setelah memilih kelas, mahasiswa tidak perlu login lagi—cukup memasukkan NIM / memilih profil dari 39 roster dan langsung masuk ke menu kelas.',
        'Penyederhanaan Status Online: Mengubah teks indikator koneksi yang panjang menjadi indikator bersih "Online" (titik hijau berkedip).',
        'Banner Approval Lebih Ramping: Format notifikasi persetujuan role yang lebih ringkas dan tidak memakan banyak ruang visual.',
      ]
    },
    {
      version: 'v3.2.0',
      date: '10 September 2026',
      type: 'Direct Google Login as Anggota, Onboarding Class & NIM Selector, Super Admin Class Editor on Splash',
      notes: [
        'Akses Langsung Masuk Portal: Setelah login Google dan memilih kelas serta NIM, mahasiswa langsung masuk ke menu portal sebagai Anggota Kelas dengan hak akses aman untuk melihat detail kelas.',
        'Alur Pengajuan & Persetujuan Role: Mahasiswa yang mengajukan jabatan pengurus (misal: Sekretaris atau Bendahara) langsung dapat menggunakan aplikasi sebagai Anggota, sementara pengajuan jabatannya menunggu approval Super Admin (mrachmanfm@gmail.com).',
        'Banner Status Role Pengajuan: Pemberitahuan status di bagian atas aplikasi yang menginformasikan bahwa permohonan role sedang ditinjau oleh Super Admin.',
        'Panel Kelola Kelas di Layar Selamat Datang: Super Admin dapat mengedit detail kelas (nama, kode, dosen wali, kapasitas) maupun menghapus kelas langsung dari splash screen awal.',
        'Tab Persetujuan Role di Modul Anggota: Memudahkan Super Admin menyetujui atau menolak permohonan role mahasiswa langsung dari menu Anggota maupun Pengaturan.',
        'Isolasi Data Cloud Firestore Terjamin: Struktur namespace database terpisah (/classify_users, /classes/cls_01sakp014, /roleClaimRequests) sehingga data perkuliahan tidak bercampur dengan data aplikasi kuis/pembelajaran.',
      ]
    },
    {
      version: 'v3.1.0',
      date: '10 September 2026',
      type: 'WhatsApp Billing, Dynamic QR Attendance, GPA Calculator, Academic Forum & Org Chart',
      notes: [
        'Notifikasi Otomatis Tagihan Kas via WhatsApp: Tombol broadcast tagihan massal untuk seluruh mahasiswa yang menunggak dan tombol tagih 1-klik perorangan dengan format pesan rincian iuran resmi.',
        'Kwitansi Digital PDF Pembayaran Kas: Ekspor dan cetak kwitansi resmi tanda terima pembayaran kas dengan konversi terbilang Rupiah dan tanggal bayar.',
        'Presensi QR Code Dinamis: Sistem presensi kuliah pintar dengan rotasi token 6 digit setiap 30 detik dan countdown timer real-time untuk mencegah titip absen.',
        'Pengingat Deadline Tugas (H-1 Push Notification): Deteksi otomatis tugas kuliah berjarak waktu kurang dari 24 jam dengan izin web browser Push Notification.',
        'Kalkulator Simulasi IPK & IPS Semester: Simulasi target perolehan nilai mata kuliah (A s/d E) dengan bobot SKS untuk menghitung proyeksi Indeks Prestasi dan predikat kelulusan (Cum Laude).',
        'Forum Tanya Jawab & Diskusi Kuliah: Papan diskusi terbuka per mata kuliah untuk pembahasan tugas, kisi-kisi UTS/UAS, dan rangkuman materi dengan fitur like serta tanggapan langsung.',
        'Bagan Struktur Organisasi Interaktif: Visualisasi hierarki kepengurusan kelas (Ketua, Wakil, Sekretaris, Bendahara, PJ Mata Kuliah) dilengkapi kontak WhatsApp dan rincian tupoksi.',
      ]
    },
    {
      version: 'v3.0.0',
      date: '10 September 2026',
      type: 'Portal Splash Screen, Master Passcode Auto-Approval & DB Isolation',
      notes: [
        'Layar Awal Splash Screen: Tampilan landing portal sebelum masuk kelas dengan pilihan profil cepat, statistik kelas, dan integrasi tombol Keluar Akun.',
        'Master Passcode Auto-Approval: Mahasiswa yang memasukkan kode pro (01SAKP014PRO) pada formulir Google login langsung terverifikasi otomatis tanpa approval manual.',
        'Isolasi Database Antar-Aplikasi: Koleksi Firestore terisolasi khusus (/classify_users dan /classes/cls_01sakp014) agar user ID dan profil tidak bercampur dengan aplikasi lain.',
        'Ekspor Laporan PDF & Excel: Dukungan cetak 1-klik untuk Notulensi Rapat, Laporan Kas Bulanan, dan Direktori Anggota Kelas.',
        'Penyempurnaan Hapus Data Real-time: Penghapusan instan tugas, agenda, notulensi rapat, dan pengumuman yang langsung ter-update di antarmuka pengguna.',
      ]
    },
    {
      version: 'v2.9.0',
      date: '10 September 2026',
      type: '01 SAKP 14 Engine, 39 Mahasiswa Template, Google NIM Claim & Unified Hub',
      notes: [
        'Template Default 01 SAKP 14: Inisialisasi paten kelas 01 SAKP 14 (S1 Akuntansi Perpajakan, FEB) dan 39 mahasiswa terdaftar langsung ke Cloud Firestore.',
        'Isolasi Data Multi-App: Memisahkan data roster kelas dari pengguna kuis aplikasi lain, menjamin daftar anggota kelas selalu menampilkan 39 mahasiswa kelas.',
        'Google Auth NIM & Pro Code Claim: Formulir pencocokan NIM dan pengajuan Kode Pro saat login akun Google untuk memverifikasi mahasiswa dan mempermudah approval oleh Ketua Kelas / Super Admin.',
        'Unified Announcements & Meetings Hub: Menyatukan modul Pengumuman Resmi dan Jadwal Rapat & Notulensi ke dalam satu pusat informasi terpadu dengan integrasi link Google Meet dan share WhatsApp 1-klik.',
        'Mobile Minimalist Polish: Tata letak antarmuka yang lebih rapi, compact, dan nyaman dioperasikan lewat smartphone dengan touch target optimal.',
      ]
    },
    {
      version: 'v2.8.1',
      date: '10 September 2026',
      type: 'Controlled Component React Sanitization & Console Cleanup',
      notes: [
        'Zero Controlled-to-Uncontrolled Warnings: Menjamin seluruh elemen input formulir (Tasks, Courses, Members, Agenda, Announcements, Finance, Settings, Role Claim, dan Setup Modals) memiliki fallback terdefinisi (|| "") sehingga React tidak pernah mengubah controlled component menjadi uncontrolled.',
        'Vite WebSocket Suppression: Penanganan komprehensif error [vite] dan WebSocket disconnection pada runtime interceptor untuk lingkungan sandboxed container.',
        'Resilient State Initialization: Sinkronisasi asinkron profil kelas, webhook bot config, dan form edit anggota dengan sanitasi data default.',
      ]
    },
    {
      version: 'v2.8.0',
      date: '10 September 2026',
      type: 'Class Manager Engine, Real-time Member Sync & Data Backup',
      notes: [
        'Class Manager Flow: Alur inisialisasi kelas untuk Super Admin (mrachmanfm@gmail.com) jika belum ada kelas terdeteksi di Firestore, lengkap dengan pemilihan Jurusan, Fakultas, dan Iuran.',
        'Real-time Firestore Member Sync: Sinkronisasi satu arah via onSnapshot pada koleksi /users, memastikan anggota baru dan login akun Google langsung tampil real-time di seluruh perangkat (AI Studio & Vercel).',
        'Vercel Data Parity: Menghubungkan clientFallback langsung ke Cloud Firestore agar data di Vercel sama persis dengan preview (tidak lagi 0 anggota).',
        'Header Online/Offline Badge: Indikator status real-time koneksi Firestore di header atas aplikasi dengan status pulsing.',
        'Ekspor Cadangan Data Kelas: Fitur unduh backup lengkap data kelas, anggota, transaksi kas, agenda, dan tugas dalam 1 file JSON offline.',
        'Zero WebSocket Noise: Penekanan error WebSocket/HMR pada log terminal dan browser.',
      ]
    },
    {
      version: 'v2.7.3',
      date: '9 September 2026',
      type: 'Firebase Service, Zero-404 Vercel & Schema Validation',
      notes: [
        'Firebase Service: Inisialisasi Firestore terpusat di src/lib/firebase.ts menggunakan konfigurasi firebase-applet-config.json dan ekspor instance db global.',
        'Fix HTTP 404 on Vercel: Penanganan cerdas Zero-Crash Hybrid Client Fallback sehingga aksi di web Vercel tidak lagi menghasilkan HTTP error 404 dan pembersihan log spam API.',
        'Profile Isolation: Penyimpanan profil di /users/{userId} menggunakan field spesifik Classify Pro (student_id, nim, class_role) dengan merge aman agar tidak menimpa data aplikasi kuis (quiz_stats, xp, rank).',
        'Schema Validation Rules: Penerapan validasi struktur dan payload anti-spam untuk koleksi test_packages, bank_soal, dan article_questions pada firestore.rules yang telah dideploy.',
      ]
    },
    {
      version: 'v2.7.2',
      date: '9 September 2026',
      type: 'Database Security & Multi-App Sync',
      notes: [
        'Firestore Rules: Integrasi aturan keamanan terpadu untuk 2 aplikasi dalam 1 project Firebase (Users, Sessions, Friend Requests, Benchmark Scores, Global Leaderboard, Test Packages, Bank Soal, Article Questions, Battles).',
        'Live Deployment: Aturan firestore.rules langsung dideploy dan disinkronkan ke server Cloud Firestore.',
        'Data Isolation: Pengamanan subkoleksi akun dan data belajar antar-aplikasi tanpa merusak akses Classify Pro.',
      ]
    },
    {
      version: 'v2.7.1',
      date: '9 September 2026',
      type: 'Bug Fix & Data Normalization',
      notes: [
        'Bug Fix: Mengatasi Uncaught TypeError: semesters.map is not a function dengan normalisasi response API dan defensive rendering.',
        'API Fix: Menambahkan dukungan multi-method (POST & PUT) pada rute pengaturan semester aktif backend.',
        'Data Resiliency: Fallback otomatis untuk mendeteksi data semester dalam bentuk array maupun nested object.',
      ]
    },
    {
      version: 'v2.7.0',
      date: '9 September 2026',
      type: 'Major QoL & UI Update',
      notes: [
        'UI/UX: Implementasi Dashboard Skeleton Screen dengan shimmering pulse realistis menggantikan spinner loading tradisional.',
        'QoL: Mekanisme Silent-Refresh Token Firebase & Session Persistence (localStorage caching) untuk mencegah logout mendadak saat sesi lama.',
        'Database: Integrasi Diagnostik Koneksi Cloud Firestore dan checklist panduan aktivasi Firebase Console interaktif.',
        'Architecture: Persiapan modularisasi backend API router guna mempercepat cold-start server.',
      ]
    },
    {
      version: 'v2.6.4',
      date: '6 September 2026',
      type: 'Improvements',
      notes: [
        'Memperbaiki masalah "kedap-kedip" (infinite loading loop) saat inisialisasi aplikasi.',
        'Peningkatan stabilitas sinkronisasi status antara Firebase dan Backend.',
        'Optimasi polling notifikasi untuk mengurangi beban server saat user belum login.',
      ]
    },
    {
      version: 'v2.6.3',
      date: '6 September 2026',
      type: 'Bug Fixes',
      notes: [
        'Meningkatkan ketahanan sistem terhadap error "Failed to fetch" saat startup.',
        'Penambahan logging mendalam pada sisi server untuk melacak kegagalan routing API.',
        'Optimalisasi pemuatan daftar mahasiswa pada modal klaim identitas.',
      ]
    },
    {
      version: 'v2.6.2',
      date: '6 September 2026',
      type: 'Bug Fixes',
      notes: [
        'Memperbaiki alur verifikasi identitas (Google Role Claim) yang tidak muncul saat login.',
        'Sinkronisasi field name antara frontend dan backend untuk klaim identitas.',
        'Peningkatan ketahanan AuthContext terhadap error 404 dari API.',
        'Penyaringan otomatis list mahasiswa agar tidak menampilkan Super Admin.',
      ]
    },
    {
      version: 'v2.6.1',
      date: '6 September 2026',
      type: 'Improvements',
      notes: [
        'Penambahan Authorized Domain Helper untuk mengatasi error domain Firebase.',
        'Fitur Login Bypass untuk pengujian cepat oleh Admin.',
      ]
    },
    {
      version: 'v2.6.0',
      date: '5 September 2026',
      type: 'Major Update',
      notes: [
        'Integrasi PWA (Progressive Web App) untuk akses offline.',
        'Modul Manajemen Semester dan Tahun Akademik.',
        'Peningkatan keamanan RBAC pada API endpoints.',
      ]
    }
  ];

  const [showPatchNotes, setShowPatchNotes] = useState(false);

  // Semester Management
  const [semesters, setSemesters] = useState<any[]>([]);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2026/2027');
  const [isAddingSemester, setIsAddingSemester] = useState(false);

  // Webhook and Bot Config State
  const [webhookConfig, setWebhookConfig] = useState({
    webhook_url: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    whatsapp_gateway_url: '',
    is_active: true,
    notify_announcements: true,
    notify_assignments: true,
    notify_kas_bills: true,
    notify_meetings: true,
  });
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);

  const [isRoleSwitcherActive, setIsRoleSwitcherActive] = useState<boolean>(() => {
    return localStorage.getItem('cms_show_role_switcher') === 'true';
  });

  // Cloud Firestore Diagnostics
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreConnectionResult | null>(null);
  const [isTestingFirestore, setIsTestingFirestore] = useState(false);

  const handleTestFirestore = async () => {
    setIsTestingFirestore(true);
    try {
      const res = await testFirestoreConnection();
      setFirestoreStatus(res);
    } catch (err: any) {
      setFirestoreStatus({
        connected: false,
        status: 'error',
        message: err?.message || 'Gagal menguji koneksi',
        projectId: 'fajmuls-learning',
        databaseId: '(default)',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTestingFirestore(false);
    }
  };

  useEffect(() => {
    loadWebhookSettings();
    loadSemesters();
    handleTestFirestore();
  }, []);

  useEffect(() => {
    if (classInfo) {
      setFormData({
        name: classInfo.name || '',
        code: classInfo.code || '',
        semester: classInfo.semester || 1,
        academic_year: classInfo.academic_year || '',
        department: classInfo.department || '',
        university: classInfo.university || '',
        academic_advisor: classInfo.academic_advisor || '',
      });
    }
  }, [classInfo]);

  const loadSemesters = async () => {
    try {
      const res = await api.getSemesters();
      if (Array.isArray(res)) {
        // Res is already an array
        const normalized = res.map((item: any, idx: number) => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id || `sem_${idx + 1}`,
              name: item.name || String(item),
              academic_year: item.academic_year || classInfo?.academic_year || '2026/2027',
              is_active: Boolean(item.is_active),
            };
          }
          return {
            id: `sem_${idx + 1}`,
            name: String(item),
            academic_year: classInfo?.academic_year || '2026/2027',
            is_active: String(item) === String(classInfo?.semester),
          };
        });
        setSemesters(normalized);
      } else if (res && typeof res === 'object' && Array.isArray((res as any).semesters)) {
        // Res is { semesters: [...], current_semester: ..., academic_year: ... }
        const rawList = (res as any).semesters;
        const currentSem = (res as any).current_semester || classInfo?.semester || '';
        const acYear = (res as any).academic_year || classInfo?.academic_year || '2026/2027';
        const normalized = rawList.map((item: any, idx: number) => {
          if (typeof item === 'object' && item !== null) {
            return {
              id: item.id || `sem_${idx + 1}`,
              name: item.name || String(item),
              academic_year: item.academic_year || acYear,
              is_active: Boolean(item.is_active) || item.name === currentSem,
            };
          }
          return {
            id: `sem_${idx + 1}`,
            name: String(item),
            academic_year: acYear,
            is_active: String(item) === String(currentSem),
          };
        });
        setSemesters(normalized);
      } else {
        setSemesters([]);
      }
    } catch (err) {
      console.error('Error loading semesters:', err);
      setSemesters([]);
    }
  };

  const handleSetActiveSemester = async (id: string) => {
    try {
      await api.setActiveSemester(id);
      await loadSemesters();
      const me = await api.getMe();
      if (me.classInfo) setClassInfo(me.classInfo);
      alert('Semester aktif berhasil diubah!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah semester aktif');
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName.trim()) return;
    try {
      setIsAddingSemester(true);
      await api.addSemester({
        name: newSemesterName.trim(),
        academic_year: newAcademicYear.trim(),
      });
      setNewSemesterName('');
      await loadSemesters();
      alert('Semester baru berhasil ditambahkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan semester');
    } finally {
      setIsAddingSemester(false);
    }
  };

  const loadWebhookSettings = async () => {
    try {
      const res = await api.getWebhookConfig();
      const cfg: any = res?.config;
      if (cfg) {
        setWebhookConfig({
          webhook_url: cfg.whatsapp_webhook_url || cfg.webhook_url || '',
          telegram_bot_token: cfg.telegram_bot_token || '',
          telegram_chat_id: cfg.telegram_chat_id || '',
          whatsapp_gateway_url: cfg.whatsapp_gateway_url || cfg.whatsapp_webhook_url || '',
          is_active: cfg.is_enabled ?? cfg.is_active ?? true,
          notify_announcements: cfg.events?.announcements ?? cfg.notify_announcements ?? true,
          notify_assignments: cfg.events?.assignment_deadline_h1 ?? cfg.notify_assignments ?? true,
          notify_kas_bills: cfg.events?.kas_bill ?? cfg.notify_kas_bills ?? true,
          notify_meetings: cfg.events?.meetings ?? cfg.notify_meetings ?? true,
        });
      }
    } catch (err) {
      console.error('Error loading webhook config:', err);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingWebhook(true);
      const payload: any = {
        whatsapp_webhook_url: webhookConfig.webhook_url || webhookConfig.whatsapp_gateway_url,
        telegram_bot_token: webhookConfig.telegram_bot_token,
        telegram_chat_id: webhookConfig.telegram_chat_id,
        is_enabled: webhookConfig.is_active,
        events: {
          announcements: webhookConfig.notify_announcements,
          assignment_deadline_h1: webhookConfig.notify_assignments,
          kas_bill: webhookConfig.notify_kas_bills,
          meetings: webhookConfig.notify_meetings,
        },
      };
      const res = await api.updateWebhookConfig(payload);
      const updated: any = res?.config;
      if (updated) {
        setWebhookConfig({
          webhook_url: updated.whatsapp_webhook_url || updated.webhook_url || webhookConfig.webhook_url,
          telegram_bot_token: updated.telegram_bot_token || webhookConfig.telegram_bot_token,
          telegram_chat_id: updated.telegram_chat_id || webhookConfig.telegram_chat_id,
          whatsapp_gateway_url: updated.whatsapp_webhook_url || webhookConfig.whatsapp_gateway_url,
          is_active: updated.is_enabled ?? webhookConfig.is_active,
          notify_announcements: updated.events?.announcements ?? webhookConfig.notify_announcements,
          notify_assignments: updated.events?.assignment_deadline_h1 ?? webhookConfig.notify_assignments,
          notify_kas_bills: updated.events?.kas_bill ?? webhookConfig.notify_kas_bills,
          notify_meetings: updated.events?.meetings ?? webhookConfig.notify_meetings,
        });
      }
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi webhook');
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true);
      const res = await api.testWebhook(
        '🔔 [TES SISTEM CMS] Integrasi Bot WhatsApp & Telegram Kelas berhasil terhubung! Notifikasi deadline dan kas siap disalurkan.'
      );
      alert('✓ Sinyal notifikasi webhook & bot berhasil dikirim! Silakan periksa log saluran komunikasi kelas.');
    } catch (err: any) {
      alert(err.message || 'Gagal menguji webhook');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleToggleRoleSwitcher = () => {
    const nextState = !isRoleSwitcherActive;
    setIsRoleSwitcherActive(nextState);
    localStorage.setItem('cms_show_role_switcher', String(nextState));
    window.dispatchEvent(new CustomEvent('cms-toggle-role-switcher', { detail: { show: nextState } }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateClassInfo(formData);
      setClassInfo(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDatabase = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(classInfo, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `Backup_ClassManagement_${classInfo?.code}_${new Date().toISOString().slice(0, 10)}.json`
    );
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Pengaturan Kelas, Bot & Versi Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi metadata kelas perkuliahan, integrasi bot notifikasi WhatsApp/Telegram, panel admin, serta pembaruan versi aplikasi.
        </p>
      </div>

      {/* App Version Card (Required by custom instruction) */}
      <div className="p-6 bg-[#0F172A] rounded-2xl text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Versi Terpasang
            </span>
            <span className="text-lg font-mono font-bold text-indigo-300">{APP_VERSION}</span>
            <button 
              onClick={() => setShowPatchNotes(true)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              Lihat Patch Notes
            </button>
            <span className="text-xs text-slate-400">({BUILD_DATE})</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Firebase: fajmuls-learning
            </span>
          </div>
          <h3 className="text-base font-bold text-white">Class Management System (CMS Pro 01SAKP014)</h3>
          <p className="text-xs text-slate-300">
            Dukungan PWA Offline, 8 Silabus Perkuliahan & Kontak Dosen, Otomatisasi Webhook/Bot, Payment Gateway VA/QRIS, dan Ekspor Kalender iCal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Sistem Up-to-Date
          </span>
        </div>
      </div>

      {/* Cloud Firestore Connectivity & Diagnostics Guide Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Status Koneksi Cloud Firestore & Panduan Firebase Web
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                  fajmuls-learning
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan status konektivitas database Cloud Firestore dan petunjuk konfigurasi di Firebase Console.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTestingFirestore ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menguji Koneksi...
              </span>
            ) : firestoreStatus?.status === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terhubung Langsung
              </span>
            ) : firestoreStatus?.status === 'permission_denied' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Database Aktif (Rules Berjalan)
              </span>
            ) : firestoreStatus?.status === 'not_found' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Database Belum Dibuat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" /> Mode Standby
              </span>
            )}

            <button
              type="button"
              onClick={handleTestFirestore}
              disabled={isTestingFirestore}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirestore ? 'animate-spin' : ''}`} />
              <span>Uji Ulang</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Message */}
        {firestoreStatus && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
              firestoreStatus.status === 'connected' || firestoreStatus.status === 'permission_denied'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : firestoreStatus.status === 'not_found'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{firestoreStatus.message}</p>
              {firestoreStatus.details && (
                <p className="text-[11px] font-mono opacity-80 break-all">{firestoreStatus.details}</p>
              )}
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions for Firebase Web Console */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Langkah yang Harus Dilakukan di Firebase Web Console:</span>
            </h4>
            <a
              href="https://console.firebase.google.com/project/fajmuls-learning/firestore"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 underline underline-offset-2"
            >
              <span>Buka Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <span className="font-bold text-slate-800">Buat Database Cloud Firestore</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Di menu <strong>Build &gt; Firestore Database</strong>, klik tombol <strong>"Create Database"</strong> jika database belum ada. Pilih Database ID: <code>(default)</code> dan Region yang terdekat (contoh: <code>asia-southeast2</code> Jakarta atau <code>asia-southeast1</code> Singapura).
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <span className="font-bold text-slate-800">Publish Security Rules</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Buka tab <strong>Rules</strong> di Firestore Database. Pastikan aturan keamanan mengizinkan user terautentikasi (aturan lengkap telah kami buatkan di file <code>firestore.rules</code> pada proyek ini).
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <span className="font-bold text-slate-800">Otorisasi Domain Web (Auth)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Di menu <strong>Authentication &gt; Settings &gt; Authorized Domains</strong>, pastikan domain host Cloud Run (<code>ais-dev-t6ocsfpygutqt3ojgdzst4-10827594519.asia-southeast1.run.app</code>) telah ditambahkan ke daftar izin.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  4
                </span>
                <span className="font-bold text-slate-800">Uji Ulang Koneksi</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Setelah database Firestore dibuat dan Rules di-publish, klik tombol <strong>"Uji Ulang"</strong> di atas. Status akan berubah menjadi hijau menandakan koneksi realtime siap digunakan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook WhatsApp / Telegram Integration Panel */}
      <form
        onSubmit={handleSaveWebhook}
        className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Integrasi Webhook & Bot Notifikasi (WhatsApp / Telegram)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirimkan pemberitahuan otomatis ke grup kelas saat ada pengumuman, pengingat deadline H-1 tugas, dan tagihan kas baru.
            </p>
          </div>

          {webhookSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Konfigurasi Bot Tersimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              WhatsApp Gateway / Webhook URL (Fonnte / Wablas / Discord / Custom)
            </label>
            <input
              type="text"
              placeholder="https://api.fonnte.com/send atau webhook URL"
              value={webhookConfig.webhook_url || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, webhook_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Telegram Bot Token (dari @BotFather)
            </label>
            <input
              type="password"
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={webhookConfig.telegram_bot_token || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, telegram_bot_token: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Telegram Chat ID Grup / Channel Kelas
            </label>
            <input
              type="text"
              placeholder="-1001234567890 atau @GrupKelas01SAKP014"
              value={webhookConfig.telegram_chat_id || ''}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, telegram_chat_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Status Bot Notifikasi
            </label>
            <div className="flex items-center gap-2 h-10">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookConfig.is_active}
                  onChange={(e) => setWebhookConfig({ ...webhookConfig, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {webhookConfig.is_active ? 'Bot Aktif' : 'Bot Dinonaktifkan'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Triggers checkboxes */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">Pemicu Otomatisasi (Triggers):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_announcements}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_announcements: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Pengumuman Baru Diterbitkan</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_assignments}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_assignments: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Tugas Kuliah & Pengingat Deadline H-1</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_kas_bills}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_kas_bills: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Penerbitan Tagihan Kas & Bukti Kas Baru</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={webhookConfig.notify_meetings}
                onChange={(e) =>
                  setWebhookConfig({ ...webhookConfig, notify_meetings: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium">Jadwal Rapat Kelas & Notulen</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isTestingWebhook ? 'Mengirim Sinyal...' : 'Kirim Uji Coba Webhook'}</span>
          </button>

          <button
            type="submit"
            disabled={isSavingWebhook}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingWebhook ? 'Menyimpan...' : 'Simpan Konfigurasi Bot'}</span>
          </button>
        </div>
      </form>

      {/* Form Settings Identitas Kelas */}
      <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Identitas & Profil Kelas Perkuliahan</h3>
            <p className="text-xs text-slate-500">Informasi ini tampil pada seluruh modul dan kop dokumen resmi</p>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Perubahan berhasil disimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Kelas</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Kelas / Singkatan</label>
            <input
              type="text"
              required
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester Berjalan</label>
            <input
              type="number"
              min={1}
              max={14}
              value={formData.semester ?? 1}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Akademik</label>
            <input
              type="text"
              value={formData.academic_year || ''}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jurusan / Program Studi</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Perguruan Tinggi / Universitas</label>
            <input
              type="text"
              value={formData.university || ''}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Dosen Wali / Pembimbing Akademik (DPA)</label>
            <input
              type="text"
              value={formData.academic_advisor || ''}
              onChange={(e) => setFormData({ ...formData, academic_advisor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportDatabase}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Metadata Backup (JSON)
          </button>

          {hasPermission('manage_system_settings') ? (
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              *Hanya Ketua Kelas & Super Admin yang berhak merubah identitas kelas.
            </span>
          )}
        </div>
      </form>

      {/* Super Admin Google Account Role Approval Panel */}
      {(isSuperAdmin || hasPermission('assign_role')) && (
        <RoleClaimApprovalPanel />
      )}

      {/* Semester & Academic Year Management */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Kelola Semester & Tahun Akademik
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur semester yang sedang aktif berjalan dan tambahkan semester baru untuk jadwal perkuliahan.
            </p>
          </div>
        </div>

        {/* Semesters list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.isArray(semesters) && semesters.length > 0 ? (
            semesters.map((sem) => (
              <div
                key={sem.id || sem.name}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  sem.is_active
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{sem.name}</span>
                    {sem.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        Aktif Sekarang
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">Tahun: {sem.academic_year}</p>
                </div>

                {!sem.is_active && (
                  <button
                    type="button"
                    onClick={() => handleSetActiveSemester(sem.id || sem.name)}
                    className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Jadikan Semester Aktif
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Belum ada data semester atau sedang dimuat...
            </div>
          )}
        </div>

        {/* Add semester form */}
        {hasPermission('manage_system_settings') && (
          <form
            onSubmit={handleAddSemester}
            className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Semester Baru
              </label>
              <input
                type="text"
                placeholder="Contoh: Semester 2 (Genap)"
                value={newSemesterName || ''}
                onChange={(e) => setNewSemesterName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Akademik
              </label>
              <input
                type="text"
                placeholder="Contoh: 2026/2027"
                value={newAcademicYear || ''}
                onChange={(e) => setNewAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingSemester}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingSemester ? 'Menambahkan...' : 'Tambah Semester'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Admin Panel: Mode Uji Peran & Developer Tools */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Panel Kontrol Admin & Mode Uji Peran</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bilah pengujian peran disembunyikan secara default di tampilan awal mahasiswa. Anda dapat mengaktifkannya di sini untuk pengujian hak akses RBAC.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleRoleSwitcher}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isRoleSwitcherActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{isRoleSwitcherActive ? '✓ Bilah Uji Peran: Aktif' : 'Tampilkan Bilah Uji Peran'}</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Beralih Persona Langsung (Quick Switch Admin):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { roleKey: 'role_superadmin', label: 'Super Admin', name: 'Dr. Hendra' },
              { roleKey: 'role_ketua', label: 'Ketua Kelas', name: 'Aditya Pratama' },
              { roleKey: 'role_bendahara', label: 'Bendahara', name: 'Siti Rahmawati' },
              { roleKey: 'role_anggota', label: 'Mahasiswa', name: 'Rian Hidayat' },
            ].map((persona) => {
              const targetUser = allUsers.find(u => u.role_id === persona.roleKey);
              const isActive = role?.id === persona.roleKey;
              return (
                <button
                  key={persona.roleKey}
                  type="button"
                  onClick={() => targetUser && switchUser(targetUser.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-[11px] text-slate-400 font-normal">{persona.label}</p>
                  <p className="font-semibold text-slate-900 truncate">{persona.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backup & Cadangan Data Offline (User Request) */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cadangan Data Kelas Offline (JSON Backup)
              </h3>
              <p className="text-xs text-slate-500">
                Ekspor seluruh data kelas, anggota, transaksi kas, agenda, dan tugas ke dalam 1 file cadangan offline.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExportingBackup}
            onClick={async () => {
              try {
                setIsExportingBackup(true);
                await exportClassBackupJSON(classInfo, allUsers);
              } catch (err) {
                console.error('Backup error:', err);
                alert('Gagal mengunduh cadangan data.');
              } finally {
                setIsExportingBackup(false);
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExportingBackup ? 'Menyiapkan Cadangan...' : 'Download Cadangan Data Kelas'}
          </button>
        </div>
      </div>

      {/* Saran Update & Pembaruan Sistem (User Instruction) */}
      <div className="p-6 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Saran Pengembangan & Rekomendasi Pembaruan Aplikasi Berikutnya
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Berikut adalah rekomendasi peningkatan fungsional dan teknis yang telah dianalisis untuk mendukung kelancaran operasional kelas perkuliahan:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> AI Auto-Summary Notulen Rapat & Tugas (Gemini)
            </h4>
            <p className="text-[11px] text-slate-600">
              Menghasilkan ringkasan notulen rapat secara otomatis dan mengkonversi hasil diskusi menjadi to-do list tugas kelas siap bagi.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Presensi Kelas QR Code Dinamis & Geofencing
            </h4>
            <p className="text-[11px] text-slate-600">
              Membuat kode QR presensi yang berganti setiap 10 detik dengan validasi radius lokasi GPS ruangan kuliah kampus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Direct Sync Google Drive & Multi-File Upload
            </h4>
            <p className="text-[11px] text-slate-600">
              Integrasi Google Picker API untuk memilih file makalah/tugas langsung dari cloud drive tanpa harus copy-paste tautan manual.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Notifikasi WhatsApp Otomatis H-1 Deadline
            </h4>
            <p className="text-[11px] text-slate-600">
              Pengiriman pengingat berkala ke grup WhatsApp kelas pada H-1 jam 19:00 WIB untuk setiap tugas yang belum diserahkan.
            </p>
          </div>
        </div>
      </div>
      {/* Patch Notes Modal */}
      {showPatchNotes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catatan Rilis (Patch Notes)</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Riwayat Pembaruan Sistem</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {PATCH_NOTES.map((patch) => (
                <div key={patch.version} className="relative pl-6 border-l-2 border-slate-100 space-y-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{patch.version}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">{patch.type}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">{patch.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {patch.notes.map((note, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowPatchNotes(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

