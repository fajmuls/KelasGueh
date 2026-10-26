export type UserRole = 'superadmin' | 'bendahara' | 'anggota';

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
