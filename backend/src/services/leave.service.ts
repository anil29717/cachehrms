import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

export const LEAVE_TYPES = [
  'sick',
  'casual',
  'earned',
  'maternity',
  'paternity',
  'unpaid',
  'comp_off',
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(start: Date, end: Date): number {
  const a = toDateOnly(start);
  const b = toDateOnly(end);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export type ApplyLeaveInput = {
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string | null;
  documentUrl?: string | null;
};

export class LeaveService {
  async getMyBalances(employeeId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    const list = await prisma.leaveBalance.findMany({
      where: { employeeId, year: y },
      orderBy: { leaveType: 'asc' },
    });
    return list.map((b) => ({
      leaveType: b.leaveType,
      year: b.year,
      openingBalance: b.openingBalance,
      credited: b.credited,
      taken: b.taken,
      closingBalance: b.closingBalance,
      lastUpdated: b.lastUpdated.toISOString(),
    }));
  }

  async getMyRequests(employeeId: string, status?: string, limit = 50) {
    const where: { employeeId: string; status?: string } = { employeeId };
    if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      where.status = status;
    }
    const list = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
    return list.map((r) => this.toRequestDto(r));
  }

  async getRequestById(id: string, employeeId?: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true, departmentId: true } } },
    });
    if (!request) throw errors.notFound('Leave request');
    if (employeeId && request.employeeId !== employeeId) throw errors.forbidden('Not your leave request');
    return this.toRequestDto(request);
  }

  async apply(employeeId: string, data: ApplyLeaveInput) {
    const employee = await prisma.employee.findUnique({ where: { employeeCode: employeeId } });
    if (!employee) throw errors.notFound('Employee');
    if (!LEAVE_TYPES.includes(data.leaveType as LeaveType)) {
      throw errors.badRequest('Invalid leave type');
    }
    const startDate = toDateOnly(data.startDate);
    const endDate = toDateOnly(data.endDate);
    if (endDate < startDate) throw errors.badRequest('endDate must be on or after startDate');
    const maxDays = daysBetween(startDate, endDate);
    const totalDays = Math.max(0.5, Math.min(maxDays, data.totalDays ?? maxDays));
    if (totalDays <= 0) throw errors.badRequest('totalDays must be positive');

    if (data.leaveType !== 'unpaid') {
      const year = startDate.getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveType_year: { employeeId, leaveType: data.leaveType, year } },
      });
      if (balance && balance.closingBalance < totalDays) {
        throw errors.badRequest(
          `Insufficient ${data.leaveType} balance. Available: ${balance.closingBalance}, requested: ${totalDays}`
        );
      }
    }

    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['pending', 'approved'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });
    if (overlapping) throw errors.badRequest('Overlapping leave request exists');

    const record = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: data.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: data.reason?.trim() || null,
        documentUrl: data.documentUrl || null,
        status: 'pending',
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return this.toRequestDto(record);
  }

  async cancelRequest(id: string, employeeId: string) {
    const request = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw errors.notFound('Leave request');
    if (request.employeeId !== employeeId) throw errors.forbidden('Not your leave request');
    if (request.status !== 'pending') throw errors.badRequest('Only pending requests can be cancelled');
    await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return { id, status: 'cancelled' };
  }

  /** Pending requests for reportees (manager) or all (HR) */
  async listPendingForApproval(approverEmployeeId: string, roleName: string, departmentId?: number) {
    if (roleName !== 'manager' && roleName !== 'hr_admin' && roleName !== 'super_admin') {
      return [];
    }
    let employeeIds: string[] | null = null;
    if (roleName === 'manager') {
      const reportees = await prisma.employee.findMany({
        where: { reportingTo: approverEmployeeId, status: 'active' },
        select: { employeeCode: true },
      });
      employeeIds = reportees.map((e) => e.employeeCode);
    } else if (roleName === 'hr_admin' || roleName === 'super_admin') {
      if (departmentId != null) {
        const dept = await prisma.employee.findMany({
          where: { departmentId, status: 'active' },
          select: { employeeCode: true },
        });
        employeeIds = dept.map((e) => e.employeeCode);
      }
    }
    const where: { status: string; employeeId?: { in: string[] } } = { status: 'pending' };
    if (employeeIds !== null && employeeIds.length > 0) where.employeeId = { in: employeeIds };
    const list = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { employeeCode: true, firstName: true, lastName: true, designation: true, departmentId: true },
        },
      },
    });
    return list.map((r) => this.toRequestDto(r));
  }

  async approve(
    id: string,
    approverUserId: string,
    approverEmployeeId: string,
    roleName: string,
    remarks?: string | null
  ) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw errors.notFound('Leave request');
    if (request.status !== 'pending') throw errors.badRequest('Request is not pending');
    if (roleName === 'manager') {
      const isReportee = request.employee.reportingTo === approverEmployeeId;
      if (!isReportee) throw errors.forbidden('You can only approve leave for your reportees');
    }
    if (roleName !== 'manager' && roleName !== 'hr_admin' && roleName !== 'super_admin') {
      throw errors.forbidden('Only Manager or HR can approve leave');
    }
    const year = request.startDate.getFullYear();
    if (request.leaveType !== 'unpaid') {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveType_year: { employeeId: request.employeeId, leaveType: request.leaveType, year } },
      });
      if (balance && balance.closingBalance < request.totalDays) {
        throw errors.badRequest(
          `Insufficient balance. Available: ${balance.closingBalance}, requested: ${request.totalDays}`
        );
      }
    }
    const now = new Date();
    await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'approved',
        approverId: approverUserId,
        approvedAt: now,
        approverRemarks: remarks?.trim() || null,
      },
    });
    if (request.leaveType !== 'unpaid') {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveType_year: { employeeId: request.employeeId, leaveType: request.leaveType, year } },
      });
      if (balance) {
        const newTaken = balance.taken + request.totalDays;
        const newClosing = balance.openingBalance + balance.credited - newTaken;
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { taken: newTaken, closingBalance: newClosing, lastUpdated: now },
        });
      }
    }
    const updated = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return this.toRequestDto(updated!);
  }

  async reject(id: string, approverUserId: string, approverEmployeeId: string, roleName: string, remarks?: string | null) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw errors.notFound('Leave request');
    if (request.status !== 'pending') throw errors.badRequest('Request is not pending');
    if (roleName === 'manager') {
      const isReportee = request.employee.reportingTo === approverEmployeeId;
      if (!isReportee) throw errors.forbidden('You can only reject leave for your reportees');
    }
    if (roleName !== 'manager' && roleName !== 'hr_admin' && roleName !== 'super_admin') {
      throw errors.forbidden('Only Manager or HR can reject leave');
    }
    const now = new Date();
    await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        approverId: approverUserId,
        approvedAt: now,
        approverRemarks: remarks?.trim() || null,
      },
    });
    const updated = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return this.toRequestDto(updated!);
  }

  private toRequestDto(r: {
    id: string;
    employeeId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string | null;
    status: string;
    approverId: string | null;
    approvedAt: Date | null;
    approverRemarks: string | null;
    documentUrl: string | null;
    createdAt: Date;
    employee?: { employeeCode?: string; firstName: string; lastName: string; designation?: string; departmentId?: number | null };
  }) {
    return {
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.trim() : undefined,
      designation: r.employee?.designation,
      departmentId: r.employee?.departmentId,
      leaveType: r.leaveType,
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate.toISOString().slice(0, 10),
      totalDays: r.totalDays,
      reason: r.reason,
      status: r.status,
      approverId: r.approverId,
      approvedAt: r.approvedAt?.toISOString() ?? null,
      approverRemarks: r.approverRemarks,
      documentUrl: r.documentUrl,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
