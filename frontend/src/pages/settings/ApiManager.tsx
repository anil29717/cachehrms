import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Key, Plus, Copy, Download, Trash2, ShieldOff, FileText } from 'lucide-react';
import { api } from '../../api/client';

type ApiAccessItem = {
  id: string;
  clientName: string;
  apiKeyMasked: string;
  isActive: boolean;
  rateLimitPerHour: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

type CreatedKey = {
  id: string;
  apiKey: string;
  clientName: string;
  rateLimitPerHour: number;
  expiresAt: string | null;
  createdAt: string;
};

type ApiAccessLogItem = {
  id: string;
  apiAccessId: string;
  clientName: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string | null;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const FULL_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');

function downloadKeyFile(clientName: string, apiKey: string) {
  const content = `# HRMS API Key - ${clientName}
# Generated: ${new Date().toISOString()}
# Use this key in the X-API-Key header or Authorization: Bearer <key>

API_KEY=${apiKey}

# Example (fetch employees list):
# curl -H "X-API-Key: ${apiKey}" "${FULL_BASE}/integration/employees"

# Example (fetch one employee by id or code):
# curl -H "X-API-Key: ${apiKey}" "${FULL_BASE}/integration/employees/EMP-2026-0001"
`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hrms-api-key-${clientName.replace(/\s+/g, '-')}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ApiManager() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [clientName, setClientName] = useState('');
  const [rateLimitPerHour, setRateLimitPerHour] = useState(1000);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsFilter, setLogsFilter] = useState<string>('');

  const { data: list, isLoading, error } = useQuery({
    queryKey: ['api-access'],
    queryFn: () =>
      api.get<{ success: true; data: ApiAccessItem[] }>('/settings/api-access').then((r) => r.data),
  });

  const params: Record<string, string> = { page: String(logsPage), limit: '20' };
  if (logsFilter) params.apiAccessId = logsFilter;

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['api-access-logs', logsPage, logsFilter],
    queryFn: () =>
      api
        .get<{ success: true; data: ApiAccessLogItem[]; meta?: { total: number; page: number; limit: number } }>(
          '/settings/api-access/logs',
          params
        )
        .then((r) => ({ items: r.data, meta: r.meta })),
  });

  const logItems = logsData?.items ?? [];
  const logsTotal = logsData?.meta?.total ?? 0;
  const logsLimit = logsData?.meta?.limit ?? 20;
  const logsTotalPages = Math.ceil(logsTotal / logsLimit) || 1;

  const createMutation = useMutation({
    mutationFn: (body: { clientName: string; rateLimitPerHour: number }) =>
      api
        .post<{ success: true; data: CreatedKey; message: string }>('/settings/api-access', body)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-access'] });
      setCreatedKey(data);
      setShowCreate(false);
      setClientName('');
      setRateLimitPerHour(1000);
      toast.success('API key created. Copy it now — it won’t be shown again.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: true }>(`/settings/api-access/${id}/revoke`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-access'] });
      queryClient.invalidateQueries({ queryKey: ['api-access-logs'] });
      toast.success('API key revoked');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: true }>(`/settings/api-access/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-access'] });
      queryClient.invalidateQueries({ queryKey: ['api-access-logs'] });
      toast.success('API key deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = clientName.trim();
    if (!name) {
      toast.error('Client name is required');
      return;
    }
    createMutation.mutate({ clientName: name, rateLimitPerHour: Math.max(1, Math.min(10000, rateLimitPerHour)) });
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  }

  const items = list ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">API Manager</h1>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-1">
            Create API keys for external systems to fetch employee details. Keys are shown only once.
          </p>
        </div>
        {!showCreate && !createdKey && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        )}
      </div>

      {createdKey && (
        <div className="mb-6 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-2 flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            New API key — copy or download now
          </h2>
          <p className="text-sm text-gray-600 dark:text-dark-textSecondary mb-3">
            This key will not be shown again. Store it securely.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="px-4 py-2 bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg font-mono text-sm break-all">
              {createdKey.apiKey}
            </code>
            <button
              type="button"
              onClick={() => copyKey(createdKey.apiKey)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => downloadKeyFile(createdKey.clientName, createdKey.apiKey)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-3">
            Limit: {createdKey.rateLimitPerHour} calls/hour · Base URL: {FULL_BASE}/integration
          </p>
          <button
            type="button"
            onClick={() => setCreatedKey(null)}
            className="mt-3 text-sm text-gray-600 dark:text-dark-textSecondary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreate && !createdKey && (
        <form onSubmit={handleCreate} className="mb-6 p-6 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-4">New API key</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Client / App name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. CRM, Mobile App"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Max calls per hour
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={rateLimitPerHour}
                onChange={(e) => setRateLimitPerHour(Number(e.target.value) || 1000)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create key'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Your API keys</h2>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
            Use header <code className="px-1 py-0.5 bg-gray-100 dark:bg-dark-bg rounded">X-API-Key</code> or{' '}
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-dark-bg rounded">Authorization: Bearer &lt;key&gt;</code>
          </p>
        </div>
        {isLoading && <p className="p-4 text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
        {error && (
          <p className="p-4 text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : 'Failed to load API keys'}
          </p>
        )}
        {items.length > 0 && (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Key (masked)
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Calls/hour
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Last used
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Status
                </th>
                <th className="w-0" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50"
                >
                  <td className="py-3 px-4 font-medium">{a.clientName}</td>
                  <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-dark-textSecondary">
                    {a.apiKeyMasked}
                  </td>
                  <td className="py-3 px-4">{a.rateLimitPerHour}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-dark-textSecondary">
                    {a.lastUsedAt ? new Date(a.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        a.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {a.isActive ? (
                      <button
                        type="button"
                        onClick={() => revokeMutation.mutate(a.id)}
                        className="text-sm text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(a.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {items.length === 0 && !isLoading && (
          <div className="py-12 text-center text-gray-500 dark:text-dark-textSecondary">
            <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No API keys yet. Create one to let external apps fetch employee data.
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          API fetch logs
        </h2>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-3">
          Recent calls to the integration endpoints (employees list / employee details).
        </p>
        <div className="flex gap-2 mb-3">
          <select
            value={logsFilter}
            onChange={(e) => { setLogsFilter(e.target.value); setLogsPage(1); }}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text text-sm"
          >
            <option value="">All keys</option>
            {items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.clientName}
              </option>
            ))}
          </select>
        </div>
        <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-card">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Client
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Method
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Endpoint
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {logsLoading && (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-gray-500 dark:text-dark-textSecondary">
                    Loading…
                  </td>
                </tr>
              )}
              {!logsLoading && logItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-gray-500 dark:text-dark-textSecondary">
                    No API calls logged yet. Use an API key to call the integration endpoints.
                  </td>
                </tr>
              )}
              {!logsLoading && logItems.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50"
                >
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-dark-textSecondary whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-medium">{log.clientName}</td>
                  <td className="py-3 px-4 font-mono text-sm">{log.method}</td>
                  <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-dark-textSecondary">
                    {log.endpoint}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        log.statusCode >= 200 && log.statusCode < 300
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : log.statusCode >= 400
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-dark-textSecondary font-mono">
                    {log.ipAddress ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
                Page {logsPage} of {logsTotalPages} ({logsTotal} total)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={logsPage <= 1}
                  onClick={() => setLogsPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border disabled:opacity-50 text-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={logsPage >= logsTotalPages}
                  onClick={() => setLogsPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
        <h3 className="font-medium text-gray-900 dark:text-dark-text mb-2">Integration endpoints</h3>
        <ul className="text-sm text-gray-600 dark:text-dark-textSecondary space-y-1 font-mono">
          <li>GET {API_BASE}/integration/employees — List all active employees</li>
          <li>GET {API_BASE}/integration/employees/:id — Get employee by ID (uuid) or employee code (e.g. EMP-2026-0001)</li>
        </ul>
      </div>
    </div>
  );
}
