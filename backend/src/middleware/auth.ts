import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';
import type { JwtPayload, RequestUser } from '../types/index.js';
import { ScopePermissionService } from '../services/scopePermission.service.js';

const scopePermissionService = new ScopePermissionService();

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next(errors.unauthorized('Token required'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.type !== 'access') {
      next(errors.unauthorized('Invalid token type'));
      return;
    }
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      employeeId: decoded.employeeId,
    } as RequestUser;
    if (decoded.roleName === 'hr_admin') {
      scopePermissionService.getUserPermissionMap(decoded.sub).then((map) => {
        if (req.user) req.user.scopePermissions = map;
        next();
      }).catch(() => {
        if (req.user) req.user.scopePermissions = {};
        next();
      });
    } else {
      next();
    }
  } catch {
    next(errors.unauthorized('Invalid or expired token'));
  }
}

/** Sets req.user when Bearer token is valid; does not fail when missing or invalid (for optional auth routes). */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (decoded.type === 'access') {
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        roleId: decoded.roleId,
        roleName: decoded.roleName,
        employeeId: decoded.employeeId,
      } as RequestUser;
    }
  } catch {
    /* ignore */
  }
  next();
}
