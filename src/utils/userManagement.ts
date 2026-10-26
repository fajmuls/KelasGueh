export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'bendahara' | 'sekretaris' | 'anggota';
  lastLogin: string;
  avatar?: string;
  linkedMemberId?: string;
  linkedMemberName?: string;
}

const STORAGE_KEY_REGISTERED = 'kelasgue_registered_users_v2';
const STORAGE_KEY_BENDAHARA_LIST = 'kelasgue_bendahara_whitelist_v2';
const STORAGE_KEY_SEKRETARIS_LIST = 'kelasgue_sekretaris_whitelist_v2';

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

export const getSekretarisWhitelist = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SEKRETARIS_LIST);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
};

export const saveSekretarisWhitelist = (emails: string[]): void => {
  const normalized = Array.from(new Set(emails.map(e => e.toLowerCase().trim()))).filter(Boolean);
  localStorage.setItem(STORAGE_KEY_SEKRETARIS_LIST, JSON.stringify(normalized));
};

/**
 * Helper to auto-detect student gender ('L' | 'P') by Indonesian name keywords
 */
export const autoDetectGenderByName = (name: string): 'L' | 'P' => {
  if (!name) return 'L';
  const cleanName = name.toLowerCase();
  const femaleKeywords = [
    'siti', 'putri', 'nur', 'ani', 'aisyah', 'dewi', 'fitri', 'megan', 'sari', 'dyah', 
    'ni', 'fani', 'tri', 'retno', 'maria', 'diana', 'sri', 'anisa', 'indah', 'laras', 
    'wulan', 'utami', 'kartika', 'astuti', 'rina', 'ratna', 'maya', 'dwi', 'fitria', 
    'silvia', 'nadia', 'cut', 'intan', 'elvira', 'mega', 'aulia', 'rahma', 'ayu', 
    'nurlaila', 'marlina', 'lia', 'vina', 'widya', 'tia', 'riska', 'mira', 'suci'
  ];

  const words = cleanName.split(/\s+/);
  const isFemale = words.some(w => femaleKeywords.includes(w)) || 
                  femaleKeywords.some(kw => cleanName.includes(kw));

  return isFemale ? 'P' : 'L';
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

export const registerOrUpdateUser = (profile: { name: string; email: string; avatar?: string }): 'superadmin' | 'bendahara' | 'sekretaris' | 'anggota' => {
  const emailLower = profile.email.toLowerCase().trim();
  const superAdminEmail = 'mrachmanfm@gmail.com';
  
  const bendaharas = getBendaharaWhitelist();
  const sekretarisList = getSekretarisWhitelist();

  let assignedRole: 'superadmin' | 'bendahara' | 'sekretaris' | 'anggota' = 'anggota';
  
  if (emailLower === superAdminEmail) {
    assignedRole = 'superadmin';
  } else if (bendaharas.includes(emailLower)) {
    assignedRole = 'bendahara';
  } else if (sekretarisList.includes(emailLower)) {
    assignedRole = 'sekretaris';
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

export const updateUserRole = (email: string, newRole: 'bendahara' | 'sekretaris' | 'anggota'): RegisteredUser[] => {
  const emailLower = email.toLowerCase().trim();
  let bendaharas = getBendaharaWhitelist();
  let sekretarisList = getSekretarisWhitelist();

  if (newRole === 'bendahara') {
    if (!bendaharas.includes(emailLower)) bendaharas.push(emailLower);
    sekretarisList = sekretarisList.filter(e => e !== emailLower);
  } else if (newRole === 'sekretaris') {
    if (!sekretarisList.includes(emailLower)) sekretarisList.push(emailLower);
    bendaharas = bendaharas.filter(e => e !== emailLower);
  } else {
    bendaharas = bendaharas.filter(e => e !== emailLower);
    sekretarisList = sekretarisList.filter(e => e !== emailLower);
  }

  saveBendaharaWhitelist(bendaharas);
  saveSekretarisWhitelist(sekretarisList);

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
