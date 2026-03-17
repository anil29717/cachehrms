import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { canViewAllBookings } from '../../utils/permissions';

type EmployeeOption = { employeeCode: string; firstName: string; lastName: string };

type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  title: string | null;
  description: string | null;
  status: string;
};

export function BookingEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const roleName = useAuthStore((s) => s.user?.roleName);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allocatedEmployeeId, setAllocatedEmployeeId] = useState('');

  const canChangeEmployee = canViewAllBookings(roleName);
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get<{ success: true; data: Booking }>(`/bookings/${id!}`).then((r) => r.data),
    enabled: Boolean(id),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: EmployeeOption[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: canChangeEmployee,
  });
  const employeeList = employees ?? [];

  useEffect(() => {
    if (booking) {
      const s = new Date(booking.startTime);
      const e = new Date(booking.endTime);
      setStartTime(s.toISOString().slice(11, 16));
      setEndTime(e.toISOString().slice(11, 16));
      setTitle(booking.title ?? '');
      setDescription(booking.description ?? '');
      setAllocatedEmployeeId(booking.employeeId);
    }
  }, [booking]);

  const updateMutation = useMutation({
    mutationFn: (body: { startTime?: string; endTime?: string; title?: string; description?: string; employeeId?: string }) =>
      api.put<{ success: true; data: Booking; message: string }>(`/bookings/${id!}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      toast.success('Booking updated');
      navigate('/bookings');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canEdit = booking && (booking.employeeId === employeeId || roleName === 'super_admin' || roleName === 'hr_admin');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    const date = booking.startTime.slice(0, 10);
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end.getTime() <= start.getTime()) {
      toast.error('End time must be after start time');
      return;
    }
    if (start.getTime() < Date.now()) {
      toast.error('Booking cannot start in the past');
      return;
    }
    const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
    if (durationMinutes < 30) {
      toast.error('Minimum booking duration is 30 minutes');
      return;
    }
    updateMutation.mutate({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      ...(canChangeEmployee && allocatedEmployeeId && { employeeId: allocatedEmployeeId }),
    });
  }

  if (!id) return null;
  if (isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (!booking) return <p className="text-red-600 dark:text-red-400">Booking not found.</p>;
  if (booking.status !== 'confirmed') return <p className="text-amber-600 dark:text-amber-400">Cannot edit a cancelled booking.</p>;
  if (!canEdit) return <p className="text-red-600 dark:text-red-400">You cannot edit this booking.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Edit booking</h1>
      <p className="text-sm text-gray-600 dark:text-dark-textSecondary mb-4">Room: {booking.roomName}</p>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        {canChangeEmployee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Allocated to (employee)</label>
            <select
              value={allocatedEmployeeId}
              onChange={(e) => setAllocatedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">Select employee</option>
              {employeeList.map((emp) => (
                <option key={emp.employeeCode} value={emp.employeeCode}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Start time *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">End time *</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
