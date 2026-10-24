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
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_L9mfK1ZtYWMV23uY3egcTg_H325a-UV',
  siteUrl: 'https://kelasgueh.vercel.app/'
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

  // If already initialized with SAME config, don't re-init
  if (supabaseInstance) {
    const currentUrl = (supabaseInstance as any).supabaseUrl;
    if (currentUrl === url) {
      return supabaseInstance;
    }
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

// Realtime Cloud Sync Status Tracker ('synced' | 'syncing' | 'offline')
export type CloudSyncStatus = 'synced' | 'syncing' | 'offline';
type SyncListener = (status: CloudSyncStatus) => void;
const syncListeners: SyncListener[] = [];
let currentSyncStatus: CloudSyncStatus = getSupabaseClient() ? 'synced' : 'offline';

export const getCloudSyncStatus = (): CloudSyncStatus => currentSyncStatus;

export const setCloudSyncStatus = (status: CloudSyncStatus): void => {
  currentSyncStatus = status;
  syncListeners.forEach(listener => {
    try {
      listener(status);
    } catch (e) {
      console.warn('Sync listener error:', e);
    }
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
  onAuditLogChange?: (payload: any) => void,
  onSettingsChange?: (payload: any) => void
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
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'class_settings' },
      (payload) => {
        if (onSettingsChange) onSettingsChange(payload);
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
    const settings = LocalKasRepository.getSettings();
    const currentOrigin = window.location.origin + window.location.pathname;
    
    // Logic: If we are in the production environment or the user has a preferred siteUrl, 
    // we use that. Otherwise, we use the current origin (especially useful for preview/dev).
    let redirectUrl = currentOrigin;
    
    if (settings.siteUrl && !window.location.hostname.includes('asia-southeast1.run.app')) {
      redirectUrl = settings.siteUrl;
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
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
// Helper to generate RFC-4122 compliant UUIDs compatible with Postgres UUID columns
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

// Local storage reactive sync repository (Cloud-First Priority)
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

  /**
   * Fetch from Supabase (Source of Truth)
   * If offline or error, falls back to LocalStorage
   */
  public static async fetchTransactionsFromSupabase(): Promise<KasTransaction[]> {
    const client = getSupabaseClient();
    const local = this.getTransactions();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client
        .from('kas_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('⚠️ Gagal mengambil transaksi dari Cloud:', error.message);
        setCloudSyncStatus('offline');
        return local;
      }

      const mappedFromCloud: KasTransaction[] = (data || []).map(t => ({
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

      // Cloud-First: Always use cloud data as primary. 
      // Only merge local data if it's genuinely missing from cloud (pending sync)
      const cloudIds = new Set(mappedFromCloud.map(t => t.id));
      const pendingLocal = local.filter(l => !cloudIds.has(l.id));

      if (pendingLocal.length > 0) {
        console.log(`📤 Ditemukan ${pendingLocal.length} transaksi lokal tertunda. Mencoba sinkronisasi...`);
        const payload = pendingLocal.map(t => ({
          id: t.id,
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recorded_by: t.recordedBy,
          receipt_url: t.receiptUrl || null,
          notes: t.notes || null
        }));

        const { error: upErr } = await client.from('kas_transactions').upsert(payload);
        if (upErr) {
          console.error('❌ Sinkronisasi transaksi tertunda gagal:', upErr.message);
        } else {
          console.log('✅ Sinkronisasi transaksi tertunda berhasil.');
        }
      }

      const finalData = [...mappedFromCloud, ...pendingLocal].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      this.saveTransactions(finalData);
      setCloudSyncStatus('synced');
      return finalData;
    } catch (err: any) {
      console.error('💥 Error fatal saat fetch transaksi:', err);
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): Promise<KasTransaction> {
    const id = generateUUID();
    const newTx: KasTransaction = {
      ...tx,
      id,
      createdAt: new Date().toISOString()
    };
    
    // Save locally first for instant UI response
    const current = this.getTransactions();
    this.saveTransactions([newTx, ...current]);

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').insert([{
        id,
        type: tx.type,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        recorded_by: tx.recordedBy,
        receipt_url: tx.receiptUrl || null,
        notes: tx.notes || null
      }]);

      if (error) {
        console.error('❌ Gagal simpan ke Supabase. Data tetap tersimpan di HP ini (Lokal). Error:', error.message);
        setCloudSyncStatus('offline');
        // We don't throw here so the UI keeps the local version, but we mark as offline
      } else {
        console.log('✅ Transaksi berhasil disimpan langsung ke Database Cloud.');
        setCloudSyncStatus('synced');
      }
    }

    return newTx;
  }

  public static async deleteTransaction(id: string): Promise<void> {
    const current = this.getTransactions();
    this.saveTransactions(current.filter(t => t.id !== id));

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').delete().eq('id', id);
      if (error) {
        console.error('❌ Gagal menghapus di Cloud:', error.message);
        setCloudSyncStatus('offline');
      } else {
        setCloudSyncStatus('synced');
      }
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
    const local = this.getMembers();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client
        .from('kas_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('⚠️ Gagal mengambil data siswa dari Cloud:', error.message);
        setCloudSyncStatus('offline');
        return local;
      }

      const mappedFromCloud: KasMember[] = (data || []).map(m => {
        let weeklyStatus: Record<string, boolean> = {};
        if (m.weekly_status) {
          if (typeof m.weekly_status === 'string') {
            try { weeklyStatus = JSON.parse(m.weekly_status); } catch {}
          } else if (typeof m.weekly_status === 'object') {
            weeklyStatus = m.weekly_status;
          }
        }
        return {
          id: m.id,
          name: m.name || '',
          studentId: m.student_id || '',
          phone: m.phone || undefined,
          weeklyStatus
        };
      });

      // Cloud-First Merge
      this.saveMembers(mappedFromCloud);
      setCloudSyncStatus('synced');
      return mappedFromCloud;
    } catch (err: any) {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async toggleMemberWeek(memberId: string, weekKey: string): Promise<void> {
    const members = this.getMembers();
    let targetMember: KasMember | null = null;
    const updated = members.map(m => {
      if (m.id === memberId) {
        targetMember = {
          ...m,
          weeklyStatus: {
            ...(m.weeklyStatus || {}),
            [weekKey]: !m.weeklyStatus?.[weekKey]
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
        setCloudSyncStatus('syncing');
        const { error } = await client.from('kas_members').update({
          weekly_status: (targetMember as KasMember).weeklyStatus
        }).eq('id', memberId);
        
        if (error) setCloudSyncStatus('offline');
        else setCloudSyncStatus('synced');
      }
    }
  }

  public static async setMemberWeekStatus(memberId: string, weekKey: string, isPaid: boolean): Promise<void> {
    const members = this.getMembers();
    let targetMember: KasMember | null = null;
    const updated = members.map(m => {
      if (m.id === memberId) {
        targetMember = {
          ...m,
          weeklyStatus: {
            ...(m.weeklyStatus || {}),
            [weekKey]: isPaid
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
        setCloudSyncStatus('syncing');
        const { error } = await client.from('kas_members').update({
          weekly_status: (targetMember as KasMember).weeklyStatus
        }).eq('id', memberId);
        
        if (error) setCloudSyncStatus('offline');
        else setCloudSyncStatus('synced');
      }
    }
  }

  public static async toggleAllMembersWeek(weekKey: string, shouldPay: boolean): Promise<KasMember[]> {
    const members = this.getMembers();
    const updated = members.map(m => ({
      ...m,
      weeklyStatus: {
        ...(m.weeklyStatus || {}),
        [weekKey]: shouldPay
      }
    }));
    this.saveMembers(updated);

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const payload = updated.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        phone: m.phone || null,
        weekly_status: m.weeklyStatus
      }));
      const { error } = await client.from('kas_members').upsert(payload);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return updated;
  }

  public static async addMember(name: string, studentId: string, phone?: string): Promise<KasMember> {
    const id = generateUUID();
    const newMember: KasMember = {
      id,
      name: name.trim(),
      studentId: studentId.trim(),
      phone: phone?.trim() || undefined,
      weeklyStatus: {}
    };
    
    const members = this.getMembers();
    this.saveMembers([...members, newMember]);

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').insert([{
        id,
        name: newMember.name,
        student_id: newMember.studentId,
        phone: newMember.phone || null,
        weekly_status: {}
      }]);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    return newMember;
  }

  // ---------------- SETTINGS METHODS ----------------
  public static getSettings(): ClassSettings {
    const data = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  public static async fetchSettingsFromSupabase(): Promise<ClassSettings> {
    const client = getSupabaseClient();
    const local = this.getSettings();
    if (!client) return local;

    try {
      setCloudSyncStatus('syncing');
      const { data, error } = await client
        .from('class_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Gagal fetch settings:', error.message);
        setCloudSyncStatus('offline');
        return local;
      }

      if (data) {
        const mapped: ClassSettings = {
          ...local,
          className: data.class_name || local.className,
          weeklyDuesAmount: Number(data.weekly_dues_amount ?? local.weeklyDuesAmount),
          kasTargetAmount: Number(data.kas_target_amount ?? local.kasTargetAmount),
          currencyPrefix: data.currency_prefix || local.currencyPrefix,
          academicYear: data.academic_year || local.academicYear,
          siteUrl: data.site_url || local.siteUrl
        };
        localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(mapped));
        setCloudSyncStatus('synced');
        return mapped;
      }
      setCloudSyncStatus('synced');
      return local;
    } catch (err: any) {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async saveSettings(settings: ClassSettings): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    
    initSupabase();

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear,
        site_url: settings.siteUrl
      }]);

      if (error) {
        console.error('❌ Gagal simpan pengaturan ke Cloud:', error.message);
        setCloudSyncStatus('offline');
      } else {
        setCloudSyncStatus('synced');
      }
    }
  }

  // ---------------- FORCE SYNC ----------------
  public static async forceSyncAllToCloud(): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase URL atau Anon Key belum dikonfigurasi.' };
    }

    setCloudSyncStatus('syncing');
    try {
      const txs = this.getTransactions();
      const members = this.getMembers();
      const settings = this.getSettings();

      // Ensure UUIDs for everyone
      const fixId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : generateUUID();

      // Perform updates one by one to catch specific table errors
      // 1. Settings
      const { error: settingsErr } = await client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear,
        site_url: settings.siteUrl
      }]);

      if (settingsErr) {
        throw new Error(`Gagal sync Pengaturan: ${settingsErr.message}`);
      }

      // 2. Members
      if (members.length > 0) {
        const { error: membersErr } = await client.from('kas_members').upsert(members.map(m => ({
          id: fixId(m.id),
          name: m.name,
          student_id: m.studentId,
          phone: m.phone || null,
          weekly_status: m.weeklyStatus || {}
        })));
        if (membersErr) {
          throw new Error(`Gagal sync Anggota: ${membersErr.message}`);
        }
      }

      // 3. Transactions
      if (txs.length > 0) {
        const { error: txsErr } = await client.from('kas_transactions').upsert(txs.map(t => ({
          id: fixId(t.id),
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recorded_by: t.recordedBy,
          receipt_url: t.receiptUrl || null,
          notes: t.notes || null
        })));
        if (txsErr) {
          throw new Error(`Gagal sync Transaksi: ${txsErr.message}`);
        }
      }

      setCloudSyncStatus('synced');
      return {
        success: true,
        message: `✅ Berhasil memaksa sinkronisasi total ${txs.length} transaksi & ${members.length} anggota ke Cloud!`
      };
    } catch (err: any) {
      console.error('Sync Error:', err);
      setCloudSyncStatus('offline');
      let msg = err?.message || 'Error tidak diketahui';
      
      // Better error message for schema issues
      if (msg.includes('column') && msg.includes('not find')) {
        msg += '\n\nTips: Silakan salin & jalankan ulang script SQL terbaru di dashboard Supabase (menu SQL Editor) untuk memperbarui struktur tabel.';
      }
      
      return {
        success: false,
        message: `❌ ${msg}`
      };
    }
  }

  // ---------------- AUDIT LOG METHODS ----------------
  public static getAuditLogs(): AuditLogEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY_AUDIT);
    return data ? JSON.parse(data) : [];
  }

  public static async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
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
      await client.from('audit_logs').insert([{
        action: entry.action,
        details: entry.details,
        performed_by: entry.performedBy,
        user_role: entry.userRole,
        created_at: newLog.timestamp
      }]);
    }

    return newLog;
  }
}
