import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import { api } from '../../api/client';

type VolumeData = {
  total: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
};

export function ReportVolumePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (categoryId) params.categoryId = categoryId;

  const { data, isLoading } = useQuery({
    queryKey: ['tickets-report-volume', params],
    queryFn: () => api.get<{ success: true; data: VolumeData }>('/tickets/reports/volume', params).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => api.get<{ success: true; data: { id: number; name: string }[] }>('/ticket-categories').then((r) => r.data),
  });
  const categoryList = categories ?? [];

  const report = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Ticket Volume
      </h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          placeholder="To"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && report && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-4">By status</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Total: {report.total}</p>
            <ul className="space-y-2">
              {report.byStatus.map(({ status, count }) => (
                <li key={status} className="flex justify-between text-sm">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
            {report.byStatus.length === 0 && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">No data</p>}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-4">By priority</h2>
            <ul className="space-y-2">
              {report.byPriority.map(({ priority, count }) => (
                <li key={priority} className="flex justify-between text-sm">
                  <span className="capitalize">{priority}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
            {report.byPriority.length === 0 && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">No data</p>}
          </div>
        </div>
      )}
    </div>
  );
}
