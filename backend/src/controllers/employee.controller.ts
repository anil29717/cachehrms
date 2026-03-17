import type { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service.js';
import { SystemSettingService } from '../services/systemSetting.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const employeeService = new EmployeeService();
const systemSettingService = new SystemSettingService();

export async function getDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await employeeService.getDistinctDesignations();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getWorkLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await employeeService.getDistinctWorkLocations();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const employmentType = req.query.employmentType as string | undefined;
    const result = await employeeService.list({
      page,
      limit,
      search,
      status,
      departmentId,
      employmentType,
    });
    sendSuccess(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (e) {
    next(e);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const employee = await employeeService.getById(id);
    sendSuccess(res, employee);
  } catch (e) {
    next(e);
  }
}

/** Full employee payload. Fields returned are those configured by admin in Settings → API (not selectable by end user). */
export async function getEmployeeFull(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const configured = await systemSettingService.getEmployeeFullApiFields();
    const fieldsOption = configured?.length ? configured.join(',') : undefined;
    const payload = await employeeService.getFullPayload(id, { fields: fieldsOption });
    sendSuccess(res, payload);
  } catch (e) {
    next(e);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const employee = await employeeService.create({
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      email: String(body.email ?? ''),
      phone: body.phone != null ? String(body.phone) : undefined,
      dateOfBirth: body.dateOfBirth != null ? String(body.dateOfBirth) : undefined,
      gender: body.gender != null ? String(body.gender) : undefined,
      departmentId: body.departmentId != null ? Number(body.departmentId) : undefined,
      designation: body.designation != null ? String(body.designation) : undefined,
      reportingTo: body.reportingTo != null ? String(body.reportingTo) : undefined,
      externalRole: body.externalRole != null ? String(body.externalRole) : undefined,
      externalSubRole: body.externalSubRole != null ? String(body.externalSubRole) : undefined,
      dateOfJoining: body.dateOfJoining != null ? String(body.dateOfJoining) : undefined,
      employmentType: String(body.employmentType ?? 'full_time'),
      workLocation: body.workLocation != null ? String(body.workLocation) : undefined,
    });
    sendSuccess(res, employee, 'Employee onboarded successfully');
  } catch (e) {
    next(e);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const body = req.body as Record<string, unknown>;
    const employee = await employeeService.update(id, {
      firstName: body.firstName != null ? String(body.firstName) : undefined,
      lastName: body.lastName != null ? String(body.lastName) : undefined,
      email: body.email != null ? String(body.email) : undefined,
      phone: body.phone !== undefined ? (body.phone ? String(body.phone) : null) : undefined,
      dateOfBirth: body.dateOfBirth != null ? String(body.dateOfBirth) : undefined,
      gender: body.gender !== undefined ? (body.gender ? String(body.gender) : null) : undefined,
      departmentId: body.departmentId !== undefined ? (body.departmentId != null ? Number(body.departmentId) : null) : undefined,
      designation: body.designation !== undefined ? (body.designation ? String(body.designation) : null) : undefined,
      reportingTo: body.reportingTo !== undefined ? (body.reportingTo ? String(body.reportingTo) : null) : undefined,
      externalRole: body.externalRole != null ? String(body.externalRole) : undefined,
      externalSubRole: body.externalSubRole !== undefined ? (body.externalSubRole ? String(body.externalSubRole) : null) : undefined,
      dateOfJoining: body.dateOfJoining != null ? String(body.dateOfJoining) : undefined,
      employmentType: body.employmentType != null ? String(body.employmentType) : undefined,
      workLocation: body.workLocation !== undefined ? (body.workLocation ? String(body.workLocation) : null) : undefined,
      status: body.status != null ? String(body.status) : undefined,
    });
    sendSuccess(res, employee, 'Employee updated');
  } catch (e) {
    next(e);
  }
}

export async function updateEmployeeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const body = req.body as {
      personalInfo?: Record<string, unknown>;
      bankDetail?: Record<string, unknown>;
      emergencyContacts?: Array<Record<string, unknown>>;
      educations?: Array<Record<string, unknown>>;
      experiences?: Array<Record<string, unknown>>;
    };
    const employee = await employeeService.updateProfile(id, {
      personalInfo: body.personalInfo,
      bankDetail: body.bankDetail,
      emergencyContacts: body.emergencyContacts,
      educations: body.educations,
      experiences: body.experiences,
    });
    sendSuccess(res, employee, 'Profile updated');
  } catch (e) {
    next(e);
  }
}
