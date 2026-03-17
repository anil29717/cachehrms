import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DepartmentList } from './pages/departments/DepartmentList';
import { DepartmentDetail } from './pages/departments/DepartmentDetail';
import { DepartmentForm } from './pages/departments/DepartmentForm';
import { EmployeeList } from './pages/employees/EmployeeList';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { EmployeeEditPage } from './pages/employees/EmployeeEditPage';
import { EmployeeDocumentsPage } from './pages/employees/EmployeeDocumentsPage';
import { EmployeeOnboardingForm } from './pages/employees/EmployeeOnboardingForm';
import { OnboardingListPage } from './pages/onboarding/OnboardingListPage';
import { OnboardingDetailPage } from './pages/onboarding/OnboardingDetailPage';
import { OnboardingJoinPage } from './pages/onboarding/OnboardingJoinPage';
import { ApiManager } from './pages/settings/ApiManager';
import { PermissionsPage } from './pages/settings/PermissionsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { SystemLogsPage } from './pages/settings/SystemLogsPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeaveRequestsPage } from './pages/leave/LeaveRequestsPage';
import { PendingApprovalsPage } from './pages/leave/PendingApprovalsPage';
import { LeaveCalendarPage } from './pages/leave/LeaveCalendarPage';
import { LeaveBalancePage } from './pages/leave/LeaveBalancePage';
import { LeavePolicyPage } from './pages/leave/LeavePolicyPage';
import { LeaveRedirect } from './pages/leave/LeaveRedirect';
import { PayrollListPage } from './pages/payroll/PayrollListPage';
import { SalaryStructurePage } from './pages/payroll/SalaryStructurePage';
import { GeneratePayrollPage } from './pages/payroll/GeneratePayrollPage';
import { MyPayslipsPage } from './pages/payroll/MyPayslipsPage';
import { PayslipViewPage } from './pages/payroll/PayslipViewPage';
import { PayrollRedirect } from './pages/payroll/PayrollRedirect';
import { RoomListPage } from './pages/rooms/RoomListPage';
import { RoomFormPage } from './pages/rooms/RoomFormPage';
import { BookRoomPage } from './pages/rooms/BookRoomPage';
import { BookingsPage } from './pages/bookings/BookingsPage';
import { BookingsAllPage } from './pages/bookings/BookingsAllPage';
import { BookingEditPage } from './pages/bookings/BookingEditPage';
import { AssetListPage } from './pages/assets/AssetListPage';
import { AssetFormPage } from './pages/assets/AssetFormPage';
import { AssetCategoriesPage } from './pages/assets/AssetCategoriesPage';
import { AssignAssetPage } from './pages/assets/AssignAssetPage';
import { AllocatedAssetsPage } from './pages/assets/AllocatedAssetsPage';
import { ReturnsPage } from './pages/assets/ReturnsPage';
import { MaintenanceRequestsPage } from './pages/assets/MaintenanceRequestsPage';
import { RepairHistoryPage } from './pages/assets/RepairHistoryPage';
import { TicketListPage } from './pages/tickets/TicketListPage';
import { TicketsOverviewPage } from './pages/tickets/TicketsOverviewPage';
import { TicketReportsPage } from './pages/tickets/TicketReportsPage';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { TicketCategoriesPage } from './pages/tickets/TicketCategoriesPage';
import { ReportVolumePage } from './pages/tickets/ReportVolumePage';
import { ReportResolutionTimePage } from './pages/tickets/ReportResolutionTimePage';
import { ExpenseDashboardPage } from './pages/expenses/ExpenseDashboardPage';
import { ExpenseTypesPage } from './pages/expenses/ExpenseTypesPage';
import { ExpenseRequestsPage } from './pages/expenses/ExpenseRequestsPage';
import { ExpenseClaimDetailPage } from './pages/expenses/ExpenseClaimDetailPage';
import { NewExpenseClaimPage } from './pages/expenses/NewExpenseClaimPage';
import { ExpenseReportPage } from './pages/expenses/ExpenseReportPage';
import { AllAnnouncementsPage } from './pages/announcements/AllAnnouncementsPage';
import { CreateAnnouncementPage } from './pages/announcements/CreateAnnouncementPage';
import { EditAnnouncementPage } from './pages/announcements/EditAnnouncementPage';
import { AnnouncementViewPage } from './pages/announcements/AnnouncementViewPage';
import { BirthdayAnnouncementsPage } from './pages/announcements/BirthdayAnnouncementsPage';
import { HolidayAnnouncementsPage } from './pages/announcements/HolidayAnnouncementsPage';
import { AssetCollectionPage } from './pages/announcements/AssetCollectionPage';
import { EventsPage } from './pages/announcements/EventsPage';
import { DeadlinesPage } from './pages/announcements/DeadlinesPage';
import { AnnouncementReportsPage } from './pages/announcements/AnnouncementReportsPage';
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
      <Route path="/onboarding/join/:token" element={<OnboardingJoinPage />} />
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
        <Route path="employees/documents" element={<EmployeeDocumentsPage />} />
        <Route path="employees/:id/edit" element={<EmployeeEditPage />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="onboarding" element={<OnboardingListPage />} />
        <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leave" element={<LeaveRedirect />} />
        <Route path="leave/requests" element={<LeaveRequestsPage />} />
        <Route path="leave/pending" element={<PendingApprovalsPage />} />
        <Route path="leave/calendar" element={<LeaveCalendarPage />} />
        <Route path="leave/balance" element={<LeaveBalancePage />} />
        <Route path="leave/policy" element={<LeavePolicyPage />} />
        <Route path="rooms" element={<RoomListPage />} />
        <Route path="rooms/new" element={<RoomFormPage />} />
        <Route path="rooms/book" element={<BookRoomPage />} />
        <Route path="rooms/:id/edit" element={<RoomFormPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/all" element={<BookingsAllPage />} />
        <Route path="bookings/:id/edit" element={<BookingEditPage />} />
        <Route path="assets" element={<AssetListPage />} />
        <Route path="assets/new" element={<AssetFormPage />} />
        <Route path="assets/categories" element={<AssetCategoriesPage />} />
        <Route path="assets/allocations/assign" element={<AssignAssetPage />} />
        <Route path="assets/allocations" element={<AllocatedAssetsPage />} />
        <Route path="assets/returns" element={<ReturnsPage />} />
        <Route path="assets/maintenance" element={<MaintenanceRequestsPage />} />
        <Route path="assets/maintenance/history" element={<RepairHistoryPage />} />
        <Route path="assets/:id/edit" element={<AssetFormPage />} />
        <Route path="tickets" element={<TicketsOverviewPage />} />
        <Route path="tickets/all" element={<TicketListPage />} />
        <Route path="tickets/my" element={<TicketListPage myTickets />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/categories" element={<TicketCategoriesPage />} />
        <Route path="tickets/reports" element={<TicketReportsPage />} />
        <Route path="tickets/reports/volume" element={<ReportVolumePage />} />
        <Route path="tickets/reports/resolution-time" element={<ReportResolutionTimePage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="expenses" element={<ExpenseDashboardPage />} />
        <Route path="expenses/types" element={<ExpenseTypesPage />} />
        <Route path="expenses/requests/pending" element={<ExpenseRequestsPage />} />
        <Route path="expenses/requests/approved" element={<ExpenseRequestsPage />} />
        <Route path="expenses/requests/paid" element={<ExpenseRequestsPage />} />
        <Route path="expenses/requests/rejected" element={<ExpenseRequestsPage />} />
        <Route path="expenses/claims/:id" element={<ExpenseClaimDetailPage />} />
        <Route path="expenses/new" element={<NewExpenseClaimPage />} />
        <Route path="expenses/reports" element={<ExpenseReportPage />} />
        <Route path="announcements" element={<AllAnnouncementsPage />} />
        <Route path="announcements/new" element={<CreateAnnouncementPage />} />
        <Route path="announcements/birthdays" element={<BirthdayAnnouncementsPage />} />
        <Route path="announcements/holidays" element={<HolidayAnnouncementsPage />} />
        <Route path="announcements/asset-collection" element={<AssetCollectionPage />} />
        <Route path="announcements/events" element={<EventsPage />} />
        <Route path="announcements/deadlines" element={<DeadlinesPage />} />
        <Route path="announcements/reports" element={<AnnouncementReportsPage />} />
        <Route path="announcements/view/:id" element={<AnnouncementViewPage />} />
        <Route path="announcements/edit/:id" element={<EditAnnouncementPage />} />
        <Route path="payroll" element={<PayrollRedirect />} />
        <Route path="payroll/runs" element={<PayrollListPage />} />
        <Route path="payroll/salary-structure" element={<SalaryStructurePage />} />
        <Route path="payroll/generate" element={<GeneratePayrollPage />} />
        <Route path="payroll/my-payslips" element={<MyPayslipsPage />} />
        <Route path="payroll/payslip/:id" element={<PayslipViewPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="settings/permissions" element={<PermissionsPage />} />
        <Route path="settings/api-access" element={<ApiManager />} />
        <Route path="settings/system-logs" element={<SystemLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
