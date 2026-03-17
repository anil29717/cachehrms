import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Plus, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';
import { canAccessLeaveManagement, isHR } from '../../utils/permissions';

type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName?: string;
  designation?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  approverRemarks: string | null;
  createdAt: string;
};

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick' },
  { value: 'casual', label: 'Casual' },
  { value: 'earned', label: 'Earned' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'comp_off', label: 'Comp-off' },
];

type EmployeeOption = { id: string; employeeCode: string; firstName: string; lastName: string; email: string };

export function LeaveRequestsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canAccessLeaveManagement(user?.roleName);
  const canApplyOnBehalf = isHR(user?.roleName);

  const [showApply, setShowApply] = useState(false);
  const [applyType, setApplyType] = useState('casual');
  const [applyStart, setApplyStart] = useState('');
  const [applyEnd, setApplyEnd] = useState('');
  const [applyDays, setApplyDays] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [applyEmployeeId, setApplyEmployeeId] = useState<string>('');
  const [allFilters, setAllFilters] = useState({ status: '', employeeId: '', from: '', to: '' });
  const [showAll, setShowAll] = useState(false);

  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () =>
      api.get<{ success: true; data: LeaveRequest[] }>('/leave/requests').then((r) => r.data),
  });
  const requests = myRequests ?? [];

  const { data: employeesList } = useQuery({
    queryKey: ['employees-list', 'leave-apply'],
    queryFn: () =>
      api.get<{ success: true; data: EmployeeOption[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: canApplyOnBehalf && showApply,
  });
  const allEmployees = employeesList ?? [];
  const employeeOptions =
    user?.roleName === 'super_admin'
      ? allEmployees.filter((emp) => emp.employeeCode !== user.employeeId)
      : allEmployees;

  const allParams: Record<string, string> = {};
  if (allFilters.status) allParams.status = allFilters.status;
  if (allFilters.employeeId) allParams.employeeId = allFilters.employeeId;
  if (allFilters.from) allParams.from = allFilters.from;
  if (allFilters.to) allParams.to = allFilters.to;
  const { data: allRequests, isLoading: allLoading } = useQuery({
    queryKey: ['leave-requests-all', allFilters],
    queryFn: () =>
      api.get<{ success: true; data: LeaveRequest[] }>('/leave/requests/all', allParams).then((r) => r.data),
    enabled: isSuperAdmin && showAll,
  });
  const allList = allRequests ?? [];

  const applyMutation = useMutation({
    mutationFn: (body: { leaveType: string; startDate: string; endDate: string; totalDays?: number; reason?: string; employeeId?: string }) =>
      api.post<{ success: true; data: LeaveRequest; message: string }>('/leave/apply', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests-all'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setShowApply(false);
      setApplyStart('');
      setApplyEnd('');
      setApplyDays('');
      setApplyReason('');
      setApplyEmployeeId('');
      toast.success('Leave applied successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: true; data: { id: string; status: string }; message: string }>(`/leave/requests/${id}/cancel`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests-all'] });
      queryClient.invalidateQueries({ queryKey: ['leave-pending'] });
      toast.success('Leave request cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleApply() {
    if (!applyStart || !applyEnd) {
      toast.error('Select start and end date');
      return;
    }
    if (user?.roleName === 'super_admin' && !applyEmployeeId) {
      toast.error('Please select an employee to apply leave for');
      return;
    }
    const start = new Date(applyStart);
    const end = new Date(applyEnd);
    if (end < start) {
      toast.error('End date must be on or after start date');
      return;
    }
    const maxDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const totalDays = applyDays ? parseFloat(applyDays) : maxDays;
    if (totalDays <= 0 || totalDays > maxDays) {
      toast.error(`Total days must be between 0.5 and ${maxDays}`);
      return;
    }
    applyMutation.mutate({
      leaveType: applyType,
      startDate: applyStart,
      endDate: applyEnd,
      totalDays,
      reason: applyReason || undefined,
      ...(applyEmployeeId && { employeeId: applyEmployeeId }),
    });
  }

  function renderRequestRow(r: LeaveRequest, showCancel: boolean) {
    return (
      <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
        {isSuperAdmin && showAll && (
          <td className="py-3 px-4 text-gray-700 dark:text-dark-textSecondary">{r.employeeName ?? r.employeeId}</td>
        )}
        <td className="py-3 px-4 capitalize">{r.leaveType.replace('_', ' ')}</td>
        <td className="py-3 px-4">{r.startDate}</td>
        <td className="py-3 px-4">{r.endDate}</td>
        <td className="py-3 px-4">{r.totalDays}</td>
        <td className="py-3 px-4">
          <span
            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
              r.status === 'approved'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : r.status === 'rejected'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : r.status === 'pending'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {r.status}
          </span>
        </td>
        <td className="py-3 px-4">
          {r.status === 'pending' && showCancel && (
            <button
              type="button"
              onClick={() => cancelMutation.mutate(r.id)}
              disabled={cancelMutation.isPending}
              className="text-red-600 dark:text-red-400 hover:underline text-xs"
            >
              Cancel
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Leave Requests</h1>

      {/* Apply leave */}
      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowApply(!showApply)}
          className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
        >
          <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <Plus className="w-5 h-5" />
            Apply for leave
          </span>
          {showApply ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showApply && (
          <div className="p-4 space-y-3">
            {canApplyOnBehalf && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                  {user?.roleName === 'super_admin'
                    ? 'Employee (required)'
                    : 'Employee (optional — leave empty to apply for yourself)'}
                </label>
                <select
                  value={applyEmployeeId}
                  onChange={(e) => setApplyEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  required={user?.roleName === 'super_admin'}
                >
                  <option value="">
                    {user?.roleName === 'super_admin' ? 'Select employee…' : 'Myself'}
                  </option>
                  {employeeOptions.map((emp) => (
                    <option key={emp.id} value={emp.employeeCode}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Leave type</label>
                <select
                  value={applyType}
                  onChange={(e) => setApplyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Start date</label>
                <input
                  type="date"
                  value={applyStart}
                  onChange={(e) => setApplyStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">End date</label>
                <input
                  type="date"
                  value={applyEnd}
                  onChange={(e) => setApplyEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Total days (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2 or 0.5 for half"
                  value={applyDays}
                  onChange={(e) => setApplyDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Reason (optional)</label>
              <textarea
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                placeholder="Reason for leave"
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
            >
              Submit request
            </button>
          </div>
        )}
      </section>

      {/* My requests */}
      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <List className="w-5 h-5" />
            My leave requests
          </h2>
        </div>
        <div className="overflow-x-auto">
          {requestsLoading && <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
          {!requestsLoading && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Start</th>
                  <th className="py-3 px-4">End</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => renderRequestRow(r, true))}
              </tbody>
            </table>
          )}
          {!requestsLoading && requests.length === 0 && (
            <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">No leave requests yet.</p>
          )}
        </div>
      </section>

      {/* All requests (super_admin) */}
      {isSuperAdmin && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="font-semibold text-gray-900 dark:text-dark-text">All leave requests</span>
            {showAll ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showAll && (
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={allFilters.status}
                  onChange={(e) => setAllFilters((f) => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="text"
                  placeholder="Employee code"
                  value={allFilters.employeeId}
                  onChange={(e) => setAllFilters((f) => ({ ...f, employeeId: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm w-32"
                />
                <input
                  type="date"
                  placeholder="From"
                  value={allFilters.from}
                  onChange={(e) => setAllFilters((f) => ({ ...f, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={allFilters.to}
                  onChange={(e) => setAllFilters((f) => ({ ...f, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
              {allLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!allLoading && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Start</th>
                        <th className="py-3 px-4">End</th>
                        <th className="py-3 px-4">Days</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 w-0" />
                      </tr>
                    </thead>
                    <tbody>
                      {allList.map((r) => renderRequestRow(r, false))}
                    </tbody>
                  </table>
                  {allList.length === 0 && (
                    <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">No requests match filters.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
