import type { Request, Response, NextFunction } from 'express';
import { ScopePermissionService } from '../services/scopePermission.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const scopePermissionService = new ScopePermissionService();

export async function getScopesTree(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tree = scopePermissionService.getScopesTree();
    sendSuccess(res, tree);
  } catch (e) {
    next(e);
  }
}

export async function getUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      next(errors.badRequest('userId query is required'));
      return;
    }
    const permissions = await scopePermissionService.getUserPermissions(userId);
    sendSuccess(res, permissions);
  } catch (e) {
    next(e);
  }
}

export async function setUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { userId?: string; permissions?: Array<{ scopeId: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> };
    if (!body.userId || !Array.isArray(body.permissions)) {
      next(errors.badRequest('userId and permissions array are required'));
      return;
    }
    await scopePermissionService.setUserPermissions(body.userId, body.permissions);
    sendSuccess(res, { ok: true }, 'Permissions saved. Changes apply on next login or refresh.');
  } catch (e) {
    next(e);
  }
}
