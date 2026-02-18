import { prisma, adminPrisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

/** Use admin connection for writes when hrms_user lacks sequence permissions (e.g. tables created by postgres) */
const writeDb = adminPrisma ?? prisma;

export type CreateDepartmentInput = {
  name: string;
  description?: string;
  headId?: string;
  parentId?: number;
  isActive?: boolean;
};

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export class DepartmentService {
  async list() {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { employees: true } },
        parent: { select: { id: true, name: true } },
      },
    });
    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      headId: d.headId,
      parentId: d.parentId,
      parentName: d.parent?.name ?? null,
      isActive: d.isActive,
      createdAt: d.createdAt,
      employeeCount: d._count.employees,
    }));
  }

  async getById(id: number) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, _count: { select: { employees: true } } } },
      },
    });
    if (!department) throw errors.notFound('Department');
    return {
      ...department,
      employeeCount: department._count.employees,
      children: department.children.map((c) => ({
        id: c.id,
        name: c.name,
        employeeCount: c._count.employees,
      })),
    };
  }

  async create(data: CreateDepartmentInput) {
    const existing = await prisma.department.findUnique({ where: { name: data.name.trim() } });
    if (existing) throw errors.conflict('Department with this name already exists');
    if (data.parentId != null) {
      const parent = await prisma.department.findUnique({ where: { id: data.parentId } });
      if (!parent) throw errors.badRequest('Parent department not found');
    }
    const department = await writeDb.department.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        headId: data.headId || null,
        parentId: data.parentId ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return department;
  }

  async update(id: number, data: UpdateDepartmentInput) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Department');
    if (data.name != null) {
      const byName = await prisma.department.findFirst({
        where: { name: data.name.trim(), NOT: { id } },
      });
      if (byName) throw errors.conflict('Department with this name already exists');
    }
    if (data.parentId != null && data.parentId !== existing.parentId) {
      if (data.parentId === id) throw errors.badRequest('Department cannot be its own parent');
      const parent = await prisma.department.findUnique({ where: { id: data.parentId } });
      if (!parent) throw errors.badRequest('Parent department not found');
    }
    const department = await writeDb.department.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.headId !== undefined && { headId: data.headId || null }),
        ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return department;
  }
}
