import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FileText, Plus, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';
import { canAccessLeaveManagement } from '../../utils/permissions';

type LeavePolicy = {
  id: number;
  leaveType: string;
  name: string;
  defaultDaysPerYear: number;
  description: string | null;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
};

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'comp_off'];

export function LeavePolicyPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canAccessLeaveManagement(user?.roleName);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLeaveType, setFormLeaveType] = useState('casual');
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPaid, setFormIsPaid] = useState(true);

  const { data: policies, isLoading } = useQuery({
    queryKey: ['leave-policies'],
    queryFn: () =>
      api.get<{ success: true; data: LeavePolicy[] }>('/leave/policies').then((r) => r.data),
  });
  const list = policies ?? [];

  const createMutation = useMutation({
    mutationFn: (body: { leaveType: string; name: string; defaultDaysPerYear: number; description?: string; isPaid?: boolean }) =>
      api.post<{ success: true; data: LeavePolicy; message: string }>('/leave/policies', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies'] });
      setShowForm(false);
      resetForm();
      toast.success('Policy created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name?: string; defaultDaysPerYear?: number; description?: string; isPaid?: boolean } }) =>
      api.put<{ success: true; data: LeavePolicy; message: string }>(`/leave/policies/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-policies'] });
      setEditingId(null);
      resetForm();
      toast.success('Policy updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setFormLeaveType('casual');
    setFormName('');
    setFormDays('');
    setFormDescription('');
    setFormIsPaid(true);
  }

  function openEdit(p: LeavePolicy) {
    setEditingId(p.id);
    setFormLeaveType(p.leaveType);
    setFormName(p.name);
    setFormDays(String(p.defaultDaysPerYear));
    setFormDescription(p.description ?? '');
    setFormIsPaid(p.isPaid);
  }

  function handleSubmit() {
    const days = parseFloat(formDays);
    if (!formName.trim() || Number.isNaN(days) || days < 0) {
      toast.error('Name and default days per year (≥ 0) are required');
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        body: {
          name: formName.trim(),
          defaultDaysPerYear: days,
          description: formDescription.trim() || undefined,
          isPaid: formIsPaid,
        },
      });
    } else {
      createMutation.mutate({
        leaveType: formLeaveType.trim(),
        name: formName.trim(),
        defaultDaysPerYear: days,
        description: formDescription.trim() || undefined,
        isPaid: formIsPaid,
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Leave Policy</h1>

      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <FileText className="w-5 h-5" />
            Policies
          </h2>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                resetForm();
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add policy
            </button>
          )}
        </div>

        {isSuperAdmin && showForm && (
          <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-dark-text">{editingId !== null ? 'Edit policy' : 'New policy'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Leave type</label>
                <select
                  value={formLeaveType}
                  onChange={(e) => setFormLeaveType(e.target.value)}
                  disabled={editingId !== null}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm disabled:opacity-60"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  placeholder="e.g. Casual Leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Default days per year</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  placeholder="12"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formIsPaid"
                  checked={formIsPaid}
                  onChange={(e) => setFormIsPaid(e.target.checked)}
                  className="rounded border-gray-300 dark:border-dark-border"
                />
                <label htmlFor="formIsPaid" className="text-sm text-gray-700 dark:text-dark-textSecondary">Paid leave</label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description (optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                  placeholder="Policy description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
              >
                {editingId !== null ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); resetForm(); }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading && <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
          {!isLoading && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Default days/year</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Description</th>
                  {isSuperAdmin && <th className="py-3 px-4 w-0" />}
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-4 capitalize">{p.leaveType.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4">{p.defaultDaysPerYear}</td>
                    <td className="py-3 px-4">{p.isPaid ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-gray-600 dark:text-dark-textSecondary" title={p.description ?? ''}>
                      {p.description ?? '—'}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && list.length === 0 && (
            <p className="p-4 text-gray-500 dark:text-dark-textSecondary text-sm">No leave policies defined.</p>
          )}
        </div>
      </section>
    </div>
  );
}
