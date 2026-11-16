import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/kas.ts';
import { sfx } from '../utils/soundEffects.ts';
import { signInWithGoogleSupabase, getSupabaseClient, LocalKasRepository } from '../services/supabaseClient.ts';
import { signInWithGoogle, signOutFirebase, initGoogleAuthListener } from '../services/firebase.ts';

import { showPrompt, showToast } from '../components/UI/DoodleDialog.tsx';

const SUPER_ADMIN_EMAIL = 'mrachmanfm@gmail.com';

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
  isGooglePopupLoading: boolean;
  loginAs: (role: UserRole, customName?: string, customEmail?: string, avatar?: string) => Promise<void> | void;
  loginWithGooglePrompt: () => Promise<void>;
  loginWithEmailFallback: () => Promise<void>;
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
  const [isGooglePopupLoading, setIsGooglePopupLoading] = useState(false);

  // Listen to Firebase Auth state so in-memory OAuth token stays clean on sign-out
  useEffect(() => {
    const unsubFirebase = initGoogleAuthListener();
    return () => unsubFirebase();
  }, []);

  // Handle Supabase user session mapping with Super Admin whitelist checking
  const handleSupabaseUser = async (sbUser: any) => {
    const email = sbUser.email || '';
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
    const avatar = sbUser.user_metadata?.avatar_url;

    // Sync profile and get resolved role from database
    const assignedRole = await LocalKasRepository.syncUserProfile({
      id: sbUser.id,
      email,
      name,
      avatar
    });

    const profile: UserProfile = {
      id: sbUser.id,
      name,
      email,
      role: assignedRole,
      avatar,
      isGoogleAuth: true
    };
    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  // Check & listen to Supabase session changes
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSupabaseUser(session.user);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSupabaseUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAs = async (
    selectedRole: UserRole,
    customName?: string,
    customEmail?: string,
    avatar?: string
  ) => {
    sfx.playPaperRustle();
    const email = customEmail || (selectedRole === 'superadmin' ? SUPER_ADMIN_EMAIL : `${selectedRole}@kelasgue.sch.id`);
    const name = customName || (
      email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'Super Admin Kelas' :
      selectedRole === 'bendahara' ? 'Bendahara Kelas' : 
      selectedRole === 'sekretaris' ? 'Sekretaris Kelas' : 'Anggota Siswa Kelas'
    );

    const uid = `usr-${Date.now()}`;
    const assignedRole = await LocalKasRepository.syncUserProfile({
      id: uid,
      email,
      name,
      avatar
    });

    const profile: UserProfile = {
      id: uid,
      name,
      email,
      role: selectedRole === 'superadmin' ? 'superadmin' : assignedRole,
      avatar,
      isGoogleAuth: true
    };

    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  const loginWithEmailFallback = async () => {
    sfx.playClick();
    const emailInput = await showPrompt({
      title: 'Verifikasi Email Google',
      message: 'Masukkan alamat Email Google Anda jika popup login diblokir browser:',
      placeholder: 'nama@gmail.com',
      inputType: 'email',
      confirmLabel: 'Verifikasi & Masuk',
      cancelLabel: 'Batal'
    });

    if (!emailInput || !emailInput.trim()) return;

    const email = emailInput.trim();
    const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    await loginAs(isOwner ? 'superadmin' : 'anggota', email.split('@')[0], email);
    showToast(`Berhasil verifikasi login sebagai ${email.split('@')[0]}`, 'success');
    sfx.playCoinChime();
  };

  const loginWithGooglePrompt = async () => {
    sfx.playClick();
    setIsGooglePopupLoading(true);
    try {
      // 1. Primary path: Official Firebase Auth Google Popup (works reliably in AI Studio preview & grants Google Sheets token in memory)
      const { user: fbUser } = await signInWithGoogle();
      const email = fbUser.email || '';
      if (!email) {
        throw new Error('Akun Google tidak menyertakan alamat email.');
      }
      const displayName = fbUser.displayName || email.split('@')[0];
      const avatar = fbUser.photoURL || undefined;
      const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      const assignedRole = await LocalKasRepository.syncUserProfile({
        id: fbUser.uid,
        email,
        name: displayName,
        avatar
      });

      const profile: UserProfile = {
        id: fbUser.uid,
        name: displayName,
        email,
        role: isOwner ? 'superadmin' : assignedRole,
        avatar,
        isGoogleAuth: true
      };
      setUser(profile);
      localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
      sfx.playCoinChime();
      showToast(`Login Google berhasil! Selamat datang, ${displayName}.`, 'success');
      return;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        showToast('Popup login Google ditutup sebelum selesai.', 'info');
        return;
      }

      console.warn('Firebase Google popup notice, trying Supabase/manual fallback:', err);

      // 2. Secondary path: Try Supabase OAuth when outside restricted iframe
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      const client = getSupabaseClient();
      if (client && !isInIframe) {
        try {
          const res = await signInWithGoogleSupabase();
          if (res.success) return;
        } catch {
          // continue to manual prompt
        }
      }

      // 3. Smooth manual email prompt fallback if popup blocked by browser
      showToast('Popup Google diblokir/tidak tersedia di browser ini. Gunakan verifikasi email di bawah.', 'info');
      await loginWithEmailFallback();
    } finally {
      setIsGooglePopupLoading(false);
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
    signOutFirebase().catch(() => {});
    const client = getSupabaseClient();
    if (client) {
      client.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('kelasgue_active_user_v2');
  };

  // Determine if user has permanent super admin privileges for simulation switching
  const isRealSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // Active role determines actual current permissions
  const role: UserRole = user?.role || 'anggota';
  const isSuperAdmin = role === 'superadmin';
  const isBendahara = role === 'bendahara';
  const isSekretaris = role === 'sekretaris';
  
  // Specific Permissions
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
        isGooglePopupLoading,
        loginAs,
        loginWithGooglePrompt,
        loginWithEmailFallback,
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
