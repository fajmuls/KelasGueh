import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin, DoodleCoin } from './DoodleDecorations.tsx';
import { ShieldCheck, RefreshCw, Mail } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../../version.ts';

export const WelcomeScreen: React.FC = () => {
  const { loginAs, loginWithGooglePrompt, loginWithEmailFallback, isGooglePopupLoading } = useAuth();

  return (
    <div className="min-h-screen bg-paper-grid flex items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
      <div className="max-w-xl w-full relative">
        {/* Top Push Pin */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <PushPin className="w-8 h-8 text-rose-500 drop-shadow-md" />
        </div>

        {/* Paper card container */}
        <div className="card-doodle p-6 sm:p-10 relative bg-[#FFFDF9] rounded-lg">
          {/* Scotch tape in top-right corner */}
          <ScotchTape className="absolute -top-3 -right-4 rotate-12" />
          <ScotchTape className="absolute -bottom-3 -left-4 -rotate-6" />

          {/* Title Header */}
          <div className="text-center mb-8 border-b-2 border-dashed border-slate-300 pb-6">
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
              Buku kas digital kelas dengan bukti nota transparan, iuran mingguan, dan laporan keuangan tanpa kecurigaan.
            </p>
          </div>

          {/* Role Choice Cards */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
              Pilih Akses Masuk Aplikasi
            </p>

            {/* Official Google Sign-In Popup Button */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isGooglePopupLoading}
                onClick={() => {
                  sfx.playClick();
                  loginWithGooglePrompt();
                }}
                className="w-full min-h-[52px] bg-white hover:bg-slate-50 text-[#1F1F1F] p-3.5 sm:p-4 rounded-md flex items-center justify-between text-left group border-2 border-slate-900 shadow-[3px_3px_0px_#1E293B] active:translate-y-0.5 transition disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0">
                    {isGooglePopupLoading ? (
                      <RefreshCw className="w-5 h-5 text-slate-700 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-[#1F1F1F] group-hover:text-indigo-900 transition-colors text-sm sm:text-base leading-tight block">
                      {isGooglePopupLoading ? 'Membuka Popup Google...' : 'Masuk dengan Google (Sign in with Google)'}
                    </span>
                    <div className="mt-1 mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block text-[9px] sm:text-[10px] bg-emerald-300 border border-slate-800 px-1.5 py-0.5 rounded-xs font-bold text-slate-900">
                        Popup Resmi & Spreadsheet Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Bekerja langsung di preview Google AI Studio untuk verifikasi akun & sinkronisasi Spreadsheet.
                    </p>
                  </div>
                </div>
                <span className="text-slate-900 group-hover:translate-x-1 transition-transform font-black shrink-0 ml-2">→</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => loginWithEmailFallback()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 underline decoration-dotted underline-offset-2 py-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Popup terblokir? Masuk dengan verifikasi email manual</span>
                </button>
              </div>
            </div>

            {/* Anggota Role (Read Only - Guest) */}
            <button
              onClick={() => {
                sfx.playClick();
                loginAs('anggota');
              }}
              className="w-full min-h-[48px] btn-doodle bg-sky-50 hover:bg-sky-100/70 p-3.5 sm:p-4 rounded-md flex items-center justify-between text-left group border-2 border-slate-900"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-sky-200 border-2 border-slate-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <DoodleCoin className="w-5 h-5 text-slate-900" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight block">
                    Masuk sebagai Anggota Kelas
                  </span>
                  <div className="mt-1 mb-1">
                    <span className="inline-block text-[9px] sm:text-[10px] bg-slate-200 border border-slate-800 px-1.5 py-0.5 rounded-xs font-bold text-slate-900">
                      Hanya Lihat (Read-Only)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    Melihat transparansi saldo kas, kwitansi nota, & status bayar.
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform font-bold shrink-0 ml-2">→</span>
            </button>
          </div>

          {/* Whitelist Info - Fully scrollable and accessible on all viewport heights */}
          <div className="mt-5 p-3.5 bg-emerald-50 border-2 border-emerald-600 rounded-md text-xs text-emerald-900 font-bold flex items-start sm:items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">Sistem Whitelist Aktif: Pastikan email Google Anda telah didaftarkan oleh Super Admin untuk mendapatkan hak akses pengelolaan kas.</span>
          </div>

          {/* Footer note */}
          <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-mono italic">
            Doodle Art Paper Edition • Build v{CURRENT_APP_VERSION.version}
          </div>
        </div>
      </div>
    </div>
  );
};
