export type UserRole = 'superadmin' | 'bendahara' | 'sekretaris' | 'anggota';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isGoogleAuth?: boolean;
}

export type TransactionType = 'income' | 'expense';

export interface KasTransaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  recordedBy: string; // Name & role of recorded person
  receiptUrl?: string; // Data URL or storage link
  notes?: string;
  createdAt: string;
}

export interface KasMember {
  id: string;
  name: string;
  studentId: string; // NIM / No. Absen
  phone?: string;
  gender?: 'L' | 'P'; // Student gender
  isActive?: boolean; // Active status (default true)
  weeklyStatus: {
    [weekKey: string]: boolean; // e.g. "2026_10_W1", "2026_11_W2", ...
  };
}

export interface ClassSettings {
  className: string;
  weeklyDuesAmount: number;
  kasTargetAmount: number;
  currencyPrefix: string;
  academicYear: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl?: string;
  monthlyDuesOverrides?: Record<string, number>; // key: "YYYY_M", e.g. "2026_1": 5000, "2026_2": 10000
  inventoryList?: ClassInventoryItem[];
  courseSchedules?: CourseSchedule[];
}

export interface KolektifBill {
  id: string;
  title: string;
  category: string;
  amountPerPerson: number;
  totalCost?: number;
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  participantIds: string[]; // member IDs that participate
  paidMemberIds: string[]; // member IDs that have paid
  createdAt: string;
  syncedToKas?: boolean;
  billType?: 'acara' | 'patungan'; // New: distinguish event bills from group purchases
}

export interface StudentPointLog {
  id: string;
  memberId: string;
  points: number; // positive or negative
  category: 'tanya' | 'presentasi' | 'menjawab' | 'inisiatif' | 'tugas' | 'terlambat' | 'lainnya';
  reason: string;
  date: string; // YYYY-MM-DD
  recordedBy: string;
  createdAt: string;
  courseId?: string; // New: associated course/subject
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'kuliah' | 'rapat' | 'kegiatan';
  statuses: Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'>; // memberId -> status
  notes?: string;
  recordedBy: string;
  createdAt: string;
  courseId?: string; // New: associated course/subject
}

export interface MeetingMinute {
  id: string;
  title: string;
  date: string;
  leader: string;
  noteTaker: string;
  agenda: string;
  discussion: string;
  decisions: string;
  actionItems: { id: string; task: string; assignee: string; done: boolean }[];
  createdAt: string;
}

export interface ClassInventoryItem {
  id: string;
  name: string;
  quantity: number;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  location: string;
  purchasedFromKas: boolean;
  price?: number;
  notes?: string;
  createdAt: string;
}

export interface CourseAssignment {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  status: 'pending' | 'selesai';
  notes?: string;
}

export interface CourseSchedule {
  id: string;
  courseName: string;
  lecturerName: string;
  sks: number;
  day: string; // Senin, Selasa, etc.
  time: string; // e.g. "08:00 - 09:40"
  room?: string;
  assignments: CourseAssignment[];
  createdAt: string;
}

export interface ClassBackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  role: string;
  settings: ClassSettings;
  members: KasMember[];
  transactions: KasTransaction[];
  kolektifBills?: KolektifBill[];
  savedGroupCollections?: any[];
  auditLogs?: any[];
  whitelist?: any[];
  attendance?: AttendanceRecord[];
  studentPoints?: StudentPointLog[];
  minutes?: MeetingMinute[];
}

