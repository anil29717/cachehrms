import type { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../services/payroll.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const payrollService = new PayrollService();

export async function listSalaryStructures(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await payrollService.listSalaryStructures();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getSalaryStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.params.employeeId;
    if (!employeeId) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const structure = await payrollService.getSalaryStructureByEmployeeId(employeeId);
    sendSuccess(res, structure);
  } catch (e) {
    next(e);
  }
}

export async function upsertSalaryStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.params.employeeId ?? (req.body as { employeeId?: string }).employeeId;
    if (!employeeId) {
      next(errors.badRequest('Employee ID required'));
      return;
    }
    const body = req.body as {
      basicSalary?: number;
      hra?: number;
      conveyance?: number;
      medical?: number;
      specialAllowance?: number;
    };
    const structure = await payrollService.upsertSalaryStructure(employeeId, {
      basicSalary: body.basicSalary ?? 0,
      hra: body.hra,
      conveyance: body.conveyance,
      medical: body.medical,
      specialAllowance: body.specialAllowance,
    });
    sendSuccess(res, structure, 'Salary structure saved');
  } catch (e) {
    next(e);
  }
}

export async function listPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.query.month ? parseInt(String(req.query.month), 10) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : new Date().getFullYear();
    const employeeId = req.query.employeeId as string | undefined;
    if (Number.isNaN(month) || Number.isNaN(year)) {
      next(errors.badRequest('Valid month and year required'));
      return;
    }
    const list = await payrollService.listPayroll(month, year, employeeId);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function generatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { month?: number; year?: number; employeeIds?: string[] };
    const month = body.month ?? new Date().getMonth() + 1;
    const year = body.year ?? new Date().getFullYear();
    const employeeIds = body.employeeIds;
    if (Number.isNaN(month) || Number.isNaN(year) || month < 1 || month > 12) {
      next(errors.badRequest('Valid month and year required'));
      return;
    }
    const result = await payrollService.generatePayroll(month, year, employeeIds);
    sendSuccess(res, result, `Payroll generated for ${result.created} employee(s)`);
  } catch (e) {
    next(e);
  }
}

export async function updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as { paymentStatus?: string };
    const paymentStatus = body.paymentStatus as 'pending' | 'processed' | 'failed';
    if (!id) {
      next(errors.badRequest('Payroll ID required'));
      return;
    }
    if (!['pending', 'processed', 'failed'].includes(paymentStatus)) {
      next(errors.badRequest('paymentStatus must be pending, processed, or failed'));
      return;
    }
    const updated = await payrollService.updatePaymentStatus(id, paymentStatus);
    sendSuccess(res, updated, 'Payment status updated');
  } catch (e) {
    next(e);
  }
}

export async function getPayrollById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Payroll ID required'));
      return;
    }
    const payroll = await payrollService.getPayrollById(id);
    sendSuccess(res, payroll);
  } catch (e) {
    next(e);
  }
}

export async function getMyPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 24;
    const list = await payrollService.getMyPayslips(employeeId, limit);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getPayslip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const roleName = req.user?.roleName;
    const employeeId = (roleName === 'hr_admin' || roleName === 'super_admin') ? undefined : req.user?.employeeId;
    if (!id) {
      next(errors.badRequest('Payroll ID required'));
      return;
    }
    const data = await payrollService.getPayslipData(id, employeeId);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}
