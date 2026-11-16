import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  KasTransaction,
  KasMember,
  ClassSettings,
  KolektifBill,
  StudentPointLog,
  AttendanceRecord,
  MeetingMinute,
  ClassInventoryItem,
  CourseSchedule,
  CourseAssignment,
  UserRole,
  ClassBackupData,
  ClassDefinition,
  ClassMembershipRequest,
  ClassSnapshotMeta,
  ClassSnapshotManifest,
  SyncTelemetry
} from '../types/kas.ts';
import { getRegisteredUsers, registerOrUpdateUser, updateUserRole, deleteRegisteredUser, autoDetectGenderByName } from '../utils/userManagement.ts';
import { toTitleCase } from '../utils/textFormatting.ts';
import { syncRemotePinHash } from '../utils/security.ts';

/**
 * CORE DATABASE SERVICE - KELAS GUE v4.9.0
 * Snapshot-First Cloud Sync + Multi-Class Isolation (No SQL Schema Changes)
 */

export const SUPER_ADMIN_EMAIL = 'mrachmanfm@gmail.com';
export const DEFAULT_CLASS_ID = '01_SAKP_014';

export const DEFAULT_CLASS_DEF: ClassDefinition = {
  id: DEFAULT_CLASS_ID,
  code: '01 SAKP 014',
  name: '01 SAKP 014',
  academicYear: 'Semester Ganjil 2026/2027',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'System',
  isDefault: true
};

// Initial default settings
export const DEFAULT_SETTINGS: ClassSettings = {
  className: '01 SAKP 014',
  classCode: '01 SAKP 014',
  weeklyDuesAmount: 5000,
  kasTargetAmount: 2500000,
  currencyPrefix: 'Rp',
  academicYear: 'Semester Ganjil 2026/2027',
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || 'https://husymjsimolzvidunkur.supabase.co',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c3ltanNpbW9senZpZHVua3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTMyMDgsImV4cCI6MjEwODQyOTIwOH0.aDla7rhA2J1QNC_EXivKX2rzpuEVKuuMdTQ09XUNlkc',
  siteUrl: 'https://kelasgueh.vercel.app/',
  requireTransactionPin: true,
  transactionPinThreshold: 500000
};

// Initial empty states
export const INITIAL_MEMBERS: KasMember[] = [];
export const INITIAL_TRANSACTIONS: KasTransaction[] = [];

// Supabase client instance holder
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = (): { url: string; anonKey: string } => {
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

// Realtime Cloud Sync Status & Telemetry
export type CloudSyncStatus = 'synced' | 'syncing' | 'offline';
type SyncListener = (status: CloudSyncStatus) => void;
type TelemetryListener = (telemetry: SyncTelemetry) => void;

const syncListeners: SyncListener[] = [];
const telemetryListeners: TelemetryListener[] = [];

let currentSyncStatus: CloudSyncStatus = 'offline';
let currentTelemetry: SyncTelemetry = {
  status: 'offline',
  classId: DEFAULT_CLASS_ID,
  lastSyncedAt: null,
  snapshotBytes: 0,
  lastSource: 'local',
  isPendingUpload: false
};

export const updateSyncTelemetry = (partial: Partial<SyncTelemetry>): void => {
  currentTelemetry = { ...currentTelemetry, ...partial };
  telemetryListeners.forEach(listener => {
    try {
      listener(currentTelemetry);
    } catch (e) {
      console.warn('Telemetry listener error:', e);
    }
  });
};

export const setCloudSyncStatus = (status: CloudSyncStatus): void => {
  currentSyncStatus = status;
  syncListeners.forEach(listener => {
    try { listener(status); } catch (e) { console.warn('Sync listener error:', e); }
  });
  updateSyncTelemetry({ status });
};

export const subscribeCloudSync = (listener: SyncListener): () => void => {
  syncListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    const idx = syncListeners.indexOf(listener);
    if (idx >= 0) syncListeners.splice(idx, 1);
  };
};

export const subscribeSyncTelemetry = (listener: TelemetryListener): () => void => {
  telemetryListeners.push(listener);
  listener(currentTelemetry);
  return () => {
    const idx = telemetryListeners.indexOf(listener);
    if (idx >= 0) telemetryListeners.splice(idx, 1);
  };
};

export const getSyncTelemetry = (): SyncTelemetry => currentTelemetry;

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
  userRole: string;
}

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

// Helpers for Storage JSON Upload / Download (nota-kas bucket, zero SQL changes)
const uploadJsonToStorage = async (path: string, data: any): Promise<number> => {
  const jsonStr = JSON.stringify(data);
  const sizeBytes = new Blob([jsonStr]).size;
  const client = getSupabaseClient();
  if (!client) return sizeBytes;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const { error } = await client.storage.from('nota-kas').upload(path, blob, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '0'
  });
  if (error) throw error;
  return sizeBytes;
};

const downloadJsonFromStorage = async <T = any>(path: string): Promise<T | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data: pubData } = client.storage.from('nota-kas').getPublicUrl(path);
    if (pubData?.publicUrl) {
      const bustUrl = `${pubData.publicUrl}${pubData.publicUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
      const res = await fetch(bustUrl, { cache: 'no-store' });
      if (res.ok) {
        return (await res.json()) as T;
      }
    }
  } catch {
    // Fall back to direct SDK download below
  }

  try {
    const { data, error } = await client.storage.from('nota-kas').download(path);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

/**
 * REPOSITORY UTAMA - KELAS GUE
 * Mengelola sinkronisasi berbasis Snapshot JSON hemat kuota & multi-kelas terisolasi
 */
export class LocalKasRepository {
  private static KEY_TX = 'kelasgue_transactions_v3';
  private static KEY_MEMBERS = 'kelasgue_members_v3';
  private static KEY_SETTINGS = 'kelasgue_settings_v3';
  private static KEY_AUDIT = 'kelasgue_audit_logs_v1';
  private static KEY_KOLEKTIF = 'kelasgue_kolektif_bills_v1';
  private static KEY_POINTS = 'kelasgue_secretary_points_v2';
  private static KEY_ATTENDANCE = 'kelasgue_secretary_attendance_v1';
  private static KEY_MINUTES = 'kelasgue_secretary_minutes_v1';
  private static KEY_INVENTORY = 'kelasgue_secretary_inventory_v2';
  private static KEY_COURSES = 'kelasgue_secretary_courses_v2';
  private static KEY_GROUPS = 'kelasgue_saved_group_collections';

  private static KEY_ACTIVE_CLASS = 'kelasgue_active_class_id_v1';
  private static KEY_CLASS_REGISTRY = 'kelasgue_class_registry_v1';
  private static KEY_SNAPSHOT_UPDATED_AT = 'kelasgue_snapshot_updated_at_v1';
  private static KEY_SNAPSHOT_BYTES = 'kelasgue_snapshot_bytes_v1';

  private static publishTimer: any = null;
  private static isPublishing = false;

  // ---------------- CLASS CONTEXT & SCOPING ----------------
  public static getActiveClassId(): string {
    const saved = localStorage.getItem(this.KEY_ACTIVE_CLASS);
    return saved && saved.trim() ? saved.trim() : DEFAULT_CLASS_ID;
  }

  public static setActiveClassId(classId: string): void {
    const cleanId = (classId || DEFAULT_CLASS_ID).trim();
    localStorage.setItem(this.KEY_ACTIVE_CLASS, cleanId);
    const cachedBytes = Number(localStorage.getItem(this.scopedKey(this.KEY_SNAPSHOT_BYTES, cleanId)) || '0');
    const cachedAt = localStorage.getItem(this.scopedKey(this.KEY_SNAPSHOT_UPDATED_AT, cleanId));
    updateSyncTelemetry({
      classId: cleanId,
      snapshotBytes: cachedBytes,
      lastSyncedAt: cachedAt
    });
  }

  public static isDefaultClass(classId?: string): boolean {
    return (classId || this.getActiveClassId()) === DEFAULT_CLASS_ID;
  }

  private static scopedKey(baseKey: string, classId?: string): string {
    const cid = classId || this.getActiveClassId();
    if (cid === DEFAULT_CLASS_ID) return baseKey;
    return `${baseKey}__cls_${cid}`;
  }

  // ---------------- CLASS REGISTRY & JOIN REQUESTS ----------------
  private static getLocalRegistry(): { classes: ClassDefinition[]; memberships: ClassMembershipRequest[]; updatedAt: string } {
    try {
      const raw = localStorage.getItem(this.KEY_CLASS_REGISTRY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const classes: ClassDefinition[] = Array.isArray(parsed.classes) ? parsed.classes : [DEFAULT_CLASS_DEF];
        if (!classes.some(c => c.id === DEFAULT_CLASS_ID)) {
          classes.unshift(DEFAULT_CLASS_DEF);
        }
        return {
          classes,
          memberships: Array.isArray(parsed.memberships) ? parsed.memberships : [],
          updatedAt: parsed.updatedAt || new Date().toISOString()
        };
      }
    } catch {
      // ignore
    }
    return {
      classes: [DEFAULT_CLASS_DEF],
      memberships: [],
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
  }

  private static saveLocalRegistry(reg: { classes: ClassDefinition[]; memberships: ClassMembershipRequest[]; updatedAt: string }): void {
    if (!reg.classes.some(c => c.id === DEFAULT_CLASS_ID)) {
      reg.classes.unshift(DEFAULT_CLASS_DEF);
    }
    localStorage.setItem(this.KEY_CLASS_REGISTRY, JSON.stringify(reg));
  }

  public static getCachedClasses(): ClassDefinition[] {
    return this.getLocalRegistry().classes;
  }

  public static async fetchClassRegistry(): Promise<{
    classes: ClassDefinition[];
    memberships: ClassMembershipRequest[];
    updatedAt: string;
  }> {
    const local = this.getLocalRegistry();
    const client = getSupabaseClient();
    if (!client) return local;

    try {
      const remote = await downloadJsonFromStorage<{
        classes: ClassDefinition[];
        memberships: ClassMembershipRequest[];
        updatedAt: string;
      }>('system/class_registry.json');

      const mergedClassesMap = new Map<string, ClassDefinition>();
      mergedClassesMap.set(DEFAULT_CLASS_ID, DEFAULT_CLASS_DEF);
      local.classes.forEach(c => mergedClassesMap.set(c.id, c));
      if (remote?.classes) {
        remote.classes.forEach(c => mergedClassesMap.set(c.id, c));
      }

      const membershipsMap = new Map<string, ClassMembershipRequest>();
      local.memberships.forEach(m => membershipsMap.set(`${m.email.toLowerCase()}__${m.classId}`, m));
      if (remote?.memberships) {
        remote.memberships.forEach(m => {
          const key = `${m.email.toLowerCase()}__${m.classId}`;
          const prev = membershipsMap.get(key);
          if (!prev || (m.reviewedAt || m.createdAt) >= (prev.reviewedAt || prev.createdAt)) {
            membershipsMap.set(key, m);
          }
        });
      }

      // Also inspect SQL role_claims table as backup source of join requests (no SQL changes)
      try {
        const { data: claims } = await client
          .from('role_claims')
          .select('*')
          .like('requested_role', 'CLASS_JOIN:%')
          .order('created_at', { ascending: false });

        (claims || []).forEach((claim: any) => {
          try {
            const payload = claim.message ? JSON.parse(claim.message) : {};
            const classId = payload.classId || String(claim.requested_role).replace('CLASS_JOIN:', '');
            const key = `${String(claim.email).toLowerCase()}__${classId}`;
            const candidate: ClassMembershipRequest = {
              id: claim.id,
              email: String(claim.email).toLowerCase(),
              fullName: payload.fullName || String(claim.email).split('@')[0],
              nim: payload.nim || '',
              classId,
              className: payload.className || classId,
              status: claim.status || 'pending',
              assignedRole: payload.assignedRole || 'anggota',
              linkedMemberId: payload.linkedMemberId,
              linkedMemberName: payload.linkedMemberName,
              createdAt: claim.created_at,
              reviewedAt: claim.reviewed_at || undefined
            };
            const existing = membershipsMap.get(key);
            if (!existing || (candidate.reviewedAt || candidate.createdAt) > (existing.reviewedAt || existing.createdAt)) {
              membershipsMap.set(key, candidate);
            }
          } catch {
            // ignore non-JSON claim
          }
        });
      } catch {
        // RLS or offline
      }

      const merged = {
        classes: Array.from(mergedClassesMap.values()),
        memberships: Array.from(membershipsMap.values()),
        updatedAt: remote?.updatedAt || new Date().toISOString()
      };
      this.saveLocalRegistry(merged);
      return merged;
    } catch {
      return local;
    }
  }

  private static async persistRegistry(reg: { classes: ClassDefinition[]; memberships: ClassMembershipRequest[]; updatedAt: string }): Promise<void> {
    this.saveLocalRegistry(reg);
    try {
      await uploadJsonToStorage('system/class_registry.json', reg);
    } catch (e) {
      console.warn('Could not upload class_registry.json to storage:', e);
    }
  }

  public static async createNewClass(input: {
    code: string;
    name: string;
    academicYear: string;
    createdBy: string;
  }): Promise<ClassDefinition> {
    const cleanCode = input.code.trim().toUpperCase();
    const id = cleanCode.replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || `CLS_${Date.now()}`;
    const reg = await this.fetchClassRegistry();

    const existing = reg.classes.find(c => c.id === id || c.code.toLowerCase() === cleanCode.toLowerCase());
    if (existing) {
      throw new Error(`Kelas "${existing.code}" sudah terdaftar!`);
    }

    const newClass: ClassDefinition = {
      id,
      code: cleanCode,
      name: input.name.trim() || cleanCode,
      academicYear: input.academicYear.trim() || DEFAULT_SETTINGS.academicYear,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy || 'Super Admin',
      isDefault: false
    };

    const updatedReg = {
      classes: [...reg.classes, newClass],
      memberships: reg.memberships,
      updatedAt: new Date().toISOString()
    };
    await this.persistRegistry(updatedReg);

    // Seed isolated initial settings & snapshot for this new class
    const initialSettings: ClassSettings = {
      ...DEFAULT_SETTINGS,
      className: newClass.name,
      classCode: newClass.code,
      academicYear: newClass.academicYear
    };
    localStorage.setItem(this.scopedKey(this.KEY_SETTINGS, newClass.id), JSON.stringify(initialSettings));
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, newClass.id), JSON.stringify([]));
    localStorage.setItem(this.scopedKey(this.KEY_TX, newClass.id), JSON.stringify([]));
    await this.publishClassSnapshot(newClass.id, input.createdBy);

    return newClass;
  }

  public static async submitClassJoinRequest(input: {
    email: string;
    fullName: string;
    nim?: string;
    classId: string;
    className: string;
  }): Promise<ClassMembershipRequest> {
    const emailLower = input.email.toLowerCase().trim();
    const reg = await this.fetchClassRegistry();
    const req: ClassMembershipRequest = {
      id: generateUUID(),
      email: emailLower,
      fullName: toTitleCase(input.fullName.trim() || emailLower.split('@')[0]),
      nim: input.nim?.trim() || undefined,
      classId: input.classId,
      className: input.className,
      status: 'pending',
      assignedRole: 'anggota',
      createdAt: new Date().toISOString()
    };

    const filtered = reg.memberships.filter(
      m => !(m.email.toLowerCase() === emailLower && m.classId === input.classId)
    );
    const updatedReg = {
      classes: reg.classes,
      memberships: [req, ...filtered],
      updatedAt: new Date().toISOString()
    };
    await this.persistRegistry(updatedReg);

    // Mirror to role_claims if authenticated
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('role_claims').insert([{
          id: req.id,
          email: emailLower,
          requested_role: `CLASS_JOIN:${input.classId}`,
          status: 'pending',
          message: JSON.stringify({
            classId: input.classId,
            className: input.className,
            fullName: req.fullName,
            nim: req.nim || '',
            assignedRole: 'anggota'
          })
        }]);
      } catch {
        // Storage registry already saved cleanly
      }
    }

    return req;
  }

  public static async approveClassJoinRequest(
    requestIdOrEmail: string,
    role: UserRole,
    reviewedBy: string,
    linkedMemberId?: string,
    linkedMemberName?: string
  ): Promise<void> {
    const reg = await this.fetchClassRegistry();
    const now = new Date().toISOString();
    let targetReq: ClassMembershipRequest | undefined;

    const updatedMemberships = reg.memberships.map(m => {
      if (m.id === requestIdOrEmail || m.email.toLowerCase() === requestIdOrEmail.toLowerCase()) {
        targetReq = {
          ...m,
          status: 'approved',
          assignedRole: role,
          linkedMemberId: linkedMemberId || m.linkedMemberId,
          linkedMemberName: linkedMemberName || m.linkedMemberName,
          reviewedAt: now,
          reviewedBy
        };
        return targetReq;
      }
      return m;
    });

    await this.persistRegistry({
      classes: reg.classes,
      memberships: updatedMemberships,
      updatedAt: now
    });

    if (targetReq) {
      const normalizedRole: 'bendahara' | 'sekretaris' | 'anggota' =
        role === 'bendahara' || role === 'sekretaris' ? role : 'anggota';
      await this.updateWhitelist(targetReq.email, normalizedRole, targetReq.fullName);

      const client = getSupabaseClient();
      if (client) {
        try {
          await client
            .from('role_claims')
            .update({
              status: 'approved',
              reviewed_at: now,
              message: JSON.stringify({
                classId: targetReq.classId,
                className: targetReq.className,
                fullName: targetReq.fullName,
                nim: targetReq.nim || '',
                assignedRole: normalizedRole,
                linkedMemberId,
                linkedMemberName
              })
            })
            .eq('email', targetReq.email);
        } catch {
          // ignore
        }
      }
    }
  }

  public static async rejectClassJoinRequest(requestIdOrEmail: string, reviewedBy: string): Promise<void> {
    const reg = await this.fetchClassRegistry();
    const now = new Date().toISOString();
    let targetEmail = '';

    const updatedMemberships = reg.memberships.map(m => {
      if (m.id === requestIdOrEmail || m.email.toLowerCase() === requestIdOrEmail.toLowerCase()) {
        targetEmail = m.email;
        return {
          ...m,
          status: 'rejected' as const,
          reviewedAt: now,
          reviewedBy
        };
      }
      return m;
    });

    await this.persistRegistry({
      classes: reg.classes,
      memberships: updatedMemberships,
      updatedAt: now
    });

    const client = getSupabaseClient();
    if (client && targetEmail) {
      try {
        await client.from('role_claims').update({ status: 'rejected', reviewed_at: now }).eq('email', targetEmail);
      } catch {
        // ignore
      }
    }
  }

  public static async checkUserClassAccess(email: string): Promise<{
    status: 'approved' | 'pending' | 'unassigned';
    approvedClasses: ClassDefinition[];
    defaultApprovedClassId?: string;
    pendingRequest?: ClassMembershipRequest;
    assignedRole?: UserRole;
  }> {
    const emailLower = (email || '').toLowerCase().trim();
    const reg = await this.fetchClassRegistry();

    // Super Admin always has immediate access to all classes
    if (emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        status: 'approved',
        approvedClasses: reg.classes,
        defaultApprovedClassId: this.getActiveClassId() || DEFAULT_CLASS_ID,
        assignedRole: 'superadmin'
      };
    }

    // Check approved membership requests for this user
    const userRequests = reg.memberships.filter(m => m.email.toLowerCase() === emailLower);
    const approvedReqs = userRequests.filter(m => m.status === 'approved');

    if (approvedReqs.length > 0) {
      const approvedIds = new Set(approvedReqs.map(r => r.classId));
      const approvedClasses = reg.classes.filter(c => approvedIds.has(c.id));
      const primaryReq = approvedReqs[0];
      return {
        status: 'approved',
        approvedClasses: approvedClasses.length > 0 ? approvedClasses : [DEFAULT_CLASS_DEF],
        defaultApprovedClassId: primaryReq.classId,
        assignedRole: primaryReq.assignedRole
      };
    }

    // Preserve pre-existing approved officers (bendahara/sekretaris in whitelist) for 01 SAKP 014
    try {
      const whitelist = await this.getWhitelist();
      const matchedWl = whitelist.find(w => w.email?.toLowerCase() === emailLower);
      if (matchedWl && (matchedWl.role === 'bendahara' || matchedWl.role === 'sekretaris')) {
        return {
          status: 'approved',
          approvedClasses: [DEFAULT_CLASS_DEF],
          defaultApprovedClassId: DEFAULT_CLASS_ID,
          assignedRole: matchedWl.role
        };
      }
    } catch {
      // ignore
    }

    const pendingRequest = userRequests.find(m => m.status === 'pending');
    if (pendingRequest) {
      return {
        status: 'pending',
        approvedClasses: [],
        pendingRequest
      };
    }

    return {
      status: 'unassigned',
      approvedClasses: []
    };
  }

  // ---------------- SNAPSHOT-FIRST SYNC ENGINE (QUOTA SAVER) ----------------
  public static buildClassSnapshot(classId?: string, updatedBy?: string): ClassSnapshotManifest {
    const cid = classId || this.getActiveClassId();
    const txs = this.getTransactions(cid).map(t => ({
      ...t,
      // Keep HTTPS URLs & compact thumbnails; strip bloated inline base64 > 180KB from cloud snapshot to save quota
      receiptUrl:
        t.receiptUrl && t.receiptUrl.startsWith('data:') && t.receiptUrl.length > 180000
          ? undefined
          : t.receiptUrl
    }));

    return {
      classId: cid,
      version: '4.9.0',
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Pengurus',
      settings: this.getSettings(cid),
      members: this.getMembers(cid),
      transactions: txs,
      kolektifBills: this.getKolektifBills(cid),
      pointLogs: this.getPointLogs(cid),
      attendanceRecords: this.getAttendanceRecords(cid),
      meetingMinutes: this.getMeetingMinutes(cid),
      inventoryItems: this.getInventoryItems(cid),
      courseSchedules: this.getCourseSchedules(cid),
      savedGroupCollections: this.getSavedGroups(cid),
      auditLogs: this.getAuditLogs(cid).slice(0, 200)
    };
  }

  public static applyClassSnapshot(snapshot: ClassSnapshotManifest, snapshotBytes?: number): void {
    const cid = snapshot.classId || this.getActiveClassId();
    if (snapshot.settings) {
      const mergedSettings = { ...DEFAULT_SETTINGS, ...snapshot.settings };
      localStorage.setItem(this.scopedKey(this.KEY_SETTINGS, cid), JSON.stringify(mergedSettings));
      if (mergedSettings.pinHash) {
        syncRemotePinHash(mergedSettings.pinHash);
      }
    }
    if (Array.isArray(snapshot.members)) {
      localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(snapshot.members));
    }
    if (Array.isArray(snapshot.transactions)) {
      localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(snapshot.transactions));
    }
    if (Array.isArray(snapshot.kolektifBills)) {
      localStorage.setItem(this.scopedKey(this.KEY_KOLEKTIF, cid), JSON.stringify(snapshot.kolektifBills));
    }
    if (Array.isArray(snapshot.pointLogs)) {
      localStorage.setItem(this.scopedKey(this.KEY_POINTS, cid), JSON.stringify(snapshot.pointLogs));
    }
    if (Array.isArray(snapshot.attendanceRecords)) {
      localStorage.setItem(this.scopedKey(this.KEY_ATTENDANCE, cid), JSON.stringify(snapshot.attendanceRecords));
    }
    if (Array.isArray(snapshot.meetingMinutes)) {
      localStorage.setItem(this.scopedKey(this.KEY_MINUTES, cid), JSON.stringify(snapshot.meetingMinutes));
    }
    if (Array.isArray(snapshot.inventoryItems)) {
      localStorage.setItem(this.scopedKey(this.KEY_INVENTORY, cid), JSON.stringify(snapshot.inventoryItems));
    }
    if (Array.isArray(snapshot.courseSchedules)) {
      localStorage.setItem(this.scopedKey(this.KEY_COURSES, cid), JSON.stringify(snapshot.courseSchedules));
    }
    if (Array.isArray(snapshot.savedGroupCollections)) {
      localStorage.setItem(this.scopedKey(this.KEY_GROUPS, cid), JSON.stringify(snapshot.savedGroupCollections));
    }
    if (Array.isArray(snapshot.auditLogs)) {
      localStorage.setItem(this.scopedKey(this.KEY_AUDIT, cid), JSON.stringify(snapshot.auditLogs));
    }

    const bytes = snapshotBytes || new Blob([JSON.stringify(snapshot)]).size;
    localStorage.setItem(this.scopedKey(this.KEY_SNAPSHOT_UPDATED_AT, cid), snapshot.updatedAt);
    localStorage.setItem(this.scopedKey(this.KEY_SNAPSHOT_BYTES, cid), String(bytes));

    updateSyncTelemetry({
      classId: cid,
      lastSyncedAt: snapshot.updatedAt,
      snapshotBytes: bytes,
      status: 'synced',
      isPendingUpload: false
    });
  }

  public static async publishClassSnapshot(classId?: string, updatedBy?: string): Promise<{ bytes: number; updatedAt: string } | null> {
    if (this.isPublishing) return null;
    const cid = classId || this.getActiveClassId();
    const client = getSupabaseClient();
    if (!client) return null;

    this.isPublishing = true;
    try {
      setCloudSyncStatus('syncing');
      const manifest = this.buildClassSnapshot(cid, updatedBy);
      const snapshotPath = `classes/${cid}/snapshot.json`;
      const metaPath = `classes/${cid}/meta.json`;

      const sizeBytes = await uploadJsonToStorage(snapshotPath, manifest);
      const meta: ClassSnapshotMeta = {
        classId: cid,
        version: manifest.version,
        updatedAt: manifest.updatedAt,
        updatedBy: manifest.updatedBy,
        sizeBytes,
        txCount: manifest.transactions.length,
        memberCount: manifest.members.length
      };
      await uploadJsonToStorage(metaPath, meta);

      localStorage.setItem(this.scopedKey(this.KEY_SNAPSHOT_UPDATED_AT, cid), manifest.updatedAt);
      localStorage.setItem(this.scopedKey(this.KEY_SNAPSHOT_BYTES, cid), String(sizeBytes));

      updateSyncTelemetry({
        classId: cid,
        status: 'synced',
        lastSyncedAt: manifest.updatedAt,
        snapshotBytes: sizeBytes,
        lastSource: 'upload',
        isPendingUpload: false,
        errorMessage: undefined
      });
      setCloudSyncStatus('synced');
      return { bytes: sizeBytes, updatedAt: manifest.updatedAt };
    } catch (err: any) {
      setCloudSyncStatus('offline');
      updateSyncTelemetry({
        isPendingUpload: false,
        errorMessage: err?.message || 'Gagal mengunggah snapshot'
      });
      return null;
    } finally {
      this.isPublishing = false;
    }
  }

  public static scheduleSnapshotPublish(classId?: string, updatedBy?: string): void {
    const cid = classId || this.getActiveClassId();
    updateSyncTelemetry({ isPendingUpload: true });
    if (this.publishTimer) clearTimeout(this.publishTimer);
    this.publishTimer = setTimeout(() => {
      this.publishClassSnapshot(cid, updatedBy);
    }, 1500);
  }

  /**
   * Smart Snapshot-First Sync:
   * 1. Checks tiny meta.json (~180 bytes). If unchanged vs local cache, skips heavy downloads (0 KB quota).
   * 2. If newer, downloads 1 single compact snapshot.json and applies everything on-the-spot.
   * 3. For default class 01 SAKP 014 when no snapshot exists yet, migrates cleanly from existing SQL tables once and uploads the snapshot.
   */
  public static async syncClassFast(
    classId?: string,
    options?: { forceDownload?: boolean }
  ): Promise<{
    updated: boolean;
    source: 'cache' | 'snapshot' | 'sql' | 'local';
    snapshotBytes: number;
  }> {
    const cid = classId || this.getActiveClassId();
    const client = getSupabaseClient();
    if (!client) {
      setCloudSyncStatus('offline');
      updateSyncTelemetry({ classId: cid, lastSource: 'local', status: 'offline' });
      return { updated: false, source: 'local', snapshotBytes: 0 };
    }

    setCloudSyncStatus('syncing');
    try {
      const meta = await downloadJsonFromStorage<ClassSnapshotMeta>(`classes/${cid}/meta.json`);
      const localUpdatedAt = localStorage.getItem(this.scopedKey(this.KEY_SNAPSHOT_UPDATED_AT, cid));
      const localHasData =
        this.getTransactions(cid).length > 0 ||
        this.getMembers(cid).length > 0 ||
        !!localStorage.getItem(this.scopedKey(this.KEY_SETTINGS, cid));

      if (!options?.forceDownload && meta && localUpdatedAt === meta.updatedAt && localHasData) {
        updateSyncTelemetry({
          classId: cid,
          status: 'synced',
          lastSyncedAt: meta.updatedAt,
          snapshotBytes: meta.sizeBytes || Number(localStorage.getItem(this.scopedKey(this.KEY_SNAPSHOT_BYTES, cid)) || '0'),
          lastSource: 'cache',
          errorMessage: undefined
        });
        setCloudSyncStatus('synced');
        return { updated: false, source: 'cache', snapshotBytes: meta.sizeBytes || 0 };
      }

      const snapshot = await downloadJsonFromStorage<ClassSnapshotManifest>(`classes/${cid}/snapshot.json`);
      if (snapshot && snapshot.classId) {
        const bytes = meta?.sizeBytes || new Blob([JSON.stringify(snapshot)]).size;
        this.applyClassSnapshot(snapshot, bytes);
        updateSyncTelemetry({
          classId: cid,
          status: 'synced',
          lastSyncedAt: snapshot.updatedAt,
          snapshotBytes: bytes,
          lastSource: 'snapshot',
          errorMessage: undefined
        });
        setCloudSyncStatus('synced');
        return { updated: true, source: 'snapshot', snapshotBytes: bytes };
      }

      // First-time fallback for default class 01 SAKP 014: load existing SQL tables once and create initial snapshot
      if (cid === DEFAULT_CLASS_ID) {
        await Promise.all([
          this.fetchSettingsFromSupabase(cid),
          this.fetchMembersFromSupabase(cid),
          this.fetchTransactionsFromSupabase(cid),
          this.fetchAuditLogsFromSupabase(cid)
        ]);
        const pubRes = await this.publishClassSnapshot(cid, 'Auto Snapshot Init');
        const bytes = pubRes?.bytes || new Blob([JSON.stringify(this.buildClassSnapshot(cid))]).size;
        updateSyncTelemetry({
          classId: cid,
          status: 'synced',
          lastSyncedAt: new Date().toISOString(),
          snapshotBytes: bytes,
          lastSource: 'sql',
          errorMessage: undefined
        });
        setCloudSyncStatus('synced');
        return { updated: true, source: 'sql', snapshotBytes: bytes };
      }

      // Empty newly-created class with no remote snapshot yet
      setCloudSyncStatus('synced');
      updateSyncTelemetry({
        classId: cid,
        status: 'synced',
        lastSource: 'local',
        snapshotBytes: 0
      });
      return { updated: false, source: 'local', snapshotBytes: 0 };
    } catch (err: any) {
      setCloudSyncStatus('offline');
      updateSyncTelemetry({
        classId: cid,
        status: 'offline',
        lastSource: 'local',
        errorMessage: err?.message || 'Sinkronisasi gagal'
      });
      return { updated: false, source: 'local', snapshotBytes: 0 };
    }
  }

  // ---------------- LOCAL PERSISTENCE ----------------
  public static saveTransactions(txs: KasTransaction[], classId?: string): void {
    const cid = classId || this.getActiveClassId();
    localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(txs));
  }

  public static async saveMembers(members: KasMember[], classId?: string): Promise<void> {
    const cid = classId || this.getActiveClassId();
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(members));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- SETTINGS ----------------
  public static getSettings(classId?: string): ClassSettings {
    const cid = classId || this.getActiveClassId();
    const data = localStorage.getItem(this.scopedKey(this.KEY_SETTINGS, cid));
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    if (!this.isDefaultClass(cid)) {
      const regClass = this.getCachedClasses().find(c => c.id === cid);
      return {
        ...DEFAULT_SETTINGS,
        className: regClass?.name || cid,
        classCode: regClass?.code || cid,
        academicYear: regClass?.academicYear || DEFAULT_SETTINGS.academicYear
      };
    }
    return DEFAULT_SETTINGS;
  }

  public static async fetchSettingsFromSupabase(classId?: string): Promise<ClassSettings> {
    const cid = classId || this.getActiveClassId();
    const local = this.getSettings(cid);
    const client = getSupabaseClient();
    if (!client || !this.isDefaultClass(cid)) return local;

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
        let requireTransactionPin = local.requireTransactionPin ?? true;
        let transactionPinThreshold = local.transactionPinThreshold ?? 500000;
        let pinHash = local.pinHash;
        let classCode = local.classCode || '01 SAKP 014';

        if (data.site_url && data.site_url.startsWith('{')) {
          try {
            const parsed = JSON.parse(data.site_url);
            if (parsed.monthlyDuesOverrides) monthlyDuesOverrides = { ...monthlyDuesOverrides, ...parsed.monthlyDuesOverrides };
            if (parsed.siteUrl !== undefined) siteUrl = parsed.siteUrl;
            if (parsed.requireTransactionPin !== undefined) requireTransactionPin = Boolean(parsed.requireTransactionPin);
            if (parsed.transactionPinThreshold !== undefined) transactionPinThreshold = Number(parsed.transactionPinThreshold) || 500000;
            if (parsed.pinHash) {
              pinHash = parsed.pinHash;
              syncRemotePinHash(parsed.pinHash);
            }
            if (parsed.classCode) classCode = parsed.classCode;
          } catch {
            // standard url
          }
        }

        if (data.monthly_dues_overrides) {
          monthlyDuesOverrides = typeof data.monthly_dues_overrides === 'string'
            ? JSON.parse(data.monthly_dues_overrides)
            : data.monthly_dues_overrides;
        }

        const resolvedName =
          data.class_name && data.class_name !== 'Kelas Gue'
            ? data.class_name
            : (classCode || '01 SAKP 014');

        const mapped: ClassSettings = {
          ...local,
          className: resolvedName,
          classCode,
          weeklyDuesAmount: Number(data.weekly_dues_amount ?? local.weeklyDuesAmount),
          kasTargetAmount: Number(data.kas_target_amount ?? local.kasTargetAmount),
          currencyPrefix: data.currency_prefix || local.currencyPrefix,
          academicYear: data.academic_year || local.academicYear,
          siteUrl,
          monthlyDuesOverrides,
          requireTransactionPin,
          transactionPinThreshold,
          pinHash
        };
        localStorage.setItem(this.scopedKey(this.KEY_SETTINGS, cid), JSON.stringify(mapped));
        setCloudSyncStatus('synced');
        return mapped;
      }
      setCloudSyncStatus('synced');
      return local;
    } catch {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async saveSettings(settings: ClassSettings, classId?: string): Promise<void> {
    const cid = classId || this.getActiveClassId();
    localStorage.setItem(this.scopedKey(this.KEY_SETTINGS, cid), JSON.stringify(settings));
    if (settings.pinHash) syncRemotePinHash(settings.pinHash);
    if (settings.supabaseUrl) localStorage.setItem('kelasgue_supabase_url', settings.supabaseUrl);
    if (settings.supabaseAnonKey) localStorage.setItem('kelasgue_supabase_key', settings.supabaseAnonKey);

    supabaseInstance = null;
    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');

      const siteUrlPayload = JSON.stringify({
        siteUrl: settings.siteUrl || '',
        monthlyDuesOverrides: settings.monthlyDuesOverrides || {},
        requireTransactionPin: settings.requireTransactionPin !== false,
        transactionPinThreshold: Number(settings.transactionPinThreshold ?? 500000),
        pinHash: settings.pinHash || undefined,
        classCode: settings.classCode || settings.className || '01 SAKP 014'
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

      let res = await client.from('class_settings').upsert([{
        ...basePayload,
        monthly_dues_overrides: settings.monthlyDuesOverrides || {}
      }]);

      if (res.error) {
        const fallbackRes = await client.from('class_settings').upsert([basePayload]);
        if (fallbackRes.error) {
          setCloudSyncStatus('offline');
          throw fallbackRes.error;
        }
      }
      setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- TRANSAKSI ----------------
  public static getTransactions(classId?: string): KasTransaction[] {
    const cid = classId || this.getActiveClassId();
    const data = localStorage.getItem(this.scopedKey(this.KEY_TX, cid));
    return data ? JSON.parse(data) : [];
  }

  public static async fetchTransactionsFromSupabase(classId?: string): Promise<KasTransaction[]> {
    const cid = classId || this.getActiveClassId();
    const local = this.getTransactions(cid);
    const client = getSupabaseClient();
    if (!client || !this.isDefaultClass(cid)) return local;

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

      localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(mapped));
      setCloudSyncStatus('synced');
      return mapped;
    } catch {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async addTransaction(tx: Omit<KasTransaction, 'id' | 'createdAt'>): Promise<KasTransaction> {
    const cid = this.getActiveClassId();
    const newTx: KasTransaction = {
      ...tx,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };

    const current = this.getTransactions(cid);
    localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify([newTx, ...current]));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid, tx.recordedBy);
    return newTx;
  }

  public static async deleteTransaction(id: string): Promise<void> {
    const cid = this.getActiveClassId();
    const current = this.getTransactions(cid);
    localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(current.filter(t => t.id !== id)));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').delete().eq('id', id);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async updateTransaction(id: string, updates: Partial<KasTransaction>): Promise<KasTransaction | null> {
    const cid = this.getActiveClassId();
    const current = this.getTransactions(cid);
    const idx = current.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const updatedTx = { ...current[idx], ...updates };
    current[idx] = updatedTx;
    localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(current));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
    return updatedTx;
  }

  public static async deleteMultipleTransactions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const cid = this.getActiveClassId();
    const current = this.getTransactions(cid);
    const idSet = new Set(ids);
    localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(current.filter(t => !idSet.has(t.id))));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_transactions').delete().in('id', ids);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- ANGGOTA ----------------
  public static getMembers(classId?: string): KasMember[] {
    const cid = classId || this.getActiveClassId();
    const data = localStorage.getItem(this.scopedKey(this.KEY_MEMBERS, cid));
    return data ? JSON.parse(data) : [];
  }

  public static async fetchMembersFromSupabase(classId?: string): Promise<KasMember[]> {
    const cid = classId || this.getActiveClassId();
    const local = this.getMembers(cid);
    const client = getSupabaseClient();
    if (!client || !this.isDefaultClass(cid)) return local;

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

      localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(mapped));
      setCloudSyncStatus('synced');
      return mapped;
    } catch {
      setCloudSyncStatus('offline');
      return local;
    }
  }

  public static async addMember(name: string, studentId: string, phone?: string, gender?: 'L' | 'P'): Promise<KasMember> {
    const cid = this.getActiveClassId();
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

    const current = this.getMembers(cid);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify([...current, newMember]));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
    return newMember;
  }

  public static async toggleMemberWeek(memberId: string, weekKey: string): Promise<void> {
    const cid = this.getActiveClassId();
    const members = this.getMembers(cid);
    const m = members.find(m => m.id === memberId);
    if (!m) return;

    const newStatus = { ...(m.weeklyStatus || {}), [weekKey]: !m.weeklyStatus?.[weekKey] };
    const updated = members.map(item => item.id === memberId ? { ...item, weeklyStatus: newStatus } : item);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').update({ weekly_status: newStatus }).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async setMemberWeekStatus(memberId: string, weekKey: string, isPaid: boolean): Promise<void> {
    const cid = this.getActiveClassId();
    const members = this.getMembers(cid);
    const m = members.find(m => m.id === memberId);
    if (!m) return;

    const newStatus = { ...(m.weeklyStatus || {}), [weekKey]: isPaid };
    const updated = members.map(item => item.id === memberId ? { ...item, weeklyStatus: newStatus } : item);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').update({ weekly_status: newStatus }).eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async toggleAllMembersWeek(weekKey: string, shouldPay: boolean): Promise<KasMember[]> {
    const cid = this.getActiveClassId();
    const members = this.getMembers(cid);
    const updated = members.map(m => {
      if (m.isActive === false) return m;
      return {
        ...m,
        weeklyStatus: { ...(m.weeklyStatus || {}), [weekKey]: shouldPay }
      };
    });
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
    return updated;
  }

  // ---------------- AUDIT LOGS ----------------
  public static getAuditLogs(classId?: string): AuditLogEntry[] {
    const cid = classId || this.getActiveClassId();
    const data = localStorage.getItem(this.scopedKey(this.KEY_AUDIT, cid));
    return data ? JSON.parse(data) : [];
  }

  public static async clearAuditLogs(): Promise<void> {
    const cid = this.getActiveClassId();
    localStorage.removeItem(this.scopedKey(this.KEY_AUDIT, cid));
    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      await client.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async deleteAuditLog(id: string): Promise<void> {
    const cid = this.getActiveClassId();
    const logs = this.getAuditLogs(cid).filter(l => l.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_AUDIT, cid), JSON.stringify(logs));
    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      await client.from('audit_logs').delete().eq('id', id);
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const cid = this.getActiveClassId();
    const newLog: AuditLogEntry = {
      ...entry,
      id: generateUUID(),
      timestamp: new Date().toISOString()
    };

    const logs = [newLog, ...this.getAuditLogs(cid)].slice(0, 500);
    localStorage.setItem(this.scopedKey(this.KEY_AUDIT, cid), JSON.stringify(logs));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      await client.from('audit_logs').insert([{
        id: newLog.id,
        action: entry.action,
        details: entry.details,
        performed_by: entry.performedBy,
        user_role: entry.userRole,
        created_at: newLog.timestamp
      }]);
    }
    this.scheduleSnapshotPublish(cid, entry.performedBy);
    return newLog;
  }

  public static async fetchAuditLogsFromSupabase(classId?: string): Promise<AuditLogEntry[]> {
    const cid = classId || this.getActiveClassId();
    const client = getSupabaseClient();
    if (!client || !this.isDefaultClass(cid)) return this.getAuditLogs(cid);

    const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return this.getAuditLogs(cid);

    const mapped: AuditLogEntry[] = (data || []).map(l => ({
      id: l.id,
      timestamp: l.created_at,
      action: l.action,
      details: l.details,
      performedBy: l.performed_by,
      userRole: l.user_role
    }));

    localStorage.setItem(this.scopedKey(this.KEY_AUDIT, cid), JSON.stringify(mapped));
    return mapped;
  }

  public static async updateMember(memberId: string, updates: Partial<KasMember>): Promise<void> {
    const cid = this.getActiveClassId();
    const members = this.getMembers(cid);
    const updated = members.map(m => m.id === memberId ? { ...m, ...updates } : m);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
  }

  public static async deleteMember(memberId: string): Promise<void> {
    const cid = this.getActiveClassId();
    const current = this.getMembers(cid);
    const updated = current.filter(m => m.id !== memberId);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify(updated));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
      setCloudSyncStatus('syncing');
      const { error } = await client.from('kas_members').delete().eq('id', memberId);
      if (error) setCloudSyncStatus('offline');
      else setCloudSyncStatus('synced');
    }
    this.scheduleSnapshotPublish(cid);
  }

  public static async addMembers(newMembers: { name: string; studentId: string; phone?: string }[]): Promise<KasMember[]> {
    const cid = this.getActiveClassId();
    const created: KasMember[] = newMembers.map(m => ({
      id: generateUUID(),
      name: m.name,
      studentId: m.studentId,
      phone: m.phone,
      weeklyStatus: {}
    }));

    const current = this.getMembers(cid);
    localStorage.setItem(this.scopedKey(this.KEY_MEMBERS, cid), JSON.stringify([...current, ...created]));

    const client = getSupabaseClient();
    if (client && this.isDefaultClass(cid)) {
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
    this.scheduleSnapshotPublish(cid);
    return created;
  }

  public static async forceSyncAllToCloud(updatedBy?: string): Promise<{ success: boolean; message: string }> {
    const cid = this.getActiveClassId();
    try {
      setCloudSyncStatus('syncing');
      const txs = this.getTransactions(cid);
      const members = this.getMembers(cid);
      const settings = this.getSettings(cid);
      const client = getSupabaseClient();

      if (!client) throw new Error('Koneksi database tidak aktif.');

      await this.saveSettings(settings, cid);

      if (this.isDefaultClass(cid)) {
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
      }

      const pub = await this.publishClassSnapshot(cid, updatedBy || 'Sync Manual');
      const kb = pub ? (pub.bytes / 1024).toFixed(1) : '0';
      setCloudSyncStatus('synced');
      return { success: true, message: `✅ Snapshot kelas (${kb} KB) berhasil disinkronkan ke Cloud!` };
    } catch (err: any) {
      setCloudSyncStatus('offline');
      return { success: false, message: `❌ Gagal sync: ${err.message}` };
    }
  }

  // ---------------- USER PROFILES & ROLES ----------------
  public static async syncUserProfile(profile: { id: string; email: string; name: string; avatar?: string }): Promise<UserRole> {
    const localRole = registerOrUpdateUser(profile);

    const client = getSupabaseClient();
    if (!client) return localRole;

    try {
      const { data: whitelist } = await client.from('authorized_whitelist').select('role').eq('email', profile.email.toLowerCase()).maybeSingle();
      let role: UserRole = localRole;

      if (profile.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) role = 'superadmin';
      else if (whitelist) role = whitelist.role;

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

    const localUsers = getRegisteredUsers();
    localUsers.forEach(u => {
      map.set(u.email.toLowerCase(), {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'superadmin' : u.role,
        avatar: u.avatar,
        linkedMemberId: u.linkedMemberId,
        linkedMemberName: u.linkedMemberName
      });
    });

    if (!map.has(SUPER_ADMIN_EMAIL)) {
      map.set(SUPER_ADMIN_EMAIL, {
        id: 'usr_super',
        email: SUPER_ADMIN_EMAIL,
        name: 'Muhammad Rachman Fajri Muliyansah',
        role: 'superadmin'
      });
    }

    const client = getSupabaseClient();
    if (!client) return Array.from(map.values());

    try {
      const { data: whitelistData } = await client.from('authorized_whitelist').select('*');
      const { data: profilesData } = await client.from('user_profiles').select('*');

      (profilesData || []).forEach(p => {
        const existing = map.get(p.email.toLowerCase());
        map.set(p.email.toLowerCase(), {
          id: p.id,
          email: p.email,
          name: p.full_name || existing?.name || p.email.split('@')[0],
          role: p.email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'superadmin' : (p.role || existing?.role || 'anggota'),
          avatar: p.avatar_url || existing?.avatar,
          linkedMemberId: existing?.linkedMemberId,
          linkedMemberName: existing?.linkedMemberName
        });
      });

      (whitelistData || []).forEach(w => {
        const existing = map.get(w.email.toLowerCase());
        if (existing) {
          existing.role = w.email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'superadmin' : w.role;
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
  public static getKolektifBills(classId?: string): KolektifBill[] {
    const cid = classId || this.getActiveClassId();
    const key = this.scopedKey(this.KEY_KOLEKTIF, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
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

  public static saveKolektifBills(bills: KolektifBill[], classId?: string): void {
    const cid = classId || this.getActiveClassId();
    localStorage.setItem(this.scopedKey(this.KEY_KOLEKTIF, cid), JSON.stringify(bills));
    this.scheduleSnapshotPublish(cid);
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
  public static getPointLogs(classId?: string): StudentPointLog[] {
    const cid = classId || this.getActiveClassId();
    const key = this.scopedKey(this.KEY_POINTS, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static addPointLog(log: Omit<StudentPointLog, 'id' | 'createdAt'>): StudentPointLog {
    const cid = this.getActiveClassId();
    const logs = this.getPointLogs(cid);
    const newLog: StudentPointLog = {
      ...log,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(this.scopedKey(this.KEY_POINTS, cid), JSON.stringify(logs));
    this.scheduleSnapshotPublish(cid, log.recordedBy);
    return newLog;
  }

  public static deletePointLog(id: string): void {
    const cid = this.getActiveClassId();
    const logs = this.getPointLogs(cid).filter(l => l.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_POINTS, cid), JSON.stringify(logs));
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- SEKRETARIAT: PRESENSI KELAS & RAPAT ----------------
  public static getAttendanceRecords(classId?: string): AttendanceRecord[] {
    const cid = classId || this.getActiveClassId();
    const key = this.scopedKey(this.KEY_ATTENDANCE, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveAttendanceRecord(rec: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }): AttendanceRecord {
    const cid = this.getActiveClassId();
    const key = this.scopedKey(this.KEY_ATTENDANCE, cid);
    const records = this.getAttendanceRecords(cid);
    if (rec.id) {
      const idx = records.findIndex(r => r.id === rec.id);
      if (idx >= 0) {
        records[idx] = { ...records[idx], ...rec } as AttendanceRecord;
        localStorage.setItem(key, JSON.stringify(records));
        this.scheduleSnapshotPublish(cid, rec.recordedBy);
        return records[idx];
      }
    }
    const newRec: AttendanceRecord = {
      ...rec,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    records.unshift(newRec);
    localStorage.setItem(key, JSON.stringify(records));
    this.scheduleSnapshotPublish(cid, rec.recordedBy);
    return newRec;
  }

  public static deleteAttendanceRecord(id: string): void {
    const cid = this.getActiveClassId();
    const records = this.getAttendanceRecords(cid).filter(r => r.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_ATTENDANCE, cid), JSON.stringify(records));
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- SEKRETARIAT: NOTULENSI RAPAT & FORMAT SURAT ----------------
  public static getMeetingMinutes(classId?: string): MeetingMinute[] {
    const cid = this.getActiveClassId();
    const key = this.scopedKey(this.KEY_MINUTES, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveMeetingMinute(minute: Omit<MeetingMinute, 'id' | 'createdAt'> & { id?: string }): MeetingMinute {
    const cid = this.getActiveClassId();
    const key = this.scopedKey(this.KEY_MINUTES, cid);
    const minutes = this.getMeetingMinutes(cid);
    if (minute.id) {
      const idx = minutes.findIndex(m => m.id === minute.id);
      if (idx >= 0) {
        minutes[idx] = { ...minutes[idx], ...minute } as MeetingMinute;
        localStorage.setItem(key, JSON.stringify(minutes));
        this.scheduleSnapshotPublish(cid, minute.noteTaker);
        return minutes[idx];
      }
    }
    const newMinute: MeetingMinute = {
      ...minute,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    minutes.unshift(newMinute);
    localStorage.setItem(key, JSON.stringify(minutes));
    this.scheduleSnapshotPublish(cid, minute.noteTaker);
    return newMinute;
  }

  public static deleteMeetingMinute(id: string): void {
    const cid = this.getActiveClassId();
    const minutes = this.getMeetingMinutes(cid).filter(m => m.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_MINUTES, cid), JSON.stringify(minutes));
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- SEKRETARIAT: INVENTARIS KELAS ----------------
  public static getInventoryItems(classId?: string): ClassInventoryItem[] {
    const cid = classId || this.getActiveClassId();
    const key = this.scopedKey(this.KEY_INVENTORY, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveInventoryItem(item: Omit<ClassInventoryItem, 'id' | 'createdAt'> & { id?: string }): ClassInventoryItem {
    const cid = this.getActiveClassId();
    const key = this.scopedKey(this.KEY_INVENTORY, cid);
    const items = this.getInventoryItems(cid);
    if (item.id) {
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...item } as ClassInventoryItem;
        localStorage.setItem(key, JSON.stringify(items));
        this.scheduleSnapshotPublish(cid);
        return items[idx];
      }
    }
    const newItem: ClassInventoryItem = {
      ...item,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    localStorage.setItem(key, JSON.stringify(items));
    this.scheduleSnapshotPublish(cid);
    return newItem;
  }

  public static deleteInventoryItem(id: string): void {
    const cid = this.getActiveClassId();
    const items = this.getInventoryItems(cid).filter(i => i.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_INVENTORY, cid), JSON.stringify(items));
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- SEKRETARIAT: JADWAL KULIAH & TUGAS ----------------
  public static getCourseSchedules(classId?: string): CourseSchedule[] {
    const cid = classId || this.getActiveClassId();
    const key = this.scopedKey(this.KEY_COURSES, cid);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveCourseSchedule(course: Omit<CourseSchedule, 'id' | 'createdAt'> & { id?: string }): CourseSchedule {
    const cid = this.getActiveClassId();
    const key = this.scopedKey(this.KEY_COURSES, cid);
    const courses = this.getCourseSchedules(cid);
    if (course.id) {
      const idx = courses.findIndex(c => c.id === course.id);
      if (idx >= 0) {
        courses[idx] = { ...courses[idx], ...course } as CourseSchedule;
        localStorage.setItem(key, JSON.stringify(courses));
        this.scheduleSnapshotPublish(cid);
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
    localStorage.setItem(key, JSON.stringify(courses));
    this.scheduleSnapshotPublish(cid);
    return newCourse;
  }

  public static deleteCourseSchedule(id: string): void {
    const cid = this.getActiveClassId();
    const courses = this.getCourseSchedules(cid).filter(c => c.id !== id);
    localStorage.setItem(this.scopedKey(this.KEY_COURSES, cid), JSON.stringify(courses));
    this.scheduleSnapshotPublish(cid);
  }

  public static addCourseAssignment(courseId: string, assignment: Omit<CourseAssignment, 'id'>): void {
    const cid = this.getActiveClassId();
    const courses = this.getCourseSchedules(cid);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const newAsg: CourseAssignment = {
      ...assignment,
      id: generateUUID()
    };
    course.assignments.push(newAsg);
    localStorage.setItem(this.scopedKey(this.KEY_COURSES, cid), JSON.stringify(courses));
    this.scheduleSnapshotPublish(cid);
  }

  public static toggleCourseAssignment(courseId: string, assignmentId: string): void {
    const cid = this.getActiveClassId();
    const courses = this.getCourseSchedules(cid);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const asg = course.assignments.find(a => a.id === assignmentId);
    if (!asg) return;
    asg.status = asg.status === 'selesai' ? 'pending' : 'selesai';
    localStorage.setItem(this.scopedKey(this.KEY_COURSES, cid), JSON.stringify(courses));
    this.scheduleSnapshotPublish(cid);
  }

  public static deleteCourseAssignment(courseId: string, assignmentId: string): void {
    const cid = this.getActiveClassId();
    const courses = this.getCourseSchedules(cid);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    course.assignments = course.assignments.filter(a => a.id !== assignmentId);
    localStorage.setItem(this.scopedKey(this.KEY_COURSES, cid), JSON.stringify(courses));
    this.scheduleSnapshotPublish(cid);
  }

  public static getSavedGroups(classId?: string): any[] {
    const cid = classId || this.getActiveClassId();
    try {
      return JSON.parse(localStorage.getItem(this.scopedKey(this.KEY_GROUPS, cid)) || '[]');
    } catch {
      return [];
    }
  }

  public static saveSavedGroups(groups: any[], classId?: string): void {
    const cid = classId || this.getActiveClassId();
    localStorage.setItem(this.scopedKey(this.KEY_GROUPS, cid), JSON.stringify(groups));
    this.scheduleSnapshotPublish(cid);
  }

  // ---------------- FULL APPLICATION JSON BACKUP & RESTORE ----------------
  public static async exportFullBackupJSON(exportedBy: string, role: string): Promise<ClassBackupData> {
    const cid = this.getActiveClassId();
    const settings = this.getSettings(cid);
    const members = this.getMembers(cid);
    const transactions = this.getTransactions(cid);
    const kolektifBills = this.getKolektifBills(cid);
    const savedGroupCollections = this.getSavedGroups(cid);
    const auditLogs = this.getAuditLogs(cid);
    const whitelist = await this.getWhitelist();
    const attendance = this.getAttendanceRecords(cid);
    const studentPoints = this.getPointLogs(cid);
    const minutes = this.getMeetingMinutes(cid);

    const backupData: ClassBackupData = {
      version: '4.9.0',
      exportedAt: new Date().toISOString(),
      exportedBy: exportedBy || 'Pengurus',
      role: role || 'pengurus',
      classId: cid,
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

    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kelasgue_${cid}_backup_${dateStr}_v4.9.0.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.warn("Could not auto-download JSON:", e);
    }

    await this.addAuditLog({
      action: "EKSPOR CADANGAN DATA",
      details: `Ekspor cadangan database lengkap JSON kelas ${cid} (${transactions.length} transaksi, ${members.length} siswa) oleh ${exportedBy}`,
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

    const cid = backup.classId || this.getActiveClassId();

    await this.saveSettings(backup.settings, cid);

    if (Array.isArray(backup.members)) {
      await this.saveMembers(backup.members, cid);
    }

    if (Array.isArray(backup.transactions)) {
      localStorage.setItem(this.scopedKey(this.KEY_TX, cid), JSON.stringify(backup.transactions));
    }

    if (Array.isArray(backup.kolektifBills)) {
      this.saveKolektifBills(backup.kolektifBills, cid);
    }

    if (Array.isArray(backup.savedGroupCollections)) {
      localStorage.setItem(this.scopedKey(this.KEY_GROUPS, cid), JSON.stringify(backup.savedGroupCollections));
    }

    if (Array.isArray(backup.attendance)) {
      localStorage.setItem(this.scopedKey(this.KEY_ATTENDANCE, cid), JSON.stringify(backup.attendance));
    }
    if (Array.isArray(backup.studentPoints)) {
      localStorage.setItem(this.scopedKey(this.KEY_POINTS, cid), JSON.stringify(backup.studentPoints));
    }
    if (Array.isArray(backup.minutes)) {
      localStorage.setItem(this.scopedKey(this.KEY_MINUTES, cid), JSON.stringify(backup.minutes));
    }

    await this.forceSyncAllToCloud(importedBy);

    await this.addAuditLog({
      action: "IMPOR CADANGAN DATA",
      details: `Restorasi cadangan database v${backup.version || 'unknown'} kelas ${cid} (${backup.transactions?.length || 0} transaksi, ${backup.members?.length || 0} siswa) oleh ${importedBy}. Snapshot sebelumnya tersimpan di audit.`,
      performedBy: importedBy || 'Pengurus',
      userRole: role || 'pengurus'
    });

    return {
      success: true,
      message: `Cadangan berhasil dipulihkan! (${backup.transactions?.length || 0} transaksi, ${backup.members?.length || 0} siswa tersinkronisasi).`
    };
  }
}

// Debounced Realtime Subscription (prevents redundant table downloads per click)
export const subscribeToRealtimeKas = (
  onTransactionChange: (payload: any) => void,
  onMemberChange: (payload: any) => void,
  onAuditLogChange?: (payload: any) => void,
  onSettingsChange?: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  let txTimer: any = null;
  let memberTimer: any = null;
  let auditTimer: any = null;
  let settingsTimer: any = null;

  const channel = client
    .channel('realtime_kas_v4_9_0')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_transactions' }, (p) => {
      if (txTimer) clearTimeout(txTimer);
      txTimer = setTimeout(() => onTransactionChange(p), 1200);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kas_members' }, (p) => {
      if (memberTimer) clearTimeout(memberTimer);
      memberTimer = setTimeout(() => onMemberChange(p), 1200);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (p) => {
      if (auditTimer) clearTimeout(auditTimer);
      auditTimer = setTimeout(() => onAuditLogChange?.(p), 1500);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'class_settings' }, (p) => {
      if (settingsTimer) clearTimeout(settingsTimer);
      settingsTimer = setTimeout(() => onSettingsChange?.(p), 1000);
    })
    .subscribe();

  return () => {
    if (txTimer) clearTimeout(txTimer);
    if (memberTimer) clearTimeout(memberTimer);
    if (auditTimer) clearTimeout(auditTimer);
    if (settingsTimer) clearTimeout(settingsTimer);
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
