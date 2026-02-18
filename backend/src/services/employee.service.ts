import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const EMPLOYMENT_TYPES = ['full_time', 'contract', 'intern', 'part_time'] as const;
const STATUSES = ['active', 'inactive', 'terminated', 'on_leave'] as const;

export type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  departmentId?: number;
  designation?: string;
  reportingTo?: string;
  dateOfJoining?: string;
  employmentType: string;
  workLocation?: string;
};

export type ListEmployeesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: string;
  employmentType?: string;
};

export class EmployeeService {
  /** Generate next employee code: EMP-YYYY-XXXX (e.g. EMP-2026-0001) */
  async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const last = await prisma.employee.findFirst({
      where: { employeeCode: { startsWith: prefix } },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
    const nextNum = last
      ? parseInt(last.employeeCode.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  async list(query: ListEmployeesQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(500, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.employee.findMany>[0]['where'] = {};
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { employeeCode: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.status?.trim()) where.status = query.status.trim();
    if (query.departmentId != null) where.departmentId = parseInt(query.departmentId, 10) || undefined;
    if (query.employmentType?.trim()) where.employmentType = query.employmentType.trim();

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      items: employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        designation: e.designation,
        departmentId: e.departmentId,
        departmentName: e.department?.name ?? null,
        employmentType: e.employmentType,
        status: e.status,
        dateOfJoining: e.dateOfJoining,
        createdAt: e.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
      },
    });
    if (!employee) throw errors.notFound('Employee');
    return {
      ...employee,
      departmentName: employee.department?.name ?? null,
    };
  }

  async create(data: CreateEmployeeInput) {
    const email = data.email.trim().toLowerCase();
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) throw errors.conflict('Employee with this email already exists');

    if (!EMPLOYMENT_TYPES.includes(data.employmentType as (typeof EMPLOYMENT_TYPES)[number])) {
      throw errors.badRequest(
        `employmentType must be one of: ${EMPLOYMENT_TYPES.join(', ')}`
      );
    }

    if (data.departmentId != null) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) throw errors.badRequest('Department not found');
    }

    const employeeCode = await this.generateEmployeeCode();
    const dateOfJoining = data.dateOfJoining
      ? new Date(data.dateOfJoining)
      : new Date();
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        phone: data.phone?.trim() || null,
        dateOfBirth: dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : null,
        gender: data.gender?.trim() || null,
        departmentId: data.departmentId ?? null,
        designation: data.designation?.trim() || null,
        reportingTo: data.reportingTo?.trim() || null,
        dateOfJoining: dateOfJoining && !Number.isNaN(dateOfJoining.getTime()) ? dateOfJoining : null,
        employmentType: data.employmentType,
        status: 'active',
        workLocation: data.workLocation?.trim() || null,
      },
    });
    return employee;
  }
}
