import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Calendar, Plus, Wallet, List, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type LeaveBalance = {
  leaveType: string;
  year: number;
  openingBalance: number;
  credited: number;
  taken: number;
  closingBalance: number;
  lastUpdated: string;
};

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

export function LeavePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roleName ?? '';
  const canApprove = roleName === 'manager' || roleName === 'hr_admin' || roleName === 'super_admin';

  const [showApply, setShowApply] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [balanceYear, setBalanceYear] = useState(new Date().getFullYear());
  const [applyType, setApplyType] = useState('casual');
  const [applyStart, setApplyStart] = useState('');
  const [applyEnd, setApplyEnd] = useState('');
  const [applyDays, setApplyDays] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [approveRemarks, setApproveRemarks] = useState<Record<string, string>>({});
  const [pendingDeptId, setPendingDeptId] = useState('');

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances', balanceYear],
    queryFn: () =>
      api
        .get<{ success: true; data: LeaveBalance[] }>('/leave/balances', { year: String(balanceYear) })
        .then((r) => r.data),
  });
  const balanceList = balances ?? [];

  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () =>
      api.get<{ success: true; data: LeaveRequest[] }>('/leave/requests').then((r) => r.data),
  });
  const requests = myRequests ?? [];

  const params: Record<string, string> = {};
  if (pendingDeptId) params.departmentId = pendingDeptId;
  const { data: pendingList, isLoading: pendingLoading } = useQuery({
    queryKey: ['leave-pending', pendingDeptId],
    queryFn: () =>
      api.get<{ success: true; data: LeaveRequest[] }>('/leave/pending', params).then((r) => r.data),
    enabled: canApprove,
  });
  const pending = pendingList ?? [];

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      api.get<{ success: true; data: { id: number; name: string }[] }>('/departments').then((r) => r.data),
    enabled: canApprove && roleName !== 'manager',
  });
  const deptList = departments ?? [];

  const applyMutation = useMutation({
    mutationFn: (body: { leaveType: string; startDate: string; endDate: string; totalDays?: number; reason?: string }) =>
      api.post<{ success: true; data: LeaveRequest; message: string }>('/leave/apply', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setShowApply(false);
      setApplyStart('');
      setApplyEnd('');
      setApplyDays('');
      setApplyReason('');
      toast.success('Leave applied successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: true; data: { id: string; status: string }; message: string }>(`/leave/requests/${id}/cancel`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-pending'] });
      toast.success('Leave request cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post<{ success: true; data: LeaveRequest; message: string }>(`/leave/requests/${id}/approve`, { remarks }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-pending'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave approved');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      api.post<{ success: true; data: LeaveRequest; message: string }>(`/leave/requests/${id}/reject`, { remarks }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-pending'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave rejected');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleApply() {
    if (!applyStart || !applyEnd) {
      toast.error('Select start and end date');
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
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Leave</h1>

      {/* My balance */}
      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <Wallet className="w-5 h-5" />
            My balance
          </h2>
          <select
            value={balanceYear}
            onChange={(e) => setBalanceYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="p-4">
          {balancesLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
          {!balancesLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {balanceList.map((b) => (
                <div
                  key={`${b.leaveType}-${b.year}`}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary capitalize">{b.leaveType.replace('_', ' ')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-dark-text">{b.closingBalance}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-textSecondary">days available</p>
                </div>
              ))}
            </div>
          )}
          {!balancesLoading && balanceList.length === 0 && (
            <p className="text-gray-500 dark:text-dark-textSecondary text-sm">No balance records for this year.</p>
          )}
        </div>
      </section>

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
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
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
                      {r.status === 'pending' && (
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
                ))}
              </tbody>
            </table>
          )}
          {!requestsLoading && requests.length === 0 && (
            <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">No leave requests yet.</p>
          )}
        </div>
      </section>

      {/* Pending approvals (Manager / HR) */}
      {canApprove && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPending(!showPending)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
              <Calendar className="w-5 h-5" />
              Pending approvals {pending.length > 0 && `(${pending.length})`}
            </span>
            {showPending ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showPending && (
            <div className="p-4">
              {roleName !== 'manager' && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Filter by department</label>
                  <select
                    value={pendingDeptId}
                    onChange={(e) => setPendingDeptId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  >
                    <option value="">All</option>
                    {deptList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {pendingLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!pendingLoading && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                        <th className="py-2 px-4">Employee</th>
                        <th className="py-2 px-4">Type</th>
                        <th className="py-2 px-4">Start</th>
                        <th className="py-2 px-4">End</th>
                        <th className="py-2 px-4">Days</th>
                        <th className="py-2 px-4">Reason</th>
                        <th className="py-2 px-4 w-0" />
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                          <td className="py-2 px-4 font-medium">{r.employeeName ?? r.employeeId}</td>
                          <td className="py-2 px-4 capitalize">{r.leaveType.replace('_', ' ')}</td>
                          <td className="py-2 px-4">{r.startDate}</td>
                          <td className="py-2 px-4">{r.endDate}</td>
                          <td className="py-2 px-4">{r.totalDays}</td>
                          <td className="py-2 px-4 max-w-[120px] truncate" title={r.reason ?? ''}>{r.reason ?? '—'}</td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Remarks"
                                value={approveRemarks[r.id] ?? ''}
                                onChange={(e) => setApproveRemarks((s) => ({ ...s, [r.id]: e.target.value }))}
                                className="w-24 px-2 py-1 border border-gray-300 dark:border-dark-border rounded text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => approveMutation.mutate({ id: r.id, remarks: approveRemarks[r.id] })}
                                disabled={approveMutation.isPending}
                                className="p-1.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectMutation.mutate({ id: r.id, remarks: approveRemarks[r.id] })}
                                disabled={rejectMutation.isPending}
                                className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pending.length === 0 && (
                    <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No pending leave requests.</p>
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
