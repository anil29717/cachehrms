import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { api } from '../../api/client';

type Request = {
  id: string;
  assetId: string;
  assetName: string;
  categoryName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  description: string;
  status: string;
  completedAt: string | null;
  cost: number | null;
  repairNotes: string | null;
  createdAt: string;
};

export function RepairHistoryPage() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['maintenance-requests-history'],
    queryFn: () => api.get<{ success: true; data: Request[] }>('/maintenance-requests', { status: 'completed' }).then((r) => r.data),
  });
  const list = requests ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <History className="w-6 h-6" />
        Repair History
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary text-sm">Completed maintenance and repair records.</p>
      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Requested by</th>
                  <th className="py-3 px-4">Requested at</th>
                  <th className="py-3 px-4">Completed at</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Repair notes</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-4 font-medium">{r.assetName}</td>
                    <td className="py-3 px-4">{r.categoryName}</td>
                    <td className="py-3 px-4">{r.requestedByName}</td>
                    <td className="py-3 px-4">{new Date(r.requestedAt).toLocaleString()}</td>
                    <td className="py-3 px-4">{r.completedAt ? new Date(r.completedAt).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4">{r.cost != null ? `₹${r.cost}` : '—'}</td>
                    <td className="py-3 px-4 max-w-[200px]" title={r.repairNotes ?? ''}>{r.repairNotes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No completed repairs yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
