import type { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new TicketService();

export async function ticketStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getStats();
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function listTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const createdBy = req.query.createdBy as string | undefined;
    const search = (req.query.search as string)?.trim();
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;
    const result = await service.list({
      status,
      priority,
      assignedTo,
      categoryId,
      createdBy,
      search: search || undefined,
      limit,
      offset,
    });
    sendSuccess(res, result.items, undefined, { total: result.total });
  } catch (e) {
    next(e);
  }
}

export async function getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Ticket ID required'));
      return;
    }
    const ticket = await service.getById(id);
    sendSuccess(res, ticket);
  } catch (e) {
    next(e);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const createdBy = req.user?.employeeId;
    if (!createdBy) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as { categoryId?: number; subject?: string; description?: string; priority?: string; regardingEmployeeCode?: string };
    if (!body.subject?.trim() || !body.description?.trim()) {
      next(errors.badRequest('subject and description are required'));
      return;
    }
    const ticket = await service.create(createdBy, {
      categoryId: body.categoryId,
      subject: body.subject,
      description: body.description,
      priority: body.priority,
      regardingEmployeeCode: body.regardingEmployeeCode,
    });
    sendSuccess(res, ticket, 'Ticket created');
  } catch (e) {
    next(e);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as { status?: string; priority?: string; assignedTo?: string; categoryId?: number };
    if (!id) {
      next(errors.badRequest('Ticket ID required'));
      return;
    }
    const ticket = await service.update(id, body);
    sendSuccess(res, ticket, 'Ticket updated');
  } catch (e) {
    next(e);
  }
}

export async function reportVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await service.reportVolume({ categoryId, from, to });
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}

export async function reportResolutionTime(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await service.reportResolutionTime({ categoryId, from, to });
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}
