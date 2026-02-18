import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  departments: 'Departments',
  new: 'New',
  edit: 'Edit',
  attendance: 'Attendance',
  leave: 'Leave',
  payroll: 'Payroll',
  runs: 'Payroll runs',
  'salary-structure': 'Salary structure',
  generate: 'Generate payroll',
  'my-payslips': 'My payslips',
  payslip: 'Payslip',
  reports: 'Reports',
  settings: 'Settings',
  'api-access': 'API Manager',
  profile: 'Profile',
};

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) segments.push('dashboard');

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary mb-4">
      <Link to="/" className="hover:text-light-primary dark:hover:text-dark-primary">
        Home
      </Link>
      {segments.map((segment, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = routeLabels[segment] ?? segment.replace(/-/g, ' ');
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-dark-text">{label}</span>
            ) : (
              <Link to={path} className="hover:text-light-primary dark:hover:text-dark-primary">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
