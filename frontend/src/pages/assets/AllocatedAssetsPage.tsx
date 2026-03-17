import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { List, RotateCcw } from 'lucide-react';
import { api } from '../../api/client';

type Allocation = {
  id: string;
  assetId: string;
  assetName: string;
  categoryName: string;
  serialNumber: string | null;
  employeeId: string;
  employeeName: string;
  assignedAt: string;
  conditionAtAssignment: string | null;
  notes: string | null;
};

export function AllocatedAssetsPage() {
  const queryClient = useQueryClient();

  const { data: allocations, isLoading } = useQuery({
    queryKey: ['asset-allocations'],
    queryFn: () => api.get<{ success: true; data: Allocation[] }>('/asset-allocations').then((r) => r.data),
  });
  const list = allocations ?? [];

  const returnMutation = useMutation({
    mutationFn: (id: string) => api.post<{ success: true }>(`/asset-allocations/${id}/return`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset returned');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <List className="w-6 h-6" />
        Allocated Assets
      </h1>
      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial</th>
                  <th className="py-3 px-4">Assigned to</th>
                  <th className="py-3 px-4">Assigned at</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-4 font-medium">{a.assetName}</td>
                    <td className="py-3 px-4">{a.categoryName}</td>
                    <td className="py-3 px-4">{a.serialNumber ?? '—'}</td>
                    <td className="py-3 px-4">{a.employeeName}</td>
                    <td className="py-3 px-4">{new Date(a.assignedAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => { if (window.confirm(`Return "${a.assetName}" from ${a.employeeName}?`)) returnMutation.mutate(a.id); }}
                        disabled={returnMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No assets currently allocated.</p>
          )}
        </div>
      )}
    </div>
  );
}
