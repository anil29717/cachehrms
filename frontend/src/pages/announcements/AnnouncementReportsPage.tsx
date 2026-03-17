import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { announcementsApi } from '../../api/announcements';

export function AnnouncementReportsPage() {
  const { data: reportItems = [], isLoading } = useQuery({
    queryKey: ['announcements-report'],
    queryFn: () => announcementsApi.getReport(100),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Announcement reports
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary">
        Sent announcements and read receipts.
      </p>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {!isLoading && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Sent at</th>
                  <th className="py-3 px-4">Created by</th>
                  <th className="py-3 px-4">Read count</th>
                  <th className="py-3 px-4 w-0" />
                </tr>
              </thead>
              <tbody>
                {reportItems.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4 capitalize">{r.type}</td>
                    <td className="py-3 px-4 font-medium">{r.title}</td>
                    <td className="py-3 px-4">{new Date(r.sentAt).toLocaleString()}</td>
                    <td className="py-3 px-4">{r.creatorName}</td>
                    <td className="py-3 px-4">{r.readCount}</td>
                    <td className="py-3 px-4">
                      <Link to={`/announcements/view/${r.id}`} className="text-light-primary dark:text-dark-primary text-xs font-medium hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportItems.length === 0 && (
            <p className="p-6 text-gray-500 dark:text-dark-textSecondary text-center">
              No sent announcements yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
