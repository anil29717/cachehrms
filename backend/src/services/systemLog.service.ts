import { prisma } from '../config/database.js';

export type SystemLogCreate = {
  userId?: string;
  employeeId?: string;
  email?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
};

const MAX_PATH_LENGTH = 512;
const MAX_USER_AGENT_LENGTH = 2000;

export class SystemLogService {
  /** Write one log entry (fire-and-forget; do not await in hot path). */
  async create(data: SystemLogCreate): Promise<void> {
    const path = data.path.length > MAX_PATH_LENGTH ? data.path.slice(0, MAX_PATH_LENGTH) : data.path;
    const userAgent = data.userAgent
      ? data.userAgent.length > MAX_USER_AGENT_LENGTH
        ? data.userAgent.slice(0, MAX_USER_AGENT_LENGTH)
        : data.userAgent
      : null;
    try {
      if (!prisma.systemLog) return;
      await prisma.systemLog.create({
        data: {
          userId: data.userId ?? null,
          employeeId: data.employeeId ?? null,
          email: data.email ?? null,
          method: data.method,
          path,
          statusCode: data.statusCode,
          ip: data.ip ?? null,
          userAgent,
        },
      });
    } catch (err) {
      console.error('SystemLog create failed:', err);
    }
  }

  async list(filters: {
    limit?: number;
    offset?: number;
    userId?: string;
    employeeId?: string;
    method?: string;
    pathContains?: string;
    statusCode?: number;
    from?: string;
    to?: string;
  }) {
    const where: {
      userId?: string;
      employeeId?: string;
      method?: string;
      path?: { contains: string; mode: 'insensitive' };
      statusCode?: number;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.method) where.method = filters.method;
    if (filters.pathContains) where.path = { contains: filters.pathContains, mode: 'insensitive' };
    if (filters.statusCode != null) where.statusCode = filters.statusCode;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const limit = Math.min(100, Math.max(1, filters.limit ?? 50));
    const offset = Math.max(0, filters.offset ?? 0);

    if (!prisma.systemLog) return { items: [], total: 0 };

    const [items, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.systemLog.count({ where }),
    ]);

    return { items, total };
  }
}
