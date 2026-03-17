import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Megaphone } from 'lucide-react';
import { announcementsApi, ANNOUNCEMENT_TYPES } from '../../api/announcements';

export function EditAnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState('event');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventDate, setEventDate] = useState('');

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (announcement) {
      setType(announcement.type);
      setTitle(announcement.title);
      setBody(announcement.body);
      setEventDate(announcement.eventDate ?? '');
    }
  }, [announcement]);

  const updateMutation = useMutation({
    mutationFn: () =>
      announcementsApi.update(id!, {
        type,
        title: title.trim(),
        body: body.trim(),
        eventDate: eventDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement updated');
      navigate(`/announcements/view/${id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!id) return <p className="text-gray-500">Invalid ID</p>;
  if (isLoading || !announcement) return <p className="text-gray-500">Loading…</p>;
  if (announcement.sentAt) {
    return (
      <p className="text-gray-500">
        Cannot edit a sent announcement. <button type="button" onClick={() => navigate(-1)} className="text-light-primary dark:text-dark-primary hover:underline">Go back</button>.
      </p>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        Edit announcement
      </h1>

      <form onSubmit={submit} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {ANNOUNCEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Body *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Event date (optional)</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/announcements/view/${id}`)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
