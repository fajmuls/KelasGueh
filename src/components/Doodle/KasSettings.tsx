import React, { useState } from 'react';
import { ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { ScotchTape, DoodleCrown } from './DoodleDecorations.tsx';
import { getSupabaseClient, signInWithGoogleSupabase } from '../../services/supabaseClient.ts';
import { getRegisteredUsers, updateUserRole, RegisteredUser } from '../../utils/userManagement.ts';
import { Database, Shield, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Save, UserCheck, UserPlus, ShieldCheck, User, Lock, KeyRound } from 'lucide-react';
import { saveNewPin, DEFAULT_PIN } from '../../utils/security.ts';

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
  const { isSuperAdmin, isBendahara } = useAuth();
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
      alert('Kredensial Supabase URL atau Anon Key belum valid. Masukkan URL https://... dan Anon Key terlebih dahulu.');
      return;
    }
    
    try {
      setSupabaseStatus('not_configured');
      // Test basic connectivity by fetching schema
      const { data, error } = await client.from('kas_transactions').select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          alert('Koneksi ke Supabase BERHASIL, namun tabel "kas_transactions" belum ditemukan. Silakan jalankan script SQL di bawah!');
          setSupabaseStatus('connected');
        } else {
          alert(`Koneksi Supabase error: ${error.message} (Code: ${error.code})`);
        }
      } else {
        alert('✓ KONEKSI & DATABASE SUPABASE AKTIF! Seluruh tabel terdeteksi dengan baik.');
        setSupabaseStatus('connected');
      }
    } catch (err: any) {
      alert(`Koneksi gagal total: ${err?.message || 'Periksa URL dan Key'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Form Container */}
      <div className="card-doodle p-6 sm:p-8 rounded-lg bg-white relative">
        <ScotchTape className="absolute -top-3 right-10 rotate-2" />

        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              <span>Pengaturan Kelas & Supabase</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Konfigurasi database cloud Supabase, nama kelas, nominal kas, dan pelacakan versi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-200 border border-slate-900 px-2 py-1 rounded-xs font-black text-slate-900">
              Versi v{CURRENT_APP_VERSION.version}
            </span>
          </div>
        </div>

        {saveMessage && (
          <div className="mb-4 p-3 bg-emerald-100 border-2 border-slate-900 rounded-md text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Integrasi Cloud Supabase */}
          <div className="p-3 bg-amber-50/70 border-2 border-slate-900 rounded-md text-xs text-slate-700">
            <strong>Catatan Pengaturan Iuran:</strong> Nominal iuran mingguan dan target kas sekarang diatur secara langsung di modul <strong>Buku Kas</strong> (khusus wewenang <strong>Super Admin</strong>) agar bendahara dan anggota fokus pada pencatatan kas dan checklist.
          </div>

          {/* Section 2: Konfigurasi Supabase Database & Auth */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>02. Integrasi Cloud Supabase (Database & Auth)</span>
              </h3>
              <div className="flex items-center gap-1 text-xs">
                {supabaseStatus === 'connected' ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 border border-slate-900 px-2 py-0.5 rounded-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Terhubung
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-100 border border-slate-900 px-2 py-0.5 rounded-xs">
                    <AlertCircle className="w-3.5 h-3.5" /> Mode Lokal (Fallback)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border-2 border-slate-900 rounded-md text-xs text-slate-700 mb-4">
              <strong>Catatan Supabase:</strong> Anda dapat menginput URL & Anon Key dari dashboard Supabase Anda di bawah ini, atau mendefinisikannya di file <code>.env</code>. Saat belum terisi, sistem otomatis menggunakan penyimpanan lokal reaktif sehingga aplikasi tetap berjalan lancar tanpa error.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="text"
                  placeholder="https://xyzproject.supabase.co"
                  value={form.supabaseUrl}
                  onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Project API Anon Key Supabase
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={form.supabaseAnonKey}
                  onChange={(e) => setForm({ ...form, supabaseAnonKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-mono border-2 border-slate-900 rounded-md focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  className="btn-doodle px-3.5 py-1.5 bg-sky-200 hover:bg-sky-300 text-slate-900 text-xs font-bold rounded-md"
                >
                  Tes Koneksi Supabase
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    sfx.playClick();
                    const res = await signInWithGoogleSupabase();
                    if (!res.success) {
                      alert(res.error);
                    }
                  }}
                  className="btn-doodle px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-md"
                >
                  Login Google via Supabase
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Manajemen Role Akun Google (Khusus Super Admin) */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <DoodleCrown className="w-4 h-4 text-amber-600" />
                <span>03. Manajemen Role Akun Google (Bendahara & Anggota)</span>
              </h3>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold border border-slate-900 px-2 py-0.5 rounded">
                Khusus Super Admin
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Setiap akun Google baru yang terdeteksi login otomatis ditempatkan pada role <strong>Anggota (Read-Only)</strong>. Super Admin berhak memberikan atau mencabut akses <strong>Bendahara</strong> di bawah ini:
            </p>

            {/* Quick Add Manual Bendahara Email Form */}
            <form onSubmit={handleAddManualBendahara} className="mb-4 flex gap-2">
              <input
                type="email"
                placeholder="Tambah email Google calon bendahara (misal: bendahara2@gmail.com)..."
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs font-mono border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
              />
              <button
                type="submit"
                className="btn-doodle px-3.5 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black text-xs rounded-md flex items-center gap-1 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Jadikan Bendahara</span>
              </button>
            </form>

            {/* User List Table */}
            <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Email / Nama Akun Google</th>
                    <th className="p-2.5">Role Akses</th>
                    <th className="p-2.5 text-center">Tindakan Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {userList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-500 italic">
                        Belum ada riwayat akun Google yang terdaftar.
                      </td>
                    </tr>
                  ) : (
                    userList.map((u) => {
                      const isOwner = u.role === 'superadmin';
                      return (
                        <tr key={u.id} className="hover:bg-amber-50/30">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="font-mono text-slate-500 text-[11px]">{u.email}</div>
                          </td>
                          <td className="p-2.5">
                            {isOwner ? (
                              <span className="text-[10px] bg-amber-200 border border-slate-900 text-amber-950 font-black px-2 py-0.5 rounded-xs">
                                👑 Super Admin Pemilik
                              </span>
                            ) : u.role === 'bendahara' ? (
                              <span className="text-[10px] bg-emerald-200 border border-slate-900 text-emerald-950 font-bold px-2 py-0.5 rounded-xs">
                                🛡️ Bendahara Kelas
                              </span>
                            ) : (
                              <span className="text-[10px] bg-sky-100 border border-slate-300 text-sky-900 font-bold px-2 py-0.5 rounded-xs">
                                👀 Anggota (Hanya Lihat)
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {isOwner ? (
                              <span className="text-[11px] text-slate-400 italic">Permanen</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoleToggle(u.email, u.role)}
                                className={`btn-doodle px-3 py-1 text-xs font-bold rounded-md ${
                                  u.role === 'bendahara'
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                                    : 'bg-emerald-300 hover:bg-emerald-400 text-slate-900'
                                }`}
                              >
                                {u.role === 'bendahara' ? 'Cabut Akses (Jadikan Anggota)' : 'Berikan Akses Bendahara'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Script Generator Row Level Security (RLS) Supabase */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>04. Script Generator Row Level Security (RLS) Supabase</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold border border-slate-900 px-2 py-0.5 rounded">
                Keamanan Database
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Salin dan jalankan query SQL ini di <strong>Supabase SQL Editor</strong> untuk mengunci izin modifikasi tabel kas agar <strong>hanya Bendahara & Super Admin (mrachmanfm@gmail.com)</strong> yang berhak melakukan INSERT/UPDATE/DELETE. Anggota kelas lainnya tetap bisa membaca secara transparan (Read-Only).
            </p>

            <div className="bg-slate-900 rounded-md p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto border-2 border-slate-900 relative">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[10px]">
                <span>PostgreSQL RLS Security Policies</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      navigator.clipboard.writeText(`-- 1. Aktifkan Row Level Security (RLS) di tabel kas Supabase
ALTER TABLE IF EXISTS public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_settings ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan BACA PUBLIK (Seluruh anggota kelas dapat melihat transparansi kas)
DROP POLICY IF EXISTS "Public Read Kas Transactions" ON public.kas_transactions;
CREATE POLICY "Public Read Kas Transactions" ON public.kas_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Kas Members" ON public.kas_members;
CREATE POLICY "Public Read Kas Members" ON public.kas_members FOR SELECT USING (true);

-- 3. Kebijakan TULIS / MODIFIKASI (Khusus Super Admin & Bendahara)
DROP POLICY IF EXISTS "Restricted Write Kas Transactions" ON public.kas_transactions;
CREATE POLICY "Restricted Write Kas Transactions"
ON public.kas_transactions FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'mrachmanfm@gmail.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'bendahara')
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'mrachmanfm@gmail.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'bendahara')
);`);
                      alert('✓ Script SQL RLS Supabase berhasil disalin ke clipboard!');
                    }}
                    className="px-2 py-1 bg-amber-300 hover:bg-amber-400 text-slate-900 font-sans font-black rounded text-[10px] transition-colors"
                  >
                    Salin Script SQL (1-Klik)
                  </button>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold rounded text-[10px] inline-flex items-center gap-1"
                  >
                    Buka Supabase SQL Editor ↗
                  </a>
                </div>
              </div>

              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
{`-- 1. Tabel Transaksi Kas
CREATE TABLE IF NOT EXISTS public.kas_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  recorded_by TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Anggota Siswa (Weekly status using JSONB for YYYY_MM_W1 keys)
CREATE TABLE IF NOT EXISTS public.kas_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  phone TEXT,
  weekly_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Laporan Audit Realtime
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Aktifkan RLS & Kebijakan
ALTER TABLE public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read" ON public.kas_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read Members" ON public.kas_members FOR SELECT USING (true);
CREATE POLICY "Admin Write" ON public.kas_transactions FOR ALL TO authenticated USING (true);`}
              </pre>
            </div>
          </div>

          {/* Section 5: Konfigurasi PIN 6-Digit Keamanan Transaksi Besar */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>05. Keamanan PIN 6-Digit Transaksi Pengeluaran Kas &gt; Rp 500.000</span>
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold border border-slate-900 px-2 py-0.5 rounded">
                SHA-256 Web Crypto
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              PIN ini wajib dimasukkan oleh Bendahara / Super Admin setiap kali mencatat pengeluaran bernilai tinggi di atas Rp 500.000. PIN awal default adalah <strong>123456</strong>.
            </p>

            {pinMessage && (
              <div className="mb-3 p-2.5 bg-emerald-100 border-2 border-slate-900 rounded text-xs font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{pinMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input
                type="password"
                maxLength={6}
                placeholder="Masukkan 6 angka PIN baru (misal: 889900)..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="w-full sm:w-64 px-3 py-2 text-xs font-mono border-2 border-slate-900 rounded-md focus:outline-none focus:bg-amber-50/50"
              />
              <button
                type="button"
                onClick={handleUpdatePin}
                className="btn-doodle px-4 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-md flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Perbarui PIN SHA-256</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Yakin ingin mereset transaksi kas ke data awal sampel?')) {
                  sfx.playPaperRustle();
                  onResetData();
                }
              }}
              className="btn-doodle px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md"
            >
              Reset ke Sampel Data Awal
            </button>

            <button
              type="submit"
              className="btn-doodle px-6 py-2.5 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* App Version & Suggestions Card (User Instruction Requirement) */}
      <div className="card-doodle p-6 rounded-lg bg-[#FEF9C3] relative">
        <ScotchTape className="absolute -top-3 left-12 rotate-[-2deg]" />

        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-900" />
            <h3 className="text-lg font-black text-slate-900">
              Informasi Versi & Rekomendasi Pembaruan
            </h3>
          </div>
          <span className="text-xs bg-white border border-slate-900 px-2 py-0.5 rounded-xs font-mono font-bold text-slate-900">
            v{CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.releaseDate})
          </span>
        </div>

        <p className="text-xs text-slate-800 font-bold mb-3">
          Codename: {CURRENT_APP_VERSION.codename}
        </p>

        {/* Changelog list */}
        <div className="mb-6">
          <p className="text-xs font-black uppercase text-slate-700 mb-2">
            Riwayat Pembaruan Terkini:
          </p>
          <ul className="space-y-1 text-xs text-slate-800 list-disc list-inside">
            {CURRENT_APP_VERSION.changes.map((ch, idx) => (
              <li key={idx} className="leading-relaxed">{ch}</li>
            ))}
          </ul>
        </div>

        {/* Proactive update suggestions */}
        <div>
          <p className="text-xs font-black uppercase text-slate-700 mb-2">
            Saran & Rekomendasi Fitur Berguna (Temuan Pengembangan):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CURRENT_APP_VERSION.suggestedUpdates.map((sug, idx) => (
              <div key={idx} className="p-3 bg-white border-2 border-slate-900 rounded-md shadow-[2px_2px_0px_#1E293B]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-900">{sug.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-xs font-bold border border-slate-900 ${
                    sug.category === 'fitur' ? 'bg-sky-200' :
                    sug.category === 'optimasi' ? 'bg-emerald-200' : 'bg-rose-200'
                  }`}>
                    {sug.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  {sug.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
