import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FolderOpen, Plus } from 'lucide-react';
import { api } from '../../api/client';

type Category = { id: number; name: string; description: string | null; createdAt: string };

export function TicketCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => api.get<{ success: true; data: Category[] }>('/ticket-categories').then((r) => r.data),
  });
  const list = categories ?? [];

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      api.post<{ success: true; data: Category }>('/ticket-categories', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      setShowForm(false);
      setName('');
      setDescription('');
      toast.success('Category created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Ticket Categories
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              placeholder="e.g. IT Support"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            Create
          </button>
        </form>
      )}

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-dark-textSecondary">{c.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No categories yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
