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
                Solusi Error 400 Google OAuth Supabase
              </h3>
              <p className="text-xs text-slate-500">
                Penyebab: <code>validation failed unsupported provider</code>
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
          <strong>Mengapa error ini muncul?</strong> Di proyek Supabase Anda, provider Google secara *default* berstatus <em>nonaktif</em> hingga Anda mengaktifkannya dan memasukkan <strong>Client ID & Client Secret</strong> dari Google Cloud Console.
        </div>

        {/* Step by step guide */}
        <div className="space-y-3 text-xs text-slate-800">
          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">1</span>
              <div>
                <strong className="text-slate-900">Buka Dashboard Supabase</strong>
                <p className="text-slate-600 mt-0.5">
                  Masuk ke menu <code className="bg-white px-1 border border-slate-300 rounded">Authentication</code> → <code className="bg-white px-1 border border-slate-300 rounded">Providers</code> → Cari <code className="bg-white px-1 border border-slate-300 rounded">Google</code>.
                </p>
                <a
                  href="https://supabase.com/dashboard/project/ireqpxgmlrsmcgidfthg/auth/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-700 font-bold hover:underline mt-1"
                >
                  <span>Buka Supabase Providers Project Anda</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">2</span>
              <div className="w-full">
                <strong className="text-slate-900">Aktifkan Toggle "Enable Google provider"</strong>
                <p className="text-slate-600 mt-0.5">
                  Centang opsi <strong>Enable Google provider</strong>. Anda akan melihat <em>Callback URL</em> berikut:
                </p>
                <div className="mt-1.5 flex items-center gap-2 bg-white border-2 border-slate-900 rounded px-2.5 py-1.5 font-mono text-[11px]">
                  <span className="truncate flex-1 text-slate-800">{callbackUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-doodle px-2 py-0.5 bg-amber-200 text-slate-900 text-[10px] font-bold rounded flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">3</span>
              <div>
                <strong className="text-slate-900">Daftarkan Callback URL di Google Cloud Console</strong>
                <p className="text-slate-600 mt-0.5">
                  Buka Google Cloud Console → <strong>APIs & Services</strong> → <strong>Credentials</strong> → Edit OAuth 2.0 Client ID Anda → Pada bagian <strong>"Authorized redirect URIs"</strong>, tempelkan Callback URL di atas.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-800 rounded-md">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-300 border border-slate-900 flex items-center justify-center font-bold shrink-0">4</span>
              <div>
                <strong className="text-slate-900">Masukkan Client ID & Client Secret ke Supabase</strong>
                <p className="text-slate-600 mt-0.5">
                  Salin <strong>Client ID</strong> dan <strong>Client Secret</strong> dari Google Cloud, lalu masukkan ke form Google Provider di Supabase dan klik <strong>Save</strong>.
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
