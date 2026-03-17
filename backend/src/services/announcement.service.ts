import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const TYPES = [
  'birthday',
  'holiday',
  'asset',
  'event',
  'deadline',
  'urgent',
  'policy',
] as const;

export type AnnouncementDto = {
  id: string;
  type: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdBy: string;
  creatorName?: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  readCount?: number;
};

export class AnnouncementService {
  async list(filters: {
    type?: string;
    limit?: number;
    offset?: number;
    sentOnly?: boolean;
  }) {
    const where: { type?: string; sentAt?: { not: null } | null } = {};
    if (filters.type && TYPES.includes(filters.type as (typeof TYPES)[number])) {
      where.type = filters.type;
    }
    if (filters.sentOnly) where.sentAt = { not: null };

    const [list, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: Math.min(100, filters.limit ?? 50),
        skip: filters.offset ?? 0,
        include: {
          creator: { select: { employeeCode: true, firstName: true, lastName: true } },
          _count: { select: { reads: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);
    return {
      items: list.map((a) => this.toDto(a)),
      total,
    };
  }

  async getById(id: string) {
    const a = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
        _count: { select: { reads: true } },
      },
    });
    if (!a) throw errors.notFound('Announcement');
    return this.toDto(a);
  }

  async create(
    createdBy: string,
    data: { type: string; title: string; body: string; eventDate?: string | null }
  ) {
    if (!data.title?.trim() || !data.body?.trim()) {
      throw errors.badRequest('title and body are required');
    }
    if (!data.type || !TYPES.includes(data.type as (typeof TYPES)[number])) {
      throw errors.badRequest(`type must be one of: ${TYPES.join(', ')}`);
    }
    const emp = await prisma.employee.findUnique({ where: { employeeCode: createdBy } });
    if (!emp) throw errors.notFound('Employee');

    const created = await prisma.announcement.create({
      data: {
        type: data.type,
        title: data.title.trim(),
        body: data.body.trim(),
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        createdBy,
      },
      include: {
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(created);
  }

  async update(
    id: string,
    data: { type?: string; title?: string; body?: string; eventDate?: string | null }
  ) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Announcement');
    if (existing.sentAt) throw errors.badRequest('Cannot edit a sent announcement');

    const update: { type?: string; title?: string; body?: string; eventDate?: Date | null } = {};
    if (data.type !== undefined) {
      if (!TYPES.includes(data.type as (typeof TYPES)[number])) {
        throw errors.badRequest(`type must be one of: ${TYPES.join(', ')}`);
      }
      update.type = data.type;
    }
    if (data.title !== undefined) update.title = data.title.trim();
    if (data.body !== undefined) update.body = data.body.trim();
    if (data.eventDate !== undefined) {
      update.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: update,
      include: {
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(updated);
  }

  async delete(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Announcement');
    await prisma.announcement.delete({ where: { id } });
    return { deleted: true };
  }

  async publish(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Announcement');
    const updated = await prisma.announcement.update({
      where: { id },
      data: { sentAt: new Date() },
      include: {
        creator: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(updated);
  }

  async markRead(announcementId: string, employeeId: string) {
    const ann = await prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!ann) throw errors.notFound('Announcement');
    await prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: { announcementId, employeeId },
      },
      create: { announcementId, employeeId },
      update: {},
    });
    return { read: true };
  }

  /** Employees with birthday today / this week / this month (from Employee.dateOfBirth) */
  async getBirthdays(filter: 'today' | 'week' | 'month') {
    const now = new Date();
    const month = now.getMonth();
    const date = now.getDate();

    const where: { dateOfBirth: { not: null }; status?: string } = {
      dateOfBirth: { not: null },
      status: 'active',
    };

    if (filter === 'today') {
      where.dateOfBirth = {
        not: null,
        // Prisma doesn't support day/month extract easily; use raw or filter in JS
      } as any;
    }

    const employees = await prisma.employee.findMany({
      where: { status: 'active', dateOfBirth: { not: null } },
      select: { employeeCode: true, firstName: true, lastName: true, dateOfBirth: true },
    });

    const match = (d: Date) => {
      const m = d.getMonth();
      const day = d.getDate();
      if (filter === 'today') return m === month && day === date;
      if (filter === 'week') {
        const todayStart = new Date(now.getFullYear(), month, date);
        const weekEnd = new Date(todayStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const dThisYear = new Date(now.getFullYear(), m, day);
        return dThisYear >= todayStart && dThisYear < weekEnd;
      }
      return m === month;
    };

    const list = employees
      .filter((e) => e.dateOfBirth && match(e.dateOfBirth))
      .map((e) => ({
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        dateOfBirth: e.dateOfBirth!.toISOString().slice(0, 10),
      }));
    return { items: list };
  }

  /** Upcoming holiday announcements (type=holiday, eventDate >= today) */
  async getUpcomingHolidays(limit = 20) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = await prisma.announcement.findMany({
      where: {
        type: 'holiday',
        sentAt: { not: null },
        eventDate: { gte: today },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
      include: {
        creator: { select: { firstName: true, lastName: true } },
      },
    });
    return {
      items: list.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        eventDate: a.eventDate?.toISOString().slice(0, 10) ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  /** Asset allocations with no return (pending/overdue) for collection reminders */
  async getAssetReminders(overdueOnly?: boolean) {
    const allocations = await prisma.assetAllocation.findMany({
      where: { returnedAt: null },
      include: {
        asset: { select: { id: true, name: true, serialNumber: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    const now = new Date();
    const DAYS_OVERDUE = 0; // consider overdue if return expected and past
    const list = allocations.map((a) => {
      const assignedAt = a.assignedAt;
      const daysOut = Math.floor((now.getTime() - assignedAt.getTime()) / (24 * 60 * 60 * 1000));
      const overdue = daysOut > 30; // simple: > 30 days = overdue
      return {
        id: a.id,
        assetName: a.asset.name,
        serialNumber: a.asset.serialNumber,
        employeeCode: a.employee.employeeCode,
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
        assignedAt: a.assignedAt.toISOString().slice(0, 10),
        daysOut,
        overdue,
      };
    });
    const items = overdueOnly ? list.filter((x) => x.overdue) : list;
    return { items };
  }

  /** Report: sent announcements with read counts */
  async report(limit = 50) {
    const list = await prisma.announcement.findMany({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        creator: { select: { firstName: true, lastName: true } },
        _count: { select: { reads: true } },
      },
    });
    return {
      items: list.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        sentAt: a.sentAt!.toISOString(),
        creatorName: `${a.creator.firstName} ${a.creator.lastName}`.trim(),
        readCount: a._count.reads,
      })),
    };
  }

  private toDto(a: {
    id: string;
    type: string;
    title: string;
    body: string;
    eventDate: Date | null;
    createdBy: string;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    creator?: { firstName: string; lastName: string };
    _count?: { reads: number };
  }): AnnouncementDto {
    return {
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      eventDate: a.eventDate?.toISOString().slice(0, 10) ?? null,
      createdBy: a.createdBy,
      creatorName: a.creator ? `${a.creator.firstName} ${a.creator.lastName}`.trim() : undefined,
      sentAt: a.sentAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      readCount: (a as any)._count?.reads,
    };
  }
}
