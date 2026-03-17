import { Link } from 'react-router-dom';
import { BarChart3, Timer } from 'lucide-react';

export function TicketReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Ticket Reports
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <Link
          to="/tickets/reports/volume"
          className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <div className="p-3 rounded-lg bg-gray-100 dark:bg-dark-bg">
            <BarChart3 className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text">Ticket Volume</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">Volume by status and category</p>
          </div>
        </Link>
        <Link
          to="/tickets/reports/resolution-time"
          className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-sm hover:border-light-primary dark:hover:border-dark-primary hover:shadow-md transition-colors"
        >
          <div className="p-3 rounded-lg bg-gray-100 dark:bg-dark-bg">
            <Timer className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-dark-text">Resolution Time</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">Average time to resolve tickets</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
