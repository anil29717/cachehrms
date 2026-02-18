import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';
import type { JwtPayload, RequestUser } from '../types/index.js';

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
    next();
  } catch {
    next(errors.unauthorized('Invalid or expired token'));
  }
}
