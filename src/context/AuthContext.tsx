import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/kas.ts';
import { sfx } from '../utils/soundEffects.ts';
import { signInWithGoogleSupabase, getSupabaseClient, LocalKasRepository, SUPER_ADMIN_EMAIL } from '../services/supabaseClient.ts';
import { showToast } from '../components/UI/DoodleDialog.tsx';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isSuperAdmin: boolean;
  isRealSuperAdmin: boolean;
  isBendahara: boolean;
  isSekretaris: boolean;
  canEditKas: boolean;
  canEditSecretary: boolean;
  canViewAudit: boolean;
  isOAuthLoading: boolean;
  lastOAuthUrl: string | null;
  loginAs: (role: UserRole, customName?: string, customEmail?: string, avatar?: string) => void;
  loginWithPengurusCredentials: (email: string, pinOrPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSupabaseOAuth: () => Promise<{ success: boolean; url?: string; error?: string }>;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('kelasgue_active_user_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [lastOAuthUrl, setLastOAuthUrl] = useState<string | null>(null);

  // Map a verified Supabase Auth user to our local active UserProfile with whitelist check
  const handleSupabaseUser = async (sbUser: any) => {
    const email = sbUser.email || '';
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
    const avatar = sbUser.user_metadata?.avatar_url;

    const assignedRole = await LocalKasRepository.syncUserProfile({
      id: sbUser.id,
      email,
      name,
      avatar
    });

    const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const profile: UserProfile = {
      id: sbUser.id,
      name,
      email,
      role: isOwner ? 'superadmin' : assignedRole,
      avatar,
      isGoogleAuth: true
    };
    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  // Check & listen to Supabase session changes (including cross-tab storage sync when OAuth opens in new tab)
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const syncSessionFromSupabase = () => {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleSupabaseUser(session.user);
        }
      });
    };

    syncSessionFromSupabase();

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSupabaseUser(session.user);
      }
    });

    const handleStorageOrFocus = () => {
      syncSessionFromSupabase();
    };
    window.addEventListener('storage', handleStorageOrFocus);
    window.addEventListener('focus', handleStorageOrFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageOrFocus);
      window.removeEventListener('focus', handleStorageOrFocus);
    };
  }, []);

  /**
   * Instant local role entry (primary path for transparent "Anggota Kelas" access with 0ms wait).
   */
  const loginAs = (
    selectedRole: UserRole,
    customName?: string,
    customEmail?: string,
    avatar?: string
  ) => {
    sfx.playPaperRustle();
    const email =
      customEmail ||
      (selectedRole === 'superadmin' ? SUPER_ADMIN_EMAIL : `${selectedRole}@kelasgue.sch.id`);
    const name =
      customName ||
      (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        ? 'Super Admin Kelas'
        : selectedRole === 'bendahara'
        ? 'Bendahara Kelas'
        : selectedRole === 'sekretaris'
        ? 'Sekretaris Kelas'
        : 'Anggota Kelas (Transparan)');

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: selectedRole,
      avatar,
      isGoogleAuth: false
    };

    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  /**
   * Pengurus verification via Supabase whitelist + Password or 6-digit Pengurus PIN (iframe-safe).
   */
  const loginWithPengurusCredentials = async (
    emailInput: string,
    pinOrPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    sfx.playClick();
    const res = await LocalKasRepository.verifyPengurusCredentials(emailInput, pinOrPassword);
    if (!res.success || !res.role) {
      sfx.playWarning();
      return { success: false, error: res.error || 'Gagal verifikasi pengurus.' };
    }

    const emailLower = emailInput.toLowerCase().trim();
    const profile: UserProfile = {
      id: res.id || `sb_${Date.now()}`,
      name: res.name || emailLower.split('@')[0],
      email: emailLower,
      role: res.role,
      avatar: res.avatar,
      isGoogleAuth: false
    };

    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
    sfx.playCoinChime();
    showToast(`Selamat datang, ${profile.name} (${profile.role.toUpperCase()})!`, 'success');
    return { success: true };
  };

  /**
   * Opens Supabase Google OAuth via safe DOM anchor click when inside preview iframe.
   */
  const loginWithSupabaseOAuth = async (): Promise<{ success: boolean; url?: string; error?: string }> => {
    sfx.playClick();
    setIsOAuthLoading(true);
    try {
      const res = await signInWithGoogleSupabase({ usePopup: true });
      if (res.url) {
        setLastOAuthUrl(res.url);
      }
      if (!res.success) {
        showToast(res.error || 'Gagal memulai login OAuth Supabase.', 'error');
        return { success: false, error: res.error };
      }
      showToast(
        'Tab login Supabase OAuth dibuka. Setelah selesai masuk, kembali ke halaman ini atau lanjutkan di tab baru.',
        'info'
      );
      return { success: true, url: res.url };
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    sfx.playToggle();
    const updated: UserProfile = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(updated));
  };

  const logout = () => {
    sfx.playPaperRustle();
    const client = getSupabaseClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    setUser(null);
    setLastOAuthUrl(null);
    localStorage.removeItem('kelasgue_active_user_v2');
  };

  // Permanent super admin check
  const isRealSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // Active role permissions
  const role: UserRole = user?.role || 'anggota';
  const isSuperAdmin = role === 'superadmin';
  const isBendahara = role === 'bendahara';
  const isSekretaris = role === 'sekretaris';

  const canEditKas = isSuperAdmin || isBendahara;
  const canEditSecretary = isSuperAdmin || isSekretaris;
  const canViewAudit = isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isSuperAdmin,
        isRealSuperAdmin,
        isBendahara,
        isSekretaris,
        canEditKas,
        canEditSecretary,
        canViewAudit,
        isOAuthLoading,
        lastOAuthUrl,
        loginAs,
        loginWithPengurusCredentials,
        loginWithSupabaseOAuth,
        switchRole,
        logout,
        isLoggedIn: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
