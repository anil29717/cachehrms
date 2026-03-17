import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
};

export function PendingApprovalsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roleName ?? '';
  const canApprove = roleName === 'manager' || roleName === 'hr_admin' || roleName === 'super_admin';

  const [pendingDeptId, setPendingDeptId] = useState('');
  const [approveRemarks, setApproveRemarks] = useState<Record<string, string>>({});

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

  if (!canApprove) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Pending Approvals</h1>
        <p className="text-gray-600 dark:text-dark-textSecondary">You do not have permission to approve leave requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Pending Approvals</h1>

      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
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
        </div>
        <div className="p-4">
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
      </section>
    </div>
  );
}
