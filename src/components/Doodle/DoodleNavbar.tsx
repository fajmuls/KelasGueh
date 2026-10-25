import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { DoodleCrown } from './DoodleDecorations.tsx';
import {
  ShieldCheck,
  User,
  Music,
  Menu,
  X,
  Share2,
  LogOut,
  Info,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PWAInstallButton } from '../PWA/PWAInstallButton.tsx';
import { subscribeCloudSync, getCloudSyncStatus, CloudSyncStatus } from '../../services/supabaseClient.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { showConfirm, showToast } from '../UI/DoodleDialog.tsx';

interface DoodleNavbarProps {
  currentTab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan' | 'auditlog';
  onSelectTab: (tab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan' | 'auditlog') => void;
  classNameTitle: string;
  onOpenShareModal?: () => void;
}

export const DoodleNavbar: React.FC<DoodleNavbarProps> = ({
  currentTab,
  onSelectTab,
  classNameTitle,
  onOpenShareModal
}) => {
  const { user, role, isSuperAdmin, isBendahara, canEditKas, logout, switchRole, loginWithGooglePrompt } = useAuth();
  const [bgmPlaying, setBgmPlaying] = useState(() => sfx.getIsBgmPlaying());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(() => getCloudSyncStatus());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPatchNotesModal, setShowPatchNotesModal] = useState(false);

  // Tab bar scroll visibility (hide on scroll down, show on scroll up)
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tabStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollYRef.current;

          if (currentY <= 20) {
            setIsTabBarVisible(true);
          } else if (diff > 8 && currentY > 60) {
            // Scrolling down
            setIsTabBarVisible(false);
          } else if (diff < -8) {
            // Scrolling up
            setIsTabBarVisible(true);
          }

          lastScrollYRef.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Synchronize BGM state with global SoundEngine
  useEffect(() => {
    const unsub = sfx.subscribeBgm((playing) => {
      setBgmPlaying(playing);
    });
    return unsub;
  }, []);

  // Listen to cloud sync state
  useEffect(() => {
    const unsub = subscribeCloudSync((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  // Auto-scroll active tab into view whenever tab changes
  useEffect(() => {
    if (tabStripRef.current) {
      const activeBtn = tabStripRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${currentTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentTab]);

  const handleToggleBgm = () => {
    sfx.playClick();
    const nextState = sfx.toggleBgm();
    setBgmPlaying(nextState);
    showToast(nextState ? 'Musik latar (BGM) diputar 🎵' : 'Musik latar (BGM) dijeda 🔇', 'info');
  };

  const handleLogoutConfirm = async () => {
    const ok = await showConfirm({
      title: 'Keluar dari Akun?',
      message: 'Apakah Anda yakin ingin keluar dari sesi akun ini?',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
      isDanger: true,
    });
    if (ok) {
      logout();
      setIsMobileMenuOpen(false);
      showToast('Berhasil keluar dari akun.', 'info');
    }
  };

  const navItems = [
    { id: 'ringkasan', label: 'Ringkasan Kas' },
    { id: 'bukukas', label: 'Buku Kas & Nota' },
    { id: 'checklist', label: 'Checklist Iuran' },
    ...(isSuperAdmin ? [{ id: 'auditlog', label: 'Laporan Audit' }] : []),
    ...(canEditKas ? [{ id: 'pengaturan', label: 'Pengaturan' }] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2] border-b-2 border-slate-900 shadow-xs w-full overflow-visible">
      {/* Top Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 relative">
        
        {/* Zone 1: Brand Wordmark with SVG Logo & Cloud Sync */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] overflow-hidden p-1 flex items-center justify-center shrink-0">
            <img 
              src="/logo/Kelas_Gueh_Logo_Static.svg" 
              alt="Logo Kelas Gue" 
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5 truncate">
              <span className="truncate">{classNameTitle || 'Kelas Gue'}</span>
              <span className="hidden lg:inline-block text-[9px] bg-emerald-200 border border-slate-900 px-1 py-0.2 rounded-xs font-bold text-slate-900 shrink-0">
                Transparan
              </span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 leading-none">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold truncate shrink-0">
                Buku Kas Kelas
              </p>
              <span className="text-slate-300 text-[8px]">·</span>
              {syncStatus === 'synced' && (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.5 rounded" title="Cloud Terhubung">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sinkron</span>
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 py-0.5 rounded" title="Menyimpan...">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Menyimpan...</span>
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-1 py-0.5 rounded" title="Offline">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Lokal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playToggle();
                  onSelectTab(item.id as any);
                }}
                className={`px-3 py-1.5 text-xs font-bold border-2 border-slate-900 rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-amber-50 shadow-none'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop-only: PWA Button, BGM Button, Share Button */}
          <div className="hidden md:flex items-center gap-2">
            <PWAInstallButton />

            <button
              onClick={handleToggleBgm}
              aria-pressed={bgmPlaying}
              title={bgmPlaying ? 'Jeda Musik Latar (BGM)' : 'Putar Musik Latar (BGM)'}
              className={`w-9 h-9 btn-doodle rounded-md flex items-center justify-center border-2 border-slate-900 transition-all ${
                bgmPlaying ? 'bg-amber-300 text-slate-950 font-black shadow-[2px_2px_0px_#1E293B]' : 'bg-white text-slate-600 hover:bg-amber-50'
              }`}
            >
              {bgmPlaying ? <Music className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenShareModal && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenShareModal();
                }}
                title="Bagikan Link Portal Kelas"
                className="w-9 h-9 btn-doodle rounded-md bg-amber-200 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 flex items-center justify-center transition-all shadow-[1px_1px_0px_#1E293B]"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Switcher Button (Always accessible, min 44px touch) */}
          <div className="relative">
            <button
              onClick={() => {
                sfx.playClick();
                setShowRoleMenu(!showRoleMenu);
              }}
              className="btn-doodle min-h-[40px] px-2.5 py-1.5 bg-white rounded-md flex items-center gap-1.5 text-xs font-bold text-slate-800 border-2 border-slate-900 shadow-[1px_1px_0px_#1E293B]"
              aria-expanded={showRoleMenu}
              aria-label="Pilih hak akses peran"
            >
              {isSuperAdmin ? (
                <>
                  <DoodleCrown className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="hidden sm:inline font-black">Super Admin</span>
                </>
              ) : isBendahara ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="hidden sm:inline font-black">Bendahara</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="hidden sm:inline font-bold">Anggota</span>
                </>
              )}
              <span className="text-[10px] text-slate-500">▼</span>
            </button>

            {/* Role Switcher Popover */}
            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/30 md:bg-transparent"
                  onClick={() => setShowRoleMenu(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-64 card-doodle p-3.5 rounded-xl z-[100] bg-white shadow-2xl border-2 border-slate-900 animate-in fade-in zoom-in duration-150">
                  <div className="mb-2 border-b border-slate-200 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Akun Aktif
                    </p>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {user?.name || 'Tamu Anggota'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-600 truncate">
                      {user?.email || 'Mode Read-Only'}
                    </p>
                  </div>

                  {isSuperAdmin ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                        Mode Simulasi Role:
                      </p>
                      <button
                        onClick={() => {
                          switchRole('superadmin');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full min-h-[44px] text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                          role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-slate-900 font-black' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>👑 Super Admin (Penuh)</span>
                        {role === 'superadmin' && <span>✓</span>}
                      </button>
                      <button
                        onClick={() => {
                          switchRole('bendahara');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full min-h-[44px] text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                          role === 'bendahara' ? 'bg-emerald-100 text-emerald-900 border border-slate-900 font-black' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>🛡️ Preview Bendahara</span>
                        {role === 'bendahara' && <span>✓</span>}
                      </button>
                      <button
                        onClick={() => {
                          switchRole('anggota');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full min-h-[44px] text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                          role === 'anggota' ? 'bg-sky-100 text-sky-900 border border-slate-900 font-black' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>👀 Preview Anggota</span>
                        {role === 'anggota' && <span>✓</span>}
                      </button>
                    </div>
                  ) : isBendahara ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Hak Akses Aktif:
                      </p>
                      <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs font-bold text-emerald-900 flex items-center justify-between">
                        <span>🛡️ Bendahara Kelas</span>
                        <span className="text-[10px] bg-emerald-300 text-slate-900 px-1.5 py-0.5 rounded font-mono">Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Anda dalam <strong>Mode Anggota (Hanya Lihat)</strong>.
                      </p>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          loginWithGooglePrompt();
                        }}
                        className="w-full btn-doodle px-3 py-2 min-h-[44px] bg-amber-300 hover:bg-amber-400 text-slate-900 font-black text-xs rounded-md text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Masuk Akun Google ↗</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Logout Button */}
          <button
            onClick={handleLogoutConfirm}
            title="Keluar Akun"
            className="hidden md:flex w-9 h-9 btn-doodle bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-slate-900 rounded-md items-center justify-center shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Toggle (Menu "Lainnya") */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="w-9 h-9 btn-doodle bg-amber-300 md:hidden flex items-center justify-center text-slate-900 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#1E293B] shrink-0"
            title="Menu Lainnya"
            aria-label="Buka menu lainnya"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Tab Strip (Main Navigation Bar) */}
      <div
        className={`md:hidden relative border-t-2 border-slate-900 bg-white transition-all duration-200 overflow-hidden ${
          isTabBarVisible ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Subtle Edge Fade cues for scroll hints */}
        <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

        <div
          ref={tabStripRef}
          className="flex overflow-x-auto p-1.5 gap-1.5 no-scrollbar touch-pan-x"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                data-tab-id={item.id}
                onClick={() => {
                  sfx.playToggle();
                  onSelectTab(item.id as any);
                }}
                className={`py-1.5 px-3 min-h-[38px] text-[11px] font-bold rounded border-2 transition-all whitespace-nowrap text-center shrink-0 ${
                  isActive
                    ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[1.5px_1.5px_0px_#1E293B]'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-amber-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile "Lainnya" Drawer Overlay (DOES NOT push page content down) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end md:hidden">
          {/* Backdrop with subtle dimming */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Card */}
          <div className="relative z-10 card-doodle bg-[#FFFDF9] rounded-t-2xl border-t-4 border-slate-900 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Menu Lainnya</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-slate-900"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2">
              {/* BGM Toggle in Hamburger */}
              <button
                onClick={handleToggleBgm}
                aria-pressed={bgmPlaying}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-lg border-2 border-slate-900 font-bold text-xs flex items-center justify-between transition-all ${
                  bgmPlaying
                    ? 'bg-amber-300 text-slate-950 shadow-[2px_2px_0px_#1E293B]'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {bgmPlaying ? <Volume2 className="w-4 h-4 text-slate-900 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <span>Musik Latar Santai (BGM)</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-slate-900 ${bgmPlaying ? 'bg-emerald-300 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                  {bgmPlaying ? 'AKTIF' : 'SENYAP'}
                </span>
              </button>

              {/* Share Portal Button */}
              {onOpenShareModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sfx.playClick();
                    onOpenShareModal();
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-amber-50 font-bold text-xs text-slate-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span>Bagikan Link Portal Kelas</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* PWA Install */}
              <div className="pt-1">
                <PWAInstallButton />
              </div>
            </div>

            {/* Version & Patch Notes Section */}
            <div className="p-3 bg-amber-50/80 border-2 border-slate-900 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Versi Aplikasi</p>
                <p className="text-xs font-mono font-black text-slate-900">
                  v{CURRENT_APP_VERSION.version} ({CURRENT_APP_VERSION.codename})
                </p>
              </div>
              <button
                onClick={() => {
                  sfx.playClick();
                  setShowPatchNotesModal(true);
                }}
                className="btn-doodle px-2.5 py-1.5 bg-white text-slate-900 text-[10px] font-black rounded border border-slate-900"
              >
                Catatan Rilis
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={handleLogoutConfirm}
                className="w-full min-h-[48px] btn-doodle px-4 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-slate-900 font-black text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patch Notes Modal */}
      {showPatchNotesModal && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-doodle bg-white max-w-md w-full rounded-xl p-5 relative border-2 border-slate-900 shadow-[4px_4px_0px_#1E293B] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-black bg-amber-200 border border-slate-900 px-1.5 py-0.5 rounded">
                  v{CURRENT_APP_VERSION.version}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {CURRENT_APP_VERSION.codename}
                </h3>
              </div>
              <button
                onClick={() => setShowPatchNotesModal(false)}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1.5">
                  Perubahan & Peningkatan Terbaru:
                </h4>
                <ul className="space-y-1.5 list-disc list-inside font-medium leading-relaxed">
                  {CURRENT_APP_VERSION.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1.5">
                  Rencana Update Berikutnya (Saran Fitur):
                </h4>
                <div className="space-y-2">
                  {CURRENT_APP_VERSION.suggestedUpdates.map((s, i) => (
                    <div key={i} className="p-2 bg-slate-50 border border-slate-300 rounded">
                      <span className="text-[9px] font-black uppercase px-1 bg-amber-200 border border-slate-800 rounded mr-1.5">
                        {s.category}
                      </span>
                      <strong className="text-slate-900">{s.title}</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowPatchNotesModal(false)}
                className="btn-doodle px-4 py-2 bg-amber-300 text-slate-900 font-black text-xs rounded-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
