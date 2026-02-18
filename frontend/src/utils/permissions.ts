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
