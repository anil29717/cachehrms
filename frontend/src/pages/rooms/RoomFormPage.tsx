import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../api/client';

type Room = {
  id: string;
  name: string;
  roomType: string;
  capacity: number | null;
  amenities: string | null;
  isActive: boolean;
};

const ROOM_TYPES = [
  { value: 'conference_room', label: 'Conference room' },
  { value: 'meeting_room', label: 'Meeting room' },
  { value: 'cabin', label: 'Cabin' },
];

export function RoomFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [roomType, setRoomType] = useState('meeting_room');
  const [capacity, setCapacity] = useState('');
  const [amenities, setAmenities] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ['room', id],
    queryFn: () => api.get<{ success: true; data: Room }>(`/rooms/${id!}`).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (room) {
      setName(room.name);
      setRoomType(room.roomType);
      setCapacity(room.capacity != null ? String(room.capacity) : '');
      setAmenities(room.amenities ?? '');
      setIsActive(room.isActive);
    }
  }, [room]);

  const createMutation = useMutation({
    mutationFn: (body: { name: string; roomType: string; capacity?: number; amenities?: string }) =>
      api.post<{ success: true; data: Room; message: string }>('/rooms', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created');
      navigate('/rooms');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { name?: string; roomType?: string; capacity?: number; amenities?: string; isActive?: boolean }) =>
      api.put<{ success: true; data: Room; message: string }>(`/rooms/${id!}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      toast.success('Room updated');
      navigate('/rooms');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Room name is required');
      return;
    }
    const cap = capacity === '' ? undefined : parseInt(capacity, 10);
    if (capacity !== '' && (Number.isNaN(cap) || cap < 0)) {
      toast.error('Capacity must be a non-negative number');
      return;
    }
    if (isEdit) {
      updateMutation.mutate({ name: name.trim(), roomType, capacity: cap, amenities: amenities.trim() || undefined, isActive });
    } else {
      createMutation.mutate({ name: name.trim(), roomType, capacity: cap, amenities: amenities.trim() || undefined });
    }
  }

  if (isEdit && loadingRoom) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (isEdit && !room) return <p className="text-red-600 dark:text-red-400">Room not found.</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6">{isEdit ? 'Edit room' : 'Add room'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="e.g. Conference Room A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Type *</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Capacity (optional)</label>
          <input
            type="number"
            min={0}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="e.g. 10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Amenities (optional)</label>
          <input
            type="text"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            placeholder="e.g. Projector, Whiteboard"
          />
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 dark:border-dark-border"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-dark-textSecondary">Active (available for booking)</label>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            {isEdit ? 'Update' : 'Create'}
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
