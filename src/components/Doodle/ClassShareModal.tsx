import React, { useState } from 'react';
import { sfx } from '../../utils/soundEffects.ts';
import { ScotchTape } from './DoodleDecorations.tsx';
import { X, Copy, Check, Share2, Send, ExternalLink, Globe } from 'lucide-react';

interface ClassShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle?: string;
}

export const ClassShareModal: React.FC<ClassShareModalProps> = ({
  isOpen,
  onClose,
  classNameTitle = 'Kelas Gue'
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  // Detect current domain origin or fallback to clean custom domain
  const rawOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://kelasgue.vercel.app';
  const cleanDomainUrl = rawOrigin.includes('localhost') ? rawOrigin : rawOrigin.replace(/\/#$/, '');

  const inviteText = `🎓 *AKSES APLIKASI ${classNameTitle.toUpperCase()}*

Halo semuanya! Silakan buka portal kelas kita untuk mengecek kegiatan, catatan buku kas, checklist iuran, dan transparansi kelas melalui tautan berikut:

🌐 ${cleanDomainUrl}

_Dibuat dengan sistem aplikasi kelas modern Kelas Gue._`;

  const handleCopyLink = () => {
    sfx.playCoinChime();
    navigator.clipboard.writeText(cleanDomainUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyInvite = () => {
    sfx.playClick();
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    sfx.playMoneyIncome();
    const encoded = encodeURIComponent(inviteText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-doodle bg-white max-w-lg w-full rounded-xl p-5 sm:p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <ScotchTape className="absolute -top-3 left-10 rotate-[-1deg]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-100 border-2 border-slate-900 flex items-center justify-center text-sky-800">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Bagikan Link Portal Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Undang siswa & wali kelas ke domain aplikasi resmi.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playCardClose();
              onClose();
            }}
            className="w-8 h-8 btn-doodle bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Card Preview Box (Simulasi Kartu Tampilan WhatsApp / Social Media) */}
        <div className="mb-5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
            <span>Pratinjau Kartu Berbagi WhatsApp & Medsos:</span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">✓ Logo HD Terpasang</span>
          </label>
          
          <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-lg space-y-3">
            <div className="flex gap-3 bg-white p-3 border-2 border-slate-900 rounded-md shadow-[2px_2px_0px_#1E293B]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border-2 border-slate-900 overflow-hidden shrink-0 bg-white p-1">
                <img 
                  src="/whatsapp-preview.jpg" 
                  alt="Preview Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as any).src = '/pwa-512x512.png'; }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1 uppercase">
                  <Globe className="w-3 h-3 text-sky-600" />
                  <span>{cleanDomainUrl.replace(/^https?:\/\//, '')}</span>
                </p>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight mt-0.5">
                  Kelas Gue - Aplikasi Kelas Serbaguna
                </h4>
                <p className="text-[10px] text-slate-600 leading-normal mt-1 line-clamp-2">
                  Aplikasi kelas serbaguna untuk kelola kegiatan, buku kas, checklist iuran, dan catatan kelas dengan gaya doodle art.
                </p>
              </div>
            </div>

            {/* URL Input Box */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={cleanDomainUrl}
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border-2 border-slate-900 rounded-md text-slate-800 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-doodle px-3 py-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-md flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invite Text & Action Buttons */}
        <div className="space-y-3 pt-2 border-t-2 border-dashed border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyInvite}
              className="btn-doodle px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-md flex items-center gap-1.5"
            >
              {copiedInvite ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedInvite ? 'Pesan Tersalin!' : 'Salin Teks Undangan'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="btn-doodle px-4 py-2 bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs sm:text-sm font-black rounded-md flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Kirim ke WhatsApp →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
