import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../api/client';

type Category = { id: number; name: string };
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
};

const CONDITIONS = ['good', 'fair', 'poor'];
const STATUSES = ['available', 'allocated', 'under_maintenance', 'retired'];

export function AssetFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [status, setStatus] = useState('available');
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: () => api.get<{ success: true; data: Category[] }>('/asset-categories').then((r) => r.data),
  });
  const categoryList = categories ?? [];

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => api.get<{ success: true; data: Asset }>(`/assets/${id!}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (asset) {
      setCategoryId(String(asset.categoryId));
      setName(asset.name);
      setSerialNumber(asset.serialNumber ?? '');
      setPurchaseDate(asset.purchaseDate ?? '');
      setStatus(asset.status);
      setCondition(asset.condition ?? '');
      setNotes(asset.notes ?? '');
    }
  }, [asset]);

  const createMutation = useMutation({
    mutationFn: (body: { categoryId: number; name: string; serialNumber?: string; purchaseDate?: string; condition?: string; notes?: string }) =>
      api.post<{ success: true; data: Asset }>('/assets', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created');
      navigate('/assets');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { name?: string; serialNumber?: string; purchaseDate?: string; status?: string; condition?: string; notes?: string }) =>
      api.put<{ success: true; data: Asset }>(`/assets/${id!}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      toast.success('Asset updated');
      navigate('/assets');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const cId = parseInt(categoryId, 10);
    if (!categoryId || Number.isNaN(cId)) {
      toast.error('Select a category');
      return;
    }
    if (isEdit) {
      updateMutation.mutate({
        name: name.trim(),
        serialNumber: serialNumber.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        status,
        condition: condition || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      createMutation.mutate({
        categoryId: cId,
        name: name.trim(),
        serialNumber: serialNumber.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        condition: condition || undefined,
        notes: notes.trim() || undefined,
      });
    }
  }

  if (isEdit && isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (isEdit && !asset) return <p className="text-red-600 dark:text-red-400">Asset not found.</p>;
  if (!isEdit && categoryList.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Add Asset</h1>
        <p className="text-amber-600 dark:text-amber-400">Create at least one asset category first.</p>
        <a href="/assets/categories" className="mt-2 inline-block text-light-primary dark:text-dark-primary hover:underline">Go to Asset Categories</a>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">{isEdit ? 'Edit Asset' : 'Add Asset'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm disabled:opacity-60"
          >
            <option value="">Select category</option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="e.g. Dell Laptop XPS 15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Serial number</label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Purchase date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            {isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/assets')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
