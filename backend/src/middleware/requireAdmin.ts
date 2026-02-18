import type { Request, Response, NextFunction } from 'express';
import { errors } from '../utils/errors.js';

/** Requires req.user.roleName === 'super_admin'. Use after authMiddleware. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.roleName !== 'super_admin') {
    next(errors.forbidden('Admin access required'));
    return;
  }
  next();
}
