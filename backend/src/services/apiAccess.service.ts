import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const KEY_PREFIX = 'hrms_';
const KEY_BYTES = 24;

export type CreateApiAccessInput = {
  clientName: string;
  rateLimitPerHour?: number;
  expiresAt?: Date | null;
  /** Fields this key can access for GET .../employees/:id/full. Empty = use global setting / all. */
  employeeFullFields?: string[];
};

export class ApiAccessService {
  /** Generate a new API key (prefix + hex random). Shown only once on create. */
  generateKey(): string {
    return KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString('hex');
  }

  async list() {
    const list = await prisma.apiAccess.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return list.map((a) => {
      const permissions = (a.permissions as { employeeFullFields?: string[] } | null) ?? {};
      return {
        id: a.id,
        clientName: a.clientName,
        apiKeyMasked: this.maskKey(a.apiKey),
        isActive: a.isActive,
        rateLimitPerHour: a.rateLimitPerHour,
        expiresAt: a.expiresAt,
        lastUsedAt: a.lastUsedAt,
        createdAt: a.createdAt,
        employeeFullFields: permissions.employeeFullFields ?? null,
      };
    });
  }

  maskKey(key: string): string {
    if (key.length <= 12) return '••••••••';
    return key.slice(0, 8) + '••••••••' + key.slice(-4);
  }

  async create(data: CreateApiAccessInput): Promise<{ id: string; apiKey: string; clientName: string; rateLimitPerHour: number; expiresAt: Date | null; createdAt: Date; employeeFullFields: string[] | null }> {
    const name = data.clientName.trim();
    if (!name) throw errors.badRequest('Client name is required');
    const rateLimit = Math.max(1, Math.min(10000, data.rateLimitPerHour ?? 1000));
    const apiKey = this.generateKey();
    const permissions =
      data.employeeFullFields?.length ?
        ({ employeeFullFields: data.employeeFullFields } as object)
      : undefined;
    const record = await prisma.apiAccess.create({
      data: {
        clientName: name,
        apiKey,
        isActive: true,
        rateLimitPerHour: rateLimit,
        expiresAt: data.expiresAt ?? null,
        permissions: permissions ?? undefined,
      },
    });
    const perms = (record.permissions as { employeeFullFields?: string[] } | null) ?? {};
    return {
      id: record.id,
      apiKey: record.apiKey,
      clientName: record.clientName,
      rateLimitPerHour: record.rateLimitPerHour,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      employeeFullFields: perms.employeeFullFields ?? null,
    };
  }

  async revoke(id: string) {
    const existing = await prisma.apiAccess.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('API access');
    await prisma.apiAccess.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string) {
    const existing = await prisma.apiAccess.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('API access');
    await prisma.apiAccess.delete({ where: { id } });
  }

  /** Get employee full API fields allowed for this API key (from permissions). Null = use global setting. */
  async getEmployeeFullFieldsForKey(apiAccessId: string): Promise<string[] | null> {
    const record = await prisma.apiAccess.findUnique({
      where: { id: apiAccessId },
      select: { permissions: true },
    });
    const permissions = (record?.permissions as { employeeFullFields?: string[] } | null) ?? {};
    const fields = permissions.employeeFullFields;
    return fields?.length ? fields : null;
  }

  /** Validate API key and return record if valid and within rate limit. */
  async validateKey(key: string): Promise<{ id: string; rateLimitPerHour: number } | null> {
    if (!key?.trim()) return null;
    const record = await prisma.apiAccess.findFirst({
      where: { apiKey: key.trim(), isActive: true },
    });
    if (!record) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;
    return { id: record.id, rateLimitPerHour: record.rateLimitPerHour };
  }

  async touchLastUsed(id: string) {
    await prisma.apiAccess.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /** Log an API call for the integration endpoints */
  async logCall(apiAccessId: string, method: string, endpoint: string, statusCode: number, ipAddress?: string | null) {
    await prisma.apiAccessLog.create({
      data: {
        apiAccessId,
        method,
        endpoint,
        statusCode,
        ipAddress: ipAddress || null,
      },
    });
  }

  /** List recent API call logs (paginated), optional filter by apiAccessId */
  async listLogs(options: { apiAccessId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 50));
    const skip = (page - 1) * limit;
    const where = options.apiAccessId ? { apiAccessId: options.apiAccessId } : {};
    const [logs, total] = await Promise.all([
      prisma.apiAccessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { apiAccess: { select: { clientName: true } } },
      }),
      prisma.apiAccessLog.count({ where }),
    ]);
    return {
      items: logs.map((l) => ({
        id: l.id,
        apiAccessId: l.apiAccessId,
        clientName: l.apiAccess.clientName,
        method: l.method,
        endpoint: l.endpoint,
        statusCode: l.statusCode,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
