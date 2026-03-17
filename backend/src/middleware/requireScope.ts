import type { Request, Response, NextFunction } from 'express';
import { errors } from '../utils/errors.js';

type Action = 'view' | 'create' | 'edit' | 'delete';

/**
 * Requires the user to have access to the given scope.
 * Super Admin always passes. HR must have the corresponding permission (default: view).
 * Use after authMiddleware and loadScopePermissions.
 */
export function requireScope(scopeId: string, action: Action = 'view') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.roleName === 'super_admin') {
      next();
      return;
    }
    const perms = req.user?.scopePermissions?.[scopeId];
    if (!perms) {
      next(errors.forbidden('You do not have access to this module'));
      return;
    }
    const hasAction =
      action === 'view' ? perms.canView
      : action === 'create' ? perms.canCreate
      : action === 'edit' ? perms.canEdit
      : perms.canDelete;
    if (!hasAction) {
      next(errors.forbidden('You do not have permission for this action'));
      return;
    }
    next();
  };
}

/**
 * Require view access to the scope. For parent scope (e.g. "leave") we allow if user has view on the scope
 * or on any child (e.g. leave.requests). So we check scopeId or scopeId.*
 */
export function requireScopeView(scopeId: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.roleName === 'super_admin') {
      next();
      return;
    }
    const perms = req.user?.scopePermissions;
    if (!perms) {
      next(errors.forbidden('You do not have access to this module'));
      return;
    }
    if (perms[scopeId]?.canView) {
      next();
      return;
    }
    const hasAnyChild = Object.keys(perms).some(
      (key) => key.startsWith(scopeId + '.') && perms[key]?.canView
    );
    if (hasAnyChild) {
      next();
      return;
    }
    next(errors.forbidden('You do not have access to this module'));
  };
}
