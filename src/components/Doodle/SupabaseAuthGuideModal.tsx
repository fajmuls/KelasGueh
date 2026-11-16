import React, { useState } from 'react';
import { getSupabaseCallbackUrl } from '../../services/supabaseClient.ts';
import { copyTextSilently } from '../../utils/whatsapp.ts';
import { showToast } from '../UI/DoodleDialog.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { X, Copy, Check, KeyRound, ShieldCheck, Globe, ExternalLink } from 'lucide-react';

interface SupabaseAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_STUDIO_DEV_URL = 'https://ais-dev-yhych75y7ntw4lhvmzdcyl-10827594519.asia-southeast1.run.app/**';
const AI_STUDIO_PRE_URL = 'https://ais-pre-yhych75y7ntw4lhvmzdcyl-10827594519.asia-southeast1.run.app/**';
const PROD_URL = 'https://kelasgueh.vercel.app/**';

export const SupabaseAuthGuideModal: React.FC<SupabaseAuthGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOriginPattern =
    typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/**`
      : AI_STUDIO_DEV_URL;

  const supabaseCallbackUrl = getSupabaseCallbackUrl();

  const urlEntries = [
    {
      id: 'dev',
      label: 'Preview Dev Google AI Studio',
      value: AI_STUDIO_DEV_URL,
      badge: 'WAJIB PREVIEW'
    },
    {
      id: 'pre',
      label: 'Preview Share Google AI Studio',
      value: AI_STUDIO_PRE_URL,
      badge: 'PREVIEW PUBLISH'
    },
    ...(currentOriginPattern !== AI_STUDIO_DEV_URL && currentOriginPattern !== AI_STUDIO_PRE_URL
      ? [
          {
            id: 'current',
            label: 'Origin Preview Saat Ini',
            value: currentOriginPattern,
            badge: 'AKTIF SEKARANG'
          }
        ]
      : []),
    {
      id: 'prod',
      label: 'Domain Produksi (Vercel)',
      value: PROD_URL,
      badge: 'PRODUKSI'
    },
    {
      id: 'callback',
      label: 'Callback URL Supabase (untuk Google Cloud Console)',
      value: supabaseCallbackUrl,
      badge: 'OAUTH CALLBACK'
    }
  ];

  const handleCopy = async (id: string, value: string, label: string) => {
    sfx.playClick();
    const ok = await copyTextSilently(value);
    if (ok) {
      setCopiedId(id);
      showToast(`${label} berhasil disalin!`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="card-doodle bg-[#FFFDF9] rounded-xl border-3 border-slate-900 shadow-[6px_6px_0px_#000] max-w-2xl w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-300 border-2 border-slate-900 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Panduan Setup Login Preview Supabase
              </h3>
              <p className="text-xs text-slate-600">
                Langkah mendaftarkan URL Preview AI Studio agar OAuth Google Supabase berjalan lancar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white hover:bg-rose-100 flex items-center justify-center text-slate-900 shrink-0"
            aria-label="Tutup panduan"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Highlight Info: Email + PIN works immediately */}
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-700 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black">Jalur Cepat Tanpa Setup Domain: Email + PIN Pengurus</p>
            <p className="leading-snug text-emerald-900">
              Jika belum mendaftarkan URL di dasbor Supabase, Pengurus tetap bisa langsung masuk dari dalam preview ini memakai <strong>Email Terdaftar + PIN Pengurus 6-Digit</strong> (PIN default awal: <code className="font-mono font-black bg-white px-1 rounded border border-emerald-400">123456</code>).
            </p>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-sky-600" />
            <span>Langkah Daftar Domain Preview di Supabase Dashboard</span>
          </h4>

          <ol className="space-y-2.5 text-xs text-slate-800">
            <li className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000]">
              <p className="font-black text-slate-900">1. Buka Pengaturan URL Supabase</p>
              <p className="text-slate-600 mt-0.5 leading-snug">
                Masuk ke <strong>Supabase Dashboard</strong> → pilih proyek Anda → menu <strong>Authentication</strong> → <strong>URL Configuration</strong>.
              </p>
            </li>
            <li className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000]">
              <p className="font-black text-slate-900">2. Tambahkan URL Preview ke "Redirect URLs"</p>
              <p className="text-slate-600 mt-0.5 leading-snug">
                Pada bagian <strong>Redirect URLs</strong>, klik <em>Add URL</em> dan tempel semua URL preview Google AI Studio beserta wildcard <code className="font-mono bg-amber-100 px-1 rounded">/**</code> di bawah ini.
              </p>
            </li>
            <li className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000]">
              <p className="font-black text-slate-900">3. Aktifkan Google Provider & Callback URI</p>
              <p className="text-slate-600 mt-0.5 leading-snug">
                Buka <strong>Authentication → Providers → Google</strong>, aktifkan toggle, lalu pastikan <strong>Callback URL Supabase</strong> di bawah sudah terdaftar pada <em>Authorized redirect URIs</em> di Google Cloud Console Anda.
              </p>
            </li>
            <li className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0px_#000]">
              <p className="font-black text-slate-900">4. Login dari Iframe Preview</p>
              <p className="text-slate-600 mt-0.5 leading-snug">
                Saat tombol <strong>Masuk Google via Supabase</strong> diklik di dalam iframe preview, login Google dibuka di tab baru agar tidak diblokir Google, lalu sesi otomatis aktif saat kembali ke tab ini.
              </p>
            </li>
          </ol>
        </div>

        {/* Copy-Ready URL List */}
        <div className="space-y-2.5">
          <h4 className="font-black text-xs uppercase tracking-wider text-slate-900">
            Daftar URL Siap Salin (Klik Salin)
          </h4>
          <div className="space-y-2">
            {urlEntries.map(entry => (
              <div
                key={entry.id}
                className="p-2.5 bg-amber-50/70 border-2 border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black text-slate-900">{entry.label}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-300 text-slate-950 border border-slate-900 rounded">
                      {entry.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-700 break-all mt-0.5">{entry.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(entry.id, entry.value, entry.label)}
                  className="btn-doodle px-3 py-1.5 bg-white hover:bg-amber-200 text-slate-900 text-xs font-black rounded-lg border-2 border-slate-900 flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  {copiedId === entry.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-slate-200">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-doodle px-3.5 py-2 bg-sky-100 hover:bg-sky-200 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Supabase Dashboard</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="btn-doodle px-5 py-2 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
