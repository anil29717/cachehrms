import type { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const bookingService = new BookingService();

export async function listBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleName = req.user?.roleName ?? '';
    const employeeId = req.user?.employeeId;
    const roomId = req.query.roomId as string | undefined;
    const employeeIdFilter = req.query.employeeId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const list = await bookingService.list(roleName, employeeId, {
      roomId,
      employeeId: employeeIdFilter,
      from,
      to,
      status,
      limit,
    });
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const roleName = req.user?.roleName ?? '';
    const employeeId = req.user?.employeeId;
    if (!id) {
      next(errors.badRequest('Booking ID required'));
      return;
    }
    const booking = await bookingService.getById(id, employeeId, roleName);
    sendSuccess(res, booking);
  } catch (e) {
    next(e);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentEmployeeId = req.user?.employeeId;
    const roleName = req.user?.roleName ?? '';
    if (!currentEmployeeId) {
      next(errors.unauthorized('Employee not linked'));
      return;
    }
    const body = req.body as {
      roomId?: string;
      startTime?: string;
      endTime?: string;
      title?: string;
      description?: string;
      employeeId?: string;
    };
    if (!body.roomId || !body.startTime || !body.endTime) {
      next(errors.badRequest('roomId, startTime and endTime are required'));
      return;
    }
    const isAdmin = roleName === 'super_admin' || roleName === 'hr_admin';
    const employeeId = isAdmin && body.employeeId ? body.employeeId : currentEmployeeId;
    const booking = await bookingService.create(employeeId, {
      roomId: body.roomId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      title: body.title,
      description: body.description,
    });
    sendSuccess(res, booking, 'Booking created');
  } catch (e) {
    next(e);
  }
}

export async function updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const employeeId = req.user?.employeeId;
    const roleName = req.user?.roleName ?? '';
    if (!id) {
      next(errors.badRequest('Booking ID required'));
      return;
    }
    const body = req.body as { startTime?: string; endTime?: string; title?: string; description?: string; employeeId?: string };
    const booking = await bookingService.update(
      id,
      employeeId ?? '',
      roleName,
      {
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.employeeId !== undefined && { employeeId: body.employeeId }),
      }
    );
    sendSuccess(res, booking, 'Booking updated');
  } catch (e) {
    next(e);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const employeeId = req.user?.employeeId;
    const roleName = req.user?.roleName ?? '';
    if (!id) {
      next(errors.badRequest('Booking ID required'));
      return;
    }
    await bookingService.cancel(id, employeeId ?? '', roleName);
    sendSuccess(res, null, 'Booking cancelled');
  } catch (e) {
    next(e);
  }
}

export async function getRoomAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = req.params.id;
    const from = req.query.from as string;
    const to = req.query.to as string;
    if (!roomId || !from || !to) {
      next(errors.badRequest('roomId, from and to (query) are required'));
      return;
    }
    const data = await bookingService.getRoomAvailability(roomId, from, to);
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
}
