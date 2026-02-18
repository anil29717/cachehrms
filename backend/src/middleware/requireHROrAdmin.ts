import type { Request, Response, NextFunction } from 'express';
import { errors } from '../utils/errors.js';

/** Requires req.user.roleName to be super_admin or hr_admin. Use after authMiddleware. */
export function requireHROrAdmin(req: Request, _res: Response, next: NextFunction): void {
  const role = req.user?.roleName;
  if (role !== 'super_admin' && role !== 'hr_admin') {
    next(errors.forbidden('HR or Admin access required'));
    return;
  }
  next();
}
