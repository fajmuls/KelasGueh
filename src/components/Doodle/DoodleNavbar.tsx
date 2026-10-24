import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { DoodleCoin, DoodleCrown } from './DoodleDecorations.tsx';
import {
  Volume2,
  VolumeX,
  LogOut,
  ShieldCheck,
  User,
  Music,
  Sparkles,
  Menu,
  X,
  Share2
} from 'lucide-react';
import { PWAInstallButton } from '../PWA/PWAInstallButton.tsx';
import { subscribeCloudSync, getCloudSyncStatus, CloudSyncStatus } from '../../services/supabaseClient.ts';
import { CURRENT_APP_VERSION } from '../../version.ts';

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

  // Synchronize BGM state with global SoundEngine so button highlights immediately when music starts
  useEffect(() => {
    const unsub = sfx.subscribeBgm((playing) => {
      setBgmPlaying(playing);
    });
    return unsub;
  }, []);

  // Listen to cloud sync state (synced, syncing, offline)
  useEffect(() => {
    const unsub = subscribeCloudSync((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const handleToggleBgm = () => {
    sfx.playClick();
    sfx.toggleBgm();
  };

  const navItems = [
    { id: 'ringkasan', label: 'Ringkasan Kas' },
    { id: 'bukukas', label: 'Buku Kas & Nota' },
    { id: 'checklist', label: 'Checklist Iuran' },
    ...(isSuperAdmin ? [{ id: 'auditlog', label: 'Laporan Audit' }] : []),
    ...(canEditKas ? [{ id: 'pengaturan', label: 'Pengaturan & Versi' }] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2] border-b-2 border-slate-900 shadow-sm w-full overflow-visible">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 relative overflow-visible">
        
        {/* Zone 1: Brand Wordmark with Updated SVG Logo & Cloud Sync Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] overflow-hidden p-1 flex items-center justify-center shrink-0">
            <img 
              src="/logo/Kelas_Gueh_Logo_Static.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-xs sm:text-lg font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5 truncate">
              <span className="truncate">{classNameTitle || 'Kelas Gue'}</span>
              <span className="hidden md:inline-block text-[9px] sm:text-[10px] bg-emerald-200 border border-slate-900 px-1 py-0.2 rounded-xs font-bold text-slate-900 shrink-0">
                Kas Transparan
              </span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[8px] sm:text-[10px] text-slate-600 font-medium truncate">Buku Kas Digital</p>
              <span className="text-slate-300 text-[9px]">·</span>
              {syncStatus === 'synced' && (
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded" title="Cloud Terhubung & Tersinkron">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sinkron</span>
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded" title="Menyimpan ke Cloud...">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Menyimpan...</span>
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-1 py-0.2 rounded" title="Mode Offline / Lokal">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Lokal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs (Desktop view) */}
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

        {/* Zone 3: BGM Audio + Role Badge + Mobile Menu Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* BGM Music Toggle Button */}
          <button
            onClick={handleToggleBgm}
            title={bgmPlaying ? 'Jeda Musik Latar (BGM)' : 'Putar Musik Latar (BGM)'}
            className={`w-7 h-7 sm:w-8 sm:h-8 btn-doodle rounded-md flex items-center justify-center transition-all ${
              bgmPlaying ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 animate-pulse' : 'bg-white text-slate-400'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
          </button>

          {/* Custom Domain Share Button (Bagikan Link Kelas) */}
          {onOpenShareModal && (
            <button
              onClick={() => {
                sfx.playClick();
                onOpenShareModal();
              }}
              title="Bagikan Link Portal Kelas (Custom Domain)"
              className="w-7 h-7 sm:w-8 sm:h-8 btn-doodle rounded-md bg-amber-300 hover:bg-amber-400 text-slate-900 border-2 border-slate-900 flex items-center justify-center transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => {
                sfx.playClick();
                setShowRoleMenu(!showRoleMenu);
              }}
              className="btn-doodle px-2.5 py-1.5 bg-white rounded-md flex items-center gap-1.5 text-xs font-bold text-slate-800"
            >
              {isSuperAdmin ? (
                <>
                  <DoodleCrown className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Super Admin</span>
                </>
              ) : isBendahara ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Bendahara</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline">Anggota</span>
                </>
              )}
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {/* Floating Dropdown Overlay */}
            {showRoleMenu && (
              <>
                {/* Backdrop dismiss overlay */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleMenu(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-64 card-doodle p-3.5 rounded-xl z-[100] bg-white shadow-2xl border-2 border-slate-900 ring-4 ring-black/5 animate-in fade-in zoom-in duration-200">
                  <div className="mb-2 border-b border-slate-200 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Aktivitas Akun
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
                        Mode Simulasi / Preview Role:
                      </p>
                      <button
                        onClick={() => {
                          switchRole('superadmin');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
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
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
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
                        className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                          role === 'anggota' ? 'bg-sky-100 text-sky-900 border border-slate-900 font-black' : 'hover:bg-slate-100'
                        }`}
                      >
                        <span>👀 Preview Anggota</span>
                        {role === 'anggota' && <span>✓</span>}
                      </button>
                    </div>
                  ) : isBendahara ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Hak Akses Aktif:
                      </p>
                      <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs font-bold text-emerald-900 flex items-center justify-between">
                        <span>🛡️ Bendahara Kelas</span>
                        <span className="text-[10px] bg-emerald-300 text-slate-900 px-1.5 py-0.2 rounded font-mono">Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Anda berada dalam <strong>Mode Anggota (Hanya Lihat)</strong>.
                      </p>
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          loginWithGooglePrompt();
                        }}
                        className="w-full btn-doodle px-3 py-2 bg-amber-300 hover:bg-amber-400 text-slate-900 font-black text-xs rounded-md text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Masuk Akun Google ↗</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Keluar"
            className="w-8 h-8 sm:w-9 sm:h-9 btn-doodle bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md flex items-center justify-center shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="w-8 h-8 btn-doodle bg-amber-300 md:hidden flex items-center justify-center text-slate-900 rounded-md shrink-0"
            title="Buka Menu Navigasi"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 stroke-[3]" /> : <Menu className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Responsive Collapsible Mobile Navigation Menu */}
      {isMobileMenuOpen ? (
        <div className="md:hidden border-t-2 border-slate-900 bg-[#FFFDF9] p-3 space-y-2 shadow-lg animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sfx.playToggle();
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-md border-2 border-slate-900 text-center transition-all ${
                    isActive
                      ? 'bg-amber-300 text-slate-900 shadow-[2px_2px_0px_#1E293B] font-black'
                      : 'bg-white text-slate-700 hover:bg-amber-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-bold px-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-slate-400'}`} />
              <span>Status: {syncStatus === 'synced' ? 'Cloud Sinkron' : syncStatus === 'syncing' ? 'Menyimpan...' : 'Lokal'}</span>
            </span>
            <span className="font-mono text-slate-500">v{CURRENT_APP_VERSION.version}</span>
          </div>
        </div>
      ) : (
        /* Single-line mobile tab strip below header for fast tab access */
        <div className="md:hidden flex border-t-2 border-slate-900 bg-white overflow-x-auto p-1.5 gap-1.5 no-scrollbar touch-pan-x">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playToggle();
                  onSelectTab(item.id);
                }}
                className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded border-2 transition-all whitespace-nowrap text-center shrink-0 min-w-[100px] ${
                  isActive
                    ? 'bg-amber-300 border-slate-900 text-slate-900 font-black shadow-[1px_1px_0px_#1E293B]'
                    : 'border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
