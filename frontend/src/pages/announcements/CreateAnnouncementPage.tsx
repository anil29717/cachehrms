import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Megaphone } from 'lucide-react';
import { announcementsApi, ANNOUNCEMENT_TYPES } from '../../api/announcements';

type PrefillState = { type?: string; title?: string; body?: string; eventDate?: string } | null;

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefill = (location.state as PrefillState) ?? null;
  const [type, setType] = useState(prefill?.type ?? 'event');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [body, setBody] = useState(prefill?.body ?? '');
  const [eventDate, setEventDate] = useState(prefill?.eventDate ?? '');

  useEffect(() => {
    if (prefill) {
      if (prefill.type) setType(prefill.type);
      if (prefill.title) setTitle(prefill.title);
      if (prefill.body) setBody(prefill.body);
      if (prefill.eventDate) setEventDate(prefill.eventDate);
    }
  }, [prefill]);

  const createMutation = useMutation({
    mutationFn: () =>
      announcementsApi.create({
        type,
        title: title.trim(),
        body: body.trim(),
        eventDate: eventDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created');
      navigate('/announcements');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <Megaphone className="w-6 h-6" />
        Create New Announcement
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
            placeholder="Announcement title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Body *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full announcement content..."
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
          <p className="text-xs text-gray-500 mt-1">Use for holidays, events, deadlines</p>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create announcement'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/announcements')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
