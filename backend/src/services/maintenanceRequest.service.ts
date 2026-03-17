import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

export class MaintenanceRequestService {
  async list(filters: { assetId?: string; status?: string; limit?: number }) {
    const where: { assetId?: string; status?: string } = {};
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.status && STATUSES.includes(filters.status as (typeof STATUSES)[number])) where.status = filters.status;
    const list = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: Math.min(100, filters.limit ?? 50),
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return list.map((r) => ({
      id: r.id,
      assetId: r.assetId,
      assetName: r.asset.name,
      categoryName: r.asset.category.name,
      requestedBy: r.requestedBy,
      requestedByName: `${r.employee.firstName} ${r.employee.lastName}`.trim(),
      requestedAt: r.requestedAt.toISOString(),
      description: r.description,
      status: r.status,
      completedAt: r.completedAt?.toISOString() ?? null,
      cost: r.cost,
      repairNotes: r.repairNotes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getById(id: string) {
    const r = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    if (!r) throw errors.notFound('Maintenance request');
    return {
      id: r.id,
      assetId: r.assetId,
      assetName: r.asset.name,
      categoryName: r.asset.category.name,
      requestedBy: r.requestedBy,
      requestedByName: `${r.employee.firstName} ${r.employee.lastName}`.trim(),
      requestedAt: r.requestedAt.toISOString(),
      description: r.description,
      status: r.status,
      completedAt: r.completedAt?.toISOString() ?? null,
      cost: r.cost,
      repairNotes: r.repairNotes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  async create(employeeId: string, data: { assetId: string; description: string }) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw errors.notFound('Asset');
    const emp = await prisma.employee.findUnique({ where: { employeeCode: employeeId } });
    if (!emp) throw errors.notFound('Employee');
    if (!data.description?.trim()) throw errors.badRequest('Description is required');
    const req = await prisma.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        requestedBy: employeeId,
        requestedAt: new Date(),
        description: data.description.trim(),
        status: 'pending',
      },
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });
    return {
      id: req.id,
      assetId: req.assetId,
      assetName: req.asset.name,
      requestedBy: req.requestedBy,
      requestedByName: `${req.employee.firstName} ${req.employee.lastName}`.trim(),
      requestedAt: req.requestedAt.toISOString(),
      description: req.description,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
    };
  }

  async updateStatus(
    id: string,
    data: { status?: string; completedAt?: Date; cost?: number; repairNotes?: string }
  ) {
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Maintenance request');
    const status = data.status ?? existing.status;
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      throw errors.badRequest('status must be one of: pending, in_progress, completed, cancelled');
    }
    const completedAt = status === 'completed' ? (data.completedAt ?? new Date()) : null;
    const req = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status,
        ...(completedAt != null && { completedAt }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.repairNotes !== undefined && { repairNotes: data.repairNotes?.trim() || null }),
      },
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });
    if (status === 'in_progress') {
      await prisma.asset.update({
        where: { id: req.assetId },
        data: { status: 'under_maintenance' },
      });
    } else if (status === 'completed') {
      await prisma.asset.update({
        where: { id: req.assetId },
        data: { status: 'available' },
      });
    } else if (data.status === 'cancelled') {
      await prisma.asset.update({
        where: { id: req.assetId },
        data: { status: 'available' },
      });
    }
    return {
      id: req.id,
      assetId: req.assetId,
      assetName: req.asset.name,
      status: req.status,
      completedAt: req.completedAt?.toISOString() ?? null,
      cost: req.cost,
      repairNotes: req.repairNotes,
      updatedAt: req.updatedAt.toISOString(),
    };
  }
}
