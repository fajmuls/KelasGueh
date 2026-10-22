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

// Supabase Realtime Listener for kas_transactions and kas_members
export const subscribeToRealtimeKas = (
  onTransactionChange: (payload: any) => void,
  onMemberChange: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime_kas_gue')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kas_transactions' },
      (payload) => {
        onTransactionChange(payload);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kas_members' },
      (payload) => {
        onMemberChange(payload);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// Supabase Google Auth helper with detailed diagnosis
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

// Local storage reactive sync repository
export class LocalKasRepository {
  private static STORAGE_KEY_TX = 'kelasgue_transactions_v3';
  private static STORAGE_KEY_MEMBERS = 'kelasgue_members_v3';
  private static STORAGE_KEY_SETTINGS = 'kelasgue_settings_v3';

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
    return created;
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
