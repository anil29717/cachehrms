import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Flag, PlusCircle } from 'lucide-react';
import { announcementsApi } from '../../api/announcements';

export function DeadlinesPage() {
  const { data } = useQuery({
    queryKey: ['announcements', { type: 'deadline' }],
    queryFn: () => announcementsApi.list({ type: 'deadline' }),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Flag className="w-6 h-6" />
          Deadlines
        </h1>
        <Link
          to="/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create deadline announcement
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        {items.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">
            No deadline announcements. <Link to="/announcements/new" className="text-light-primary dark:text-dark-primary hover:underline">Create one</Link> (choose type &quot;Deadline&quot;).
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {items.map((a) => (
              <li key={a.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg/50 flex items-center justify-between gap-2">
                <Link to={`/announcements/view/${a.id}`} className="font-medium text-light-primary dark:text-dark-primary hover:underline">
                  {a.title}
                </Link>
                <span className="text-sm text-gray-500">{a.eventDate ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
