import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Ticket, PlusCircle, Search, List, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type TicketItem = {
  id: string;
  subject: string;
  categoryName: string | null;
  status: string;
  priority: string;
  createdByName: string;
  regardingEmployeeName: string | null;
  assignedToName: string | null;
  createdAt: string;
};

type Stats = { total: number; open: number; highPriority: number; avgResolutionHours: number | null };
type Category = { id: number; name: string };
type EmployeeOption = { employeeCode: string; firstName: string; lastName: string };

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TicketListPage({ myTickets = false }: { myTickets?: boolean }) {
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? '';
  const priority = searchParams.get('priority') ?? '';
  const assignedTo = searchParams.get('assignedTo') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const search = searchParams.get('search') ?? '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (myTickets && employeeId) p.assignedTo = employeeId;
    if (status) p.status = status;
    if (priority) p.priority = priority;
    if (assignedTo && !myTickets) p.assignedTo = assignedTo;
    if (categoryId) p.categoryId = categoryId;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [myTickets, employeeId, status, priority, assignedTo, categoryId, search]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      api.get<{ success: true; data: TicketItem[]; meta?: { total: number } }>('/tickets', params).then((r) => r),
  });
  const { data: stats } = useQuery({
    queryKey: ['tickets-stats'],
    queryFn: () => api.get<{ success: true; data: Stats }>('/tickets/stats').then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () =>
      api.get<{ success: true; data: Category[] }>('/ticket-categories').then((r) => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api
        .get<{ success: true; data: EmployeeOption[] }>('/employees', { limit: '500' })
        .then((r) => r.data),
  });

  const list = response?.data ?? [];
  const total = response?.meta?.total ?? list.length;
  const s = stats ?? { total: 0, open: 0, highPriority: 0, avgResolutionHours: null };
  const categoryList = categories ?? [];
  const employeeList = employees ?? [];
  const title = myTickets ? 'My Tickets' : 'All Tickets';

  return (
    <div className="space-y-6">
      {/* Header: title, Create button, search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          {myTickets ? <UserCheck className="w-6 h-6" /> : <List className="w-6 h-6" />}
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent"
            />
          </div>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Horizontal filter bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
        <span className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide mr-1">Filters</span>
        <select
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm"
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {!myTickets && (
          <select
            value={assignedTo}
            onChange={(e) => setFilter('assignedTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm min-w-[140px]"
          >
            <option value="">Assigned to</option>
            {employeeList.map((emp) => (
              <option key={emp.employeeCode} value={emp.employeeCode}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        )}
        <select
          value={categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm min-w-[140px]"
        >
          <option value="">All categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">{s.total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide">Open</p>
          <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">{s.open}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide">High Priority</p>
          <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">{s.highPriority}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide">Avg Resolution</p>
          <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">
            {s.avgResolutionHours != null ? `${s.avgResolutionHours}h` : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Created by</th>
                  <th className="py-3 px-4">Regarding</th>
                  <th className="py-3 px-4">Assigned to</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4 font-medium">
                      <Link to={`/tickets/${t.id}`} className="text-light-primary dark:text-dark-primary hover:underline">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{t.categoryName ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === 'open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        t.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        t.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        t.priority === 'medium' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                      }`}>
                        {PRIORITY_LABELS[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">{t.createdByName}</td>
                    <td className="py-3 px-4">{t.regardingEmployeeName ?? '—'}</td>
                    <td className="py-3 px-4">{t.assignedToName ?? '—'}</td>
                    <td className="py-3 px-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Link to={`/tickets/${t.id}`} className="text-light-primary dark:text-dark-primary text-xs font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No tickets found.</p>
          )}
        </div>
      )}
    </div>
  );
}
