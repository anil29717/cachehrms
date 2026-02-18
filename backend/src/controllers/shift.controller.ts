import type { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../services/shift.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const shiftService = new ShiftService();

export async function listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activeOnly = req.query.active === 'true';
    const list = await shiftService.list(activeOnly);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Invalid shift ID'));
      return;
    }
    const shift = await shiftService.getById(id);
    sendSuccess(res, shift);
  } catch (e) {
    next(e);
  }
}

export async function createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      name?: string;
      startTime?: string;
      endTime?: string;
      gracePeriodMinutes?: number;
      isActive?: boolean;
    };
    const shift = await shiftService.create({
      name: body.name ?? '',
      startTime: body.startTime ?? '09:00',
      endTime: body.endTime ?? '18:00',
      gracePeriodMinutes: body.gracePeriodMinutes,
      isActive: body.isActive,
    });
    sendSuccess(res, shift, 'Shift created');
  } catch (e) {
    next(e);
  }
}

export async function updateShift(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Invalid shift ID'));
      return;
    }
    const body = req.body as {
      name?: string;
      startTime?: string;
      endTime?: string;
      gracePeriodMinutes?: number;
      isActive?: boolean;
    };
    const shift = await shiftService.update(id, {
      name: body.name,
      startTime: body.startTime,
      endTime: body.endTime,
      gracePeriodMinutes: body.gracePeriodMinutes,
      isActive: body.isActive,
    });
    sendSuccess(res, shift, 'Shift updated');
  } catch (e) {
    next(e);
  }
}
