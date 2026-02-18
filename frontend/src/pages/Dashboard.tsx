import { useQuery } from '@tanstack/react-query';
import { Users, Building2, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaveCount?: number;
  teamSize?: number;
};

type DashboardResponse = { success: true; data: DashboardStats };

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/dashboard').then((r) => r.data),
  });

  const stats = data ?? null;

  const cards: { label: string; value: string | number; icon: typeof Users }[] = [
    { label: 'Total Employees', value: stats?.totalEmployees ?? '—', icon: Users },
    { label: 'Active Employees', value: stats?.activeEmployees ?? '—', icon: Users },
    { label: 'Departments', value: stats?.totalDepartments ?? '—', icon: Building2 },
    {
      label: user?.roleName === 'manager' ? 'Team Size' : 'Pending Leave',
      value:
        user?.roleName === 'manager'
          ? (stats?.teamSize ?? '—')
          : (stats?.pendingLeaveCount ?? '—'),
      icon: user?.roleName === 'manager' ? Users : FileText,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dashboard</h1>
        <p className="text-gray-600 dark:text-dark-textSecondary mt-1">
          Welcome back, {user?.email ?? 'User'}
        </p>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
          Role: <span className="font-medium">{user?.roleName ?? '-'}</span>
        </p>
      </div>

      {isLoading && (
        <p className="text-gray-500 dark:text-dark-textSecondary">Loading stats…</p>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load dashboard'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-light-primary/10 dark:bg-dark-primary/20">
                <Icon className="w-5 h-5 text-light-primary dark:text-dark-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-dark-textSecondary">{label}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-dark-text">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-dark-textSecondary">
        Employees, Departments, Attendance, and Leave modules will be added in the next steps.
      </p>
    </div>
  );
}