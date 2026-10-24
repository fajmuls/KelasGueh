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
    const redirectUrl = window.location.origin + window.location.pathname;
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

// Local storage reactive sync repository (Hybrid Supabase-Local, Cloud-First Priority)
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
    const local = this.getTransactions();
    if (!client) return local;

    try {
      const { data, error } = await client
        .from('kas_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Fetch transactions from Supabase warning:', error.message);
        return local;
      }

      if (data && data.length > 0) {
        const mappedFromCloud: KasTransaction[] = data.map(t => ({
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

        // Smart merge: Combine cloud transactions with any local transactions not yet pushed to cloud
        const cloudMap = new Map(mappedFromCloud.map(t => [t.id, t]));
        const missingLocalToPush: KasTransaction[] = [];

        for (const lTx of local) {
          if (!cloudMap.has(lTx.id)) {
            cloudMap.set(lTx.id, lTx);
            missingLocalToPush.push(lTx);
          }
        }

        const merged = Array.from(cloudMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        this.saveTransactions(merged);

        // Auto-push any local transactions that were missing from Supabase (e.g. created while offline or RLS failed)
        if (missingLocalToPush.length > 0) {
          console.log(`Auto-pushing ${missingLocalToPush.length} pending local transactions to Supabase...`);
          setCloudSyncStatus('syncing');
          const payload = missingLocalToPush.map(t => ({
            id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) ? t.id : generateUUID(),
            type: t.type,
            title: t.title,
            amount: t.amount,
            category: t.category,
            date: t.date,
            recorded_by: t.recordedBy,
            receipt_url: t.receiptUrl || null,
            notes: t.notes || null
          }));

          client.from('kas_transactions').upsert(payload).then(({ error: upErr }) => {
            if (upErr) console.warn('Resync missing local transactions error:', upErr.message);
            else console.log(`✓ Resynced ${missingLocalToPush.length} local transactions to Supabase Cloud.`);
            setTimeout(() => setCloudSyncStatus('synced'), 600);
          });
        }

        return merged;
      } else if (local.length > 0) {
        // Auto-sync local transactions to empty Supabase table
        const payload = local.map(t => ({
          id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) ? t.id : generateUUID(),
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recorded_by: t.recordedBy,
          receipt_url: t.receiptUrl || null,
          notes: t.notes || null
        }));
        const normalizedLocal = local.map((t, idx) => ({ ...t, id: payload[idx].id }));
        this.saveTransactions(normalizedLocal);

        client.from('kas_transactions').upsert(payload).then(({ error: upErr }) => {
          if (upErr) console.warn('Auto-sync transactions error:', upErr.message);
          else console.log('✓ Uploaded all local transactions to empty Supabase table.');
        });
        return normalizedLocal;
      }

      return [];
    } catch (err: any) {
      console.warn('Supabase fetchTransactions error:', err);
      return local;
    }
  }

  public static addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): KasTransaction {
    const current = this.getTransactions();
    const id = generateUUID();
    const newTx: KasTransaction = {
      ...tx,
      id,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newTx, ...current];
    this.saveTransactions(updated);

    // Async push to Supabase with Postgres-compliant UUID
    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      client.from('kas_transactions').insert([{
        id,
        type: tx.type,
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        date: tx.date,
        recorded_by: tx.recordedBy,
        receipt_url: tx.receiptUrl || null,
        notes: tx.notes || null
      }]).then(({ error }) => {
        if (error) {
          console.error('❌ Gagal simpan transaksi ke Supabase:', error.message, error);
        } else {
          console.log('✓ Transaksi berhasil dikirim & disimpan di database Supabase Cloud.');
        }
        setTimeout(() => setCloudSyncStatus('synced'), 600);
      });
    }

    return newTx;
  }

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

      // 1. Sync Settings
      await client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear
      }]);

      // 2. Sync Members
      if (members.length > 0) {
        const memberPayload = members.map(m => ({
          id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id) ? m.id : generateUUID(),
          name: m.name,
          student_id: m.studentId,
          phone: m.phone || null,
          weekly_status: m.weeklyStatus || {}
        }));
        await client.from('kas_members').upsert(memberPayload);
      }

      // 3. Sync Transactions
      if (txs.length > 0) {
        const txPayload = txs.map(t => ({
          id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.id) ? t.id : generateUUID(),
          type: t.type,
          title: t.title,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recorded_by: t.recordedBy,
          receipt_url: t.receiptUrl || null,
          notes: t.notes || null
        }));
        await client.from('kas_transactions').upsert(txPayload);
      }

      setTimeout(() => setCloudSyncStatus('synced'), 600);
      return {
        success: true,
        message: `✓ Berhasil sinkronisasi total ${txs.length} transaksi, ${members.length} siswa, & pengaturan ke Supabase Cloud!`
      };
    } catch (err: any) {
      setCloudSyncStatus('offline');
      return {
        success: false,
        message: `Gagal sinkronisasi ke Supabase: ${err?.message || 'Unknown error'}`
      };
    }
  }

  public static deleteTransaction(id: string): void {
    const current = this.getTransactions();
    const updated = current.filter(t => t.id !== id);
    this.saveTransactions(updated);

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      client.from('kas_transactions').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase delete transaction error:', error.message);
        setTimeout(() => setCloudSyncStatus('synced'), 600);
      });
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
      const { data, error } = await client
        .from('kas_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Fetch members from Supabase warning:', error.message);
        return local;
      }

      if (data && data.length > 0) {
        const mapped: KasMember[] = data.map(m => {
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

        this.saveMembers(mapped);
        return mapped;
      } else if (local.length > 0) {
        // Auto-sync local members up to empty Supabase table
        console.log('Syncing local members up to empty Supabase table...');
        setCloudSyncStatus('syncing');
        const payload = local.map(m => ({
          id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id) ? m.id : generateUUID(),
          name: m.name,
          student_id: m.studentId,
          phone: m.phone || null,
          weekly_status: m.weeklyStatus || {}
        }));
        const normalizedLocal = local.map((m, idx) => ({ ...m, id: payload[idx].id }));
        this.saveMembers(normalizedLocal);

        client.from('kas_members').upsert(payload).then(({ error: upErr }) => {
          if (upErr) console.warn('Auto-sync members to Supabase error:', upErr.message);
          setTimeout(() => setCloudSyncStatus('synced'), 600);
        });
        return normalizedLocal;
      }

      return [];
    } catch (err: any) {
      console.warn('Supabase fetchMembers error:', err);
      return local;
    }
  }

  public static toggleMemberWeek(memberId: string, weekKey: string): void {
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
        client.from('kas_members').update({
          weekly_status: (targetMember as KasMember).weeklyStatus
        }).eq('id', memberId).then(({ error }) => {
          if (error) console.warn('Supabase toggleMemberWeek error:', error.message);
          setTimeout(() => setCloudSyncStatus('synced'), 500);
        });
      }
    }
  }

  public static toggleAllMembersWeek(weekKey: string, shouldPay: boolean): KasMember[] {
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
      // Batch upsert into Supabase in 1 atomic network call (prevents 39+ concurrent promise crashes)
      client.from('kas_members').upsert(payload).then(({ error }) => {
        if (error) console.warn('Bulk toggle Supabase upsert error:', error.message);
        setTimeout(() => setCloudSyncStatus('synced'), 600);
      });
    }
    return updated;
  }

  public static addMember(name: string, studentId: string, phone?: string): KasMember {
    const members = this.getMembers();
    const id = generateUUID();
    const newMember: KasMember = {
      id,
      name: name.trim(),
      studentId: studentId.trim(),
      phone: phone?.trim() || undefined,
      weeklyStatus: {}
    };
    members.push(newMember);
    this.saveMembers(members);

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      client.from('kas_members').insert([{
        id,
        name: newMember.name,
        student_id: newMember.studentId,
        phone: newMember.phone || null,
        weekly_status: {}
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addMember error:', error.message);
        setTimeout(() => setCloudSyncStatus('synced'), 600);
      });
    }
    return newMember;
  }

  public static updateMember(memberId: string, updates: Partial<KasMember>): void {
    const members = this.getMembers();
    let updatedMember: KasMember | null = null;
    const updated = members.map(m => {
      if (m.id === memberId) {
        updatedMember = { ...m, ...updates };
        return updatedMember;
      }
      return m;
    });
    this.saveMembers(updated);

    if (updatedMember) {
      const client = getSupabaseClient();
      if (client) {
        setCloudSyncStatus('syncing');
        client.from('kas_members').update({
          name: (updatedMember as KasMember).name,
          student_id: (updatedMember as KasMember).studentId,
          phone: (updatedMember as KasMember).phone || null,
          weekly_status: (updatedMember as KasMember).weeklyStatus || {}
        }).eq('id', memberId).then(({ error }) => {
          if (error) console.warn('Supabase updateMember error:', error.message);
          setTimeout(() => setCloudSyncStatus('synced'), 600);
        });
      }
    }
  }

  public static addMembers(newMembersList: { name: string; studentId: string; phone?: string }[]): KasMember[] {
    const members = this.getMembers();
    const created: KasMember[] = newMembersList.map((m) => ({
      id: generateUUID(),
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
        id: m.id,
        name: m.name,
        student_id: m.studentId,
        phone: m.phone || null,
        weekly_status: {}
      }))).then(({ error }) => {
        if (error) console.warn('Supabase addMembers error:', error.message);
      });
    }
    return created;
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
      const { data, error } = await client
        .from('class_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.warn('Fetch settings from Supabase warning:', error.message);
        return local;
      }

      if (data) {
        const mapped: ClassSettings = {
          ...local,
          className: data.class_name || local.className,
          weeklyDuesAmount: Number(data.weekly_dues_amount ?? local.weeklyDuesAmount),
          kasTargetAmount: Number(data.kas_target_amount ?? local.kasTargetAmount),
          currencyPrefix: data.currency_prefix || local.currencyPrefix,
          academicYear: data.academic_year || local.academicYear
        };
        localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(mapped));
        return mapped;
      } else {
        // Auto-upsert default local settings to empty Supabase table
        client.from('class_settings').upsert([{
          id: 1,
          class_name: local.className,
          weekly_dues_amount: local.weeklyDuesAmount,
          kas_target_amount: local.kasTargetAmount,
          currency_prefix: local.currencyPrefix,
          academic_year: local.academicYear
        }]).then(({ error: upErr }) => {
          if (upErr) console.warn('Auto-sync settings to Supabase error:', upErr.message);
        });
      }

      return local;
    } catch (err: any) {
      console.warn('Supabase fetchSettings error:', err);
      return local;
    }
  }

  public static saveSettings(settings: ClassSettings): void {
    localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);
    
    initSupabase();

    const client = getSupabaseClient();
    if (client) {
      setCloudSyncStatus('syncing');
      client.from('class_settings').upsert([{
        id: 1,
        class_name: settings.className,
        weekly_dues_amount: settings.weeklyDuesAmount,
        kas_target_amount: settings.kasTargetAmount,
        currency_prefix: settings.currencyPrefix,
        academic_year: settings.academicYear
      }]).then(({ error }) => {
        if (error) {
          console.error('Gagal simpan class_settings ke Supabase (Cek Policy SQL RLS):', error.message, error);
        } else {
          console.log('✓ Class settings berhasil tersimpan di Supabase.');
        }
        setTimeout(() => setCloudSyncStatus('synced'), 600);
      });
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
