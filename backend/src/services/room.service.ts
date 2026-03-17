import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const ROOM_TYPES = ['conference_room', 'meeting_room', 'cabin'] as const;

export type RoomType = (typeof ROOM_TYPES)[number];

export class RoomService {
  /** List rooms; optional includeInactive for admin list */
  async list(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    const list = await prisma.room.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return list.map((r) => this.toDto(r));
  }

  async getById(id: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw errors.notFound('Room');
    return this.toDto(room);
  }

  async create(data: { name: string; roomType: string; capacity?: number; amenities?: string }) {
    if (!data.name?.trim()) throw errors.badRequest('Room name is required');
    if (!ROOM_TYPES.includes(data.roomType as RoomType)) {
      throw errors.badRequest(`roomType must be one of: ${ROOM_TYPES.join(', ')}`);
    }
    const capacity = data.capacity != null ? Math.max(0, data.capacity) : null;
    const room = await prisma.room.create({
      data: {
        name: data.name.trim(),
        roomType: data.roomType.trim(),
        capacity,
        amenities: data.amenities?.trim() || null,
        isActive: true,
      },
    });
    return this.toDto(room);
  }

  async update(
    id: string,
    data: { name?: string; roomType?: string; capacity?: number; amenities?: string; isActive?: boolean }
  ) {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Room');
    if (data.roomType != null && !ROOM_TYPES.includes(data.roomType as RoomType)) {
      throw errors.badRequest(`roomType must be one of: ${ROOM_TYPES.join(', ')}`);
    }
    const capacity = data.capacity !== undefined ? (data.capacity == null ? null : Math.max(0, data.capacity)) : undefined;
    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name.trim() }),
        ...(data.roomType != null && { roomType: data.roomType.trim() }),
        ...(capacity !== undefined && { capacity }),
        ...(data.amenities !== undefined && { amenities: data.amenities?.trim() || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return this.toDto(room);
  }

  async delete(id: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw errors.notFound('Room');
    await prisma.room.delete({ where: { id } });
  }

  private toDto(r: {
    id: string;
    name: string;
    roomType: string;
    capacity: number | null;
    amenities: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      name: r.name,
      roomType: r.roomType,
      capacity: r.capacity,
      amenities: r.amenities,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
