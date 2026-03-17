import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Receipt, PlusCircle, Trash2 } from 'lucide-react';
import { expenseTypesApi, expenseClaimsApi } from '../../api/expenses';

type LineItem = {
  expenseTypeId: number;
  expenseTypeName: string;
  amount: number;
  quantity: number | null;
  description: string;
  expenseDate: string;
};

const today = new Date().toISOString().slice(0, 10);

export function NewExpenseClaimPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LineItem[]>([
    {
      expenseTypeId: 0,
      expenseTypeName: '',
      amount: 0,
      quantity: null,
      description: '',
      expenseDate: today,
    },
  ]);

  const { data: types = [] } = useQuery({
    queryKey: ['expense-types'],
    queryFn: () => expenseTypesApi.list({ isActive: 'true' }),
  });
  const activeTypes = types.filter((t) => t.isActive);

  const createMutation = useMutation({
    mutationFn: (body: {
      items: Array<{
        expenseTypeId: number;
        amount: number;
        quantity?: number | null;
        description?: string | null;
        expenseDate: string;
      }>;
    }) => expenseClaimsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] });
      queryClient.invalidateQueries({ queryKey: ['expense-report'] });
      toast.success('Claim submitted');
      navigate('/expenses');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      {
        expenseTypeId: 0,
        expenseTypeName: '',
        amount: 0,
        quantity: null,
        description: '',
        expenseDate: today,
      },
    ]);
  };

  const updateLine = (index: number, updates: Partial<LineItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      if (updates.expenseTypeId !== undefined) {
        const t = activeTypes.find((x) => x.id === updates.expenseTypeId);
        next[index] = {
          ...current,
          ...updates,
          expenseTypeName: t ? t.name : '',
        };
      } else {
        next[index] = { ...current, ...updates };
      }
      return next;
    });
  };

  const removeLine = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);

  const submit = () => {
    const valid = items.filter(
      (i) => i.expenseTypeId > 0 && i.amount > 0 && i.expenseDate
    );
    if (valid.length === 0) {
      toast.error('Add at least one item with type, amount and date');
      return;
    }
    createMutation.mutate({
      items: valid.map((i) => ({
        expenseTypeId: i.expenseTypeId,
        amount: i.amount,
        quantity: i.quantity,
        description: i.description.trim() || undefined,
        expenseDate: i.expenseDate,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <Receipt className="w-6 h-6" />
        New expense claim
      </h1>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Line items</h2>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-border"
          >
            <PlusCircle className="w-4 h-4" />
            Add line
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-0" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                  <td className="py-3 px-4">
                    <select
                      value={item.expenseTypeId || ''}
                      onChange={(e) =>
                        updateLine(index, {
                          expenseTypeId: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full min-w-[140px] px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    >
                      <option value="">Select type</option>
                      {activeTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (₹{t.limitAmount.toLocaleString()}
                          {t.limitUnit ? `/${t.limitUnit}` : ''})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="date"
                      value={item.expenseDate}
                      onChange={(e) => updateLine(index, { expenseDate: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLine(index, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-28 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLine(index, { description: e.target.value })}
                      placeholder="Notes"
                      className="w-full min-w-[120px] px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={items.length <= 1}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:pointer-events-none"
                      aria-label="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-dark-border flex justify-between items-center">
          <span className="font-semibold text-gray-900 dark:text-dark-text">
            Total: ₹{total.toLocaleString('en-IN')}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={createMutation.isPending || total <= 0}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting…' : 'Submit claim'}
          </button>
        </div>
      </div>
    </div>
  );
}
