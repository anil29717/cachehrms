import type { Request, Response, NextFunction } from 'express';
import { AssetAllocationService } from '../services/assetAllocation.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new AssetAllocationService();

export async function listAllocated(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const assetId = req.query.assetId as string | undefined;
    const list = await service.listAllocated({ employeeId, assetId });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function listHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.query.employeeId as string | undefined;
    const assetId = req.query.assetId as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const list = await service.listHistory({ employeeId, assetId, limit });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function assignAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { assetId?: string; employeeId?: string; conditionAtAssignment?: string; notes?: string };
    if (!body.assetId || !body.employeeId) {
      next(errors.badRequest('assetId and employeeId are required'));
      return;
    }
    const allocation = await service.assign({
      assetId: body.assetId,
      employeeId: body.employeeId,
      conditionAtAssignment: body.conditionAtAssignment,
      notes: body.notes,
    });
    sendSuccess(res, allocation, 'Asset assigned');
  } catch (e) {
    next(e);
  }
}

export async function returnAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Allocation ID required'));
      return;
    }
    const result = await service.returnAllocation(id);
    sendSuccess(res, result, 'Asset returned');
  } catch (e) {
    next(e);
  }
}
