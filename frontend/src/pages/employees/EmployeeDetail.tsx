import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  CreditCard,
  Users,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  FileText,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { api } from '../../api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

type PersonalInfo = {
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string | null;
  nationality: string;
  bloodGroup: string | null;
  personalEmail: string;
  personalMobile: string;
  alternateMobile: string | null;
  currentAddress: string;
  currentCity: string;
  currentState: string;
  currentPincode: string;
  currentCountry: string;
  permanentAddress: string;
  permanentCity: string;
  permanentState: string;
  permanentPincode: string;
  permanentCountry: string;
  panNumber: string | null;
  aadhaarNumber: string | null;
  passportNumber: string | null;
};

type BankDetail = {
  accountHolderName: string;
  bankName: string;
  branchName: string | null;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
};

type EmergencyContact = {
  contactName: string;
  relationship: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  isPrimary: boolean;
};

type Education = {
  qualification: string;
  institution: string;
  universityBoard: string;
  yearOfPassing: number;
  percentageOrCgpa: string | null;
  divisionOrClass: string | null;
  specialization: string | null;
  startDate: string | null;
  endDate: string | null;
};

type Experience = {
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  reasonForLeaving: string | null;
  lastDrawnSalary: string | null;
  reportingManagerName: string | null;
};

type Doc = {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: string;
};

type OnboardingData = {
  personalInfo: PersonalInfo | null;
  bankDetail: BankDetail | null;
  emergencyContacts: EmergencyContact[];
  educations: Education[];
  experiences: Experience[];
  documents: Doc[];
};

type EmployeeDetailType = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  designation: string | null;
  reportingTo: string | null;
  dateOfJoining: string | null;
  employmentType: string;
  status: string;
  workLocation: string | null;
  departmentName: string | null;
  departmentId: number | null;
  createdAt: string;
  onboarding: OnboardingData | null;
};

type Res = { success: true; data: EmployeeDetailType };

function formatDate(s: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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

function buildDocFileUrl(docId: string): string {
  const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`;
  return `${base}/onboarding/documents/${docId}/file`;
}

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: apiRes, isLoading, error } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get<Res>(`/employees/${id}`),
    enabled: !!id,
  });

  const emp = (apiRes as Res)?.data ?? null;

  function handleViewDocument(docId: string) {
    const token = localStorage.getItem('hrms-auth')
      ? (JSON.parse(localStorage.getItem('hrms-auth') ?? '{}')?.state?.accessToken as string)
      : null;
    const url = buildDocFileUrl(docId);
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        window.open(u, '_blank');
      })
      .catch(() => {});
  }

  if (!id) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">Invalid employee ID</p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load employee'}
        </p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }
  if (!emp) return null;

  const ob = emp.onboarding;
  const personal = ob?.personalInfo;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/employees"
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Employees
        </Link>
        <Link
          to={`/employees/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-gray-700 dark:text-dark-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-bg"
        >
          <Pencil className="w-4 h-4" />
          Edit details
        </Link>
      </div>

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-light-primary/10 dark:bg-dark-primary/20">
            <User className="w-8 h-8 text-light-primary dark:text-dark-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
              {emp.firstName} {emp.lastName}
            </h1>
            <p className="font-mono text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
              {emp.employeeCode}
            </p>
            <span
              className={`inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                emp.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {emp.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section>
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Email</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Phone</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.phone ?? personal?.personalMobile ?? '—'}</dd>
              </div>
              {personal?.alternateMobile && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Alternate phone</dt>
                  <dd className="text-gray-900 dark:text-dark-text">{personal.alternateMobile}</dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Department</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.departmentName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Designation</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.designation ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Type</dt>
                <dd className="text-gray-900 dark:text-dark-text capitalize">
                  {emp.employmentType.replace('_', ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Date of joining</dt>
                <dd className="text-gray-900 dark:text-dark-text">{formatDate(emp.dateOfJoining)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Work location</dt>
                <dd className="text-gray-900 dark:text-dark-text">{emp.workLocation ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="sm:col-span-2">
            <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Date of birth</dt>
                <dd className="text-gray-900 dark:text-dark-text">{formatDate(personal?.dateOfBirth ?? emp.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Gender</dt>
                <dd className="text-gray-900 dark:text-dark-text">{personal?.gender ?? emp.gender ?? '—'}</dd>
              </div>
              {personal && (
                <>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Marital status</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.maritalStatus ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Nationality</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.nationality}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Blood group</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.bloodGroup ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">PAN</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.panNumber ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Aadhaar</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.aadhaarNumber ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Passport</dt>
                    <dd className="text-gray-900 dark:text-dark-text">{personal.passportNumber ?? '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Current address</dt>
                    <dd className="text-gray-900 dark:text-dark-text">
                      {personal.currentAddress}, {personal.currentCity}, {personal.currentState} {personal.currentPincode}, {personal.currentCountry}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Permanent address</dt>
                    <dd className="text-gray-900 dark:text-dark-text">
                      {personal.permanentAddress}, {personal.permanentCity}, {personal.permanentState} {personal.permanentPincode}, {personal.permanentCountry}
                    </dd>
                  </div>
                </>
              )}
              {!personal && (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Reporting to</dt>
                  <dd className="text-gray-900 dark:text-dark-text">{emp.reportingTo ?? '—'}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      {ob?.bankDetail && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Bank details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Account holder</dt>
              <dd className="text-gray-900 dark:text-dark-text">{ob.bankDetail.accountHolderName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Bank</dt>
              <dd className="text-gray-900 dark:text-dark-text">{ob.bankDetail.bankName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Branch</dt>
              <dd className="text-gray-900 dark:text-dark-text">{ob.bankDetail.branchName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Account number</dt>
              <dd className="text-gray-900 dark:text-dark-text font-mono">{ob.bankDetail.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">IFSC</dt>
              <dd className="text-gray-900 dark:text-dark-text font-mono">{ob.bankDetail.ifscCode}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-dark-textSecondary">Account type</dt>
              <dd className="text-gray-900 dark:text-dark-text capitalize">{ob.bankDetail.accountType}</dd>
            </div>
          </dl>
        </div>
      )}

      {ob?.emergencyContacts && ob.emergencyContacts.length > 0 && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Emergency contacts
          </h2>
          <ul className="space-y-3">
            {ob.emergencyContacts.map((ec, i) => (
              <li key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg/50">
                <p className="font-medium text-gray-900 dark:text-dark-text">
                  {ec.contactName} {ec.isPrimary && <span className="text-xs text-gray-500">(Primary)</span>}
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
                  {ec.relationship} · {ec.phone}
                  {ec.email && ` · ${ec.email}`}
                </p>
                {ec.address && <p className="text-xs text-gray-500 mt-1">{ec.address}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ob?.educations && ob.educations.length > 0 && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Education
          </h2>
          <ul className="space-y-3">
            {ob.educations.map((ed, i) => (
              <li key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg/50">
                <p className="font-medium text-gray-900 dark:text-dark-text">{ed.qualification}</p>
                <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
                  {ed.institution}, {ed.universityBoard} · {ed.yearOfPassing}
                </p>
                {(ed.percentageOrCgpa || ed.specialization) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {ed.percentageOrCgpa && `${ed.percentageOrCgpa}`}
                    {ed.divisionOrClass && ` · ${ed.divisionOrClass}`}
                    {ed.specialization && ` · ${ed.specialization}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ob?.experiences && ob.experiences.length > 0 && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4" />
            Experience
          </h2>
          <ul className="space-y-3">
            {ob.experiences.map((ex, i) => (
              <li key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg/50">
                <p className="font-medium text-gray-900 dark:text-dark-text">{ex.companyName}</p>
                <p className="text-sm text-gray-600 dark:text-dark-textSecondary">
                  {ex.designation} · {ex.employmentType.replace('_', ' ')} · {formatDate(ex.startDate)} – {formatDate(ex.endDate)}
                </p>
                {ex.reasonForLeaving && <p className="text-xs text-gray-500 mt-1">{ex.reasonForLeaving}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ob?.documents && ob.documents.length > 0 && (
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents (read-only)
          </h2>
          <ul className="space-y-2">
            {ob.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-border"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-text text-sm">
                    {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-textSecondary">{doc.fileName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewDocument(doc.id)}
                  className="inline-flex items-center gap-1 text-sm text-light-primary dark:text-dark-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {emp && !ob && (
        <p className="text-sm text-gray-500 dark:text-dark-textSecondary italic">
          No onboarding data for this employee. Details above are from the employee record only.
        </p>
      )}
    </div>
  );
}
