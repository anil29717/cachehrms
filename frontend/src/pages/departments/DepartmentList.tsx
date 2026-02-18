import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canManageDepartments } from '../../utils/permissions';
import { api } from '../../api/client';

type DeptItem = {
  id: number;
  name: string;
  description: string | null;
  headId: string | null;
  parentId: number | null;
  parentName: string | null;
  isActive: boolean;
  createdAt: string;
  employeeCount: number;
};

type Res = { success: true; data: DeptItem[] };

export function DepartmentList() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canManage = canManageDepartments(roleName);

  const { data, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Res>('/departments').then((r) => r.data),
  });

  const departments = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Departments</h1>
        {canManage && (
          <Link
            to="/departments/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </Link>
        )}
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {error && (
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load departments'}
        </p>
      )}

      <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden bg-white dark:bg-dark-card">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Name
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Employees
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Parent
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-dark-textSecondary">
                Status
              </th>
              <th className="w-0" />
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr
                key={d.id}
                className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50"
              >
                <td className="py-3 px-4">
                  <Link
                    to={`/departments/${d.id}`}
                    className="font-medium text-light-primary dark:text-dark-primary hover:underline"
                  >
                    {d.name}
                  </Link>
                </td>
                <td className="py-3 px-4 flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  {d.employeeCount}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-dark-textSecondary">
                  {d.parentName ?? '—'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      d.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Link
                    to={`/departments/${d.id}`}
                    className="text-sm text-light-primary dark:text-dark-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {departments.length === 0 && !isLoading && (
          <div className="py-12 text-center text-gray-500 dark:text-dark-textSecondary">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No departments yet. {isAdmin && 'Add one to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
