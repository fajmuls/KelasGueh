import React, { useState } from 'react';
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
  X
} from 'lucide-react';

interface DoodleNavbarProps {
  currentTab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan';
  onSelectTab: (tab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan') => void;
  classNameTitle: string;
  onReplayIntro?: () => void;
}

export const DoodleNavbar: React.FC<DoodleNavbarProps> = ({
  currentTab,
  onSelectTab,
  classNameTitle,
  onReplayIntro
}) => {
  const { user, role, isSuperAdmin, isBendahara, logout, switchRole } = useAuth();
  const [soundOn, setSoundOn] = useState(() => sfx.isEnabled());
  const [bgmPlaying, setBgmPlaying] = useState(() => sfx.getIsBgmPlaying());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleSound = () => {
    const next = sfx.toggle();
    setSoundOn(next);
  };

  const handleToggleBgm = () => {
    sfx.playClick();
    const next = sfx.toggleBgm();
    setBgmPlaying(next);
  };

  const navItems = [
    { id: 'ringkasan', label: 'Ringkasan Kas' },
    { id: 'bukukas', label: 'Buku Kas & Nota' },
    { id: 'checklist', label: 'Checklist Iuran' },
    { id: 'pengaturan', label: 'Pengaturan & Versi' },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b-2 border-slate-900 shadow-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Zone 1: Brand Wordmark with Updated SVG Logo */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] overflow-hidden p-0.5 flex items-center justify-center shrink-0">
            <img
              src="/logo/Kelas_Gueh_Logo_Static.svg"
              alt="Logo Kelas Gue"
              onError={(e) => {
                // Fallback SVG if static image missing
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5 truncate">
              <span className="truncate">{classNameTitle || 'Kelas Gue'}</span>
              <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-emerald-200 border border-slate-900 px-1.5 py-0.2 rounded-xs font-bold text-slate-900 shrink-0">
                Kas Transparan
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium truncate">Buku Catatan Keuangan Kelas</p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs (Desktop view) */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playToggle();
                  onSelectTab(item.id);
                }}
                className={`px-3.5 py-2 text-xs sm:text-sm font-bold border-2 border-slate-900 rounded-md transition-all whitespace-nowrap shrink-0 ${
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

        {/* Zone 3: Audio Toggle + Role Badge + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* BGM Music Toggle Button */}
          <button
            onClick={handleToggleBgm}
            title={bgmPlaying ? 'Jeda Musik Latar (BGM)' : 'Putar Musik Latar (BGM)'}
            className={`w-8 h-8 sm:w-9 sm:h-9 btn-doodle rounded-md flex items-center justify-center transition-all ${
              bgmPlaying ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 animate-pulse' : 'bg-white text-slate-400'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Sound SFX Toggle Button */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Matikan Suara SFX' : 'Nyalakan Suara SFX'}
            className="w-8 h-8 sm:w-9 sm:h-9 btn-doodle bg-white rounded-md flex items-center justify-center text-slate-800 hidden sm:flex"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Replay Animated Intro Button */}
          {onReplayIntro && (
            <button
              onClick={() => {
                sfx.playClick();
                onReplayIntro();
              }}
              title="Putar Ulang Animasi Intro Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 btn-doodle bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md flex items-center justify-center transition-all hidden sm:flex"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Role Status Pill & Dropdown */}
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
                  <DoodleCrown className="w-4 h-4" />
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

            {/* Quick Role Switcher Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 card-doodle p-3 rounded-lg z-50 bg-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                  Ganti Role Akses (Testing)
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      switchRole('superadmin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                      role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-slate-900' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>Super Admin (Penuh)</span>
                    {role === 'superadmin' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('bendahara');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                      role === 'bendahara' ? 'bg-emerald-100 text-emerald-900 border border-slate-900' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>Bendahara (Buku Kas)</span>
                    {role === 'bendahara' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('anggota');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded flex items-center justify-between ${
                      role === 'anggota' ? 'bg-sky-100 text-sky-900 border border-slate-900' : 'hover:bg-slate-100'
                    }`}
                  >
                    <span>Anggota (Hanya Lihat)</span>
                    {role === 'anggota' && <span>✓</span>}
                  </button>
                </div>
              </div>
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

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold px-1">
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-1.5 py-1 px-2 bg-white rounded border border-slate-300"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>SFX: {soundOn ? 'Aktif' : 'Mati'}</span>
            </button>

            {onReplayIntro && (
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsMobileMenuOpen(false);
                  onReplayIntro();
                }}
                className="flex items-center gap-1 py-1 px-2 bg-amber-100 text-amber-900 rounded border border-slate-300 text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Putar Intro Logo</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Single-line mobile tab strip below header for fast tab access */
        <div className="md:hidden flex border-t-2 border-slate-900 bg-white overflow-x-auto p-1.5 gap-1.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playToggle();
                  onSelectTab(item.id);
                }}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded border-2 transition-all whitespace-nowrap text-center shrink-0 ${
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
