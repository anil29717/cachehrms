import type { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const employeeService = new EmployeeService();

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
      dateOfJoining: body.dateOfJoining != null ? String(body.dateOfJoining) : undefined,
      employmentType: String(body.employmentType ?? 'full_time'),
      workLocation: body.workLocation != null ? String(body.workLocation) : undefined,
    });
    sendSuccess(res, employee, 'Employee onboarded successfully');
  } catch (e) {
    next(e);
  }
}
