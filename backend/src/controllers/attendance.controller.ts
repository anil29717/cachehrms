import type { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const attendanceService = new AttendanceService();

function getClientIp(req: Request): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

export async function checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const ip = getClientIp(req);
    const record = await attendanceService.checkIn(employeeId, ip);
    sendSuccess(res, record, 'Checked in successfully');
  } catch (e) {
    next(e);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const ip = getClientIp(req);
    const record = await attendanceService.checkOut(employeeId, ip);
    sendSuccess(res, record, 'Checked out successfully');
  } catch (e) {
    next(e);
  }
}

export async function getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const record = await attendanceService.getToday(employeeId);
    sendSuccess(res, record);
  } catch (e) {
    next(e);
  }
}

export async function getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const from = (req.query.from as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 31;
    const result = await attendanceService.getMyHistory(employeeId, from, to, page, limit);
    sendSuccess(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (e) {
    next(e);
  }
}

export async function getTeamAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const managerEmployeeId = req.user?.employeeId;
    if (!managerEmployeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const list = await attendanceService.getTeamAttendance(managerEmployeeId, date);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getDepartmentAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departmentId = req.query.departmentId ? parseInt(String(req.query.departmentId), 10) : undefined;
    if (departmentId == null || Number.isNaN(departmentId)) {
      next(errors.badRequest('departmentId is required'));
      return;
    }
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const list = await attendanceService.getDepartmentAttendance(departmentId, date);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month ? parseInt(String(req.query.month), 10) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();
    const departmentId = req.query.departmentId ? parseInt(String(req.query.departmentId), 10) : undefined;
    if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      next(errors.badRequest('Valid month and year required'));
      return;
    }
    const result = await attendanceService.getMonthlyReport(month, year, departmentId);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
}
