import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export class TicketService {
  async list(filters: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    categoryId?: number;
    createdBy?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      categoryId?: number;
      createdBy?: string;
      OR?: { subject?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }[];
    } = {};
    if (filters.status && STATUSES.includes(filters.status as (typeof STATUSES)[number])) where.status = filters.status;
    if (filters.priority && PRIORITIES.includes(filters.priority as (typeof PRIORITIES)[number])) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.categoryId != null) where.categoryId = filters.categoryId;
    if (filters.createdBy) where.createdBy = filters.createdBy;
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(100, filters.limit ?? 50),
        skip: filters.offset ?? 0,
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { employeeCode: true, firstName: true, lastName: true } },
          regarding: { select: { employeeCode: true, firstName: true, lastName: true } },
          assignee: { select: { employeeCode: true, firstName: true, lastName: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);
    return {
      items: list.map((t) => this.toDto(t)),
      total,
    };
  }

  async getById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
        regarding: { select: { employeeCode: true, firstName: true, lastName: true } },
        assignee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    if (!ticket) throw errors.notFound('Ticket');
    return this.toDto(ticket);
  }

  async create(
    createdBy: string,
    data: { categoryId?: number; subject: string; description: string; priority?: string; regardingEmployeeCode?: string }
  ) {
    const emp = await prisma.employee.findUnique({ where: { employeeCode: createdBy } });
    if (!emp) throw errors.notFound('Employee');
    if (!data.subject?.trim()) throw errors.badRequest('Subject is required');
    if (!data.description?.trim()) throw errors.badRequest('Description is required');
    const priority = data.priority && PRIORITIES.includes(data.priority as (typeof PRIORITIES)[number]) ? data.priority : 'medium';
    if (data.categoryId != null) {
      const cat = await prisma.ticketCategory.findUnique({ where: { id: data.categoryId } });
      if (!cat) throw errors.notFound('Ticket category');
    }
    if (data.regardingEmployeeCode) {
      const regarding = await prisma.employee.findUnique({ where: { employeeCode: data.regardingEmployeeCode } });
      if (!regarding) throw errors.notFound('Employee (regarding)');
    }
    const ticket = await prisma.ticket.create({
      data: {
        categoryId: data.categoryId ?? null,
        subject: data.subject.trim(),
        description: data.description.trim(),
        status: 'open',
        priority,
        createdBy,
        regardingEmployeeCode: data.regardingEmployeeCode?.trim() || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
        regarding: { select: { employeeCode: true, firstName: true, lastName: true } },
        assignee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(ticket);
  }

  async update(
    id: string,
    data: { status?: string; priority?: string; assignedTo?: string; categoryId?: number }
  ) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Ticket');
    if (data.status && !STATUSES.includes(data.status as (typeof STATUSES)[number])) {
      throw errors.badRequest('status must be one of: open, in_progress, resolved, closed');
    }
    if (data.priority && !PRIORITIES.includes(data.priority as (typeof PRIORITIES)[number])) {
      throw errors.badRequest('priority must be one of: low, medium, high, urgent');
    }
    if (data.assignedTo !== undefined) {
      if (data.assignedTo) {
        const emp = await prisma.employee.findUnique({ where: { employeeCode: data.assignedTo } });
        if (!emp) throw errors.notFound('Employee');
      }
    }
    const updateData: {
      status?: string;
      priority?: string;
      assignedTo?: string | null;
      categoryId?: number | null;
      resolvedAt?: Date | null;
      closedAt?: Date | null;
    } = {
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo || null }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId ?? null }),
    };
    if (data.status === 'resolved') updateData.resolvedAt = updateData.resolvedAt ?? new Date();
    if (data.status === 'closed') updateData.closedAt = updateData.closedAt ?? new Date();
    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
        regarding: { select: { employeeCode: true, firstName: true, lastName: true } },
        assignee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(ticket);
  }

  /** Dashboard stats: total, open count, high-priority count, avg resolution hours */
  async getStats() {
    const [total, openCount, highPriorityCount, resolutionData] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'open' } }),
      prisma.ticket.count({ where: { priority: { in: ['high', 'urgent'] }, status: { notIn: ['resolved', 'closed'] } } }),
      prisma.ticket.findMany({
        where: { status: { in: ['resolved', 'closed'] }, OR: [{ resolvedAt: { not: null } }, { closedAt: { not: null } }] },
        select: { createdAt: true, resolvedAt: true, closedAt: true },
      }),
    ]);
    const hours = resolutionData
      .map((t) => {
        const end = t.resolvedAt ?? t.closedAt;
        if (!end) return null;
        return (end.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      })
      .filter((h): h is number => h != null);
    const avgResolutionHours = hours.length ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 100) / 100 : null;
    return { total, open: openCount, highPriority: highPriorityCount, avgResolutionHours };
  }

  /** Report: ticket volume by status (and optionally by category, date range) */
  async reportVolume(filters: { categoryId?: number; from?: string; to?: string }) {
    const where: { categoryId?: number; createdAt?: { gte?: Date; lte?: Date } } = {};
    if (filters.categoryId != null) where.categoryId = filters.categoryId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    const tickets = await prisma.ticket.findMany({
      where,
      select: { status: true, priority: true, categoryId: true },
    });
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    tickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    });
    return {
      total: tickets.length,
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
    };
  }

  /** Report: resolution time (avg hours from createdAt to resolvedAt/closedAt for resolved/closed tickets) */
  async reportResolutionTime(filters: { categoryId?: number; from?: string; to?: string }) {
    const where: { status: { in: string[] }; categoryId?: number } = { status: { in: ['resolved', 'closed'] } };
    if (filters.categoryId != null) where.categoryId = filters.categoryId;
    const tickets = await prisma.ticket.findMany({
      where,
      select: { createdAt: true, resolvedAt: true, closedAt: true },
    });
    let from: Date | undefined;
    let to: Date | undefined;
    if (filters.from) from = new Date(filters.from);
    if (filters.to) to = new Date(filters.to);
    const filtered = tickets.filter((t) => {
      const end = t.resolvedAt ?? t.closedAt;
      if (!end) return false;
      if (from && end < from) return false;
      if (to && end > to) return false;
      return true;
    });
    if (filtered.length === 0) {
      return { count: 0, avgHours: null, minHours: null, maxHours: null };
    }
    const hours = filtered.map((t) => {
      const end = t.resolvedAt ?? t.closedAt!;
      return (end.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
    });
    const sum = hours.reduce((a, b) => a + b, 0);
    return {
      count: filtered.length,
      avgHours: Math.round((sum / hours.length) * 100) / 100,
      minHours: Math.round(Math.min(...hours) * 100) / 100,
      maxHours: Math.round(Math.max(...hours) * 100) / 100,
    };
  }

  private toDto(t: {
    id: string;
    categoryId: number | null;
    subject: string;
    description: string;
    status: string;
    priority: string;
    createdBy: string;
    regardingEmployeeCode: string | null;
    assignedTo: string | null;
    resolvedAt: Date | null;
    closedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    category: { id: number; name: string } | null;
    creator: { employeeCode: string; firstName: string; lastName: string };
    regarding: { employeeCode: string; firstName: string; lastName: string } | null;
    assignee: { employeeCode: string; firstName: string; lastName: string } | null;
  }) {
    return {
      id: t.id,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? null,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      createdBy: t.createdBy,
      createdByName: `${t.creator.firstName} ${t.creator.lastName}`.trim(),
      regardingEmployeeCode: t.regardingEmployeeCode ?? null,
      regardingEmployeeName: t.regarding ? `${t.regarding.firstName} ${t.regarding.lastName}`.trim() : null,
      assignedTo: t.assignedTo,
      assignedToName: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}`.trim() : null,
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
      closedAt: t.closedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
