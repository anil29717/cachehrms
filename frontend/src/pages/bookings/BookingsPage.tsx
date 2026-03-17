import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CalendarDays, Plus, Pencil, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
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

export function BookingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const employeeId = useAuthStore((s) => s.user?.employeeId);

  const params: Record<string, string> = {};
  if (employeeId) params.employeeId = employeeId;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', 'my', employeeId],
    queryFn: () =>
      api.get<{ success: true; data: Booking[] }>('/bookings', params).then((r) => r.data),
  });
  const list = (bookings ?? []).filter((b) => b.status === 'confirmed');

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: true; message: string }>(`/bookings/${id}`).then((r) => r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">My bookings</h1>
        <button
          type="button"
          onClick={() => navigate('/rooms/book')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Book a room
        </button>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Title</th>
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
                      <td className="py-3 px-4">{date}</td>
                      <td className="py-3 px-4">{time}</td>
                      <td className="py-3 px-4">{b.title ?? '—'}</td>
                      <td className="py-3 px-4">
                        {!isPast && b.status === 'confirmed' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/bookings/${b.id}/edit`)}
                              className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
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
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">No upcoming bookings.</p>
          )}
        </div>
      )}
    </div>
  );
}
