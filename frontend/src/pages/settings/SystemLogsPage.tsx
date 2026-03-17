import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Filter } from 'lucide-react';
import { api } from '../../api/client';
import { canViewSystemLogs } from '../../utils/permissions';
import { useAuthStore } from '../../stores/authStore';

type LogEntry = {
  id: string;
  userId: string | null;
  employeeId: string | null;
  email: string | null;
  method: string;
  path: string;
  statusCode: number;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function SystemLogsPage() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const [method, setMethod] = useState('');
  const [pathSearch, setPathSearch] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const params = useMemo(() => {
    const p: Record<string, string> = {
      limit: String(limit),
      offset: String(page * limit),
    };
    if (method) p.method = method;
    if (pathSearch.trim()) p.path = pathSearch.trim();
    if (statusCode) p.statusCode = statusCode;
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [method, pathSearch, statusCode, from, to, page]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['system-logs', params],
    queryFn: () =>
      api.get<{ success: true; data: LogEntry[]; meta?: { total: number } }>('/system-logs', params),
    enabled: canViewSystemLogs(roleName),
  });

  const list = response?.data ?? [];
  const total = response?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (!canViewSystemLogs(roleName)) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
        <p className="text-amber-800 dark:text-amber-200 font-medium">Access denied</p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Only administrators can view system logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <FileText className="w-6 h-6" />
          System Logs
        </h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
        All API operations across the application. Use filters to narrow by method, path, status, or date range.
      </p>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
        <Filter className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary" />
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm"
        >
          <option value="">All methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          placeholder="Path contains..."
          value={pathSearch}
          onChange={(e) => setPathSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPage(0)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm min-w-[180px]"
        />
        <input
          type="number"
          placeholder="Status code"
          value={statusCode}
          onChange={(e) => setStatusCode(e.target.value)}
          min={100}
          max={599}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm w-24"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm"
        />
        <span className="text-gray-500 dark:text-dark-textSecondary">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm"
        />
        <button
          type="button"
          onClick={() => setPage(0)}
          className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Search className="w-4 h-4 inline mr-1 align-middle" />
          Apply
        </button>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    <th className="py-3 px-4 whitespace-nowrap">Time</th>
                    <th className="py-3 px-4 whitespace-nowrap">User</th>
                    <th className="py-3 px-4 whitespace-nowrap">Method</th>
                    <th className="py-3 px-4">Path</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-dark-textSecondary">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.email ?? (log.employeeId ? `Employee ${log.employeeId}` : '—')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono text-xs font-medium ${
                          log.method === 'GET' ? 'text-blue-600 dark:text-blue-400' :
                          log.method === 'POST' ? 'text-green-600 dark:text-green-400' :
                          log.method === 'PUT' || log.method === 'PATCH' ? 'text-amber-600 dark:text-amber-400' :
                          log.method === 'DELETE' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-dark-textSecondary'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs break-all max-w-md">{log.path}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          log.statusCode >= 200 && log.statusCode < 300 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          log.statusCode >= 400 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-dark-textSecondary text-xs">
                        {log.ip ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.length === 0 && (
              <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No logs found.</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
