import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';
import { ApiAccessService } from '../services/apiAccess.service.js';
import { EmployeeService } from '../services/employee.service.js';
import { SystemSettingService } from '../services/systemSetting.service.js';

const apiAccessService = new ApiAccessService();
const employeeService = new EmployeeService();
const systemSettingService = new SystemSettingService();

function getIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return req.socket?.remoteAddress;
}

/** GET /integration/employees - list employees (basic info + reporting manager + default password) for external API */
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
        externalRole: true,
        externalSubRole: true,
        employmentType: true,
        dateOfJoining: true,
        reportingTo: true,
        department: { select: { name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const managerCodes = [...new Set(employees.map((e) => e.reportingTo).filter(Boolean))] as string[];
    const managers = await prisma.employee.findMany({
      where: { employeeCode: { in: managerCodes } },
      select: { employeeCode: true, firstName: true, lastName: true },
    });
    const managerNameByCode: Record<string, string> = {};
    for (const m of managers) {
      managerNameByCode[m.employeeCode] = `${m.firstName} ${m.lastName}`.trim();
    }

    const employeeCodes = employees.map((e) => e.employeeCode);
    const users = await prisma.user.findMany({
      where: { employeeId: { in: employeeCodes } },
      select: { employeeId: true, defaultPassword: true },
    });
    const passwordByEmployeeCode: Record<string, string | null> = {};
    for (const u of users) {
      passwordByEmployeeCode[u.employeeId] = u.defaultPassword;
    }

    const withExtras = employees.map((e) => ({
      id: e.id,
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      designation: e.designation,
      externalRole: (e as { externalRole?: string }).externalRole ?? 'employee',
      externalSubRole: (e as { externalSubRole?: string | null }).externalSubRole ?? null,
      employmentType: e.employmentType,
      dateOfJoining: e.dateOfJoining,
      departmentName: e.department?.name ?? null,
      reportingManagerId: e.reportingTo,
      reportingManagerName: e.reportingTo ? managerNameByCode[e.reportingTo] ?? null : null,
      defaultPassword: passwordByEmployeeCode[e.employeeCode] ?? null,
    }));
    if (apiAccessId) await apiAccessService.logCall(apiAccessId, req.method, req.path, 200, getIp(req));
    sendSuccess(res, withExtras);
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

/**
 * GET /integration/employee?code=... | id=... | email=...
 * Single endpoint to fetch one employee with all fields you selected when creating the API key.
 * Use query param: code (e.g. EMP-2026-0001), id (uuid), or email.
 */
export async function getEmployeeSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = (req as Request & { apiAccessId?: string }).apiAccessId;
    if (apiAccessId) await apiAccessService.touchLastUsed(apiAccessId);

    const code = req.query.code as string | undefined;
    const id = req.query.id as string | undefined;
    const email = req.query.email as string | undefined;
    const identifier = code ?? id ?? email;
    if (!identifier?.trim()) {
      next(errors.badRequest('Provide one of: ?code=EMP-2026-0001, ?id=uuid, or ?email=user@company.com'));
      return;
    }

    const employee = await prisma.employee.findFirst({
      where: code
        ? { employeeCode: code.trim() }
        : id
          ? { id: id.trim() }
          : { email: email!.trim().toLowerCase() },
      select: { id: true },
    });
    if (!employee) {
      next(errors.notFound('Employee'));
      return;
    }

    let fieldsOption: string | undefined;
    if (apiAccessId) {
      const keyFields = await apiAccessService.getEmployeeFullFieldsForKey(apiAccessId);
      fieldsOption = keyFields?.length ? keyFields.join(',') : undefined;
    }
    if (fieldsOption === undefined) {
      const configured = await systemSettingService.getEmployeeFullApiFields();
      fieldsOption = configured?.length ? configured.join(',') : undefined;
    }
    const payload = await employeeService.getFullPayload(employee.id, { fields: fieldsOption });
    if (apiAccessId) await apiAccessService.logCall(apiAccessId, req.method, req.path, 200, getIp(req));
    sendSuccess(res, payload);
  } catch (e) {
    next(e);
  }
}

/** GET /integration/employees/:id/full - full employee payload (all fields + profile) for sending data. */
export async function getEmployeeFull(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = (req as Request & { apiAccessId?: string }).apiAccessId;
    if (apiAccessId) await apiAccessService.touchLastUsed(apiAccessId);

    const idOrCode = req.params.id;
    if (!idOrCode) {
      next(errors.badRequest('Employee ID or code required'));
      return;
    }
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ id: idOrCode }, { employeeCode: idOrCode }] },
      select: { id: true },
    });
    if (!employee) {
      next(errors.notFound('Employee'));
      return;
    }
    let fieldsOption: string | undefined;
    if (apiAccessId) {
      const keyFields = await apiAccessService.getEmployeeFullFieldsForKey(apiAccessId);
      fieldsOption = keyFields?.length ? keyFields.join(',') : undefined;
    }
    if (fieldsOption === undefined) {
      const configured = await systemSettingService.getEmployeeFullApiFields();
      fieldsOption = configured?.length ? configured.join(',') : undefined;
    }
    const payload = await employeeService.getFullPayload(employee.id, { fields: fieldsOption });
    if (apiAccessId) await apiAccessService.logCall(apiAccessId, req.method, req.path, 200, getIp(req));
    sendSuccess(res, payload);
  } catch (e) {
    next(e);
  }
}
