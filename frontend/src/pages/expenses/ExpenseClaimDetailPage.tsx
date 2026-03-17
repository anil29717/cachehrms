import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { expenseClaimsApi } from '../../api/expenses';
import { useAuthStore } from '../../stores/authStore';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  finance_approved: 'Finance Approved',
  hr_approved: 'HR Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function ExpenseClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const isHR = roleName === 'super_admin' || roleName === 'hr_admin';

  const { data: claim, isLoading } = useQuery({
    queryKey: ['expense-claim', id],
    queryFn: () => expenseClaimsApi.getById(id!),
    enabled: !!id,
  });

  const approveManager = useMutation({
    mutationFn: () => expenseClaimsApi.approveManager(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('Manager approved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const approveFinance = useMutation({
    mutationFn: () => expenseClaimsApi.approveFinance(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('Finance approved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const approveHr = useMutation({
    mutationFn: () => expenseClaimsApi.approveHr(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('HR approved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const markPaid = useMutation({
    mutationFn: () => expenseClaimsApi.markPaid(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('Marked as paid');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: (reason: string) => expenseClaimsApi.reject(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claim', id] });
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('Claim rejected');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) return <p className="text-gray-500">Invalid claim ID</p>;
  if (isLoading || !claim) {
    return <p className="text-gray-500">Loading…</p>;
  }

  const canApproveManager = claim.status === 'pending' && isHR;
  const canApproveFinance = claim.status === 'manager_approved' && isHR;
  const canApproveHr = claim.status === 'finance_approved' && claim.totalAmount >= 15000 && isHR;
  const canMarkPaid =
    isHR &&
    ((claim.status === 'manager_approved' && claim.totalAmount < 5000) ||
      (claim.status === 'finance_approved' && claim.totalAmount < 15000) ||
      claim.status === 'hr_approved');
  const canReject =
    claim.status !== 'paid' && claim.status !== 'rejected' && isHR;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/expenses/requests/pending"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-dark-textSecondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
          Expense claim
        </h1>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
              {claim.employeeName ?? claim.employeeId} · {new Date(claim.createdAt).toLocaleString()}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text">
              ₹{claim.totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <span className={statusClass(claim.status)}>
            {STATUS_LABELS[claim.status] ?? claim.status}
          </span>
        </div>
        {claim.rejectReason && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-dark-border">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Rejection reason</p>
            <p className="text-sm text-red-700 dark:text-red-300">{claim.rejectReason}</p>
          </div>
        )}
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-textSecondary mb-2">
            Line items
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {claim.items.map((i) => (
                <tr key={i.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                  <td className="py-2 pr-4">{i.expenseTypeName ?? i.expenseTypeId}</td>
                  <td className="py-2 pr-4">{i.expenseDate}</td>
                  <td className="py-2 pr-4 font-medium">₹{i.amount.toLocaleString('en-IN')}</td>
                  <td className="py-2">{i.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isHR && (canApproveManager || canApproveFinance || canApproveHr || canMarkPaid || canReject) && (
          <div className="p-4 border-t border-gray-200 dark:border-dark-border flex flex-wrap gap-2">
            {canApproveManager && (
              <button
                type="button"
                onClick={() => approveManager.mutate()}
                disabled={approveManager.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve (Manager)
              </button>
            )}
            {canApproveFinance && (
              <button
                type="button"
                onClick={() => approveFinance.mutate()}
                disabled={approveFinance.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve (Finance)
              </button>
            )}
            {canApproveHr && (
              <button
                type="button"
                onClick={() => approveHr.mutate()}
                disabled={approveHr.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Approve (HR)
              </button>
            )}
            {canMarkPaid && (
              <button
                type="button"
                onClick={() => markPaid.mutate()}
                disabled={markPaid.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                Mark paid
              </button>
            )}
            {canReject && (
              <button
                type="button"
                onClick={() => {
                  const reason = window.prompt('Rejection reason (optional):');
                  reject.mutate(reason ?? '');
                }}
                disabled={reject.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-600 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function statusClass(s: string): string {
  const base = 'inline-flex px-2 py-0.5 rounded text-xs font-medium ';
  if (s === 'pending') return base + 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s === 'rejected') return base + 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (s === 'paid') return base + 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  return base + 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
}
