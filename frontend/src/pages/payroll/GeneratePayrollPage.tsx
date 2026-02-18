import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Zap, List, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function GeneratePayrollPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const generateMutation = useMutation({
    mutationFn: (body: { month: number; year: number }) =>
      api.post<{ success: true; data: { month: number; year: number; created: number; employeeIds: string[] }; message: string }>(
        '/payroll/generate',
        body
      ).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success(`Payroll generated for ${data.created} employee(s)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data: structures } = useQuery({
    queryKey: ['payroll-salary-structures'],
    queryFn: () =>
      api.get<{ success: true; data: { employeeId: string; employeeName: string }[] }>('/payroll/salary-structures').then((r) => r.data),
  });
  const count = structures?.length ?? 0;

  function handleGenerate() {
    if (count === 0) {
      toast.error('Add at least one salary structure first.');
      return;
    }
    generateMutation.mutate({ month, year });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <Zap className="w-7 h-7" />
        Generate payroll
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary mb-6">
        Create payroll records for a month. All employees with a salary structure will get a payroll row. Existing rows for the same month are skipped.
      </p>
      <div className="max-w-md rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2030}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
            {count} employee(s) with salary structure will be included.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateMutation.isPending || count === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5" />
            Generate payroll for {MONTHS[month - 1]} {year}
          </button>
        </div>
        <Link
          to="/payroll/runs"
          className="mt-4 inline-flex items-center gap-2 text-sm text-light-primary dark:text-dark-primary hover:underline"
        >
          <List className="w-4 h-4" />
          View payroll runs
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
