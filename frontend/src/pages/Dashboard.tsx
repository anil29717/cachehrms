import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CalendarOff,
  Receipt,
  LayoutDashboard,
  Ticket,
  Package,
  TrendingUp,
  UserPlus,
  FileText,
  PlusCircle,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

type RecentActivityItem = {
  type: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  module: 'hr' | 'finance' | 'tickets' | 'assets';
};

type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaveCount?: number;
  teamSize?: number;
  employeesByDepartment: { departmentName: string; count: number }[];
  employeesByStatus: { status: string; count: number }[];
  leaveByStatus: { status: string; count: number }[];
  ticketTotal: number;
  ticketOpen: number;
  ticketHighPriority: number;
  confirmedBookings: number;
  totalAssets: number;
  expensePending: number;
  expenseThisMonth?: number;
  recentActivity?: RecentActivityItem[];
};

type DashboardResponse = { success: true; data: DashboardStats };

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MODULE_COLORS = {
  hr: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  finance: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  tickets: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  assets: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
};

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard').then((r) => r.data),
  });

  const s = stats ?? null;

  // Section 1: Core HR KPIs (4 cards only)
  const coreKpis = [
    {
      label: 'Total Employees',
      value: s?.totalEmployees ?? '—',
      subtext: undefined,
      icon: Users,
      color: MODULE_COLORS.hr,
    },
    {
      label: 'Active Employees',
      value: s?.activeEmployees ?? '—',
      subtext: undefined,
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      label: user?.roleName === 'manager' ? 'Team Size' : 'Pending Leave Requests',
      value: user?.roleName === 'manager' ? (s?.teamSize ?? '—') : (s?.pendingLeaveCount ?? '—'),
      subtext: undefined,
      icon: CalendarOff,
      color: MODULE_COLORS.hr,
    },
    {
      label: 'Pending Expenses',
      value: s?.expensePending ?? '—',
      subtext: undefined,
      icon: Receipt,
      color: MODULE_COLORS.finance,
    },
  ];

  // Section 3: Operations Snapshot
  const opsKpis = [
    { label: 'Open Tickets', value: s?.ticketOpen ?? '—', icon: Ticket, color: MODULE_COLORS.tickets },
    { label: 'High Priority Tickets', value: s?.ticketHighPriority ?? '—', icon: Ticket, color: MODULE_COLORS.tickets },
    { label: 'Total Assets', value: s?.totalAssets ?? '—', icon: Package, color: MODULE_COLORS.assets },
    {
      label: 'This Month Expense',
      value: s?.expenseThisMonth != null ? `₹${Number(s.expenseThisMonth).toLocaleString()}` : '—',
      icon: TrendingUp,
      color: MODULE_COLORS.finance,
    },
  ];

  const employeesByDept = s?.employeesByDepartment?.filter((d) => d.count > 0) ?? [];
  const employeesByStatus = s?.employeesByStatus ?? [];
  const recentActivity = s?.recentActivity ?? [];
  const showCharts = employeesByDept.length > 0 || employeesByStatus.length > 0;

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-dark-textSecondary mt-1">
            Welcome back, {user?.email ?? 'User'}
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
            Role: <span className="font-medium">{user?.roleName ?? '-'}</span>
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/employees"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Link>
          <Link
            to="/leave"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800"
          >
            <CalendarOff className="w-4 h-4" />
            Apply Leave
          </Link>
          <Link
            to="/expenses/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            <FileText className="w-4 h-4" />
            Create Expense
          </Link>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors border border-rose-200 dark:border-rose-800"
          >
            <PlusCircle className="w-4 h-4" />
            Create Ticket
          </Link>
        </div>
      </div>

      {isLoading && (
        <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load dashboard'}
        </p>
      )}

      {!isLoading && !error && s && (
        <>
          {/* Section 1: Core HR KPIs – 4 cards, compact */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide mb-3">
              Core HR
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {coreKpis.map(({ label, value, subtext, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3 shadow-sm min-w-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{label}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-dark-text leading-tight">{value}</p>
                      {subtext != null && (
                        <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-0.5">{subtext}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Workforce Insights – only when there is data */}
          {showCharts && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide mb-3">
                Workforce Insights
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {employeesByDept.length > 0 && (
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-3">Employees by Department</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={employeesByDept} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-dark-border" />
                          <XAxis
                            dataKey="departmentName"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => (v.length > 10 ? v.slice(0, 10) + '…' : v)}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            formatter={(value: number) => [value, 'Employees']}
                            labelFormatter={(label) => `Department: ${label}`}
                          />
                          <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {employeesByStatus.length > 0 && (
                  <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-3">Employee Status</h3>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={employeesByStatus.map((d) => ({ name: formatStatus(d.status), value: d.count }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {employeesByStatus.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            formatter={(value: number) => [value, 'Employees']}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Operations Snapshot – 4 cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide mb-3">
              Operations Snapshot
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {opsKpis.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3 shadow-sm min-w-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{label}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-dark-text leading-tight">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Recent Activity – hide when empty */}
          {recentActivity.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h2>
              <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-dark-border">
                  {recentActivity.slice(0, 10).map((item, i) => {
                    const ActivityIcon =
                      item.type === 'expense_approved' ? Receipt
                      : item.type === 'ticket_created' ? Ticket
                      : item.type === 'asset_assigned' ? Package
                      : CalendarOff;
                    return (
                    <li key={`${item.timestamp}-${i}`} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-card/80 transition-colors">
                      <div className={`p-1.5 rounded-md flex-shrink-0 ${MODULE_COLORS[item.module]}`}>
                        <ActivityIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{item.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-dark-textSecondary flex-shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </li>
                  );
                  })}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
