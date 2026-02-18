import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Eye } from 'lucide-react';
import { api } from '../../api/client';

type PayslipSummary = {
  id: string;
  month: number;
  year: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate: string | null;
  createdAt: string;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MyPayslipsPage() {
  const { data: list, isLoading } = useQuery({
    queryKey: ['payroll-my-payslips'],
    queryFn: () =>
      api.get<{ success: true; data: PayslipSummary[] }>('/payroll/my-payslips').then((r) => r.data),
  });
  const items = list ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <FileText className="w-7 h-7" />
        My payslips
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary mb-6">
        View and download your payslips.
      </p>
      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500 dark:text-dark-textSecondary">Loading…</div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Period</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Net salary</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Status</th>
                  <th className="w-0 py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4 font-medium">
                      {MONTHS[row.month - 1]} {row.year}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">₹{row.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          row.paymentStatus === 'processed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : row.paymentStatus === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/payroll/payslip/${row.id}`}
                        className="inline-flex items-center gap-1 text-light-primary dark:text-dark-primary hover:underline text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View payslip
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
            No payslips yet.
          </div>
        )}
      </div>
    </div>
  );
}
