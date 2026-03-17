import type { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const leaveService = new LeaveService();

export async function getMyBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const list = await leaveService.getMyBalances(employeeId, year);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getMyRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const list = await leaveService.getMyRequests(employeeId, status, limit);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const employeeId = req.user?.employeeId;
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const request = await leaveService.getRequestById(id, employeeId);
    sendSuccess(res, request);
  } catch (e) {
    next(e);
  }
}

export async function applyLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentEmployeeId = req.user?.employeeId;
    const roleName = req.user?.roleName;
    const canApplyOnBehalf = roleName === 'super_admin' || roleName === 'hr_admin';

    const body = req.body as {
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      totalDays?: number;
      reason?: string;
      documentUrl?: string;
      employeeId?: string;
    };

    let targetEmployeeId: string;
    if (body.employeeId && canApplyOnBehalf) {
      if (roleName === 'super_admin' && body.employeeId === currentEmployeeId) {
        next(errors.badRequest('Super admin cannot apply leave for themselves. Please select another employee.'));
        return;
      }
      targetEmployeeId = body.employeeId;
    } else {
      if (!currentEmployeeId) {
        next(errors.unauthorized('Employee not linked'));
        return;
      }
      if (roleName === 'super_admin') {
        next(errors.badRequest('Super admin must select an employee to apply leave for.'));
        return;
      }
      targetEmployeeId = currentEmployeeId;
    }

    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (!body.leaveType || !startDate || !endDate) {
      next(errors.badRequest('leaveType, startDate and endDate are required'));
      return;
    }
    const totalDays = body.totalDays ?? (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
    const record = await leaveService.apply(targetEmployeeId, {
      leaveType: body.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: body.reason,
      documentUrl: body.documentUrl,
    });
    sendSuccess(res, record, 'Leave applied successfully');
  } catch (e) {
    next(e);
  }
}

export async function cancelLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const result = await leaveService.cancelRequest(id, employeeId);
    sendSuccess(res, result, 'Leave request cancelled');
  } catch (e) {
    next(e);
  }
}

export async function listPendingApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const approverEmployeeId = req.user?.employeeId;
    const roleName = req.user?.roleName;
    if (!approverEmployeeId || !roleName) {
      next(errors.unauthorized('Not authenticated'));
      return;
    }
    const departmentId = req.query.departmentId ? parseInt(String(req.query.departmentId), 10) : undefined;
    const list = await leaveService.listPendingForApproval(approverEmployeeId, roleName, departmentId);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function approveLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const employeeId = req.user?.employeeId;
    if (!userId || !employeeId) {
      next(errors.unauthorized('Not authenticated'));
      return;
    }
    const id = req.params.id;
    const body = req.body as { remarks?: string };
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const roleName = req.user?.roleName ?? '';
    const record = await leaveService.approve(id, userId, employeeId, roleName, body.remarks);
    sendSuccess(res, record, 'Leave approved');
  } catch (e) {
    next(e);
  }
}

export async function rejectLeave(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    const employeeId = req.user?.employeeId;
    const roleName = req.user?.roleName ?? '';
    if (!userId) {
      next(errors.unauthorized('Not authenticated'));
      return;
    }
    const id = req.params.id;
    const body = req.body as { remarks?: string };
    if (!id) {
      next(errors.badRequest('Request ID required'));
      return;
    }
    const record = await leaveService.reject(id, userId, employeeId ?? '', roleName, body.remarks);
    sendSuccess(res, record, 'Leave rejected');
  } catch (e) {
    next(e);
  }
}

// --- Super admin: all requests, calendar, all balances, upsert balance, policies ---

export async function listAllRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const list = await leaveService.listAllRequests({ status, employeeId, from, to });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getCalendarEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const employeeId = req.query.employeeId as string | undefined;
    if (!from || !to) {
      next(errors.badRequest('from and to query params (YYYY-MM-DD) are required'));
      return;
    }
    const events = await leaveService.getCalendarEvents(from, to, employeeId);
    sendSuccess(res, events);
  } catch (e) {
    next(e);
  }
}

export async function listAllBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const list = await leaveService.listAllBalances(year, employeeId);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function upsertBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { employeeId: string; leaveType: string; year: number; openingBalance: number; credited?: number };
    if (!body.employeeId || !body.leaveType || body.year == null || body.openingBalance == null) {
      next(errors.badRequest('employeeId, leaveType, year and openingBalance are required'));
      return;
    }
    const record = await leaveService.upsertBalance(
      body.employeeId,
      body.leaveType,
      body.year,
      body.openingBalance,
      body.credited,
    );
    sendSuccess(res, record, 'Balance updated');
  } catch (e) {
    next(e);
  }
}

export async function listPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await leaveService.listPolicies();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { leaveType: string; name: string; defaultDaysPerYear: number; description?: string; isPaid?: boolean };
    if (!body.leaveType || !body.name || body.defaultDaysPerYear == null) {
      next(errors.badRequest('leaveType, name and defaultDaysPerYear are required'));
      return;
    }
    const policy = await leaveService.createPolicy(body);
    sendSuccess(res, policy, 'Policy created');
  } catch (e) {
    next(e);
  }
}

export async function updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Invalid policy ID'));
      return;
    }
    const body = req.body as { name?: string; defaultDaysPerYear?: number; description?: string; isPaid?: boolean };
    const policy = await leaveService.updatePolicy(id, body);
    sendSuccess(res, policy, 'Policy updated');
  } catch (e) {
    next(e);
  }
}
