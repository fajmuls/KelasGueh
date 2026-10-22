import {
  User,
  Role,
  PermissionCode,
  ClassInfo,
  Transaction,
  Bill,
  EventItem,
  Announcement,
  TaskItem,
  Course,
} from '../types/index.ts';
import { saveClassifyUserProfile } from '../lib/firebase.ts';
import { DEFAULT_CLASS_01SAKP014, TEMPLATE_39_STUDENTS } from './firestoreSync.ts';

// Storage helper with safe try-catch
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(`cms_store_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`cms_store_${key}`, JSON.stringify(val));
  } catch {
    // quota exceeded or disabled
  }
}

// Initial Class Info
const INITIAL_CLASS_INFO: ClassInfo = DEFAULT_CLASS_01SAKP014;

const ALL_PERMISSIONS: PermissionCode[] = [
  'view_dashboard', 'view_members', 'create_members', 'edit_members', 'delete_members', 'assign_role',
  'view_courses', 'create_courses', 'manage_assignments', 'submit_assignments',
  'view_finance', 'create_transaction', 'edit_transaction', 'delete_transaction', 'create_bill', 'manage_payments', 'view_financial_report', 'export_financial_report', 'view_transparency',
  'view_agenda', 'create_agenda', 'edit_agenda', 'delete_agenda',
  'view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements',
  'view_meetings', 'create_meetings', 'edit_minutes',
  'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
  'view_documents', 'upload_documents', 'delete_documents',
  'view_polls', 'create_polls', 'vote_polls',
  'view_attendance', 'manage_attendance',
  'view_reports', 'export_reports',
  'manage_roles', 'manage_permissions', 'view_audit_logs', 'manage_system_settings'
];

const INITIAL_ROLES: Role[] = [
  {
    id: 'role_superadmin',
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh konfigurasi, database, audit, dan hak akses',
    is_system: true,
    permissions: [...ALL_PERMISSIONS],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_ketua',
    name: 'Ketua Kelas',
    description: 'Kepemimpinan kelas, delegasi tugas, approval keputusan, dan pemantauan administrasi',
    is_system: true,
    permissions: ALL_PERMISSIONS.filter(p => !p.startsWith('manage_roles')),
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_wakil',
    name: 'Wakil Ketua Kelas',
    description: 'Membantu kepemimpinan kelas, koordinasi absensi, dan monitoring kegiatan',
    is_system: true,
    permissions: ALL_PERMISSIONS.filter(p => !p.startsWith('manage_roles') && !p.startsWith('delete_')),
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_sekretaris',
    name: 'Sekretaris',
    description: 'Pencatatan notulensi rapat, absensi, persuratan, dan agenda perkuliahan',
    is_system: true,
    permissions: [
      'view_dashboard', 'view_members', 'create_members', 'edit_members',
      'view_agenda', 'create_agenda', 'edit_agenda', 'delete_agenda',
      'view_announcements', 'create_announcements', 'edit_announcements',
      'view_meetings', 'create_meetings', 'edit_minutes',
      'view_tasks', 'create_tasks', 'edit_tasks',
      'view_documents', 'upload_documents',
      'view_polls', 'create_polls', 'vote_polls',
      'view_attendance', 'manage_attendance',
      'view_reports', 'export_reports',
    ] as PermissionCode[],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_bendahara',
    name: 'Bendahara',
    description: 'Pengelolaan keuangan kas kelas, penagihan, konfirmasi pembayaran, dan neraca kas',
    is_system: true,
    permissions: [
      'view_dashboard', 'view_members', 'view_finance', 'create_transaction',
      'edit_transaction', 'create_bill', 'manage_payments', 'view_financial_report',
      'export_financial_report', 'view_transparency', 'view_announcements'
    ] as PermissionCode[],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_koordinator_acara',
    name: 'Koordinator Acara',
    description: 'Koordinasi kegiatan kelas, pertemuan, dan perayaan bersama',
    is_system: true,
    permissions: [
      'view_dashboard', 'view_members', 'view_agenda', 'create_agenda', 'edit_agenda',
      'view_announcements', 'create_announcements', 'view_meetings', 'create_meetings',
      'view_tasks', 'create_tasks', 'view_polls', 'vote_polls',
    ] as PermissionCode[],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'role_anggota',
    name: 'Anggota Kelas',
    description: 'Mahasiswa aktif kelas dengan akses membaca informasi, kas, tugas, dan agenda perkuliahan',
    is_system: true,
    permissions: [
      'view_dashboard', 'view_members', 'view_courses', 'submit_assignments',
      'view_finance', 'view_transparency', 'view_agenda', 'view_announcements',
      'view_meetings', 'view_tasks', 'view_documents', 'view_polls', 'vote_polls',
      'view_attendance'
    ] as PermissionCode[],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

const INITIAL_USERS: User[] = TEMPLATE_39_STUDENTS;


const INITIAL_COURSES: Course[] = [
  { id: 'crs_01', code: 'AKT101', name: 'Pengantar Akuntansi 1', sks: 3, lecturer_name: 'Dr. Hendra Wijaya, M.Ak., Ak., CA', lecturer_phone: '081122334455', schedule_day: 'Senin', schedule_time: '08:00 - 10:30', room: 'R. 402 Gedung FEB', color: '#2563eb' },
  { id: 'crs_02', code: 'MNJ102', name: 'Pengantar Manajemen', sks: 3, lecturer_name: 'Dra. Nurhayati, M.M.', lecturer_phone: '081122334456', schedule_day: 'Selasa', schedule_time: '10:45 - 13:15', room: 'R. 305 Gedung FEB', color: '#059669' },
  { id: 'crs_03', code: 'EKO103', name: 'Matematika Ekonomi & Bisnis', sks: 3, lecturer_name: 'Bambang Subagyo, S.Si., M.Sc.', lecturer_phone: '081122334457', schedule_day: 'Rabu', schedule_time: '08:00 - 10:30', room: 'Lab Komputasi FEB', color: '#d97706' },
  { id: 'crs_04', code: 'BIS104', name: 'Pengantar Bisnis', sks: 2, lecturer_name: 'Rina Marlina, S.E., M.B.A.', lecturer_phone: '081122334458', schedule_day: 'Kamis', schedule_time: '13:30 - 15:10', room: 'R. 408 Gedung FEB', color: '#7c3aed' },
  { id: 'crs_05', code: 'EKO105', name: 'Pengantar Ekonomi Mikro', sks: 3, lecturer_name: 'Dr. Surya Darma, S.E., M.Si.', lecturer_phone: '081122334459', schedule_day: 'Jumat', schedule_time: '08:00 - 10:30', room: 'R. 301 Gedung FEB', color: '#db2777' },
  { id: 'crs_06', code: 'ING106', name: 'Bahasa Inggris Bisnis 1', sks: 2, lecturer_name: 'Jessica Lauren, S.Pd., M.Hum.', lecturer_phone: '081122334460', schedule_day: 'Senin', schedule_time: '13:30 - 15:10', room: 'Lab Bahasa 2', color: '#0891b2' },
  { id: 'crs_07', code: 'AGM107', name: 'Pendidikan Agama Islam', sks: 2, lecturer_name: 'Drs. H. Miftahudin, M.Ag.', lecturer_phone: '081122334461', schedule_day: 'Selasa', schedule_time: '08:00 - 09:40', room: 'R. Audiovisual 1', color: '#4b5563' },
  { id: 'crs_08', code: 'PNC108', name: 'Pendidikan Pancasila & Kewarganegaraan', sks: 2, lecturer_name: 'Agus Purnomo, S.H., M.H.', lecturer_phone: '081122334462', schedule_day: 'Rabu', schedule_time: '13:30 - 15:10', room: 'R. 204 Gedung Utama', color: '#ea580c' },
];

const INITIAL_SEMESTERS = [
  'Semester 1 (Ganjil)',
  'Semester 2 (Genap)',
  'Semester 3 (Ganjil)',
  'Semester 4 (Genap)',
  'Semester 5 (Ganjil)',
  'Semester 6 (Genap)',
  'Semester 7 (Ganjil)',
  'Semester 8 (Genap)',
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    class_id: 'cls_01sakp014',
    code: 'TRX-001',
    type: 'income',
    category_id: 'cat_kas_rutin',
    amount: 780000,
    description: 'Pemasukan Kas Kelas Bulan September (39 Anggota)',
    created_by: 'usr_super_01',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'tx_02',
    class_id: 'cls_01sakp014',
    code: 'TRX-002',
    type: 'expense',
    category_id: 'cat_operasional',
    amount: 150000,
    description: 'Pembelian ATK dan Spidol Boardmarker Dosen',
    created_by: 'usr_bendahara_01',
    created_at: '2026-09-03T14:00:00Z',
    updated_at: '2026-09-03T14:00:00Z',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc_01',
    class_id: 'cls_01sakp014',
    title: 'Selamat Datang di Portal Kelas Manajer 01SAKP014',
    content: 'Portal digital resmi untuk koordinasi perkuliahan, transparansi kas, agenda kuliah, dan pengumpulan tugas.',
    target_type: 'all',
    author_id: 'usr_super_01',
    is_pinned: true,
    publish_date: '2026-09-01T08:00:00Z',
    created_at: '2026-09-01T08:00:00Z',
  },
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt_01',
    class_id: 'cls_01sakp014',
    title: 'Kuliah Perdana Pengantar Akuntansi 1',
    description: 'Pertemuan perdana dan pemaparan kontrak kuliah semester ganjil.',
    type: 'lecture',
    date: '2026-09-15',
    start_time: '08:00',
    end_time: '10:30',
    location: 'R. 402 FEB',
    pic_user_id: 'usr_super_01',
    status: 'upcoming',
    reminder_minutes: 30,
  },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk_01',
    class_id: 'cls_01sakp014',
    title: 'Pembentukan Kelompok Pengantar Manajemen',
    description: 'Masing-masing kelompok terdiri dari 4-5 mahasiswa untuk tugas studi kasus.',
    status: 'in_progress',
    priority: 'medium',
    deadline: '2026-09-20T23:59:00Z',
    assignee_id: 'usr_ketua_01',
    creator_id: 'usr_super_01',
    created_at: '2026-09-02T08:00:00Z',
  },
];

/**
 * High-resiliency Client Fallback Engine.
 * Serves all requests seamlessly without throwing HTTP 404, guaranteeing that Vercel,
 * static previews, and offline sessions continue to work flawlessly.
 */
export async function handleClientFallback<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. Auth Me
  if (endpoint === '/auth/me') {
    const cachedUser = getStored<User | null>('user', INITIAL_USERS[0]);
    const cachedRole = getStored<Role | null>('role', INITIAL_ROLES[0]);
    const cachedClassInfo = getStored<ClassInfo>('class_info', INITIAL_CLASS_INFO);

    return {
      user: cachedUser,
      role: cachedRole,
      permissions: cachedRole?.permissions || ALL_PERMISSIONS,
      classInfo: cachedClassInfo,
    } as unknown as T;
  }

  // 2. Google Login
  if (endpoint === '/auth/google-login') {
    const email = body.email || 'user@example.com';
    const isSuper = email === 'mrachmanfm@gmail.com';
    const assignedRole = isSuper ? INITIAL_ROLES[0] : INITIAL_ROLES[3];

    const user: User = {
      id: body.uid ? `usr_${body.uid.slice(0, 12)}` : 'usr_google_' + Date.now(),
      name: body.displayName || email.split('@')[0],
      nim: isSuper ? '2601001401' : '26010014' + Math.floor(10 + Math.random() * 89),
      email: email,
      phone: '',
      avatar: body.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      class_id: 'cls_01sakp014',
      department: 'S1 Akuntansi',
      cohort: '2026',
      role_id: assignedRole.id,
      position: assignedRole.name,
      is_active: true,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save with Classify Pro namespace to Firestore (isolated fields, non-destructive merge)
    saveClassifyUserProfile(body.uid || user.id, {
      email: user.email,
      displayName: user.name,
      photoURL: user.avatar,
      student_id: user.nim,
      nim: user.nim,
      class_role: assignedRole.name,
      class_name: INITIAL_CLASS_INFO.name,
    }).catch(() => {});

    // Save to local persistence
    setStored('user', user);
    setStored('role', assignedRole);
    setStored('class_info', INITIAL_CLASS_INFO);

    return {
      success: true,
      user,
      role: assignedRole,
      permissions: assignedRole.permissions,
      classInfo: INITIAL_CLASS_INFO,
      requiresClaim: false,
      isPendingApproval: false,
    } as unknown as T;
  }

  // 3. Class Info
  if (endpoint === '/class') {
    if (method === 'PUT') {
      const current = getStored<ClassInfo>('class_info', INITIAL_CLASS_INFO);
      const updated = { ...current, ...body, updated_at: new Date().toISOString() };
      setStored('class_info', updated);
      return updated as unknown as T;
    }
    return getStored<ClassInfo>('class_info', INITIAL_CLASS_INFO) as unknown as T;
  }

  // 4. Members & Users
  if (endpoint.startsWith('/members') || endpoint === '/auth/users') {
    let users = getStored<User[]>('users', INITIAL_USERS);
    if (method === 'POST') {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        name: body.name || 'Mahasiswa Baru',
        nim: body.nim || '260100' + (users.length + 1),
        email: body.email || `mhs${users.length + 1}@univ.ac.id`,
        phone: body.phone || '',
        avatar: body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        class_id: 'cls_01sakp014',
        department: 'S1 Akuntansi',
        cohort: '2026',
        role_id: body.role_id || 'role_anggota',
        position: 'Anggota Kelas',
        is_active: true,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      };
      users.push(newUser);
      setStored('users', users);
      return newUser as unknown as T;
    }
    return users as unknown as T;
  }

  // 5. Roles & Permissions
  if (endpoint === '/roles') {
    return getStored<Role[]>('roles', INITIAL_ROLES) as unknown as T;
  }
  if (endpoint === '/permissions') {
    return ALL_PERMISSIONS.map((code, idx) => ({
      id: `perm_${idx + 1}`,
      code,
      category: 'System',
      name: code.replace(/_/g, ' ').toUpperCase(),
      description: `Izin akses untuk fitur ${code}`,
    })) as unknown as T;
  }

  // 6. Courses
  if (endpoint === '/courses') {
    let courses = getStored<Course[]>('courses', INITIAL_COURSES);
    if (method === 'POST') {
      const newCourse: Course = {
        id: 'crs_' + Date.now(),
        code: body.code || 'MK' + (courses.length + 1),
        name: body.name || 'Mata Kuliah Baru',
        sks: body.sks || 3,
        lecturer_name: body.lecturer_name || 'Dosen Pengampu',
        lecturer_phone: body.lecturer_phone || '',
        color: body.color || '#2563eb',
        ...body,
      };
      courses.push(newCourse);
      setStored('courses', courses);
      return newCourse as unknown as T;
    }
    return courses as unknown as T;
  }

  // 7. Finance
  if (endpoint === '/finance/summary') {
    const transactions = getStored<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const balance = totalIncome - totalExpense;

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: balance,
      pending_payments_count: 0,
      monthly_dues_target: 780000,
      monthly_dues_collected: totalIncome,
      collection_rate: 100,
    } as unknown as T;
  }

  if (endpoint.startsWith('/finance/transactions')) {
    let txs = getStored<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
    if (method === 'POST') {
      const newTx: Transaction = {
        id: 'tx_' + Date.now(),
        class_id: 'cls_01sakp014',
        code: 'TRX-' + (txs.length + 1),
        type: body.type || 'income',
        amount: Number(body.amount) || 0,
        category_id: body.category_id || 'cat_kas_rutin',
        description: body.description || 'Transaksi kas',
        created_by: 'usr_super_01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      };
      txs.unshift(newTx);
      setStored('transactions', txs);
      return newTx as unknown as T;
    }
    return txs as unknown as T;
  }

  if (endpoint.startsWith('/finance/bills')) {
    let bills = getStored<Bill[]>('bills', []);
    if (method === 'POST') {
      const newBill: Bill = {
        id: 'bill_' + Date.now(),
        class_id: 'cls_01sakp014',
        title: body.title || 'Iuran Kas',
        description: body.description || '',
        amount: Number(body.amount) || 20000,
        due_date: body.due_date || new Date().toISOString(),
        period: body.period || 'September 2026',
        created_by: 'usr_super_01',
        created_at: new Date().toISOString(),
        ...body,
      };
      bills.push(newBill);
      setStored('bills', bills);
      return newBill as unknown as T;
    }
    return bills as unknown as T;
  }

  // 8. Kas Checklist Columns & Entries
  if (endpoint === '/kas/columns') {
    return [
      { id: 'col_01', month_label: 'Sept 2026', week_number: 1, due_amount: 20000, is_active: true },
      { id: 'col_02', month_label: 'Sept 2026', week_number: 2, due_amount: 20000, is_active: true },
      { id: 'col_03', month_label: 'Sept 2026', week_number: 3, due_amount: 20000, is_active: true },
      { id: 'col_04', month_label: 'Sept 2026', week_number: 4, due_amount: 20000, is_active: true },
    ] as unknown as T;
  }

  if (endpoint === '/kas/entries') {
    return [] as unknown as T;
  }

  // 9. Agenda & Events
  if (endpoint.startsWith('/agenda')) {
    let events = getStored<EventItem[]>('events', INITIAL_EVENTS);
    if (method === 'POST') {
      const newEvt: EventItem = {
        id: 'evt_' + Date.now(),
        class_id: 'cls_01sakp014',
        title: body.title || 'Kegiatan Kelas',
        description: body.description || '',
        type: body.type || 'event',
        date: body.date || new Date().toISOString().split('T')[0],
        start_time: body.start_time || '08:00',
        end_time: body.end_time || '10:00',
        location: body.location || 'Kampus',
        pic_user_id: 'usr_super_01',
        status: 'upcoming',
        reminder_minutes: 30,
        ...body,
      };
      events.push(newEvt);
      setStored('events', events);
      return newEvt as unknown as T;
    }
    return events as unknown as T;
  }

  // 10. Announcements & Meetings
  if (endpoint.startsWith('/announcements')) {
    let ann = getStored<Announcement[]>('announcements', INITIAL_ANNOUNCEMENTS);
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      ann = ann.filter(a => a.id !== id);
      setStored('announcements', ann);
      return { success: true } as unknown as T;
    }
    if (method === 'POST') {
      const newAnn: Announcement = {
        id: 'anc_' + Date.now(),
        class_id: 'cls_01sakp014',
        title: body.title || 'Pengumuman Baru',
        content: body.content || '',
        target_type: body.target_type || 'all',
        is_pinned: Boolean(body.is_pinned),
        publish_date: new Date().toISOString(),
        author_id: 'usr_super_01',
        created_at: new Date().toISOString(),
        ...body,
      };
      ann.unshift(newAnn);
      setStored('announcements', ann);
      return newAnn as unknown as T;
    }
    return ann as unknown as T;
  }

  // 10b. Meetings
  if (endpoint.startsWith('/meetings')) {
    let meetings = getStored<any[]>('meetings', []);
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      meetings = meetings.filter(m => m.id !== id);
      setStored('meetings', meetings);
      return { success: true } as unknown as T;
    }
    if (method === 'POST') {
      const newMeeting = {
        id: 'mtg_' + Date.now(),
        class_id: 'cls_01sakp014',
        title: body.title || 'Rapat Koordinasi',
        date: body.date || new Date().toISOString().split('T')[0],
        start_time: body.start_time || '09:00',
        end_time: body.end_time || '11:00',
        location: body.location || 'Ruang Rapat',
        agenda: body.agenda || '',
        status: 'scheduled',
        created_at: new Date().toISOString(),
        ...body,
      };
      meetings.unshift(newMeeting);
      setStored('meetings', meetings);
      return newMeeting as unknown as T;
    }
    return meetings as unknown as T;
  }

  // 11. Tasks
  if (endpoint.startsWith('/tasks')) {
    let tasks = getStored<TaskItem[]>('tasks', INITIAL_TASKS);
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      tasks = tasks.filter(t => t.id !== id);
      setStored('tasks', tasks);
      return { success: true } as unknown as T;
    }
    if (method === 'POST') {
      const newTask: TaskItem = {
        id: 'tsk_' + Date.now(),
        class_id: 'cls_01sakp014',
        title: body.title || 'Tugas Baru',
        description: body.description || '',
        assignee_id: body.assignee_id || 'usr_ketua_01',
        creator_id: 'usr_super_01',
        priority: body.priority || 'medium',
        deadline: body.deadline || new Date().toISOString(),
        status: 'todo',
        created_at: new Date().toISOString(),
        ...body,
      };
      tasks.push(newTask);
      setStored('tasks', tasks);
      return newTask as unknown as T;
    }
    return tasks as unknown as T;
  }

  // 11b. Role Claim with Auto-Approval Master Passcode & Instant Anggota Entrance
  if (endpoint === '/auth/claim-role') {
    const isMasterCode = (body.pro_code || body.notes || body.message || '').toUpperCase().includes('01SAKP014PRO') ||
      (body.pro_code || body.notes || body.message || '').toUpperCase().includes('01SAKP014') ||
      (body.pro_code || body.notes || body.message || '').toUpperCase().includes('SAKP14PRO');

    const users = getStored<User[]>('users', INITIAL_USERS);
    const targetUser = users.find(u => u.id === body.requested_user_id) || users[0];
    const roles = getStored<Role[]>('roles', INITIAL_ROLES);
    const targetRole = roles.find(r => r.id === body.requested_role_id) || roles.find(r => r.id === 'role_anggota');
    const memberRole = roles.find(r => r.id === 'role_anggota') || roles[roles.length - 1];

    if (isMasterCode) {
      if (targetUser && targetRole) {
        targetUser.email = body.google_email;
        targetUser.role_id = targetRole.id;
        targetUser.role_name = targetRole.name;
        targetUser.position = targetRole.name;
        targetUser.avatar = body.google_avatar || targetUser.avatar;
        targetUser.updated_at = new Date().toISOString();
        setStored('users', users);
        setStored('user', targetUser);
        setStored('role', targetRole);

        // Sync to isolated Firestore namespace
        saveClassifyUserProfile(targetUser.id, {
          email: body.google_email,
          displayName: targetUser.name,
          photoURL: targetUser.avatar,
          nim: targetUser.nim,
          class_role: targetRole.name,
          class_name: '01 SAKP 14',
          is_google_linked: true,
        }).catch(() => {});
      }

      return {
        success: true,
        autoApproved: true,
        isApproved: true,
        user: targetUser,
        role: targetRole,
        claimRequest: {
          id: `claim_auto_${Date.now()}`,
          status: 'approved',
          user_name: targetUser?.name,
          user_nim: targetUser?.nim,
          role_name: targetRole?.name,
          requested_role_name: targetRole?.name,
        },
      } as unknown as T;
    }

    // Default flow: user enters immediately as Anggota while Super Admin approval is pending
    if (targetUser) {
      targetUser.email = body.google_email;
      targetUser.role_id = 'role_anggota';
      targetUser.role_name = 'Anggota Kelas';
      targetUser.position = `Anggota (Menunggu Verifikasi ${targetRole?.name || 'Role'})`;
      targetUser.avatar = body.google_avatar || targetUser.avatar;
      targetUser.updated_at = new Date().toISOString();
      setStored('users', users);
      setStored('user', targetUser);
      setStored('role', memberRole);

      saveClassifyUserProfile(targetUser.id, {
        email: body.google_email,
        displayName: targetUser.name,
        photoURL: targetUser.avatar,
        nim: targetUser.nim,
        class_role: 'Anggota Kelas',
        class_name: '01 SAKP 14',
        is_google_linked: true,
      }).catch(() => {});
    }

    return {
      success: true,
      isApproved: true,
      isPendingApproval: true,
      user: targetUser,
      role: memberRole,
      claimRequest: {
        id: `claim_${Date.now()}`,
        status: 'pending',
        user_name: targetUser?.name,
        user_nim: targetUser?.nim,
        role_name: 'Anggota Kelas',
        requested_role_name: targetRole?.name || 'Sekretaris',
      },
    } as unknown as T;
  }

  // 12. Semesters Settings
  if (endpoint === '/settings/semesters') {
    const rawSemesters = getStored<string[]>('semesters', INITIAL_SEMESTERS);
    const classInfo = getStored<ClassInfo>('class_info', INITIAL_CLASS_INFO);

    if (method === 'POST' && body.name) {
      if (!rawSemesters.includes(body.name)) {
        rawSemesters.push(body.name);
        setStored('semesters', rawSemesters);
      }
    }

    const formatted = rawSemesters.map((name, idx) => ({
      id: `sem_${idx + 1}`,
      name,
      academic_year: classInfo.academic_year || '2026/2027',
      is_active: name === classInfo.semester,
    }));
    return formatted as unknown as T;
  }

  if (endpoint === '/settings/active-semester') {
    const classInfo = getStored<ClassInfo>('class_info', INITIAL_CLASS_INFO);
    const target = body.semester || body.semesterId;
    if (target) {
      classInfo.semester = target;
      classInfo.updated_at = new Date().toISOString();
      setStored('class_info', classInfo);
    }
    return { success: true, classInfo } as unknown as T;
  }

  // Generic fallback for any other collection/endpoint
  return [] as unknown as T;
}
