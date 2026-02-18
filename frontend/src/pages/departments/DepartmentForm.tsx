import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

type DeptPayload = { name: string; description?: string; headId?: string; parentId?: number | null; isActive?: boolean };
type DeptItem = { id: number; name: string; description: string | null; parentId: number | null; isActive: boolean };

export function DepartmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id && id !== 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const { data: existing } = useQuery({
    queryKey: ['departments', id],
    queryFn: () => api.get<{ success: true; data: DeptItem }>(`/departments/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  const { data: list } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<{ success: true; data: DeptItem[] }>('/departments').then((r) => r.data),
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? '');
      setParentId(existing.parentId ?? '');
      setIsActive(existing.isActive);
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (body: DeptPayload) => api.post<{ success: true; data: { id: number } }>('/departments', body).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Department created');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      navigate(`/departments/${data.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: DeptPayload) => api.put<{ success: true; data: unknown }>(`/departments/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Department updated');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', id] });
      navigate(`/departments/${id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const departments = list ?? [];
  const parentOptions = isEdit ? departments.filter((d) => d.id !== Number(id)) : departments;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }
    const payload: DeptPayload = {
      name: trimmed,
      description: description.trim() || undefined,
      parentId: parentId === '' ? null : Number(parentId),
      isActive,
    };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <Link
        to={isEdit ? `/departments/${id}` : '/departments'}
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isEdit ? 'Back to department' : 'Departments'}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">
        {isEdit ? 'Edit Department' : 'Add Department'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          />
        </div>
        <div>
          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
            Parent department
          </label>
          <select
            id="parentId"
            value={parentId === '' ? '' : parentId}
            onChange={(e) => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
          >
            <option value="">None</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 dark:border-dark-border"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-dark-textSecondary">
            Active
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/departments/${id}` : '/departments')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
