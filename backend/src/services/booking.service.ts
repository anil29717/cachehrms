import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const MIN_BOOKING_MINUTES = 30;

/** Check if two ranges overlap: (startA, endA) and (startB, endB). Overlap when startA < endB && endA > startB */
function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

export class BookingService {
  /**
   * List bookings. If role is super_admin or hr_admin, can see all (and filter by roomId, employeeId, from, to, status).
   * Otherwise only own bookings.
   */
  async list(
    roleName: string,
    employeeId: string | undefined,
    filters: { roomId?: string; employeeId?: string; from?: string; to?: string; status?: string; limit?: number }
  ) {
    const isAdmin = roleName === 'super_admin' || roleName === 'hr_admin';
    const where: {
      employeeId?: string;
      roomId?: string;
      status?: string;
      startTime?: { gte?: Date };
      endTime?: { lte?: Date };
    } = {};

    if (!isAdmin && !employeeId) return [];
    if (!isAdmin) where.employeeId = employeeId!;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.status && ['confirmed', 'cancelled'].includes(filters.status)) where.status = filters.status;
    if (filters.from) where.startTime = { ...where.startTime, gte: new Date(filters.from) };
    if (filters.to) where.endTime = { ...where.endTime, lte: new Date(filters.to) };

    const list = await prisma.booking.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: Math.min(100, filters.limit ?? 50),
      include: {
        room: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return list.map((b) => this.toDto(b));
  }

  async getById(id: string, employeeId: string | undefined, roleName: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    if (!booking) throw errors.notFound('Booking');
    const isAdmin = roleName === 'super_admin' || roleName === 'hr_admin';
    if (!isAdmin && booking.employeeId !== employeeId) throw errors.forbidden('Not your booking');
    return this.toDto(booking);
  }

  async create(employeeId: string, data: { roomId: string; startTime: Date; endTime: Date; title?: string; description?: string }) {
    const emp = await prisma.employee.findUnique({ where: { employeeCode: employeeId } });
    if (!emp) throw errors.notFound('Employee');

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    this.validateTimeRange(start, end);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw errors.notFound('Room');
    if (!room.isActive) throw errors.badRequest('Room is not available for booking');

    await this.assertNoConflict(data.roomId, start, end, null);

    const booking = await prisma.booking.create({
      data: {
        roomId: data.roomId,
        employeeId,
        startTime: start,
        endTime: end,
        title: data.title?.trim() || null,
        description: data.description?.trim() || null,
        status: 'confirmed',
      },
      include: {
        room: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(booking);
  }

  async update(
    id: string,
    employeeId: string,
    roleName: string,
    data: { startTime?: Date; endTime?: Date; title?: string; description?: string; employeeId?: string }
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true, employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
    });
    if (!booking) throw errors.notFound('Booking');
    if (booking.status !== 'confirmed') throw errors.badRequest('Cannot update a cancelled booking');

    const isAdmin = roleName === 'super_admin' || roleName === 'hr_admin';
    if (!isAdmin && booking.employeeId !== employeeId) throw errors.forbidden('Not your booking');

    const start = data.startTime ? new Date(data.startTime) : booking.startTime;
    const end = data.endTime ? new Date(data.endTime) : booking.endTime;
    this.validateTimeRange(start, end);
    await this.assertNoConflict(booking.roomId, start, end, id);

    if (data.employeeId != null && isAdmin) {
      const emp = await prisma.employee.findUnique({ where: { employeeCode: data.employeeId } });
      if (!emp) throw errors.notFound('Employee');
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(data.startTime != null && { startTime: start }),
        ...(data.endTime != null && { endTime: end }),
        ...(data.title !== undefined && { title: data.title?.trim() || null }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.employeeId != null && isAdmin && { employeeId: data.employeeId }),
      },
      include: {
        room: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return this.toDto(updated);
  }

  /** Cancel booking (set status to cancelled). Owner or admin. */
  async cancel(id: string, employeeId: string, roleName: string) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw errors.notFound('Booking');
    const isAdmin = roleName === 'super_admin' || roleName === 'hr_admin';
    if (!isAdmin && booking.employeeId !== employeeId) throw errors.forbidden('Not your booking');

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  /** Get availability for a room in date range: return existing confirmed bookings (so UI can show busy slots) */
  async getRoomAvailability(roomId: string, from: string, to: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw errors.notFound('Room');
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const list = await prisma.booking.findMany({
      where: {
        roomId,
        status: 'confirmed',
        startTime: { lt: toDate },
        endTime: { gt: fromDate },
      },
      orderBy: { startTime: 'asc' },
      select: { id: true, startTime: true, endTime: true, title: true, employeeId: true },
    });
    return {
      roomId,
      roomName: room.name,
      bookings: list.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        title: b.title,
        employeeId: b.employeeId,
      })),
    };
  }

  private validateTimeRange(start: Date, end: Date) {
    const now = new Date();
    if (start.getTime() < now.getTime()) throw errors.badRequest('Booking cannot start in the past');
    if (end.getTime() <= start.getTime()) throw errors.badRequest('End time must be after start time');
    const minutes = (end.getTime() - start.getTime()) / (60 * 1000);
    if (minutes < MIN_BOOKING_MINUTES) {
      throw errors.badRequest(`Minimum booking duration is ${MIN_BOOKING_MINUTES} minutes`);
    }
  }

  private async assertNoConflict(roomId: string, start: Date, end: Date, excludeBookingId: string | null) {
    const existing = await prisma.booking.findMany({
      where: {
        roomId,
        status: 'confirmed',
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
    });
    for (const b of existing) {
      if (overlaps(start, end, b.startTime, b.endTime)) {
        throw errors.conflict(
          `Room is already booked from ${b.startTime.toISOString()} to ${b.endTime.toISOString()}`
        );
      }
    }
  }

  private toDto(b: {
    id: string;
    roomId: string;
    employeeId: string;
    startTime: Date;
    endTime: Date;
    title: string | null;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    room: { id: string; name: string };
    employee: { employeeCode: string; firstName: string; lastName: string };
  }) {
    return {
      id: b.id,
      roomId: b.roomId,
      roomName: b.room.name,
      employeeId: b.employeeId,
      employeeName: `${b.employee.firstName} ${b.employee.lastName}`.trim(),
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      title: b.title,
      description: b.description,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    };
  }
}
