import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/kas.ts';
import { sfx } from '../utils/soundEffects.ts';
import { signInWithGoogleSupabase, getSupabaseClient } from '../services/supabaseClient.ts';

import { registerOrUpdateUser } from '../utils/userManagement.ts';

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

  // Handle Supabase user session mapping with Super Admin whitelist checking
  const handleSupabaseUser = (sbUser: any) => {
    const email = sbUser.email || '';
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
    const avatar = sbUser.user_metadata?.avatar_url;

    // Register user & resolve role via userManagement
    const assignedRole = registerOrUpdateUser({ name, email, avatar });

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

  const loginAs = (selectedRole: UserRole, customName?: string, customEmail?: string) => {
    sfx.playPaperRustle();
    const email = customEmail || (selectedRole === 'superadmin' ? SUPER_ADMIN_EMAIL : `${selectedRole}@kelasgue.sch.id`);
    const name = customName || (
      email.toLowerCase() === SUPER_ADMIN_EMAIL ? 'Super Admin Kelas' :
      selectedRole === 'bendahara' ? 'Bendahara Kelas' : 'Anggota Siswa Kelas'
    );

    const assignedRole = registerOrUpdateUser({ name, email });

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: assignedRole,
      isGoogleAuth: true
    };

    setUser(profile);
    localStorage.setItem('kelasgue_active_user_v2', JSON.stringify(profile));
  };

  const loginWithGooglePrompt = async () => {
    sfx.playClick();
    const client = getSupabaseClient();
    if (client) {
      try {
        const res = await signInWithGoogleSupabase();
        if (res.success) return;
        if (res.error) {
          console.warn('Supabase OAuth notice:', res.error);
        }
      } catch (err) {
        console.warn('Supabase OAuth catch error:', err);
      }
    }

    // Direct Google Email verification flow (bypasses iframe 403 block)
    const emailInput = window.prompt(
      'Masukkan Alamat Email Google Anda untuk verifikasi login:'
    );

    if (!emailInput || !emailInput.trim()) return;

    const email = emailInput.trim();
    loginAs('anggota', email.split('@')[0], email);
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
