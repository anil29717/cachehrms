import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DoorOpen, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { canManageRooms } from '../../utils/permissions';
import { api } from '../../api/client';

type Room = {
  id: string;
  name: string;
  roomType: string;
  capacity: number | null;
  amenities: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const ROOM_TYPES: Record<string, string> = {
  conference_room: 'Conference room',
  meeting_room: 'Meeting room',
  cabin: 'Cabin',
};

export function RoomListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const roleName = useAuthStore((s) => s.user?.roleName);
  const canManage = canManageRooms(roleName);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', includeInactive],
    queryFn: () =>
      api
        .get<{ success: true; data: Room[] }>('/rooms', includeInactive ? { includeInactive: 'true' } : undefined)
        .then((r) => r.data),
  });
  const list = rooms ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<{ success: true; message: string }>(`/rooms/${id}`).then((r) => r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Room booking</h1>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-textSecondary">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="rounded border-gray-300 dark:border-dark-border"
                />
                Show inactive
              </label>
              <Link
                to="/rooms/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add room
              </Link>
            </>
          )}
        </div>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((room) => (
            <div
              key={room.id}
              className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <DoorOpen className="w-5 h-5 text-gray-500 dark:text-dark-textSecondary flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-dark-text truncate">{room.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
                      {ROOM_TYPES[room.roomType] ?? room.roomType}
                      {room.capacity != null && ` · ${room.capacity} seats`}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      to={`/rooms/${room.id}/edit`}
                      className="p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete room "${room.name}"? This will also delete all its bookings.`)) {
                          deleteMutation.mutate(room.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {room.amenities && (
                <p className="mt-2 text-sm text-gray-600 dark:text-dark-textSecondary line-clamp-2">{room.amenities}</p>
              )}
              {!room.isActive && (
                <span className="mt-2 inline-flex text-xs text-amber-600 dark:text-amber-400">Inactive</span>
              )}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => navigate(`/rooms/book?roomId=${room.id}`)}
                  disabled={!room.isActive}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar className="w-4 h-4" />
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && list.length === 0 && (
        <p className="text-gray-500 dark:text-dark-textSecondary">No rooms yet. {canManage && 'Add a room to get started.'}</p>
      )}
    </div>
  );
}
