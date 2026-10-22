import React from 'react';
import { Sparkles, GraduationCap, Plus, Database, AlertCircle } from 'lucide-react';

interface NoClassBannerProps {
  onOpenSetup: () => void;
  hasClasses: boolean;
}

export const NoClassBanner: React.FC<NoClassBannerProps> = ({ onOpenSetup, hasClasses }) => {
  if (hasClasses) return null;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg border border-indigo-700/50 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <GraduationCap className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
                Super Admin Notice
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                <Database className="w-3 h-3" />
                Cloud Firestore Terhubung
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Belum Ada Kelas yang Terdeteksi di Cloud Firestore
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-2xl mt-0.5 leading-relaxed">
              Sebagai Super Admin, silakan siapkan kelas Anda terlebih dahulu (Nama Kelas, Kode, Jurusan, dan Fakultas). Data kelas akan langsung tersimpan di Cloud Firestore sehingga otomatis sinkron antara Google AI Studio Preview dan aplikasi web di Vercel.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSetup}
          className="px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 active:bg-indigo-100 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 group"
        >
          <Plus className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          Siapkan Kelas Sekarang
        </button>
      </div>
    </div>
  );
};
