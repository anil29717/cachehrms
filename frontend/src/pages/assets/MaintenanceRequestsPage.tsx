import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Wrench, Plus, Pencil } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canAccessAssets } from '../../utils/permissions';
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

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export function MaintenanceRequestsPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const canManage = canAccessAssets(roleName);

  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formAssetId, setFormAssetId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editRepairNotes, setEditRepairNotes] = useState('');

  const params: Record<string, string> = {};
  if (statusFilter) params.status = statusFilter;

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.get<{ success: true; data: { id: string; name: string }[] }>('/assets').then((r) => r.data),
    enabled: showForm,
  });
  const assetList = assets ?? [];

  const { data: requests, isLoading } = useQuery({
    queryKey: ['maintenance-requests', params],
    queryFn: () => api.get<{ success: true; data: Request[] }>('/maintenance-requests', params).then((r) => r.data),
  });
  const list = requests ?? [];

  const createMutation = useMutation({
    mutationFn: (body: { assetId: string; description: string }) =>
      api.post<{ success: true; data: Request }>('/maintenance-requests', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      setShowForm(false);
      setFormAssetId('');
      setFormDescription('');
      toast.success('Service request created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: string; cost?: number; repairNotes?: string } }) =>
      api.put<{ success: true; data: Request }>(`/maintenance-requests/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditingId(null);
      toast.success('Request updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formAssetId || !formDescription.trim()) {
      toast.error('Select asset and enter description');
      return;
    }
    createMutation.mutate({ assetId: formAssetId, description: formDescription.trim() });
  }

  function handleUpdate(id: string) {
    const cost = editCost === '' ? undefined : parseFloat(editCost);
    if (editCost !== '' && (Number.isNaN(cost!) || cost! < 0)) {
      toast.error('Cost must be a non-negative number');
      return;
    }
    updateMutation.mutate({
      id,
      body: {
        ...(editStatus && { status: editStatus }),
        ...(cost !== undefined && { cost: cost ?? 0 }),
        ...(editRepairNotes !== undefined && { repairNotes: editRepairNotes }),
      },
    });
  }

  function openEdit(r: Request) {
    setEditingId(r.id);
    setEditStatus(r.status);
    setEditCost(r.cost != null ? String(r.cost) : '');
    setEditRepairNotes(r.repairNotes ?? '');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Wrench className="w-6 h-6" />
          Service Requests
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New request
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Asset *</label>
            <select
              value={formAssetId}
              onChange={(e) => setFormAssetId(e.target.value)}
              required
              className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">Select asset</option>
              {assetList.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description *</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              required
              className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              placeholder="Describe the issue..."
            />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            Submit request
          </button>
        </form>
      )}

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Requested by</th>
                  <th className="py-3 px-4">Requested at</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Cost</th>
                  {canManage && <th className="py-3 px-4 w-0" />}
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-4 font-medium">{r.assetName}</td>
                    <td className="py-3 px-4">{r.requestedByName}</td>
                    <td className="py-3 px-4">{new Date(r.requestedAt).toLocaleString()}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={r.description}>{r.description}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        r.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        r.status === 'cancelled' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.cost != null ? `₹${r.cost}` : '—'}</td>
                    {canManage && (
                      <td className="py-3 px-4">
                        {editingId === r.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                            <input type="number" min={0} step={0.01} value={editCost} onChange={(e) => setEditCost(e.target.value)} placeholder="Cost" className="w-full px-2 py-1 border rounded text-xs" />
                            <textarea value={editRepairNotes} onChange={(e) => setEditRepairNotes(e.target.value)} placeholder="Repair notes" rows={2} className="w-full px-2 py-1 border rounded text-xs" />
                            <div className="flex gap-1">
                              <button type="button" onClick={() => handleUpdate(r.id)} disabled={updateMutation.isPending} className="px-2 py-1 bg-primary text-white rounded text-xs">Save</button>
                              <button type="button" onClick={() => setEditingId(null)} className="px-2 py-1 border rounded text-xs">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          r.status !== 'completed' && r.status !== 'cancelled' && (
                            <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded text-gray-600 hover:bg-gray-100">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No service requests.</p>
          )}
        </div>
      )}
    </div>
  );
}
