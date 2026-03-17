import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { api } from '../api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const authMicrosoftUrl =
  (API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE.startsWith('/') ? '' : '/'}${API_BASE}`).replace(/\/$/, '') + '/auth/microsoft';

/** Microsoft logo (four squares) for SSO button */
function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false);

  // Check if Microsoft SSO is configured (so we can show/hide the button)
  useEffect(() => {
    api
      .get<{ success?: boolean; data?: { enabled: boolean } }>('/auth/microsoft', { check: '1' })
      .then((res) => res?.data?.enabled && setMicrosoftEnabled(true))
      .catch(() => {});
  }, []);

  // Handle Microsoft SSO callback: hash contains access_token, refresh_token, user (base64url)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      const ssoError = searchParams.get('sso_error');
      if (ssoError) {
        toast.error(decodeURIComponent(ssoError));
        setSearchParams({}, { replace: true });
      }
      return;
    }
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const userEnc = params.get('user');
    if (accessToken && refreshToken && userEnc) {
      try {
        const base64 = userEnc.replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const user = JSON.parse(new TextDecoder().decode(bytes)) as {
          email: string;
          roleName: string;
          employeeId: string;
          scopePermissions?: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
        };
        setAuth(accessToken, refreshToken, user);
        toast.success('Welcome back!');
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { replace: true });
      } catch {
        toast.error('Sign-in failed. Please try again.');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [navigate, searchParams, setAuth, setSearchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{
        data: {
          accessToken: string;
          refreshToken: string;
          user: {
            email: string;
            roleName: string;
            employeeId: string;
            scopePermissions?: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
          };
        };
      }>('/auth/login', { email: email.trim(), password });
      const { accessToken, refreshToken, user } = res.data;
      setAuth(accessToken, refreshToken, user);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
      <button
        type="button"
        onClick={toggle}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Cachedigitech HRMS</h1>
          <p className="text-gray-600 dark:text-dark-textSecondary mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-transparent"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-light-primary dark:bg-dark-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {microsoftEnabled && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-dark-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-textSecondary">or</span>
                </div>
              </div>
              <a
                href={authMicrosoftUrl}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-card transition"
              >
                <MicrosoftIcon className="w-5 h-5" />
                Sign in with Microsoft
              </a>
            </>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-dark-textSecondary mt-4">
          Default: admin@cachedigitech.com / Admin@123 (after seed)
        </p>
      </div>
    </div>
  );
}
