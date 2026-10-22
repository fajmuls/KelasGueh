import {
  User,
  Role,
  Permission,
  PermissionCode,
  ClassInfo,
  Transaction,
  TransactionCategory,
  Bill,
  Payment,
  EventItem,
  Announcement,
  Meeting,
  TaskItem,
  DocumentItem,
  Poll,
  AttendanceRecord,
  NotificationItem,
  AuditLog,
  Course,
  CourseAssignment,
  AssignmentSubmission,
  CourseSyllabus,
  WebhookConfig,
  WebhookLog,
  PaymentGatewayConfig,
  RoleClaimRequest,
  KasCollectionColumn,
  KasChecklistEntry,
} from '../../src/types/index.ts';

// Standard granular permissions catalog
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Dashboard
  { id: 'p_dash_view', code: 'view_dashboard', category: 'Dashboard', name: 'Lihat Dashboard', description: 'Dapat melihat ringkasan dashboard sesuai rolenya' },
  // Members
  { id: 'p_mem_view', code: 'view_members', category: 'Members', name: 'Lihat Anggota', description: 'Melihat direktori dan profil anggota kelas' },
  { id: 'p_mem_create', code: 'create_members', category: 'Members', name: 'Tambah Anggota', description: 'Menambahkan mahasiswa baru ke dalam kelas' },
  { id: 'p_mem_edit', code: 'edit_members', category: 'Members', name: 'Edit Anggota', description: 'Mengubah data mahasiswa dan kontak' },
  { id: 'p_mem_del', code: 'delete_members', category: 'Members', name: 'Hapus/Nonaktifkan Anggota', description: 'Menonaktifkan status keanggotaan mahasiswa' },
  { id: 'p_mem_role', code: 'assign_role', category: 'Members', name: 'Atur Role Mahasiswa', description: 'Mengganti atau memberikan role kepada anggota' },
  // Courses & Assignments
  { id: 'p_crs_view', code: 'view_courses', category: 'Courses', name: 'Lihat Mata Kuliah & Tugas', description: 'Melihat daftar 8 mata kuliah dan tugas perkuliahan' },
  { id: 'p_crs_create', code: 'create_courses', category: 'Courses', name: 'Kelola Data Mata Kuliah', description: 'Menambahkan atau mengedit mata kuliah & dosen' },
  { id: 'p_crs_assign', code: 'manage_assignments', category: 'Courses', name: 'Buat & Kelola Tugas Matkul', description: 'Menerbitkan tugas dan memeriksa pengumpulan mahasiswa' },
  { id: 'p_crs_submit', code: 'submit_assignments', category: 'Courses', name: 'Kumpulkan Tugas (Link/Drive)', description: 'Mengumpulkan link Google Drive / tugas perkuliahan' },
  // Finance
  { id: 'p_fin_view', code: 'view_finance', category: 'Finance', name: 'Akses Manajemen Keuangan', description: 'Membuka modul kas dan buku besar keuangan' },
  { id: 'p_fin_trans_c', code: 'create_transaction', category: 'Finance', name: 'Catat Transaksi', description: 'Membuat transaksi kas masuk/keluar baru' },
  { id: 'p_fin_trans_e', code: 'edit_transaction', category: 'Finance', name: 'Edit Transaksi', description: 'Mengubah keterangan atau data transaksi' },
  { id: 'p_fin_trans_d', code: 'delete_transaction', category: 'Finance', name: 'Hapus Transaksi', description: 'Membatalkan atau menghapus transaksi kas' },
  { id: 'p_fin_bill_c', code: 'create_bill', category: 'Finance', name: 'Buat Tagihan Kas', description: 'Menerbitkan tagihan rutin / iuran otomatis' },
  { id: 'p_fin_pay_m', code: 'manage_payments', category: 'Finance', name: 'Verifikasi Pembayaran', description: 'Mengubah status bayar dan mencatat konfirmasi transfer' },
  { id: 'p_fin_rep_v', code: 'view_financial_report', category: 'Finance', name: 'Lihat Laporan Keuangan', description: 'Melihat neraca kas lengkap dan riwayat audit' },
  { id: 'p_fin_rep_x', code: 'export_financial_report', category: 'Finance', name: 'Export Laporan Kas', description: 'Mengunduh laporan kas dalam bentuk Excel/CSV/PDF' },
  { id: 'p_fin_transp', code: 'view_transparency', category: 'Finance', name: 'Lihat Transparansi Kas', description: 'Melihat saldo umum kas dan ringkasan pengeluaran' },
  // Agenda
  { id: 'p_age_view', code: 'view_agenda', category: 'Agenda', name: 'Lihat Agenda', description: 'Melihat jadwal kuliah, ujian, dan acara' },
  { id: 'p_age_create', code: 'create_agenda', category: 'Agenda', name: 'Buat Agenda', description: 'Menambahkan jadwal atau agenda baru' },
  { id: 'p_age_edit', code: 'edit_agenda', category: 'Agenda', name: 'Edit Agenda', description: 'Mengubah rincian agenda' },
  { id: 'p_age_del', code: 'delete_agenda', category: 'Agenda', name: 'Hapus Agenda', description: 'Menghapus jadwal dari kalender' },
  // Announcements
  { id: 'p_ann_view', code: 'view_announcements', category: 'Announcements', name: 'Lihat Pengumuman', description: 'Membaca pengumuman kelas' },
  { id: 'p_ann_create', code: 'create_announcements', category: 'Announcements', name: 'Buat Pengumuman', description: 'Menerbitkan pengumuman baru' },
  { id: 'p_ann_edit', code: 'edit_announcements', category: 'Announcements', name: 'Edit Pengumuman', description: 'Mengubah teks atau pin pengumuman' },
  { id: 'p_ann_del', code: 'delete_announcements', category: 'Announcements', name: 'Hapus Pengumuman', description: 'Menghapus postingan pengumuman' },
  // Meetings
  { id: 'p_meet_view', code: 'view_meetings', category: 'Meetings', name: 'Lihat Rapat & Notulen', description: 'Melihat jadwal rapat dan hasil notulensi' },
  { id: 'p_meet_create', code: 'create_meetings', category: 'Meetings', name: 'Buat Rapat', description: 'Menjadwalkan agenda rapat kelas' },
  { id: 'p_meet_min', code: 'edit_minutes', category: 'Meetings', name: 'Tulis & Edit Notulen', description: 'Menyusun hasil rapat dan action items' },
  // Tasks
  { id: 'p_tsk_view', code: 'view_tasks', category: 'Tasks', name: 'Lihat Task', description: 'Melihat penugasan kelas dan PIC' },
  { id: 'p_tsk_create', code: 'create_tasks', category: 'Tasks', name: 'Buat Task', description: 'Membagikan tugas baru kepada anggota' },
  { id: 'p_tsk_edit', code: 'edit_tasks', category: 'Tasks', name: 'Edit Task', description: 'Mengubah status, deadline, atau prioritas task' },
  { id: 'p_tsk_del', code: 'delete_tasks', category: 'Tasks', name: 'Hapus Task', description: 'Menghapus penugasan' },
  // Documents
  { id: 'p_doc_view', code: 'view_documents', category: 'Documents', name: 'Akses Repositori Dokumen', description: 'Membuka dan mengunduh berkas kelas' },
  { id: 'p_doc_upload', code: 'upload_documents', category: 'Documents', name: 'Upload Dokumen', description: 'Mengunggah materi, surat, atau LPJ' },
  { id: 'p_doc_del', code: 'delete_documents', category: 'Documents', name: 'Hapus Dokumen', description: 'Menghapus berkas dari arsip kelas' },
  // Polls
  { id: 'p_pol_view', code: 'view_polls', category: 'Polls', name: 'Lihat Polling', description: 'Melihat jajak pendapat kelas' },
  { id: 'p_pol_create', code: 'create_polls', category: 'Polls', name: 'Buat Polling', description: 'Membuat voting baru' },
  { id: 'p_pol_vote', code: 'vote_polls', category: 'Polls', name: 'Berikan Suara (Voting)', description: 'Berpartisipasi dalam pemungutan suara' },
  // Attendance
  { id: 'p_att_view', code: 'view_attendance', category: 'Attendance', name: 'Lihat Absensi', description: 'Melihat daftar kehadiran kelas' },
  { id: 'p_att_manage', code: 'manage_attendance', category: 'Attendance', name: 'Kelola Absensi', description: 'Mencatat presensi mahasiswa atau QR scan' },
  // Reports
  { id: 'p_rep_view', code: 'view_reports', category: 'Reports', name: 'Lihat Laporan Komprehensif', description: 'Melihat laporan gabungan kas, absensi, & task' },
  { id: 'p_rep_export', code: 'export_reports', category: 'Reports', name: 'Export Laporan', description: 'Mengunduh laporan kelas' },
  // System & RBAC
  { id: 'p_sys_role', code: 'manage_roles', category: 'System', name: 'Kelola Role', description: 'Membuat dan mengatur peran kustom' },
  { id: 'p_sys_perm', code: 'manage_permissions', category: 'System', name: 'Kelola Permission', description: 'Memberikan izin granular kepada setiap role' },
  { id: 'p_sys_audit', code: 'view_audit_logs', category: 'System', name: 'Lihat Audit Trail', description: 'Memeriksa rekam jejak aktivitas sensitif' },
  { id: 'p_sys_set', code: 'manage_system_settings', category: 'System', name: 'Kelola Pengaturan Sistem', description: 'Mengatur profil kelas, notifikasi, dan backup' },
];

export class Database {
  classInfo: ClassInfo;
  roles: Role[] = [];
  users: User[] = [];
  courses: Course[] = [];
  syllabuses: CourseSyllabus[] = [];
  assignments: CourseAssignment[] = [];
  submissions: AssignmentSubmission[] = [];
  categories: TransactionCategory[] = [];
  transactions: Transaction[] = [];
  bills: Bill[] = [];
  payments: Payment[] = [];
  events: EventItem[] = [];
  announcements: Announcement[] = [];
  readReceipts: { id: string; announcement_id: string; user_id: string; read_at: string }[] = [];
  meetings: Meeting[] = [];
  tasks: TaskItem[] = [];
  documents: DocumentItem[] = [];
  polls: Poll[] = [];
  pollVotes: { id: string; poll_id: string; option_id: string; user_id: string; voted_at: string }[] = [];
  attendances: AttendanceRecord[] = [];
  notifications: NotificationItem[] = [];
  auditLogs: AuditLog[] = [];
  webhookConfig!: WebhookConfig;
  webhookLogs: WebhookLog[] = [];
  paymentGatewayConfig!: PaymentGatewayConfig;
  roleClaimRequests: RoleClaimRequest[] = [];
  kasColumns: KasCollectionColumn[] = [];
  kasEntries: KasChecklistEntry[] = [];
  semesters: string[] = [
    'Semester 1 (Ganjil)',
    'Semester 2 (Genap)',
    'Semester 3 (Ganjil)',
    'Semester 4 (Genap)',
    'Semester 5 (Ganjil)',
    'Semester 6 (Genap)',
    'Semester 7 (Ganjil)',
    'Semester 8 (Genap)',
  ];

  constructor() {
    this.classInfo = {
      id: 'cls_01sakp014',
      name: 'Kelas Manajer 01SAKP014',
      code: '01SAKP014',
      academic_year: '2026/2027',
      semester: 'Semester 1 (Ganjil)',
      major: 'S1 Akuntansi',
      faculty: 'Fakultas Ekonomi dan Bisnis',
      description: 'Kelas perkuliahan Program Studi S1 Akuntansi Kelas 01SAKP014.',
      monthly_dues_amount: 20000,
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-09-06T08:00:00Z',
    };

    this.seedRoles();
    this.seedUsers();
    this.seedCourses();
    this.seedSyllabuses();
    this.seedCategories();
    this.seedFinance();
    this.seedKasTable();
    this.seedEvents();
    this.seedAnnouncements();
    this.seedMeetings();
    this.seedTasks();
    this.seedDocuments();
    this.seedPolls();
    this.seedAttendance();
    this.seedNotifications();
    this.seedInitialAudit();
    this.seedWebhook();
    this.seedPaymentGateway();
  }

  // --- SEEDERS ---
  private seedRoles() {
    const allPermissions = SYSTEM_PERMISSIONS.map(p => p.code);

    this.roles = [
      {
        id: 'role_superadmin',
        name: 'Super Admin',
        description: 'Akses penuh ke seluruh konfigurasi, database, audit, dan hak akses',
        is_system: true,
        permissions: [...allPermissions],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_ketua',
        name: 'Ketua Kelas',
        description: 'Kepemimpinan kelas, delegasi tugas, approval keputusan, dan pemantauan administrasi',
        is_system: true,
        permissions: [
          'view_dashboard',
          'view_members',
          'create_members',
          'edit_members',
          'assign_role',
          'view_finance',
          'view_financial_report',
          'export_financial_report',
          'view_transparency',
          'view_agenda',
          'create_agenda',
          'edit_agenda',
          'delete_agenda',
          'view_announcements',
          'create_announcements',
          'edit_announcements',
          'delete_announcements',
          'view_meetings',
          'create_meetings',
          'edit_minutes',
          'view_tasks',
          'create_tasks',
          'edit_tasks',
          'delete_tasks',
          'view_documents',
          'upload_documents',
          'delete_documents',
          'view_polls',
          'create_polls',
          'vote_polls',
          'view_attendance',
          'manage_attendance',
          'view_reports',
          'export_reports',
          'view_audit_logs',
        ],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_wakil',
        name: 'Wakil Ketua',
        description: 'Membantu ketua dalam koordinasi operasional kelas, agenda, rapat, dan penugasan',
        is_system: true,
        permissions: [
          'view_dashboard',
          'view_members',
          'edit_members',
          'view_finance',
          'view_transparency',
          'view_agenda',
          'create_agenda',
          'edit_agenda',
          'view_announcements',
          'create_announcements',
          'view_meetings',
          'create_meetings',
          'edit_minutes',
          'view_tasks',
          'create_tasks',
          'edit_tasks',
          'view_documents',
          'upload_documents',
          'view_polls',
          'create_polls',
          'vote_polls',
          'view_attendance',
          'manage_attendance',
          'view_reports',
        ],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_bendahara',
        name: 'Bendahara',
        description: 'Pengelola penuh modul keuangan, buku kas, penagihan iuran, dan verifikasi transfer',
        is_system: true,
        permissions: [
          'view_dashboard',
          'view_members',
          'view_finance',
          'create_transaction',
          'edit_transaction',
          'delete_transaction',
          'create_bill',
          'manage_payments',
          'view_financial_report',
          'export_financial_report',
          'view_transparency',
          'view_agenda',
          'view_announcements',
          'create_announcements',
          'view_meetings',
          'view_tasks',
          'edit_tasks',
          'view_documents',
          'upload_documents',
          'view_polls',
          'vote_polls',
          'view_reports',
          'export_reports',
        ],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_sekretaris',
        name: 'Sekretaris',
        description: 'Pengelola arsip surat, dokumen materi, notulen rapat, agenda kalender, dan pengumuman',
        is_system: true,
        permissions: [
          'view_dashboard',
          'view_members',
          'view_transparency',
          'view_agenda',
          'create_agenda',
          'edit_agenda',
          'delete_agenda',
          'view_announcements',
          'create_announcements',
          'edit_announcements',
          'delete_announcements',
          'view_meetings',
          'create_meetings',
          'edit_minutes',
          'view_tasks',
          'create_tasks',
          'edit_tasks',
          'view_documents',
          'upload_documents',
          'delete_documents',
          'view_polls',
          'create_polls',
          'vote_polls',
          'view_attendance',
          'manage_attendance',
          'view_reports',
          'export_reports',
        ],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_anggota',
        name: 'Anggota',
        description: 'Mahasiswa kelas dengan akses ke informasi esensial, kas mandiri, tugas, dan materi',
        is_system: true,
        permissions: [
          'view_dashboard',
          'view_transparency',
          'view_agenda',
          'view_announcements',
          'view_meetings',
          'view_tasks',
          'view_documents',
          'view_polls',
          'vote_polls',
          'view_attendance',
        ],
        created_at: '2024-09-01T00:00:00Z',
        updated_at: '2024-09-01T00:00:00Z',
      },
      {
        id: 'role_koordinator_acara',
        name: 'Koordinator Acara',
        description: 'Custom Role: Bertanggung jawab atas penyelenggaraan acara makrab dan studi banding',
        is_system: false,
        permissions: [
          'view_dashboard',
          'view_members',
          'view_transparency',
          'view_agenda',
          'create_agenda',
          'edit_agenda',
          'view_announcements',
          'create_announcements',
          'view_meetings',
          'create_meetings',
          'view_tasks',
          'create_tasks',
          'edit_tasks',
          'view_documents',
          'upload_documents',
          'view_polls',
          'create_polls',
          'vote_polls',
          'view_attendance',
        ],
        created_at: '2025-01-10T10:00:00Z',
        updated_at: '2025-01-10T10:00:00Z',
      },
    ];
  }

  private seedUsers() {
    const rawMembers: Array<{
      id: string;
      name: string;
      nim: string;
      email: string;
      phone: string;
      role_id: string;
      position: string;
      avatar: string;
    }> = [
      {
        id: 'usr_member_01',
        name: 'ADELTRUDIS AEK',
        nim: '261011201667',
        email: '261011201667@students.ac.id',
        phone: '081234567001',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_02',
        name: 'ADRIAN PERMANA',
        nim: '261011201636',
        email: '261011201636@students.ac.id',
        phone: '081234567002',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_03',
        name: 'AGUNG PRATAMA',
        nim: '261011201552',
        email: '261011201552@students.ac.id',
        phone: '081234567003',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_04',
        name: 'AISNA FELIA FAISAL',
        nim: '261011201226',
        email: '261011201226@students.ac.id',
        phone: '081234567004',
        role_id: 'role_sekretaris',
        position: 'Sekretaris Kelas',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_05',
        name: 'ALYDA MU`TAMARO',
        nim: '261011201195',
        email: '261011201195@students.ac.id',
        phone: '081234567005',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_06',
        name: 'ALYSHA RAMADHANI',
        nim: '261011201633',
        email: '261011201633@students.ac.id',
        phone: '081234567006',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_07',
        name: 'ANJELICA ESTHERTITA .K. RANTE',
        nim: '261011201190',
        email: '261011201190@students.ac.id',
        phone: '081234567007',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_08',
        name: 'AURA NANDHA MAULYDIA SUHARI',
        nim: '261011201589',
        email: '261011201589@students.ac.id',
        phone: '081234567008',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_09',
        name: 'CHARISSA PUTRI RABBANY',
        nim: '261011201517',
        email: '261011201517@students.ac.id',
        phone: '081234567009',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_10',
        name: 'CINTIA FEBRIONA',
        nim: '261011201472',
        email: '261011201472@students.ac.id',
        phone: '081234567010',
        role_id: 'role_bendahara',
        position: 'Bendahara Utama',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_11',
        name: 'DAVA VANEZA',
        nim: '261011201683',
        email: '261011201683@students.ac.id',
        phone: '081234567011',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_12',
        name: 'DHAFI IAN FADHILA',
        nim: '261011201257',
        email: '261011201257@students.ac.id',
        phone: '081234567012',
        role_id: 'role_wakil',
        position: 'Wakil Ketua Kelas',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_13',
        name: 'DWI NUR SYAFITRI',
        nim: '261011201500',
        email: '261011201500@students.ac.id',
        phone: '081234567013',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_14',
        name: 'FAIZ AKBAR DWITAMA',
        nim: '261011201443',
        email: '261011201443@students.ac.id',
        phone: '081234567014',
        role_id: 'role_koordinator_acara',
        position: 'Koordinator Acara & Kegiatan',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_15',
        name: 'FATIMAH AZ ZAHRA',
        nim: '261011201197',
        email: '261011201197@students.ac.id',
        phone: '081234567015',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_16',
        name: 'HAFIZ HUDDIN MUTHI`ARRASYID',
        nim: '261011201571',
        email: '261011201571@students.ac.id',
        phone: '081234567016',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_17',
        name: 'HALIMAH',
        nim: '261011201397',
        email: '261011201397@students.ac.id',
        phone: '081234567017',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_18',
        name: 'HUMAIROH AZZAHRO',
        nim: '261011201602',
        email: '261011201602@students.ac.id',
        phone: '081234567018',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_19',
        name: 'KHALIPA AZKIA',
        nim: '261011201287',
        email: '261011201287@students.ac.id',
        phone: '081234567019',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_20',
        name: 'LAURA GRANITA',
        nim: '261011201345',
        email: '261011201345@students.ac.id',
        phone: '081234567020',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_21',
        name: 'LINGGA JULIANTI',
        nim: '261011201514',
        email: '261011201514@students.ac.id',
        phone: '081234567021',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_22',
        name: 'MILA CATUR ANGGRAENI',
        nim: '261011201648',
        email: '261011201648@students.ac.id',
        phone: '081234567022',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_23',
        name: 'MUHAMAD FAHRUL',
        nim: '261011201604',
        email: '261011201604@students.ac.id',
        phone: '081234567023',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_24',
        name: 'MUHAMMAD IKSAN TAUFIK',
        nim: '261011201787',
        email: '261011201787@students.ac.id',
        phone: '081234567024',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_25',
        name: 'MUHAMMAD RACHMAN FAJRI MULIYANSAH',
        nim: '261011201412',
        email: 'mrachmanfm@gmail.com',
        phone: '081234567412',
        role_id: 'role_superadmin',
        position: 'Super Admin & Ketua Kelas',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_26',
        name: 'MUTIARA KASIH',
        nim: '261011201372',
        email: '261011201372@students.ac.id',
        phone: '081234567026',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_27',
        name: 'PERITHA ALMAIRA',
        nim: '261011201440',
        email: '261011201440@students.ac.id',
        phone: '081234567027',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_28',
        name: 'RAYYAN FAYRUZ AKBAR',
        nim: '261011201554',
        email: '261011201554@students.ac.id',
        phone: '081234567028',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_29',
        name: 'REGINA CAHYANI',
        nim: '261011201243',
        email: '261011201243@students.ac.id',
        phone: '081234567029',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_30',
        name: 'RIYANA HUTARI',
        nim: '261011201312',
        email: '261011201312@students.ac.id',
        phone: '081234567030',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_31',
        name: 'SAKINAH OKTAVIANI',
        nim: '261011201214',
        email: '261011201214@students.ac.id',
        phone: '081234567031',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_32',
        name: 'SASKYIA EMALIA DAULAY',
        nim: '261011201428',
        email: '261011201428@students.ac.id',
        phone: '081234567032',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_33',
        name: 'SYIFA NAFATUL ULYA',
        nim: '261011201670',
        email: '261011201670@students.ac.id',
        phone: '081234567033',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_34',
        name: 'SYLVA LESTARI',
        nim: '261011201205',
        email: '261011201205@students.ac.id',
        phone: '081234567034',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_35',
        name: 'THALITA IZZATI HUMAIRA',
        nim: '261011201187',
        email: '261011201187@students.ac.id',
        phone: '081234567035',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_36',
        name: 'VERLITA RAHMADANI',
        nim: '261011201183',
        email: '261011201183@students.ac.id',
        phone: '081234567036',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_37',
        name: 'VEYSEL RAHMA NAFIAH',
        nim: '261011201563',
        email: '261011201563@students.ac.id',
        phone: '081234567037',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_38',
        name: 'YOSHINA NAURA',
        nim: '261011201664',
        email: '261011201664@students.ac.id',
        phone: '081234567038',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
      },
      {
        id: 'usr_member_39',
        name: 'ZASKIYA AULIA ARAHMA',
        nim: '261011201261',
        email: '261011201261@students.ac.id',
        phone: '081234567039',
        role_id: 'role_anggota',
        position: 'Anggota',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
      },
    ];

    this.users = rawMembers.map(m => {
      const role = this.roles.find(r => r.id === m.role_id);
      return {
        id: m.id,
        name: m.name,
        nim: m.nim,
        email: m.email,
        phone: m.phone,
        avatar: m.avatar,
        class_id: this.classInfo.id,
        department: this.classInfo.major,
        cohort: '2026',
        role_id: m.role_id,
        role_name: role ? role.name : 'Anggota',
        position: m.position,
        is_active: true,
        joined_at: '2026-09-01T08:00:00Z',
        created_at: '2026-09-01T08:00:00Z',
        updated_at: '2026-09-05T08:00:00Z',
      };
    });
  }

  private seedCategories() {
    this.categories = [
      { id: 'cat_kas_rutin', name: 'Kas Rutin Bulanan', type: 'income', icon: 'coins', color: 'emerald' },
      { id: 'cat_sponsor', name: 'Sponsorship / Donasi', type: 'income', icon: 'hand-heart', color: 'blue' },
      { id: 'cat_dana_usaha', name: 'Dana Usaha (Danus)', type: 'income', icon: 'store', color: 'amber' },
      { id: 'cat_konsumsi', name: 'Konsumsi Rapat / Acara', type: 'expense', icon: 'utensils', color: 'rose' },
      { id: 'cat_print', name: 'Fotokopi & ATK Kelas', type: 'expense', icon: 'printer', color: 'indigo' },
      { id: 'cat_perlengkapan', name: 'Sewa & Perlengkapan', type: 'expense', icon: 'box', color: 'violet' },
      { id: 'cat_makrab', name: 'Biaya Makrab / Outing', type: 'expense', icon: 'tent', color: 'teal' },
      { id: 'cat_social', name: 'Uang Santunan & Sosial', type: 'expense', icon: 'gift', color: 'orange' },
    ];
  }

  private seedCourses() {
    this.courses = [
      {
        id: 'crs_01',
        code: 'TID101',
        name: 'Teknologi Informasi Dasar',
        sks: 2,
        lecturer_name: 'Fitria Eka Ningsih',
        lecturer_phone: '085714379298',
        schedule_day: 'Senin',
        schedule_time: '08:00 - 09:40 WIB',
        room: 'Lab Komputer 401',
        description: 'Mata kuliah dasar pengenalan teknologi informasi, literasi komputer, pemanfaatan software perkantoran, dan komputasi akuntansi modern.',
        color: 'blue',
      },
      {
        id: 'crs_02',
        code: 'MEB102',
        name: 'Matematika Ekonomi dan Bisnis',
        sks: 3,
        lecturer_name: 'Setianingsih',
        lecturer_phone: '081299169858',
        schedule_day: 'Senin',
        schedule_time: '10:00 - 12:30 WIB',
        room: 'Ruang 402',
        description: 'Konsep matematis terapan dalam analisis ekonomi, fungsi penerimaan, biaya, elastisitas, diferensial dan matriks.',
        color: 'emerald',
      },
      {
        id: 'crs_03',
        code: 'ECO103',
        name: 'Economics',
        sks: 3,
        lecturer_name: 'Wiwik Hesbiyah An',
        lecturer_phone: '081213357425',
        schedule_day: 'Selasa',
        schedule_time: '08:00 - 10:30 WIB',
        room: 'Ruang 305',
        description: 'Prinsip-prinsip dasar ekonomi mikro dan makro, struktur pasar, inflasi, kebijakan fiskal, dan moneter.',
        color: 'purple',
      },
      {
        id: 'crs_04',
        code: 'PAN104',
        name: 'Pancasila',
        sks: 2,
        lecturer_name: 'Maman Darmansyah',
        lecturer_phone: '087731927082',
        schedule_day: 'Selasa',
        schedule_time: '10:50 - 12:30 WIB',
        room: 'Ruang 305',
        description: 'Pendidikan ideologi kebangsaan, nilai-nilai moral Pancasila, etika sosial, dan integritas profesional.',
        color: 'rose',
      },
      {
        id: 'crs_05',
        code: 'AGI105',
        name: 'Agama Islam',
        sks: 2,
        lecturer_name: 'Adam Sugiarto',
        lecturer_phone: '085215855131',
        schedule_day: 'Rabu',
        schedule_time: '08:00 - 09:40 WIB',
        room: 'Ruang 201',
        description: 'Pemahaman nilai-nilai ketauhidan, akhlak mulia, fiqih muamalah, serta etika bisnis Islami.',
        color: 'amber',
      },
      {
        id: 'crs_06',
        code: 'ENG106',
        name: 'Basic English for International Communication',
        sks: 2,
        lecturer_name: 'Jutania',
        lecturer_phone: '087873950662',
        schedule_day: 'Rabu',
        schedule_time: '10:00 - 11:40 WIB',
        room: 'Ruang 204',
        description: 'Penguasaan komunikasi bahasa Inggris praktis, korespondensi formal, presentasi bisnis, dan istilah akuntansi internasional.',
        color: 'indigo',
      },
      {
        id: 'crs_07',
        code: 'APJ107',
        name: 'Akuntansi Perusahaan Jasa dan Dagang',
        sks: 3,
        lecturer_name: 'Wiwit Irawati',
        lecturer_phone: '08128002843',
        schedule_day: 'Kamis',
        schedule_time: '08:00 - 10:30 WIB',
        room: 'Ruang 410',
        description: 'Siklus lengkap akuntansi jasa dan dagang: penjurnalan, buku besar, neraca saldo, ayat jurnal penyesuaian, laporan keuangan, dan jurnal penutup.',
        color: 'teal',
      },
      {
        id: 'crs_08',
        code: 'PMB108',
        name: 'Principle of Management and Business',
        sks: 3,
        lecturer_name: 'Muhammad Rizal Seragih',
        lecturer_phone: '085212433585',
        schedule_day: 'Kamis',
        schedule_time: '10:50 - 13:20 WIB',
        room: 'Ruang 410',
        description: 'Fungsi-fungsi manajemen operasional (POAC), kepemimpinan organisasi, dinamika lingkungan bisnis, dan etika korporasi.',
        color: 'cyan',
      },
    ];
    this.assignments = [];
    this.submissions = [];
  }

  private seedSyllabuses() {
    this.syllabuses = [
      {
        id: 'syl_01',
        course_id: 'crs_01',
        course_name: 'Teknologi Informasi Dasar',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_TID',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_TID_Materi',
        assessment_criteria: { attendance: 10, tasks: 20, uts: 30, uas: 40 },
        meetings: [
          { meeting_no: 1, topic: 'Pengantar Sistem Komputer & Hardware/Software', subtopics: ['Arsitektur Komputer', 'Perangkat Input & Output', 'Sistem Operasi'], learning_outcome: 'Mahasiswa memahami komponen inti perangkat keras dan lunak komputer modern.' },
          { meeting_no: 2, topic: 'Aplikasi Spreadsheet Excel untuk Akuntansi', subtopics: ['Formula Matematika & Statistik', 'Lookup Functions (VLOOKUP/XLOOKUP)', 'Pivot Table'], learning_outcome: 'Mampu mengolah data tabel keuangan dan menyusun formula spreadsheet.' },
          { meeting_no: 3, topic: 'Database Manajemen & SQL Sederhana', subtopics: ['Konsep Entitas & Relasi', 'Query SELECT Dasar', 'Data Integrity'], learning_outcome: 'Memahami dasar penyimpanan data terstruktur.' },
          { meeting_no: 4, topic: 'Cloud Computing & Sistem Informasi Akuntansi Modern', subtopics: ['SaaS, PaaS, IaaS', 'Keamanan Data & Privasi', 'ERP Terintegrasi'], learning_outcome: 'Memahami integrasi cloud pada sistem pelaporan keuangan.' },
        ],
      },
      {
        id: 'syl_02',
        course_id: 'crs_02',
        course_name: 'Matematika Ekonomi dan Bisnis',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_MEB',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_MEB_Materi',
        assessment_criteria: { attendance: 10, tasks: 25, uts: 30, uas: 35 },
        meetings: [
          { meeting_no: 1, topic: 'Fungsi Linier & Keseimbangan Pasar', subtopics: ['Fungsi Permintaan & Penawaran', 'Titik Keseimbangan (Equilibrium)', 'Pengaruh Pajak & Subsidi'], learning_outcome: 'Mampu menentukan titik keseimbangan pasar kuantitatif.' },
          { meeting_no: 2, topic: 'Fungsi Non-Linier dalam Bisnis', subtopics: ['Fungsi Kuadrat', 'Kurva Penerimaan Total (TR)', 'Kurva Biaya Total (TC)'], learning_outcome: 'Mampu menganalisis titik impas (Break Even Point).' },
          { meeting_no: 3, topic: 'Diferensial / Turunan Parsial', subtopics: ['Konsep Elastisitas Harga', 'Optimalisasi Laba Maksimum', 'Biaya Marjinal (MC)'], learning_outcome: 'Mampu menghitung tingkat laba maksimum menggunakan turunan.' },
          { meeting_no: 4, topic: 'Matriks & Aljabar Linier Terapan', subtopics: ['Operasi Matriks', 'Determinan & Invers', 'Penyelesaian SPL Bisnis'], learning_outcome: 'Mampu menyelesaikan sistem persamaan ekonomi multivariat.' },
        ],
      },
      {
        id: 'syl_03',
        course_id: 'crs_03',
        course_name: 'Economics',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_ECO',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_ECO_Materi',
        assessment_criteria: { attendance: 10, tasks: 20, uts: 35, uas: 35 },
        meetings: [
          { meeting_no: 1, topic: 'Dasar Ilmu Ekonomi & Kelangkaan (Scarcity)', subtopics: ['Opportunity Cost', 'Prinsip Ekonomi', 'Batas Kemungkinan Produksi (PPF)'], learning_outcome: 'Memahami prinsip alokasi sumber daya terbatas.' },
          { meeting_no: 2, topic: 'Teori Permintaan, Penawaran & Elastisitas', subtopics: ['Hukum Permintaan & Penawaran', 'Faktor Penggeser Kurva', 'Elastisitas Permintaan'], learning_outcome: 'Mampu memproyeksikan pergeseran harga dan kuantitas pasar.' },
          { meeting_no: 3, topic: 'Struktur Pasar & Penetapan Harga', subtopics: ['Pasar Persaingan Sempurna', 'Monopoli & Oligopoli', 'Monopolistik'], learning_outcome: 'Memahami perilaku produsen dalam berbagai struktur industri.' },
          { meeting_no: 4, topic: 'Makroekonomi: Pendapatan Nasional & Inflasi', subtopics: ['PDB (GDP/GNP)', 'Indeks Harga Konsumen (IHK)', 'Kebijakan Moneter BI'], learning_outcome: 'Memahami indikator makroekonomi agregat nasional.' },
        ],
      },
      {
        id: 'syl_04',
        course_id: 'crs_04',
        course_name: 'Pancasila',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_PAN',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_PAN_Materi',
        assessment_criteria: { attendance: 15, tasks: 25, uts: 30, uas: 30 },
        meetings: [
          { meeting_no: 1, topic: 'Pancasila dalam Arus Sejarah Bangsa', subtopics: ['Perumusan Piagam Jakarta', 'Sidang BPUPKI & PPKI', 'Dinamika Era Kemerdekaan'], learning_outcome: 'Memahami latar historis lahirnya falsafah bangsa.' },
          { meeting_no: 2, topic: 'Pancasila Sebagai Sistem Etika Profesi', subtopics: ['Integritas Moral', 'Keadilan Sosial Akuntan', 'Pencegahan Korupsi'], learning_outcome: 'Menerapkan integritas etis dalam dunia profesi dan akademik.' },
        ],
      },
      {
        id: 'syl_05',
        course_id: 'crs_05',
        course_name: 'Agama Islam',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_AGI',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_AGI_Materi',
        assessment_criteria: { attendance: 15, tasks: 25, uts: 30, uas: 30 },
        meetings: [
          { meeting_no: 1, topic: 'Tauhid & Akhlak Mulia dalam Kehidupan Mahasiswa', subtopics: ['Konsep Aqidah', 'Akhlak Terhadap Sesama', 'Kejujuran Intelektual'], learning_outcome: 'Membangun karakter berakhlak mulia dan berintegritas.' },
          { meeting_no: 2, topic: 'Prinsip Fiqih Muamalah & Etika Bisnis Syariah', subtopics: ['Akad Keuangan (Mudharabah/Musyarakah)', 'Larangan Riba & Gharar', 'Zakat Bisnis'], learning_outcome: 'Memahami prinsip transaksi syariah yang adil dan transparan.' },
        ],
      },
      {
        id: 'syl_06',
        course_id: 'crs_06',
        course_name: 'Basic English for International Communication',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_ENG',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_ENG_Materi',
        assessment_criteria: { attendance: 10, tasks: 30, uts: 30, uas: 30 },
        meetings: [
          { meeting_no: 1, topic: 'Professional Self-Introduction & Networking', subtopics: ['Academic Introductions', 'Email Etiquette', 'Elevator Pitch'], learning_outcome: 'Able to introduce professional profile fluently in English.' },
          { meeting_no: 2, topic: 'Financial & Accounting Terminology', subtopics: ['Balance Sheet Vocabulary', 'Income Statement Terms', 'Asset & Liability Expressions'], learning_outcome: 'Mastering international financial terminology.' },
          { meeting_no: 3, topic: 'Delivering Business Presentations', subtopics: ['Signposting Phrases', 'Explaining Graphs & Trends', 'Handling Q&A Sessions'], learning_outcome: 'Able to deliver a structured financial report presentation.' },
        ],
      },
      {
        id: 'syl_07',
        course_id: 'crs_07',
        course_name: 'Akuntansi Perusahaan Jasa dan Dagang',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_APJ',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_APJ_Materi',
        assessment_criteria: { attendance: 10, tasks: 25, uts: 30, uas: 35 },
        meetings: [
          { meeting_no: 1, topic: 'Persamaan Dasar Akuntansi & Bukti Transaksi', subtopics: ['Harta = Utang + Modal', 'Analisis Bukti Kas Masuk/Keluar', 'Faktur & Kuitansi'], learning_outcome: 'Mampu menganalisis pengaruh transaksi terhadap posisi keuangan.' },
          { meeting_no: 2, topic: 'Jurnal Umum & Posting Buku Besar', subtopics: ['Aturan Debit/Kredit', 'Pembuatan Jurnal Umum', 'Buku Besar T & Skontro'], learning_outcome: 'Terampil melakukan pencatatan jurnal berpasangan.' },
          { meeting_no: 3, topic: 'Neraca Saldo & Ayat Jurnal Penyesuaian (AJP)', subtopics: ['Beban Dibayar Dimuka', 'Pendapatan Diterima Dimuka', 'Penyusutan Aset Tetap'], learning_outcome: 'Mampu menyusun penyesuaian akhir periode.' },
          { meeting_no: 4, topic: 'Kertas Kerja (Neraca Lajur 10 Kolom) & Laporan Keuangan', subtopics: ['Laba Rugi', 'Perubahan Ekuitas', 'Neraca / Posisi Keuangan', 'Jurnal Penutup'], learning_outcome: 'Mampu menyusun laporan keuangan lengkap dan jurnal penutup.' },
        ],
      },
      {
        id: 'syl_08',
        course_id: 'crs_08',
        course_name: 'Principle of Management and Business',
        academic_year: '2026/2027',
        semester: 'Semester 1',
        rps_document_url: 'https://drive.google.com/drive/folders/01SAKP014_RPS_PMB',
        drive_folder_url: 'https://drive.google.com/drive/folders/01SAKP014_PMB_Materi',
        assessment_criteria: { attendance: 10, tasks: 20, uts: 35, uas: 35 },
        meetings: [
          { meeting_no: 1, topic: 'Konsep Dasar Manajemen & Lingkungan Bisnis', subtopics: ['Evolusi Teori Manajemen', 'Lingkungan Internal & Eksternal', 'Etika Bisnis'], learning_outcome: 'Memahami peran manajer dan ekosistem industri.' },
          { meeting_no: 2, topic: 'Perencanaan (Planning) & Pengambilan Keputusan', subtopics: ['Visi & Misi Organisasi', 'Analisis SWOT', 'Manajemen Strategis'], learning_outcome: 'Mampu merumuskan sasaran dan strategi operasional.' },
          { meeting_no: 3, topic: 'Pengorganisasian (Organizing) & Struktur Perusahaan', subtopics: ['Hierarki Organisasi', 'Pendelegasian Wewenang', 'Desain Kerja'], learning_outcome: 'Mampu merancang struktur tim yang efektif.' },
          { meeting_no: 4, topic: 'Pengarahan (Actuating) & Pengendalian (Controlling)', subtopics: ['Gaya Kepemimpinan', 'Motivasi Karyawan', 'Key Performance Indicators (KPI)'], learning_outcome: 'Memahami teknik supervisi dan evaluasi performa kerja.' },
        ],
      },
    ];
  }

  private seedWebhook() {
    this.webhookConfig = {
      id: 'cfg_webhook_default',
      whatsapp_webhook_url: 'https://api.fonnte.com/send',
      telegram_bot_token: '',
      telegram_chat_id: '',
      is_enabled: true,
      events: {
        announcements: true,
        assignment_deadline_h1: true,
        kas_bill: true,
        meetings: true,
      },
      last_triggered_at: new Date().toISOString(),
    };
    this.webhookLogs = [
      {
        id: 'log_01',
        event: 'Sistem Dimulai',
        target: 'both',
        payload_summary: 'Inisialisasi webhook bot pengingat kelas 01SAKP014 aktif.',
        status: 'simulated',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private seedPaymentGateway() {
    this.paymentGatewayConfig = {
      provider: 'simulated',
      is_active: true,
      merchant_id: 'MID-01SAKP014-FEB',
      client_key: 'SB-Mid-client-01SAKP014-LIVE',
      server_key: 'SB-Mid-server-01SAKP014-SECRET',
      enable_va_bca: true,
      enable_va_mandiri: true,
      enable_va_bri: true,
      enable_va_bni: true,
      enable_qris: true,
    };
  }

  // Dispatch Webhook to WhatsApp / Telegram
  async dispatchWebhook(event: string, title: string, message: string, details?: any) {
    const log: WebhookLog = {
      id: `wlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event,
      target: 'both',
      payload_summary: `[${event}] ${title}: ${message.slice(0, 100)}...`,
      status: 'simulated',
      timestamp: new Date().toISOString(),
    };

    // If Telegram is configured, try real HTTP dispatch
    if (this.webhookConfig.telegram_bot_token && this.webhookConfig.telegram_chat_id) {
      try {
        const text = `📢 *[01SAKP014 • ${event}]*\n*${title}*\n\n${message}\n\n_Sistem Administrasi Kelas 01SAKP014_`;
        await fetch(`https://api.telegram.org/bot${this.webhookConfig.telegram_bot_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.webhookConfig.telegram_chat_id,
            text,
            parse_mode: 'Markdown',
          }),
        });
        log.status = 'success';
      } catch (err) {
        log.status = 'failed';
      }
    }

    this.webhookLogs.unshift(log);
    if (this.webhookLogs.length > 50) this.webhookLogs.pop();
    this.webhookConfig.last_triggered_at = new Date().toISOString();
    return log;
  }


  private seedFinance() {
    this.transactions = [];
    this.bills = [];
    this.payments = [];
  }

  private seedKasTable() {
    this.kasColumns = [
      {
        id: 'col_kas_minggu_1',
        title: 'Kas Minggu 1 Sep 2026',
        date: '2026-09-01',
        amount: 5000,
        period_type: 'weekly',
        created_by: 'usr_member_25',
        created_at: '2026-09-01T08:00:00Z',
      },
      {
        id: 'col_kas_minggu_2',
        title: 'Kas Minggu 2 Sep 2026',
        date: '2026-09-08',
        amount: 5000,
        period_type: 'weekly',
        created_by: 'usr_member_25',
        created_at: '2026-09-06T08:00:00Z',
      },
      {
        id: 'col_kas_harian_01',
        title: 'Kas Harian 6 Sep 2026',
        date: '2026-09-06',
        amount: 2000,
        period_type: 'daily',
        created_by: 'usr_member_25',
        created_at: '2026-09-06T08:00:00Z',
      },
    ];

    this.kasEntries = [];
    for (const col of this.kasColumns) {
      for (const user of this.users) {
        this.kasEntries.push({
          id: `ke_${col.id}_${user.id}`,
          column_id: col.id,
          user_id: user.id,
          user_name: user.name,
          user_nim: user.nim,
          is_paid: false,
          paid_amount: col.amount,
          updated_by: 'System',
        });
      }
    }
  }

  private seedEvents() {
    this.events = [];
  }

  private seedAnnouncements() {
    this.announcements = [];
  }

  private seedMeetings() {
    this.meetings = [];
  }

  private seedTasks() {
    this.tasks = [];
  }

  private seedDocuments() {
    this.documents = [];
  }

  private seedPolls() {
    this.polls = [];
    this.pollVotes = [];
  }

  private seedAttendance() {
    this.attendances = [];
  }

  private seedNotifications() {
    this.notifications = [];
  }

  private seedInitialAudit() {
    this.auditLogs = [];
  }

  // --- LEDGER & FINANCE ENGINE ---
  // Guarantees balance is mathematically calculated from non-deleted transactions
  calculateFinanceSummary(): {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    monthlyIncome: number;
    paidMembersCount: number;
    unpaidMembersCount: number;
    recentTransactions: Transaction[];
    monthlyChart: { month: string; income: number; expense: number }[];
  } {
    const activeTxs = this.transactions.filter(t => !t.deleted_at);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of activeTxs) {
      if (t.type === 'income') totalIncome += t.amount;
      else if (t.type === 'expense') totalExpense += t.amount;
      else if (t.type === 'refund') totalIncome += t.amount;
    }

    const balance = totalIncome - totalExpense;

    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyIncome = activeTxs
      .filter(t => t.type === 'income' && t.created_at.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const paidMembersCount = this.payments.filter(p => p.status === 'paid').length;
    const unpaidMembersCount = this.payments.filter(p => p.status === 'unpaid' || p.status === 'pending').length;

    const recentTransactions = [...activeTxs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 10);

    const monthlyChart = [
      { month: 'Jun', income: 0, expense: 0 },
      { month: 'Jul', income: 0, expense: 0 },
      { month: 'Agt', income: 0, expense: 0 },
      { month: 'Sep', income: 0, expense: 0 },
    ];

    return {
      balance,
      totalIncome,
      totalExpense,
      monthlyIncome,
      paidMembersCount,
      unpaidMembersCount,
      recentTransactions,
      monthlyChart,
    };
  }

  // Helper for audit logging
  logAudit(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: Record<string, any> | null;
    newValue?: Record<string, any> | null;
    ip?: string;
  }) {
    const user = this.users.find(u => u.id === params.userId);
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      class_id: this.classInfo.id,
      user_id: params.userId,
      user_name: user ? `${user.name} (${user.role_name})` : 'System',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      ip_address: params.ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // Push notification helper
  pushNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationItem['type'];
    link?: string;
  }) {
    const notif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
  }
}

// Global Singleton in runtime
export const db = new Database();
