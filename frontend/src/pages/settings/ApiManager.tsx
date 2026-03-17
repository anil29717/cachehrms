import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Key, Plus, Copy, Download, Trash2, ShieldOff, FileText, ListChecks } from 'lucide-react';
import { api } from '../../api/client';

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  employeeCode: 'Emp ID',
  firstName: 'First name',
  lastName: 'Last name',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  designation: 'Job title',
  externalRole: 'Role',
  workLocation: 'Location',
  reportingTo: 'Reporting ID',
  reportingManagerName: 'Reporting manager',
  defaultPassword: 'Default password',
  dateOfJoining: 'Date of joining',
  employmentType: 'Employment type',
  status: 'Status',
  departmentName: 'Department name',
  departmentCode: 'Department code',
  departmentId: 'Department ID',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  profileImage: 'Profile image',
  createdAt: 'Created at',
  updatedAt: 'Updated at',
  personalInfo: 'Personal info',
  bankDetail: 'Bank details',
  emergencyContacts: 'Emergency contacts',
  educations: 'Education',
  experiences: 'Experience',
  documents: 'Documents',
  externalSubRole: 'Subadmin title',
};

type ApiAccessItem = {
  id: string;
  clientName: string;
  apiKeyMasked: string;
  isActive: boolean;
  rateLimitPerHour: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  employeeFullFields?: string[] | null;
};

type CreatedKey = {
  id: string;
  apiKey: string;
  clientName: string;
  rateLimitPerHour: number;
  expiresAt: string | null;
  createdAt: string;
  employeeFullFields?: string[] | null;
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

# Example (single endpoint - fetch one employee with fields you selected for this key):
# curl -H "X-API-Key: ${apiKey}" "${FULL_BASE}/integration/employee?code=EMP-2026-0001"
# or ?id=uuid or ?email=user@company.com
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
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [createKeySelectedFields, setCreateKeySelectedFields] = useState<Set<string>>(new Set());
  const [subadminTitleInput, setSubadminTitleInput] = useState('');

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

  const { data: employeeFieldsResp } = useQuery({
    queryKey: ['api-access-employee-fields'],
    queryFn: () =>
      api
        .get<{ success: true; data: { availableFields: string[]; configuredFields: string[] | null; description: string } }>(
          '/settings/api-access/employee-fields'
        )
        .then((r) => r.data),
  });

  const { data: subadminTitlesResp } = useQuery({
    queryKey: ['subadmin-titles-settings'],
    queryFn: () =>
      api
        .get<{ titles: string[] }>('/settings/api-access/subadmin-titles')
        .then((r) => r.data),
  });
  const subadminTitles = subadminTitlesResp?.titles ?? [];

  const saveSubadminTitlesMutation = useMutation({
    mutationFn: (titles: string[]) =>
      api
        .put<{ success: true; data: { titles: string[] } }>('/settings/api-access/subadmin-titles', { titles })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subadmin-titles-settings'] });
      queryClient.invalidateQueries({ queryKey: ['subadmin-titles'] });
      toast.success('Subadmin titles saved');
      setSubadminTitleInput('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const employeeFieldsData = employeeFieldsResp?.data;
  const availableFields = employeeFieldsData?.availableFields ?? [];
  const configuredFields = employeeFieldsData?.configuredFields ?? null;

  useEffect(() => {
    if (!employeeFieldsResp?.data?.availableFields?.length) return;
    const d = employeeFieldsResp.data;
    setSelectedFields(new Set(d.configuredFields?.length ? d.configuredFields : d.availableFields));
  }, [employeeFieldsResp]);

  useEffect(() => {
    if (!showCreate) {
      setCreateKeySelectedFields(new Set());
      return;
    }
    if (availableFields.length === 0) return;
    const defaultKeyFields = [
      'id', 'employeeCode', 'firstName', 'lastName', 'fullName', 'email',
      'designation', 'workLocation', 'reportingManagerName', 'reportingTo', 'defaultPassword',
    ].filter((f) => availableFields.includes(f));
    setCreateKeySelectedFields(new Set(defaultKeyFields.length ? defaultKeyFields : availableFields));
  }, [showCreate, availableFields.join(',')]);

  const setEmployeeFieldsMutation = useMutation({
    mutationFn: (fields: string[]) =>
      api.put<{ success: true; data: { configuredFields: string[] | null }; message?: string }>(
        '/settings/api-access/employee-fields',
        { fields }
      ).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-access-employee-fields'] });
      const list = data.configuredFields?.length ? data.configuredFields : availableFields;
      setSelectedFields(new Set(list));
      toast.success('Employee API fields updated. Only selected fields will be returned.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (body: { clientName: string; rateLimitPerHour: number; employeeFullFields?: string[] }) =>
      api
        .post<{ success: true; data: CreatedKey; message: string }>('/settings/api-access', body)
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-access'] });
      setCreatedKey(data);
      setShowCreate(false);
      setClientName('');
      setRateLimitPerHour(1000);
      setCreateKeySelectedFields(new Set());
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
    const fields = createKeySelectedFields.size > 0 ? Array.from(createKeySelectedFields) : undefined;
    createMutation.mutate({
      clientName: name,
      rateLimitPerHour: Math.max(1, Math.min(10000, rateLimitPerHour)),
      employeeFullFields: fields,
    });
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
          {availableFields.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-2">
                Tick fields this key can access (GET .../employees/:id/full). Leave all unchecked to use global setting.
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setCreateKeySelectedFields(new Set(availableFields))}
                  className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setCreateKeySelectedFields(new Set())}
                  className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-dark-border rounded-lg">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createKeySelectedFields.has(field)}
                      onChange={(e) => {
                        const next = new Set(createKeySelectedFields);
                        if (e.target.checked) next.add(field);
                        else next.delete(field);
                        setCreateKeySelectedFields(next);
                      }}
                      className="rounded border-gray-300 dark:border-dark-border"
                    />
                    <span className="text-gray-700 dark:text-dark-text">{FIELD_LABELS[field] ?? field}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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

      <div className="mt-8 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Employee full API — fields exposed
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-1">
            Choose which fields are returned by GET /employees/:id/full and GET /integration/employees/:id/full. End users cannot select fields. Leave all unchecked to return all fields.
          </p>
        </div>
        <div className="p-4">
          {availableFields.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedFields(new Set(availableFields))}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFields(new Set())}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
                >
                  Clear all (expose all fields)
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeFieldsMutation.mutate(Array.from(selectedFields))}
                  disabled={setEmployeeFieldsMutation.isPending}
                  className="text-sm px-3 py-1.5 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50"
                >
                  {setEmployeeFieldsMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field)}
                      onChange={(e) => {
                        const next = new Set(selectedFields);
                        if (e.target.checked) next.add(field);
                        else next.delete(field);
                        setSelectedFields(next);
                      }}
                      className="rounded border-gray-300 dark:border-dark-border"
                    />
                    <span className="text-gray-700 dark:text-dark-text font-mono">{field}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Subadmin titles (CTO/CFO/...)</h2>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-1">
            These are used when employee Role is <span className="font-mono">subadmin</span>.
          </p>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              type="text"
              value={subadminTitleInput}
              onChange={(e) => setSubadminTitleInput(e.target.value)}
              placeholder="e.g. CTO"
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const t = subadminTitleInput.trim();
                if (!t) return;
                const next = Array.from(new Set([...subadminTitles, t]));
                saveSubadminTitlesMutation.mutate(next);
              }}
              disabled={saveSubadminTitlesMutation.isPending}
              className="px-3 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {subadminTitles.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-dark-border text-sm"
              >
                <span className="font-mono">{t}</span>
                <button
                  type="button"
                  onClick={() => saveSubadminTitlesMutation.mutate(subadminTitles.filter((x) => x !== t))}
                  disabled={saveSubadminTitlesMutation.isPending}
                  className="text-red-600 dark:text-red-400 hover:underline text-xs"
                >
                  Remove
                </button>
              </span>
            ))}
            {subadminTitles.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-dark-textSecondary">No titles yet.</p>
            )}
          </div>
        </div>
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
          <li>GET {API_BASE}/integration/employee?code=... — One endpoint: pass ?code=EMP-2026-0001, ?id=uuid, or ?email=... to get that employee with the fields you selected for this key</li>
          <li>GET {API_BASE}/integration/employees — List all active employees</li>
          <li>GET {API_BASE}/integration/employees/:id — Get employee by ID or code</li>
          <li>GET {API_BASE}/integration/employees/:id/full — Full payload (fields from global setting)</li>
        </ul>
      </div>
    </div>
  );
}
