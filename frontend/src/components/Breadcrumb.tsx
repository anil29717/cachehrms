import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  onboarding: 'Onboarding',
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
  permissions: 'Permissions',
  'api-access': 'API Manager',
  'system-logs': 'System Logs',
  profile: 'Profile',
  rooms: 'Room booking',
  bookings: 'My bookings',
  book: 'Book a room',
  all: 'All bookings',
  assets: 'Assets',
  allocations: 'Allocation',
  assign: 'Assign Asset',
  returns: 'Returns',
  maintenance: 'Service Requests',
  history: 'Repair History',
  tickets: 'Tickets',
  'tickets/all': 'All Tickets',
  'tickets/my': 'My Tickets',
  volume: 'Ticket Volume',
  'resolution-time': 'Resolution Time',
  'tickets/reports/volume': 'Ticket Volume',
  'tickets/reports/resolution-time': 'Resolution Time',
  expenses: 'Expenses',
  types: 'Expense Types & Limits',
  requests: 'Requests',
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
  claims: 'Claim',
  // Path-specific labels (segment alone would be duplicate)
  'employees/new': 'New',
  'assets/new': 'Add Asset',
  'assets/categories': 'Asset Categories',
  'tickets/categories': 'Categories',
  'payroll/reports': 'Reports',
  'tickets/reports': 'Reports',
  'expenses/types': 'Expense Types & Limits',
  'expenses/requests/pending': 'Pending',
  'expenses/requests/approved': 'Approved',
  'expenses/requests/paid': 'Paid',
  'expenses/requests/rejected': 'Rejected',
  'expenses/new': 'New Claim',
  'expenses/reports': 'Reports',
  announcements: 'Announcements',
  birthdays: 'Birthday Announcements',
  holidays: 'Holiday Announcements',
  'asset-collection': 'Asset Collection',
  events: 'Events',
  deadlines: 'Deadlines',
  view: 'View',
  'announcements/new': 'Create New',
  'announcements/birthdays': 'Birthday Announcements',
  'announcements/holidays': 'Holiday Announcements',
  'announcements/asset-collection': 'Asset Collection',
  'announcements/events': 'Events',
  'announcements/deadlines': 'Deadlines',
  'announcements/reports': 'Reports',
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
        const pathKey = segments.slice(0, i + 1).join('/');
        const label = routeLabels[pathKey] ?? routeLabels[segment] ?? segment.replace(/-/g, ' ');
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
