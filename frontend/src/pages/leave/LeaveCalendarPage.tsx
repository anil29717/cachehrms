import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { api } from '../../api/client';

type CalendarEvent = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
};

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function LeaveCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { from, to } = useMemo(() => getMonthRange(year, month), [year, month]);

  const { data, isLoading } = useQuery({
    queryKey: ['leave-calendar', from, to],
    queryFn: () =>
      api.get<{ success: true; data: CalendarEvent[] }>('/leave/calendar', { from, to }).then((r) => r.data),
  });
  const events = data ?? [];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Leave Calendar</h1>

      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <Calendar className="w-5 h-5" />
            Approved leave
          </span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          >
            {[year - 2, year - 1, year, year + 1, year + 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="p-4">
          {isLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Leave type</th>
                    <th className="py-3 px-4">Start</th>
                    <th className="py-3 px-4">End</th>
                    <th className="py-3 px-4">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                      <td className="py-3 px-4 font-medium">{e.employeeName}</td>
                      <td className="py-3 px-4">{e.employeeCode}</td>
                      <td className="py-3 px-4 capitalize">{e.leaveType.replace('_', ' ')}</td>
                      <td className="py-3 px-4">{e.startDate}</td>
                      <td className="py-3 px-4">{e.endDate}</td>
                      <td className="py-3 px-4">{e.totalDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && (
                <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No approved leave in this period.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
