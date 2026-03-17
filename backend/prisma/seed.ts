import './loadEnv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'super_admin', description: 'Full system access', hierarchyLevel: 1, isSystemRole: true },
    { name: 'hr_admin', description: 'HR management', hierarchyLevel: 2, isSystemRole: true },
    { name: 'manager', description: 'Team management', hierarchyLevel: 3, isSystemRole: true },
    { name: 'employee', description: 'Self-service', hierarchyLevel: 4, isSystemRole: true },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      create: r,
      update: {},
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  if (!superAdminRole) throw new Error('super_admin role not found');

  const existingEmployee = await prisma.employee.findUnique({
    where: { employeeCode: 'EMP-2026-0001' },
  });

  let employee = existingEmployee;
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        employeeCode: 'EMP-2026-0001',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@cachedigitech.com',
        employmentType: 'full_time',
        status: 'active',
      },
    });
  }

  // Default shift: 9:00–18:00, 15 min grace
  const existingShift = await prisma.shift.findFirst({ where: { name: 'General' } });
  if (!existingShift) {
    const startTime = new Date(1970, 0, 1, 9, 0, 0, 0);
    const endTime = new Date(1970, 0, 1, 18, 0, 0, 0);
    await prisma.shift.create({
      data: {
        name: 'General',
        startTime,
        endTime,
        gracePeriod: 15,
        isActive: true,
      },
    });
  }

  const year = new Date().getFullYear();
  const leaveTypes = ['sick', 'casual', 'earned'];
  for (const leaveType of leaveTypes) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: { employeeId: employee.employeeCode, leaveType, year },
      },
      create: {
        employeeId: employee.employeeCode,
        leaveType,
        year,
        openingBalance: leaveType === 'sick' ? 12 : leaveType === 'casual' ? 12 : 15,
        credited: 0,
        taken: 0,
        closingBalance: leaveType === 'sick' ? 12 : leaveType === 'casual' ? 12 : 15,
      },
      update: {},
    });
  }

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@cachedigitech.com' },
    create: {
      employeeId: employee.employeeCode,
      email: 'admin@cachedigitech.com',
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
    update: { passwordHash, roleId: superAdminRole.id },
  });

  // Default expense types (from spec) – only if model exists and none in DB
  if (typeof (prisma as any).expenseType?.count === 'function') {
    try {
      const expenseTypeCount = await (prisma as any).expenseType.count();
      if (expenseTypeCount === 0) {
        const defaultExpenseTypes = [
          { category: 'travel', name: 'Flight', limitAmount: 15000, limitUnit: null },
          { category: 'travel', name: 'Train', limitAmount: 3000, limitUnit: null },
          { category: 'travel', name: 'Cab', limitAmount: 500, limitUnit: 'day' },
          { category: 'travel', name: 'Fuel', limitAmount: 100, limitUnit: 'km' },
          { category: 'food', name: 'Meals', limitAmount: 500, limitUnit: 'meal' },
          { category: 'food', name: 'Client Meeting', limitAmount: 2000, limitUnit: null },
          { category: 'food', name: 'Team Lunch', limitAmount: 800, limitUnit: 'person' },
          { category: 'accommodation', name: 'Hotel', limitAmount: 5000, limitUnit: 'day' },
          { category: 'office', name: 'Stationery', limitAmount: 1000, limitUnit: 'month' },
          { category: 'office', name: 'Software', limitAmount: 5000, limitUnit: 'year' },
          { category: 'learning', name: 'Courses', limitAmount: 15000, limitUnit: 'year' },
          { category: 'learning', name: 'Books', limitAmount: 2000, limitUnit: null },
          { category: 'medical', name: 'Medical', limitAmount: 3000, limitUnit: null },
          { category: 'relocation', name: 'Relocation', limitAmount: 20000, limitUnit: null },
        ];
        await (prisma as any).expenseType.createMany({ data: defaultExpenseTypes });
        console.log('Expense types seeded:', defaultExpenseTypes.length);
      }
    } catch (e) {
      console.warn('Expense types seed skipped (run migration first):', (e as Error).message);
    }
  }

  // National holidays (India) – only if model exists and none in DB
  if (typeof (prisma as any).nationalHoliday?.count === 'function') {
    try {
      const count = await (prisma as any).nationalHoliday.count();
      if (count === 0) {
        const holidays = [
          { name: 'Republic Day', holidayDate: new Date(2025, 0, 26), year: 2025, isOptional: false },
          { name: 'Independence Day', holidayDate: new Date(2025, 7, 15), year: 2025, isOptional: false },
          { name: 'Gandhi Jayanti', holidayDate: new Date(2025, 9, 2), year: 2025, isOptional: false },
          { name: 'Republic Day', holidayDate: new Date(2026, 0, 26), year: 2026, isOptional: false },
          { name: 'Independence Day', holidayDate: new Date(2026, 7, 15), year: 2026, isOptional: false },
          { name: 'Gandhi Jayanti', holidayDate: new Date(2026, 9, 2), year: 2026, isOptional: false },
        ];
        await (prisma as any).nationalHoliday.createMany({ data: holidays });
        console.log('National holidays seeded:', holidays.length);
      }
    } catch (e) {
      console.warn('National holidays seed skipped:', (e as Error).message);
    }
  }

  console.log('Seed completed. Login: admin@cachedigitech.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
