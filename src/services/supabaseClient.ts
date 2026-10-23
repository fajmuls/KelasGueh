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

// Initial empty class members (user will input manually)
export const INITIAL_MEMBERS: KasMember[] = [];

// Initial empty kas transactions (user will input manually)
export const INITIAL_TRANSACTIONS: KasTransaction[] = [];

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

// Compress image file using HTML Canvas to reduce size before uploading to Supabase Storage
export const compressImage = async (file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Upload receipt image to Supabase Storage bucket 'nota-kas'
export const uploadReceiptToSupabase = async (file: File): Promise<{ url?: string; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'Koneksi Supabase belum diinisialisasi.' };
  }

  try {
    const compressedBlob = await compressImage(file);
    const fileExt = 'jpg';
    const fileName = `nota_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

    const { data, error } = await client.storage
      .from('nota-kas')
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      if (error.message.toLowerCase().includes('bucket not found') || (error as any).statusCode === '404') {
        return {
          error: 'Bucket "nota-kas" belum dibuat di Supabase Storage. Silakan buat bucket publik bernama "nota-kas" di menu Storage dashboard Supabase.'
        };
      }
      return { error: `Gagal upload Supabase Storage: ${error.message}` };
    }

    const { data: publicData } = client.storage.from('nota-kas').getPublicUrl(data.path);
    return { url: publicData.publicUrl };
  } catch (err: any) {
    return { error: err?.message || 'Gagal memproses dan mengunggah foto nota' };
  }
};

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
  userRole: string;
}

// Supabase Realtime Listener
export const subscribeToRealtimeKas = (
  onTransactionChange: (payload: any) => void,
  onMemberChange: (payload: any) => void,
  onAuditLogChange?: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime_kas_gue')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kas_transactions' },
      (payload) => onTransactionChange(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kas_members' },
      (payload) => onMemberChange(payload)
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'audit_logs' },
      (payload) => {
        if (onAuditLogChange) onAuditLogChange(payload);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// Supabase Google Auth helper
export const signInWithGoogleSupabase = async (): Promise<{ success: boolean; error?: string; isUnsupportedProvider?: boolean }> => {
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
      const isUnsupported = error.message.toLowerCase().includes('unsupported provider') ||
                            error.message.toLowerCase().includes('validation failed') ||
                            (error as any).status === 400;
      return {
        success: false,
        error: error.message,
        isUnsupportedProvider: isUnsupported
      };
    }
    return { success: true };
  } catch (e: any) {
    const msg = e?.message || '';
    const isUnsupported = msg.toLowerCase().includes('unsupported provider') || msg.toLowerCase().includes('validation failed');
    return {
      success: false,
      error: msg || 'Gagal login Google via Supabase',
      isUnsupportedProvider: isUnsupported
    };
  }
};

// Local storage reactive sync repository (Hybrid Supabase-Local)
export class LocalKasRepository {
  private static STORAGE_KEY_TX = 'kelasgue_transactions_v3';
  private static STORAGE_KEY_MEMBERS = 'kelasgue_members_v3';
  private static STORAGE_KEY_SETTINGS = 'kelasgue_settings_v3';
  private static STORAGE_KEY_AUDIT = 'kelasgue_audit_logs_v1';

  // ---------------- TX METHODS ----------------
  public static getTransactions(): KasTransaction[] {
    const data = localStorage.getItem(this.STORAGE_KEY_TX);
    return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
  }

  public static saveTransactions(txs: KasTransaction[]): void {
    localStorage.setItem(this.STORAGE_KEY_TX, JSON.stringify(txs));
  }

  public static async fetchTransactionsFromSupabase(): Promise<KasTransaction[]> {
    const client = getSupabaseClient();
    if (!client) return this.getTransactions();

    const { data, error } = await client
      .from('kas_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) return this.getTransactions();

    const mapped: KasTransaction[] = (data || []).map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      amount: Number(t.amount),
      category: t.category,
      date: t.date,
      recordedBy: t.recorded_by,
      receiptUrl: t.receipt_url,
      notes: t.notes,
      createdAt: t.created_at
    }));

    this.saveTransactions(mapped);
    return mapped;
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

    // Async push to Supabase
    const client = getSupabaseClient();
    if (client) {
      client.from('kas_transactions').insert([{
        type: tx.type,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        recorded_by: tx.recordedBy,
        receipt_url: tx.receiptUrl,
        notes: tx.notes
      }]).then(({ error }) => {
        if (error) console.warn('Sync transaction fail:', error.message);
      });
    }

    return newTx;
  }

  public static deleteTransaction(id: string): void {
    const current = this.getTransactions();
    const updated = current.filter(t => t.id !== id);
    this.saveTransactions(updated);

    const client = getSupabaseClient();
    if (client) {
      client.from('kas_transactions').delete().eq('id', id).then();
    }
  }

  // ---------------- MEMBER METHODS ----------------
  public static getMembers(): KasMember[] {
    const data = localStorage.getItem(this.STORAGE_KEY_MEMBERS);
    return data ? JSON.parse(data) : INITIAL_MEMBERS;
  }

  public static saveMembers(members: KasMember[]): void {
    localStorage.setItem(this.STORAGE_KEY_MEMBERS, JSON.stringify(members));
  }

  public static async fetchMembersFromSupabase(): Promise<KasMember[]> {
    const client = getSupabaseClient();
    if (!client) return this.getMembers();

    const { data, error } = await client.from('kas_members').select('*').order('name', { ascending: true });
    if (error) return this.getMembers();

    const mapped: KasMember[] = (data || []).map(m => ({
      id: m.id,
      name: m.name,
      studentId: m.student_id,
      phone: m.phone,
      weeklyStatus: m.weekly_status || {}
    }));

    this.saveMembers(mapped);
    return mapped;
  }

  public static toggleMemberWeek(memberId: string, weekKey: string): void {
    const members = this.getMembers();
    let targetMember: KasMember | null = null;
    const updated = members.map(m => {
      if (m.id === memberId) {
        targetMember = {
          ...m,
          weeklyStatus: {
            ...m.weeklyStatus,
            [weekKey]: !m.weeklyStatus[weekKey]
          }
        };
        return targetMember;
      }
      return m;
    });
    this.saveMembers(updated);

    if (targetMember) {
      const client = getSupabaseClient();
      if (client) {
        client.from('kas_members').update({
          weekly_status: targetMember.weeklyStatus
        }).eq('id', memberId).then();
      }
    }
  }

  public static addMember(name: string, studentId: string, phone?: string): KasMember {
    const members = this.getMembers();
    const newMember: KasMember = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      studentId,
      phone,
      weeklyStatus: {}
    };
    members.push(newMember);
    this.saveMembers(members);

    const client = getSupabaseClient();
    if (client) {
      client.from('kas_members').insert([{
        name,
        student_id: studentId,
        phone,
        weekly_status: {}
      }]).then();
    }
    return newMember;
  }

  public static addMembers(newMembersList: { name: string; studentId: string; phone?: string }[]): KasMember[] {
    const members = this.getMembers();
    const created: KasMember[] = newMembersList.map((m, idx) => ({
      id: `m-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: m.name.trim(),
      studentId: m.studentId.trim(),
      phone: m.phone?.trim() || undefined,
      weeklyStatus: {}
    }));
    const merged = [...members, ...created];
    this.saveMembers(merged);

    const client = getSupabaseClient();
    if (client) {
      client.from('kas_members').insert(created.map(m => ({
        name: m.name,
        student_id: m.studentId,
        phone: m.phone,
        weekly_status: {}
      }))).then();
    }
    return created;
  }

  // ---------------- SETTINGS METHODS ----------------
  public static getSettings(): ClassSettings {
    const data = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: ClassSettings): void {
    localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    
    initSupabase();

    const client = getSupabaseClient();
    if (client) {
      client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear
      }]).then();
    }
  }

  // ---------------- AUDIT LOG METHODS ----------------
  public static getAuditLogs(): AuditLogEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY_AUDIT);
    return data ? JSON.parse(data) : [];
  }

  public static addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const current = this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...current].slice(0, 500);
    localStorage.setItem(this.STORAGE_KEY_AUDIT, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      client.from('audit_logs').insert([{
        action: entry.action,
        details: entry.details,
        performed_by: entry.performedBy,
        user_role: entry.userRole,
        created_at: newLog.timestamp
      }]).then();
    }

    return newLog;
  }
}
