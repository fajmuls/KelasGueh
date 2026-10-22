import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { KasTransaction, KasMember, ClassSettings } from '../types/kas.ts';

// Initial default settings
export const DEFAULT_SETTINGS: ClassSettings = {
  className: 'Kelas Gue',
  weeklyDuesAmount: 5000,
  kasTargetAmount: 2500000,
  currencyPrefix: 'Rp',
  academicYear: 'Semester Ganjil 2026/2027',
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ireqpxgmlrsmcgidfthg.supabase.co',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV'
};

// Initial realistic class members
export const INITIAL_MEMBERS: KasMember[] = [
  { id: 'm1', name: 'Ahmad Faiz Fadhlullah', studentId: '230101001', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': false, 'M6': false } },
  { id: 'm2', name: 'Annisa Bella Safitri', studentId: '230101002', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': true } },
  { id: 'm3', name: 'Bima Satria Wicaksono', studentId: '230101003', weeklyStatus: { 'M1': true, 'M2': true, 'M3': false, 'M4': false, 'M5': false, 'M6': false } },
  { id: 'm4', name: 'Citra Dewi Lestari', studentId: '230101004', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': false } },
  { id: 'm5', name: 'Dimas Aditya Pratama', studentId: '230101005', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': true } },
  { id: 'm6', name: 'Eka Putri Handayani', studentId: '230101006', weeklyStatus: { 'M1': true, 'M2': false, 'M3': false, 'M4': false, 'M5': false, 'M6': false } },
  { id: 'm7', name: 'Fajar Nugraha', studentId: '230101007', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': false } },
  { id: 'm8', name: 'Gita Maharani', studentId: '230101008', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': true } },
  { id: 'm9', name: 'Hafiz Rizky Ramadhan', studentId: '230101009', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': false, 'M5': false, 'M6': false } },
  { id: 'm10', name: 'Intan Permatasari', studentId: '230101010', weeklyStatus: { 'M1': true, 'M2': true, 'M3': true, 'M4': true, 'M5': true, 'M6': true } }
];

// Initial realistic kas transactions
export const INITIAL_TRANSACTIONS: KasTransaction[] = [
  {
    id: 'tx-001',
    type: 'income',
    title: 'Iuran Kas Masal Minggu 1 & 2',
    amount: 100000,
    category: 'Iuran Kas',
    date: '2026-10-06',
    recordedBy: 'Bendahara Kelas',
    notes: 'Pembayaran serentak 10 anggota awal perkuliahan.',
    createdAt: new Date('2026-10-06T09:00:00Z').toISOString()
  },
  {
    id: 'tx-002',
    type: 'expense',
    title: 'Beli Spidol & Penghapus Whiteboard',
    amount: 35000,
    category: 'Perlengkapan Kelas',
    date: '2026-10-08',
    recordedBy: 'Bendahara Kelas',
    notes: 'Toko Buku Gramed: 2 Spidol Snowman Boardmarker + 1 Eraser.',
    createdAt: new Date('2026-10-08T11:20:00Z').toISOString()
  },
  {
    id: 'tx-003',
    type: 'income',
    title: 'Iuran Kas Minggu 3 & 4',
    amount: 85000,
    category: 'Iuran Kas',
    date: '2026-10-15',
    recordedBy: 'Bendahara Kelas',
    notes: 'Sebagian besar anggota telah lunas minggu ke-4.',
    createdAt: new Date('2026-10-15T10:00:00Z').toISOString()
  },
  {
    id: 'tx-004',
    type: 'expense',
    title: 'Cetak & Jilid Makalah Tugas Kelompok',
    amount: 45000,
    category: 'Fotokopi & Tugas',
    date: '2026-10-18',
    recordedBy: 'Bendahara Kelas',
    notes: 'Fotokopi Berkah Kampus (Rangkap 4 + Mika Biru).',
    createdAt: new Date('2026-10-18T14:15:00Z').toISOString()
  },
  {
    id: 'tx-005',
    type: 'expense',
    title: 'Air Galon & Gelas Kertas Ruang Kuliah',
    amount: 22000,
    category: 'Konsumsi Kelas',
    date: '2026-10-21',
    recordedBy: 'Bendahara Kelas',
    notes: 'Galon Aqua + 1 pack cup kertas untuk persiapan presentasi.',
    createdAt: new Date('2026-10-21T08:30:00Z').toISOString()
  }
];

// Supabase client instance holder
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const localUrl = localStorage.getItem('kelasgue_supabase_url');
  const localKey = localStorage.getItem('kelasgue_supabase_key');
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: localUrl || envUrl || 'https://ireqpxgmlrsmcgidfthg.supabase.co',
    anonKey: localKey || envKey || 'sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV'
  };
};

export const initSupabase = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Gagal menginisialisasi Supabase:', err);
    supabaseInstance = null;
    return null;
  }
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
};

// Supabase Google Auth helper
export const signInWithGoogleSupabase = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Kredensial Supabase URL dan Anon Key belum dikonfigurasi di Pengaturan.'
    };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal login Google via Supabase' };
  }
};

// Local storage reactive sync repository
export class LocalKasRepository {
  private static STORAGE_KEY_TX = 'kelasgue_transactions_v2';
  private static STORAGE_KEY_MEMBERS = 'kelasgue_members_v2';
  private static STORAGE_KEY_SETTINGS = 'kelasgue_settings_v2';

  public static getTransactions(): KasTransaction[] {
    const data = localStorage.getItem(this.STORAGE_KEY_TX);
    if (!data) {
      this.saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  public static saveTransactions(txs: KasTransaction[]): void {
    localStorage.setItem(this.STORAGE_KEY_TX, JSON.stringify(txs));
  }

  public static addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): KasTransaction {
    const current = this.getTransactions();
    const newTx: KasTransaction = {
      ...tx,
      id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newTx, ...current];
    this.saveTransactions(updated);
    return newTx;
  }

  public static deleteTransaction(id: string): void {
    const current = this.getTransactions();
    const updated = current.filter(t => t.id !== id);
    this.saveTransactions(updated);
  }

  public static getMembers(): KasMember[] {
    const data = localStorage.getItem(this.STORAGE_KEY_MEMBERS);
    if (!data) {
      this.saveMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MEMBERS;
    }
  }

  public static saveMembers(members: KasMember[]): void {
    localStorage.setItem(this.STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  public static toggleMemberWeek(memberId: string, weekKey: string): void {
    const members = this.getMembers();
    const updated = members.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          weeklyStatus: {
            ...m.weeklyStatus,
            [weekKey]: !m.weeklyStatus[weekKey]
          }
        };
      }
      return m;
    });
    this.saveMembers(updated);
  }

  public static addMember(name: string, studentId: string): KasMember {
    const members = this.getMembers();
    const newMember: KasMember = {
      id: `m-${Date.now()}`,
      name,
      studentId,
      weeklyStatus: {}
    };
    members.push(newMember);
    this.saveMembers(members);
    return newMember;
  }

  public static getSettings(): ClassSettings {
    const data = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
    if (!data) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: ClassSettings): void {
    localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (settings.supabaseUrl) {
      localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    }
    if (settings.supabaseAnonKey) {
      localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    }
    initSupabase();
  }
}
