import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.ts';
import { PermissionCode, User, Role } from '../../src/types/index.ts';

export interface AuthenticatedRequest extends Request {
  user?: User;
  role?: Role;
  permissions?: PermissionCode[];
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Read current user ID from header 'x-user-id' (simulating session / token)
  const userId = (req.headers['x-user-id'] as string) || 'usr_superadmin';

  const user = db.users.find(u => u.id === userId && u.is_active);
  if (!user) {
    // Default fallback to first active superadmin if not found
    const fallback = db.users.find(u => u.id === 'usr_superadmin') || db.users[0];
    req.user = fallback;
  } else {
    req.user = user;
  }

  if (req.user) {
    const role = db.roles.find(r => r.id === req.user?.role_id);
    req.role = role;
    req.permissions = role ? role.permissions : [];
  } else {
    req.permissions = [];
  }

  next();
}

export function requirePermission(permission: PermissionCode) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Harap login terlebih dahulu' });
    }

    // Super Admin role always has all permissions
    if (req.role?.id === 'role_superadmin') {
      return next();
    }

    const hasPerm = req.permissions?.includes(permission);
    if (!hasPerm) {
      return res.status(403).json({
        error: `Akses ditolak: Anda tidak memiliki permission '${permission}'.`,
        required_permission: permission,
        user_role: req.role?.name,
      });
    }

    next();
  };
}
