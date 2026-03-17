import type { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const roomService = new RoomService();

export async function listRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === 'true' && (req.user?.roleName === 'super_admin' || req.user?.roleName === 'hr_admin');
    const list = await roomService.list(includeInactive);
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getRoomById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Room ID required'));
      return;
    }
    const room = await roomService.getById(id);
    sendSuccess(res, room);
  } catch (e) {
    next(e);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { name?: string; roomType?: string; capacity?: number; amenities?: string };
    if (!body.name?.trim()) {
      next(errors.badRequest('name is required'));
      return;
    }
    if (!body.roomType?.trim()) {
      next(errors.badRequest('roomType is required'));
      return;
    }
    const room = await roomService.create({
      name: body.name,
      roomType: body.roomType,
      capacity: body.capacity,
      amenities: body.amenities,
    });
    sendSuccess(res, room, 'Room created');
  } catch (e) {
    next(e);
  }
}

export async function updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const body = req.body as { name?: string; roomType?: string; capacity?: number; amenities?: string; isActive?: boolean };
    if (!id) {
      next(errors.badRequest('Room ID required'));
      return;
    }
    const room = await roomService.update(id, body);
    sendSuccess(res, room, 'Room updated');
  } catch (e) {
    next(e);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('Room ID required'));
      return;
    }
    await roomService.delete(id);
    sendSuccess(res, null, 'Room deleted');
  } catch (e) {
    next(e);
  }
}
