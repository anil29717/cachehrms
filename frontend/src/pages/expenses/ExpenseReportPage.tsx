import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { expenseClaimsApi } from '../../api/expenses';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  finance_approved: 'Finance Approved',
  hr_approved: 'HR Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function ExpenseReportPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ['expense-report'],
    queryFn: () => expenseClaimsApi.report(),
  });

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!report) return null;

  const countByStatus = report.countByStatus ?? {};
  const sumByStatus = report.sumByStatus ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Expense reports
      </h1>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
          Summary
        </h2>
        <p className="text-2xl font-bold text-light-primary dark:text-dark-primary mb-6">
          Total approved amount (unpaid): ₹
          {(report.totalApprovedAmount ?? 0).toLocaleString('en-IN')}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Count</th>
                <th className="py-2">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <tr
                  key={key}
                  className="border-b border-gray-100 dark:border-dark-border last:border-0"
                >
                  <td className="py-2 pr-4 font-medium">{label}</td>
                  <td className="py-2 pr-4">{countByStatus[key] ?? 0}</td>
                  <td className="py-2">
                    ₹{(sumByStatus[key] ?? 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
