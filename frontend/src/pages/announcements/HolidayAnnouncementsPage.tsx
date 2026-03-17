import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, PlusCircle } from 'lucide-react';
import { announcementsApi } from '../../api/announcements';

export function HolidayAnnouncementsPage() {
  const navigate = useNavigate();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const { data: nationalHolidays = [] } = useQuery({
    queryKey: ['announcements-national-holidays', yearFilter],
    queryFn: () => announcementsApi.getNationalHolidays({ year: String(yearFilter), limit: '50' }),
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ['announcements-holidays-upcoming'],
    queryFn: () => announcementsApi.getUpcomingHolidays(30),
  });

  const { data: listData } = useQuery({
    queryKey: ['announcements', { type: 'holiday' }],
    queryFn: () => announcementsApi.list({ type: 'holiday' }),
  });
  const allHolidays = listData?.items ?? [];

  const createFromNationalHoliday = (name: string, holidayDate: string) => {
    navigate('/announcements/new', {
      state: {
        type: 'holiday',
        title: name,
        eventDate: holidayDate,
        body: `Office will be closed on ${holidayDate} for ${name}. Please plan accordingly.`,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <CalendarDays className="w-6 h-6" />
          Holiday Announcements
        </h1>
        <Link
          to="/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create holiday announcement
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          National holidays (auto-fed)
        </h2>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-3">
          Create an announcement from the list below. Data is from the national holidays calendar.
        </p>
        <div className="flex gap-2 mb-4">
          <label className="text-sm">Year:</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-bg text-sm"
          >
            {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {nationalHolidays.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-textSecondary">No national holidays in DB. Run migration and seed.</p>
        ) : (
          <ul className="space-y-2">
            {nationalHolidays.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-dark-bg">
                <span className="font-medium">{h.name}</span>
                <span className="text-sm text-gray-500">{h.holidayDate}</span>
                <button
                  type="button"
                  onClick={() => createFromNationalHoliday(h.name, h.holidayDate)}
                  className="text-sm text-light-primary dark:text-dark-primary hover:underline"
                >
                  Create announcement
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">Upcoming holiday announcements (sent)</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-textSecondary">No upcoming holiday announcements.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((h) => (
              <div key={h.id} className="flex flex-wrap items-start justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">
                <Link to={`/announcements/view/${h.id}`} className="font-medium text-light-primary dark:text-dark-primary hover:underline">
                  {h.title}
                </Link>
                {h.eventDate && (
                  <span className="text-sm text-gray-500">Date: {h.eventDate}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          All holiday announcements
        </h2>
        {allHolidays.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-dark-textSecondary">None yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {allHolidays.map((a) => (
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
