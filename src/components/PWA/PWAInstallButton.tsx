import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, X, Check } from 'lucide-react';
import { sfx } from '../../utils/soundEffects';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={() => {
          sfx.playClick();
          install();
        }}
        className="btn-doodle flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Pasang Aplikasi</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            sfx.playClick();
            setShowIOSGuide(true);
          }}
          className="btn-doodle flex items-center gap-2 rounded-lg bg-indigo-50 border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
        >
          <Share className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pasang di iOS</span>
          <span className="sm:hidden">Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm card-doodle rounded-xl bg-white p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-black text-slate-900 pr-6">Pasang Kelas Gue di iPhone / iPad</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-sm text-slate-700">
                    Tap tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bilah bawah Safari.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-sm text-slate-700">
                    Gulir ke bawah dan pilih menu <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <p className="text-sm text-slate-700">
                    Tap <strong>Add</strong> di pojok kanan atas untuk menyelesaikan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="btn-doodle mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-black text-white hover:bg-slate-800"
              >
                Siap, Saya Mengerti!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
