import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Package, PlusCircle, AlertTriangle } from 'lucide-react';
import { announcementsApi } from '../../api/announcements';

export function AssetCollectionPage() {
  const navigate = useNavigate();
  const [overdueOnly, setOverdueOnly] = useState(false);

  const { data: reminders = [] } = useQuery({
    queryKey: ['announcements-asset-reminders', overdueOnly],
    queryFn: () => announcementsApi.getAssetReminders(overdueOnly),
  });

  const { data: listData } = useQuery({
    queryKey: ['announcements', { type: 'asset' }],
    queryFn: () => announcementsApi.list({ type: 'asset' }),
  });
  const announcements = listData?.items ?? [];

  const createFromReminders = () => {
    const title = overdueOnly ? 'Overdue asset returns – please return' : 'Pending asset returns reminder';
    const body = reminders.length > 0
      ? `The following asset(s) are ${overdueOnly ? 'overdue for return' : 'pending return'} (from Asset Management):\n\n${reminders.map((r) => `• ${r.assetName} – with ${r.employeeName} (assigned ${r.assignedAt})${r.overdue ? ' [OVERDUE]' : ''}`).join('\n')}\n\nPlease coordinate returns with HR/Admin.`
      : 'No pending or overdue returns at this time.';
    navigate('/announcements/new', {
      state: { type: 'asset', title, body },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text flex items-center gap-2">
          <Package className="w-6 h-6" />
          Asset Collection
        </h1>
        <Link
          to="/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <PlusCircle className="w-4 h-4" />
          Create reminder announcement
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Pending / overdue returns (from Asset Management)
        </h2>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-3">
          Data is from Asset Management. Use the button below to create an announcement with the current list.
        </p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
              className="rounded border-gray-300 dark:border-dark-border"
            />
            Overdue only (&gt;30 days)
          </label>
          <button
            type="button"
            onClick={createFromReminders}
            disabled={reminders.length === 0}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-light-primary/10 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create announcement from this list
          </button>
        </div>
        {reminders.length === 0 ? (
          <p className="text-gray-500 dark:text-dark-textSecondary">No pending or overdue returns.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                  <th className="py-2 pr-4">Asset</th>
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Assigned</th>
                  <th className="py-2 pr-4">Days out</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-2 pr-4">{r.assetName} {r.serialNumber && `(${r.serialNumber})`}</td>
                    <td className="py-2 pr-4">{r.employeeName}</td>
                    <td className="py-2 pr-4">{r.assignedAt}</td>
                    <td className="py-2 pr-4">{r.daysOut}</td>
                    <td className="py-2">
                      <span className={r.overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500'}>
                        {r.overdue ? 'Overdue' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          Asset collection announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="p-6 text-gray-500 dark:text-dark-textSecondary">None yet.</p>
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
