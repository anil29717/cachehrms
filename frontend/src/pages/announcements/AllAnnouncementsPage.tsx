import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Megaphone, PlusCircle, Eye, Send, Trash2 } from 'lucide-react';
import { announcementsApi, ANNOUNCEMENT_TYPES } from '../../api/announcements';

export function AllAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sentOnly, setSentOnly] = useState(false);

  const params: Record<string, string> = {};
  if (typeFilter) params.type = typeFilter;
  if (sentOnly) params.sentOnly = 'true';

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', params],
    queryFn: () => announcementsApi.list(params),
  });
  const items = data?.items ?? [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement published');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          All Announcements
        </h1>
        <Link
          to="/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create New
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
        >
          <option value="">All types</option>
          {ANNOUNCEMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sentOnly}
            onChange={(e) => setSentOnly(e.target.checked)}
            className="rounded border-gray-300 dark:border-dark-border"
          />
          Sent only
        </label>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Event date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4 capitalize">{a.type}</td>
                    <td className="py-3 px-4 font-medium">
                      <Link to={`/announcements/view/${a.id}`} className="text-light-primary dark:text-dark-primary hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{a.eventDate ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={a.sentAt ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                        {a.sentAt ? 'Sent' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Link to={`/announcements/view/${a.id}`} className="text-light-primary dark:text-dark-primary hover:underline text-xs">View</Link>
                      {!a.sentAt && (
                        <>
                          <button
                            type="button"
                            onClick={() => publishMutation.mutate(a.id)}
                            disabled={publishMutation.isPending}
                            className="text-green-600 dark:text-green-400 text-xs hover:underline disabled:opacity-50"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(a.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 dark:text-red-400 text-xs hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">
              No announcements. <Link to="/announcements/new" className="text-light-primary dark:text-dark-primary hover:underline">Create one</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
