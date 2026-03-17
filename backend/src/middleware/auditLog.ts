import type { Request, Response, NextFunction } from 'express';
import { SystemLogService } from '../services/systemLog.service.js';

const systemLogService = new SystemLogService();

/** Paths we never log (health, the logs endpoint itself) */
const SKIP_PATHS = ['/health', '/system-logs'];

function getClientIp(req: Request): string | undefined {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]?.trim();
  if (Array.isArray(xff) && xff[0]) return xff[0].trim();
  return req.socket?.remoteAddress;
}

/**
 * Middleware that logs every API request after the response is finished.
 * Attach to the API router; req.path is relative to router mount (e.g. /employees).
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.path || '/';

  if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + '?'))) {
    next();
    return;
  }

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const user = req.user;
    systemLogService
      .create({
        userId: user?.userId,
        employeeId: user?.employeeId,
        email: user?.email,
        method: req.method,
        path,
        statusCode,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
      })
      .catch(() => {});
  });

  next();
}
