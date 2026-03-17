import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Wallet, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';
import { canAccessLeaveManagement } from '../../utils/permissions';

type MyBalance = {
  leaveType: string;
  year: number;
  openingBalance: number;
  credited: number;
  taken: number;
  closingBalance: number;
  lastUpdated: string;
};

type AllBalanceRow = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  leaveType: string;
  year: number;
  openingBalance: number;
  credited: number;
  taken: number;
  closingBalance: number;
  lastUpdated: string;
};

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'comp_off'];

export function LeaveBalancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canAccessLeaveManagement(user?.roleName);

  const [balanceYear, setBalanceYear] = useState(new Date().getFullYear());
  const [showUpsert, setShowUpsert] = useState(false);
  const [upsertEmployeeId, setUpsertEmployeeId] = useState('');
  const [upsertLeaveType, setUpsertLeaveType] = useState('casual');
  const [upsertYear, setUpsertYear] = useState(new Date().getFullYear());
  const [upsertOpening, setUpsertOpening] = useState('');
  const [upsertCredited, setUpsertCredited] = useState('');
  const [allYear, setAllYear] = useState(new Date().getFullYear());
  const [showAll, setShowAll] = useState(false);

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances', balanceYear],
    queryFn: () =>
      api
        .get<{ success: true; data: MyBalance[] }>('/leave/balances', { year: String(balanceYear) })
        .then((r) => r.data),
  });
  const balanceList = balances ?? [];

  const { data: allBalances, isLoading: allBalancesLoading } = useQuery({
    queryKey: ['leave-balances-all', allYear],
    queryFn: () =>
      api
        .get<{ success: true; data: AllBalanceRow[] }>('/leave/balances/all', { year: String(allYear) })
        .then((r) => r.data),
    enabled: isSuperAdmin && showAll,
  });
  const allList = allBalances ?? [];

  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: { employeeCode: string; firstName: string; lastName: string }[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: isSuperAdmin && showUpsert,
  });
  const employeeList = employees ?? [];

  const upsertMutation = useMutation({
    mutationFn: (body: { employeeId: string; leaveType: string; year: number; openingBalance: number; credited?: number }) =>
      api.post<{ success: true; data: AllBalanceRow; message: string }>('/leave/balances/upsert', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances-all'] });
      setShowUpsert(false);
      setUpsertEmployeeId('');
      setUpsertOpening('');
      setUpsertCredited('');
      toast.success('Balance updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleUpsert() {
    const opening = parseFloat(upsertOpening);
    if (!upsertEmployeeId || Number.isNaN(opening) || opening < 0) {
      toast.error('Employee and opening balance (≥ 0) are required');
      return;
    }
    const credited = upsertCredited === '' ? undefined : parseFloat(upsertCredited);
    if (credited !== undefined && (Number.isNaN(credited) || credited < 0)) {
      toast.error('Credited must be a non-negative number');
      return;
    }
    upsertMutation.mutate({
      employeeId: upsertEmployeeId,
      leaveType: upsertLeaveType,
      year: upsertYear,
      openingBalance: opening,
      credited,
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Leave Balance</h1>

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

      {/* All balances + Set balance (super_admin) */}
      {isSuperAdmin && (
        <>
          <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
              <span className="font-semibold text-gray-900 dark:text-dark-text">All balances</span>
              {showAll ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showAll && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Year</label>
                  <select
                    value={allYear}
                    onChange={(e) => setAllYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  >
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {allBalancesLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
                {!allBalancesLoading && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                          <th className="py-2 px-4">Employee</th>
                          <th className="py-2 px-4">Code</th>
                          <th className="py-2 px-4">Type</th>
                          <th className="py-2 px-4">Year</th>
                          <th className="py-2 px-4">Opening</th>
                          <th className="py-2 px-4">Credited</th>
                          <th className="py-2 px-4">Taken</th>
                          <th className="py-2 px-4">Closing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allList.map((b) => (
                          <tr key={b.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                            <td className="py-2 px-4">{b.employeeName}</td>
                            <td className="py-2 px-4">{b.employeeCode}</td>
                            <td className="py-2 px-4 capitalize">{b.leaveType.replace('_', ' ')}</td>
                            <td className="py-2 px-4">{b.year}</td>
                            <td className="py-2 px-4">{b.openingBalance}</td>
                            <td className="py-2 px-4">{b.credited}</td>
                            <td className="py-2 px-4">{b.taken}</td>
                            <td className="py-2 px-4 font-medium">{b.closingBalance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allList.length === 0 && (
                      <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No balance records.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowUpsert(!showUpsert)}
              className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
                <Plus className="w-5 h-5" />
                Set / update balance
              </span>
              {showUpsert ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showUpsert && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Employee</label>
                    <select
                      value={upsertEmployeeId}
                      onChange={(e) => setUpsertEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    >
                      <option value="">Select employee</option>
                      {employeeList.map((emp: { employeeCode: string; firstName: string; lastName: string }) => (
                        <option key={emp.employeeCode} value={emp.employeeCode}>
                          {emp.employeeCode} – {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Leave type</label>
                    <select
                      value={upsertLeaveType}
                      onChange={(e) => setUpsertLeaveType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    >
                      {LEAVE_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Year</label>
                    <input
                      type="number"
                      min={new Date().getFullYear() - 1}
                      max={new Date().getFullYear() + 1}
                      value={upsertYear}
                      onChange={(e) => setUpsertYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Opening balance *</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={upsertOpening}
                      onChange={(e) => setUpsertOpening(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Credited (optional)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={upsertCredited}
                      onChange={(e) => setUpsertCredited(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUpsert}
                  disabled={upsertMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
                >
                  Save balance
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
