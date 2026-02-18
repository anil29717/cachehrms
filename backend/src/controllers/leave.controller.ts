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
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as {
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      totalDays?: number;
      reason?: string;
      documentUrl?: string;
    };
    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (!body.leaveType || !startDate || !endDate) {
      next(errors.badRequest('leaveType, startDate and endDate are required'));
      return;
    }
    const totalDays = body.totalDays ?? (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
    const record = await leaveService.apply(employeeId, {
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
