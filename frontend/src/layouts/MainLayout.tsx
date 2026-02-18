import { Outlet } from 'react-router-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Key, LogOut, Sun, Moon, Clock, CalendarOff, IndianRupee, ChevronDown, ChevronRight, List, DollarSign, Zap, FileText } from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { isHR, canAccessPayroll, canAccessApiManager } from '../utils/permissions';

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const isPayrollOpen = location.pathname.startsWith('/payroll');
  const hrSidebar = isHR(user?.roleName);
  const showPayrollSubmenu = canAccessPayroll(user?.roleName);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg">
      <aside className="w-56 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <span className="font-semibold text-gray-900 dark:text-dark-text">HRMS</span>
        </div>
        <nav className="p-2 flex-1">
          {hrSidebar ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                to="/departments"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <Building2 className="w-5 h-5" />
                Departments
              </Link>
              <Link
                to="/employees"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <Users className="w-5 h-5" />
                Employees
              </Link>
              <Link
                to="/attendance"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <Clock className="w-5 h-5" />
                Attendance
              </Link>
              <Link
                to="/leave"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <CalendarOff className="w-5 h-5" />
                Leave
              </Link>
              {showPayrollSubmenu && (
                <div className="py-1">
                  <Link
                    to="/payroll"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                  >
                    <IndianRupee className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Payroll</span>
                    {isPayrollOpen ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                  {isPayrollOpen && (
                    <div className="pl-4 mt-0.5 space-y-0.5">
                      <Link
                        to="/payroll/runs"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${location.pathname === '/payroll/runs' ? 'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium' : 'text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                      >
                        <List className="w-4 h-4" />
                        Payroll runs
                      </Link>
                      <Link
                        to="/payroll/salary-structure"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${location.pathname === '/payroll/salary-structure' ? 'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium' : 'text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                      >
                        <DollarSign className="w-4 h-4" />
                        Salary structure
                      </Link>
                      <Link
                        to="/payroll/generate"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${location.pathname === '/payroll/generate' ? 'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium' : 'text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                      >
                        <Zap className="w-4 h-4" />
                        Generate payroll
                      </Link>
                      <Link
                        to="/payroll/my-payslips"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${location.pathname.startsWith('/payroll/my-payslips') || location.pathname.startsWith('/payroll/payslip') ? 'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium' : 'text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg'}`}
                      >
                        <FileText className="w-4 h-4" />
                        My payslips
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {canAccessApiManager(user?.roleName) && (
                <Link
                  to="/settings/api-access"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                >
                  <Key className="w-5 h-5" />
                  API Manager
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-dark-textSecondary">
                HR access only. Contact admin.
              </p>
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-6">
          <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
            {user?.email} · {user?.roleName}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-700 dark:text-dark-text"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
