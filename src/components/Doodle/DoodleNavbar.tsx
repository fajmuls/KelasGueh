import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { sfx } from '../../utils/soundEffects.ts';
import { DoodleCoin, DoodleCrown, PaperClip } from './DoodleDecorations.tsx';
import { Volume2, VolumeX, LogOut, ShieldCheck, User, Music } from 'lucide-react';

interface DoodleNavbarProps {
  currentTab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan';
  onSelectTab: (tab: 'ringkasan' | 'bukukas' | 'checklist' | 'pengaturan') => void;
  classNameTitle: string;
}

export const DoodleNavbar: React.FC<DoodleNavbarProps> = ({
  currentTab,
  onSelectTab,
  classNameTitle
}) => {
  const { user, role, isSuperAdmin, isBendahara, logout, switchRole } = useAuth();
  const [soundOn, setSoundOn] = useState(() => sfx.isEnabled());
  const [bgmPlaying, setBgmPlaying] = useState(() => sfx.getIsBgmPlaying());
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
    <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b-2 border-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark with Doodle Coin */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_#1E293B] flex items-center justify-center">
            <DoodleCoin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
              <span>{classNameTitle || 'Kelas Gue'}</span>
              <span className="text-xs bg-emerald-200 border border-slate-900 px-1.5 py-0.5 rounded-xs font-bold text-slate-900">
                Kas Transparan
              </span>
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">Buku Catatan Keuangan Kelas</p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs (Paper tabs) */}
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
                className={`px-4 py-2 text-sm font-bold border-2 border-slate-900 rounded-md transition-all whitespace-nowrap shrink-0 ${
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

        {/* Zone 3: Audio Toggle + Role Badge + Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sound SFX Toggle Button */}
          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Matikan Suara SFX' : 'Nyalakan Suara SFX'}
            className="w-9 h-9 btn-doodle bg-white rounded-md flex items-center justify-center text-slate-800"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* BGM Music Toggle Button */}
          <button
            onClick={handleToggleBgm}
            title={bgmPlaying ? 'Jeda Musik Latar (BGM)' : 'Putar Musik Latar Chill (BGM)'}
            className={`w-9 h-9 btn-doodle rounded-md flex items-center justify-center transition-all ${
              bgmPlaying ? 'bg-amber-300 text-slate-900 border-2 border-slate-900 animate-pulse' : 'bg-white text-slate-400'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Role Status Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sfx.playClick();
                setShowRoleMenu(!showRoleMenu);
              }}
              className="btn-doodle px-3 py-1.5 bg-white rounded-md flex items-center gap-2 text-xs font-bold text-slate-800"
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
              <div className="absolute right-0 mt-2 w-56 card-doodle p-3 rounded-lg z-50 bg-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                  Ganti Hak Akses (Testing)
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
            className="w-9 h-9 btn-doodle bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md flex items-center justify-center"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden flex border-t-2 border-slate-900 bg-white overflow-x-auto p-1.5 gap-1.5">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sfx.playToggle();
                onSelectTab(item.id);
              }}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded border transition-colors whitespace-nowrap text-center ${
                isActive
                  ? 'bg-amber-300 border-slate-900 text-slate-900 font-black'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
