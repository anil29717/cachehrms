import { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  LogOut,
  Sun,
  Moon,
  Clock,
  CalendarOff,
  Calendar,
  IndianRupee,
  ChevronDown,
  ChevronRight,
  List,
  DollarSign,
  Zap,
  FileText,
  Shield,
  CheckCircle,
  Wallet,
  DoorOpen,
  CalendarDays,
  Package,
  PlusCircle,
  UserPlus,
  RotateCcw,
  Wrench,
  History,
  FolderOpen,
  Ticket,
  AlertCircle,
  UserCheck,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  Menu,
  User,
  Receipt,
  Megaphone,
  Gift,
  CalendarClock,
  Flag,
  Settings,
} from 'lucide-react';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { api } from '../api/client';
import type { User as AuthUser } from '../stores/authStore';
import {
  isHR,
  isSuperAdmin,
  canAccessScope,
  canAccessScopeOrChild,
  canAccessApiManager,
  canViewAllBookings,
} from '../utils/permissions';

const SIDEBAR_WIDTH_EXPANDED = '14rem'; // w-56
const SIDEBAR_WIDTH_COLLAPSED = '4.5rem';

export function MainLayout() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  // Refresh scope permissions for HR on load so sidebar reflects latest assignments (e.g. after Super Admin saves)
  useEffect(() => {
    if (!user || user.roleName !== 'hr_admin') return;
    api
      .get<{ success?: boolean; data?: AuthUser }>('/auth/me')
      .then((res) => {
        if (res?.data) setUser(res.data);
      })
      .catch(() => {});
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const [payrollMenuOpen, setPayrollMenuOpen] = useState(false);
  const [assetsMenuOpen, setAssetsMenuOpen] = useState(false);
  const [ticketsMenuOpen, setTicketsMenuOpen] = useState(false);
  const [bookingMenuOpen, setBookingMenuOpen] = useState(false);
  const [expensesMenuOpen, setExpensesMenuOpen] = useState(false);
  const [announcementsMenuOpen, setAnnouncementsMenuOpen] = useState(false);
  const [employeesMenuOpen, setEmployeesMenuOpen] = useState(false);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (location.pathname.startsWith('/leave')) setLeaveMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/payroll')) setPayrollMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/assets')) setAssetsMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/tickets')) setTicketsMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/rooms') || location.pathname.startsWith('/bookings')) setBookingMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/expenses')) setExpensesMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/announcements')) setAnnouncementsMenuOpen(true);
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith('/employees') || location.pathname.startsWith('/onboarding')) setEmployeesMenuOpen(true);
  }, [location.pathname]);

  const isPayrollOpen = payrollMenuOpen;
  const isLeaveOpen = leaveMenuOpen;
  const isAssetsOpen = assetsMenuOpen;
  const isTicketsOpen = ticketsMenuOpen;
  const isBookingOpen = bookingMenuOpen;
  const isExpensesOpen = expensesMenuOpen;
  const isAnnouncementsOpen = announcementsMenuOpen;
  const isEmployeesOpen = employeesMenuOpen;
  const hrSidebar = isHR(user?.roleName);
  const isAdmin = isSuperAdmin(user?.roleName);
  const showDashboard = isAdmin || canAccessScope(user, 'dashboard');
  const showDepartments = isAdmin || canAccessScope(user, 'departments');
  const showEmployeesSubmenu = isAdmin || canAccessScopeOrChild(user, 'employees');
  const showAttendance = isAdmin || canAccessScope(user, 'attendance');
  const showLeaveSubmenu = isAdmin || canAccessScopeOrChild(user, 'leave');
  const showPayrollSubmenu = isAdmin || canAccessScopeOrChild(user, 'payroll');
  const showAssetsSubmenu = isAdmin || canAccessScopeOrChild(user, 'assets');
  const showTicketsSubmenu = isAdmin || canAccessScopeOrChild(user, 'tickets');
  const showExpensesSubmenu = isAdmin || canAccessScopeOrChild(user, 'expenses');
  const showAnnouncementsSubmenu = isAdmin || canAccessScopeOrChild(user, 'announcements');
  const showBooking = isAdmin || canAccessScopeOrChild(user, 'booking');
  const showSettingsPermissions = isAdmin; // Permission management is Super Admin only
  const showSettingsApi = isAdmin && canAccessApiManager(user?.roleName);
  const showSettingsLogs = isAdmin || canAccessScope(user, 'settings.logs');
  const isEmployeeListActive =
    location.pathname === '/employees' ||
    (location.pathname.startsWith('/employees/') &&
      !location.pathname.startsWith('/employees/new') &&
      !location.pathname.startsWith('/employees/documents'));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  /** Display name from email (e.g. admin@company.com → Admin) */
  function displayNameFromEmail(email: string | undefined): string {
    if (!email) return '—';
    const part = email.split('@')[0] ?? '';
    return part.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || email;
  }

  function navLink(
    to: string,
    icon: React.ReactNode,
    label: string,
    active?: boolean
  ) {
    const base =
      'flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg';
    const activeClass =
      'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium';
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`${base} ${active ? activeClass : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
        title={sidebarCollapsed ? label : undefined}
      >
        <span className="flex-shrink-0">{icon}</span>
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function subLink(to: string, icon: React.ReactNode, label: string, active: boolean) {
    const base =
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg';
    const activeClass = 'bg-gray-100 dark:bg-dark-bg text-light-primary dark:text-dark-primary font-medium';
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`${base} ${active ? activeClass : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
        title={sidebarCollapsed ? label : undefined}
      >
        <span className="flex-shrink-0 w-4">{icon}</span>
        {!sidebarCollapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      {/* Header: logo + collapse */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-dark-border min-h-[3.5rem]">
        {!sidebarCollapsed && <span className="font-semibold text-gray-900 dark:text-dark-text truncate">HRMS</span>}
        <button
          type="button"
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg flex-shrink-0"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav: scrollable, scrollbar hidden */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-0 sidebar-nav-scroll">
        {hrSidebar ? (
          <div className="space-y-1">
            {showDashboard && navLink('/dashboard', <LayoutDashboard className="w-5 h-5" />, 'Dashboard', location.pathname === '/' || location.pathname === '/dashboard')}
            {showDepartments && navLink('/departments', <Building2 className="w-5 h-5" />, 'Departments', location.pathname.startsWith('/departments'))}

            {showEmployeesSubmenu ? (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setEmployeesMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Employees' : undefined}
                >
                  <Users className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Employees</span>
                      {isEmployeesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isEmployeesOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'employees.list')) && subLink('/employees', <List className="w-4 h-4" />, 'Employee list', isEmployeeListActive)}
                    {(isAdmin || canAccessScope(user, 'employees.onboarding')) && subLink('/onboarding', <UserCheck className="w-4 h-4" />, 'Onboard employee', location.pathname.startsWith('/onboarding'))}
                    {(isAdmin || canAccessScope(user, 'employees.documents')) && subLink('/employees/documents', <FileText className="w-4 h-4" />, 'Employees document', location.pathname === '/employees/documents')}
                  </div>
                )}
              </div>
            ) : null}

            {showAttendance && navLink('/attendance', <Clock className="w-5 h-5" />, 'Attendance', location.pathname.startsWith('/attendance'))}

            {showLeaveSubmenu ? (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setLeaveMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Leave' : undefined}
                >
                  <CalendarOff className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Leave</span>
                      {isLeaveOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isLeaveOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'leave.requests')) && subLink('/leave/requests', <List className="w-4 h-4" />, 'Leave Requests', location.pathname === '/leave/requests')}
                    {(isAdmin || canAccessScope(user, 'leave.pending')) && subLink('/leave/pending', <Clock className="w-4 h-4" />, 'Pending Approvals', location.pathname === '/leave/pending')}
                    {(isAdmin || canAccessScope(user, 'leave.calendar')) && subLink('/leave/calendar', <Calendar className="w-4 h-4" />, 'Leave Calendar', location.pathname === '/leave/calendar')}
                    {(isAdmin || canAccessScope(user, 'leave.balance')) && subLink('/leave/balance', <Wallet className="w-4 h-4" />, 'Leave Balance', location.pathname === '/leave/balance')}
                    {(isAdmin || canAccessScope(user, 'leave.policy')) && subLink('/leave/policy', <FileText className="w-4 h-4" />, 'Leave Policy', location.pathname === '/leave/policy')}
                  </div>
                )}
              </div>
            ) : showLeaveSubmenu ? (
              <div className="mt-3">{navLink('/leave/requests', <CalendarOff className="w-5 h-5" />, 'Leave', location.pathname.startsWith('/leave'))}</div>
            ) : null}

            {showPayrollSubmenu && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setPayrollMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Payroll' : undefined}
                >
                  <IndianRupee className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Payroll</span>
                      {isPayrollOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isPayrollOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'payroll.runs')) && subLink('/payroll/runs', <List className="w-4 h-4" />, 'Payroll Runs', location.pathname === '/payroll/runs')}
                    {(isAdmin || canAccessScope(user, 'payroll.salary-structure')) && subLink('/payroll/salary-structure', <DollarSign className="w-4 h-4" />, 'Salary Structure', location.pathname === '/payroll/salary-structure')}
                    {(isAdmin || canAccessScope(user, 'payroll.generate')) && subLink('/payroll/generate', <Zap className="w-4 h-4" />, 'Generate Payroll', location.pathname === '/payroll/generate')}
                    {(isAdmin || canAccessScope(user, 'payroll.my-payslips')) && subLink('/payroll/my-payslips', <FileText className="w-4 h-4" />, 'My Payslips', location.pathname.startsWith('/payroll/my-payslips') || location.pathname.startsWith('/payroll/payslip'))}
                  </div>
                )}
              </div>
            )}

            {showAssetsSubmenu && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setAssetsMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Assets' : undefined}
                >
                  <Package className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Assets</span>
                      {isAssetsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isAssetsOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'assets.list')) && subLink('/assets', <List className="w-4 h-4" />, 'All Assets', location.pathname === '/assets')}
                    {(isAdmin || canAccessScope(user, 'assets.new')) && subLink('/assets/new', <PlusCircle className="w-4 h-4" />, 'Add Asset', location.pathname === '/assets/new')}
                    {(isAdmin || canAccessScope(user, 'assets.categories')) && subLink('/assets/categories', <FolderOpen className="w-4 h-4" />, 'Asset Categories', location.pathname === '/assets/categories')}
                    {(isAdmin || canAccessScope(user, 'assets.assign')) && subLink('/assets/allocations/assign', <UserPlus className="w-4 h-4" />, 'Assign Asset', location.pathname === '/assets/allocations/assign')}
                    {(isAdmin || canAccessScope(user, 'assets.allocations')) && subLink('/assets/allocations', <List className="w-4 h-4" />, 'Allocated Assets', location.pathname === '/assets/allocations')}
                    {(isAdmin || canAccessScope(user, 'assets.returns')) && subLink('/assets/returns', <RotateCcw className="w-4 h-4" />, 'Returns', location.pathname === '/assets/returns')}
                    {(isAdmin || canAccessScope(user, 'assets.maintenance')) && subLink('/assets/maintenance', <Wrench className="w-4 h-4" />, 'Service Requests', location.pathname === '/assets/maintenance')}
                    {(isAdmin || canAccessScope(user, 'assets.repair-history')) && subLink('/assets/maintenance/history', <History className="w-4 h-4" />, 'Repair History', location.pathname === '/assets/maintenance/history')}
                  </div>
                )}
              </div>
            )}

            {showTicketsSubmenu && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setTicketsMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Tickets' : undefined}
                >
                  <Ticket className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Tickets</span>
                      {isTicketsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isTicketsOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'tickets.overview')) && subLink('/tickets', <LayoutDashboard className="w-4 h-4" />, 'Overview', location.pathname === '/tickets')}
                    {(isAdmin || canAccessScope(user, 'tickets.all')) && subLink('/tickets/all', <List className="w-4 h-4" />, 'All Tickets', location.pathname === '/tickets/all')}
                    {(isAdmin || canAccessScope(user, 'tickets.my')) && subLink('/tickets/my', <UserCheck className="w-4 h-4" />, 'My Tickets', location.pathname === '/tickets/my')}
                    {(isAdmin || canAccessScope(user, 'tickets.reports')) && subLink('/tickets/reports', <BarChart3 className="w-4 h-4" />, 'Reports', location.pathname.startsWith('/tickets/reports'))}
                    {(isAdmin || canAccessScope(user, 'tickets.settings')) && subLink('/tickets/categories', <Settings className="w-4 h-4" />, 'Settings', location.pathname === '/tickets/categories')}
                  </div>
                )}
              </div>
            )}

            {showExpensesSubmenu && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setExpensesMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Expenses' : undefined}
                >
                  <Receipt className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Expenses</span>
                      {isExpensesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isExpensesOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'expenses.dashboard')) && subLink('/expenses', <LayoutDashboard className="w-4 h-4" />, 'Expense Dashboard', location.pathname === '/expenses')}
                    {(isAdmin || canAccessScope(user, 'expenses.types')) && subLink('/expenses/types', <List className="w-4 h-4" />, 'Expense Types & Limits', location.pathname === '/expenses/types')}
                    {(isAdmin || canAccessScope(user, 'expenses.pending')) && subLink('/expenses/requests/pending', <Clock className="w-4 h-4" />, 'Pending', location.pathname === '/expenses/requests/pending')}
                    {(isAdmin || canAccessScope(user, 'expenses.approved')) && subLink('/expenses/requests/approved', <CheckCircle className="w-4 h-4" />, 'Approved', location.pathname === '/expenses/requests/approved')}
                    {(isAdmin || canAccessScope(user, 'expenses.paid')) && subLink('/expenses/requests/paid', <Wallet className="w-4 h-4" />, 'Paid', location.pathname === '/expenses/requests/paid')}
                    {(isAdmin || canAccessScope(user, 'expenses.rejected')) && subLink('/expenses/requests/rejected', <AlertCircle className="w-4 h-4" />, 'Rejected', location.pathname === '/expenses/requests/rejected')}
                    {(isAdmin || canAccessScope(user, 'expenses.new')) && subLink('/expenses/new', <PlusCircle className="w-4 h-4" />, 'New Claim', location.pathname === '/expenses/new')}
                    {(isAdmin || canAccessScope(user, 'expenses.reports')) && subLink('/expenses/reports', <BarChart3 className="w-4 h-4" />, 'Reports', location.pathname === '/expenses/reports')}
                  </div>
                )}
              </div>
            )}

            {showAnnouncementsSubmenu && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setAnnouncementsMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Announcements' : undefined}
                >
                  <Megaphone className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Announcements</span>
                      {isAnnouncementsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isAnnouncementsOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'announcements.new')) && subLink('/announcements/new', <PlusCircle className="w-4 h-4" />, 'Create New', location.pathname === '/announcements/new')}
                    {(isAdmin || canAccessScope(user, 'announcements.all')) && subLink('/announcements', <List className="w-4 h-4" />, 'All Announcements', location.pathname === '/announcements')}
                    {(isAdmin || canAccessScope(user, 'announcements.birthdays')) && subLink('/announcements/birthdays', <Gift className="w-4 h-4" />, 'Birthday Announcements', location.pathname === '/announcements/birthdays')}
                    {(isAdmin || canAccessScope(user, 'announcements.holidays')) && subLink('/announcements/holidays', <CalendarDays className="w-4 h-4" />, 'Holiday Announcements', location.pathname === '/announcements/holidays')}
                    {(isAdmin || canAccessScope(user, 'announcements.asset-collection')) && subLink('/announcements/asset-collection', <Package className="w-4 h-4" />, 'Asset Collection', location.pathname === '/announcements/asset-collection')}
                    {(isAdmin || canAccessScope(user, 'announcements.events')) && subLink('/announcements/events', <CalendarClock className="w-4 h-4" />, 'Events', location.pathname === '/announcements/events')}
                    {(isAdmin || canAccessScope(user, 'announcements.deadlines')) && subLink('/announcements/deadlines', <Flag className="w-4 h-4" />, 'Deadlines', location.pathname === '/announcements/deadlines')}
                    {(isAdmin || canAccessScope(user, 'announcements.reports')) && subLink('/announcements/reports', <BarChart3 className="w-4 h-4" />, 'Reports', location.pathname === '/announcements/reports')}
                  </div>
                )}
              </div>
            )}

            {showBooking && (
              <div className="py-0.5 mt-3">
                <button
                  type="button"
                  onClick={() => { setBookingMenuOpen((o) => !o); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg w-full text-left ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={sidebarCollapsed ? 'Booking' : undefined}
                >
                  <CalendarDays className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1">Booking</span>
                      {isBookingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                {isBookingOpen && !sidebarCollapsed && (
                  <div className="pl-4 mt-0.5 space-y-0.5">
                    {(isAdmin || canAccessScope(user, 'booking.rooms')) && subLink('/rooms', <DoorOpen className="w-4 h-4" />, 'Room Booking', location.pathname.startsWith('/rooms'))}
                    {(isAdmin || canAccessScope(user, 'booking.my')) && subLink('/bookings', <CalendarDays className="w-4 h-4" />, 'My Bookings', location.pathname.startsWith('/bookings') && location.pathname !== '/bookings/all')}
                    {(isAdmin || canViewAllBookings(user?.roleName)) && (isAdmin || canAccessScope(user, 'booking.all')) &&
                      subLink('/bookings/all', <List className="w-4 h-4" />, 'All Bookings (Admin)', location.pathname === '/bookings/all')}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3">
            {showSettingsPermissions &&
              navLink('/settings/permissions', <Shield className="w-5 h-5" />, 'Permissions', location.pathname === '/settings/permissions')}
            {showSettingsApi &&
              navLink('/settings/api-access', <Key className="w-5 h-5" />, 'API Manager', location.pathname === '/settings/api-access')}
            {showSettingsLogs &&
              navLink('/settings/system-logs', <FileText className="w-5 h-5" />, 'System Logs', location.pathname === '/settings/system-logs')}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {navLink('/dashboard', <LayoutDashboard className="w-5 h-5" />, 'Dashboard', location.pathname === '/' || location.pathname === '/dashboard')}
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-dark-textSecondary">HR access only. Contact admin.</p>
          </div>
        )}
      </nav>

      {/* Bottom: Profile, Logout */}
      <div
        className={`border-t border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}
      >
        <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-light-primary dark:text-dark-primary" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{user?.roleName}</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-200 dark:hover:bg-dark-bg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="mt-2 w-full flex justify-center p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-200 dark:hover:bg-dark-bg"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: fixed, responsive width, mobile = overlay */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-40
          bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border
          flex flex-col
          transition-[width] duration-200 ease-out
          lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: mobileMenuOpen || !sidebarCollapsed ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for desktop so main content is not under sidebar */}
      <div
        className="hidden lg:block flex-shrink-0 transition-[width] duration-200 ease-out"
        style={{
          width: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-14 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden flex-shrink-0 p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                {displayNameFromEmail(user?.email)}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">
                {user?.email}
                {user?.roleName && (
                  <span className="ml-1.5 font-medium text-gray-600 dark:text-dark-textSecondary">
                    · {user.roleName.replace(/_/g, ' ')}
                  </span>
                )}
              </p>
            </div>
            <div className="sm:hidden min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">
                {user?.roleName?.replace(/_/g, ' ') ?? '—'}
              </p>
            </div>
          </div>

          {/* Right: Theme + Profile dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-dark-textSecondary"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div
              ref={profileMenuRef}
              className="relative"
              onMouseEnter={() => setProfileMenuOpen(true)}
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary hover:ring-2 hover:ring-light-primary/50 dark:hover:ring-dark-primary/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
              >
                <User className="w-5 h-5" />
              </button>

              {profileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 py-1 min-w-[200px] rounded-lg shadow-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card z-30"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-border">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-textSecondary">
                      {user?.roleName?.replace(/_/g, ' ') ?? '—'}
                    </p>
                  </div>
                  <Link
                    to="/settings/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary" />
                    Update profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg rounded-b-lg"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
