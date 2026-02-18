import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Building2, Edit, Users, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canManageDepartments } from '../../utils/permissions';
import { api } from '../../api/client';

type DeptDetail = {
  id: number;
  name: string;
  description: string | null;
  headId: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  employeeCount: number;
  parent: { id: number; name: string } | null;
  children: { id: number; name: string; employeeCount: number }[];
};

type Res = { success: true; data: DeptDetail };

export function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canManage = canManageDepartments(roleName);

  const { data, isLoading, error } = useQuery({
    queryKey: ['departments', id],
    queryFn: () => api.get<Res>(`/departments/${id}`).then((r) => r.data),
    enabled: !!id && !Number.isNaN(Number(id)),
  });

  const dept = data ?? null;

  if (!id) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">Invalid department ID</p>
        <Link to="/departments" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load department'}
        </p>
        <Link to="/departments" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }
  if (!dept) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/departments"
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Departments
        </Link>
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate(`/departments/${id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-light-primary/10 dark:bg-dark-primary/20">
            <Building2 className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{dept.name}</h1>
            <span
              className={`inline-flex mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                dept.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {dept.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {dept.description && (
          <p className="text-gray-600 dark:text-dark-textSecondary mb-6">{dept.description}</p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Employees</dt>
            <dd className="mt-1 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {dept.employeeCount}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Parent department</dt>
            <dd className="mt-1">
              {dept.parent ? (
                <Link
                  to={`/departments/${dept.parent.id}`}
                  className="text-light-primary dark:text-dark-primary hover:underline"
                >
                  {dept.parent.name}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary">Department head ID</dt>
            <dd className="mt-1">{dept.headId ?? '—'}</dd>
          </div>
        </dl>

        {dept.children.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
            <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">
              Sub-departments
            </h2>
            <ul className="space-y-2">
              {dept.children.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/departments/${c.id}`}
                    className="text-light-primary dark:text-dark-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-gray-500 dark:text-dark-textSecondary ml-2">
                    ({c.employeeCount} employees)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
