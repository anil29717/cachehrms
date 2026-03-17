import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, Send, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { announcementsApi } from '../../api/announcements';
import { useAuthStore } from '../../stores/authStore';

export function AnnouncementViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeeId = useAuthStore((s) => s.user?.employeeId);
  const isHR = useAuthStore((s) => {
    const r = s.user?.roleName;
    return r === 'super_admin' || r === 'hr_admin';
  });

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => announcementsApi.getById(id!),
    enabled: !!id,
  });

  const markReadMutation = useMutation({
    mutationFn: () => announcementsApi.markRead(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcement', id] }),
  });

  if (!id) return <p className="text-gray-500">Invalid ID</p>;
  if (isLoading || !announcement) return <p className="text-gray-500">Loading…</p>;

  const handleMarkRead = () => {
    if (employeeId) markReadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </Link>
        {isHR && !announcement.sentAt && (
          <div className="flex gap-2">
            <Link
              to={`/announcements/edit/${id}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Link>
          </div>
        )}
      </div>

      <article className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-dark-textSecondary mb-2">
            <span className="capitalize font-medium text-gray-700 dark:text-dark-text">{announcement.type}</span>
            {announcement.eventDate && (
              <span>Event date: {announcement.eventDate}</span>
            )}
            {announcement.sentAt && (
              <span>Sent: {new Date(announcement.sentAt).toLocaleString()}</span>
            )}
            {announcement.creatorName && <span>By {announcement.creatorName}</span>}
            {announcement.readCount != null && <span>{announcement.readCount} read(s)</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">{announcement.title}</h1>
        </div>
        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-dark-textSecondary whitespace-pre-wrap">
            {announcement.body}
          </div>
        </div>
        {announcement.sentAt && employeeId && (
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={handleMarkRead}
              disabled={markReadMutation.isPending}
              className="text-sm text-light-primary dark:text-dark-primary hover:underline disabled:opacity-50"
            >
              {markReadMutation.isPending ? '…' : 'Mark as read'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
