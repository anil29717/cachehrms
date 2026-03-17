import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  Copy,
  Check,
  Mail,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../api/client';

/** Use for invite links so they work when shared on same WiFi (set VITE_PUBLIC_ORIGIN to your machine IP) */
const shareableOrigin = (import.meta.env.VITE_PUBLIC_ORIGIN as string) || window.location.origin;

const EMPLOYEE_TYPES = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'SWITCHING', label: 'Switching / Experienced' },
];

const STAGE_NAMES: Record<number, string> = {
  1: 'Offer accepted',
  2: 'Personal info',
  3: 'Documents',
  4: 'Bank details',
  5: 'Emergency contact',
  6: 'Education',
  7: 'Experience',
  8: 'ID generated',
  9: 'IT setup',
  10: 'HR review',
};

const STATUS_LABELS: Record<string, string> = {
  OFFER_ACCEPTED: 'Offer accepted',
  DOCUMENTS_PENDING: 'Documents pending',
  DOCUMENT_REJECTED: 'Document rejected',
  DOCUMENTS_VERIFIED: 'Documents verified',
  IT_SETUP_PENDING: 'IT setup pending',
  IT_SETUP_COMPLETED: 'IT setup done',
  HR_REVIEW_PENDING: 'HR review',
  ACTIVE: 'Active',
};

type OnboardingItem = {
  id: string;
  candidateEmail: string;
  employeeType: string;
  currentStage: number;
  status: string;
  designation: string | null;
  inviteToken: string | null;
  department: { id: number; name: string; code: string | null } | null;
  employee: { employeeCode: string; firstName: string; lastName: string } | null;
  createdAt: string;
};

type EmailContent = {
  username: string;
  password: string;
  onboardingLink: string;
  companyName: string;
  companyDetails: string;
};

type CreateResult = {
  id: string;
  candidateEmail: string;
  employeeType: string;
  inviteToken: string;
  inviteLink: string;
  inviteLinkFull?: string;
  emailContent?: EmailContent;
  department: { id: number; name: string; code: string | null } | null;
};

export function OnboardingListPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [createdEmailContent, setCreatedEmailContent] = useState<EmailContent | null>(null);
  const [email, setEmail] = useState('');
  const [employeeType, setEmployeeType] = useState('FRESHER');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designation, setDesignation] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      api.get<{ success: true; data: { id: number; name: string; code?: string | null }[] }>('/departments').then((r) => r.data),
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: ['onboarding-list'],
    queryFn: async () => {
      const res = await api.get<{ success: true; data: OnboardingItem[]; meta?: { total: number } }>('/onboarding');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<{ success: true; data: CreateResult }>('/onboarding', body).then((r) => r.data),
    onSuccess: (data) => {
      const link = data.inviteLinkFull ?? `${shareableOrigin}${data.inviteLink}`;
      setCreatedInviteLink(link);
      setCreatedEmailContent(data.emailContent ?? null);
      setShowForm(false);
      setEmail('');
      setDepartmentId('');
      setDesignation('');
      queryClient.invalidateQueries({ queryKey: ['onboarding-list'] });
      toast.success('Onboarding created. Share the invite link with the candidate.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ success: true; data: { inviteLink: string } }>(`/onboarding/${id}/regenerate-invite`).then((r) => r.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-list'] });
      toast.success('Invite link regenerated.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error('Candidate email is required');
      return;
    }
    createMutation.mutate({
      candidateEmail: trimmedEmail,
      employeeType,
      ...(departmentId !== '' && { departmentId: Number(departmentId) }),
      ...(designation.trim() && { designation: designation.trim() }),
    });
  }

  function copyInviteLink() {
    if (!createdInviteLink) return;
    navigator.clipboard.writeText(createdInviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  const onboardings = Array.isArray(listData) ? listData : (listData as { items?: OnboardingItem[]; data?: OnboardingItem[] })?.items ?? (listData as { data?: OnboardingItem[] })?.data ?? [];
  const deptList = Array.isArray(departments) ? departments : (departments as { data?: { id: number; name: string; code?: string | null }[] })?.data ?? [];

  return (
    <div>
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Employees
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Onboarding pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
            List of candidates you sent invite links to. Click a row to see their pipeline step. Start new onboarding to add another.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setCreatedInviteLink(null); setCreatedEmailContent(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90"
        >
          <UserPlus className="w-5 h-5" />
          Start onboarding
        </button>
      </div>

      {/* Created invite link and email content (after create) */}
      {createdInviteLink && (
        <div className="mb-6 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-4">
          <p className="text-sm font-medium text-gray-900 dark:text-dark-text mb-2">Invite link (share with candidate)</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={createdInviteLink}
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg"
            />
            <button
              type="button"
              onClick={copyInviteLink}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-200 dark:bg-dark-bg text-gray-700 dark:text-dark-text"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {createdEmailContent && (
            <div className="pt-3 border-t border-green-300 dark:border-green-700">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text mb-2">Email content for candidate (copy into your email)</p>
              <div className="text-sm text-gray-700 dark:text-dark-textSecondary space-y-1 font-mono bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-dark-border">
                <p><strong>Username:</strong> {createdEmailContent.username}</p>
                <p><strong>Password:</strong> {createdEmailContent.password}</p>
                <p><strong>Onboarding link:</strong> {createdEmailContent.onboardingLink}</p>
                {createdEmailContent.companyName && <p><strong>Company:</strong> {createdEmailContent.companyName}</p>}
                {createdEmailContent.companyDetails && <p><strong>Details:</strong> {createdEmailContent.companyDetails}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  const body = `Username: ${createdEmailContent.username}\nPassword: ${createdEmailContent.password}\nOnboarding link: ${createdEmailContent.onboardingLink}\n${createdEmailContent.companyName ? `Company: ${createdEmailContent.companyName}\n` : ''}${createdEmailContent.companyDetails ? `Details: ${createdEmailContent.companyDetails}` : ''}`;
                  navigator.clipboard.writeText(body);
                  toast.success('Email content copied to clipboard');
                }}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-dark-bg text-gray-700 dark:text-dark-text text-sm"
              >
                <Copy className="w-4 h-4" /> Copy all for email
              </button>
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-dark-textSecondary">
            Same WiFi: run <code className="px-1 bg-white dark:bg-dark-bg rounded">npm run dev</code> and use the <strong>Network</strong> URL from the terminal (e.g. http://192.168.1.x:3000). Optionally set <code className="px-1 bg-white dark:bg-dark-bg rounded">VITE_PUBLIC_ORIGIN</code> in <code className="px-1 bg-white dark:bg-dark-bg rounded">.env</code> to that URL so copied links work for them.
          </p>
          <button
            type="button"
            onClick={() => { setCreatedInviteLink(null); setCreatedEmailContent(null); }}
            className="mt-2 text-sm text-gray-600 dark:text-dark-textSecondary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Start onboarding form */}
      {showForm && (
        <div className="mb-6 p-6 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">New onboarding (Stage 1: Offer acceptance)</h2>
          <form onSubmit={handleCreate} className="max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Candidate email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg"
                placeholder="candidate@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Employee type *
              </label>
              <select
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg"
              >
                {EMPLOYEE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg"
              >
                <option value="">— Select —</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Designation (optional)
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create & get invite link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-500 dark:text-dark-textSecondary" />
          <span className="font-medium text-gray-900 dark:text-dark-text">All onboardings</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">Loading…</div>
        ) : onboardings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
            No onboardings yet. Click “Start onboarding” to add one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-dark-border">
            {onboardings.map((ob) => (
              <li key={ob.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg/50 group">
                <Link to={`/onboarding/${ob.id}`} className="min-w-0 flex-1 block">
                  <p className="font-medium text-gray-900 dark:text-dark-text truncate group-hover:text-light-primary dark:group-hover:text-dark-primary">
                    {ob.candidateEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-0.5">
                    {ob.employeeType} · Stage {ob.currentStage}: {STAGE_NAMES[ob.currentStage] ?? ob.currentStage} · {STATUS_LABELS[ob.status] ?? ob.status}
                    {ob.department && ` · ${ob.department.name}`}
                  </p>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ob.status !== 'ACTIVE' && ob.inviteToken && (
                    <a
                      href={`${shareableOrigin}/onboarding/join/${ob.inviteToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                      title="Open invite link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); regenerateMutation.mutate(ob.id); }}
                    disabled={regenerateMutation.isPending || ob.status === 'ACTIVE'}
                    className="p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg disabled:opacity-50"
                    title="Regenerate invite link"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/onboarding/${ob.id}`}
                    className="p-2 rounded-lg text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                    title="View pipeline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
