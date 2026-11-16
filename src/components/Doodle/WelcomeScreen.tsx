import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin, DoodleCoin } from './DoodleDecorations.tsx';
import { SupabaseAuthGuideModal } from './SupabaseAuthGuideModal.tsx';
import {
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Eye,
  Lock,
  Mail,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '../../version.ts';

export const WelcomeScreen: React.FC = () => {
  const {
    loginAs,
    loginWithPengurusCredentials,
    loginWithSupabaseOAuth,
    isOAuthLoading,
    lastOAuthUrl
  } = useAuth();

  const [showPengurusForm, setShowPengurusForm] = useState(false);
  const [showAuthGuideModal, setShowAuthGuideModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePengurusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsVerifying(true);
    try {
      const res = await loginWithPengurusCredentials(emailInput, secretInput);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal verifikasi kredensial pengurus.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-grid flex items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
      <SupabaseAuthGuideModal
        isOpen={showAuthGuideModal}
        onClose={() => setShowAuthGuideModal(false)}
      />

      <div className="max-w-xl w-full relative">
        {/* Top Push Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <PushPin className="w-8 h-8 text-rose-500 drop-shadow-md" />
        </div>

        {/* Paper card container */}
        <div className="card-doodle p-6 sm:p-9 relative bg-[#FFFDF9] rounded-lg">
          <ScotchTape className="absolute -top-3 -right-4 rotate-12" />
          <ScotchTape className="absolute -bottom-3 -left-4 -rotate-6" />

          {/* Title Header */}
          <div className="text-center mb-7 border-b-2 border-dashed border-slate-300 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-300 rounded-sm mb-3">
              <DoodleCoin className="w-5 h-5" />
              <span className="text-xs font-bold tracking-wider uppercase text-amber-900">
                Sistem Transparansi Kas Kelas
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <span>Kelas Gue</span>
              <span className="inline-block text-amber-500 transform rotate-12">✦</span>
            </h1>

            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-md mx-auto">
              Buku kas digital kelas dengan bukti nota transparan, iuran mingguan, dan data terbuka tanpa perlu akun rumit.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
              Pilih Akses Masuk Aplikasi
            </p>

            {/* Primary Instant Transparent Access: Anggota Kelas */}
            <button
              type="button"
              onClick={() => {
                sfx.playCoinChime();
                loginAs('anggota');
              }}
              className="w-full min-h-[60px] bg-sky-100 hover:bg-sky-200/80 p-4 rounded-xl flex items-center justify-between text-left group border-2 border-slate-900 shadow-[3px_3px_0px_#1E293B] active:translate-y-0.5 transition"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <Eye className="w-5 h-5 text-sky-700" />
                </div>
                <div className="min-w-0">
                  <span className="font-black text-slate-900 text-sm sm:text-base leading-tight block">
                    Masuk sebagai Anggota Kelas
                  </span>
                  <div className="mt-1 mb-1 flex flex-wrap gap-1.5">
                    <span className="inline-block text-[9.5px] bg-emerald-300 border border-slate-900 px-1.5 py-0.5 rounded font-black text-slate-950">
                      Langsung Masuk • Tanpa Konfirmasi
                    </span>
                    <span className="inline-block text-[9.5px] bg-white border border-slate-900 px-1.5 py-0.5 rounded font-bold text-slate-800">
                      Bebas Pilih Kelas Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug">
                    Pantau transparansi saldo kas, bukti nota, status iuran, & kegiatan kelas secara instan (Read-Only).
                  </p>
                </div>
              </div>
              <span className="text-slate-900 group-hover:translate-x-1 transition-transform font-black text-lg shrink-0 ml-2">→</span>
            </button>

            {/* Pengurus Access Section (Supabase Email/PIN + Supabase OAuth) */}
            <div className="rounded-xl border-2 border-slate-900 bg-amber-50/70 shadow-[3px_3px_0px_#1E293B] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShowPengurusForm(prev => !prev);
                }}
                aria-expanded={showPengurusForm}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-amber-100/80 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-300 border-2 border-slate-900 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-slate-900 text-sm sm:text-base block leading-tight">
                      Masuk Pengurus Kelas
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Khusus Bendahara, Sekretaris & Super Admin (Autentikasi Supabase)
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-900 shrink-0 transition-transform ${showPengurusForm ? 'rotate-180' : ''}`}
                />
              </button>

              {showPengurusForm && (
                <div className="p-4 pt-3 border-t-2 border-slate-900 bg-white space-y-3.5 animate-in fade-in duration-150">
                  <form onSubmit={handlePengurusSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                        Email Pengurus Terdaftar (Whitelist Supabase)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          required
                          type="email"
                          placeholder="nama@gmail.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-bold bg-white focus:bg-amber-50 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                        PIN Pengurus (6 Digit) atau Password Supabase
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          required
                          type="password"
                          placeholder="Masukkan 6 digit PIN atau password"
                          value={secretInput}
                          onChange={(e) => setSecretInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold bg-white focus:bg-amber-50 outline-none"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 bg-rose-50 border-2 border-rose-500 rounded-lg text-[11px] font-bold text-rose-900">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full btn-doodle py-2.5 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#000] disabled:opacity-60"
                    >
                      {isVerifying ? 'Memverifikasi di Supabase...' : 'Verifikasi & Masuk sebagai Pengurus'}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span>atau login Google via Supabase</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Supabase OAuth Popup Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isOAuthLoading}
                      onClick={() => loginWithSupabaseOAuth()}
                      className="w-full min-h-[42px] bg-white hover:bg-slate-50 text-slate-900 px-3 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] flex items-center justify-center gap-2 text-xs font-black disabled:opacity-60"
                    >
                      {isOAuthLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      )}
                      <span>
                        {isOAuthLoading ? 'Menyiapkan OAuth Supabase...' : 'Masuk Google via Supabase OAuth'}
                      </span>
                    </button>

                    {lastOAuthUrl && (
                      <a
                        href={lastOAuthUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-400 rounded-lg text-[11px] font-bold text-sky-900 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Tab OAuth tidak terbuka otomatis? Klik di sini</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setShowAuthGuideModal(true);
                      }}
                      className="w-full py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 inline-flex items-center justify-center gap-1 underline decoration-dotted underline-offset-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Panduan Setup Login Preview Supabase (Step-by-Step)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-5 p-3.5 bg-emerald-50 border-2 border-emerald-600 rounded-md text-xs text-emerald-900 font-bold flex items-start sm:items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              Keuangan kelas terbuka transparan bagi seluruh anggota. Hak edit hanya aktif untuk akun Bendahara, Sekretaris & Super Admin yang terdaftar di Supabase.
            </span>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-mono italic">
            Doodle Art Paper Edition • Build v{CURRENT_APP_VERSION.version}
          </div>
        </div>
      </div>
    </div>
  );
};
