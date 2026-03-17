import type { Request, Response, NextFunction } from 'express';
import { ExpenseClaimService } from '../services/expenseClaim.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new ExpenseClaimService();

const HR_ROLES = ['super_admin', 'hr_admin'];

export async function listExpenseClaims(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const statusIn = req.query.statusIn as string | undefined; // comma-separated for "approved" view
    const statusInArr = statusIn
      ? statusIn.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const isHR = req.user?.roleName && HR_ROLES.includes(req.user.roleName);
    const employeeId = isHR
      ? (req.query.employeeId as string | undefined)
      : req.user?.employeeId;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;
    const result = await service.list({
      status: statusInArr?.length ? undefined : status,
      statusIn: statusInArr,
      employeeId,
      limit,
      offset,
    });
    sendSuccess(res, result.items, undefined, { total: result.total });
  } catch (e) {
    next(e);
  }
}

export async function getExpenseClaimById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const claim = await service.getById(id);
    sendSuccess(res, claim);
  } catch (e) {
    next(e);
  }
}

export async function createExpenseClaim(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as {
      items?: Array<{
        expenseTypeId: number;
        amount: number;
        quantity?: number | null;
        description?: string | null;
        expenseDate: string;
      }>;
    };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      next(errors.badRequest('items array with at least one item is required'));
      return;
    }
    const claim = await service.create(employeeId, { items: body.items });
    sendSuccess(res, claim, 'Expense claim submitted');
  } catch (e) {
    next(e);
  }
}

export async function approveManager(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const userId = req.user?.userId;
    if (!userId) {
      next(errors.unauthorized('User not found'));
      return;
    }
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const claim = await service.approveManager(id, userId);
    sendSuccess(res, claim, 'Manager approved');
  } catch (e) {
    next(e);
  }
}

export async function approveFinance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const userId = req.user?.userId;
    if (!userId) {
      next(errors.unauthorized('User not found'));
      return;
    }
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const claim = await service.approveFinance(id, userId);
    sendSuccess(res, claim, 'Finance approved');
  } catch (e) {
    next(e);
  }
}

export async function approveHr(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const userId = req.user?.userId;
    if (!userId) {
      next(errors.unauthorized('User not found'));
      return;
    }
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const claim = await service.approveHr(id, userId);
    sendSuccess(res, claim, 'HR approved');
  } catch (e) {
    next(e);
  }
}

export async function markPaid(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const claim = await service.markPaid(id);
    sendSuccess(res, claim, 'Marked as paid');
  } catch (e) {
    next(e);
  }
}

export async function rejectClaim(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const userId = req.user?.userId;
    if (!userId) {
      next(errors.unauthorized('User not found'));
      return;
    }
    if (!id) {
      next(errors.badRequest('Claim ID required'));
      return;
    }
    const body = req.body as { reason?: string };
    const claim = await service.reject(id, userId, body.reason);
    sendSuccess(res, claim, 'Claim rejected');
  } catch (e) {
    next(e);
  }
}

export async function expenseReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const summary = await service.reportSummary();
    sendSuccess(res, summary);
  } catch (e) {
    next(e);
  }
}
