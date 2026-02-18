import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const PF_RATE = 0.12;
const PT_MONTHLY = 200;
const IT_RATE = 0.05;

export type SalaryStructureInput = {
  basicSalary: number;
  hra?: number;
  conveyance?: number;
  medical?: number;
  specialAllowance?: number;
};

export class PayrollService {
  async listSalaryStructures() {
    const list = await prisma.salaryStructure.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, designation: true, departmentId: true },
        },
      },
    });
    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    return list.map((s) => ({
      id: s.id,
      employeeId: s.employeeId,
      employeeName: `${s.employee.firstName} ${s.employee.lastName}`.trim(),
      employeeCode: s.employee.employeeCode,
      designation: s.employee.designation,
      departmentName: s.employee.departmentId ? deptMap.get(s.employee.departmentId) ?? null : null,
      basicSalary: s.basicSalary,
      hra: s.hra,
      conveyance: s.conveyance,
      medical: s.medical,
      specialAllowance: s.specialAllowance,
      gross: s.basicSalary + s.hra + s.conveyance + s.medical + s.specialAllowance,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async getSalaryStructureByEmployeeId(employeeId: string) {
    const s = await prisma.salaryStructure.findUnique({
      where: { employeeId },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
    if (!s) throw errors.notFound('Salary structure');
    return {
      id: s.id,
      employeeId: s.employeeId,
      employeeName: `${s.employee.firstName} ${s.employee.lastName}`.trim(),
      employeeCode: s.employee.employeeCode,
      basicSalary: s.basicSalary,
      hra: s.hra,
      conveyance: s.conveyance,
      medical: s.medical,
      specialAllowance: s.specialAllowance,
      gross: s.basicSalary + s.hra + s.conveyance + s.medical + s.specialAllowance,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  /** Resolve employee: accept employeeCode (e.g. EMP-2026-0001) or employee id (UUID) */
  private async resolveEmployeeCode(employeeIdOrUuid: string): Promise<string> {
    if (!employeeIdOrUuid?.trim()) throw errors.badRequest('Employee is required');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const emp = uuidRegex.test(employeeIdOrUuid.trim())
      ? await prisma.employee.findUnique({ where: { id: employeeIdOrUuid.trim() } })
      : await prisma.employee.findUnique({ where: { employeeCode: employeeIdOrUuid.trim() } });
    if (!emp) throw errors.notFound('Employee');
    return emp.employeeCode;
  }

  async upsertSalaryStructure(employeeId: string, data: SalaryStructureInput) {
    const employeeCode = await this.resolveEmployeeCode(employeeId);
    const basic = Math.max(0, data.basicSalary);
    const hra = Math.max(0, data.hra ?? 0);
    const conveyance = Math.max(0, data.conveyance ?? 0);
    const medical = Math.max(0, data.medical ?? 0);
    const specialAllowance = Math.max(0, data.specialAllowance ?? 0);
    const structure = await prisma.salaryStructure.upsert({
      where: { employeeId: employeeCode },
      create: {
        employeeId: employeeCode,
        basicSalary: basic,
        hra,
        conveyance,
        medical,
        specialAllowance,
      },
      update: { basicSalary: basic, hra, conveyance, medical, specialAllowance },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return {
      id: structure.id,
      employeeId: structure.employeeId,
      employeeName: `${structure.employee.firstName} ${structure.employee.lastName}`.trim(),
      basicSalary: structure.basicSalary,
      hra: structure.hra,
      conveyance: structure.conveyance,
      medical: structure.medical,
      specialAllowance: structure.specialAllowance,
      gross: structure.basicSalary + structure.hra + structure.conveyance + structure.medical + structure.specialAllowance,
      createdAt: structure.createdAt.toISOString(),
      updatedAt: structure.updatedAt.toISOString(),
    };
  }

  async listPayroll(month: number, year: number, employeeId?: string) {
    const where: { month: number; year: number; employeeId?: string } = { month, year };
    if (employeeId) where.employeeId = employeeId;
    const list = await prisma.payroll.findMany({
      where,
      orderBy: { employeeId: 'asc' },
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, designation: true, departmentId: true },
        },
      },
    });
    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    return list.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeCode: p.employee.employeeCode,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`.trim(),
      designation: p.employee.designation,
      departmentName: p.employee.departmentId ? deptMap.get(p.employee.departmentId) ?? null : null,
      month: p.month,
      year: p.year,
      basicSalary: p.basicSalary,
      hra: p.hra,
      conveyance: p.conveyance,
      medical: p.medical,
      specialAllowance: p.specialAllowance,
      bonus: p.bonus,
      overtime: p.overtime,
      reimbursement: p.reimbursement,
      grossEarnings: p.grossEarnings,
      pfDeduction: p.pfDeduction,
      professionalTax: p.professionalTax,
      incomeTax: p.incomeTax,
      totalDeductions: p.totalDeductions,
      netSalary: p.netSalary,
      paymentStatus: p.paymentStatus,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      payslipUrl: p.payslipUrl,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async generatePayroll(month: number, year: number, employeeIds?: string[]) {
    if (month < 1 || month > 12) throw errors.badRequest('Invalid month');
    const structures = employeeIds?.length
      ? await prisma.salaryStructure.findMany({ where: { employeeId: { in: employeeIds } }, include: { employee: true } })
      : await prisma.salaryStructure.findMany({ include: { employee: true } });
    if (structures.length === 0) throw errors.badRequest('No salary structures found. Add salary structure for employees first.');
    const created: string[] = [];
    for (const s of structures) {
      const existing = await prisma.payroll.findUnique({
        where: { employeeId_month_year: { employeeId: s.employeeId, month, year } },
      });
      if (existing) continue;
      const gross = s.basicSalary + s.hra + s.conveyance + s.medical + s.specialAllowance;
      const pf = Math.round(s.basicSalary * PF_RATE * 100) / 100;
      const pt = PT_MONTHLY;
      const it = Math.round(gross * IT_RATE * 100) / 100;
      const totalDeductions = pf + pt + it;
      const net = Math.round((gross - totalDeductions) * 100) / 100;
      await prisma.payroll.create({
        data: {
          employeeId: s.employeeId,
          month,
          year,
          basicSalary: s.basicSalary,
          hra: s.hra,
          conveyance: s.conveyance,
          medical: s.medical,
          specialAllowance: s.specialAllowance,
          bonus: 0,
          overtime: 0,
          reimbursement: 0,
          grossEarnings: gross,
          pfDeduction: pf,
          professionalTax: pt,
          incomeTax: it,
          totalDeductions,
          netSalary: net,
          paymentStatus: 'pending',
        },
      });
      created.push(s.employeeId);
    }
    return { month, year, created: created.length, employeeIds: created };
  }

  async updatePaymentStatus(id: string, paymentStatus: 'pending' | 'processed' | 'failed') {
    const payroll = await prisma.payroll.findUnique({ where: { id } });
    if (!payroll) throw errors.notFound('Payroll');
    const paymentDate = paymentStatus === 'processed' ? new Date() : null;
    const updated = await prisma.payroll.update({
      where: { id },
      data: { paymentStatus, paymentDate },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return {
      id: updated.id,
      employeeId: updated.employeeId,
      employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`.trim(),
      month: updated.month,
      year: updated.year,
      netSalary: updated.netSalary,
      paymentStatus: updated.paymentStatus,
      paymentDate: updated.paymentDate?.toISOString() ?? null,
    };
  }

  async getPayrollById(id: string) {
    const p = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            departmentId: true,
            dateOfJoining: true,
          },
        },
      },
    });
    if (!p) throw errors.notFound('Payroll');
    const dept = p.employee.departmentId
      ? await prisma.department.findUnique({ where: { id: p.employee.departmentId }, select: { name: true } })
      : null;
    return {
      id: p.id,
      employeeId: p.employeeId,
      employeeCode: p.employee.employeeCode,
      employeeName: `${p.employee.firstName} ${p.employee.lastName}`.trim(),
      designation: p.employee.designation,
      departmentName: dept?.name ?? null,
      dateOfJoining: p.employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
      month: p.month,
      year: p.year,
      basicSalary: p.basicSalary,
      hra: p.hra,
      conveyance: p.conveyance,
      medical: p.medical,
      specialAllowance: p.specialAllowance,
      bonus: p.bonus,
      overtime: p.overtime,
      reimbursement: p.reimbursement,
      grossEarnings: p.grossEarnings,
      pfDeduction: p.pfDeduction,
      professionalTax: p.professionalTax,
      incomeTax: p.incomeTax,
      totalDeductions: p.totalDeductions,
      netSalary: p.netSalary,
      paymentStatus: p.paymentStatus,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      payslipUrl: p.payslipUrl,
      createdAt: p.createdAt.toISOString(),
    };
  }

  async getMyPayslips(employeeId: string, limit = 24) {
    const list = await prisma.payroll.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: limit,
    });
    return list.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      netSalary: p.netSalary,
      paymentStatus: p.paymentStatus,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async getPayslipData(id: string, requestEmployeeId?: string) {
    const payroll = await this.getPayrollById(id);
    if (requestEmployeeId && payroll.employeeId !== requestEmployeeId) {
      throw errors.forbidden('You can only view your own payslip');
    }
    const monthName = new Date(payroll.year, payroll.month - 1, 1).toLocaleString('default', { month: 'long' });
    return {
      ...payroll,
      monthName,
      period: `${monthName} ${payroll.year}`,
    };
  }
}
