import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/kas.ts';
import { sfx } from '../utils/soundEffects.ts';
import { signInWithGoogleSupabase, getSupabaseClient } from '../services/supabaseClient.ts';

const SUPER_ADMIN_EMAIL = 'mrachmanfm@gmail.com';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isSuperAdmin: boolean;
  isBendahara: boolean;
  canEditKas: boolean;
  loginAs: (role: UserRole, customName?: string, customEmail?: string) => void;
  loginWithGooglePrompt: () => Promise<void>;
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

  // Check Supabase session on mount if connected
  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = session.user.email || '';
          const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
          const profile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || email.split('@')[0],
            email: email,
            role: isOwner ? 'superadmin' : 'bendahara',
            avatar: session.user.user_metadata?.avatar_url,
            isGoogleAuth: true
          };
          setUser(profile);
          localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
        }
      });
    }
  }, []);

  const loginAs = (selectedRole: UserRole, customName?: string, customEmail?: string) => {
    sfx.playPaperRustle();
    const email = customEmail || (selectedRole === 'superadmin' ? SUPER_ADMIN_EMAIL : `${selectedRole}@kelasgue.sch.id`);
    const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

    const role: UserRole = isOwner ? 'superadmin' : selectedRole;
    const name = customName || (
      role === 'superadmin' ? 'M. Rachman (Super Admin)' :
      role === 'bendahara' ? 'Bendahara Kelas (Buku Kas)' : 'Anggota Siswa Kelas'
    );

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      isGoogleAuth: isOwner
    };

    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  const loginWithGooglePrompt = async () => {
    sfx.playClick();
    // Try Supabase OAuth first
    const client = getSupabaseClient();
    if (client) {
      const res = await signInWithGoogleSupabase();
      if (res.success) return;
    }

    // Direct Google Email verification flow (for mrachmanfm@gmail.com or bendahara)
    const emailInput = window.prompt(
      'Masukkan Email Google Anda (Gunakan mrachmanfm@gmail.com untuk Super Admin otomatis):',
      SUPER_ADMIN_EMAIL
    );

    if (!emailInput || !emailInput.trim()) return;

    const email = emailInput.trim();
    const isOwner = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    
    loginAs(isOwner ? 'superadmin' : 'bendahara', isOwner ? 'M. Rachman (Super Admin)' : 'Bendahara Google', email);
    sfx.playCoinChime();
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
    localStorage.removeItem('kelasgue_active_user_v2');
  };

  const role = user?.role || 'anggota';
  const isSuperAdmin = role === 'superadmin' || user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isBendahara = role === 'bendahara';
  const canEditKas = isSuperAdmin || isBendahara;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isSuperAdmin,
        isBendahara,
        canEditKas,
        loginAs,
        loginWithGooglePrompt,
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
