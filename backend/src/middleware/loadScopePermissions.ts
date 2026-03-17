import type { Request, Response, NextFunction } from 'express';
import { ScopePermissionService } from '../services/scopePermission.service.js';

const scopePermissionService = new ScopePermissionService();

/**
 * Loads scope permissions for hr_admin and attaches to req.user.scopePermissions.
 * Call after authMiddleware. Super Admin is not modified (full access).
 */
export async function loadScopePermissions(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next();
    return;
  }
  if (req.user.roleName === 'super_admin') {
    next();
    return;
  }
  if (req.user.roleName === 'hr_admin') {
    try {
      req.user.scopePermissions = await scopePermissionService.getUserPermissionMap(req.user.userId);
    } catch {
      req.user.scopePermissions = {};
    }
  }
  next();
}
