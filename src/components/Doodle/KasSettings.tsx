import React, { useState } from 'react';
import { ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { ScotchTape, DoodleCrown } from './DoodleDecorations.tsx';
import { getSupabaseClient, signInWithGoogleSupabase } from '../../services/supabaseClient.ts';
import { getRegisteredUsers, updateUserRole, RegisteredUser } from '../../utils/userManagement.ts';
import { 
  Database, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  UserPlus, 
  Lock, 
  KeyRound,
  ExternalLink,
  Copy,
  Info,
  Terminal,
  Bell
} from 'lucide-react';
import { saveNewPin } from '../../utils/security.ts';
import { requestNotificationPermission, sendLocalNotification } from '../../utils/notifications.ts';

interface KasSettingsProps {
  settings: ClassSettings;
  onSaveSettings: (settings: ClassSettings) => void;
  onResetData: () => void;
}

export const KasSettings: React.FC<KasSettingsProps> = ({
  settings,
  onSaveSettings,
  onResetData,
}) => {
  const { isSuperAdmin } = useAuth();
  const [form, setForm] = useState<ClassSettings>({ ...settings });
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'not_configured'>(() => {
    return getSupabaseClient() ? 'connected' : 'not_configured';
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // User Role Management state for Super Admin
  const [userList, setUserList] = useState<RegisteredUser[]>(() => getRegisteredUsers());
  const [manualEmail, setManualEmail] = useState('');

  // 6-Digit PIN Security State
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) {
      setPinMessage('PIN harus terdiri dari tepat 6 angka (misal: 123456).');
      return;
    }
    try {
      saveNewPin(newPin);
      sfx.playSuccess();
      setPinMessage('✓ PIN 6-digit keamanan transaksi besar berhasil diperbarui dengan bcrypt!');
      setNewPin('');
      setTimeout(() => setPinMessage(null), 3500);
    } catch (err: any) {
      setPinMessage(`Gagal menyimpan PIN: ${err.message}`);
    }
  };

  const handleRoleToggle = (email: string, currentRole: string) => {
    sfx.playClick();
    const newRole = currentRole === 'bendahara' ? 'anggota' : 'bendahara';
    const updated = updateUserRole(email, newRole);
    setUserList(updated);
    setSaveMessage(`Hak akses ${email} berhasil diubah menjadi ${newRole.toUpperCase()}.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleAddManualBendahara = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualEmail.includes('@')) return;
    sfx.playCoinChime();
    const updated = updateUserRole(manualEmail.trim(), 'bendahara');
    setUserList(updated);
    setManualEmail('');
    setSaveMessage(`Email ${manualEmail.trim()} berhasil ditambahkan sebagai Bendahara.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playCoinChime();
    onSaveSettings(form);
    const client = getSupabaseClient();
    setSupabaseStatus(client ? 'connected' : 'not_configured');
    setSaveMessage('Pengaturan & kredensial berhasil disimpan!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestSupabase = async () => {
    sfx.playClick();
    const client = getSupabaseClient();
    if (!client) {
      alert('Kredensial Supabase URL atau Anon Key belum valid.');
      return;
    }
    
    try {
      const { error } = await client.from('kas_transactions').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === '42P01') {
          alert('Koneksi OK, namun tabel belum dibuat. Silakan jalankan script SQL di bawah!');
          setSupabaseStatus('connected');
        } else {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert('✓ Database Supabase Aktif & Sinkron!');
        setSupabaseStatus('connected');
      }
    } catch (err: any) {
      alert(`Koneksi gagal: ${err?.message}`);
    }
  };

  const handleTestNotification = async () => {
    sfx.playNotification();
    const ok = await requestNotificationPermission();
    if (ok) {
      sendLocalNotification('Kelas Gue v3.2', {
        body: 'Notifikasi PWA berhasil diaktifkan! Pengingat iuran akan muncul di sini.',
        vibrate: [200, 100, 200]
      } as any);
    } else {
      alert('Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser Anda.');
    }
  };

  const sqlScript = `-- 1. Jalankan script ini di Supabase SQL Editor
-- Membuat Tabel Transaksi Kas
CREATE TABLE IF NOT EXISTS public.kas_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by TEXT NOT NULL,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membuat Tabel Anggota
CREATE TABLE IF NOT EXISTS public.kas_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_id TEXT NOT NULL UNIQUE,
    phone TEXT,
    weekly_status JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membuat Tabel Audit Log
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT,
    performed_by TEXT NOT NULL,
    user_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membuat Tabel Settings
CREATE TABLE IF NOT EXISTS public.class_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    class_name TEXT NOT NULL DEFAULT 'Kelas Gue',
    weekly_dues_amount NUMERIC NOT NULL DEFAULT 5000,
    kas_target_amount NUMERIC NOT NULL DEFAULT 1000000,
    currency_prefix TEXT NOT NULL DEFAULT 'Rp',
    academic_year TEXT NOT NULL DEFAULT '2023/2024',
    CONSTRAINT one_row CHECK (id = 1)
);

-- Aktifkan Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE kas_transactions, kas_members, audit_logs, class_settings;`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* 1. Header & Version Info */}
      <div className="relative card-doodle-yellow p-6 rounded-lg">
        <ScotchTape className="absolute -top-3 left-8 rotate-[-2deg]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
              <span>Pusat Kendali & Konfigurasi Sistem</span>
            </h2>
            <p className="text-sm text-slate-700 mt-1">
              Kelola database Supabase, izin akses bendahara, dan pantau catatan pembaruan aplikasi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestNotification}
              className="btn-doodle px-3 py-2 bg-white text-slate-900 text-xs font-bold rounded-md flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Tes Notifikasi PWA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Supabase Connection Guide (NEW) */}
      <div className="card-doodle p-6 rounded-lg bg-white relative">
        <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-900 pb-3">
          <Info className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-black text-slate-900">Panduan Koneksi Supabase (Nol ke Pro)</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-md">
              <p className="text-xs font-black text-slate-900 mb-2">Langkah 1: Buat Project</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Buka <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-sky-600 underline">Supabase Dashboard</a>, buat project baru (Gratis). Pilih region <strong>Singapore</strong> untuk kecepatan terbaik di Indonesia.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-md">
              <p className="text-xs font-black text-slate-900 mb-2">Langkah 2: Ambil API Keys</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pergi ke <strong>Project Settings &gt; API</strong>. Salin <code>Project URL</code> dan <code>anon public</code> key, lalu tempel di form konfigurasi di bawah.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-md">
              <p className="text-xs font-black text-slate-900 mb-2">Langkah 3: Jalankan SQL</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Penting! Klik <strong>SQL Editor</strong> di Supabase, pilih <strong>New Query</strong>, salin script SQL di bawah dan klik <strong>Run</strong>. Ini akan membuat tabel otomatis.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-md">
              <p className="text-xs font-black text-slate-900 mb-2">Langkah 4: Setup Storage</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Klik menu <strong>Storage</strong>, buat bucket baru bernama <code>nota-kas</code>. Pastikan centang <strong>Public Bucket</strong> agar foto nota bisa dilihat semua orang.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supabase Configuration Form */}
      <div className="card-doodle p-6 rounded-lg bg-white relative">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Konfigurasi API Supabase</span>
            </h3>
            {supabaseStatus === 'connected' ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Aktif
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Project URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={form.supabaseUrl}
                onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:bg-amber-50/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Anon Public Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={form.supabaseAnonKey}
                onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border-2 border-slate-900 rounded-md focus:bg-amber-50/30 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestSupabase}
              className="btn-doodle px-4 py-2 bg-sky-100 hover:bg-sky-200 text-slate-900 text-xs font-bold rounded-md"
            >
              Cek Tabel & Koneksi
            </button>
            <button
              type="submit"
              className="btn-doodle px-6 py-2 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-sm font-black rounded-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Sinkron</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. SQL Script Section */}
      <div className="card-doodle p-6 rounded-lg bg-slate-900 relative border-2 border-slate-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-tight">
            <Terminal className="w-4 h-4" />
            <span>Script SQL Setup Tabel (Salin & Jalankan)</span>
          </h3>
          <button
            onClick={() => {
              sfx.playClick();
              navigator.clipboard.writeText(sqlScript);
              alert('SQL Script berhasil disalin!');
            }}
            className="flex items-center gap-1.5 px-2 py-1 bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-black rounded border-2 border-slate-900"
          >
            <Copy className="w-3 h-3" />
            <span>Salin SQL</span>
          </button>
        </div>
        <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-48 p-2 bg-slate-800 rounded border border-slate-700 leading-relaxed">
          {sqlScript}
        </pre>
        <p className="text-[10px] text-slate-500 mt-2 italic flex items-center gap-1">
          <Info className="w-3 h-3" /> Jalankan ini di Supabase SQL Editor agar database "Kelas Gue" berfungsi penuh.
        </p>
      </div>

      {/* 5. Role & PIN Management (Consolidated) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Whitelist */}
        <div className="card-doodle p-5 rounded-lg bg-white relative">
          <h3 className="text-sm font-black text-slate-900 mb-4 border-b-2 border-slate-900 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Whitelist Bendahara</span>
          </h3>
          <form onSubmit={handleAddManualBendahara} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Email Google..."
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-slate-900 rounded-md focus:bg-amber-50/30 outline-none"
            />
            <button type="submit" className="btn-doodle px-3 py-1.5 bg-emerald-400 text-slate-900 text-xs font-black rounded-md">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {userList.map(u => (
              <div key={u.id} className="flex items-center justify-between p-2 bg-slate-50 border-2 border-slate-900 rounded-md">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => handleRoleToggle(u.email, u.role)}
                  className={`px-2 py-1 rounded text-[10px] font-black border-2 border-slate-900 ${
                    u.role === 'bendahara' ? 'bg-rose-300' : 'bg-slate-200'
                  }`}
                >
                  {u.role === 'bendahara' ? 'Hapus' : 'Jadikan Bendahara'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PIN Security */}
        <div className="card-doodle p-5 rounded-lg bg-white relative">
          <h3 className="text-sm font-black text-slate-900 mb-4 border-b-2 border-slate-900 pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>PIN Transaksi Besar (&gt;500k)</span>
          </h3>
          <p className="text-[11px] text-slate-600 mb-3">Gunakan 6 digit angka untuk memverifikasi pengeluaran besar.</p>
          <div className="flex gap-2">
            <input
              type="password"
              maxLength={6}
              placeholder="6 Digit PIN..."
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-slate-900 rounded-md outline-none"
            />
            <button onClick={handleUpdatePin} className="btn-doodle px-3 py-1.5 bg-amber-300 text-slate-900 text-xs font-black rounded-md">
              <KeyRound className="w-4 h-4" />
            </button>
          </div>
          {pinMessage && <p className="text-[10px] text-emerald-700 font-bold mt-2">{pinMessage}</p>}
        </div>
      </div>

      {/* 6. Patch Notes & Suggestions */}
      <div className="card-doodle p-6 rounded-lg bg-amber-50/80 border-2 border-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <h3 className="text-base font-black text-slate-900">Catatan Pembaruan v{CURRENT_APP_VERSION.version}</h3>
          <span className="text-[10px] font-mono text-slate-500 italic">Rilis: {CURRENT_APP_VERSION.releaseDate}</span>
        </div>
        <ul className="space-y-1.5 mb-6">
          {CURRENT_APP_VERSION.changes.map((c, i) => (
            <li key={i} className="text-xs text-slate-700 flex gap-2">
              <span className="text-emerald-600 font-bold shrink-0">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t-2 border-dashed border-slate-300">
          <h4 className="text-xs font-black text-slate-800 uppercase mb-3 tracking-wider">Rencana Pembaruan Selanjutnya:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CURRENT_APP_VERSION.suggestedUpdates.map((s, i) => (
              <div key={i} className="p-3 bg-white border-2 border-slate-900 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-900">{s.title}</span>
                  <span className="text-[9px] bg-sky-100 px-1 rounded font-bold uppercase border border-sky-300">{s.category}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
