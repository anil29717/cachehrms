import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Receipt, Clock, CheckCircle, Wallet, AlertCircle, PlusCircle } from 'lucide-react';
import { expenseClaimsApi, type ExpenseClaimDto } from '../../api/expenses';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  finance_approved: 'Finance Approved',
  hr_approved: 'HR Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function ExpenseDashboardPage() {
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['expense-report'],
    queryFn: () => expenseClaimsApi.report(),
  });
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['expense-claims', 'recent'],
    queryFn: () => expenseClaimsApi.list({ limit: '10', offset: '0' }),
  });
  const recent = recentData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          Expense Dashboard
        </h1>
        <Link
          to="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          New Claim
        </Link>
      </div>

      {reportLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!reportLoading && report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            value={report.countByStatus?.pending ?? 0}
            icon={<Clock className="w-5 h-5" />}
            to="/expenses/requests/pending"
          />
          <StatCard
            title="Approved"
            value={
              (report.countByStatus?.manager_approved ?? 0) +
              (report.countByStatus?.finance_approved ?? 0) +
              (report.countByStatus?.hr_approved ?? 0)
            }
            icon={<CheckCircle className="w-5 h-5" />}
            to="/expenses/requests/approved"
          />
          <StatCard
            title="Paid"
            value={report.countByStatus?.paid ?? 0}
            icon={<Wallet className="w-5 h-5" />}
            to="/expenses/requests/paid"
          />
          <StatCard
            title="Rejected"
            value={report.countByStatus?.rejected ?? 0}
            icon={<AlertCircle className="w-5 h-5" />}
            to="/expenses/requests/rejected"
          />
        </div>
      )}

      {report && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
            Total approved amount (unpaid)
          </h2>
          <p className="text-2xl font-bold text-light-primary dark:text-dark-primary">
            ₹{report.totalApprovedAmount?.toLocaleString('en-IN') ?? 0}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text px-4 py-3 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Recent claims
        </h2>
        {recentLoading && <p className="p-4 text-gray-500">Loading…</p>}
        {!recentLoading && recent.length === 0 && (
          <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">
            No claims yet. <Link to="/expenses/new" className="text-light-primary dark:text-dark-primary hover:underline">Submit a claim</Link>.
          </p>
        )}
        {!recentLoading && recent.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4">{c.employeeName ?? c.employeeId}</td>
                    <td className="py-3 px-4 font-medium">₹{c.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={statusClass(c.status)}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Link to={`/expenses/claims/${c.id}`} className="text-light-primary dark:text-dark-primary text-xs font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  to,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 hover:bg-gray-50 dark:hover:bg-dark-bg/50 transition flex items-center gap-3"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-bg flex items-center justify-center text-gray-600 dark:text-dark-textSecondary">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-dark-text">{value}</p>
      </div>
    </Link>
  );
}

function statusClass(s: string): string {
  const base = 'inline-flex px-2 py-0.5 rounded text-xs font-medium ';
  if (s === 'pending') return base + 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s === 'rejected') return base + 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (s === 'paid') return base + 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  return base + 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
}
