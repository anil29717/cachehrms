import type { Request, Response, NextFunction } from 'express';
import { ApiAccessService } from '../services/apiAccess.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const apiAccessService = new ApiAccessService();

export async function listApiAccess(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await apiAccessService.list();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function createApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { clientName?: string; rateLimitPerHour?: number; expiresAt?: string };
    const record = await apiAccessService.create({
      clientName: body.clientName ?? '',
      rateLimitPerHour: body.rateLimitPerHour,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    sendSuccess(res, record, 'API key created. Copy and store it securely — it will not be shown again.');
  } catch (e) {
    next(e);
  }
}

export async function revokeApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('API access ID required'));
      return;
    }
    await apiAccessService.revoke(id);
    sendSuccess(res, { revoked: true }, 'API key revoked');
  } catch (e) {
    next(e);
  }
}

export async function deleteApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('API access ID required'));
      return;
    }
    await apiAccessService.delete(id);
    sendSuccess(res, { deleted: true }, 'API key deleted');
  } catch (e) {
    next(e);
  }
}

export async function listApiAccessLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = req.query.apiAccessId as string | undefined;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const result = await apiAccessService.listLogs({ apiAccessId, page, limit });
    sendSuccess(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (e) {
    next(e);
  }
}
