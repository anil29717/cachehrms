import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { List, Pencil, PlusCircle } from 'lucide-react';
import { expenseTypesApi, type ExpenseTypeDto } from '../../api/expenses';

const CATEGORY_LABELS: Record<string, string> = {
  travel: 'Travel',
  food: 'Food',
  accommodation: 'Accommodation',
  office: 'Office',
  learning: 'Learning',
  medical: 'Medical',
  relocation: 'Relocation',
};

const UNIT_LABELS: Record<string, string> = {
  day: '/day',
  km: '/km',
  meal: '/meal',
  person: '/person',
  month: '/month',
  year: '/year',
};

export function ExpenseTypesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ limitAmount: number; isActive: boolean } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    category: 'travel',
    name: '',
    limitAmount: 0,
    limitUnit: '',
  });

  const { data: types, isLoading } = useQuery({
    queryKey: ['expense-types'],
    queryFn: () => expenseTypesApi.list({}),
  });
  const list = types ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { limitAmount?: number; isActive?: boolean } }) =>
      expenseTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      setEditingId(null);
      setEditForm(null);
      toast.success('Expense type updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (body: { category: string; name: string; limitAmount: number; limitUnit?: string | null }) =>
      expenseTypesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-types'] });
      setShowAdd(false);
      setAddForm({ category: 'travel', name: '', limitAmount: 0, limitUnit: '' });
      toast.success('Expense type created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (t: ExpenseTypeDto) => {
    setEditingId(t.id);
    setEditForm({ limitAmount: t.limitAmount, isActive: t.isActive });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editingId == null || !editForm) return;
    updateMutation.mutate({
      id: editingId,
      data: { limitAmount: editForm.limitAmount, isActive: editForm.isActive },
    });
  };

  const submitAdd = () => {
    if (!addForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    createMutation.mutate({
      category: addForm.category,
      name: addForm.name.trim(),
      limitAmount: addForm.limitAmount,
      limitUnit: addForm.limitUnit.trim() || undefined,
    });
  };

  const byCategory = list.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, ExpenseTypeDto[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <List className="w-6 h-6" />
          Expense Types & Limits
        </h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Add type
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">New expense type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Category</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Flight, Meals"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Limit (₹)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={addForm.limitAmount || ''}
                onChange={(e) => setAddForm((f) => ({ ...f, limitAmount: Number(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Unit (optional)</label>
              <select
                value={addForm.limitUnit}
                onChange={(e) => setAddForm((f) => ({ ...f, limitUnit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              >
                <option value="">One-time</option>
                {Object.entries(UNIT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitAdd}
              className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
              <h2 className="px-4 py-2 bg-gray-50 dark:bg-dark-bg text-sm font-semibold text-gray-700 dark:text-dark-textSecondary">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Limit</th>
                      <th className="py-3 px-4">Active</th>
                      <th className="py-3 px-4 w-0" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                        <td className="py-3 px-4 font-medium">{t.name}</td>
                        <td className="py-3 px-4">
                          ₹{t.limitAmount.toLocaleString('en-IN')}
                          {t.limitUnit && (
                            <span className="text-gray-500 dark:text-dark-textSecondary">
                              {UNIT_LABELS[t.limitUnit] ?? `/${t.limitUnit}`}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingId === t.id && editForm ? (
                            <select
                              value={editForm.isActive ? '1' : '0'}
                              onChange={(e) => setEditForm((f) => f && { ...f, isActive: e.target.value === '1' })}
                              className="px-2 py-1 border border-gray-300 dark:border-dark-border rounded text-sm"
                            >
                              <option value="1">Yes</option>
                              <option value="0">No</option>
                            </select>
                          ) : (
                            <span className={t.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                              {t.isActive ? 'Yes' : 'No'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingId === t.id && editForm ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={editForm.limitAmount}
                                onChange={(e) => setEditForm((f) => f && { ...f, limitAmount: Number(e.target.value) || 0 })}
                                className="w-24 px-2 py-1 border border-gray-300 dark:border-dark-border rounded text-sm"
                              />
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="text-green-600 dark:text-green-400 text-xs font-medium hover:underline"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="text-gray-500 text-xs hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(t)}
                              className="inline-flex items-center gap-1 text-light-primary dark:text-dark-primary text-xs font-medium hover:underline"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {list.length === 0 && !showAdd && (
            <p className="text-gray-500 dark:text-dark-textSecondary text-center py-8">
              No expense types defined. Add one to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
