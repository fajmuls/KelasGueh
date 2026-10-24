import React, { useState } from 'react';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape, DoodleCrown } from './DoodleDecorations.tsx';
import { X, Copy, Check, ExternalLink, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface GoogleAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthGuideModal: React.FC<GoogleAuthGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loginAs } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const callbackUrl = 'https://ireqpxgmlrsmcgidfthg.supabase.co/auth/v1/callback';

  const handleCopy = () => {
    sfx.playClick();
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-doodle bg-white max-w-2xl w-full rounded-xl p-6 sm:p-8 relative my-8">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-2deg]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-rose-100 border-2 border-slate-900 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Solusi Error 400 / 403 Google Login
              </h3>
              <p className="text-xs text-slate-500">
                Penyebab: <code>unsupported provider</code> atau <code>403 access_denied</code>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-8 h-8 btn-doodle bg-slate-100 rounded-md flex items-center justify-center text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanation Card */}
        <div className="p-3 bg-amber-50 border-2 border-slate-900 rounded-md mb-4 text-xs text-slate-700 leading-relaxed">
          <strong>Mengapa error 403 muncul?</strong> Biasanya karena domain website ini (AI Studio Preview) belum didaftarkan di <strong>Google Cloud Console</strong> &gt; APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs.
        </div>

        {/* Step by step guide */}
        <div className="space-y-3 text-xs text-slate-800">
          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">1</span>
              <div>
                <strong className="text-slate-900">Konfigurasi Authorized Redirect URIs</strong>
                <p className="text-slate-600 mt-0.5">
                  Buka <strong>Google Cloud Console</strong>. Pilih project Anda, masuk ke <strong>APIs & Services</strong> &gt; <strong>Credentials</strong>. Edit OAuth 2.0 Client ID.
                </p>
                <p className="text-slate-600 mt-1 font-bold">Tambahkan Callback URL ini ke Authorized redirect URIs:</p>
                <div className="mt-1 flex items-center gap-2 bg-white border-2 border-slate-900 rounded px-2.5 py-1.5 font-mono text-[10px]">
                  <span className="truncate flex-1">{callbackUrl}</span>
                  <button onClick={handleCopy} className="btn-doodle px-2 py-0.5 bg-amber-100 rounded text-[9px] font-bold">Copy</button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">2</span>
              <div>
                <strong className="text-slate-900">Tambahkan Authorized JavaScript Origins</strong>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  Pada halaman yang sama di Google Cloud, cari bagian <strong>"Authorized JavaScript origins"</strong>. Tambahkan URL website ini:
                </p>
                <code className="block mt-1 bg-white p-1 border-2 border-slate-900 rounded font-mono text-[9px] truncate">
                  {window.location.origin}
                </code>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">3</span>
              <div className="w-full">
                <strong className="text-slate-900">Aktifkan Google Provider di Supabase</strong>
                <p className="text-slate-600 mt-0.5">
                  Masuk ke Dashboard Supabase → Authentication → Providers → Google. Pastikan sudah <strong>Enabled</strong> dan Client ID/Secret sudah benar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instant bypass / Quick Login button */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Ingin langsung mencoba fitur aplikasi sekarang?
          </p>

          <button
            onClick={() => {
              sfx.playCoinChime();
              loginAs('superadmin');
              onClose();
            }}
            className="btn-doodle px-4 py-2 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black rounded-md text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <DoodleCrown className="w-4 h-4" />
            <span>Masuk Langsung Sebagai Super Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
