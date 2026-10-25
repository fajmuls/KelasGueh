import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { KasTransaction, KasMember, ClassSettings } from '../types/kas.ts';

/**
 * CORE DATABASE SERVICE - KELAS GUE v3.9.0
 * Optimized for Supabase with robust cloud-first synchronization.
 */

// Initial default settings
export const DEFAULT_SETTINGS: ClassSettings = {
  className: 'Kelas Gue',
  weeklyDuesAmount: 5000,
  kasTargetAmount: 2500000,
  currencyPrefix: 'Rp',
  academicYear: 'Semester Ganjil 2026/2027',
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://husymjsimolzvidunkur.supabase.co',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c3ltanNpbW9senZpZHVua3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTMyMDgsImV4cCI6MjEwODQyOTIwOH0.aDla7rhA2J1QNC_EXivKX2rzpuEVKuuMdTQ09XUNlkc',
  siteUrl: 'https://kelasgueh.vercel.app/'
};

// Initial empty states
export const INITIAL_MEMBERS: KasMember[] = [];
export const INITIAL_TRANSACTIONS: KasTransaction[] = [];

// Supabase client instance holder
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  // HARD RESET: If browser still remembers the OLD paused project, delete it immediately
  const oldUrl = 'ireqpxgmlrsmcgidfthg.supabase.co';
  if (localStorage.getItem('kelasgue_supabase_url')?.includes(oldUrl)) {
    localStorage.removeItem('kelasgue_supabase_url');
    localStorage.removeItem('kelasgue_supabase_key');
  }

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('kelasgue_supabase_url');
  const localKey = localStorage.getItem('kelasgue_supabase_key');

  return {
    url: envUrl || localUrl || DEFAULT_SETTINGS.supabaseUrl || '',
    anonKey: envKey || localKey || DEFAULT_SETTINGS.supabaseAnonKey || ''
  };
};

export const initSupabase = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  // Reuse instance if config hasn't changed
  if (supabaseInstance) {
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl === url) return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Gagal inisialisasi Supabase:', err);
    supabaseInstance = null;
    return null;
  }
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseInstance) return initSupabase();
  return supabaseInstance;
};

// Realtime Cloud Sync Status
export type CloudSyncStatus = 'synced' | 'syncing' | 'offline';
type SyncListener = (status: CloudSyncStatus) => void;
const syncListeners: SyncListener[] = [];
let currentSyncStatus: CloudSyncStatus = 'offline';

export const setCloudSyncStatus = (status: CloudSyncStatus): void => {
  currentSyncStatus = status;
  syncListeners.forEach(listener => {
    try { listener(status); } catch (e) { console.warn('Sync listener error:', e); }
  });
};

export const subscribeCloudSync = (listener: SyncListener): () => void => {
  syncListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    const idx = syncListeners.indexOf(listener);
    if (idx >= 0) syncListeners.splice(idx, 1);
  };
};

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
  userRole: string;
}

// Helper to generate UUIDs
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getCloudSyncStatus = (): CloudSyncStatus => currentSyncStatus;

// Compress image before upload
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
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Upload receipt image to Supabase Storage
export const uploadReceiptToSupabase = async (file: File): Promise<{ url?: string; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { error: 'Koneksi database tidak aktif.' };

  try {
    const compressedBlob = await compressImage(file);
    const fileName = `nota_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    const { data, error } = await client.storage
      .from('nota-kas')
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;
    const { data: publicData } = client.storage.from('nota-kas').getPublicUrl(data.path);
    return { url: publicData.publicUrl };
  } catch (err: any) {
    return { error: err.message };
  }
};

/**
 * REPOSITORY UTAMA - KELAS GUE
 * Mengelola sinkronisasi antara Supabase dan LocalStorage
 */
export class LocalKasRepository {
  private static KEY_TX = 'kelasgue_transactions_v3';
  private static KEY_MEMBERS = 'kelasgue_members_v3';
  private static KEY_SETTINGS = 'kelasgue_settings_v3';
  private static KEY_AUDIT = 'kelasgue_audit_logs_v1';

  // ---------------- LOCAL PERSISTENCE ----------------
  public static saveTransactions(txs: KasTransaction[]): void {
    localStorage.setItem(this.KEY_TX, JSON.stringify(txs));
  }

  public static saveMembers(members: KasMember[]): void {
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(members));
  }

  // ---------------- SETTINGS ----------------
  public static getSettings(): ClassSettings {
    const data = localStorage.getItem(this.KEY_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  public static async fetchSettingsFromSupabase(): Promise<ClassSettings> {
    const client = getSupabaseClient();
    const local = this.getSettings();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client.from('class_settings').select('*').eq('id', 1).maybeSingle();
      
      if (error) {
        console.warn('⚠️ Gagal fetch settings cloud:', error.message);
        setCloudSyncStatus('offline');
        return local;
      }

      if (data) {
        const mapped: ClassSettings = {
          ...local,
          className: data.class_name || local.className,
          weeklyDuesAmount: Number(data.weekly_dues_amount ?? local.weeklyDuesAmount),
          kasTargetAmount: Number(data.kas_target_amount ?? local.kasTargetAmount), // FIX: Menggunakan kas_target_amount
          currencyPrefix: data.currency_prefix || local.currencyPrefix,
          academicYear: data.academic_year || local.academicYear,
          siteUrl: data.site_url || local.siteUrl
        };
        localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(mapped));
        setCloudSyncStatus('synced');
        return mapped;
      }
      setCloudSyncStatus('synced');
      return local;
    } catch (err) {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async saveSettings(settings: ClassSettings): Promise<void> {
    localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(settings));
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    
    supabaseInstance = null; // Reset client in case keys changed
    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount, // FIX: Naming consistency
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear,
        site_url: settings.siteUrl,
        supabase_url: settings.supabaseUrl,
        supabase_anon_key: settings.supabaseAnonKey
      }]);
      if (error) {
        setCloudSyncStatus('offline');
        throw error;
      }
      setCloudSyncStatus('synced');
    }
  }

  // ---------------- TRANSAKSI ----------------
  public static getTransactions(): KasTransaction[] {
    const data = localStorage.getItem(this.KEY_TX);
    return data ? JSON.parse(data) : [];
  }

  public static async fetchTransactionsFromSupabase(): Promise<KasTransaction[]> {
    const client = getSupabaseClient();
    const local = this.getTransactions();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client.from('kas_transactions').select('*').order('date', { ascending: false });
      if (error) {
        setCloudSyncStatus('offline');
        return local;
      }

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

      localStorage.setItem(this.KEY_TX, JSON.stringify(mapped));
      setCloudSyncStatus('synced');
      return mapped;
    } catch {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): Promise<KasTransaction> {
    const newTx: KasTransaction = {
      ...tx,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    
    // Optimistic UI: Save locally
    const current = this.getTransactions();
    localStorage.setItem(this.KEY_TX, JSON.stringify([newTx, ...current]));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').insert([{
        id: newTx.id,
        type: tx.type,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        recorded_by: tx.recordedBy,
        receipt_url: tx.receiptUrl,
        notes: tx.notes
      }]);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return newTx;
  }

  public static async deleteTransaction(id: string): Promise<void> {
    const current = this.getTransactions();
    localStorage.setItem(this.KEY_TX, JSON.stringify(current.filter(t => t.id !== id)));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').delete().eq('id', id);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
  }

  // ---------------- ANGGOTA ----------------
  public static getMembers(): KasMember[] {
    const data = localStorage.getItem(this.KEY_MEMBERS);
    return data ? JSON.parse(data) : [];
  }

  public static async fetchMembersFromSupabase(): Promise<KasMember[]> {
    const client = getSupabaseClient();
    const local = this.getMembers();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client.from('kas_members').select('*').order('name');
      if (error) {
        setCloudSyncStatus('offline');
        return local;
      }

      const mapped: KasMember[] = (data || []).map(m => ({
        id: m.id,
        name: m.name,
        studentId: m.student_id,
        phone: m.phone,
        weeklyStatus: typeof m.weekly_status === 'string' ? JSON.parse(m.weekly_status) : m.weekly_status
      }));

      localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(mapped));
      setCloudSyncStatus('synced');
      return mapped;
    } catch {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async addMember(name: string, studentId: string, phone?: string): Promise<KasMember> {
    const newMember: KasMember = {
      id: generateUUID(),
      name,
      studentId,
      phone,
      weeklyStatus: {}
    };

    const current = this.getMembers();
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify([...current, newMember]));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').insert([{
        id: newMember.id,
        name,
        student_id: studentId,
        phone,
        weekly_status: {}
      }]);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return newMember;
  }

  public static async toggleMemberWeek(memberId: string, weekKey: string): Promise<void> {
    const members = this.getMembers();
    const m = members.find(m => m.id === memberId);
    if (!m) return;

    const newStatus = { ...(m.weeklyStatus || {}), [weekKey]: !m.weeklyStatus?.[weekKey] };
    const updated = members.map(item => item.id === memberId ? { ...item, weeklyStatus: newStatus } : item);
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').update({ weekly_status: newStatus }).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
  }

  public static async setMemberWeekStatus(memberId: string, weekKey: string, isPaid: boolean): Promise<void> {
    const members = this.getMembers();
    const m = members.find(m => m.id === memberId);
    if (!m) return;

    const newStatus = { ...(m.weeklyStatus || {}), [weekKey]: isPaid };
    const updated = members.map(item => item.id === memberId ? { ...item, weeklyStatus: newStatus } : item);
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').update({ weekly_status: newStatus }).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
  }

  public static async toggleAllMembersWeek(weekKey: string, shouldPay: boolean): Promise<KasMember[]> {
    const members = this.getMembers();
    const updated = members.map(m => ({
      ...m,
      weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: shouldPay }
    }));
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload = updated.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        weekly_status: m.weeklyStatus
      }));
      const { error } = await client.from('kas_members').upsert(payload);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return updated;
  }

  // ---------------- AUDIT LOGS ----------------
  public static getAuditLogs(): AuditLogEntry[] {
    const data = localStorage.getItem(this.KEY_AUDIT);
    return data ? JSON.parse(data) : [];
  }

  public static async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const newLog: AuditLogEntry = {
      ...entry,
      id: generateUUID(),
      timestamp: new Date().toISOString()
    };
    
    const logs = [newLog, ...this.getAuditLogs()].slice(0, 500);
    localStorage.setItem(this.KEY_AUDIT, JSON.stringify(logs));

    const client = getSupabaseClient();
    if (client) {
      await client.from('audit_logs').insert([{
        id: newLog.id,
        action: entry.action,
        details: entry.details,
        performed_by: entry.performedBy,
        user_role: entry.userRole,
        created_at: newLog.timestamp
      }]);
    }
    return newLog;
  }

  public static async fetchAuditLogsFromSupabase(): Promise<AuditLogEntry[]> {
    const client = getSupabaseClient();
    if (!client) return this.getAuditLogs();

    const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return this.getAuditLogs();

    const mapped: AuditLogEntry[] = (data || []).map(l => ({
      id: l.id,
      timestamp: l.created_at,
      action: l.action,
      details: l.details,
      performedBy: l.performed_by,
      userRole: l.user_role
    }));

    localStorage.setItem(this.KEY_AUDIT, JSON.stringify(mapped));
    return mapped;
  }

  public static async updateMember(memberId: string, updates: Partial<KasMember>): Promise<void> {
    const members = this.getMembers();
    const updated = members.map(m => m.id === memberId ? { ...m, ...updates } : m);
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.studentId) payload.student_id = updates.studentId;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.weeklyStatus) payload.weekly_status = updates.weeklyStatus;

      const { error } = await client.from('kas_members').update(payload).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
  }

  public static async addMembers(newMembers: { name: string; studentId: string; phone?: string }[]): Promise<KasMember[]> {
    const created: KasMember[] = newMembers.map(m => ({
      id: generateUUID(),
      name: m.name,
      studentId: m.studentId,
      phone: m.phone,
      weeklyStatus: {}
    }));

    const current = this.getMembers();
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify([...current, ...created]));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload = created.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        phone: m.phone || null,
        weekly_status: {}
      }));
      const { error } = await client.from('kas_members').insert(payload);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return created;
  }

  public static async forceSyncAllToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      setCloudSyncStatus('syncing');
      const txs = this.getTransactions();
      const members = this.getMembers();
      const settings = this.getSettings();
      const client = getSupabaseClient();
      
      if (!client) throw new Error('Koneksi database tidak aktif.');

      // Sync settings
      await this.saveSettings(settings);

      // Sync members
      if (members.length > 0) {
        const { error } = await client.from('kas_members').upsert(members.map(m => ({
          id: m.id,
          name: m.name,
          student_id: m.studentId,
          phone: m.phone || null,
          weekly_status: m.weeklyStatus || {}
        })));
        if (error) throw error;
      }

      // Sync transactions
      if (txs.length > 0) {
        const { error } = await client.from('kas_transactions').upsert(txs.map(t => ({
          id: t.id,
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recorded_by: t.recordedBy,
          receipt_url: t.receiptUrl || null,
          notes: t.notes || null
        })));
        if (error) throw error;
      }

      setCloudSyncStatus('synced');
      return { success: true, message: '✅ Sinkronisasi total ke Cloud berhasil!' };
    } catch (err: any) {
      setCloudSyncStatus('offline');
      return { success: false, message: `❌ Gagal sync: ${err.message}` };
    }
  }

  // ---------------- USER PROFILES & ROLES ----------------
  public static async syncUserProfile(profile: { id: string; email: string; name: string; avatar?: string }): Promise<'superadmin' | 'bendahara' | 'anggota'> {
    const client = getSupabaseClient();
    if (!client) return 'anggota';

    try {
      // 1. Get role from whitelist
      const { data: whitelist } = await client.from('authorized_whitelist').select('role').eq('email', profile.email.toLowerCase()).maybeSingle();
      let role: 'superadmin' | 'bendahara' | 'anggota' = 'anggota';
      
      if (profile.email.toLowerCase() === 'mrachmanfm@gmail.com') role = 'superadmin';
      else if (whitelist) role = whitelist.role;

      // 2. Upsert profile
      await client.from('user_profiles').upsert([{
        id: profile.id,
        email: profile.email.toLowerCase(),
        full_name: profile.name,
        avatar_url: profile.avatar,
        role: role
      }]);

      return role;
    } catch (err) {
      console.error('Error syncing profile:', err);
      return 'anggota';
    }
  }

  public static async getWhitelist(): Promise<any[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    try {
      const { data: whitelistData } = await client.from('authorized_whitelist').select('*');
      const { data: profilesData } = await client.from('user_profiles').select('*');

      const map = new Map<string, any>();

      // Add profiles first (all Google login users)
      (profilesData || []).forEach(p => {
        map.set(p.email.toLowerCase(), {
          id: p.id,
          email: p.email,
          name: p.full_name || p.email.split('@')[0],
          role: p.role || 'anggota',
          avatar: p.avatar_url
        });
      });

      // Override / add with whitelist roles
      (whitelistData || []).forEach(w => {
        const existing = map.get(w.email.toLowerCase());
        if (existing) {
          existing.role = w.role;
        } else {
          map.set(w.email.toLowerCase(), {
            id: `wl_${w.email}`,
            email: w.email,
            name: w.email.split('@')[0],
            role: w.role,
          });
        }
      });

      return Array.from(map.values());
    } catch (err) {
      console.error('Error fetching whitelist & profiles:', err);
      return [];
    }
  }

  public static async updateWhitelist(email: string, role: 'bendahara' | 'anggota'): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    if (role === 'anggota') {
      await client.from('authorized_whitelist').delete().eq('email', email.toLowerCase());
    } else {
      await client.from('authorized_whitelist').upsert([{ email: email.toLowerCase(), role }]);
    }
    
    // Also update existing profile if any
    await client.from('user_profiles').update({ role }).eq('email', email.toLowerCase());
  }
}

// Realtime Subscription
export const subscribeToRealtimeKas = (
  onTransactionChange: (payload: any) => void,
  onMemberChange: (payload: any) => void,
  onAuditLogChange?: (payload: any) => void,
  onSettingsChange?: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime_kas_v3_9_0')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_transactions' }, (p) => onTransactionChange(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_members' }, (p) => onMemberChange(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (p) => onAuditLogChange?.(p))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'class_settings' }, (p) => onSettingsChange?.(p))
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// Supabase Google Auth helper
export const signInWithGoogleSupabase = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase belum dikonfigurasi.' };

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
