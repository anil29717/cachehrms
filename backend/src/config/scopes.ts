/**
 * Sidebar scope IDs for RBAC. Super Admin has full access; HR access is controlled per-user.
 * Each scope can have children (sub-modules). IDs must match frontend sidebar config.
 */
export type ScopeNode = {
  id: string;
  label: string;
  children?: ScopeNode[];
};

export const SCOPES_TREE: ScopeNode[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'departments', label: 'Departments' },
  {
    id: 'employees',
    label: 'Employees',
    children: [
      { id: 'employees.list', label: 'Employee list' },
      { id: 'employees.onboarding', label: 'Onboard employee' },
      { id: 'employees.documents', label: 'Employees document' },
    ],
  },
  { id: 'attendance', label: 'Attendance' },
  {
    id: 'leave',
    label: 'Leave',
    children: [
      { id: 'leave.requests', label: 'Leave Requests' },
      { id: 'leave.pending', label: 'Pending Approvals' },
      { id: 'leave.calendar', label: 'Leave Calendar' },
      { id: 'leave.balance', label: 'Leave Balance' },
      { id: 'leave.policy', label: 'Leave Policy' },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    children: [
      { id: 'payroll.runs', label: 'Payroll Runs' },
      { id: 'payroll.salary-structure', label: 'Salary Structure' },
      { id: 'payroll.generate', label: 'Generate Payroll' },
      { id: 'payroll.my-payslips', label: 'My Payslips' },
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    children: [
      { id: 'assets.list', label: 'All Assets' },
      { id: 'assets.new', label: 'Add Asset' },
      { id: 'assets.categories', label: 'Asset Categories' },
      { id: 'assets.assign', label: 'Assign Asset' },
      { id: 'assets.allocations', label: 'Allocated Assets' },
      { id: 'assets.returns', label: 'Returns' },
      { id: 'assets.maintenance', label: 'Service Requests' },
      { id: 'assets.repair-history', label: 'Repair History' },
    ],
  },
  {
    id: 'tickets',
    label: 'Tickets',
    children: [
      { id: 'tickets.overview', label: 'Overview' },
      { id: 'tickets.all', label: 'All Tickets' },
      { id: 'tickets.my', label: 'My Tickets' },
      { id: 'tickets.reports', label: 'Reports' },
      { id: 'tickets.settings', label: 'Settings' },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    children: [
      { id: 'expenses.dashboard', label: 'Expense Dashboard' },
      { id: 'expenses.types', label: 'Expense Types & Limits' },
      { id: 'expenses.pending', label: 'Pending' },
      { id: 'expenses.approved', label: 'Approved' },
      { id: 'expenses.paid', label: 'Paid' },
      { id: 'expenses.rejected', label: 'Rejected' },
      { id: 'expenses.new', label: 'New Claim' },
      { id: 'expenses.reports', label: 'Reports' },
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    children: [
      { id: 'announcements.new', label: 'Create New' },
      { id: 'announcements.all', label: 'All Announcements' },
      { id: 'announcements.birthdays', label: 'Birthday Announcements' },
      { id: 'announcements.holidays', label: 'Holiday Announcements' },
      { id: 'announcements.asset-collection', label: 'Asset Collection' },
      { id: 'announcements.events', label: 'Events' },
      { id: 'announcements.deadlines', label: 'Deadlines' },
      { id: 'announcements.reports', label: 'Reports' },
    ],
  },
  {
    id: 'booking',
    label: 'Booking',
    children: [
      { id: 'booking.rooms', label: 'Room Booking' },
      { id: 'booking.my', label: 'My Bookings' },
      { id: 'booking.all', label: 'All Bookings (Admin)' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'settings.permissions', label: 'Permissions' },
      { id: 'settings.api', label: 'API Manager' },
      { id: 'settings.logs', label: 'System Logs' },
    ],
  },
];

/** Flatten all scope IDs (for validation). Includes parent IDs so module-level grant implies access to module. */
function flattenScopeIds(nodes: ScopeNode[], out: string[]): void {
  for (const n of nodes) {
    out.push(n.id);
    if (n.children?.length) flattenScopeIds(n.children, out);
  }
}

export const ALL_SCOPE_IDS: string[] = [];
flattenScopeIds(SCOPES_TREE, ALL_SCOPE_IDS);

export function isValidScopeId(scopeId: string): boolean {
  return ALL_SCOPE_IDS.includes(scopeId);
}
