import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Timer } from 'lucide-react';
import { api } from '../../api/client';

type ResolutionData = {
  count: number;
  avgHours: number | null;
  minHours: number | null;
  maxHours: number | null;
};

export function ReportResolutionTimePage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (categoryId) params.categoryId = categoryId;

  const { data, isLoading } = useQuery({
    queryKey: ['tickets-report-resolution', params],
    queryFn: () => api.get<{ success: true; data: ResolutionData }>('/tickets/reports/resolution-time', params).then((r) => r.data),
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
        <Timer className="w-6 h-6" />
        Resolution Time
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary text-sm">Average time from ticket creation to resolution/closure (resolved or closed tickets).</p>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
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
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 max-w-md">
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-1">Tickets resolved/closed (in date range)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">{report.count}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-gray-500 dark:text-dark-textSecondary">Avg resolution time:</span> {report.avgHours != null ? `${report.avgHours} hours` : '—'}</p>
            <p><span className="text-gray-500 dark:text-dark-textSecondary">Min:</span> {report.minHours != null ? `${report.minHours} hours` : '—'}</p>
            <p><span className="text-gray-500 dark:text-dark-textSecondary">Max:</span> {report.maxHours != null ? `${report.maxHours} hours` : '—'}</p>
          </div>
          {report.count === 0 && (
            <p className="mt-4 text-gray-500 dark:text-dark-textSecondary text-sm">No resolved/closed tickets in the selected range.</p>
          )}
        </div>
      )}
    </div>
  );
}
