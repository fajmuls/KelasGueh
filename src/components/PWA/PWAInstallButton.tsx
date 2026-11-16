import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, X, Monitor, ExternalLink, Laptop } from 'lucide-react';
import { sfx } from '../../utils/soundEffects';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop native prompt flow
  if (isInstallable) {
    return (
      <button
        type="button"
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
          type="button"
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
                type="button"
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
                type="button"
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

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const standaloneUrl = typeof window !== 'undefined' ? window.location.href : '/';

  // Desktop / Preview Iframe Fallback
  return (
    <>
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setShowDesktopGuide(true);
        }}
        className="btn-doodle w-full md:w-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 min-h-[36px] text-xs font-black text-slate-900 border-2 border-slate-900 transition"
        title="Pasang sebagai Aplikasi Desktop (Windows / Mac / PWABuilder)"
      >
        <Monitor className="w-3.5 h-3.5 text-indigo-800 shrink-0" />
        <span>Pasang App Desktop</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md card-doodle rounded-xl bg-white p-5 sm:p-6 shadow-2xl border-2 border-slate-900 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-900"
              aria-label="Tutup panduan pasang desktop"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-200 border-2 border-slate-900 flex items-center justify-center shrink-0">
                <Laptop className="w-5 h-5 text-indigo-900" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Pasang Kelas Gue di Desktop / Windows
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold">
                  Jadikan aplikasi standalone tanpa tab browser & siap dikemas PWABuilder (.exe)
                </p>
              </div>
            </div>

            {isInIframe && (
              <div className="p-3 bg-amber-100 border-2 border-slate-900 rounded-xl space-y-2 text-xs text-slate-900">
                <p className="font-black">
                  Aplikasi sedang berjalan di dalam Preview Iframe:
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Browser memblokir dialog instalasi PWA otomatis saat dibuka di dalam iframe. Buka di tab penuh terlebih dahulu agar tombol <strong>Install</strong> muncul langsung!
                </p>
                <a
                  href={standaloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sfx.playClick()}
                  className="btn-doodle w-full py-2 px-3 bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Tab Penuh Sekarang</span>
                </a>
              </div>
            )}

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                <p>
                  Buka portal Kelas Gue di tab penuh <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                <p>
                  Klik ikon <strong>Install App</strong> (komputer dengan panah) di ujung kanan address bar, atau klik kembali tombol <strong>Pasang Aplikasi</strong> pada navbar.
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                <p>
                  Untuk file <strong>.exe Windows</strong>, masukkan URL portal terpublikasi ke <strong>PWABuilder.com</strong> lalu unduh paket Windows Installer (MSIX/EXE).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="btn-doodle w-full py-2.5 bg-slate-900 text-white font-black text-xs rounded-lg"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </>
  );
};

