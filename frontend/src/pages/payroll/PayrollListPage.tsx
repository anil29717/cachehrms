import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { List, DollarSign, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type PayrollRunItem = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string | null;
  departmentName: string | null;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate: string | null;
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function PayrollListPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');

  const params: Record<string, string> = { month: String(month), year: String(year) };

  const { data: list, isLoading } = useQuery({
    queryKey: ['payroll-runs', month, year],
    queryFn: () =>
      api.get<{ success: true; data: PayrollRunItem[] }>('/payroll/runs', params).then((r) => r.data),
  });
  const allItems = list ?? [];
  const items = statusFilter ? allItems.filter((i) => i.paymentStatus === statusFilter) : allItems;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      api.put<{ success: true; data: PayrollRunItem; message: string }>(`/payroll/runs/${id}/status`, { paymentStatus }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('Status updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <List className="w-7 h-7" />
        Payroll runs
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary mb-4">
        View payroll by month and update payment status. Generate payroll from the Generate payroll page.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          min={2020}
          max={2030}
          className="w-24 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500 dark:text-dark-textSecondary">Loading…</div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Dept</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Gross</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Deductions</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Net</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Status</th>
                  <th className="w-0 py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{row.employeeName}</span>
                      <span className="text-gray-500 dark:text-dark-textSecondary block text-xs">{row.employeeCode}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-dark-textSecondary">{row.departmentName ?? '—'}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{row.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{row.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium">₹{row.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/payroll/payslip/${row.id}`}
                          className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                          title="View payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {row.paymentStatus !== 'processed' && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ id: row.id, paymentStatus: 'processed' })}
                            disabled={updateStatusMutation.isPending}
                            className="p-1.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Mark processed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {row.paymentStatus !== 'failed' && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ id: row.id, paymentStatus: 'failed' })}
                            disabled={updateStatusMutation.isPending}
                            className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Mark failed"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {row.paymentStatus !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ id: row.id, paymentStatus: 'pending' })}
                            disabled={updateStatusMutation.isPending}
                            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg"
                            title="Mark pending"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
            No payroll records for {MONTHS[month - 1]} {year}. Generate payroll first.
          </div>
        )}
      </div>
    </div>
  );
}
