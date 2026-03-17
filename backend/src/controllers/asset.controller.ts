import type { Request, Response, NextFunction } from 'express';
import { AssetService } from '../services/asset.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new AssetService();

export async function listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const list = await service.list({ categoryId, status, search, limit });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Asset ID required'));
      return;
    }
    const asset = await service.getById(id);
    sendSuccess(res, asset);
  } catch (e) {
    next(e);
  }
}

export async function createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      categoryId?: number;
      name?: string;
      serialNumber?: string;
      purchaseDate?: string;
      condition?: string;
      notes?: string;
    };
    if (body.categoryId == null || !body.name?.trim()) {
      next(errors.badRequest('categoryId and name are required'));
      return;
    }
    const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : undefined;
    const asset = await service.create({
      categoryId: body.categoryId,
      name: body.name,
      serialNumber: body.serialNumber,
      purchaseDate,
      condition: body.condition,
      notes: body.notes,
    });
    sendSuccess(res, asset, 'Asset created');
  } catch (e) {
    next(e);
  }
}

export async function updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as {
      name?: string;
      serialNumber?: string;
      purchaseDate?: string;
      status?: string;
      condition?: string;
      notes?: string;
    };
    if (!id) {
      next(errors.badRequest('Asset ID required'));
      return;
    }
    const purchaseDate = body.purchaseDate !== undefined ? (body.purchaseDate ? new Date(body.purchaseDate) : undefined) : undefined;
    const asset = await service.update(id, {
      ...(body.name != null && { name: body.name }),
      ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ?? undefined }),
      ...(body.status != null && { status: body.status }),
      ...(body.condition !== undefined && { condition: body.condition }),
      ...(body.notes !== undefined && { notes: body.notes }),
    });
    sendSuccess(res, asset, 'Asset updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Asset ID required'));
      return;
    }
    await service.delete(id);
    sendSuccess(res, null, 'Asset deleted');
  } catch (e) {
    next(e);
  }
}
