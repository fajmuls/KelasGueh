import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { KasTransaction, KasMember, ClassSettings } from '../types/kas.ts';

/**
 * REPOSITORY DATABASE KELAS GUE v3.9.0
 * Fokus: Kecepatan, Stabilitas, dan Real-time.
 */

export const DEFAULT_SETTINGS: ClassSettings = {
  className: 'Kelas Gue',
  weeklyDuesAmount: 5000,
  kasTargetAmount: 2500000,
  currencyPrefix: 'Rp',
  academicYear: 'Semester Ganjil 2026/2027',
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ireqpxgmlrsmcgidfthg.supabase.co',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV',
  siteUrl: 'https://kelasgueh.vercel.app/'
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const localUrl = localStorage.getItem('kelasgue_supabase_url');
  const localKey = localStorage.getItem('kelasgue_supabase_key');
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: localUrl || envUrl || DEFAULT_SETTINGS.supabaseUrl || '',
    anonKey: localKey || envKey || DEFAULT_SETTINGS.supabaseAnonKey || ''
  };
};

export const initSupabase = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  } catch (err) {
    console.error('Gagal inisialisasi Supabase:', err);
    return null;
  }
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseInstance) return initSupabase();
  return supabaseInstance;
};

// ---------------- REPOSITORY ----------------

export class DbService {
  /**
   * PENGATURAN KELAS
   */
  static async getSettings(): Promise<ClassSettings> {
    const client = getSupabaseClient();
    const localData = localStorage.getItem('kelasgue_settings_v3');
    const local = localData ? JSON.parse(localData) : DEFAULT_SETTINGS;

    if (!client) return local;

    try {
      const { data, error } = await client.from('class_settings').select('*').eq('id', 1).maybeSingle();
      if (error || !data) return local;

      const mapped: ClassSettings = {
        ...local,
        className: data.class_name,
        weeklyDuesAmount: Number(data.weekly_dues_amount),
        kasTargetAmount: Number(data.kas_target_amount),
        currencyPrefix: data.currency_prefix,
        academicYear: data.academic_year,
        siteUrl: data.site_url
      };
      localStorage.setItem('kelasgue_settings_v3', JSON.stringify(mapped));
      return mapped;
    } catch {
      return local;
    }
  }

  static async saveSettings(settings: ClassSettings): Promise<void> {
    localStorage.setItem('kelasgue_settings_v3', JSON.stringify(settings));
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    
    supabaseInstance = null; // Re-init client with new keys
    const client = getSupabaseClient();
    
    if (client) {
      const { error } = await client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount, // Pastikan nama kolom benar
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear,
        site_url: settings.siteUrl,
        supabase_url: settings.supabaseUrl,
        supabase_anon_key: settings.supabaseAnonKey
      }]);
      if (error) throw error;
    }
  }

  /**
   * TRANSAKSI (BUKU KAS)
   */
  static async getTransactions(): Promise<KasTransaction[]> {
    const client = getSupabaseClient();
    if (!client) {
      const local = localStorage.getItem('kelasgue_transactions_v3');
      return local ? JSON.parse(local) : [];
    }

    const { data, error } = await client.from('kas_transactions').select('*').order('date', { ascending: false });
    if (error) throw error;

    const mapped = (data || []).map(t => ({
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

    localStorage.setItem('kelasgue_transactions_v3', JSON.stringify(mapped));
    return mapped;
  }

  static async addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Offline: Tidak bisa menambah transaksi tanpa database.');

    const { error } = await client.from('kas_transactions').insert([{
      type: tx.type,
      title: tx.title,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      recorded_by: tx.recordedBy,
      receipt_url: tx.receiptUrl,
      notes: tx.notes
    }]);

    if (error) throw error;
  }

  /**
   * ANGGOTA & IURAN
   */
  static async getMembers(): Promise<KasMember[]> {
    const client = getSupabaseClient();
    if (!client) {
      const local = localStorage.getItem('kelasgue_members_v3');
      return local ? JSON.parse(local) : [];
    }

    const { data, error } = await client.from('kas_members').select('*').order('name');
    if (error) throw error;

    const mapped = (data || []).map(m => ({
      id: m.id,
      name: m.name,
      studentId: m.student_id,
      phone: m.phone,
      weeklyStatus: typeof m.weekly_status === 'string' ? JSON.parse(m.weekly_status) : m.weekly_status
    }));

    localStorage.setItem('kelasgue_members_v3', JSON.stringify(mapped));
    return mapped;
  }

  static async updateMemberWeeklyStatus(memberId: string, status: Record<string, boolean>): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Offline: Gagal update iuran.');

    const { error } = await client.from('kas_members').update({
      weekly_status: status
    }).eq('id', memberId);

    if (error) throw error;
  }

  /**
   * AUDIT LOGS
   */
  static async addAuditLog(action: string, details: string, user: string, role: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('audit_logs').insert([{
      action,
      details,
      performed_by: user,
      user_role: role
    }]);
  }

  static async getAuditLogs(): Promise<any[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return [];
    return data || [];
  }
}
