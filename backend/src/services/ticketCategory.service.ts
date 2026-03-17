import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

export class TicketCategoryService {
  async list() {
    const list = await prisma.ticketCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async create(data: { name: string; description?: string }) {
    if (!data.name?.trim()) throw errors.badRequest('Category name is required');
    const existing = await prisma.ticketCategory.findUnique({ where: { name: data.name.trim() } });
    if (existing) throw errors.conflict('Category with this name already exists');
    const cat = await prisma.ticketCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });
    return { id: cat.id, name: cat.name, description: cat.description, createdAt: cat.createdAt.toISOString() };
  }
}
