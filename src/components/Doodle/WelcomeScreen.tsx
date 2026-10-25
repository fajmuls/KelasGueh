import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, PushPin, DoodleCoin } from './DoodleDecorations.tsx';
import { ShieldCheck } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../../version.ts';

export const WelcomeScreen: React.FC = () => {
  const { loginAs, loginWithGooglePrompt } = useAuth();

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

            {/* Google OAuth Login Button (Primary for Admin & Bendahara) */}
            <button
              onClick={() => {
                sfx.playClick();
                loginWithGooglePrompt();
              }}
              className="w-full btn-doodle bg-amber-100 hover:bg-amber-200/80 p-4 rounded-md flex items-center justify-between text-left group border-2 border-slate-900 shadow-[3px_3px_0px_#1E293B]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 group-hover:text-indigo-900 transition-colors">
                      Masuk dengan Akun Google
                    </span>
                    <span className="text-[10px] bg-emerald-300 border border-slate-800 px-1.5 py-0.2 rounded-xs font-bold text-slate-900">
                      Wajib Admin & Bendahara
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Login Google resmi untuk verifikasi identitas dan pengelolaan kas.
                  </p>
                </div>
              </div>
              <span className="text-slate-900 group-hover:translate-x-1 transition-transform font-black">→</span>
            </button>

            {/* Anggota Role (Read Only - Guest) */}
            <button
              onClick={() => {
                sfx.playClick();
                loginAs('anggota');
              }}
              className="w-full btn-doodle bg-sky-50 hover:bg-sky-100/70 p-4 rounded-md flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-200 border-2 border-slate-800 flex items-center justify-center shrink-0">
                  <DoodleCoin className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Masuk sebagai Anggota Kelas</span>
                    <span className="text-[10px] bg-slate-200 border border-slate-800 px-1.5 py-0.2 rounded-xs font-bold text-slate-900">
                      Hanya Lihat (Read-Only)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Melihat transparansi saldo kas, kwitansi nota, & status bayar.
                  </p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-1 transition-transform font-bold">→</span>
            </button>
          </div>

          {/* Whitelist Info */}
          <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-600 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Sistem Whitelist Aktif: Pastikan email Google Anda telah didaftarkan oleh Super Admin untuk mendapatkan hak akses pengelolaan.</span>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-mono italic">
            Doodle Art Paper Edition • Build v{CURRENT_APP_VERSION.version}
          </div>
        </div>
      </div>
    </div>
  );
};
