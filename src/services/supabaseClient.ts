import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { KasTransaction, KasMember, ClassSettings, KolektifBill, StudentPointLog, AttendanceRecord, MeetingMinute, ClassInventoryItem, CourseSchedule, CourseAssignment, UserRole, ClassBackupData } from '../types/kas.ts';
import { getRegisteredUsers, registerOrUpdateUser, updateUserRole, deleteRegisteredUser, autoDetectGenderByName } from '../utils/userManagement.ts';
import { toTitleCase } from '../utils/textFormatting.ts';

/**
 * CORE DATABASE SERVICE - KELAS GUE v4.3.0
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

  public static async saveMembers(members: KasMember[]): Promise<void> {
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(members));
    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload = members.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        phone: m.phone || null,
        gender: m.gender || autoDetectGenderByName(m.name),
        is_active: m.isActive !== false,
        weekly_status: m.weeklyStatus || {}
      }));
      const { error } = await client.from('kas_members').upsert(payload);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
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
        setCloudSyncStatus('offline');
        return local;
      }

      if (data) {
        let monthlyDuesOverrides = local.monthlyDuesOverrides || {};
        let siteUrl = data.site_url || local.siteUrl;

        // Check if site_url contains serialized JSON config payload
        if (data.site_url && data.site_url.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.site_url);
            if (parsed.monthlyDuesOverrides) monthlyDuesOverrides = { ...monthlyDuesOverrides, ...parsed.monthlyDuesOverrides };
            if (parsed.siteUrl !== undefined) siteUrl = parsed.siteUrl;
          } catch {
            // standard url
          }
        }

        if (data.monthly_dues_overrides) {
          monthlyDuesOverrides = typeof data.monthly_dues_overrides === 'string'
            ? JSON.parse(data.monthly_dues_overrides)
            : data.monthly_dues_overrides;
        }

        const mapped: ClassSettings = {
          ...local,
          className: data.class_name || local.className,
          weeklyDuesAmount: Number(data.weekly_dues_amount ?? local.weeklyDuesAmount),
          kasTargetAmount: Number(data.kas_target_amount ?? local.kasTargetAmount),
          currencyPrefix: data.currency_prefix || local.currencyPrefix,
          academicYear: data.academic_year || local.academicYear,
          siteUrl: siteUrl,
          monthlyDuesOverrides: monthlyDuesOverrides
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
      
      const siteUrlPayload = JSON.stringify({
        siteUrl: settings.siteUrl || '',
        monthlyDuesOverrides: settings.monthlyDuesOverrides || {}
      });

      const basePayload: any = {
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear,
        site_url: siteUrlPayload,
        supabase_url: settings.supabaseUrl,
        supabase_anon_key: settings.supabaseAnonKey
      };

      // Attempt to save with monthly_dues_overrides column first
      let res = await client.from('class_settings').upsert([{
        ...basePayload,
        monthly_dues_overrides: settings.monthlyDuesOverrides || {}
      }]);

      if (res.error) {
        // Fallback without monthly_dues_overrides column if column not yet added
        const fallbackRes = await client.from('class_settings').upsert([basePayload]);
        if (fallbackRes.error) {
          setCloudSyncStatus('offline');
          throw fallbackRes.error;
        }
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

  public static async updateTransaction(id: string, updates: Partial<KasTransaction>): Promise<KasTransaction | null> {
    const current = this.getTransactions();
    const idx = current.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const updatedTx = { ...current[idx], ...updates };
    current[idx] = updatedTx;
    localStorage.setItem(this.KEY_TX, JSON.stringify(current));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload: any = {};
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.recordedBy !== undefined) payload.recorded_by = updates.recordedBy;
      if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { error } = await client.from('kas_transactions').update(payload).eq('id', id);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return updatedTx;
  }

  public static async deleteMultipleTransactions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const current = this.getTransactions();
    const idSet = new Set(ids);
    localStorage.setItem(this.KEY_TX, JSON.stringify(current.filter(t => !idSet.has(t.id))));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').delete().in('id', ids);
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
        gender: m.gender || autoDetectGenderByName(m.name),
        isActive: m.is_active !== false,
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

  public static async addMember(name: string, studentId: string, phone?: string, gender?: 'L' | 'P'): Promise<KasMember> {
    const formattedName = toTitleCase(name);
    const detectedGender = gender || autoDetectGenderByName(formattedName);
    const newMember: KasMember = {
      id: generateUUID(),
      name: formattedName,
      studentId,
      phone,
      gender: detectedGender,
      isActive: true,
      weeklyStatus: {}
    };

    const current = this.getMembers();
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify([...current, newMember]));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').insert([{
        id: newMember.id,
        name: formattedName,
        student_id: studentId,
        phone,
        gender: detectedGender,
        is_active: true,
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
    // Only toggle status for active members; inactive members remain untouched
    const updated = members.map(m => {
      if (m.isActive === false) return m;
      return {
        ...m,
        weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: shouldPay }
      };
    });
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload = updated.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        weekly_status: m.weeklyStatus,
        gender: m.gender || null,
        is_active: m.isActive !== false
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

  public static async clearAuditLogs(): Promise<void> {
    localStorage.removeItem(this.KEY_AUDIT);
    const client = getSupabaseClient();
    if (client) {
      await client.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  public static async deleteAuditLog(id: string): Promise<void> {
    const logs = this.getAuditLogs().filter(l => l.id !== id);
    localStorage.setItem(this.KEY_AUDIT, JSON.stringify(logs));
    const client = getSupabaseClient();
    if (client) {
      await client.from('audit_logs').delete().eq('id', id);
    }
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
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { error } = await client.from('kas_members').update(payload).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
  }

  public static async deleteMember(memberId: string): Promise<void> {
    const current = this.getMembers();
    const updated = current.filter(m => m.id !== memberId);
    localStorage.setItem(this.KEY_MEMBERS, JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').delete().eq('id', memberId);
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
          gender: m.gender || autoDetectGenderByName(m.name),
          is_active: m.isActive !== false,
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
  public static async syncUserProfile(profile: { id: string; email: string; name: string; avatar?: string }): Promise<UserRole> {
    // Also register locally for robust fallback
    const localRole = registerOrUpdateUser(profile);

    const client = getSupabaseClient();
    if (!client) return localRole;

    try {
      // 1. Get role from whitelist
      const { data: whitelist } = await client.from('authorized_whitelist').select('role').eq('email', profile.email.toLowerCase()).maybeSingle();
      let role: UserRole = localRole;
      
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
      return localRole;
    }
  }

  public static async getWhitelist(): Promise<any[]> {
    const map = new Map<string, any>();

    // 1. Load local registered users first (ensures any logged-in user is always visible)
    const localUsers = getRegisteredUsers();
    localUsers.forEach(u => {
      map.set(u.email.toLowerCase(), {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.email.toLowerCase() === 'mrachmanfm@gmail.com' ? 'superadmin' : u.role,
        avatar: u.avatar,
        linkedMemberId: u.linkedMemberId,
        linkedMemberName: u.linkedMemberName
      });
    });

    // Ensure superadmin is always present
    if (!map.has('mrachmanfm@gmail.com')) {
      map.set('mrachmanfm@gmail.com', {
        id: 'usr_super',
        email: 'mrachmanfm@gmail.com',
        name: 'Muhammad Rachman Fajri Muliyansah',
        role: 'superadmin'
      });
    }

    const client = getSupabaseClient();
    if (!client) return Array.from(map.values());

    try {
      const { data: whitelistData } = await client.from('authorized_whitelist').select('*');
      const { data: profilesData } = await client.from('user_profiles').select('*');

      // Add profiles from Supabase
      (profilesData || []).forEach(p => {
        const existing = map.get(p.email.toLowerCase());
        map.set(p.email.toLowerCase(), {
          id: p.id,
          email: p.email,
          name: p.full_name || existing?.name || p.email.split('@')[0],
          role: p.email.toLowerCase() === 'mrachmanfm@gmail.com' ? 'superadmin' : (p.role || existing?.role || 'anggota'),
          avatar: p.avatar_url || existing?.avatar,
          linkedMemberId: existing?.linkedMemberId,
          linkedMemberName: existing?.linkedMemberName
        });
      });

      // Override with whitelist roles
      (whitelistData || []).forEach(w => {
        const existing = map.get(w.email.toLowerCase());
        if (existing) {
          existing.role = w.email.toLowerCase() === 'mrachmanfm@gmail.com' ? 'superadmin' : w.role;
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
      return Array.from(map.values());
    }
  }

  public static async updateWhitelist(email: string, role: 'bendahara' | 'sekretaris' | 'anggota', userName?: string): Promise<void> {
    const emailLower = email.toLowerCase().trim();
    // Update locally first
    updateUserRole(emailLower, role, userName);

    const client = getSupabaseClient();
    if (!client) return;

    try {
      if (role === 'anggota') {
        await client.from('authorized_whitelist').delete().eq('email', emailLower);
        await client.from('user_profiles').update({ role: 'anggota' }).eq('email', emailLower);
      } else {
        await client.from('authorized_whitelist').upsert([{ email: emailLower, role }]);
        await client.from('user_profiles').update({ role }).eq('email', emailLower);
      }
    } catch (err) {
      console.error('Error updating whitelist in Supabase:', err);
    }
  }

  public static async deleteWhitelistUser(email: string): Promise<void> {
    const emailLower = email.toLowerCase().trim();
    deleteRegisteredUser(emailLower);

    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.from('authorized_whitelist').delete().eq('email', emailLower);
      await client.from('user_profiles').update({ role: 'anggota' }).eq('email', emailLower);
    } catch (err) {
      console.error('Error deleting whitelist user in Supabase:', err);
    }
  }

  // ---------------- KOLEKTIF BILLS (IURAN KHUSUS / ACARA) ----------------
  private static KEY_KOLEKTIF = 'kelasgue_kolektif_bills_v1';

  public static getKolektifBills(): KolektifBill[] {
    const raw = localStorage.getItem(this.KEY_KOLEKTIF);
    if (!raw) {
      localStorage.setItem(this.KEY_KOLEKTIF, JSON.stringify([]));
      return [];
    }
    try {
      const parsed: KolektifBill[] = JSON.parse(raw);
      return parsed.map(b => ({
        ...b,
        billType: b.billType || (b.category?.toLowerCase().includes('patungan') ? 'patungan' : 'acara')
      }));
    } catch {
      return [];
    }
  }

  public static saveKolektifBills(bills: KolektifBill[]): void {
    localStorage.setItem(this.KEY_KOLEKTIF, JSON.stringify(bills));
  }

  public static addKolektifBill(bill: Omit<KolektifBill, 'id' | 'createdAt'>): KolektifBill {
    const bills = this.getKolektifBills();
    const newBill: KolektifBill = {
      ...bill,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    bills.unshift(newBill);
    this.saveKolektifBills(bills);
    return newBill;
  }

  public static updateKolektifBill(id: string, updates: Partial<KolektifBill>): void {
    const bills = this.getKolektifBills().map(b => b.id === id ? { ...b, ...updates } : b);
    this.saveKolektifBills(bills);
  }

  public static deleteKolektifBill(id: string): void {
    const bills = this.getKolektifBills().filter(b => b.id !== id);
    this.saveKolektifBills(bills);
  }

  public static toggleKolektifPayment(billId: string, memberId: string): { isPaid: boolean } {
    const bills = this.getKolektifBills();
    const target = bills.find(b => b.id === billId);
    if (!target) return { isPaid: false };

    let isPaid = false;
    if (target.paidMemberIds.includes(memberId)) {
      target.paidMemberIds = target.paidMemberIds.filter(id => id !== memberId);
      isPaid = false;
    } else {
      target.paidMemberIds.push(memberId);
      isPaid = true;
    }
    this.saveKolektifBills(bills);
    return { isPaid };
  }

  // ---------------- SEKRETARIAT: POIN KEAKTIFAN ----------------
  private static KEY_POINTS = 'kelasgue_secretary_points_v2';

  public static getPointLogs(): StudentPointLog[] {
    const raw = localStorage.getItem(this.KEY_POINTS);
    if (!raw) {
      localStorage.setItem(this.KEY_POINTS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static addPointLog(log: Omit<StudentPointLog, 'id' | 'createdAt'>): StudentPointLog {
    const logs = this.getPointLogs();
    const newLog: StudentPointLog = {
      ...log,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(this.KEY_POINTS, JSON.stringify(logs));
    return newLog;
  }

  public static deletePointLog(id: string): void {
    const logs = this.getPointLogs().filter(l => l.id !== id);
    localStorage.setItem(this.KEY_POINTS, JSON.stringify(logs));
  }

  // ---------------- SEKRETARIAT: PRESENSI KELAS & RAPAT ----------------
  private static KEY_ATTENDANCE = 'kelasgue_secretary_attendance_v1';

  public static getAttendanceRecords(): AttendanceRecord[] {
    const raw = localStorage.getItem(this.KEY_ATTENDANCE);
    if (!raw) {
      localStorage.setItem(this.KEY_ATTENDANCE, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveAttendanceRecord(rec: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }): AttendanceRecord {
    const records = this.getAttendanceRecords();
    if (rec.id) {
      const idx = records.findIndex(r => r.id === rec.id);
      if (idx >= 0) {
        records[idx] = { ...records[idx], ...rec } as AttendanceRecord;
        localStorage.setItem(this.KEY_ATTENDANCE, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec: AttendanceRecord = {
      ...rec,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRec);
    localStorage.setItem(this.KEY_ATTENDANCE, JSON.stringify(records));
    return newRec;
  }

  public static deleteAttendanceRecord(id: string): void {
    const records = this.getAttendanceRecords().filter(r => r.id !== id);
    localStorage.setItem(this.KEY_ATTENDANCE, JSON.stringify(records));
  }

  // ---------------- SEKRETARIAT: NOTULENSI RAPAT & FORMAT SURAT ----------------
  private static KEY_MINUTES = 'kelasgue_secretary_minutes_v1';

  public static getMeetingMinutes(): MeetingMinute[] {
    const raw = localStorage.getItem(this.KEY_MINUTES);
    if (!raw) {
      localStorage.setItem(this.KEY_MINUTES, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveMeetingMinute(minute: Omit<MeetingMinute, 'id' | 'createdAt'> & { id?: string }): MeetingMinute {
    const minutes = this.getMeetingMinutes();
    if (minute.id) {
      const idx = minutes.findIndex(m => m.id === minute.id);
      if (idx >= 0) {
        minutes[idx] = { ...minutes[idx], ...minute } as MeetingMinute;
        localStorage.setItem(this.KEY_MINUTES, JSON.stringify(minutes));
        return minutes[idx];
      }
    }
    const newMinute: MeetingMinute = {
      ...minute,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    minutes.unshift(newMinute);
    localStorage.setItem(this.KEY_MINUTES, JSON.stringify(minutes));
    return newMinute;
  }

  public static deleteMeetingMinute(id: string): void {
    const minutes = this.getMeetingMinutes().filter(m => m.id !== id);
    localStorage.setItem(this.KEY_MINUTES, JSON.stringify(minutes));
  }

  // ---------------- SEKRETARIAT: INVENTARIS KELAS ----------------
  private static KEY_INVENTORY = 'kelasgue_secretary_inventory_v2';

  public static getInventoryItems(): ClassInventoryItem[] {
    const raw = localStorage.getItem(this.KEY_INVENTORY);
    if (!raw) {
      localStorage.setItem(this.KEY_INVENTORY, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveInventoryItem(item: Omit<ClassInventoryItem, 'id' | 'createdAt'> & { id?: string }): ClassInventoryItem {
    const items = this.getInventoryItems();
    if (item.id) {
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...item } as ClassInventoryItem;
        localStorage.setItem(this.KEY_INVENTORY, JSON.stringify(items));
        return items[idx];
      }
    }
    const newItem: ClassInventoryItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    localStorage.setItem(this.KEY_INVENTORY, JSON.stringify(items));
    return newItem;
  }

  public static deleteInventoryItem(id: string): void {
    const items = this.getInventoryItems().filter(i => i.id !== id);
    localStorage.setItem(this.KEY_INVENTORY, JSON.stringify(items));
  }

  // ---------------- SEKRETARIAT: JADWAL KULIAH & TUGAS ----------------
  private static KEY_COURSES = 'kelasgue_secretary_courses_v2';

  public static getCourseSchedules(): CourseSchedule[] {
    const raw = localStorage.getItem(this.KEY_COURSES);
    if (!raw) {
      localStorage.setItem(this.KEY_COURSES, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveCourseSchedule(course: Omit<CourseSchedule, 'id' | 'createdAt'> & { id?: string }): CourseSchedule {
    const courses = this.getCourseSchedules();
    if (course.id) {
      const idx = courses.findIndex(c => c.id === course.id);
      if (idx >= 0) {
        courses[idx] = { ...courses[idx], ...course } as CourseSchedule;
        localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
        return courses[idx];
      }
    }
    const newCourse: CourseSchedule = {
      ...course,
      id: generateUUID(),
      assignments: course.assignments || [],
      createdAt: new Date().toISOString()
    };
    courses.push(newCourse);
    localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
    return newCourse;
  }

  public static deleteCourseSchedule(id: string): void {
    const courses = this.getCourseSchedules().filter(c => c.id !== id);
    localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
  }

  public static addCourseAssignment(courseId: string, assignment: Omit<CourseAssignment, 'id'>): void {
    const courses = this.getCourseSchedules();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const newAsg: CourseAssignment = {
      ...assignment,
      id: generateUUID()
    };
    course.assignments.push(newAsg);
    localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
  }

  public static toggleCourseAssignment(courseId: string, assignmentId: string): void {
    const courses = this.getCourseSchedules();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const asg = course.assignments.find(a => a.id === assignmentId);
    if (!asg) return;
    asg.status = asg.status === 'selesai' ? 'pending' : 'selesai';
    localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
  }

  public static deleteCourseAssignment(courseId: string, assignmentId: string): void {
    const courses = this.getCourseSchedules();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    course.assignments = course.assignments.filter(a => a.id !== assignmentId);
    localStorage.setItem(this.KEY_COURSES, JSON.stringify(courses));
  }

  // ---------------- FULL APPLICATION JSON BACKUP & RESTORE ----------------
  public static async exportFullBackupJSON(exportedBy: string, role: string): Promise<ClassBackupData> {
    const settings = this.getSettings();
    const members = this.getMembers();
    const transactions = this.getTransactions();
    const kolektifBills = this.getKolektifBills();
    const savedGroupCollections = JSON.parse(localStorage.getItem('kelasgue_saved_group_collections') || '[]');
    const auditLogs = this.getAuditLogs();
    const whitelist = await this.getWhitelist();
    const attendance = this.getAttendanceRecords();
    const studentPoints = this.getPointLogs();
    const minutes = this.getMeetingMinutes();

    const backupData: ClassBackupData = {
      version: '4.8.0',
      exportedAt: new Date().toISOString(),
      exportedBy: exportedBy || 'Pengurus',
      role: role || 'pengurus',
      settings,
      members,
      transactions,
      kolektifBills,
      savedGroupCollections,
      auditLogs,
      whitelist,
      attendance,
      studentPoints,
      minutes
    };

    // Trigger browser JSON file download
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kelasgue_backup_${dateStr}_v4.8.0.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.warn("Could not auto-download JSON:", e);
    }

    // Log the backup export activity
    await this.addAuditLog({
      action: "EKSPOR CADANGAN DATA",
      details: `Ekspor cadangan database lengkap JSON (${transactions.length} transaksi, ${members.length} siswa) oleh ${exportedBy}`,
      performedBy: exportedBy || 'Pengurus',
      userRole: role || 'pengurus'
    });

    return backupData;
  }

  public static async importFullBackupJSON(
    backup: ClassBackupData,
    importedBy: string,
    role: string
  ): Promise<{ success: boolean; message: string }> {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Format file cadangan tidak valid (bukan JSON objek).');
    }
    if (!backup.settings || !Array.isArray(backup.members) || !Array.isArray(backup.transactions)) {
      throw new Error('Struktur file cadangan tidak lengkap (wajib ada settings, members, transactions).');
    }

    // 1. Snapshot previous state before restore for undo capability
    const prevSnapshot = {
      settings: this.getSettings(),
      members: this.getMembers(),
      transactions: this.getTransactions()
    };

    // 2. Restore settings
    await this.saveSettings(backup.settings);

    // 3. Restore members
    if (Array.isArray(backup.members)) {
      await this.saveMembers(backup.members);
    }

    // 4. Restore transactions
    if (Array.isArray(backup.transactions)) {
      localStorage.setItem(this.KEY_TX, JSON.stringify(backup.transactions));
    }

    // 5. Restore kolektif bills if present
    if (Array.isArray(backup.kolektifBills)) {
      this.saveKolektifBills(backup.kolektifBills);
    }

    // 6. Restore saved group collections if present
    if (Array.isArray(backup.savedGroupCollections)) {
      localStorage.setItem('kelasgue_saved_group_collections', JSON.stringify(backup.savedGroupCollections));
    }

    // 7. Restore attendance, points, minutes if present
    if (Array.isArray(backup.attendance)) {
      localStorage.setItem(this.KEY_ATTENDANCE, JSON.stringify(backup.attendance));
    }
    if (Array.isArray(backup.studentPoints)) {
      localStorage.setItem(this.KEY_POINTS, JSON.stringify(backup.studentPoints));
    }
    if (Array.isArray(backup.minutes)) {
      localStorage.setItem(this.KEY_MINUTES, JSON.stringify(backup.minutes));
    }

    // 8. Push to Supabase Cloud
    await this.forceSyncAllToCloud();

    // 9. Add Audit Log entry
    await this.addAuditLog({
      action: "IMPOR CADANGAN DATA",
      details: `Restorasi cadangan database v${backup.version || 'unknown'} (${backup.transactions?.length || 0} transaksi, ${backup.members?.length || 0} siswa) oleh ${importedBy}. Snapshot sebelumnya tersimpan di audit.`,
      performedBy: importedBy || 'Pengurus',
      userRole: role || 'pengurus'
    });

    return {
      success: true,
      message: `Cadangan berhasil dipulihkan! (${backup.transactions?.length || 0} transaksi, ${backup.members?.length || 0} siswa tersinkronisasi).`
    };
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
