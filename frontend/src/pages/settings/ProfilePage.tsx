import { useAuthStore } from '../../stores/authStore';
import { User, Mail, Shield } from 'lucide-react';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">Profile</h1>
      <div className="rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-dark-text">
              {user?.email?.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '—'}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary">{user?.roleName?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-textSecondary">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>{user?.email ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-textSecondary">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>{user?.roleName?.replace(/_/g, ' ') ?? '—'}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary pt-2 border-t border-gray-100 dark:border-dark-border">
          Update profile (e.g. password, display name) can be added here when the backend supports it.
        </p>
      </div>
    </div>
  );
}
