import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const CATEGORIES = [
  'travel',
  'food',
  'accommodation',
  'office',
  'learning',
  'medical',
  'relocation',
] as const;
const LIMIT_UNITS = ['day', 'km', 'meal', 'person', 'month', 'year'] as const; // null = one_time

export type ExpenseTypeDto = {
  id: number;
  category: string;
  name: string;
  limitAmount: number;
  limitUnit: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class ExpenseTypeService {
  async list(filters: { category?: string; isActive?: boolean }) {
    const where: { category?: string; isActive?: boolean } = {};
    if (filters.category) where.category = filters.category;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const list = await prisma.expenseType.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return list.map((t) => this.toDto(t));
  }

  async getById(id: number) {
    const row = await prisma.expenseType.findUnique({ where: { id } });
    if (!row) throw errors.notFound('Expense type');
    return this.toDto(row);
  }

  async create(data: {
    category: string;
    name: string;
    limitAmount: number;
    limitUnit?: string | null;
  }) {
    if (!data.category?.trim() || !data.name?.trim()) {
      throw errors.badRequest('category and name are required');
    }
    const category = data.category.trim().toLowerCase();
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      throw errors.badRequest(
        `category must be one of: ${CATEGORIES.join(', ')}`
      );
    }
    if (data.limitUnit != null && data.limitUnit !== '' && !LIMIT_UNITS.includes(data.limitUnit as (typeof LIMIT_UNITS)[number])) {
      throw errors.badRequest(
        `limitUnit must be one of: ${LIMIT_UNITS.join(', ')} or empty`
      );
    }
    if (typeof data.limitAmount !== 'number' || data.limitAmount < 0) {
      throw errors.badRequest('limitAmount must be a non-negative number');
    }

    const created = await prisma.expenseType.create({
      data: {
        category,
        name: data.name.trim(),
        limitAmount: data.limitAmount,
        limitUnit: data.limitUnit && data.limitUnit.trim() !== '' ? data.limitUnit.trim() : null,
      },
    });
    return this.toDto(created);
  }

  async update(
    id: number,
    data: {
      category?: string;
      name?: string;
      limitAmount?: number;
      limitUnit?: string | null;
      isActive?: boolean;
    }
  ) {
    const existing = await prisma.expenseType.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Expense type');

    const update: {
      category?: string;
      name?: string;
      limitAmount?: number;
      limitUnit?: string | null;
      isActive?: boolean;
    } = {};
    if (data.category !== undefined) {
      const category = data.category.trim().toLowerCase();
      if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        throw errors.badRequest(
          `category must be one of: ${CATEGORIES.join(', ')}`
        );
      }
      update.category = category;
    }
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.limitAmount !== undefined) {
      if (typeof data.limitAmount !== 'number' || data.limitAmount < 0) {
        throw errors.badRequest('limitAmount must be a non-negative number');
      }
      update.limitAmount = data.limitAmount;
    }
    if (data.limitUnit !== undefined) {
      update.limitUnit =
        data.limitUnit && data.limitUnit.trim() !== ''
          ? data.limitUnit.trim()
          : null;
      if (update.limitUnit && !LIMIT_UNITS.includes(update.limitUnit as (typeof LIMIT_UNITS)[number])) {
        throw errors.badRequest(
          `limitUnit must be one of: ${LIMIT_UNITS.join(', ')} or empty`
        );
      }
    }
    if (data.isActive !== undefined) update.isActive = data.isActive;

    const updated = await prisma.expenseType.update({
      where: { id },
      data: update,
    });
    return this.toDto(updated);
  }

  private toDto(row: {
    id: number;
    category: string;
    name: string;
    limitAmount: number;
    limitUnit: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ExpenseTypeDto {
    return {
      id: row.id,
      category: row.category,
      name: row.name,
      limitAmount: row.limitAmount,
      limitUnit: row.limitUnit,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
