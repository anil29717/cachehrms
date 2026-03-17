import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const CONDITIONS = ['good', 'fair', 'poor'] as const;

export class AssetAllocationService {
  /** Current allocations (returnedAt is null) */
  async listAllocated(filters: { employeeId?: string; assetId?: string }) {
    const where: { returnedAt: null; employeeId?: string; assetId?: string } = { returnedAt: null };
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.assetId) where.assetId = filters.assetId;
    const list = await prisma.assetAllocation.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return list.map((a) => ({
      id: a.id,
      assetId: a.assetId,
      assetName: a.asset.name,
      categoryName: a.asset.category.name,
      serialNumber: a.asset.serialNumber,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
      assignedAt: a.assignedAt.toISOString(),
      conditionAtAssignment: a.conditionAtAssignment,
      notes: a.notes,
    }));
  }

  /** Allocation history (optional returned only) */
  async listHistory(filters: { employeeId?: string; assetId?: string; limit?: number }) {
    const where: { employeeId?: string; assetId?: string } = {};
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.assetId) where.assetId = filters.assetId;
    const list = await prisma.assetAllocation.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      take: Math.min(100, filters.limit ?? 50),
      include: {
        asset: { include: { category: { select: { name: true } } } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return list.map((a) => ({
      id: a.id,
      assetId: a.assetId,
      assetName: a.asset.name,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
      assignedAt: a.assignedAt.toISOString(),
      returnedAt: a.returnedAt?.toISOString() ?? null,
      conditionAtAssignment: a.conditionAtAssignment,
      notes: a.notes,
    }));
  }

  async assign(data: {
    assetId: string;
    employeeId: string;
    conditionAtAssignment?: string;
    notes?: string;
  }) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) throw errors.notFound('Asset');
    if (asset.status !== 'available') throw errors.badRequest('Asset is not available for assignment');
    const emp = await prisma.employee.findUnique({ where: { employeeCode: data.employeeId } });
    if (!emp) throw errors.notFound('Employee');
    if (data.conditionAtAssignment && !CONDITIONS.includes(data.conditionAtAssignment as (typeof CONDITIONS)[number])) {
      throw errors.badRequest('conditionAtAssignment must be one of: good, fair, poor');
    }
    const existing = await prisma.assetAllocation.findFirst({ where: { assetId: data.assetId, returnedAt: null } });
    if (existing) throw errors.conflict('Asset is already allocated');

    const assignedAt = new Date();
    const [allocation] = await prisma.$transaction([
      prisma.assetAllocation.create({
        data: {
          assetId: data.assetId,
          employeeId: data.employeeId,
          assignedAt,
          conditionAtAssignment: data.conditionAtAssignment?.trim() || null,
          notes: data.notes?.trim() || null,
        },
        include: {
          asset: { include: { category: { select: { name: true } } } },
          employee: { select: { employeeCode: true, firstName: true, lastName: true } },
        },
      }),
      prisma.asset.update({
        where: { id: data.assetId },
        data: { status: 'allocated' },
      }),
    ]);
    return {
      id: allocation.id,
      assetId: allocation.assetId,
      assetName: allocation.asset.name,
      categoryName: allocation.asset.category.name,
      employeeId: allocation.employeeId,
      employeeName: `${allocation.employee.firstName} ${allocation.employee.lastName}`.trim(),
      assignedAt: allocation.assignedAt.toISOString(),
      conditionAtAssignment: allocation.conditionAtAssignment,
      notes: allocation.notes,
    };
  }

  async returnAllocation(allocationId: string) {
    const allocation = await prisma.assetAllocation.findUnique({
      where: { id: allocationId },
      include: { asset: true, employee: { select: { firstName: true, lastName: true } } },
    });
    if (!allocation) throw errors.notFound('Allocation');
    if (allocation.returnedAt) throw errors.badRequest('Asset already returned');

    const returnedAt = new Date();
    await prisma.$transaction([
      prisma.assetAllocation.update({
        where: { id: allocationId },
        data: { returnedAt },
      }),
      prisma.asset.update({
        where: { id: allocation.assetId },
        data: { status: 'available' },
      }),
    ]);
    return {
      id: allocation.id,
      assetId: allocation.assetId,
      assetName: allocation.asset.name,
      employeeName: `${allocation.employee.firstName} ${allocation.employee.lastName}`.trim(),
      assignedAt: allocation.assignedAt.toISOString(),
      returnedAt: returnedAt.toISOString(),
    };
  }
}
