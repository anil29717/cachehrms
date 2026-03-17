import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Receipt, Clock, CheckCircle, Wallet, AlertCircle } from 'lucide-react';
import { expenseClaimsApi, type ExpenseClaimDto } from '../../api/expenses';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  finance_approved: 'Finance Approved',
  hr_approved: 'HR Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

function useExpenseRequestFilter() {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/expenses/requests/pending') return { status: 'pending', title: 'Pending claims' };
  if (path === '/expenses/requests/approved')
    return {
      statusIn: 'manager_approved,finance_approved,hr_approved',
      title: 'Approved claims',
    };
  if (path === '/expenses/requests/paid') return { status: 'paid', title: 'Paid claims' };
  if (path === '/expenses/requests/rejected') return { status: 'rejected', title: 'Rejected claims' };
  return { title: 'Expense claims' };
}

export function ExpenseRequestsPage() {
  const filter = useExpenseRequestFilter();
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if ('status' in filter && filter.status) p.status = filter.status;
    if ('statusIn' in filter && filter.statusIn) p.statusIn = filter.statusIn;
    return p;
  }, [filter]);

  const { data, isLoading } = useQuery({
    queryKey: ['expense-claims', params],
    queryFn: () => expenseClaimsApi.list(params),
  });
  const list = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          {filter.title}
        </h1>
        <Link
          to="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          New Claim
        </Link>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4 font-medium">{c.employeeName ?? c.employeeId}</td>
                    <td className="py-3 px-4">₹{c.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={statusClass(c.status)}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/expenses/claims/${c.id}`}
                        className="text-light-primary dark:text-dark-primary font-medium hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">
              No claims in this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function statusClass(s: string): string {
  const base = 'inline-flex px-2 py-0.5 rounded text-xs font-medium ';
  if (s === 'pending') return base + 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s === 'rejected') return base + 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (s === 'paid') return base + 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  return base + 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
}
