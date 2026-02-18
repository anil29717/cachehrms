import type { Request, Response, NextFunction } from 'express';
import { ApiAccessService } from '../services/apiAccess.service.js';
import { checkAndIncrement } from '../utils/apiKeyRateLimit.js';
import { sendError } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const apiAccessService = new ApiAccessService();

/** Validate X-API-Key or Authorization Bearer, check rate limit. Sets req.apiAccessId. */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const keyFromHeader = req.headers['x-api-key'] as string | undefined;
  const authHeader = req.headers.authorization;
  const keyFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const key = keyFromHeader?.trim() || keyFromAuth;

  if (!key) {
    sendError(res, errors.unauthorized('API key required. Use X-API-Key header or Authorization: Bearer <key>'));
    return;
  }

  const valid = await apiAccessService.validateKey(key);
  if (!valid) {
    sendError(res, errors.unauthorized('Invalid or expired API key'));
    return;
  }

  const { allowed } = checkAndIncrement(valid.id, valid.rateLimitPerHour);
  if (!allowed) {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'API call limit exceeded for this hour' },
    });
    return;
  }

  (req as Request & { apiAccessId: string }).apiAccessId = valid.id;
  next();
}
