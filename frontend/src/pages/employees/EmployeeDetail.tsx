import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { User, ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar } from 'lucide-react';
import { api } from '../../api/client';

type EmployeeDetailType = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  designation: string | null;
  reportingTo: string | null;
  dateOfJoining: string | null;
  employmentType: string;
  status: string;
  workLocation: string | null;
  departmentName: string | null;
  departmentId: number | null;
  createdAt: string;
};

type Res = { success: true; data: EmployeeDetailType };

function formatDate(s: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get<Res>(`/employees/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const emp = data ?? null;

  if (!id) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">Invalid employee ID</p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
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
          {error instanceof Error ? error.message : 'Failed to load employee'}
        </p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }
  if (!emp) return null;

  return (
    <div>
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Employees
      </Link>

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-light-primary/10 dark:bg-dark-primary/20">
            <User className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {emp.firstName} {emp.lastName}
            </h1>
            <p className="font-mono text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
              {emp.employeeCode}
            </p>
            <span
              className={`inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                emp.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {emp.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section>
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Email</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Phone</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.phone ?? '—'}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Department</dt>
                <dd className="text-gray-900 dark:text-dark-text">
                  {emp.departmentName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Designation</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.designation ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Type</dt>
                <dd className="text-gray-900 dark:text-dark-text capitalize">
                  {emp.employmentType.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Date of joining</dt>
                <dd className="text-gray-900 dark:text-dark-text">
                  {formatDate(emp.dateOfJoining)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Work location</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.workLocation ?? '—'}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Date of birth</dt>
                <dd className="text-gray-900 dark:text-dark-text">{formatDate(emp.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Gender</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.gender ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Reporting to</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.reportingTo ?? '—'}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
