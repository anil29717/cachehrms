import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PlusCircle } from 'lucide-react';
import { api } from '../../api/client';

type Category = { id: number; name: string };
type EmployeeOption = { employeeCode: string; firstName: string; lastName: string };

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function CreateTicketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [regardingEmployeeCode, setRegardingEmployeeCode] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  const { data: categories } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: () => api.get<{ success: true; data: Category[] }>('/ticket-categories').then((r) => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: EmployeeOption[] }>('/employees', { limit: '500' }).then((r) => r.data),
  });
  const categoryList = categories ?? [];
  const employeeList = employees ?? [];

  const createMutation = useMutation({
    mutationFn: (body: { categoryId?: number; subject: string; description: string; priority: string; regardingEmployeeCode?: string }) =>
      api.post<{ success: true; data: { id: string }; message: string }>('/tickets', body).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
      navigate(`/tickets/${data.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    const cId = categoryId ? parseInt(categoryId, 10) : undefined;
    createMutation.mutate({
      categoryId: cId,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      regardingEmployeeCode: regardingEmployeeCode.trim() || undefined,
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <PlusCircle className="w-6 h-6" />
        Create New Ticket
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">—</option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Regarding employee</label>
          <select
            value={regardingEmployeeCode}
            onChange={(e) => setRegardingEmployeeCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            <option value="">— Select employee this ticket is about (optional) —</option>
            {employeeList.map((e) => (
              <option key={e.employeeCode} value={e.employeeCode}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="Brief summary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="Describe the issue or request..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            Create Ticket
          </button>
          <button type="button" onClick={() => navigate('/tickets')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
