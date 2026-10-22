import { Router, Response } from 'express';
import { db, SYSTEM_PERMISSIONS } from '../db/database.ts';
import { AuthenticatedRequest, requirePermission } from '../middleware/auth.ts';
import {
  Transaction,
  Bill,
  EventItem,
  Announcement,
  TaskItem,
  DocumentItem,
  Poll,
  AttendanceRecord,
  Meeting,
  RoleClaimRequest,
  KasCollectionColumn,
  KasChecklistEntry,
} from '../../src/types/index.ts';

export const apiRouter = Router();
console.log('API Router initialized');

// Current active demo user state on server
let currentGlobalUserId = 'usr_superadmin';

// --- AUTH & USER PROFILE ---
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const userEmail = req.headers['x-user-email'] as string;
  const userId = (req.headers['x-user-id'] as string) || currentGlobalUserId;
  
  let user = null;
  if (userEmail) {
    user = db.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase() && u.is_active);
  }
  if (!user) {
    user = db.users.find(u => u.id === userId && u.is_active) || db.users[0];
  }
  
  // Super admin hardcheck
  if (user && user.email.toLowerCase() === 'mrachmanfm@gmail.com') {
    user.role_id = 'role_superadmin';
    user.role_name = 'Super Admin';
  }

  const role = db.roles.find(r => r.id === user?.role_id);
  res.json({
    user,
    role,
    permissions: role ? role.permissions : [],
    classInfo: db.classInfo,
  });
});

apiRouter.post('/auth/google-login', (req, res: Response) => {
  const { email, displayName, photoURL } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email Google diperlukan' });
  }

  const isSuperAdmin = email.toLowerCase() === 'mrachmanfm@gmail.com';

  if (isSuperAdmin) {
    let superAdmin = db.users.find(u => u.email.toLowerCase() === 'mrachmanfm@gmail.com' || u.id === 'usr_member_25');
    if (!superAdmin) {
      superAdmin = db.users[24] || db.users[0];
    }
    superAdmin.email = 'mrachmanfm@gmail.com';
    superAdmin.role_id = 'role_superadmin';
    superAdmin.role_name = 'Super Admin';
    if (photoURL) superAdmin.avatar = photoURL;
    if (displayName) superAdmin.name = displayName;
    superAdmin.updated_at = new Date().toISOString();

    currentGlobalUserId = superAdmin.id;
    const role = db.roles.find(r => r.id === 'role_superadmin');
    return res.json({
      success: true,
      isSuperAdmin: true,
      isApproved: true,
      user: superAdmin,
      role,
      permissions: role?.permissions || [],
      classInfo: db.classInfo,
    });
  }

  // Check if email belongs to an existing member (already approved/assigned)
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    if (photoURL) existingUser.avatar = photoURL;
    existingUser.updated_at = new Date().toISOString();
    currentGlobalUserId = existingUser.id;
    const role = db.roles.find(r => r.id === existingUser.role_id);
    return res.json({
      success: true,
      isSuperAdmin: false,
      isApproved: true,
      user: existingUser,
      role,
      permissions: role?.permissions || [],
      classInfo: db.classInfo,
    });
  }

  // Not mapped to an approved user yet. Check pending claim request
  const existingClaim = db.roleClaimRequests.find(c => c.google_email.toLowerCase() === email.toLowerCase());
  if (existingClaim) {
    if (existingClaim.status === 'pending') {
      const targetUser = db.users.find(u => u.id === existingClaim.target_user_id) || db.users.find(u => u.nim === existingClaim.target_user_nim) || db.users[0];
      const memberRole = db.roles.find(r => r.id === 'role_anggota') || db.roles[db.roles.length - 1];
      
      const userAsMember = {
        ...targetUser,
        email: email,
        avatar: photoURL || targetUser.avatar,
        role_id: 'role_anggota',
        role_name: 'Anggota Kelas',
        position: `Anggota (Menunggu Verifikasi ${existingClaim.requested_role_name || 'Role'})`,
      };
      
      currentGlobalUserId = userAsMember.id;
      
      return res.json({
        success: true,
        isSuperAdmin: false,
        isApproved: true,
        isPendingApproval: true,
        claimRequest: existingClaim,
        user: userAsMember,
        role: memberRole,
        permissions: memberRole?.permissions || [],
        classInfo: db.classInfo,
      });
    } else if (existingClaim.status === 'rejected') {
      return res.json({
        success: true,
        isSuperAdmin: false,
        isApproved: false,
        isRejected: true,
        claimRequest: existingClaim,
        classInfo: db.classInfo,
      });
    }
  }

  // User needs to claim who they are
  return res.json({
    success: true,
    isSuperAdmin: false,
    isApproved: false,
    requiresClaim: true,
    classInfo: db.classInfo,
  });
});

apiRouter.post('/auth/claim-role', async (req, res: Response) => {
  const { 
    google_email, 
    google_name, 
    google_avatar, 
    requested_user_id, 
    requested_role_id, 
    notes,
    // Support old names just in case
    email,
    displayName,
    photoURL,
    target_user_id,
    message
  } = req.body;

  const finalEmail = google_email || email;
  const finalName = google_name || displayName;
  const finalPhoto = google_avatar || photoURL;
  const finalTargetUserId = requested_user_id || target_user_id;
  const finalMessage = notes || message;

  if (!finalEmail || !finalTargetUserId) {
    return res.status(400).json({ error: 'Email dan pilihan identitas mahasiswa diperlukan' });
  }

  const targetUser = db.users.find(u => u.id === finalTargetUserId);
  const targetRole = db.roles.find(r => r.id === requested_role_id) || db.roles.find(r => r.id === 'role_anggota');

  if (!targetUser) {
    return res.status(404).json({ error: 'Data mahasiswa tidak ditemukan' });
  }

  // Check for Auto-Approval Master Passcode (e.g. 01SAKP014PRO, 01SAKP014, SAKP14PRO)
  const isMasterCode = (req.body.pro_code || finalMessage || '').toUpperCase().includes('01SAKP014PRO') ||
    (req.body.pro_code || finalMessage || '').toUpperCase().includes('01SAKP014') ||
    (req.body.pro_code || finalMessage || '').toUpperCase().includes('SAKP14PRO');

  if (isMasterCode) {
    // Instant Auto-Approval!
    targetUser.email = finalEmail;
    if (finalPhoto) targetUser.avatar = finalPhoto;
    if (targetRole) {
      targetUser.role_id = targetRole.id;
      targetUser.role_name = targetRole.name;
    }
    targetUser.updated_at = new Date().toISOString();
    currentGlobalUserId = targetUser.id;

    const autoClaim: RoleClaimRequest = {
      id: `claim_auto_${Date.now()}`,
      google_email: finalEmail,
      google_name: finalName || targetUser.name,
      google_photo: finalPhoto,
      target_user_id: targetUser.id,
      target_user_name: targetUser.name,
      target_user_nim: targetUser.nim,
      requested_role_id: targetRole?.id || 'role_anggota',
      requested_role_name: targetRole?.name || 'Anggota',
      status: 'approved',
      message: 'Otomatis Terverifikasi via Master Passcode Pro Kelas',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'Auto-Approval Master Passcode System',
      created_at: new Date().toISOString(),
    };

    db.roleClaimRequests.unshift(autoClaim);

    return res.json({
      success: true,
      autoApproved: true,
      user: targetUser,
      role: targetRole,
      claimRequest: autoClaim,
    });
  }

  const memberRole = db.roles.find(r => r.id === 'role_anggota') || db.roles[db.roles.length - 1];

  // Set user profile as Anggota immediately so they can enter the portal
  targetUser.email = finalEmail;
  if (finalPhoto) targetUser.avatar = finalPhoto;
  targetUser.role_id = 'role_anggota';
  targetUser.role_name = 'Anggota Kelas';
  targetUser.position = `Anggota (Menunggu Verifikasi ${targetRole?.name || 'Role'})`;
  targetUser.updated_at = new Date().toISOString();
  currentGlobalUserId = targetUser.id;

  const existingClaim = db.roleClaimRequests.find(c => c.google_email.toLowerCase() === finalEmail.toLowerCase());
  if (existingClaim && existingClaim.status === 'pending') {
    existingClaim.target_user_id = targetUser.id;
    existingClaim.target_user_name = targetUser.name;
    existingClaim.target_user_nim = targetUser.nim;
    existingClaim.requested_role_id = targetRole?.id || 'role_anggota';
    existingClaim.requested_role_name = targetRole?.name || 'Anggota';
    existingClaim.message = finalMessage || '';
    existingClaim.updated_at = new Date().toISOString();

    return res.json({
      success: true,
      isApproved: true,
      isPendingApproval: true,
      user: targetUser,
      role: memberRole,
      permissions: memberRole?.permissions || [],
      claimRequest: existingClaim,
    });
  }

  const newClaim: RoleClaimRequest = {
    id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    google_email: finalEmail,
    google_name: finalName || finalEmail.split('@')[0],
    google_photo: finalPhoto,
    target_user_id: targetUser.id,
    target_user_name: targetUser.name,
    target_user_nim: targetUser.nim,
    requested_role_id: targetRole?.id || 'role_anggota',
    requested_role_name: targetRole?.name || 'Anggota',
    status: 'pending',
    message: finalMessage || '',
    created_at: new Date().toISOString(),
  };

  db.roleClaimRequests.unshift(newClaim);

  // Notify Super Admin
  const superAdmin = db.users.find(u => u.role_id === 'role_superadmin') || db.users[24] || db.users[0];
  if (superAdmin) {
    db.pushNotification({
      userId: superAdmin.id,
      title: 'Permintaan Persetujuan Akun Google Baru',
      message: `${newClaim.google_name} (${newClaim.google_email}) meminta konfirmasi sebagai ${newClaim.target_user_name} (${newClaim.target_user_nim}) dengan role ${newClaim.requested_role_name}.`,
      type: 'role_request',
      link: '/settings',
    });
  }

  try {
    await db.dispatchWebhook(
      'ROLE_CLAIM_SUBMITTED',
      'Permintaan Verifikasi Akun Baru',
      `Mahasiswa ${newClaim.target_user_name} (${newClaim.target_user_nim}) login via Google (${newClaim.google_email}) dan meminta verifikasi role: ${newClaim.requested_role_name}. Silakan buka Dashboard Super Admin untuk menyetujui.`
    );
  } catch (err) {
    // ignore
  }

  res.json({
    success: true,
    isApproved: true,
    isPendingApproval: true,
    user: targetUser,
    role: memberRole,
    permissions: memberRole?.permissions || [],
    claimRequest: newClaim,
  });
});

apiRouter.get('/auth/claim-requests', (_req, res: Response) => {
  res.json(db.roleClaimRequests);
});

apiRouter.post('/auth/claim-requests/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { assigned_role_id, role_id } = req.body;
  const finalRoleId = assigned_role_id || role_id;

  const claim = db.roleClaimRequests.find(c => c.id === id);
  if (!claim) {
    return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
  }

  claim.status = 'approved';
  claim.reviewed_at = new Date().toISOString();
  claim.reviewed_by = req.user ? req.user.name : 'Super Admin';

  const targetUser = db.users.find(u => u.id === claim.target_user_id);
  if (targetUser) {
    targetUser.email = claim.google_email;
    if (claim.google_photo) targetUser.avatar = claim.google_photo;
    const finalRole = db.roles.find(r => r.id === (finalRoleId || claim.requested_role_id));
    if (finalRole) {
      targetUser.role_id = finalRole.id;
      targetUser.role_name = finalRole.name;
    }
    targetUser.updated_at = new Date().toISOString();

    db.logAudit({
      userId: req.user?.id || 'usr_member_25',
      action: 'APPROVE_ROLE_CLAIM',
      entityType: 'User',
      entityId: targetUser.id,
      oldValue: null,
      newValue: { email: targetUser.email, role_id: targetUser.role_id, role_name: targetUser.role_name },
    });

    db.pushNotification({
      userId: targetUser.id,
      title: 'Akun Google Anda Telah Disetujui!',
      message: `Permintaan login Anda sebagai ${targetUser.name} dengan role ${targetUser.role_name} telah disetujui oleh Super Admin.`,
      type: 'role_request',
      link: '/dashboard',
    });
  }

  res.json({ success: true, claim, user: targetUser });
});

apiRouter.post('/auth/claim-requests/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const claim = db.roleClaimRequests.find(c => c.id === id);
  if (!claim) {
    return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
  }

  claim.status = 'rejected';
  claim.reviewed_at = new Date().toISOString();
  claim.reviewed_by = req.user ? req.user.name : 'Super Admin';
  if (reason) claim.message = `${claim.message || ''} (Alasan penolakan: ${reason})`;

  res.json({ success: true, claim });
});

apiRouter.post('/auth/assign-role', requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  const { userId, roleId } = req.body;
  const targetUser = db.users.find(u => u.id === userId);
  const targetRole = db.roles.find(r => r.id === roleId);

  if (!targetUser || !targetRole) {
    return res.status(404).json({ error: 'User atau Role tidak ditemukan' });
  }

  const oldRoleId = targetUser.role_id;
  targetUser.role_id = targetRole.id;
  targetUser.role_name = targetRole.name;
  targetUser.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'ASSIGN_ROLE_TO_USER',
    entityType: 'UserRole',
    entityId: targetUser.id,
    oldValue: { role_id: oldRoleId },
    newValue: { role_id: targetRole.id, role_name: targetRole.name },
  });

  res.json({
    success: true,
    user: targetUser,
    role: targetRole,
  });
});

apiRouter.get('/auth/users', (_req, res: Response) => {
  res.json(db.users);
});

apiRouter.post('/auth/switch', (req, res: Response) => {
  const { userId } = req.body;
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  currentGlobalUserId = userId;
  const role = db.roles.find(r => r.id === user.role_id);
  res.json({
    success: true,
    user,
    role,
    permissions: role?.permissions || [],
  });
});

// --- CLASS SETTINGS ---
apiRouter.get('/class', (_req, res: Response) => {
  res.json(db.classInfo);
});

apiRouter.put('/class', requirePermission('manage_system_settings'), (req: AuthenticatedRequest, res: Response) => {
  const oldVal = { ...db.classInfo };
  db.classInfo = {
    ...db.classInfo,
    ...req.body,
    updated_at: new Date().toISOString(),
  };
  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_CLASS_INFO',
    entityType: 'ClassInfo',
    entityId: db.classInfo.id,
    oldValue: oldVal,
    newValue: db.classInfo,
  });
  res.json(db.classInfo);
});

// --- MEMBERS MANAGEMENT ---
apiRouter.get('/members', requirePermission('view_members'), (req: AuthenticatedRequest, res: Response) => {
  const { search, role, status } = req.query;
  let members = [...db.users];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    members = members.filter(
      m => m.name.toLowerCase().includes(q) || m.nim.includes(q) || m.email.toLowerCase().includes(q)
    );
  }

  if (role && typeof role === 'string' && role !== 'all') {
    members = members.filter(m => m.role_id === role);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    const isActive = status === 'active';
    members = members.filter(m => m.is_active === isActive);
  }

  res.json(members);
});

apiRouter.post('/members', requirePermission('create_members'), (req: AuthenticatedRequest, res: Response) => {
  const { name, nim, email, phone, role_id, position } = req.body;
  if (!name || !nim) {
    return res.status(400).json({ error: 'Nama dan NIM wajib diisi' });
  }

  const existing = db.users.find(u => u.nim === nim);
  if (existing) {
    return res.status(400).json({ error: 'Mahasiswa dengan NIM ini sudah terdaftar' });
  }

  const role = db.roles.find(r => r.id === (role_id || 'role_anggota'));
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    nim,
    email: email || `${nim}@students.ac.id`,
    phone: phone || '081234567890',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    class_id: db.classInfo.id,
    department: db.classInfo.major,
    cohort: '2024',
    role_id: role?.id || 'role_anggota',
    role_name: role?.name || 'Anggota',
    position: position || 'Anggota',
    is_active: true,
    joined_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_MEMBER',
    entityType: 'User',
    entityId: newUser.id,
    newValue: newUser,
  });

  res.status(201).json(newUser);
});

apiRouter.put('/members/:id', requirePermission('edit_members'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Member tidak ditemukan' });

  const oldVal = { ...user };
  const { name, nim, email, phone, position, is_active } = req.body;

  if (name !== undefined) user.name = name;
  if (nim !== undefined) user.nim = nim;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (position !== undefined) user.position = position;
  if (is_active !== undefined) user.is_active = is_active;
  user.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'EDIT_MEMBER',
    entityType: 'User',
    entityId: user.id,
    oldValue: oldVal,
    newValue: user,
  });

  res.json(user);
});

apiRouter.post('/members/:id/role', requirePermission('assign_role'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role_id } = req.body;
  const user = db.users.find(u => u.id === id);
  const role = db.roles.find(r => r.id === role_id);

  if (!user || !role) return res.status(404).json({ error: 'User atau Role tidak ditemukan' });

  const oldRole = user.role_name;
  user.role_id = role.id;
  user.role_name = role.name;
  user.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'ASSIGN_ROLE',
    entityType: 'UserRole',
    entityId: user.id,
    oldValue: { role: oldRole },
    newValue: { role: role.name },
  });

  res.json(user);
});

apiRouter.delete('/members/:id', requirePermission('delete_members'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  user.is_active = false;
  user.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'DEACTIVATE_MEMBER',
    entityType: 'User',
    entityId: user.id,
    newValue: { is_active: false },
  });

  res.json({ success: true, message: 'Anggota berhasil dinonaktifkan' });
});

// --- RBAC: ROLES & PERMISSIONS ---
apiRouter.get('/permissions', (_req, res: Response) => {
  res.json(SYSTEM_PERMISSIONS);
});

apiRouter.get('/roles', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.roles);
});

apiRouter.post('/roles', requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama role wajib diisi' });

  const newRole = {
    id: `role_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    description: description || '',
    is_system: false,
    permissions: Array.isArray(permissions) ? permissions : ['view_dashboard'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.roles.push(newRole);
  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_ROLE',
    entityType: 'Role',
    entityId: newRole.id,
    newValue: newRole,
  });

  res.status(201).json(newRole);
});

apiRouter.put('/roles/:id', requirePermission('manage_roles'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const role = db.roles.find(r => r.id === id);
  if (!role) return res.status(404).json({ error: 'Role tidak ditemukan' });

  const oldVal = { ...role };
  const { name, description, permissions } = req.body;

  if (name !== undefined) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissions !== undefined && Array.isArray(permissions)) {
    role.permissions = permissions;
  }
  role.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_ROLE',
    entityType: 'Role',
    entityId: role.id,
    oldValue: oldVal,
    newValue: role,
  });

  res.json(role);
});

apiRouter.put('/roles/:id/permissions', requirePermission('manage_permissions'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const role = db.roles.find(r => r.id === id);
  if (!role) return res.status(404).json({ error: 'Role tidak ditemukan' });

  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissions harus berupa array' });
  }

  const oldPerms = [...role.permissions];
  role.permissions = permissions;
  role.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_PERMISSIONS',
    entityType: 'RolePermission',
    entityId: role.id,
    oldValue: { permissions: oldPerms },
    newValue: { permissions: role.permissions },
  });

  res.json(role);
});

// --- FINANCE & KAS ---
apiRouter.get('/finance/summary', (req: AuthenticatedRequest, res: Response) => {
  // Allow if user has view_finance or view_transparency
  const hasAccess = req.permissions?.includes('view_finance') || req.permissions?.includes('view_transparency') || req.role?.id === 'role_superadmin';
  if (!hasAccess) {
    return res.status(403).json({ error: 'Akses modul keuangan ditolak' });
  }
  const summary = db.calculateFinanceSummary();
  res.json(summary);
});

apiRouter.get('/finance/transactions', (req: AuthenticatedRequest, res: Response) => {
  const { type, category, date_from, date_to } = req.query;
  let txs = db.transactions.filter(t => !t.deleted_at);

  if (type && type !== 'all') {
    txs = txs.filter(t => t.type === type);
  }
  if (category && category !== 'all') {
    txs = txs.filter(t => t.category_id === category);
  }
  if (date_from) {
    txs = txs.filter(t => t.created_at >= String(date_from));
  }
  if (date_to) {
    txs = txs.filter(t => t.created_at <= String(date_to));
  }

  res.json(txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

apiRouter.get('/finance/categories', (_req, res: Response) => {
  res.json(db.categories);
});

apiRouter.post('/finance/transactions', requirePermission('create_transaction'), (req: AuthenticatedRequest, res: Response) => {
  const { type, amount, category_id, description, receipt_url } = req.body;
  if (!type || !amount || !description) {
    return res.status(400).json({ error: 'Tipe, nominal, dan deskripsi transaksi wajib diisi' });
  }

  const category = db.categories.find(c => c.id === category_id);
  const code = `TRX-2026-${String(db.transactions.length + 1).padStart(3, '0')}`;

  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    class_id: db.classInfo.id,
    code,
    type,
    amount: Number(amount),
    category_id: category_id || 'cat_kas_rutin',
    category_name: category ? category.name : 'Kas Rutin',
    description,
    receipt_url: receipt_url || '',
    created_by: req.user!.id,
    creator_name: req.user!.name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  db.transactions.push(newTx);

  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_TRANSACTION',
    entityType: 'Transaction',
    entityId: newTx.id,
    newValue: newTx,
  });

  res.status(201).json(newTx);
});

apiRouter.put('/finance/transactions/:id', requirePermission('edit_transaction'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const tx = db.transactions.find(t => t.id === id);
  if (!tx || tx.deleted_at) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const oldVal = { ...tx };
  const { amount, description, type, category_id, receipt_url } = req.body;

  if (amount !== undefined) tx.amount = Number(amount);
  if (description !== undefined) tx.description = description;
  if (type !== undefined) tx.type = type;
  if (receipt_url !== undefined) tx.receipt_url = receipt_url;
  if (category_id !== undefined) {
    tx.category_id = category_id;
    const cat = db.categories.find(c => c.id === category_id);
    if (cat) tx.category_name = cat.name;
  }
  tx.updated_by = req.user!.id;
  tx.updater_name = req.user!.name;
  tx.updated_at = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    action: 'EDIT_TRANSACTION',
    entityType: 'Transaction',
    entityId: tx.id,
    oldValue: oldVal,
    newValue: tx,
  });

  res.json(tx);
});

apiRouter.delete('/finance/transactions/:id', requirePermission('delete_transaction'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const tx = db.transactions.find(t => t.id === id);
  if (!tx || tx.deleted_at) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  tx.deleted_at = new Date().toISOString();
  tx.updated_by = req.user!.id;
  tx.updater_name = req.user!.name;

  db.logAudit({
    userId: req.user!.id,
    action: 'DELETE_TRANSACTION',
    entityType: 'Transaction',
    entityId: tx.id,
    oldValue: tx,
  });

  res.json({ success: true, message: 'Transaksi berhasil dihapus' });
});

// --- BILLS & PAYMENTS ---
apiRouter.get('/finance/bills', (_req, res: Response) => {
  res.json(db.bills);
});

apiRouter.post('/finance/bills', requirePermission('create_bill'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, amount, due_date, period } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'Judul dan nominal tagihan wajib diisi' });
  }

  const newBill: Bill = {
    id: `bill_${Date.now()}`,
    class_id: db.classInfo.id,
    title,
    description: description || '',
    amount: Number(amount),
    due_date: due_date || new Date().toISOString().split('T')[0],
    period: period || 'Bulan Ini',
    created_by: req.user!.id,
    created_at: new Date().toISOString(),
  };

  db.bills.push(newBill);

  // Auto-generate payment obligations for each active member
  const activeMembers = db.users.filter(u => u.is_active);
  activeMembers.forEach(member => {
    db.payments.push({
      id: `pay_${newBill.id}_${member.id}`,
      bill_id: newBill.id,
      bill_title: newBill.title,
      user_id: member.id,
      user_name: member.name,
      user_nim: member.nim,
      amount: newBill.amount,
      paid_amount: 0,
      status: 'unpaid',
    });
  });

  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_BILL',
    entityType: 'Bill',
    entityId: newBill.id,
    newValue: { bill: newBill, billed_members: activeMembers.length },
  });

  // Push notification to all active members
  activeMembers.forEach(m => {
    db.pushNotification({
      userId: m.id,
      title: `Tagihan Baru: ${newBill.title}`,
      message: `Tagihan kas sebesar Rp ${newBill.amount.toLocaleString('id-ID')} telah diterbitkan. Jatuh tempo: ${newBill.due_date}`,
      type: 'bill',
      link: '/finance',
    });
  });

  res.status(201).json(newBill);
});

apiRouter.get('/finance/payments', (req: AuthenticatedRequest, res: Response) => {
  const { bill_id, user_id } = req.query;
  let list = [...db.payments];

  if (bill_id) {
    list = list.filter(p => p.bill_id === bill_id);
  }

  // If user is regular member without manage_payments, only show own payments!
  const canManage = req.permissions?.includes('manage_payments') || req.role?.id === 'role_superadmin' || req.permissions?.includes('view_finance');
  if (!canManage) {
    list = list.filter(p => p.user_id === req.user?.id);
  } else if (user_id) {
    list = list.filter(p => p.user_id === user_id);
  }

  res.json(list);
});

apiRouter.put('/finance/payments/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const payment = db.payments.find(p => p.id === id);
  if (!payment) return res.status(404).json({ error: 'Data pembayaran tidak ditemukan' });

  const { status, paid_amount, payment_method, proof_url, notes } = req.body;
  const canManage = req.permissions?.includes('manage_payments') || req.role?.id === 'role_superadmin';

  // Member can upload proof or submit payment for themselves
  const isOwner = payment.user_id === req.user?.id;
  if (!canManage && !isOwner) {
    return res.status(403).json({ error: 'Tidak memiliki hak akses untuk mengubah pembayaran ini' });
  }

  const oldVal = { ...payment };

  if (canManage) {
    if (status !== undefined) payment.status = status;
    if (paid_amount !== undefined) payment.paid_amount = Number(paid_amount);
    if (payment_method !== undefined) payment.payment_method = payment_method;
    if (notes !== undefined) payment.notes = notes;
    if (status === 'paid') {
      payment.paid_at = new Date().toISOString();
      payment.verified_by = req.user!.name;

      // Automatically create an income transaction when payment is marked paid
      const autoTx: Transaction = {
        id: `tx_pay_${payment.id}`,
        class_id: db.classInfo.id,
        code: `TRX-KAS-${String(db.transactions.length + 1).padStart(3, '0')}`,
        type: 'income',
        amount: payment.paid_amount || payment.amount,
        category_id: 'cat_kas_rutin',
        category_name: 'Kas Rutin Bulanan',
        description: `Setoran kas ${payment.bill_title || 'Iuran'} dari ${payment.user_name} (${payment.user_nim})`,
        receipt_url: payment.proof_url || '',
        created_by: req.user!.id,
        creator_name: req.user!.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      db.transactions.push(autoTx);

      db.pushNotification({
        userId: payment.user_id,
        title: 'Pembayaran Kas Diterima',
        message: `Pembayaran ${payment.bill_title} Anda telah diverifikasi oleh Bendahara.`,
        type: 'payment',
        link: '/finance',
      });
    }
  } else if (isOwner) {
    // Member uploading proof
    if (proof_url !== undefined) payment.proof_url = proof_url;
    if (payment_method !== undefined) payment.payment_method = payment_method;
    payment.status = 'pending';
    payment.notes = 'Bukti pembayaran diunggah oleh mahasiswa, menunggu verifikasi.';
  }

  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_PAYMENT',
    entityType: 'Payment',
    entityId: payment.id,
    oldValue: oldVal,
    newValue: payment,
  });

  res.json(payment);
});

// --- KAS CHECKLIST TABLE ---
apiRouter.get('/finance/kas-table', (_req: AuthenticatedRequest, res: Response) => {
  // Ensure every active user has an entry for each column
  for (const col of db.kasColumns) {
    for (const user of db.users) {
      const exists = db.kasEntries.some(e => e.column_id === col.id && e.user_id === user.id);
      if (!exists) {
        db.kasEntries.push({
          id: `ke_${col.id}_${user.id}`,
          column_id: col.id,
          user_id: user.id,
          user_name: user.name,
          user_nim: user.nim,
          is_paid: false,
          paid_amount: col.amount,
          updated_by: 'System',
        });
      }
    }
  }

  res.json({
    columns: db.kasColumns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    entries: db.kasEntries,
    students: db.users.filter(u => u.is_active),
  });
});

apiRouter.post('/finance/kas-columns', (req: AuthenticatedRequest, res: Response) => {
  const { title, date, amount, period_type } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'Judul dan nominal kas wajib diisi' });
  }

  const newCol: KasCollectionColumn = {
    id: `col_${Date.now()}`,
    title,
    date: date || new Date().toISOString().split('T')[0],
    amount: Number(amount),
    period_type: period_type || 'weekly',
    created_by: req.user?.id || 'usr_member_25',
    created_at: new Date().toISOString(),
  };

  db.kasColumns.push(newCol);

  // Initialize entries for all active students
  db.users.forEach(user => {
    db.kasEntries.push({
      id: `ke_${newCol.id}_${user.id}`,
      column_id: newCol.id,
      user_id: user.id,
      user_name: user.name,
      user_nim: user.nim,
      is_paid: false,
      paid_amount: newCol.amount,
      updated_by: req.user?.name || 'Admin',
    });
  });

  res.status(201).json(newCol);
});

apiRouter.post('/finance/kas-checklist/toggle', (req: AuthenticatedRequest, res: Response) => {
  const { column_id, user_id, is_paid, payment_method, notes } = req.body;
  let entry = db.kasEntries.find(e => e.column_id === column_id && e.user_id === user_id);
  const col = db.kasColumns.find(c => c.id === column_id);
  const student = db.users.find(u => u.id === user_id);

  if (!entry) {
    if (!col || !student) {
      return res.status(404).json({ error: 'Data kolom atau mahasiswa tidak ditemukan' });
    }
    entry = {
      id: `ke_${column_id}_${user_id}`,
      column_id,
      user_id,
      user_name: student.name,
      user_nim: student.nim,
      is_paid: false,
      paid_amount: col.amount,
    };
    db.kasEntries.push(entry);
  }

  const wasPaid = entry.is_paid;
  entry.is_paid = Boolean(is_paid);
  entry.payment_method = payment_method || (entry.is_paid ? 'cash' : undefined);
  entry.notes = notes || entry.notes;
  entry.paid_at = entry.is_paid ? (entry.paid_at || new Date().toISOString()) : undefined;
  entry.updated_by = req.user?.name || 'Bendahara';

  // If status changed to paid, create a Transaction in db.transactions to sync with balance & transparency
  if (!wasPaid && entry.is_paid) {
    const txId = `tx_kas_${entry.column_id}_${entry.user_id}`;
    const existingTx = db.transactions.find(t => t.id === txId);
    if (!existingTx) {
      db.transactions.push({
        id: txId,
        class_id: db.classInfo.id,
        code: `KAS-${Date.now().toString().slice(-4)}`,
        type: 'income',
        amount: col ? col.amount : 5000,
        category_id: 'cat_kas_rutin',
        category_name: 'Kas Rutin Bulanan',
        description: `Iuran Kas [${col?.title || 'Rutin'}]: ${student?.name || entry.user_name}`,
        receipt_url: '',
        created_by: req.user?.id || 'usr_member_25',
        creator_name: req.user?.name || 'Bendahara',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });
    }
  } else if (wasPaid && !entry.is_paid) {
    // If unchecked, mark corresponding transaction as deleted
    const txId = `tx_kas_${entry.column_id}_${entry.user_id}`;
    const tx = db.transactions.find(t => t.id === txId);
    if (tx) {
      tx.deleted_at = new Date().toISOString();
    }
  }

  res.json({ success: true, entry });
});

apiRouter.delete('/finance/kas-columns/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.kasColumns = db.kasColumns.filter(c => c.id !== id);
  db.kasEntries = db.kasEntries.filter(e => e.column_id !== id);
  res.json({ success: true });
});

// --- DYNAMIC SEMESTER & COURSES SETTINGS ---
apiRouter.get('/settings/semesters', (_req: AuthenticatedRequest, res: Response) => {
  const currentSemester = String(db.classInfo.semester || 'Semester 1 (Ganjil)');
  const academicYear = String(db.classInfo.academic_year || '2026/2027');

  const formattedSemesters = db.semesters.map((sem, idx) => {
    const isActive =
      sem === currentSemester ||
      (typeof db.classInfo.semester === 'number' && sem.startsWith(`Semester ${db.classInfo.semester}`));
    return {
      id: `sem_${idx + 1}`,
      name: sem,
      academic_year: academicYear,
      is_active: isActive,
    };
  });

  res.json(formattedSemesters);
});

apiRouter.post('/settings/semesters', (req: AuthenticatedRequest, res: Response) => {
  const { name, academic_year } = req.body;
  if (name && !db.semesters.includes(name)) {
    db.semesters.push(name);
  }
  if (academic_year) {
    db.classInfo.academic_year = academic_year;
  }

  const currentSemester = String(db.classInfo.semester || 'Semester 1 (Ganjil)');
  const currentAcademicYear = String(db.classInfo.academic_year || '2026/2027');

  const formattedSemesters = db.semesters.map((sem, idx) => ({
    id: `sem_${idx + 1}`,
    name: sem,
    academic_year: currentAcademicYear,
    is_active: sem === currentSemester,
  }));

  res.json(formattedSemesters);
});

const handleActiveSemester = (req: AuthenticatedRequest, res: Response) => {
  const { semesterId, semester, academic_year } = req.body;
  let targetSemester = semester;
  if (!targetSemester && semesterId) {
    if (String(semesterId).startsWith('sem_')) {
      const idx = parseInt(String(semesterId).replace('sem_', ''), 10) - 1;
      targetSemester = db.semesters[idx] || semesterId;
    } else {
      targetSemester = semesterId;
    }
  }

  if (targetSemester) {
    db.classInfo.semester = targetSemester;
  }
  if (academic_year) {
    db.classInfo.academic_year = academic_year;
  }
  db.classInfo.updated_at = new Date().toISOString();

  res.json({
    success: true,
    classInfo: db.classInfo,
  });
};

apiRouter.post('/settings/active-semester', handleActiveSemester);
apiRouter.put('/settings/active-semester', handleActiveSemester);

// --- AGENDA & CALENDAR ---
apiRouter.get('/agenda', requirePermission('view_agenda'), (_req, res: Response) => {
  res.json(db.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
});

apiRouter.post('/agenda', requirePermission('create_agenda'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, type, date, start_time, end_time, location, pic_user_id, reminder_minutes } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Judul dan tanggal agenda wajib diisi' });

  const pic = db.users.find(u => u.id === pic_user_id);

  const newEvent: EventItem = {
    id: `evt_${Date.now()}`,
    class_id: db.classInfo.id,
    title,
    description: description || '',
    type: type || 'lecture',
    date,
    start_time: start_time || '08:00',
    end_time: end_time || '10:00',
    location: location || 'Ruang Kuliah',
    pic_user_id: pic_user_id || req.user!.id,
    pic_name: pic ? pic.name : req.user!.name,
    status: 'upcoming',
    reminder_minutes: reminder_minutes || 60,
  };

  db.events.push(newEvent);
  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_AGENDA',
    entityType: 'Event',
    entityId: newEvent.id,
    newValue: newEvent,
  });

  res.status(201).json(newEvent);
});

apiRouter.put('/agenda/:id', requirePermission('edit_agenda'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const evt = db.events.find(e => e.id === id);
  if (!evt) return res.status(404).json({ error: 'Agenda tidak ditemukan' });

  const oldVal = { ...evt };
  Object.assign(evt, req.body);

  db.logAudit({
    userId: req.user!.id,
    action: 'EDIT_AGENDA',
    entityType: 'Event',
    entityId: evt.id,
    oldValue: oldVal,
    newValue: evt,
  });

  res.json(evt);
});

apiRouter.delete('/agenda/:id', requirePermission('delete_agenda'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Agenda tidak ditemukan' });

  const deleted = db.events.splice(idx, 1)[0];
  db.logAudit({
    userId: req.user!.id,
    action: 'DELETE_AGENDA',
    entityType: 'Event',
    entityId: deleted.id,
    oldValue: deleted,
  });

  res.json({ success: true, message: 'Agenda dihapus' });
});

// --- ANNOUNCEMENTS ---
apiRouter.get('/announcements', requirePermission('view_announcements'), (_req, res: Response) => {
  res.json(
    [...db.announcements].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
  );
});

apiRouter.post('/announcements', requirePermission('create_announcements'), (req: AuthenticatedRequest, res: Response) => {
  const { title, content, target_type, is_pinned, attachment_url } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi' });

  const newAnn: Announcement = {
    id: `ann_${Date.now()}`,
    class_id: db.classInfo.id,
    title,
    content,
    target_type: target_type || 'all',
    is_pinned: Boolean(is_pinned),
    publish_date: new Date().toISOString(),
    author_id: req.user!.id,
    author_name: req.user!.name,
    attachment_url: attachment_url || '',
    created_at: new Date().toISOString(),
  };

  db.announcements.unshift(newAnn);

  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: newAnn.id,
    newValue: newAnn,
  });

  // Broadcast notification
  db.pushNotification({
    userId: 'all',
    title: `Pengumuman: ${newAnn.title}`,
    message: newAnn.content.slice(0, 80) + '...',
    type: 'announcement',
    link: '/announcements',
  });

  res.status(201).json(newAnn);
});

apiRouter.delete('/announcements/:id', requirePermission('delete_announcements'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.announcements.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pengumuman tidak ditemukan' });

  const deleted = db.announcements.splice(idx, 1)[0];
  db.logAudit({
    userId: req.user!.id,
    action: 'DELETE_ANNOUNCEMENT',
    entityType: 'Announcement',
    entityId: deleted.id,
    oldValue: deleted,
  });

  res.json({ success: true });
});

// --- MEETINGS & MINUTES ---
apiRouter.get('/meetings', requirePermission('view_meetings'), (_req, res: Response) => {
  res.json(db.meetings);
});

apiRouter.post('/meetings', requirePermission('create_meetings'), (req: AuthenticatedRequest, res: Response) => {
  const { title, date, start_time, end_time, location, pic_id } = req.body;
  const pic = db.users.find(u => u.id === pic_id) || req.user;

  const newMeeting: Meeting = {
    id: `meet_${Date.now()}`,
    class_id: db.classInfo.id,
    title,
    date,
    start_time: start_time || '16:00',
    end_time: end_time || '18:00',
    location: location || 'Gedung Kuliah',
    status: 'scheduled',
    pic_id: pic!.id,
    pic_name: pic!.name,
    created_at: new Date().toISOString(),
  };

  db.meetings.push(newMeeting);
  db.logAudit({
    userId: req.user!.id,
    action: 'CREATE_MEETING',
    entityType: 'Meeting',
    entityId: newMeeting.id,
    newValue: newMeeting,
  });

  res.status(201).json(newMeeting);
});

apiRouter.put('/meetings/:id/minutes', requirePermission('edit_minutes'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const meeting = db.meetings.find(m => m.id === id);
  if (!meeting) return res.status(404).json({ error: 'Rapat tidak ditemukan' });

  const { agenda, discussion, decisions, action_items } = req.body;

  meeting.minutes = {
    id: `min_${meeting.id}`,
    meeting_id: meeting.id,
    agenda: agenda || '',
    discussion: discussion || '',
    decisions: decisions || '',
    action_items: Array.isArray(action_items) ? action_items : [],
    created_by: req.user!.id,
    created_by_name: req.user!.name,
    updated_at: new Date().toISOString(),
  };
  meeting.status = 'finished';

  db.logAudit({
    userId: req.user!.id,
    action: 'SAVE_MEETING_MINUTES',
    entityType: 'MeetingMinute',
    entityId: meeting.minutes.id,
    newValue: meeting.minutes,
  });

  res.json(meeting);
});

// --- TASKS ---
apiRouter.get('/tasks', requirePermission('view_tasks'), (_req, res: Response) => {
  res.json(db.tasks);
});

apiRouter.post('/tasks', requirePermission('create_tasks'), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, assignee_id, priority, deadline } = req.body;
  if (!title) return res.status(400).json({ error: 'Judul tugas wajib diisi' });

  const assignee = db.users.find(u => u.id === assignee_id);

  const newTask: TaskItem = {
    id: `tsk_${Date.now()}`,
    class_id: db.classInfo.id,
    title,
    description: description || '',
    assignee_id: assignee_id || req.user!.id,
    assignee_name: assignee ? assignee.name : req.user!.name,
    creator_id: req.user!.id,
    creator_name: req.user!.name,
    priority: priority || 'medium',
    deadline: deadline || new Date().toISOString().split('T')[0],
    status: 'todo',
    created_at: new Date().toISOString(),
  };

  db.tasks.push(newTask);

  if (assignee && assignee.id !== req.user!.id) {
    db.pushNotification({
      userId: assignee.id,
      title: 'Tugas Baru Diberikan',
      message: `Anda ditugaskan pada: "${newTask.title}". Deadline: ${newTask.deadline}`,
      type: 'task',
      link: '/tasks',
    });
  }

  res.status(201).json(newTask);
});

apiRouter.put('/tasks/:id', requirePermission('edit_tasks'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

  Object.assign(task, req.body);
  res.json(task);
});

apiRouter.delete('/tasks/:id', requirePermission('delete_tasks'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

  db.tasks.splice(idx, 1);
  res.json({ success: true });
});

// --- DOCUMENTS ---
apiRouter.get('/documents', requirePermission('view_documents'), (req: AuthenticatedRequest, res: Response) => {
  const isManagement = req.role?.id !== 'role_anggota';
  let docs = [...db.documents];
  if (!isManagement) {
    docs = docs.filter(d => d.permission_level === 'public');
  }
  res.json(docs);
});

apiRouter.post('/documents', requirePermission('upload_documents'), (req: AuthenticatedRequest, res: Response) => {
  const { name, category, file_url, file_size, version, permission_level } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama dokumen wajib diisi' });

  const newDoc: DocumentItem = {
    id: `doc_${Date.now()}`,
    class_id: db.classInfo.id,
    name,
    category: category || 'material',
    file_url: file_url || 'https://example.com/download-doc',
    file_size: file_size || '1.2 MB',
    uploader_id: req.user!.id,
    uploader_name: req.user!.name,
    version: version || 'v1.0',
    permission_level: permission_level || 'public',
    uploaded_at: new Date().toISOString(),
  };

  db.documents.push(newDoc);
  res.status(201).json(newDoc);
});

apiRouter.delete('/documents/:id', requirePermission('delete_documents'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.documents.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

  db.documents.splice(idx, 1);
  res.json({ success: true });
});

// --- POLLS / VOTING ---
apiRouter.get('/polls', requirePermission('view_polls'), (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const pollsWithUserVote = db.polls.map(p => {
    const userVote = db.pollVotes.find(v => v.poll_id === p.id && v.user_id === userId);
    return {
      ...p,
      user_voted_option_id: userVote ? userVote.option_id : undefined,
    };
  });
  res.json(pollsWithUserVote);
});

apiRouter.post('/polls', requirePermission('create_polls'), (req: AuthenticatedRequest, res: Response) => {
  const { question, description, deadline, options, is_anonymous } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Pertanyaan dan minimal 2 pilihan wajib diisi' });
  }

  const pollId = `pol_${Date.now()}`;
  const newPoll: Poll = {
    id: pollId,
    class_id: db.classInfo.id,
    question,
    description: description || '',
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
    target: 'Semua Anggota',
    is_anonymous: Boolean(is_anonymous),
    created_by: req.user!.id,
    creator_name: req.user!.name,
    created_at: new Date().toISOString(),
    options: options.map((optText: string, i: number) => ({
      id: `opt_${pollId}_${i + 1}`,
      poll_id: pollId,
      text: optText,
      vote_count: 0,
    })),
    total_votes: 0,
  };

  db.polls.push(newPoll);
  res.status(201).json(newPoll);
});

apiRouter.post('/polls/:id/vote', requirePermission('vote_polls'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { option_id } = req.body;
  const poll = db.polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Polling tidak ditemukan' });

  const userId = req.user!.id;
  const existingVote = db.pollVotes.find(v => v.poll_id === id && v.user_id === userId);
  if (existingVote) {
    return res.status(400).json({ error: 'Anda sudah pernah memberikan suara pada polling ini' });
  }

  const option = poll.options.find(o => o.id === option_id);
  if (!option) return res.status(400).json({ error: 'Pilihan tidak valid' });

  option.vote_count += 1;
  poll.total_votes += 1;

  db.pollVotes.push({
    id: `vote_${Date.now()}`,
    poll_id: id,
    option_id,
    user_id: userId,
    voted_at: new Date().toISOString(),
  });

  res.json({ success: true, poll });
});

// --- ATTENDANCE ---
apiRouter.get('/attendance', requirePermission('view_attendance'), (_req, res: Response) => {
  res.json(db.attendances);
});

apiRouter.post('/attendance', requirePermission('manage_attendance'), (req: AuthenticatedRequest, res: Response) => {
  const { title, date, records } = req.body;
  if (!title || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Judul dan data absensi wajib disertakan' });
  }

  records.forEach((r: { user_id: string; status: AttendanceRecord['status']; notes?: string }) => {
    const user = db.users.find(u => u.id === r.user_id);
    db.attendances.push({
      id: `att_${Date.now()}_${r.user_id}`,
      class_id: db.classInfo.id,
      title,
      date: date || new Date().toISOString().split('T')[0],
      type: 'manual',
      user_id: r.user_id,
      user_name: user?.name || '',
      user_nim: user?.nim || '',
      status: r.status,
      notes: r.notes,
      recorded_by: req.user!.name,
      recorded_at: new Date().toISOString(),
    });
  });

  res.status(201).json({ success: true, count: records.length });
});

// --- NOTIFICATIONS ---
apiRouter.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userNotifs = db.notifications.filter(n => n.user_id === userId || n.user_id === 'all');
  res.json(userNotifs);
});

apiRouter.post('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) notif.is_read = true;
  res.json({ success: true });
});

// --- AUDIT LOGS ---
apiRouter.get('/audit-logs', requirePermission('view_audit_logs'), (_req, res: Response) => {
  res.json(db.auditLogs);
});

// --- REPORTS & EXPORTS ---
apiRouter.get('/reports/arrears', requirePermission('view_financial_report'), (_req, res: Response) => {
  const arrears = db.payments.filter(p => p.status === 'unpaid' || p.status === 'pending');
  res.json(arrears);
});

// --- BACKUP & SYSTEM SETTINGS ---
apiRouter.get('/system/backup', requirePermission('manage_system_settings'), (_req, res: Response) => {
  res.json({
    app_version: '2.1.0',
    exported_at: new Date().toISOString(),
    data: {
      classInfo: db.classInfo,
      roles: db.roles,
      users: db.users,
      courses: db.courses,
      assignments: db.assignments,
      submissions: db.submissions,
      transactions: db.transactions,
      bills: db.bills,
      payments: db.payments,
      events: db.events,
      announcements: db.announcements,
      meetings: db.meetings,
      tasks: db.tasks,
      documents: db.documents,
      polls: db.polls,
      attendance: db.attendances,
      auditLogs: db.auditLogs,
    },
  });
});

// --- COURSES & ASSIGNMENTS ---
apiRouter.get('/courses', (_req: AuthenticatedRequest, res: Response) => {
  res.json(db.courses);
});

apiRouter.post('/courses', (req: AuthenticatedRequest, res: Response) => {
  const { name, code, sks, lecturer_name, lecturer_phone, description, room, schedule_day, schedule_time } = req.body;
  if (!name || !lecturer_name) {
    return res.status(400).json({ error: 'Nama mata kuliah dan dosen wajib diisi' });
  }

  const newCourse = {
    id: `crs_${Date.now()}`,
    name,
    code: code || `MK${Math.floor(100 + Math.random() * 900)}`,
    sks: Number(sks) || 2,
    lecturer_name,
    lecturer_phone: lecturer_phone || '',
    description: description || '',
    room: room || '',
    schedule_day: schedule_day || '',
    schedule_time: schedule_time || '',
    color: 'blue',
  };

  db.courses.push(newCourse);
  res.status(201).json(newCourse);
});

apiRouter.put('/courses/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const course = db.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });

  Object.assign(course, req.body);
  res.json(course);
});

apiRouter.delete('/courses/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.courses.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });

  db.courses.splice(idx, 1);
  res.json({ success: true });
});

// Assignments
apiRouter.get('/assignments', (_req: AuthenticatedRequest, res: Response) => {
  const assignmentsWithCounts = db.assignments.map(a => {
    const subs = db.submissions.filter(s => s.assignment_id === a.id);
    return {
      ...a,
      submission_count: subs.length,
    };
  });
  res.json(assignmentsWithCounts);
});

apiRouter.post('/assignments', (req: AuthenticatedRequest, res: Response) => {
  const { course_id, title, description, deadline, drive_folder_url } = req.body;
  if (!course_id || !title || !deadline) {
    return res.status(400).json({ error: 'Mata kuliah, judul tugas, dan tenggat waktu wajib diisi' });
  }

  const course = db.courses.find(c => c.id === course_id);
  const newAssignment = {
    id: `asg_${Date.now()}`,
    course_id,
    course_name: course?.name || 'Mata Kuliah',
    title,
    description: description || '',
    deadline,
    drive_folder_url: drive_folder_url || '',
    created_by: req.user!.id,
    creator_name: req.user!.name,
    created_at: new Date().toISOString(),
    submission_count: 0,
  };

  db.assignments.unshift(newAssignment);
  
  // Push notification
  db.pushNotification({
    userId: 'all',
    title: `Tugas Baru: ${newAssignment.title} (${course?.name || ''})`,
    message: `Tugas baru telah diterbitkan. Batas pengumpulan: ${new Date(deadline).toLocaleDateString('id-ID')}`,
    type: 'task',
    link: '/courses',
  });

  res.status(201).json(newAssignment);
});

apiRouter.delete('/assignments/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const idx = db.assignments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

  db.assignments.splice(idx, 1);
  db.submissions = db.submissions.filter(s => s.assignment_id !== id);
  res.json({ success: true });
});

// Submissions
apiRouter.get('/assignments/:id/submissions', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const subs = db.submissions.filter(s => s.assignment_id === id);
  res.json(subs);
});

apiRouter.post('/assignments/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { submission_url, notes } = req.body;

  if (!submission_url) {
    return res.status(400).json({ error: 'Link pengumpulan (Google Drive / tautan tugas) wajib diisi' });
  }

  const assignment = db.assignments.find(a => a.id === id);
  if (!assignment) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

  const userId = req.user!.id;
  const existingSubIdx = db.submissions.findIndex(s => s.assignment_id === id && s.user_id === userId);

  const isLate = new Date().getTime() > new Date(assignment.deadline).getTime();

  const submissionData = {
    id: existingSubIdx >= 0 ? db.submissions[existingSubIdx].id : `sub_${Date.now()}`,
    assignment_id: id,
    user_id: userId,
    user_name: req.user!.name,
    user_nim: req.user!.nim,
    submission_url,
    notes: notes || '',
    submitted_at: new Date().toISOString(),
    status: (isLate ? 'late' : 'submitted') as 'late' | 'submitted',
  };

  if (existingSubIdx >= 0) {
    db.submissions[existingSubIdx] = submissionData;
  } else {
    db.submissions.push(submissionData);
  }

  res.status(201).json({ success: true, submission: submissionData });
});

// --- SYLLABUS & RPS MODULE ---
apiRouter.get('/courses/:id/syllabus', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const course = db.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });

  let syllabus = db.syllabuses.find(s => s.course_id === id);
  if (!syllabus) {
    syllabus = {
      id: `syl_${id}`,
      course_id: id,
      course_name: course.name,
      academic_year: '2026/2027',
      semester: 'Semester 1',
      rps_document_url: '',
      drive_folder_url: '',
      assessment_criteria: { attendance: 10, tasks: 20, uts: 35, uas: 35 },
      meetings: [
        { meeting_no: 1, topic: 'Kontrak Perkuliahan & Pengantar Mata Kuliah', subtopics: ['Aturan Kelas', 'Silabus Semester', 'Sistem Penilaian'], learning_outcome: 'Memahami sasaran capaian pembelajaran mata kuliah.' }
      ],
    };
    db.syllabuses.push(syllabus);
  }

  res.json(syllabus);
});

apiRouter.put('/courses/:id/syllabus', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rps_document_url, drive_folder_url, assessment_criteria, meetings } = req.body;
  const course = db.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: 'Mata kuliah tidak ditemukan' });

  let syllabusIndex = db.syllabuses.findIndex(s => s.course_id === id);
  if (syllabusIndex === -1) {
    const newSyl = {
      id: `syl_${id}`,
      course_id: id,
      course_name: course.name,
      academic_year: '2026/2027',
      semester: 'Semester 1',
      rps_document_url: rps_document_url || '',
      drive_folder_url: drive_folder_url || '',
      assessment_criteria: assessment_criteria || { attendance: 10, tasks: 20, uts: 35, uas: 35 },
      meetings: meetings || [],
    };
    db.syllabuses.push(newSyl);
    syllabusIndex = db.syllabuses.length - 1;
  } else {
    db.syllabuses[syllabusIndex] = {
      ...db.syllabuses[syllabusIndex],
      rps_document_url: rps_document_url ?? db.syllabuses[syllabusIndex].rps_document_url,
      drive_folder_url: drive_folder_url ?? db.syllabuses[syllabusIndex].drive_folder_url,
      assessment_criteria: assessment_criteria ?? db.syllabuses[syllabusIndex].assessment_criteria,
      meetings: meetings ?? db.syllabuses[syllabusIndex].meetings,
    };
  }

  res.json({ success: true, syllabus: db.syllabuses[syllabusIndex] });
});

// --- WEBHOOKS & BOT PENGINGAT ---
apiRouter.get('/webhooks/config', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    config: db.webhookConfig,
    logs: db.webhookLogs,
  });
});

apiRouter.put('/webhooks/config', (req: AuthenticatedRequest, res: Response) => {
  const { whatsapp_webhook_url, telegram_bot_token, telegram_chat_id, is_enabled, events } = req.body;
  
  db.webhookConfig = {
    ...db.webhookConfig,
    whatsapp_webhook_url: whatsapp_webhook_url !== undefined ? whatsapp_webhook_url : db.webhookConfig.whatsapp_webhook_url,
    telegram_bot_token: telegram_bot_token !== undefined ? telegram_bot_token : db.webhookConfig.telegram_bot_token,
    telegram_chat_id: telegram_chat_id !== undefined ? telegram_chat_id : db.webhookConfig.telegram_chat_id,
    is_enabled: is_enabled !== undefined ? is_enabled : db.webhookConfig.is_enabled,
    events: events !== undefined ? events : db.webhookConfig.events,
    last_triggered_at: new Date().toISOString(),
  };

  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_WEBHOOK_CONFIG',
    entityType: 'SystemSettings',
    entityId: db.webhookConfig.id,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, config: db.webhookConfig });
});

apiRouter.post('/webhooks/test', async (req: AuthenticatedRequest, res: Response) => {
  const { message, target } = req.body;
  const testMessage = message || 'Tes konektivitas Webhook Bot Notifikasi Kelas 01SAKP014 berhasil terhubung dengan lancar.';
  
  const log = await db.dispatchWebhook('TEST_PING', 'Tes Webhook Notifikasi', testMessage);
  res.json({ success: true, log });
});

apiRouter.post('/webhooks/trigger-reminder', async (req: AuthenticatedRequest, res: Response) => {
  // Check upcoming assignments (deadline < 48h)
  const now = new Date().getTime();
  const upcomingAssignments = db.assignments.filter(a => {
    const diff = new Date(a.deadline).getTime() - now;
    return diff > 0 && diff <= 48 * 3600000;
  });

  const remindersSent: string[] = [];

  for (const asg of upcomingAssignments) {
    const hoursLeft = Math.round((new Date(asg.deadline).getTime() - now) / 3600000);
    const msg = `⚠️ PENGINGAT DEADLINE TUGAS (H-${Math.ceil(hoursLeft / 24)})\n\nMata Kuliah: ${asg.course_name || 'Matkul'}\nJudul: ${asg.title}\nSisa Waktu: ±${hoursLeft} Jam lagi\nBatas Pengumpulan: ${new Date(asg.deadline).toLocaleString('id-ID')}\n\nSegera kumpulkan link Google Drive / tugas Anda melalui aplikasi Kelas Manajer.`;
    await db.dispatchWebhook('PENGINGAT_TUGAS_H1', `H-1 Deadline: ${asg.title}`, msg);
    remindersSent.push(asg.title);
  }

  // Check upcoming meetings (<24h)
  const upcomingMeetings = db.meetings.filter(m => {
    const diff = new Date(m.date).getTime() - now;
    return diff > 0 && diff <= 24 * 3600000;
  });

  for (const meet of upcomingMeetings) {
    const msg = `📅 PENGINGAT RAPAT KELAS\n\nAgenda: ${meet.title}\nWaktu: ${meet.date} (${meet.start_time} - ${meet.end_time})\nLokasi: ${meet.location}\n\nHarap hadir tepat waktu demi kelancaran koordinasi kelas 01SAKP014.`;
    await db.dispatchWebhook('PENGINGAT_RAPAT', `Rapat: ${meet.title}`, msg);
    remindersSent.push(`Rapat: ${meet.title}`);
  }

  if (remindersSent.length === 0) {
    const generalMsg = `✅ Semua jadwal tugas dan agenda perkuliahan terpantau aman terkendali. Tidak ada deadline mendesak dalam 24 jam ke depan.`;
    await db.dispatchWebhook('BOT_CHECK_STATUS', 'Status Terkini Kelas 01SAKP014', generalMsg);
  }

  res.json({
    success: true,
    triggeredCount: remindersSent.length,
    remindersSent,
    logs: db.webhookLogs,
  });
});

// --- PAYMENT GATEWAY (MIDTRANS / XENDIT / QRIS / VA) ---
apiRouter.get('/payments/config', (req: AuthenticatedRequest, res: Response) => {
  res.json(db.paymentGatewayConfig);
});

apiRouter.put('/payments/config', (req: AuthenticatedRequest, res: Response) => {
  const { provider, is_active, merchant_id, client_key, server_key, enable_va_bca, enable_va_mandiri, enable_va_bri, enable_va_bni, enable_qris } = req.body;
  
  db.paymentGatewayConfig = {
    ...db.paymentGatewayConfig,
    provider: provider ?? db.paymentGatewayConfig.provider,
    is_active: is_active ?? db.paymentGatewayConfig.is_active,
    merchant_id: merchant_id ?? db.paymentGatewayConfig.merchant_id,
    client_key: client_key ?? db.paymentGatewayConfig.client_key,
    server_key: server_key ?? db.paymentGatewayConfig.server_key,
    enable_va_bca: enable_va_bca ?? db.paymentGatewayConfig.enable_va_bca,
    enable_va_mandiri: enable_va_mandiri ?? db.paymentGatewayConfig.enable_va_mandiri,
    enable_va_bri: enable_va_bri ?? db.paymentGatewayConfig.enable_va_bri,
    enable_va_bni: enable_va_bni ?? db.paymentGatewayConfig.enable_va_bni,
    enable_qris: enable_qris ?? db.paymentGatewayConfig.enable_qris,
  };

  db.logAudit({
    userId: req.user!.id,
    action: 'UPDATE_PAYMENT_GATEWAY_CONFIG',
    entityType: 'PaymentGateway',
    entityId: 'pg_config',
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, config: db.paymentGatewayConfig });
});

apiRouter.post('/payments/generate-va', (req: AuthenticatedRequest, res: Response) => {
  const { bill_id, bank } = req.body;
  const bill = db.bills.find(b => b.id === bill_id);
  if (!bill) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });

  // Generate realistic 16-digit Virtual Account
  const bankPrefixes: Record<string, string> = {
    bca: '88000',
    mandiri: '89022',
    bri: '10293',
    bni: '98800',
  };

  const selectedBank = (bank || 'bca').toLowerCase();
  const prefix = bankPrefixes[selectedBank] || '88000';
  const rawNim = req.user?.nim || '261011201000';
  const vaNumber = `${prefix}${rawNim.slice(-8)}${Math.floor(100 + Math.random() * 900)}`;

  const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();

  res.json({
    success: true,
    va_number: vaNumber,
    bank: selectedBank.toUpperCase(),
    amount: bill.amount,
    bill_title: bill.title,
    expires_at: expiresAt,
    instructions: [
      `1. Buka aplikasi m-Banking atau ATM ${selectedBank.toUpperCase()}.`,
      `2. Pilih menu Transfer / Bayar > Virtual Account.`,
      `3. Masukkan nomor Virtual Account: ${vaNumber}`,
      `4. Periksa rincian: Iuran Kas Kelas 01SAKP014 - Rp ${bill.amount.toLocaleString('id-ID')}`,
      `5. Konfirmasi pembayaran dan simpan bukti transaksi (status kas akan otomatis lunas).`,
    ],
  });
});

apiRouter.post('/payments/generate-qris', (req: AuthenticatedRequest, res: Response) => {
  const { bill_id } = req.body;
  const bill = db.bills.find(b => b.id === bill_id);
  if (!bill) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });

  const qrisString = `00020101021226600016ID.CO.QRIS.WWW01189360091801SAKP014520458125303360540${bill.amount}5802ID5920KAS KELAS 01SAKP0146009TANGERANG61051541762070703A016304`;

  res.json({
    success: true,
    qris_string: qrisString,
    amount: bill.amount,
    bill_title: bill.title,
    merchant_name: 'KAS KELAS 01SAKP014 UNPAM',
    expires_at: new Date(Date.now() + 15 * 60000).toISOString(), // 15 mins
  });
});

// Instant payment simulation & webhook trigger
apiRouter.post('/payments/webhook-simulate', async (req: AuthenticatedRequest, res: Response) => {
  const { bill_id, payment_method, user_id } = req.body;
  const bill = db.bills.find(b => b.id === bill_id);
  if (!bill) return res.status(404).json({ error: 'Tagihan tidak ditemukan' });

  const targetUserId = user_id || req.user!.id;
  const targetUser = db.users.find(u => u.id === targetUserId);

  // Update existing payment or create one
  let payment = db.payments.find(p => p.bill_id === bill_id && p.user_id === targetUserId);
  if (payment) {
    payment.status = 'paid';
    payment.paid_amount = bill.amount;
    payment.paid_at = new Date().toISOString();
    payment.payment_method = (payment_method || 'Virtual Account BCA') as any;
  } else {
    payment = {
      id: `pay_${Date.now()}`,
      bill_id,
      user_id: targetUserId,
      user_name: targetUser?.name || 'Mahasiswa',
      user_nim: targetUser?.nim || '',
      amount: bill.amount,
      paid_amount: bill.amount,
      status: 'paid',
      payment_method: (payment_method || 'Virtual Account BCA') as any,
      paid_at: new Date().toISOString(),
    };
    db.payments.push(payment);
  }

  // Create real transaction in general ledger automatically
  const transaction = {
    id: `trx_pg_${Date.now()}`,
    code: `TRX-${Date.now().toString().slice(-6)}`,
    class_id: db.classInfo.id,
    type: 'income' as const,
    amount: bill.amount,
    category_id: 'cat_kas_rutin',
    category_name: 'Kas Rutin Bulanan',
    description: `[Auto Payment Gateway] Iuran Kas ${bill.title} - ${targetUser?.name || 'Mahasiswa'}`,
    date: new Date().toISOString().split('T')[0],
    receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500&q=80',
    created_by: 'system_payment_gateway',
    creator_name: 'Payment Gateway (Auto)',
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.transactions.push(transaction);

  // Push user notification
  db.pushNotification({
    userId: targetUserId,
    title: `Pembayaran Berhasil Diterima`,
    message: `Pembayaran iuran ${bill.title} sebesar Rp ${bill.amount.toLocaleString('id-ID')} via ${payment_method || 'Payment Gateway'} telah terverifikasi otomatis.`,
    type: 'payment',
    link: '/my-kas',
  });

  // Dispatch Webhook Notification
  await db.dispatchWebhook(
    'PEMBAYARAN_KAS_LUNAS',
    `Kas Diterima: ${targetUser?.name}`,
    `Pembayaran iuran kas "${bill.title}" dari ${targetUser?.name} (${targetUser?.nim}) sebesar Rp ${bill.amount.toLocaleString('id-ID')} via ${payment_method || 'Payment Gateway'} telah terverifikasi lunas secara otomatis.`
  );

  // Log audit
  db.logAudit({
    userId: targetUserId,
    action: 'AUTO_PAYMENT_VERIFIED',
    entityType: 'Finance',
    entityId: payment.id,
    newValue: { amount: bill.amount, method: payment_method },
    ip: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: 'Pembayaran berhasil diproses dan diverifikasi otomatis',
    payment,
    transaction,
  });
});

