import React, { useState } from 'react';
import { Modal } from '../UI/Modal.tsx';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loginWithEmailDirect } = useAuth();
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const [copied, setCopied] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleQuickSuperAdmin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithEmailDirect('mrachmanfm@gmail.com', 'Muhammad Rachman');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await loginWithEmailDirect(customEmail.trim(), customName.trim() || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Domain Belum Diizinkan di Firebase Auth"
      subtitle="Panduan otorisasi domain & opsi masuk langsung"
      maxWidth="xl"
    >
      <div className="p-6 space-y-6 text-slate-700">
        {/* Banner Penjelasan */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold text-amber-900">
              Firebase Error: auth/unauthorized-domain
            </p>
            <p>
              Firebase Authentication pada project{' '}
              <strong className="font-mono text-amber-950">fajmuls-learning</strong> membatasi
              login Google hanya untuk domain yang telah didaftarkan pada whitelist console.
            </p>
          </div>
        </div>

        {/* Info Domain Saat Ini */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-600" />
            Domain Aplikasi Saat Ini
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 truncate select-all">
              {currentHostname}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panduan Otorisasi di Firebase Console */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Langkah Menambahkan Domain ke Firebase:
            </span>
            <a
              href="https://console.firebase.google.com/project/fajmuls-learning/authentication/settings"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <span>Buka Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>
              Buka <strong>Firebase Console &gt; Authentication &gt; Settings</strong> (project{' '}
              <code className="text-slate-800 font-mono">fajmuls-learning</code>).
            </li>
            <li>
              Pilih tab <strong>Authorized domains</strong>.
            </li>
            <li>
              Klik <strong>Add domain</strong> lalu tempel domain di atas:{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                {currentHostname}
              </code>
            </li>
          </ol>
        </div>

        {/* Opsi Bypass Masuk Langsung (Tanpa Menunggu Firebase Console) */}
        <div className="pt-2 border-t border-slate-200 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Opsi Masuk Langsung (Bypass untuk Pengujian)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Anda tetap dapat masuk dan menguji seluruh hak akses sistem secara penuh tanpa
              menunggu penambahan domain di Firebase:
            </p>
          </div>

          <div className="space-y-3">
            {/* Tombol Masuk Super Admin */}
            <button
              onClick={handleQuickSuperAdmin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">Masuk sebagai Super Admin</div>
                  <div className="text-[11px] text-indigo-100">mrachmanfm@gmail.com</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            {/* Form Masuk Akun Lain */}
            <form onSubmit={handleCustomLogin} className="space-y-2 pt-2">
              <div className="text-xs font-medium text-slate-700">
                Atau masukkan email Google Anda:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  required
                  placeholder="nama@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Nama Lengkap (Opsional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !customEmail}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Masuk dengan Email Ini</span>
              </button>
            </form>
          </div>
        </div>

        {/* Tombol Tutup */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
