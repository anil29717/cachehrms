import { prisma } from '../config/database.js';

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaveCount?: number;
  teamSize?: number;
};

export class DashboardService {
  async getStats(roleName: string, _employeeId?: string): Promise<DashboardStats> {
    const [totalEmployees, activeEmployees, totalDepartments] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.department.count({ where: { isActive: true } }),
    ]);

    const base = {
      totalEmployees,
      activeEmployees,
      totalDepartments,
    };

    if (roleName === 'manager') {
      // TODO: team size from reporting_to when we have data
      return { ...base, teamSize: 0, pendingLeaveCount: 0 };
    }

    if (roleName === 'super_admin' || roleName === 'hr_admin') {
      const pendingLeaveCount = await prisma.leaveRequest.count({
        where: { status: 'pending' },
      });
      return { ...base, pendingLeaveCount };
    }

    return base;
  }
}
