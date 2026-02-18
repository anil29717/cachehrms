import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function PayrollRedirect() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const isHR = roleName === 'super_admin' || roleName === 'hr_admin';
  return <Navigate to={isHR ? '/payroll/runs' : '/payroll/my-payslips'} replace />;
}
