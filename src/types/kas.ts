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
    [weekKey: string]: boolean; // e.g. "Minggu 1", "Minggu 2", ...
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
}
