import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';
import { ApiAccessService } from '../services/apiAccess.service.js';

const apiAccessService = new ApiAccessService();

function getIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return req.socket?.remoteAddress;
}

/** GET /integration/employees - list employees (basic info) for external API */
export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = (req as Request & { apiAccessId?: string }).apiAccessId;
    if (apiAccessId) await apiAccessService.touchLastUsed(apiAccessId);

    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        employmentType: true,
        dateOfJoining: true,
        department: { select: { name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });
    const withDepartment = employees.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      designation: e.designation,
      employmentType: e.employmentType,
      dateOfJoining: e.dateOfJoining,
      departmentName: e.department?.name ?? null,
    }));
    if (apiAccessId) await apiAccessService.logCall(apiAccessId, req.method, req.path, 200, getIp(req));
    sendSuccess(res, withDepartment);
  } catch (e) {
    next(e);
  }
}

/** GET /integration/employees/:id - get one employee by id (uuid) or employeeCode */
export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = (req as Request & { apiAccessId?: string }).apiAccessId;
    if (apiAccessId) await apiAccessService.touchLastUsed(apiAccessId);

    const idOrCode = req.params.id;
    if (!idOrCode) {
      next(errors.badRequest('Employee ID or code required'));
      return;
    }
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: idOrCode }, { employeeCode: idOrCode }],
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        employmentType: true,
        dateOfJoining: true,
        workLocation: true,
        status: true,
        department: { select: { name: true } },
      },
    });
    if (!employee) {
      next(errors.notFound('Employee'));
      return;
    }
    const { department, ...rest } = employee;
    if (apiAccessId) await apiAccessService.logCall(apiAccessId, req.method, req.path, 200, getIp(req));
    sendSuccess(res, { ...rest, departmentName: department?.name ?? null });
  } catch (e) {
    next(e);
  }
}
