import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type EmployeeItem = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string | null;
  departmentName: string | null;
  employmentType: string;
  status: string;
  dateOfJoining: string | null;
};

type Res = { success: true; data: EmployeeItem[]; meta?: { total: number; page: number; limit: number } };

export function EmployeeList() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canAdd = roleName === 'super_admin' || roleName === 'hr_admin';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');

  const params: Record<string, string> = {
    page: String(page),
    limit: '10',
  };
  if (searchSubmitted.trim()) params.search = searchSubmitted.trim();

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', page, searchSubmitted],
    queryFn: () =>
      api.get<Res>('/employees', params).then((r) => ({ items: r.data, meta: r.meta })),
  });

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const limit = data?.meta?.limit ?? 10;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Employees</h1>
        {canAdd && (
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Onboard Employee
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchSubmitted(search)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          />
        </div>
        <button
          type="button"
          onClick={() => setSearchSubmitted(search)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg"
        >
          Search
        </button>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {error && (
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load employees'}
        </p>
      )}

      <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-card">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Code
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Email
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Department
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Type
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Status
              </th>
              <th className="w-0" />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr
                key={e.id}
                className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50"
              >
                <td className="py-3 px-4 font-mono text-sm">{e.employeeCode}</td>
                <td className="py-3 px-4 font-medium">
                  {e.firstName} {e.lastName}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-dark-textSecondary">{e.email}</td>
                <td className="py-3 px-4">{e.departmentName ?? '—'}</td>
                <td className="py-3 px-4 capitalize">{e.employmentType.replace('_', ' ')}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      e.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link
                    to={`/employees/${e.id}`}
                    className="text-sm text-light-primary dark:text-dark-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !isLoading && (
          <div className="py-12 text-center text-gray-500 dark:text-dark-textSecondary">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No employees yet. {canAdd && 'Onboard one to get started.'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-dark-border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
