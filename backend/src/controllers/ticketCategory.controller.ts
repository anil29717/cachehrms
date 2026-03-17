import type { Request, Response, NextFunction } from 'express';
import { TicketCategoryService } from '../services/ticketCategory.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new TicketCategoryService();

export async function listTicketCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await service.list();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function createTicketCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { name?: string; description?: string };
    if (!body.name?.trim()) {
      next(errors.badRequest('name is required'));
      return;
    }
    const category = await service.create({ name: body.name, description: body.description });
    sendSuccess(res, category, 'Category created');
  } catch (e) {
    next(e);
  }
}
