import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, PlusCircle, Cake } from 'lucide-react';
import { announcementsApi } from '../../api/announcements';

type BirthdayFilter = 'today' | 'week' | 'month';

export function BirthdayAnnouncementsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BirthdayFilter>('month');

  const { data: birthdays = [] } = useQuery({
    queryKey: ['announcements-birthdays', filter],
    queryFn: () => announcementsApi.getBirthdays(filter),
  });

  const { data: announcementList } = useQuery({
    queryKey: ['announcements', { type: 'birthday' }],
    queryFn: () => announcementsApi.list({ type: 'birthday' }),
  });
  const announcements = announcementList?.items ?? [];

  const createFromBirthdays = () => {
    const titles: Record<BirthdayFilter, string> = { today: "Today's birthdays", week: "This week's birthdays", month: "This month's birthdays" };
    const body = birthdays.length > 0
      ? `Wish a very Happy Birthday to:\n\n${birthdays.map((e) => `• ${e.firstName} ${e.lastName}`).join('\n')}`
      : 'No birthdays in this period.';
    navigate('/announcements/new', {
      state: { type: 'birthday', title: titles[filter], body },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Gift className="w-6 h-6" />
          Birthday Announcements
        </h1>
        <Link
          to="/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create birthday announcement
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2 flex items-center gap-2">
          <Cake className="w-5 h-5" />
          Birthdays (auto from employee DOB)
        </h2>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-3">
          Data is from employee records. Use the buttons below to create an announcement with the current list.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['today', 'week', 'month'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f
                  ? 'bg-light-primary dark:bg-dark-primary text-white'
                  : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-textSecondary hover:bg-gray-200 dark:hover:bg-dark-border'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={createFromBirthdays}
          disabled={birthdays.length === 0}
          className="mb-3 px-3 py-2 rounded-lg text-sm font-medium bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Create announcement from these birthdays
        </button>
        {birthdays.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-textSecondary">No birthdays in this period.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {birthdays.map((e) => (
              <li
                key={e.employeeCode}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-dark-bg"
              >
                <span className="font-medium">{e.firstName} {e.lastName}</span>
                <span className="text-sm text-gray-500">({e.dateOfBirth})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          Birthday announcements (sent)
        </h2>
        {announcements.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-dark-textSecondary">No birthday announcements yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {announcements.map((a) => (
              <li key={a.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                <Link to={`/announcements/view/${a.id}`} className="font-medium text-light-primary dark:text-dark-primary hover:underline">
                  {a.title}
                </Link>
                <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
                  {a.sentAt ? `Sent ${new Date(a.sentAt).toLocaleDateString()}` : 'Draft'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
