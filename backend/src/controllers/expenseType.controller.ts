import type { Request, Response, NextFunction } from 'express';
import { ExpenseTypeService } from '../services/expenseType.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new ExpenseTypeService();

export async function listExpenseTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const isActive =
      req.query.isActive === 'true'
        ? true
        : req.query.isActive === 'false'
          ? false
          : undefined;
    const list = await service.list({ category, isActive });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getExpenseTypeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Valid expense type ID required'));
      return;
    }
    const row = await service.getById(id);
    sendSuccess(res, row);
  } catch (e) {
    next(e);
  }
}

export async function createExpenseType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as {
      category?: string;
      name?: string;
      limitAmount?: number;
      limitUnit?: string | null;
    };
    if (!body.category?.trim() || !body.name?.trim()) {
      next(errors.badRequest('category and name are required'));
      return;
    }
    const created = await service.create({
      category: body.category,
      name: body.name,
      limitAmount: Number(body.limitAmount) ?? 0,
      limitUnit: body.limitUnit,
    });
    sendSuccess(res, created, 'Expense type created');
  } catch (e) {
    next(e);
  }
}

export async function updateExpenseType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Valid expense type ID required'));
      return;
    }
    const body = req.body as {
      category?: string;
      name?: string;
      limitAmount?: number;
      limitUnit?: string | null;
      isActive?: boolean;
    };
    const updated = await service.update(id, {
      category: body.category,
      name: body.name,
      limitAmount: body.limitAmount !== undefined ? Number(body.limitAmount) : undefined,
      limitUnit: body.limitUnit,
      isActive: body.isActive,
    });
    sendSuccess(res, updated, 'Expense type updated');
  } catch (e) {
    next(e);
  }
}
