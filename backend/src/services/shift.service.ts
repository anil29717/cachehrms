import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

export type CreateShiftInput = {
  name: string;
  startTime: string; // "HH:mm" or "HH:mm:ss"
  endTime: string;
  gracePeriodMinutes?: number;
  isActive?: boolean;
};

export type UpdateShiftInput = Partial<CreateShiftInput>;

export class ShiftService {
  /** Parse "HH:mm" or "HH:mm:ss" to Date (time only) */
  parseTime(s: string): Date {
    const parts = s.trim().split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    const sec = parts[2] ? parseInt(parts[2], 10) : 0;
    if (Number.isNaN(hours) || hours < 0 || hours > 23) throw errors.badRequest('Invalid startTime');
    return new Date(1970, 0, 1, hours, minutes, sec, 0);
  }

  async list(activeOnly?: boolean) {
    const list = await prisma.shift.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { startTime: 'asc' },
    });
    return list.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: this.formatTime(s.startTime),
      endTime: this.formatTime(s.endTime),
      gracePeriod: s.gracePeriod,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));
  }

  formatTime(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  async getById(id: number) {
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) throw errors.notFound('Shift');
    return {
      id: shift.id,
      name: shift.name,
      startTime: this.formatTime(shift.startTime),
      endTime: this.formatTime(shift.endTime),
      gracePeriod: shift.gracePeriod,
      isActive: shift.isActive,
      createdAt: shift.createdAt,
    };
  }

  async create(data: CreateShiftInput) {
    const name = data.name.trim();
    if (!name) throw errors.badRequest('Name is required');
    const startTime = this.parseTime(data.startTime);
    const endTime = this.parseTime(data.endTime);
    if (endTime <= startTime) throw errors.badRequest('endTime must be after startTime');
    const gracePeriod = Math.max(0, Math.min(120, data.gracePeriodMinutes ?? 0));
    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        gracePeriod,
        isActive: data.isActive ?? true,
      },
    });
    return {
      id: shift.id,
      name: shift.name,
      startTime: this.formatTime(shift.startTime),
      endTime: this.formatTime(shift.endTime),
      gracePeriod: shift.gracePeriod,
      isActive: shift.isActive,
      createdAt: shift.createdAt,
    };
  }

  async update(id: number, data: UpdateShiftInput) {
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) throw errors.notFound('Shift');
    const name = data.name != null ? data.name.trim() : existing.name;
    const startTime = data.startTime != null ? this.parseTime(data.startTime) : existing.startTime;
    const endTime = data.endTime != null ? this.parseTime(data.endTime) : existing.endTime;
    if (endTime <= startTime) throw errors.badRequest('endTime must be after startTime');
    const gracePeriod =
      data.gracePeriodMinutes != null
        ? Math.max(0, Math.min(120, data.gracePeriodMinutes))
        : existing.gracePeriod;
    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name,
        startTime,
        endTime,
        gracePeriod,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return {
      id: shift.id,
      name: shift.name,
      startTime: this.formatTime(shift.startTime),
      endTime: this.formatTime(shift.endTime),
      gracePeriod: shift.gracePeriod,
      isActive: shift.isActive,
      createdAt: shift.createdAt,
    };
  }

  /** Get default shift for late calculation (first active shift) */
  async getDefaultShift(): Promise<{ startTime: Date; endTime: Date; gracePeriod: number } | null> {
    const shift = await prisma.shift.findFirst({
      where: { isActive: true },
      orderBy: { startTime: 'asc' },
    });
    if (!shift) return null;
    return {
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriod: shift.gracePeriod,
    };
  }
}
