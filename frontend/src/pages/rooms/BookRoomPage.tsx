import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { canViewAllBookings } from '../../utils/permissions';

type Room = {
  id: string;
  name: string;
  roomType: string;
  capacity: number | null;
  isActive: boolean;
};

type EmployeeOption = { employeeCode: string; firstName: string; lastName: string };

export function BookRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get('roomId');
  const queryClient = useQueryClient();
  const currentEmployeeId = useAuthStore((s) => s.user?.employeeId);
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canSelectEmployee = canViewAllBookings(roleName);

  const today = new Date().toISOString().slice(0, 10);
  const [roomId, setRoomId] = useState(preselectedRoomId ?? '');
  const [employeeId, setEmployeeId] = useState(currentEmployeeId ?? '');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<{ success: true; data: Room[] }>('/rooms').then((r) => r.data),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () =>
      api.get<{ success: true; data: EmployeeOption[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: canSelectEmployee,
  });
  const roomList = (rooms ?? []).filter((r) => r.isActive);
  const employeeList = employees ?? [];

  useEffect(() => {
    if (preselectedRoomId && roomList.length && !roomId) setRoomId(preselectedRoomId);
  }, [preselectedRoomId, roomList, roomId]);
  useEffect(() => {
    if (currentEmployeeId && !employeeId) setEmployeeId(currentEmployeeId);
  }, [currentEmployeeId, employeeId]);

  const createMutation = useMutation({
    mutationFn: (body: { roomId: string; startTime: string; endTime: string; title?: string; description?: string; employeeId?: string }) =>
      api.post<{ success: true; data: unknown; message: string }>('/bookings', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Room booked successfully');
      navigate('/bookings');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) {
      toast.error('Select a room');
      return;
    }
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
    createMutation.mutate({
      roomId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      ...(canSelectEmployee && employeeId && { employeeId }),
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">Book a room</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        {canSelectEmployee && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Allocate to (employee) *</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              required
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Room *</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            required
          >
            <option value="">Select room</option>
            {roomList.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Date *</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            required
          />
        </div>
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
            placeholder="e.g. Team standup"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="Notes"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            Book room
          </button>
          <button
            type="button"
            onClick={() => navigate('/rooms')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
