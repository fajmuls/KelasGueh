export type UserRole = 'superadmin' | 'bendahara' | 'sekretaris' | 'anggota';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isGoogleAuth?: boolean;
  nim?: string;
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
  email?: string;
  gender?: 'L' | 'P'; // Student gender
  isActive?: boolean; // Active status (default true)
  weeklyStatus: {
    [weekKey: string]: boolean; // e.g. "2026_10_W1", "2026_11_W2", ...
  };
}

export interface ClassSettings {
  className: string;
  classCode?: string;
  weeklyDuesAmount: number;
  kasTargetAmount: number;
  currencyPrefix: string;
  academicYear: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl?: string;
  monthlyDuesOverrides?: Record<string, number>; // key: "YYYY_M", e.g. "2026_1": 5000, "2026_2": 10000
  requireTransactionPin?: boolean; // Super Admin toggle for large-transaction PIN check
  transactionPinThreshold?: number; // Nominal threshold (default 500000)
  pinHash?: string; // Synced bcrypt hash for unified multi-device PIN
  googleSpreadsheetId?: string;
  googleSpreadsheetUrl?: string;
  autoSyncGoogleSheets?: boolean;
  lastSheetsSyncAt?: string;
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
  billType?: 'acara' | 'patungan';
}

export interface StudentPointLog {
  id: string;
  memberId: string;
  points: number;
  category: 'tanya' | 'presentasi' | 'menjawab' | 'inisiatif' | 'tugas' | 'terlambat' | 'lainnya';
  reason: string;
  date: string;
  recordedBy: string;
  createdAt: string;
  courseId?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  title: string;
  type: 'kuliah' | 'rapat' | 'kegiatan';
  statuses: Record<string, 'hadir' | 'sakit' | 'izin' | 'alpa'>;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  courseId?: string;
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
  deadline: string;
  status: 'pending' | 'selesai';
  notes?: string;
}

export interface CourseSchedule {
  id: string;
  courseName: string;
  lecturerName: string;
  sks: number;
  day: string;
  time: string;
  room?: string;
  assignments: CourseAssignment[];
  createdAt: string;
}

export interface ClassDefinition {
  id: string; // e.g. '01_SAKP_014'
  code: string; // e.g. '01 SAKP 014'
  name: string; // e.g. '01 SAKP 014'
  academicYear: string;
  createdAt: string;
  createdBy: string;
  isDefault?: boolean;
  isArchived?: boolean;
  semesterOrder?: number;
  googleSpreadsheetId?: string;
  googleSpreadsheetUrl?: string;
  lastSheetsSyncAt?: string;
}

export interface ClassMembershipRequest {
  id: string;
  email: string;
  fullName: string;
  nim?: string;
  classId: string;
  className: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedRole: UserRole;
  linkedMemberId?: string;
  linkedMemberName?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  autoMatched?: boolean;
}

export interface ClassSnapshotMeta {
  classId: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
  sizeBytes: number;
  txCount: number;
  memberCount: number;
}

export interface ClassSnapshotManifest {
  classId: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
  settings: ClassSettings;
  members: KasMember[];
  transactions: KasTransaction[];
  kolektifBills: KolektifBill[];
  pointLogs: StudentPointLog[];
  attendanceRecords: AttendanceRecord[];
  meetingMinutes: MeetingMinute[];
  inventoryItems: ClassInventoryItem[];
  courseSchedules: CourseSchedule[];
  savedGroupCollections: any[];
  auditLogs: any[];
  whitelist?: any[];
}

export interface SyncTelemetry {
  status: 'synced' | 'syncing' | 'offline';
  classId: string;
  lastSyncedAt: string | null;
  snapshotBytes: number;
  lastSource: 'cache' | 'snapshot' | 'sql' | 'upload' | 'local';
  isPendingUpload: boolean;
  errorMessage?: string;
}

export interface ClassBackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  role: string;
  classId?: string;
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
