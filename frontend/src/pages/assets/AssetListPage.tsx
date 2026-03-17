import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canAccessAssets } from '../../utils/permissions';
import { api } from '../../api/client';

type Asset = {
  id: string;
  categoryId: number;
  categoryName: string;
  name: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  status: string;
  condition: string | null;
  notes: string | null;
  assignedTo: { employeeId: string; employeeName: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  allocated: 'Allocated',
  under_maintenance: 'Under maintenance',
  retired: 'Retired',
};

export function AssetListPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canManage = canAccessAssets(roleName);

  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const params: Record<string, string> = {};
  if (categoryId) params.categoryId = categoryId;
  if (status) params.status = status;
  if (search.trim()) params.search = search.trim();

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => api.get<{ success: true; data: { id: number; name: string }[] }>('/asset-categories').then((r) => r.data),
  });
  const categoryList = categories ?? [];

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', params],
    queryFn: () => api.get<{ success: true; data: Asset[] }>('/assets', params).then((r) => r.data),
  });
  const list = assets ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: true }>(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">View Assets</h1>
        {canManage && (
          <Link
            to="/assets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Package className="w-4 h-4" />
            Add Asset
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All categories</option>
          {categoryList.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search name or serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm w-48"
        />
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Assigned to</th>
                  {canManage && <th className="py-3 px-4 w-0" />}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-4 font-medium">{a.name}</td>
                    <td className="py-3 px-4">{a.categoryName}</td>
                    <td className="py-3 px-4">{a.serialNumber ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        a.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        a.status === 'allocated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        a.status === 'under_maintenance' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">{a.condition ?? '—'}</td>
                    <td className="py-3 px-4">{a.assignedTo?.employeeName ?? '—'}</td>
                    {canManage && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link to={`/assets/${a.id}/edit`} className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {a.status === 'available' && (
                            <button
                              type="button"
                              onClick={() => { if (window.confirm('Delete this asset?')) deleteMutation.mutate(a.id); }}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No assets found.</p>
          )}
        </div>
      )}
    </div>
  );
}
