import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const ASSET_STATUSES = ['available', 'allocated', 'under_maintenance', 'retired'] as const;
const CONDITIONS = ['good', 'fair', 'poor'] as const;

export class AssetService {
  async list(filters: { categoryId?: number; status?: string; search?: string; limit?: number }) {
    const where: { categoryId?: number; status?: string; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; serialNumber?: { contains: string; mode: 'insensitive' } }> } = {};
    if (filters.categoryId != null) where.categoryId = filters.categoryId;
    if (filters.status && ASSET_STATUSES.includes(filters.status as (typeof ASSET_STATUSES)[number])) where.status = filters.status;
    if (filters.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { serialNumber: { contains: term, mode: 'insensitive' } },
      ];
    }
    const list = await prisma.asset.findMany({
      where,
      orderBy: { name: 'asc' },
      take: Math.min(200, filters.limit ?? 100),
      include: {
        category: { select: { id: true, name: true } },
        allocations: {
          where: { returnedAt: null },
          take: 1,
          include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
        },
      },
    });
    return list.map((a) => ({
      id: a.id,
      categoryId: a.categoryId,
      categoryName: a.category.name,
      name: a.name,
      serialNumber: a.serialNumber,
      purchaseDate: a.purchaseDate?.toISOString().slice(0, 10) ?? null,
      status: a.status,
      condition: a.condition,
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      assignedTo: a.allocations[0]
        ? {
            employeeId: a.allocations[0].employeeId,
            employeeName: `${a.allocations[0].employee.firstName} ${a.allocations[0].employee.lastName}`.trim(),
          }
        : null,
    }));
  }

  async getById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        allocations: {
          where: { returnedAt: null },
          take: 1,
          include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!asset) throw errors.notFound('Asset');
    return {
      id: asset.id,
      categoryId: asset.categoryId,
      categoryName: asset.category.name,
      name: asset.name,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate?.toISOString().slice(0, 10) ?? null,
      status: asset.status,
      condition: asset.condition,
      notes: asset.notes,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      assignedTo: asset.allocations[0]
        ? {
            employeeId: asset.allocations[0].employeeId,
            employeeName: `${asset.allocations[0].employee.firstName} ${asset.allocations[0].employee.lastName}`.trim(),
          }
        : null,
    };
  }

  async create(data: {
    categoryId: number;
    name: string;
    serialNumber?: string;
    purchaseDate?: Date;
    condition?: string;
    notes?: string;
  }) {
    if (!data.name?.trim()) throw errors.badRequest('Asset name is required');
    const cat = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw errors.notFound('Asset category');
    if (data.condition && !CONDITIONS.includes(data.condition as (typeof CONDITIONS)[number])) {
      throw errors.badRequest('condition must be one of: good, fair, poor');
    }
    const asset = await prisma.asset.create({
      data: {
        categoryId: data.categoryId,
        name: data.name.trim(),
        serialNumber: data.serialNumber?.trim() || null,
        purchaseDate: data.purchaseDate ?? null,
        status: 'available',
        condition: data.condition?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return this.toDto(asset);
  }

  async update(
    id: string,
    data: { name?: string; serialNumber?: string; purchaseDate?: Date; status?: string; condition?: string; notes?: string }
  ) {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Asset');
    if (data.status && !ASSET_STATUSES.includes(data.status as (typeof ASSET_STATUSES)[number])) {
      throw errors.badRequest('status must be one of: available, allocated, under_maintenance, retired');
    }
    if (data.condition && !CONDITIONS.includes(data.condition as (typeof CONDITIONS)[number])) {
      throw errors.badRequest('condition must be one of: good, fair, poor');
    }
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name.trim() }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber?.trim() || null }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate }),
        ...(data.status != null && { status: data.status }),
        ...(data.condition !== undefined && { condition: data.condition?.trim() || null }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return this.toDto(asset);
  }

  async delete(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw errors.notFound('Asset');
    const active = await prisma.assetAllocation.findFirst({ where: { assetId: id, returnedAt: null } });
    if (active) throw errors.badRequest('Cannot delete asset that is currently allocated. Return it first.');
    await prisma.asset.delete({ where: { id } });
  }

  private toDto(a: {
    id: string;
    categoryId: number;
    name: string;
    serialNumber: string | null;
    purchaseDate: Date | null;
    status: string;
    condition: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: { id: number; name: string };
  }) {
    return {
      id: a.id,
      categoryId: a.categoryId,
      categoryName: a.category.name,
      name: a.name,
      serialNumber: a.serialNumber,
      purchaseDate: a.purchaseDate?.toISOString().slice(0, 10) ?? null,
      status: a.status,
      condition: a.condition,
      notes: a.notes,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
