import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock, Sun, Moon, ShieldCheck, Building2, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    api
      .get<{ success?: boolean; data?: { enabled: boolean } }>('/auth/microsoft', { check: '1' })
      .then((res) => res?.data?.enabled && setMicrosoftEnabled(true))
      .catch(() => {});
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg p-4 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-light-primary/5 dark:bg-dark-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-light-primary/5 dark:bg-dark-primary/10 blur-3xl" />
      </div>

      <button
        type="button"
        onClick={toggle}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md transition-shadow"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Header with premium icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-lg shadow-gray-200/50 dark:shadow-dark-bg/50 mb-4">
            <Building2 className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Cachedigitech HRMS</h1>
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-gray-600 dark:text-dark-textSecondary text-sm">Sign in to your account</p>
        </div>

        {/* Card with left accent */}
        <div className="relative bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl shadow-gray-200/30 dark:shadow-black/20 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-light-primary dark:bg-dark-primary" />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-2">
                <Mail className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary" />
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-bg group-focus-within:bg-light-primary/10 dark:group-focus-within:bg-dark-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary group-focus-within:text-light-primary dark:group-focus-within:text-dark-primary transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-400 focus:ring-2 focus:ring-light-primary/20 dark:focus:ring-dark-primary/30 focus:border-light-primary dark:focus:border-dark-primary transition"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-2">
                <Lock className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary" />
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-dark-bg group-focus-within:bg-light-primary/10 dark:group-focus-within:bg-dark-primary/20 transition-colors">
                  <Lock className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary group-focus-within:text-light-primary dark:group-focus-within:text-dark-primary transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-400 focus:ring-2 focus:ring-light-primary/20 dark:focus:ring-dark-primary/30 focus:border-light-primary dark:focus:border-dark-primary transition"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-light-primary dark:bg-dark-primary text-white font-semibold rounded-xl hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition shadow-lg shadow-light-primary/25 dark:shadow-dark-primary/25"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {microsoftEnabled && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200 dark:border-dark-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-textSecondary font-medium">or continue with</span>
                  </div>
                </div>
                <a
                  href={authMicrosoftUrl}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-gray-700 dark:text-dark-text font-medium hover:bg-gray-50 dark:hover:bg-dark-card hover:border-gray-300 dark:hover:border-dark-border transition"
                >
                  <MicrosoftIcon className="w-5 h-5" />
                  Sign in with Microsoft
                </a>
              </>
            )}
          </form>
        </div>

        {/* Footer with secure badge */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-textSecondary">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Secure login</span>
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-dark-textSecondary">
            Default: admin@cachedigitech.com / Admin@123 (after seed)
          </p>
        </div>
      </div>
    </div>
  );
}
