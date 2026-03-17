import type { User } from '../stores/authStore';

/**
 * HR-only access: only super_admin and hr_admin can use the app for now.
 * No employee login — all features are for HR.
 */

export const HR_ROLES = ['super_admin', 'hr_admin'] as const;
export type HRRole = (typeof HR_ROLES)[number];

/** True if the user is HR (full sidebar and HR features). */
export function isHR(roleName: string | undefined): boolean {
  return roleName === 'super_admin' || roleName === 'hr_admin';
}

/** True if the user is Super Admin (full access, permissions cannot be restricted). */
export function isSuperAdmin(roleName: string | undefined): boolean {
  return roleName === 'super_admin';
}

/**
 * RBAC: Check if user has access to a scope. Super Admin always has access.
 * HR: check scopePermissions (view access implies module visible in sidebar).
 */
export function canAccessScope(
  user: User | null,
  scopeId: string,
  action: 'view' | 'create' | 'edit' | 'delete' = 'view'
): boolean {
  if (!user) return false;
  if (user.roleName === 'super_admin') return true;
  const p = user.scopePermissions?.[scopeId];
  if (!p) return false;
  if (action === 'view') return p.canView;
  if (action === 'create') return p.canCreate;
  if (action === 'edit') return p.canEdit;
  return p.canDelete;
}

/** True if user has view access to scope OR any child scope (e.g. "leave" or "leave.requests"). */
export function canAccessScopeOrChild(user: User | null, scopeId: string): boolean {
  if (!user) return false;
  if (user.roleName === 'super_admin') return true;
  const perms = user.scopePermissions;
  if (!perms) return false;
  if (perms[scopeId]?.canView) return true;
  return Object.keys(perms).some((id) => id.startsWith(scopeId + '.') && perms[id]?.canView);
}

/** True if the user can manage departments (create/edit). */
export function canManageDepartments(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can manage employees (onboard, etc.). */
export function canManageEmployees(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can access payroll (runs, salary structure, generate). */
export function canAccessPayroll(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can access API Manager (super_admin only). */
export function canAccessApiManager(roleName: string | undefined): boolean {
  return roleName === 'super_admin';
}

/** True if the user can manage permissions (users & roles, sidebar access). */
export function canManagePermissions(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user sees full Leave Management submenu (Leave Requests, Pending, Calendar, Balance, Policy). */
export function canAccessLeaveManagement(roleName: string | undefined): boolean {
  return roleName === 'super_admin';
}

/** True if the user can create/edit/delete rooms (Room booking admin). */
export function canManageRooms(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can view all bookings (not just own). */
export function canViewAllBookings(roleName: string | undefined): boolean {
  return roleName === 'super_admin' || roleName === 'hr_admin';
}

/** True if the user can access Asset Management (view assets, allocations, maintenance). */
export function canAccessAssets(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can access the Ticket system. */
export function canAccessTickets(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can access Expense Management. */
export function canAccessExpenses(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can access Announcements. */
export function canAccessAnnouncements(roleName: string | undefined): boolean {
  return isHR(roleName);
}

/** True if the user can view system/audit logs (super_admin only). */
export function canViewSystemLogs(roleName: string | undefined): boolean {
  return roleName === 'super_admin';
}
