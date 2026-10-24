export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'bendahara' | 'anggota';
  lastLogin: string;
  avatar?: string;
  linkedMemberId?: string;
  linkedMemberName?: string;
}

const STORAGE_KEY_REGISTERED = 'kelasgue_registered_users_v2';
const STORAGE_KEY_BENDAHARA_LIST = 'kelasgue_bendahara_whitelist_v2';

export const getBendaharaWhitelist = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BENDAHARA_LIST);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveBendaharaWhitelist = (emails: string[]): void => {
  const normalized = Array.from(new Set(emails.map(e => e.toLowerCase().trim()))).filter(Boolean);
  localStorage.setItem(STORAGE_KEY_BENDAHARA_LIST, JSON.stringify(normalized));
};

export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REGISTERED);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const registerOrUpdateUser = (profile: { name: string; email: string; avatar?: string }): 'superadmin' | 'bendahara' | 'anggota' => {
  const emailLower = profile.email.toLowerCase().trim();
  const superAdminEmail = 'mrachmanfm@gmail.com';
  
  const bendaharas = getBendaharaWhitelist();
  let assignedRole: 'superadmin' | 'bendahara' | 'anggota' = 'anggota';
  
  if (emailLower === superAdminEmail) {
    assignedRole = 'superadmin';
  } else if (bendaharas.includes(emailLower)) {
    assignedRole = 'bendahara';
  } else {
    assignedRole = 'anggota';
  }

  const currentList = getRegisteredUsers();
  const existingIdx = currentList.findIndex(u => u.email.toLowerCase() === emailLower);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    currentList[existingIdx] = {
      ...currentList[existingIdx],
      name: profile.name || currentList[existingIdx].name,
      role: assignedRole,
      lastLogin: now,
      avatar: profile.avatar || currentList[existingIdx].avatar
    };
  } else {
    currentList.push({
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: profile.name || emailLower.split('@')[0],
      email: emailLower,
      role: assignedRole,
      lastLogin: now,
      avatar: profile.avatar
    });
  }

  localStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(currentList));
  return assignedRole;
};

export const updateUserRole = (email: string, newRole: 'bendahara' | 'anggota'): RegisteredUser[] => {
  const emailLower = email.toLowerCase().trim();
  let bendaharas = getBendaharaWhitelist();

  if (newRole === 'bendahara') {
    if (!bendaharas.includes(emailLower)) {
      bendaharas.push(emailLower);
    }
  } else {
    bendaharas = bendaharas.filter(e => e !== emailLower);
  }
  saveBendaharaWhitelist(bendaharas);

  const currentList = getRegisteredUsers();
  const updated = currentList.map(u => {
    if (u.email.toLowerCase() === emailLower && u.role !== 'superadmin') {
      return { ...u, role: newRole };
    }
    return u;
  });

  localStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(updated));
  return updated;
};

export const updateUserLinkedMember = (
  email: string,
  memberId: string | undefined,
  memberName?: string
): RegisteredUser[] => {
  const emailLower = email.toLowerCase().trim();
  const currentList = getRegisteredUsers();
  const updated = currentList.map(u => {
    if (u.email.toLowerCase() === emailLower) {
      return {
        ...u,
        linkedMemberId: memberId || undefined,
        linkedMemberName: memberName || undefined
      };
    }
    return u;
  });

  localStorage.setItem(STORAGE_KEY_REGISTERED, JSON.stringify(updated));
  return updated;
};
