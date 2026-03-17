import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Ticket, List, UserCheck, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { api } from '../../api/client';

type Stats = { total: number; open: number; highPriority: number; avgResolutionHours: number | null };

export function TicketsOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['tickets-stats'],
    queryFn: () => api.get<{ success: true; data: Stats }>('/tickets/stats').then((r) => r.data),
  });

  const s = stats ?? { total: 0, open: 0, highPriority: 0, avgResolutionHours: null };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          Ticket Management
        </h1>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create Ticket
        </Link>
      </div>

      {isLoading && (
        <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>
      )}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-bg">
                <Ticket className="w-5 h-5 text-gray-600 dark:text-dark-textSecondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{s.total}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Ticket className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Open</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{s.open}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Ticket className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{s.highPriority}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                  {s.avgResolutionHours != null ? `${s.avgResolutionHours}h` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/tickets/all"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <List className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          <span className="font-medium text-gray-900 dark:text-dark-text">All Tickets</span>
        </Link>
        <Link
          to="/tickets/my"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <UserCheck className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          <span className="font-medium text-gray-900 dark:text-dark-text">My Tickets</span>
        </Link>
        <Link
          to="/tickets/reports"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <BarChart3 className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          <span className="font-medium text-gray-900 dark:text-dark-text">Reports</span>
        </Link>
        <Link
          to="/tickets/categories"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <Settings className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          <span className="font-medium text-gray-900 dark:text-dark-text">Settings</span>
        </Link>
      </div>
    </div>
  );
}
