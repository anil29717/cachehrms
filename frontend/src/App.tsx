import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DepartmentList } from './pages/departments/DepartmentList';
import { DepartmentDetail } from './pages/departments/DepartmentDetail';
import { DepartmentForm } from './pages/departments/DepartmentForm';
import { EmployeeList } from './pages/employees/EmployeeList';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { EmployeeOnboardingForm } from './pages/employees/EmployeeOnboardingForm';
import { ApiManager } from './pages/settings/ApiManager';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavePage } from './pages/leave/LeavePage';
import { PayrollListPage } from './pages/payroll/PayrollListPage';
import { SalaryStructurePage } from './pages/payroll/SalaryStructurePage';
import { GeneratePayrollPage } from './pages/payroll/GeneratePayrollPage';
import { MyPayslipsPage } from './pages/payroll/MyPayslipsPage';
import { PayslipViewPage } from './pages/payroll/PayslipViewPage';
import { PayrollRedirect } from './pages/payroll/PayrollRedirect';
import { MainLayout } from './layouts/MainLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="departments" element={<DepartmentList />} />
        <Route path="departments/new" element={<DepartmentForm />} />
        <Route path="departments/:id" element={<DepartmentDetail />} />
        <Route path="departments/:id/edit" element={<DepartmentForm />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/new" element={<EmployeeOnboardingForm />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="payroll" element={<PayrollRedirect />} />
        <Route path="payroll/runs" element={<PayrollListPage />} />
        <Route path="payroll/salary-structure" element={<SalaryStructurePage />} />
        <Route path="payroll/generate" element={<GeneratePayrollPage />} />
        <Route path="payroll/my-payslips" element={<MyPayslipsPage />} />
        <Route path="payroll/payslip/:id" element={<PayslipViewPage />} />
        <Route path="settings/api-access" element={<ApiManager />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
