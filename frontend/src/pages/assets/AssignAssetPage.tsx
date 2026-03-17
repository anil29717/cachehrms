import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';
import { api } from '../../api/client';

type Asset = { id: string; name: string; serialNumber: string | null; status: string; categoryName: string };
type Employee = { employeeCode: string; firstName: string; lastName: string };

const CONDITIONS = ['good', 'fair', 'poor'];

export function AssignAssetPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [conditionAtAssignment, setConditionAtAssignment] = useState('');
  const [notes, setNotes] = useState('');

  const { data: assets } = useQuery({
    queryKey: ['assets-available'],
    queryFn: () => api.get<{ success: true; data: Asset[] }>('/assets', { status: 'available' }).then((r) => r.data),
  });
  const availableAssets = (assets ?? []).filter((a) => a.status === 'available');

  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: { employeeCode: string; firstName: string; lastName: string }[] }>('/employees', { limit: '500' }).then((r) => r.data),
  });
  const employeeList = employees ?? [];

  const assignMutation = useMutation({
    mutationFn: (body: { assetId: string; employeeId: string; conditionAtAssignment?: string; notes?: string }) =>
      api.post<{ success: true; data: unknown }>('/asset-allocations/assign', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-allocations'] });
      toast.success('Asset assigned');
      navigate('/assets/allocations');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId || !employeeId) {
      toast.error('Select asset and employee');
      return;
    }
    assignMutation.mutate({
      assetId,
      employeeId,
      conditionAtAssignment: conditionAtAssignment || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <UserPlus className="w-6 h-6" />
        Assign Asset
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Asset *</label>
          <select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">Select asset</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.name} {a.serialNumber ? `(${a.serialNumber})` : ''}</option>
            ))}
          </select>
          {availableAssets.length === 0 && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">No available assets. Add assets or return allocated ones.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Assign to employee *</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">Select employee</option>
            {employeeList.map((e: Employee) => (
              <option key={e.employeeCode} value={e.employeeCode}>{e.employeeCode} – {e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Condition at assignment</label>
          <select
            value={conditionAtAssignment}
            onChange={(e) => setConditionAtAssignment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">—</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={assignMutation.isPending || availableAssets.length === 0}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            Assign
          </button>
          <button type="button" onClick={() => navigate('/assets/allocations')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
