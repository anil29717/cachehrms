import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const STATUSES = [
  'pending',
  'manager_approved',
  'finance_approved',
  'hr_approved',
  'paid',
  'rejected',
] as const;

const AUTO_APPROVE_THRESHOLD = 1000;
const MANAGER_ONLY_MAX = 5000;
const FINANCE_APPROVE_MAX = 15000;

export type ExpenseClaimItemDto = {
  id: string;
  claimId: string;
  expenseTypeId: number;
  expenseTypeName?: string;
  expenseTypeCategory?: string;
  amount: number;
  quantity: number | null;
  description: string | null;
  expenseDate: string;
  createdAt: Date;
};

export type ExpenseClaimDto = {
  id: string;
  employeeId: string;
  employeeName?: string;
  totalAmount: number;
  status: string;
  managerApprovedAt: Date | null;
  managerApprovedBy: string | null;
  financeApprovedAt: Date | null;
  financeApprovedBy: string | null;
  hrApprovedAt: Date | null;
  hrApprovedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: ExpenseClaimItemDto[];
};

export class ExpenseClaimService {
  async list(filters: {
    status?: string;
    statusIn?: string[];
    employeeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: { status?: string | { in: string[] }; employeeId?: string } = {};
    if (filters.statusIn?.length) {
      where.status = { in: filters.statusIn };
    } else if (filters.status && STATUSES.includes(filters.status as (typeof STATUSES)[number])) {
      where.status = filters.status;
    }
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [list, total] = await Promise.all([
      prisma.expenseClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, filters.limit ?? 50),
        skip: filters.offset ?? 0,
        include: {
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              expenseType: { select: { id: true, name: true, category: true } },
            },
          },
        },
      }),
      prisma.expenseClaim.count({ where }),
    ]);

    return {
      items: list.map((c) => this.toDto(c)),
      total,
    };
  }

  async getById(id: string) {
    const claim = await prisma.expenseClaim.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            expenseType: { select: { id: true, name: true, category: true, limitAmount: true, limitUnit: true } },
          },
        },
      },
    });
    if (!claim) throw errors.notFound('Expense claim');
    return this.toDto(claim);
  }

  async create(
    employeeId: string,
    data: {
      items: Array<{
        expenseTypeId: number;
        amount: number;
        quantity?: number | null;
        description?: string | null;
        expenseDate: string;
      }>;
    }
  ) {
    const emp = await prisma.employee.findUnique({
      where: { employeeCode: employeeId },
    });
    if (!emp) throw errors.notFound('Employee');

    if (!data.items?.length) {
      throw errors.badRequest('At least one expense item is required');
    }

    const totalAmount = data.items.reduce((sum, i) => sum + (i.amount || 0), 0);
    if (totalAmount <= 0) {
      throw errors.badRequest('Total amount must be greater than 0');
    }

    const typeIds = [...new Set(data.items.map((i) => i.expenseTypeId))];
    const types = await prisma.expenseType.findMany({
      where: { id: { in: typeIds }, isActive: true },
    });
    if (types.length !== typeIds.length) {
      throw errors.badRequest('One or more expense types are invalid or inactive');
    }

    const status: (typeof STATUSES)[number] =
      totalAmount < AUTO_APPROVE_THRESHOLD ? 'finance_approved' : 'pending';

    const claim = await prisma.expenseClaim.create({
      data: {
        employeeId,
        totalAmount,
        status,
        items: {
          create: data.items.map((i) => ({
            expenseTypeId: i.expenseTypeId,
            amount: i.amount,
            quantity: i.quantity ?? null,
            description: i.description?.trim() || null,
            expenseDate: new Date(i.expenseDate),
          })),
        },
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            expenseType: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });
    return this.toDto(claim);
  }

  async approveManager(id: string, approvedByUserId: string) {
    const claim = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw errors.notFound('Expense claim');
    if (claim.status !== 'pending') {
      throw errors.badRequest('Claim is not pending manager approval');
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'manager_approved',
        managerApprovedAt: new Date(),
        managerApprovedBy: approvedByUserId,
      },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        items: { include: { expenseType: { select: { id: true, name: true, category: true } } } },
      },
    });
    return this.toDto(updated);
  }

  async approveFinance(id: string, approvedByUserId: string) {
    const claim = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw errors.notFound('Expense claim');
    if (claim.status !== 'manager_approved') {
      throw errors.badRequest('Claim must be manager-approved first');
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'finance_approved',
        financeApprovedAt: new Date(),
        financeApprovedBy: approvedByUserId,
      },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        items: { include: { expenseType: { select: { id: true, name: true, category: true } } } },
      },
    });
    return this.toDto(updated);
  }

  async approveHr(id: string, approvedByUserId: string) {
    const claim = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw errors.notFound('Expense claim');
    if (claim.status !== 'finance_approved') {
      throw errors.badRequest('Claim must be finance-approved first');
    }
    if (claim.totalAmount < FINANCE_APPROVE_MAX) {
      throw errors.badRequest('HR approval is only required for claims above ₹15,000');
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'hr_approved',
        hrApprovedAt: new Date(),
        hrApprovedBy: approvedByUserId,
      },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        items: { include: { expenseType: { select: { id: true, name: true, category: true } } } },
      },
    });
    return this.toDto(updated);
  }

  async markPaid(id: string) {
    const claim = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw errors.notFound('Expense claim');
    const allowedStatuses: (typeof STATUSES)[number][] = [
      'manager_approved',
      'finance_approved',
      'hr_approved',
    ];
    if (!allowedStatuses.includes(claim.status as (typeof STATUSES)[number])) {
      throw errors.badRequest(
        'Claim must be approved (manager/finance/HR) before marking as paid'
      );
    }
    if (claim.status === 'manager_approved' && claim.totalAmount >= MANAGER_ONLY_MAX) {
      throw errors.badRequest('Finance approval required before marking as paid');
    }
    if (claim.status === 'finance_approved' && claim.totalAmount >= FINANCE_APPROVE_MAX) {
      throw errors.badRequest('HR approval required before marking as paid');
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        items: { include: { expenseType: { select: { id: true, name: true, category: true } } } },
      },
    });
    return this.toDto(updated);
  }

  async reportSummary() {
    const [byStatus, totalAmountByStatus] = await Promise.all([
      prisma.expenseClaim.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.expenseClaim.groupBy({
        by: ['status'],
        _sum: { totalAmount: true },
        where: { status: { not: 'rejected' } },
      }),
    ]);
    const countByStatus: Record<string, number> = {};
    const sumByStatus: Record<string, number> = {};
    byStatus.forEach((r) => {
      countByStatus[r.status] = r._count.id;
    });
    totalAmountByStatus.forEach((r) => {
      sumByStatus[r.status] = r._sum.totalAmount ?? 0;
    });
    const totalApprovedAmount =
      Object.entries(sumByStatus).reduce((s, [, v]) => s + v, 0) -
      (sumByStatus.rejected ?? 0);
    return {
      countByStatus,
      sumByStatus,
      totalApprovedAmount,
    };
  }

  async reject(id: string, rejectedByUserId: string, reason?: string) {
    const claim = await prisma.expenseClaim.findUnique({ where: { id } });
    if (!claim) throw errors.notFound('Expense claim');
    if (claim.status === 'paid' || claim.status === 'rejected') {
      throw errors.badRequest('Claim cannot be rejected in current state');
    }
    const updated = await prisma.expenseClaim.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: rejectedByUserId,
        rejectReason: reason?.trim() || null,
      },
      include: {
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        items: { include: { expenseType: { select: { id: true, name: true, category: true } } } },
      },
    });
    return this.toDto(updated);
  }

  private toDto(claim: {
    id: string;
    employeeId: string;
    totalAmount: number;
    status: string;
    managerApprovedAt: Date | null;
    managerApprovedBy: string | null;
    financeApprovedAt: Date | null;
    financeApprovedBy: string | null;
    hrApprovedAt: Date | null;
    hrApprovedBy: string | null;
    rejectedAt: Date | null;
    rejectedBy: string | null;
    rejectReason: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    employee?: { employeeCode: string; firstName: string; lastName: string };
    items: Array<{
      id: string;
      claimId: string;
      expenseTypeId: number;
      amount: number;
      quantity: number | null;
      description: string | null;
      expenseDate: Date;
      createdAt: Date;
      expenseType: { id: number; name: string; category: string };
    }>;
  }): ExpenseClaimDto {
    return {
      id: claim.id,
      employeeId: claim.employeeId,
      employeeName: claim.employee
        ? `${claim.employee.firstName} ${claim.employee.lastName}`.trim()
        : undefined,
      totalAmount: claim.totalAmount,
      status: claim.status,
      managerApprovedAt: claim.managerApprovedAt,
      managerApprovedBy: claim.managerApprovedBy,
      financeApprovedAt: claim.financeApprovedAt,
      financeApprovedBy: claim.financeApprovedBy,
      hrApprovedAt: claim.hrApprovedAt,
      hrApprovedBy: claim.hrApprovedBy,
      rejectedAt: claim.rejectedAt,
      rejectedBy: claim.rejectedBy,
      rejectReason: claim.rejectReason,
      paidAt: claim.paidAt,
      createdAt: claim.createdAt,
      updatedAt: claim.updatedAt,
      items: claim.items.map((i) => ({
        id: i.id,
        claimId: i.claimId,
        expenseTypeId: i.expenseTypeId,
        expenseTypeName: i.expenseType.name,
        expenseTypeCategory: i.expenseType.category,
        amount: i.amount,
        quantity: i.quantity,
        description: i.description,
        expenseDate: i.expenseDate.toISOString().slice(0, 10),
        createdAt: i.createdAt,
      })),
    };
  }
}
