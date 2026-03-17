import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';
import { ShiftService } from './shift.service.js';

const shiftService = new ShiftService();

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function minutesBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 60000);
}

function getLateMinutes(checkIn: Date, shiftStart: Date, gracePeriodMinutes: number): number {
  const allowedStart = new Date(shiftStart);
  allowedStart.setMinutes(allowedStart.getMinutes() + gracePeriodMinutes);
  if (checkIn <= allowedStart) return 0;
  return minutesBetween(allowedStart, checkIn);
}

export class AttendanceService {
  async checkIn(employeeId: string, ipAddress?: string | null) {
    const employee = await prisma.employee.findUnique({
      where: { employeeCode: employeeId },
    });
    if (!employee) throw errors.notFound('Employee');
    const today = toDateOnly(new Date());
    const existing = await prisma.attendance.findFirst({
      where: { employeeId: employee.employeeCode, date: today },
    });
    if (existing?.checkIn) throw errors.badRequest('Already checked in today');
    const now = new Date();
    const defaultShift = await shiftService.getDefaultShift();
    let lateMinutes: number | null = null;
    let status = 'present';
    if (defaultShift) {
      const shiftStartToday = new Date(today);
      shiftStartToday.setHours(
        defaultShift.startTime.getHours(),
        defaultShift.startTime.getMinutes(),
        0,
        0
      );
      lateMinutes = getLateMinutes(now, shiftStartToday, defaultShift.gracePeriod);
      if (lateMinutes > 0) status = 'late';
    }
    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          checkInIp: ipAddress ?? null,
          status,
          lateMinutes,
        },
      });
      const updated = await prisma.attendance.findUnique({ where: { id: existing.id } });
      return this.toAttendanceDto(updated!);
    }
    const record = await prisma.attendance.create({
      data: {
        employeeId: employee.employeeCode,
        date: today,
        checkIn: now,
        checkInIp: ipAddress ?? null,
        status,
        lateMinutes,
      },
    });
    return this.toAttendanceDto(record);
  }

  async checkOut(employeeId: string, ipAddress?: string | null) {
    const today = toDateOnly(new Date());
    const record = await prisma.attendance.findFirst({
      where: { employeeId, date: today },
    });
    if (!record) throw errors.badRequest('No check-in found for today. Check in first.');
    if (record.checkOut) throw errors.badRequest('Already checked out today');
    const now = new Date();
    const checkIn = record.checkIn!;
    const workingMinutes = minutesBetween(checkIn, now);
    const workingHours = Math.round((workingMinutes / 60) * 100) / 100;
    const defaultShift = await shiftService.getDefaultShift();
    let overtimeHours: number | null = null;
    if (defaultShift) {
      const shiftEndToday = new Date(today);
      shiftEndToday.setHours(
        defaultShift.endTime.getHours(),
        defaultShift.endTime.getMinutes(),
        0,
        0
      );
      if (now > shiftEndToday) {
        overtimeHours = Math.round((minutesBetween(shiftEndToday, now) / 60) * 100) / 100;
      }
    }
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        checkOutIp: ipAddress ?? null,
        workingHours,
        overtimeHours,
      },
    });
    return this.toAttendanceDto(updated);
  }

  async getToday(employeeId: string) {
    const today = toDateOnly(new Date());
    const record = await prisma.attendance.findFirst({
      where: { employeeId, date: today },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    if (!record) {
      return {
        id: null,
        employeeId,
        date: today.toISOString().slice(0, 10),
        checkIn: null,
        checkOut: null,
        status: null,
        workingHours: null,
        overtimeHours: null,
        lateMinutes: null,
        checkInIp: null,
        checkOutIp: null,
        remarks: null,
        createdAt: null,
        employeeName: null,
      };
    }
    return this.toAttendanceDto(record);
  }

  async getMyHistory(
    employeeId: string,
    from: string,
    to: string,
    page: number,
    limit: number
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw errors.badRequest('Invalid from or to date');
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          employeeId,
          date: { gte: toDateOnly(fromDate), lte: toDateOnly(toDate) },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.attendance.count({
        where: {
          employeeId,
          date: { gte: toDateOnly(fromDate), lte: toDateOnly(toDate) },
        },
      }),
    ]);
    return {
      items: items.map((a) => this.toAttendanceDto(a)),
      total,
      page,
      limit,
    };
  }

  /** Team attendance: reportees of manager (reportingTo = managerEmployeeCode) for a date */
  async getTeamAttendance(managerEmployeeCode: string, dateStr: string) {
    const date = toDateOnly(new Date(dateStr));
    if (Number.isNaN(date.getTime())) throw errors.badRequest('Invalid date');
    const reportees = await prisma.employee.findMany({
      where: { reportingTo: managerEmployeeCode, status: 'active' },
      select: { employeeCode: true, firstName: true, lastName: true, designation: true },
    });
    const codes = reportees.map((e) => e.employeeCode);
    const attendanceList = await prisma.attendance.findMany({
      where: { employeeId: { in: codes }, date },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    const byEmployee = new Map(attendanceList.map((a) => [a.employeeId, a]));
    return reportees.map((e) => {
      const a = byEmployee.get(e.employeeCode);
      const dto = a
        ? this.toAttendanceDto(a)
        : {
            id: null,
            employeeId: e.employeeCode,
            date: dateStr,
            checkIn: null,
            checkOut: null,
            status: 'absent',
            workingHours: null,
            overtimeHours: null,
            lateMinutes: null,
            checkInIp: null,
            checkOutIp: null,
            remarks: null,
            createdAt: null,
            employeeName: undefined,
          };
      return { ...dto, employeeId: e.employeeCode, employeeName: `${e.firstName} ${e.lastName}`.trim(), designation: e.designation, date: dateStr };
    });
  }

  /** Department attendance for a date (HR) */
  async getDepartmentAttendance(departmentId: number, dateStr: string) {
    const date = toDateOnly(new Date(dateStr));
    if (Number.isNaN(date.getTime())) throw errors.badRequest('Invalid date');
    const employees = await prisma.employee.findMany({
      where: { departmentId, status: 'active' },
      select: { employeeCode: true, firstName: true, lastName: true, designation: true },
    });
    const codes = employees.map((e) => e.employeeCode);
    const attendanceList = await prisma.attendance.findMany({
      where: { employeeId: { in: codes }, date },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    const byEmployee = new Map(attendanceList.map((a) => [a.employeeId, a]));
    return employees.map((e) => {
      const a = byEmployee.get(e.employeeCode);
      const dto = a
        ? this.toAttendanceDto(a)
        : {
            id: null,
            employeeId: e.employeeCode,
            date: dateStr,
            checkIn: null,
            checkOut: null,
            status: 'absent',
            workingHours: null,
            overtimeHours: null,
            lateMinutes: null,
            checkInIp: null,
            checkOutIp: null,
            remarks: null,
            createdAt: null,
            employeeName: undefined,
          };
      return { ...dto, employeeId: e.employeeCode, employeeName: `${e.firstName} ${e.lastName}`.trim(), designation: e.designation, date: dateStr };
    });
  }

  /** Monthly attendance report: summary for a month, optional filter by department */
  async getMonthlyReport(month: number, year: number, departmentId?: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const startDate = toDateOnly(start);
    const endDate = toDateOnly(end);
    const whereEmployee = departmentId
      ? { departmentId, status: 'active' }
      : { status: 'active' };
    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      select: { employeeCode: true, firstName: true, lastName: true },
    });
    const codes = employees.map((e) => e.employeeCode);
    const records = await prisma.attendance.findMany({
      where: {
        employeeId: { in: codes },
        date: { gte: startDate, lte: endDate },
      },
    });
    const byEmployee = new Map<string, { present: number; late: number; totalHours: number; totalOvertime: number }>();
    for (const e of employees) {
      byEmployee.set(e.employeeCode, { present: 0, late: 0, totalHours: 0, totalOvertime: 0 });
    }
    for (const a of records) {
      const agg = byEmployee.get(a.employeeId);
      if (!agg) continue;
      agg.present += 1;
      if (a.status === 'late') agg.late += 1;
      agg.totalHours += a.workingHours ?? 0;
      agg.totalOvertime += a.overtimeHours ?? 0;
    }
    return {
      month,
      year,
      summary: employees.map((e) => ({
        employeeId: e.employeeCode,
        employeeName: `${e.firstName} ${e.lastName}`.trim(),
        ...byEmployee.get(e.employeeCode)!,
      })),
    };
  }

  private toAttendanceDto(a: {
    id: string;
    employeeId: string;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: string;
    workingHours: number | null;
    overtimeHours: number | null;
    lateMinutes: number | null;
    checkInIp: string | null;
    checkOutIp: string | null;
    remarks: string | null;
    createdAt: Date;
    employee?: { employeeCode: string; firstName: string; lastName: string };
  }) {
    return {
      id: a.id,
      employeeId: a.employeeId,
      date: a.date.toISOString().slice(0, 10),
      checkIn: a.checkIn?.toISOString() ?? null,
      checkOut: a.checkOut?.toISOString() ?? null,
      status: a.status,
      workingHours: a.workingHours,
      overtimeHours: a.overtimeHours,
      lateMinutes: a.lateMinutes,
      checkInIp: a.checkInIp,
      checkOutIp: a.checkOutIp,
      remarks: a.remarks,
      createdAt: a.createdAt.toISOString(),
      employeeName:
        a.employee != null
          ? `${a.employee.firstName} ${a.employee.lastName}`.trim()
          : undefined,
    };
  }
}
