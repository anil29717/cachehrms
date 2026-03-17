import type { Request, Response, NextFunction } from 'express';
import { MaintenanceRequestService } from '../services/maintenanceRequest.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new MaintenanceRequestService();

export async function listMaintenanceRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assetId = req.query.assetId as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const list = await service.list({ assetId, status, limit });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getMaintenanceRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const request = await service.getById(id);
    sendSuccess(res, request);
  } catch (e) {
    next(e);
  }
}

export async function createMaintenanceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as { assetId?: string; description?: string };
    if (!body.assetId || !body.description?.trim()) {
      next(errors.badRequest('assetId and description are required'));
      return;
    }
    const request = await service.create(employeeId, {
      assetId: body.assetId,
      description: body.description,
    });
    sendSuccess(res, request, 'Service request created');
  } catch (e) {
    next(e);
  }
}

export async function updateMaintenanceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as { status?: string; completedAt?: string; cost?: number; repairNotes?: string };
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const completedAt = body.completedAt ? new Date(body.completedAt) : undefined;
    const result = await service.updateStatus(id, {
      ...(body.status && { status: body.status }),
      ...(completedAt !== undefined && { completedAt }),
      ...(body.cost !== undefined && { cost: body.cost }),
      ...(body.repairNotes !== undefined && { repairNotes: body.repairNotes }),
    });
    sendSuccess(res, result, 'Request updated');
  } catch (e) {
    next(e);
  }
}
