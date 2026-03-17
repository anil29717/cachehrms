import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Users } from 'lucide-react';
import { api } from '../../api/client';

type EmployeeItem = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string | null;
};

export function EmployeeDocumentsPage() {
  const { data: apiRes, isLoading } = useQuery({
    queryKey: ['employees-list-docs'],
    queryFn: () => api.get<{ success: true; data: EmployeeItem[] }>('/employees?limit=500'),
  });

  const raw = (apiRes as { data?: EmployeeItem[] | { items: EmployeeItem[] } })?.data;
  const items = Array.isArray(raw) ? raw : (raw as { items?: EmployeeItem[] })?.items ?? [];

  return (
    <div>
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Employees
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2 flex items-center gap-2">
        <FileText className="w-6 h-6" />
        Employees & documents
      </h1>
      <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">
        View any employee to see their uploaded onboarding details and documents (read-only).
      </p>
      {isLoading ? (
        <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {items.map((emp) => (
              <li key={emp.id}>
                <Link
                  to={`/employees/${emp.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg/50"
                >
                  <Users className="w-5 h-5 text-gray-400 dark:text-dark-textSecondary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-textSecondary">
                      {emp.employeeCode}
                      {emp.departmentName && ` · ${emp.departmentName}`}
                    </p>
                  </div>
                  <span className="text-sm text-light-primary dark:text-dark-primary">View profile & documents →</span>
                </Link>
              </li>
            ))}
          </ul>
          {items.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
              No employees yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
