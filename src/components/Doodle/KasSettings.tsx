import React, { useState } from 'react';
import { ClassSettings } from '../../types/kas.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { ScotchTape, DoodleCrown } from './DoodleDecorations.tsx';
import { getSupabaseClient, signInWithGoogleSupabase } from '../../services/supabaseClient.ts';
import { Database, Shield, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';

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
      const { data, error } = await client.from('kas_transactions').select('count', { count: 'exact', head: true });
      if (error && error.code !== '42P01') { // 42P01 is table does not exist yet which still proves connection works
        alert(`Koneksi Supabase error: ${error.message}`);
      } else {
        alert('Koneksi ke Supabase Project BERHASIL tersambung!');
        setSupabaseStatus('connected');
      }
    } catch (err: any) {
      alert(`Koneksi gagal: ${err?.message || 'Periksa URL dan Key'}`);
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

          {/* Section 3: Super Admin Privilege */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
              <DoodleCrown className="w-4 h-4" />
              <span>03. Hak Akses Super Admin Terkunci</span>
            </h3>
            <div className="p-3 bg-indigo-50 border-2 border-slate-900 rounded-md flex items-center justify-between text-xs sm:text-sm">
              <div>
                <p className="font-bold text-slate-900">Email Super Admin Pemilik:</p>
                <p className="font-mono text-indigo-700 font-bold">mrachmanfm@gmail.com</p>
              </div>
              <span className="bg-emerald-200 border border-slate-900 px-2 py-0.5 rounded-xs font-bold text-slate-900 text-xs">
                Permanen Aktif
              </span>
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
{`-- 1. Aktifkan Row Level Security (RLS) di tabel kas Supabase
ALTER TABLE IF EXISTS public.kas_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kas_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_settings ENABLE ROW LEVEL SECURITY;

-- 2. Kebijakan BACA PUBLIK (Seluruh anggota kelas dapat melihat transparansi kas)
CREATE POLICY "Public Read Kas Transactions" ON public.kas_transactions FOR SELECT USING (true);
CREATE POLICY "Public Read Kas Members" ON public.kas_members FOR SELECT USING (true);

-- 3. Kebijakan TULIS / MODIFIKASI (Khusus Super Admin & Bendahara)
CREATE POLICY "Restricted Write Kas Transactions"
ON public.kas_transactions FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'email' = 'mrachmanfm@gmail.com'
  OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'bendahara')
);`}
              </pre>
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
