import { prisma } from '../config/database.js';

export type NationalHolidayDto = {
  id: number;
  name: string;
  holidayDate: string;
  year: number | null;
  isOptional: boolean;
};

export class NationalHolidayService {
  /** Upcoming national holidays (today onwards), optionally for a given year */
  async getUpcoming(limit = 30, year?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: { holidayDate: { gte: Date }; year?: number | null } = {
      holidayDate: { gte: today },
    };
    if (year != null) {
      where.year = year;
    }

    const list = await prisma.nationalHoliday.findMany({
      where,
      orderBy: { holidayDate: 'asc' },
      take: limit,
    });
    return list.map((h) => ({
      id: h.id,
      name: h.name,
      holidayDate: h.holidayDate.toISOString().slice(0, 10),
      year: h.year,
      isOptional: h.isOptional,
    }));
  }

  /** All for a year (for calendar view) */
  async getByYear(year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    const list = await prisma.nationalHoliday.findMany({
      where: { holidayDate: { gte: start, lte: end } },
      orderBy: { holidayDate: 'asc' },
    });
    return list.map((h) => ({
      id: h.id,
      name: h.name,
      holidayDate: h.holidayDate.toISOString().slice(0, 10),
      year: h.year,
      isOptional: h.isOptional,
    }));
  }
}
