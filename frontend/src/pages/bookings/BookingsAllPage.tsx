import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CalendarDays, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canViewAllBookings } from '../../utils/permissions';
import { api } from '../../api/client';

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
  createdAt: string;
  updatedAt: string;
};

function formatSlot(start: string, end: string) {
  const d = new Date(start);
  const e = new Date(end);
  const date = d.toLocaleDateString();
  const time = `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return { date, time };
}

export function BookingsAllPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canViewAll = canViewAllBookings(roleName);

  const [roomId, setRoomId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  const params: Record<string, string> = {};
  if (roomId) params.roomId = roomId;
  if (from) params.from = from;
  if (to) params.to = to;
  if (status) params.status = status;

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<{ success: true; data: { id: string; name: string }[] }>('/rooms').then((r) => r.data),
    enabled: canViewAll,
  });
  const roomList = rooms ?? [];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', 'all', params],
    queryFn: () =>
      api.get<{ success: true; data: Booking[] }>('/bookings', params).then((r) => r.data),
    enabled: canViewAll,
  });
  const list = bookings ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: true; message: string }>(`/bookings/${id}`).then((r) => r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!canViewAll) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">All bookings</h1>
        <p className="text-gray-600 dark:text-dark-textSecondary mt-2">You do not have permission to view all bookings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">All bookings</h1>

      <div className="flex flex-wrap gap-2 items-center rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All rooms</option>
          {roomList.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          placeholder="To"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {list.map((b) => {
                  const { date, time } = formatSlot(b.startTime, b.endTime);
                  const isPast = new Date(b.endTime).getTime() < Date.now();
                  return (
                    <tr
                      key={b.id}
                      className={`border-b border-gray-100 dark:border-dark-border last:border-0 ${isPast ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4 font-medium">{b.roomName}</td>
                      <td className="py-3 px-4">{b.employeeName}</td>
                      <td className="py-3 px-4">{date}</td>
                      <td className="py-3 px-4">{time}</td>
                      <td className="py-3 px-4">{b.title ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            b.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!isPast && b.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Cancel this booking?')) cancelMutation.mutate(b.id);
                            }}
                            disabled={cancelMutation.isPending}
                            className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No bookings match filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
