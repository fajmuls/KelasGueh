import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme, ThemeType } from '../../context/ThemeContext.tsx';
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
  ExternalLink,
  Settings,
  Sun,
  Moon,
  BookOpen
} from 'lucide-react';
import { PWAInstallButton } from '../PWA/PWAInstallButton.tsx';
import { subscribeCloudSync, getCloudSyncStatus, CloudSyncStatus } from '../../services/supabaseClient.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';
import { showConfirm, showToast } from '../UI/DoodleDialog.tsx';

export type AppNavTab =
  | 'beranda'
  | 'ringkasan'
  | 'bukukas'
  | 'checklist'
  | 'kolektif'
  | 'rekap'
  | 'pengaturan'
  | 'auditlog'
  | 'keaktifan'
  | 'presensi'
  | 'notulensi'
  | 'admin_settings';

export type AppDomain = 'hub' | 'bendahara' | 'sekretaris' | 'admin';

interface DoodleNavbarProps {
  currentTab: AppNavTab;
  activeDomain: AppDomain;
  onSelectTab: (tab: AppNavTab) => void;
  onSelectDomain: (domain: AppDomain, defaultTab?: AppNavTab) => void;
  classNameTitle: string;
  onOpenShareModal?: () => void;
  onOpenWalkthrough?: () => void;
  onOpenAdminSettings?: () => void;
}

export const DoodleNavbar: React.FC<DoodleNavbarProps> = ({
  currentTab,
  activeDomain,
  onSelectTab,
  onSelectDomain,
  classNameTitle,
  onOpenShareModal,
  onOpenWalkthrough,
  onOpenAdminSettings
}) => {
  const { user, role, isSuperAdmin, isRealSuperAdmin, isBendahara, canEditKas, logout, switchRole, loginWithGooglePrompt } = useAuth();
  const { theme, setTheme } = useTheme();
  const [bgmPlaying, setBgmPlaying] = useState(() => sfx.getIsBgmPlaying());
  const [sfxEnabled, setSfxEnabled] = useState(() => sfx.isEnabled());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(() => getCloudSyncStatus());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPatchNotesModal, setShowPatchNotesModal] = useState(false);





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



  const handleToggleBgm = () => {
    sfx.playClick();
    const nextState = sfx.toggleBgm();
    setBgmPlaying(nextState);
    showToast(nextState ? 'Musik latar (BGM) diputar 🎵' : 'Musik latar (BGM) dijeda 🔇', 'info');
  };

  const handleToggleSfx = () => {
    const nextState = sfx.toggle();
    setSfxEnabled(nextState);
    showToast(nextState ? 'Efek suara (SFX) AKTIF 🔔' : 'Efek suara (SFX) SENYAP 🔇', 'info');
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



  const themes: { id: ThemeType; label: string; icon: any; color: string }[] = [
    { id: 'light', label: 'Terang', icon: Sun, color: 'bg-white' },
    { id: 'sepia', label: 'Sepia', icon: BookOpen, color: 'bg-[#F4ECD8]' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-900 shadow-xs w-full overflow-visible theme-bg-navbar">
      {/* Top Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 relative">
        
        {/* Zone 1: Brand Wordmark with SVG Logo & Cloud Sync */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div
            onClick={() => onSelectDomain('hub', 'beranda')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] overflow-hidden p-1 flex items-center justify-center shrink-0 cursor-pointer hover:rotate-3 transition-transform"
            title="Ke Beranda Hub"
          >
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
                {activeDomain === 'sekretaris' ? 'Sekretariat' : 'Bendahara'}
              </span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 leading-none">
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-semibold truncate shrink-0 theme-text-muted">
                {activeDomain === 'sekretaris' ? 'Sekretariat & Presensi' : 'Buku Kas Kelas'}
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

          {/* Quick Hub and Domain Switcher */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={() => {
                sfx.playClick();
                onSelectDomain('hub', 'beranda');
              }}
              className={`btn-doodle px-2 py-1 text-[10px] sm:text-xs font-black rounded-md border-2 border-slate-900 transition-all ${
                activeDomain === 'hub'
                  ? 'bg-amber-300 text-slate-900 shadow-[1px_1px_0px_#000]'
                  : 'bg-white text-slate-700 hover:bg-amber-50'
              }`}
              title="Kembali ke Beranda Pilihan Modul"
            >
              <span>🏠 Hub</span>
            </button>

            <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border-2 border-slate-900">
              <button
                onClick={() => {
                  sfx.playClick();
                  onSelectDomain('bendahara', 'ringkasan');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  activeDomain === 'bendahara'
                    ? 'bg-amber-300 text-slate-900 font-black shadow-[1px_1px_0px_#000]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bendahara
              </button>
              <button
                onClick={() => {
                  sfx.playClick();
                  onSelectDomain('sekretaris', 'keaktifan');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  activeDomain === 'sekretaris'
                    ? 'bg-sky-200 text-slate-900 font-black shadow-[1px_1px_0px_#000]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sekretaris
              </button>
            </div>
          </div>
        </div>

        {/* Zone 2: Actions & Controls */}
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

          {/* Role Switcher Button & Profile Popover (Always accessible) */}
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

            {/* Role Switcher & Profile Popover */}
            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/30 md:bg-transparent"
                  onClick={() => setShowRoleMenu(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-64 card-doodle p-3.5 rounded-xl z-[100] bg-white shadow-2xl border-2 border-slate-900 animate-in fade-in zoom-in duration-150">
                  <div className="mb-2 border-b border-slate-200 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Akun Terhubung
                    </p>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {user?.name || 'M Rachman Fajri M'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-600 truncate">
                      {user?.email || 'mrachmanfm@gmail.com'}
                    </p>
                  </div>

                  {isRealSuperAdmin && (
                    <div className="space-y-1 mb-2.5 border-b border-slate-200 pb-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                        Mode Simulasi Akses:
                      </p>
                      <button
                        onClick={() => {
                          switchRole('superadmin');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full min-h-[36px] text-left px-2 py-1 text-xs font-bold rounded flex items-center justify-between ${
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
                        className={`w-full min-h-[36px] text-left px-2 py-1 text-xs font-bold rounded flex items-center justify-between ${
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
                        className={`w-full min-h-[36px] text-left px-2 py-1 text-xs font-bold rounded flex items-center justify-between ${
                          role === 'anggota' ? 'bg-sky-100 text-sky-900 border border-slate-900 font-black' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>👀 Preview Anggota</span>
                        {role === 'anggota' && <span>✓</span>}
                      </button>
                    </div>
                  )}

                  {/* Single location for Logout (Keluar dari Akun) */}
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      handleLogoutConfirm();
                    }}
                    className="w-full btn-doodle px-3 py-2 min-h-[40px] bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-xs rounded-md flex items-center justify-center gap-1.5 border border-slate-900"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Hamburger Toggle (Menu "Lainnya" & "Pengaturan" for all screen sizes) */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="w-9 h-9 btn-doodle bg-amber-300 flex items-center justify-center text-slate-900 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_#1E293B] shrink-0"
            title="Menu Lainnya & Pengaturan"
            aria-label="Buka menu lainnya"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>

      {/* "Lainnya" Drawer Overlay (Available for mobile & desktop menu trigger) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end md:justify-center items-center">
          {/* Backdrop with subtle dimming */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Card */}
          <div className="relative z-10 card-doodle bg-[#FFFDF9] rounded-t-xl md:rounded-xl border-t-4 md:border-4 border-slate-900 shadow-2xl p-5 space-y-4 max-h-[85vh] w-full max-w-md overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Menu Lainnya & Pengaturan</h3>
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
            <div className="space-y-4">
              {/* Theme Switcher Section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-1">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Tema Visual (Kenyamanan Mata)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        sfx.playToggle();
                        setTheme(t.id);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                        theme === t.id
                          ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#1E293B] -translate-y-0.5'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <t.icon className={`w-5 h-5 ${theme === t.id ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modul & Ranah Switcher Section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-1">
                  <span>Pilihan Ranah & Portal Kelas</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      sfx.playClick();
                      onSelectDomain('hub', 'beranda');
                    }}
                    className={`p-2.5 rounded-lg border-2 text-center text-xs font-bold transition-all ${
                      activeDomain === 'hub'
                        ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_#000]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🏠 Beranda Hub
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      sfx.playClick();
                      onSelectDomain('bendahara', 'ringkasan');
                    }}
                    className={`p-2.5 rounded-lg border-2 text-center text-xs font-bold transition-all ${
                      activeDomain === 'bendahara'
                        ? 'bg-amber-300 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_#000]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    💰 Bendahara
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      sfx.playClick();
                      onSelectDomain('sekretaris', 'keaktifan');
                    }}
                    className={`p-2.5 rounded-lg border-2 text-center text-xs font-bold transition-all ${
                      activeDomain === 'sekretaris'
                        ? 'bg-sky-200 border-slate-900 text-slate-900 shadow-[1.5px_1.5px_0px_#000]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📝 Sekretaris
                  </button>
                </div>
              </div>

              {/* Ulangi Tur Panduan Button */}
              {onOpenWalkthrough && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sfx.playClick();
                    onOpenWalkthrough();
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border-2 border-slate-900 bg-sky-100 hover:bg-sky-200 font-bold text-xs text-slate-900 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <span>Ulangi Tur Panduan App</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border border-slate-900 bg-sky-200 text-sky-900">
                    PANDUAN
                  </span>
                </button>
              )}

              {/* Pengaturan Button ONLY for Bendahara & Super Admin (canEditKas) */}
              {canEditKas && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sfx.playToggle();
                    onSelectTab('pengaturan');
                  }}
                  className={`w-full min-h-[48px] px-4 py-2.5 rounded-lg border-2 border-slate-900 font-bold text-xs flex items-center justify-between transition-all ${
                    currentTab === 'pengaturan'
                      ? 'bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#1E293B]'
                      : 'bg-white text-slate-800 hover:bg-amber-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Iuran & Semester</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border border-slate-900 bg-indigo-100 text-indigo-900">
                    KAS
                  </span>
                </button>
              )}

              {/* Pengaturan Admin Button (For SuperAdmin / Admin) */}
              {(isSuperAdmin || isRealSuperAdmin) && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    sfx.playCardOpen();
                    onSelectDomain('admin', 'admin_settings');
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border-2 border-slate-900 bg-amber-400 hover:bg-amber-500 font-black text-xs text-slate-900 flex items-center justify-between transition-all shadow-[2px_2px_0px_#000]"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-900" />
                    <span>Pengaturan Master Admin</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border border-slate-900 bg-slate-900 text-amber-300">
                    ADMIN
                  </span>
                </button>
              )}

              {/* Audio Controls Grid: BGM (Left) & SFX (Right) */}
              <div className="grid grid-cols-2 gap-2">
                {/* BGM Toggle */}
                <button
                  onClick={handleToggleBgm}
                  aria-pressed={bgmPlaying}
                  className={`min-h-[48px] px-3 py-2 rounded-lg border-2 border-slate-900 font-bold text-xs flex items-center justify-between transition-all ${
                    bgmPlaying
                      ? 'bg-amber-300 text-slate-950 shadow-[2px_2px_0px_#1E293B]'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title={bgmPlaying ? 'Jeda Musik Latar (BGM)' : 'Putar Musik Latar (BGM)'}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {bgmPlaying ? <Volume2 className="w-4 h-4 text-slate-900 animate-pulse shrink-0" /> : <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="truncate">Musik Latar</span>
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-900 shrink-0 ${bgmPlaying ? 'bg-emerald-300 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                    {bgmPlaying ? 'AKTIF' : 'MUTE'}
                  </span>
                </button>

                {/* SFX Toggle */}
                <button
                  onClick={handleToggleSfx}
                  aria-pressed={sfxEnabled}
                  className={`min-h-[48px] px-3 py-2 rounded-lg border-2 border-slate-900 font-bold text-xs flex items-center justify-between transition-all ${
                    sfxEnabled
                      ? 'bg-emerald-300 text-slate-950 shadow-[2px_2px_0px_#1E293B]'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title={sfxEnabled ? 'Matikan Efek Suara (SFX)' : 'Aktifkan Efek Suara (SFX)'}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {sfxEnabled ? <Volume2 className="w-4 h-4 text-slate-900 shrink-0" /> : <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="truncate">Efek Suara</span>
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-900 shrink-0 ${sfxEnabled ? 'bg-amber-300 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                    {sfxEnabled ? 'AKTIF' : 'MUTE'}
                  </span>
                </button>
              </div>

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

            {/* Version & Patch Notes Section with Minimal Font text-[9px] */}
            <div className="p-3 bg-amber-50/80 border-2 border-slate-900 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Versi Aplikasi</p>
                <p className="text-[9px] font-mono font-bold text-slate-800">
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
