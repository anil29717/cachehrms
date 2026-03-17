import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Copy, Check, RefreshCw, ExternalLink, FileText, CheckCircle, XCircle, IdCard, Monitor, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
/** Use for invite links so they work when shared with someone on same WiFi (set VITE_PUBLIC_ORIGIN to your machine IP, e.g. http://192.168.1.5:3000) */
const shareableOrigin = (import.meta.env.VITE_PUBLIC_ORIGIN as string) || window.location.origin;

function buildApiUrl(path: string): string {
  const base = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return base.startsWith('http') ? base : new URL(base, window.location.origin).toString();
}

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

type OnboardingDoc = {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: string;
  rejectionReason: string | null;
};

type OnboardingDetail = {
  id: string;
  candidateEmail: string;
  employeeType: string;
  currentStage: number;
  status: string;
  designation: string | null;
  inviteToken: string | null;
  department: { id: number; name: string; code: string | null } | null;
  employee: { employeeCode: string; firstName: string; lastName: string; email: string } | null;
  itSetupCompletedAt: string | null;
  itSetupNotes: string | null;
  createdAt: string;
  personalInfo: unknown | null;
  documents?: OnboardingDoc[];
};

const DOC_TYPE_LABELS: Record<string, string> = {
  photo: 'Photo',
  identity_proof: 'Identity proof',
  address_proof: 'Address proof',
  pan_card: 'PAN card',
  resume: 'Resume',
  signed_offer_letter: 'Signed offer letter',
  cancel_cheque: 'Cancel cheque',
  passport: 'Passport',
  class_10_marksheet: 'Class 10 marksheet',
  class_12_marksheet: 'Class 12 marksheet',
  marksheet: 'Marksheet',
  degree_certificate: 'Degree certificate',
  experience_letter: 'Experience letter',
  salary_slip: 'Salary slip',
};

export function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: res, isLoading } = useQuery({
    queryKey: ['onboarding', id],
    queryFn: () => api.get<{ success: true; data: OnboardingDetail }>(`/onboarding/${id}`),
    enabled: !!id,
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: true; data: { inviteLink: string; inviteToken: string; inviteLinkFull?: string; emailContent?: { username: string; password: string; onboardingLink: string; companyName: string; companyDetails: string } } }>(`/onboarding/${id}/regenerate-invite`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      const data = (res as { data?: { inviteLink: string; inviteLinkFull?: string; emailContent?: { username: string; password: string; onboardingLink: string; companyName: string; companyDetails: string } } }).data;
      const link = data?.inviteLinkFull ?? (data?.inviteLink ? `${shareableOrigin}${data.inviteLink}` : null);
      if (data?.emailContent) {
        const body = `Username: ${data.emailContent.username}\nPassword: ${data.emailContent.password}\nOnboarding link: ${data.emailContent.onboardingLink}\n${data.emailContent.companyName ? `Company: ${data.emailContent.companyName}\n` : ''}${data.emailContent.companyDetails ? `Details: ${data.emailContent.companyDetails}` : ''}`;
        navigator.clipboard.writeText(body);
        toast.success('Invite regenerated. Email content (username, password, link, company) copied to clipboard.');
      } else if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Invite link regenerated and copied to clipboard');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifyDocMutation = useMutation({
    mutationFn: ({ documentId, verificationStatus, rejectionReason }: { documentId: string; verificationStatus: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) =>
      api.patch<{ success: true; data: OnboardingDoc }>(`/onboarding/documents/${documentId}/verify`, { verificationStatus, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      toast.success('Document updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generateIdMutation = useMutation({
    mutationFn: () => api.post<{ success: true; data: OnboardingDetail }>(`/onboarding/${id}/generate-employee-id`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      toast.success('Employee ID generated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markItSetupMutation = useMutation({
    mutationFn: (notes?: string) =>
      api.post<{ success: true; data: OnboardingDetail }>(`/onboarding/${id}/mark-it-setup-complete`, notes != null ? { notes } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      toast.success('IT setup marked complete');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.post<{ success: true; data: OnboardingDetail }>(`/onboarding/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      toast.success('Onboarding completed. Employee can log in.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [itSetupNotes, setItSetupNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  function handleViewDocument(docId: string) {
    const token = localStorage.getItem('hrms-auth')
      ? (JSON.parse(localStorage.getItem('hrms-auth') ?? '{}')?.state?.accessToken as string)
      : null;
    const url = buildApiUrl(`/onboarding/documents/${docId}/file`);
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        window.open(u, '_blank');
      })
      .catch(() => toast.error('Could not load file'));
  }

  const onboarding = res?.data;

  function copyLink() {
    if (!onboarding?.inviteToken) return;
    const link = `${shareableOrigin}/onboarding/join/${onboarding.inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied. Share with the candidate (on same WiFi, set VITE_PUBLIC_ORIGIN in .env to your IP).');
    setTimeout(() => setCopied(false), 2000);
  }

  if (!id) return null;
  if (isLoading || !onboarding) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>
      </div>
    );
  }

  const inviteLink = onboarding.inviteToken
    ? `${shareableOrigin}/onboarding/join/${onboarding.inviteToken}`
    : null;

  return (
    <div>
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to onboarding list
      </Link>

      {/* Pipeline: where this candidate is */}
      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Pipeline — current step</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stage) => {
            const done = onboarding.currentStage > stage;
            const current = onboarding.currentStage === stage;
            return (
              <div
                key={stage}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  current
                    ? 'bg-light-primary dark:bg-dark-primary text-white'
                    : done
                      ? 'bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-dark-text'
                      : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-dark-textSecondary'
                }`}
                title={STAGE_NAMES[stage]}
              >
                {stage}. {STAGE_NAMES[stage]}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-2">
          Status: <strong>{STATUS_LABELS[onboarding.status] ?? onboarding.status}</strong>
          {onboarding.currentStage >= 8 && onboarding.status !== 'ACTIVE' && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">→ Use &quot;HR actions&quot; section below to complete.</span>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{onboarding.candidateEmail}</h1>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary">
              {onboarding.employeeType}
              {onboarding.department && ` · ${onboarding.department.name}`}
              {onboarding.designation && ` · ${onboarding.designation}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-1">
              Stage {onboarding.currentStage}: {STAGE_NAMES[onboarding.currentStage]} · {STATUS_LABELS[onboarding.status] ?? onboarding.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inviteLink && (
            <>
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text"
              >
                <ExternalLink className="w-4 h-4" />
                Open link
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </>
          )}
          {onboarding.status !== 'ACTIVE' && (
            <button
              type="button"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate link
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-4">Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Email</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.candidateEmail}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Type</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.employeeType}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Department</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.department?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Designation</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.designation ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Status</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">{STATUS_LABELS[onboarding.status] ?? onboarding.status}</dd>
          </div>
          <div>
            <dt className="text-gray-500 dark:text-dark-textSecondary">Current stage</dt>
            <dd className="font-medium text-gray-900 dark:text-dark-text">
              {onboarding.currentStage} – {STAGE_NAMES[onboarding.currentStage]}
            </dd>
          </div>
          {onboarding.employee && (
            <>
              <div>
                <dt className="text-gray-500 dark:text-dark-textSecondary">Employee code</dt>
                <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.employee.employeeCode}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-dark-textSecondary">Name</dt>
                <dd className="font-medium text-gray-900 dark:text-dark-text">
                  {onboarding.employee.firstName} {onboarding.employee.lastName}
                </dd>
              </div>
            </>
          )}
          {onboarding.itSetupCompletedAt && (
            <>
              <div>
                <dt className="text-gray-500 dark:text-dark-textSecondary">IT setup completed</dt>
                <dd className="font-medium text-gray-900 dark:text-dark-text">
                  {new Date(onboarding.itSetupCompletedAt).toLocaleString()}
                </dd>
              </div>
              {onboarding.itSetupNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-dark-textSecondary">IT setup notes</dt>
                  <dd className="font-medium text-gray-900 dark:text-dark-text">{onboarding.itSetupNotes}</dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      {onboarding.status !== 'ACTIVE' && (
        <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-6 mt-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text mb-1">HR actions — complete Stages 8–10 here</h2>
          <p className="text-sm text-gray-600 dark:text-dark-textSecondary mb-4">
            The candidate has finished their part. Use the buttons below in order: <strong>1 → Generate ID</strong>, then <strong>2 → Mark IT setup complete</strong>, then <strong>3 → Activate</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            {!onboarding.employee && onboarding.currentStage >= 8 && onboarding.status === 'DOCUMENTS_VERIFIED' && onboarding.department && (
              <button
                type="button"
                onClick={() => generateIdMutation.mutate()}
                disabled={generateIdMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <IdCard className="w-4 h-4" />
                1. Generate employee ID
              </button>
            )}
            {!onboarding.employee && onboarding.currentStage >= 8 && (!onboarding.department || onboarding.status !== 'DOCUMENTS_VERIFIED') && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {!onboarding.department
                  ? 'Department is required to generate employee ID. Edit this onboarding or ensure department was set when creating it.'
                  : 'Complete document verification first, or generate employee ID once status is Documents verified.'}
              </p>
            )}
            {onboarding.status === 'IT_SETUP_PENDING' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="IT setup notes (optional)"
                  value={itSetupNotes}
                  onChange={(e) => setItSetupNotes(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
                <button
                  type="button"
                  onClick={() => markItSetupMutation.mutate(itSetupNotes.trim() || undefined)}
                  disabled={markItSetupMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Monitor className="w-4 h-4" />
                  2. Mark IT setup complete
                </button>
              </div>
            )}
            {(onboarding.status === 'HR_REVIEW_PENDING' || onboarding.status === 'IT_SETUP_COMPLETED') && onboarding.employee && (
              <button
                type="button"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                3. Complete onboarding (Activate)
              </button>
            )}
          </div>
        </div>
      )}

      {(onboarding.documents?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 mt-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-4">Documents</h2>
          <ul className="space-y-3">
            {onboarding.documents?.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-dark-textSecondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-dark-text text-sm">
                      {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{doc.fileName}</p>
                    {doc.rejectionReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Rejected: {doc.rejectionReason}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      doc.verificationStatus === 'VERIFIED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : doc.verificationStatus === 'REJECTED'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {doc.verificationStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewDocument(doc.id)}
                    className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-bg"
                  >
                    View
                  </button>
                  {doc.verificationStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={() => verifyDocMutation.mutate({ documentId: doc.id, verificationStatus: 'VERIFIED' })}
                      disabled={verifyDocMutation.isPending}
                      className="text-sm px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </button>
                  )}
                  {doc.verificationStatus !== 'REJECTED' && (
                    <>
                      {rejectingDocId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Rejection reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-36 px-2 py-1 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-bg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!rejectReason.trim()) {
                                toast.error('Enter a reason');
                                return;
                              }
                              verifyDocMutation.mutate(
                                { documentId: doc.id, verificationStatus: 'REJECTED', rejectionReason: rejectReason },
                                { onSettled: () => { setRejectingDocId(null); setRejectReason(''); } }
                              );
                            }}
                            disabled={verifyDocMutation.isPending}
                            className="text-sm px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          >
                            Submit
                          </button>
                          <button type="button" onClick={() => { setRejectingDocId(null); setRejectReason(''); }} className="text-sm text-gray-500">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRejectingDocId(doc.id)}
                          className="text-sm px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 inline-flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
