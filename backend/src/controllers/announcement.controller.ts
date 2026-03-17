import type { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service.js';
import { NationalHolidayService } from '../services/nationalHoliday.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const service = new AnnouncementService();
const nationalHolidayService = new NationalHolidayService();

export async function listAnnouncements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const type = req.query.type as string | undefined;
    const sentOnly = req.query.sentOnly === 'true';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;
    const result = await service.list({ type, sentOnly, limit, offset });
    sendSuccess(res, result.items, undefined, { total: result.total });
  } catch (e) {
    next(e);
  }
}

export async function getAnnouncementById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Announcement ID required'));
      return;
    }
    const a = await service.getById(id);
    sendSuccess(res, a);
  } catch (e) {
    next(e);
  }
}

export async function createAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const createdBy = req.user?.employeeId;
    if (!createdBy) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as {
      type?: string;
      title?: string;
      body?: string;
      eventDate?: string | null;
    };
    if (!body.title?.trim() || !body.body?.trim()) {
      next(errors.badRequest('title and body are required'));
      return;
    }
    const a = await service.create(createdBy, {
      type: body.type!,
      title: body.title,
      body: body.body,
      eventDate: body.eventDate,
    });
    sendSuccess(res, a, 'Announcement created');
  } catch (e) {
    next(e);
  }
}

export async function updateAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as {
      type?: string;
      title?: string;
      body?: string;
      eventDate?: string | null;
    };
    if (!id) {
      next(errors.badRequest('Announcement ID required'));
      return;
    }
    const a = await service.update(id, body);
    sendSuccess(res, a, 'Announcement updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Announcement ID required'));
      return;
    }
    await service.delete(id);
    sendSuccess(res, { deleted: true }, 'Announcement deleted');
  } catch (e) {
    next(e);
  }
}

export async function publishAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Announcement ID required'));
      return;
    }
    const a = await service.publish(id);
    sendSuccess(res, a, 'Announcement published');
  } catch (e) {
    next(e);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const announcementId = req.params.id;
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    if (!announcementId) {
      next(errors.badRequest('Announcement ID required'));
      return;
    }
    await service.markRead(announcementId, employeeId);
    sendSuccess(res, { read: true }, 'Marked as read');
  } catch (e) {
    next(e);
  }
}

export async function getBirthdays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filter = (req.query.filter as string) || 'month';
    const valid = ['today', 'week', 'month'].includes(filter)
      ? filter
      : 'month';
    const result = await service.getBirthdays(valid as 'today' | 'week' | 'month');
    sendSuccess(res, result.items);
  } catch (e) {
    next(e);
  }
}

export async function getUpcomingHolidays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await service.getUpcomingHolidays(limit);
    sendSuccess(res, result.items);
  } catch (e) {
    next(e);
  }
}

export async function getAssetReminders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const overdueOnly = req.query.overdueOnly === 'true';
    const result = await service.getAssetReminders(overdueOnly);
    sendSuccess(res, result.items);
  } catch (e) {
    next(e);
  }
}

export async function getReport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const result = await service.report(limit);
    sendSuccess(res, result.items);
  } catch (e) {
    next(e);
  }
}

export async function getNationalHolidays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const year = req.query.year ? parseInt(String(req.query.year), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 30;
    const items = year != null
      ? await nationalHolidayService.getByYear(year)
      : await nationalHolidayService.getUpcoming(limit);
    sendSuccess(res, items);
  } catch (e) {
    // If national_holidays table or Prisma client not ready, return empty list
    sendSuccess(res, []);
  }
}
