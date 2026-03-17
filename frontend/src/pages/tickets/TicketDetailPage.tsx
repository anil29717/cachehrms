import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Ticket, Pencil } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type TicketDetail = {
  id: string;
  subject: string;
  description: string;
  categoryName: string | null;
  status: string;
  priority: string;
  createdBy: string;
  createdByName: string;
  regardingEmployeeCode: string | null;
  regardingEmployeeName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeeId = useAuthStore((s) => s.user?.employeeId);

  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<{ success: true; data: TicketDetail }>(`/tickets/${id!}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: { employeeCode: string; firstName: string; lastName: string }[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: Boolean(id),
  });
  const employeeList = Array.isArray(employees) ? employees : [];

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setAssignedTo(ticket.assignedTo ?? '');
    }
  }, [ticket]);

  const updateMutation = useMutation({
    mutationFn: (body: { status?: string; priority?: string; assignedTo?: string }) =>
      api.put<{ success: true; data: TicketDetail }>(`/tickets/${id!}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setEditing(false);
      toast.success('Ticket updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSave() {
    updateMutation.mutate({
      status,
      priority,
      assignedTo: assignedTo || undefined,
    });
  }

  if (!id) return null;
  if (isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (!ticket) return <p className="text-red-600 dark:text-red-400">Ticket not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Ticket className="w-6 h-6" />
          {ticket.subject}
        </h1>
        <button
          type="button"
          onClick={() => (editing ? handleSave() : setEditing(true))}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm hover:bg-gray-50 dark:hover:bg-dark-bg"
        >
          <Pencil className="w-4 h-4" />
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary">Description</p>
          <p className="mt-1 text-gray-900 dark:text-dark-text whitespace-pre-wrap">{ticket.description}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt className="text-gray-500 dark:text-dark-textSecondary">Category</dt>
          <dd>{ticket.categoryName ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Regarding employee</dt>
          <dd>{ticket.regardingEmployeeName ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Created by</dt>
          <dd>{ticket.createdByName}</dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Created</dt>
          <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Status</dt>
          <dd>
            {editing ? (
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-1 border rounded text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            ) : (
              ticket.status
            )}
          </dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Priority</dt>
          <dd>
            {editing ? (
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-2 py-1 border rounded text-sm">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              ticket.priority
            )}
          </dd>
          <dt className="text-gray-500 dark:text-dark-textSecondary">Assigned to</dt>
          <dd>
            {editing ? (
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="px-2 py-1 border rounded text-sm w-full max-w-xs" disabled={employeesLoading}>
                <option value="">— Unassigned —</option>
                {employeeList.map((e) => (
                  <option key={e.employeeCode} value={e.employeeCode}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            ) : (
              ticket.assignedToName ?? '—'
            )}
          </dd>
          {ticket.resolvedAt && (
            <>
              <dt className="text-gray-500 dark:text-dark-textSecondary">Resolved at</dt>
              <dd>{new Date(ticket.resolvedAt).toLocaleString()}</dd>
            </>
          )}
          {ticket.closedAt && (
            <>
              <dt className="text-gray-500 dark:text-dark-textSecondary">Closed at</dt>
              <dd>{new Date(ticket.closedAt).toLocaleString()}</dd>
            </>
          )}
        </dl>
      </div>

      <button type="button" onClick={() => navigate('/tickets')} className="text-sm text-gray-600 dark:text-dark-textSecondary hover:underline">
        ← Back to tickets
      </button>
    </div>
  );
}
