import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Search, Bell, Menu, CheckCircle2, LogIn, LogOut, ShieldCheck, KeyRound, GraduationCap, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../services/api.ts';
import { NotificationItem, ClassInfo } from '../../types/index.ts';
import { InitialAvatar } from '../UI/InitialAvatar.tsx';
import {
  getConnectionStatus,
  subscribeToConnectionStatus,
  FirestoreConnectionStatus,
  fetchClassesFromFirestore,
} from '../../services/firestoreSync.ts';
import { ClassSetupModal } from '../Admin/ClassSetupModal.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const {
    user,
    role,
    classInfo,
    firebaseUser,
    loginWithGoogle,
    openDomainHelper,
    logoutGoogle,
    isSuperAdmin,
  } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<FirestoreConnectionStatus>(getConnectionStatus());
  const [showClassModal, setShowClassModal] = useState(false);
  const [existingClasses, setExistingClasses] = useState<ClassInfo[]>([]);

  useEffect(() => {
    const unsub = subscribeToConnectionStatus((status) => {
      setFirestoreStatus(status);
    });
    return () => unsub();
  }, []);

  const loadClasses = async () => {
    try {
      const cls = await fetchClassesFromFirestore();
      setExistingClasses(cls);
    } catch {}
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifs = async () => {
      try {
        const list = await api.getNotifications();
        setNotifications(list);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => api.markNotificationRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Mobile Menu & Class Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {classInfo?.code?.slice(0, 2) || '01'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Workspace /</span>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  {classInfo?.name || 'Kelas Manager'}
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {classInfo?.code || '01SAKP014'}
                </span>
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowClassModal(true)}
                    className="ml-1 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Kelola atau Buat Kelas di Cloud Firestore"
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span className="hidden md:inline">Kelola Kelas</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                {classInfo?.major || 'S1 Akuntansi'} • {classInfo?.faculty || 'Fakultas Ekonomi dan Bisnis'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Firestore Status, Global Search, Google Auth, Notification Center, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online Connection Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              firestoreStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : firestoreStatus === 'connecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title="Status Koneksi"
          >
            {firestoreStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </>
            ) : firestoreStatus === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500" />
                <span>Offline</span>
              </>
            )}
          </div>
          {/* Quick Search trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-colors border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Cari apa saja...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-slate-400 bg-white rounded-md border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Google Sign In / Account Status */}
          {firebaseUser ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[11px] max-w-[130px] truncate">{firebaseUser.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Masuk dengan Akun Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Login Google</span>
              </button>
              <button
                onClick={openDomainHelper}
                className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                title="Bantuan Otorisasi Domain / Masuk Cepat"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Pusat Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi saat ini
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs hover:bg-slate-50 transition-colors ${
                          !n.is_read ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-90 cursor-pointer text-left"
            >
              <InitialAvatar
                name={user?.name || 'User'}
                avatarUrl={user?.avatar}
                size="md"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 line-clamp-1 leading-tight">{user?.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                  <span>{role?.name || 'Anggota'}</span>
                  {isSuperAdmin && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">SA</span>
                  )}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      NIM: {user?.nim}
                    </span>
                    {isSuperAdmin && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                        Super Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1">
                  {firebaseUser ? (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logoutGoogle();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Keluar dari Akun Google
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          loginWithGoogle();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogIn className="w-4 h-4" /> Masuk Akun Google Asli
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          openDomainHelper();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <KeyRound className="w-4 h-4 text-indigo-500" /> Bantuan Otorisasi / Masuk Cepat
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutGoogle();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Keluar ke Layar Awal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showClassModal && (
        <ClassSetupModal
          isOpen={showClassModal}
          onClose={() => {
            setShowClassModal(false);
            loadClasses();
          }}
          existingClasses={existingClasses}
          onClassSelected={() => {
            loadClasses();
          }}
        />
      )}
    </header>
  );
};
