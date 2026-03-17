import { prisma } from '../config/database.js';

export type RecentActivityItem = {
  type: 'leave_applied' | 'leave_approved' | 'expense_approved' | 'ticket_created' | 'asset_assigned';
  title: string;
  subtitle?: string;
  timestamp: string;
  module: 'hr' | 'finance' | 'tickets' | 'assets';
};

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaveCount?: number;
  teamSize?: number;
  /** For bar chart: employees per department */
  employeesByDepartment: { departmentName: string; count: number }[];
  /** For pie: employee status breakdown */
  employeesByStatus: { status: string; count: number }[];
  /** For pie: leave requests by status */
  leaveByStatus: { status: string; count: number }[];
  /** Ticket overview */
  ticketTotal: number;
  ticketOpen: number;
  ticketHighPriority: number;
  /** Other counts for cards */
  confirmedBookings: number;
  totalAssets: number;
  expensePending: number;
  /** This month expense amount (sum of claims created this month) */
  expenseThisMonth: number;
  /** Recent activity feed */
  recentActivity: RecentActivityItem[];
};

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

export class DashboardService {
  async getStats(roleName: string, _employeeId?: string): Promise<DashboardStats> {
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      departmentsWithCount,
      employeeStatusGroups,
      leaveStatusGroups,
      ticketCounts,
      confirmedBookings,
      totalAssets,
      expensePending,
      expenseThisMonthAgg,
      recentLeaves,
      recentExpensesApproved,
      recentTickets,
      recentAllocations,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { name: true, _count: { select: { employees: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.employee.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.leaveRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: 'open' } }),
        prisma.ticket.count({
          where: { priority: { in: ['high', 'urgent'] }, status: { notIn: ['resolved', 'closed'] } },
        }),
      ]),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.asset.count(),
      prisma.expenseClaim.count({ where: { status: 'pending' } }),
      prisma.expenseClaim.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.leaveRequest.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, leaveType: true, employee: { select: { firstName: true, lastName: true } } },
      }),
      prisma.expenseClaim.findMany({
        take: 5,
        where: { status: { in: ['manager_approved', 'finance_approved', 'paid'] } },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, totalAmount: true, updatedAt: true, employee: { select: { firstName: true, lastName: true } } },
      }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, subject: true, createdAt: true, creator: { select: { firstName: true, lastName: true } } },
      }),
      prisma.assetAllocation.findMany({
        take: 5,
        orderBy: { assignedAt: 'desc' },
        select: { id: true, assignedAt: true, asset: { select: { name: true } }, employee: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    let pendingLeaveCount: number | undefined;
    let teamSize: number | undefined;
    if (roleName === 'manager') {
      teamSize = 0;
      pendingLeaveCount = 0;
    } else if (roleName === 'super_admin' || roleName === 'hr_admin') {
      pendingLeaveCount = await prisma.leaveRequest.count({ where: { status: 'pending' } });
    }

    const [ticketTotal, ticketOpen, ticketHighPriority] = ticketCounts;
    const expenseThisMonth = Number(expenseThisMonthAgg._sum.totalAmount ?? 0);

    const activityItems: (RecentActivityItem & { sortAt: Date })[] = [];
    recentLeaves.forEach((l) => {
      const name = `${l.employee.firstName} ${l.employee.lastName}`.trim() || 'Employee';
      activityItems.push({
        type: l.status === 'approved' ? 'leave_approved' : 'leave_applied',
        title: l.status === 'approved' ? 'Leave approved' : 'Leave applied',
        subtitle: `${name} · ${l.leaveType}`,
        timestamp: l.createdAt.toISOString(),
        module: 'hr',
        sortAt: l.createdAt,
      });
    });
    recentExpensesApproved.forEach((e) => {
      const name = `${e.employee.firstName} ${e.employee.lastName}`.trim() || 'Employee';
      activityItems.push({
        type: 'expense_approved',
        title: 'Expense approved',
        subtitle: `${name} · ₹${e.totalAmount.toFixed(0)}`,
        timestamp: e.updatedAt.toISOString(),
        module: 'finance',
        sortAt: e.updatedAt,
      });
    });
    recentTickets.forEach((t) => {
      const name = `${t.creator.firstName} ${t.creator.lastName}`.trim() || 'User';
      activityItems.push({
        type: 'ticket_created',
        title: 'Ticket created',
        subtitle: `${name} · ${t.subject.slice(0, 40)}${t.subject.length > 40 ? '…' : ''}`,
        timestamp: t.createdAt.toISOString(),
        module: 'tickets',
        sortAt: t.createdAt,
      });
    });
    recentAllocations.forEach((a) => {
      const name = `${a.employee.firstName} ${a.employee.lastName}`.trim() || 'Employee';
      activityItems.push({
        type: 'asset_assigned',
        title: 'Asset assigned',
        subtitle: `${a.asset.name} → ${name}`,
        timestamp: a.assignedAt.toISOString(),
        module: 'assets',
        sortAt: a.assignedAt,
      });
    });
    activityItems.sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime());
    const recentActivity = activityItems.slice(0, 15).map(({ sortAt: _s, ...rest }) => rest);

    return {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaveCount,
      teamSize,
      employeesByDepartment: departmentsWithCount.map((d) => ({
        departmentName: d.name,
        count: d._count.employees,
      })),
      employeesByStatus: employeeStatusGroups.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      leaveByStatus: leaveStatusGroups.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
      ticketTotal,
      ticketOpen,
      ticketHighPriority,
      confirmedBookings,
      totalAssets,
      expensePending,
      expenseThisMonth,
      recentActivity,
    };
  }
}
