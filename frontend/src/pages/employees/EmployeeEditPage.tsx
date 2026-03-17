import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  CreditCard,
  Users,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  PlusCircle,
  Save,
  X,
} from 'lucide-react';
import { api } from '../../api/client';

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
  externalRole?: string | null;
  externalSubRole?: string | null;
  dateOfJoining: string | null;
  employmentType: string;
  status: string;
  workLocation: string | null;
  departmentName: string | null;
  departmentId: number | null;
  onboarding: {
    personalInfo: PersonalInfo | null;
    bankDetail: BankDetail | null;
    emergencyContacts: EmergencyContact[];
    educations: Education[];
    experiences: Experience[];
  } | null;
};

type Res = { success: true; data: EmployeeDetailType };
type Dept = { id: number; name: string };

const EMPLOYMENT_TYPES = ['full_time', 'contract', 'intern', 'part_time'];
const STATUSES = ['active', 'inactive', 'terminated', 'on_leave'];

function emptyEmergencyContact(): EmergencyContact {
  return { contactName: '', relationship: '', phone: '', alternatePhone: null, email: null, address: null, isPrimary: false };
}
function emptyEducation(): Education {
  return {
    qualification: '', institution: '', universityBoard: '', yearOfPassing: new Date().getFullYear(),
    percentageOrCgpa: null, divisionOrClass: null, specialization: null, startDate: null, endDate: null,
  };
}
function emptyExperience(): Experience {
  return {
    companyName: '', designation: '', employmentType: 'full_time', startDate: '', endDate: '',
    isCurrent: false, reasonForLeaving: null, lastDrawnSalary: null, reportingManagerName: null,
  };
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-dark-text"
      />
    </div>
  );
}

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [core, setCore] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    reportingTo: '',
    externalRole: 'employee',
    externalSubRole: '',
    dateOfJoining: '',
    employmentType: 'full_time',
    workLocation: '',
    status: 'active',
    departmentId: '',
    dateOfBirth: '',
    gender: '',
  });
  const [personal, setPersonal] = useState<PersonalInfo | null>(null);
  const [bank, setBank] = useState<BankDetail | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [workLocationOther, setWorkLocationOther] = useState('');

  const { data: apiRes, isLoading, error } = useQuery({
    queryKey: ['employees', id],
    queryFn: () => api.get<Res>(`/employees/${id}`),
    enabled: !!id,
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<{ success: true; data: { id: number; name: string }[] }>('/departments').then((r) => r.data),
    enabled: !!id,
  });
  const { data: employeesList } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get<{ success: true; data: { id: string; employeeCode: string; firstName: string; lastName: string }[] }>('/employees', { limit: '500' }).then((r) => r.data),
    enabled: !!id,
  });
  const { data: designationsList } = useQuery({
    queryKey: ['employees-designations'],
    queryFn: () => api.get<{ success: true; data: string[] }>('/employees/designations').then((r) => r.data),
    enabled: !!id,
  });
  const { data: workLocationsList } = useQuery({
    queryKey: ['employees-work-locations'],
    queryFn: () => api.get<{ success: true; data: string[] }>('/employees/work-locations').then((r) => r.data),
    enabled: !!id,
  });
  const { data: subadminTitlesResp } = useQuery({
    queryKey: ['subadmin-titles'],
    queryFn: () =>
      api.get<{ success: true; data: { titles: string[] } }>('/settings/api-access/subadmin-titles').then((r) => r.data),
    enabled: !!id,
  });
  const emp = (apiRes as Res)?.data ?? null;
  const deptList: Dept[] = Array.isArray(departments) ? departments : [];
  const employeeOptions = Array.isArray(employeesList) ? employeesList : [];
  const designationOptions = Array.isArray(designationsList) ? designationsList : [];
  const workLocationOptions = Array.isArray(workLocationsList) ? workLocationsList : [];
  const subadminTitles = subadminTitlesResp?.titles ?? [];
  const reportingOptions = emp ? employeeOptions.filter((e) => e.employeeCode !== emp.employeeCode) : employeeOptions;

  useEffect(() => {
    if (!emp) return;
    setCore({
      firstName: emp.firstName ?? '',
      lastName: emp.lastName ?? '',
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      designation: emp.designation ?? '',
      reportingTo: emp.reportingTo ?? '',
      externalRole: (emp.externalRole as string) ?? 'employee',
      externalSubRole: (emp.externalSubRole as string) ?? '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '',
      employmentType: emp.employmentType ?? 'full_time',
      workLocation: emp.workLocation ?? '',
      status: emp.status ?? 'active',
      departmentId: emp.departmentId != null ? String(emp.departmentId) : '',
      dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '',
      gender: emp.gender ?? '',
    });
    setPersonal(emp.onboarding?.personalInfo ?? null);
    setBank(emp.onboarding?.bankDetail ?? null);
    setEmergencyContacts(emp.onboarding?.emergencyContacts?.length ? [...emp.onboarding.emergencyContacts] : []);
    setEducations(emp.onboarding?.educations?.length ? [...emp.onboarding.educations] : []);
    setExperiences(emp.onboarding?.experiences?.length ? [...emp.onboarding.experiences] : []);
  }, [emp]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No employee ID');
      await api.patch(`/employees/${id}`, {
        firstName: core.firstName.trim(),
        lastName: core.lastName.trim(),
        email: core.email.trim(),
        phone: core.phone.trim() || null,
        dateOfBirth: core.dateOfBirth || null,
        gender: core.gender.trim() || null,
        departmentId: core.departmentId ? parseInt(core.departmentId, 10) : null,
        designation: core.designation.trim() || null,
        reportingTo: core.reportingTo.trim() || null,
        externalRole: core.externalRole,
        externalSubRole: core.externalRole === 'subadmin' ? (core.externalSubRole.trim() || null) : null,
        dateOfJoining: core.dateOfJoining || null,
        employmentType: core.employmentType,
        workLocation: (core.workLocation === '__other__' ? workLocationOther : core.workLocation).trim() || null,
        status: core.status,
      });
      await api.put(`/employees/${id}/profile`, {
        personalInfo: personal ?? undefined,
        bankDetail: bank ?? undefined,
        emergencyContacts: emergencyContacts.length ? emergencyContacts : undefined,
        educations: educations.length ? educations : undefined,
        experiences: experiences.length ? experiences : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', id] });
      toast.success('Employee details saved');
      navigate(`/employees/${id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!id) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">Invalid employee ID</p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">← Back</Link>
      </div>
    );
  }
  if (isLoading) return <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>;
  if (error || !emp) {
    return (
      <div>
        <p className="text-red-600 dark:text-red-400">{error instanceof Error ? error.message : 'Not found'}</p>
        <Link to="/employees" className="text-light-primary dark:text-dark-primary mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  const sectionCls = 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm mb-6';
  const sectionTitle = 'text-sm font-medium text-gray-500 dark:text-dark-textSecondary mb-3 flex items-center gap-2';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/employees/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to employee
        </Link>
        <button
          type="button"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save all
        </button>
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><User className="w-4 h-4" /> Basic & employment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name *" value={core.firstName} onChange={(v) => setCore((c) => ({ ...c, firstName: v }))} />
          <Input label="Last name *" value={core.lastName} onChange={(v) => setCore((c) => ({ ...c, lastName: v }))} />
          <Input label="Email *" value={core.email} onChange={(v) => setCore((c) => ({ ...c, email: v }))} type="email" />
          <Input label="Phone" value={core.phone} onChange={(v) => setCore((c) => ({ ...c, phone: v }))} />
          <Input label="Date of birth" value={core.dateOfBirth} onChange={(v) => setCore((c) => ({ ...c, dateOfBirth: v }))} type="date" />
          <Input label="Gender" value={core.gender} onChange={(v) => setCore((c) => ({ ...c, gender: v }))} />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Department</label>
            <select
              value={core.departmentId}
              onChange={(e) => setCore((c) => ({ ...c, departmentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">—</option>
              {deptList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Designation</label>
            <input
              list="designation-list"
              value={core.designation}
              onChange={(e) => setCore((c) => ({ ...c, designation: e.target.value }))}
              placeholder="Select or type new designation"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm text-gray-900 dark:text-dark-text"
            />
            <datalist id="designation-list">
              {designationOptions.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Reporting to</label>
            <select
              value={core.reportingTo}
              onChange={(e) => setCore((c) => ({ ...c, reportingTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">— None —</option>
              {reportingOptions.map((e) => (
                <option key={e.id} value={e.employeeCode}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
          <Input label="Date of joining" value={core.dateOfJoining} onChange={(v) => setCore((c) => ({ ...c, dateOfJoining: v }))} type="date" />
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Employment type</label>
            <select
              value={core.employmentType}
              onChange={(e) => setCore((c) => ({ ...c, employmentType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Role</label>
            <select
              value={core.externalRole}
              onChange={(e) => setCore((c) => ({ ...c, externalRole: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              {['employee', 'manager', 'admin', 'subadmin'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {core.externalRole === 'subadmin' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Subadmin title</label>
              <select
                value={core.externalSubRole}
                onChange={(e) => setCore((c) => ({ ...c, externalSubRole: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              >
                <option value="">— Select —</option>
                {subadminTitles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-dark-textSecondary">
                Manage titles in Settings → API Manager.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Work location</label>
            <select
              value={core.workLocation && workLocationOptions.includes(core.workLocation) ? core.workLocation : core.workLocation ? '__other__' : ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__other__') setCore((c) => ({ ...c, workLocation: '__other__' }));
                else setCore((c) => ({ ...c, workLocation: v }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">— None —</option>
              {workLocationOptions.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
              <option value="__other__">— Other (type below) —</option>
            </select>
            {(core.workLocation === '__other__' || (core.workLocation && !workLocationOptions.includes(core.workLocation))) && (
              <input
                type="text"
                value={core.workLocation === '__other__' ? workLocationOther : core.workLocation}
                onChange={(e) => (core.workLocation === '__other__' ? setWorkLocationOther(e.target.value) : setCore((c) => ({ ...c, workLocation: e.target.value })))}
                placeholder="Enter work location"
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-dark-textSecondary mb-1">Status</label>
            <select
              value={core.status}
              onChange={(e) => setCore((c) => ({ ...c, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><User className="w-4 h-4" /> Personal details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personal ? (
            <>
              <Input label="Personal email" value={personal.personalEmail} onChange={(v) => setPersonal((p) => p ? { ...p, personalEmail: v } : null)} />
              <Input label="Personal mobile" value={personal.personalMobile} onChange={(v) => setPersonal((p) => p ? { ...p, personalMobile: v } : null)} />
              <Input label="Alternate mobile" value={personal.alternateMobile ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, alternateMobile: v || null } : null)} />
              <Input label="Marital status" value={personal.maritalStatus ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, maritalStatus: v || null } : null)} />
              <Input label="Nationality" value={personal.nationality} onChange={(v) => setPersonal((p) => p ? { ...p, nationality: v } : null)} />
              <Input label="Blood group" value={personal.bloodGroup ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, bloodGroup: v || null } : null)} />
              <Input label="PAN" value={personal.panNumber ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, panNumber: v || null } : null)} />
              <Input label="Aadhaar" value={personal.aadhaarNumber ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, aadhaarNumber: v || null } : null)} />
              <Input label="Passport" value={personal.passportNumber ?? ''} onChange={(v) => setPersonal((p) => p ? { ...p, passportNumber: v || null } : null)} />
              <div className="sm:col-span-2">
                <Input label="Current address" value={personal.currentAddress} onChange={(v) => setPersonal((p) => p ? { ...p, currentAddress: v } : null)} />
              </div>
              <div className="sm:col-span-2">
                <Input label="Permanent address" value={personal.permanentAddress} onChange={(v) => setPersonal((p) => p ? { ...p, permanentAddress: v } : null)} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary sm:col-span-2">
              No personal info yet. Add below to create.
            </p>
          )}
          {!personal && (
            <button
              type="button"
              onClick={() => setPersonal({
                firstName: core.firstName, lastName: core.lastName, middleName: null, dateOfBirth: core.dateOfBirth || '', gender: core.gender || '',
                maritalStatus: null, nationality: '', bloodGroup: null, personalEmail: core.email, personalMobile: core.phone || '',
                alternateMobile: null, currentAddress: '', currentCity: '', currentState: '', currentPincode: '', currentCountry: 'India',
                permanentAddress: '', permanentCity: '', permanentState: '', permanentPincode: '', permanentCountry: 'India',
                panNumber: null, aadhaarNumber: null, passportNumber: null,
              })}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-dark-border text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
              <PlusCircle className="w-4 h-4" /> Add personal details
            </button>
          )}
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><CreditCard className="w-4 h-4" /> Bank details</h2>
        {bank ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Account holder" value={bank.accountHolderName} onChange={(v) => setBank((b) => b ? { ...b, accountHolderName: v } : null)} />
            <Input label="Bank name" value={bank.bankName} onChange={(v) => setBank((b) => b ? { ...b, bankName: v } : null)} />
            <Input label="Branch" value={bank.branchName ?? ''} onChange={(v) => setBank((b) => b ? { ...b, branchName: v || null } : null)} />
            <Input label="Account number" value={bank.accountNumber} onChange={(v) => setBank((b) => b ? { ...b, accountNumber: v } : null)} />
            <Input label="IFSC" value={bank.ifscCode} onChange={(v) => setBank((b) => b ? { ...b, ifscCode: v } : null)} />
            <Input label="Account type" value={bank.accountType} onChange={(v) => setBank((b) => b ? { ...b, accountType: v } : null)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBank({ accountHolderName: '', bankName: '', branchName: null, accountNumber: '', ifscCode: '', accountType: 'savings' })}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-dark-border text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <PlusCircle className="w-4 h-4" /> Add bank details
          </button>
        )}
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><Users className="w-4 h-4" /> Emergency contacts</h2>
        <div className="space-y-3">
          {emergencyContacts.map((ec, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Contact {i + 1}</span>
                <button type="button" onClick={() => setEmergencyContacts((list) => list.filter((_, j) => j !== i))} className="text-red-600 hover:underline text-sm flex items-center gap-1"><X className="w-4 h-4" /> Remove</button>
              </div>
              <Input label="Name" value={ec.contactName} onChange={(v) => setEmergencyContacts((list) => list.map((e, j) => j === i ? { ...e, contactName: v } : e))} />
              <Input label="Relationship" value={ec.relationship} onChange={(v) => setEmergencyContacts((list) => list.map((e, j) => j === i ? { ...e, relationship: v } : e))} />
              <Input label="Phone" value={ec.phone} onChange={(v) => setEmergencyContacts((list) => list.map((e, j) => j === i ? { ...e, phone: v } : e))} />
              <Input label="Email" value={ec.email ?? ''} onChange={(v) => setEmergencyContacts((list) => list.map((e, j) => j === i ? { ...e, email: v || null } : e))} />
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={ec.isPrimary} onChange={(e) => setEmergencyContacts((list) => list.map((em, j) => j === i ? { ...em, isPrimary: e.target.checked } : em))} />
                <span className="text-sm">Primary</span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setEmergencyContacts((list) => [...list, emptyEmergencyContact()])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-dark-border text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <PlusCircle className="w-4 h-4" /> Add emergency contact
          </button>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><GraduationCap className="w-4 h-4" /> Education</h2>
        <div className="space-y-3">
          {educations.map((ed, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Education {i + 1}</span>
                <button type="button" onClick={() => setEducations((list) => list.filter((_, j) => j !== i))} className="text-red-600 hover:underline text-sm flex items-center gap-1"><X className="w-4 h-4" /> Remove</button>
              </div>
              <Input label="Qualification" value={ed.qualification} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, qualification: v } : e))} />
              <Input label="Institution" value={ed.institution} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, institution: v } : e))} />
              <Input label="University / Board" value={ed.universityBoard} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, universityBoard: v } : e))} />
              <Input label="Year of passing" value={String(ed.yearOfPassing)} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, yearOfPassing: parseInt(v, 10) || new Date().getFullYear() } : e))} type="number" />
              <Input label="% / CGPA" value={ed.percentageOrCgpa ?? ''} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, percentageOrCgpa: v || null } : e))} />
              <Input label="Specialization" value={ed.specialization ?? ''} onChange={(v) => setEducations((list) => list.map((e, j) => j === i ? { ...e, specialization: v || null } : e))} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setEducations((list) => [...list, emptyEducation()])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-dark-border text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <PlusCircle className="w-4 h-4" /> Add education
          </button>
        </div>
      </div>

      <div className={sectionCls}>
        <h2 className={sectionTitle}><BriefcaseIcon className="w-4 h-4" /> Experience</h2>
        <div className="space-y-3">
          {experiences.map((ex, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Experience {i + 1}</span>
                <button type="button" onClick={() => setExperiences((list) => list.filter((_, j) => j !== i))} className="text-red-600 hover:underline text-sm flex items-center gap-1"><X className="w-4 h-4" /> Remove</button>
              </div>
              <Input label="Company" value={ex.companyName} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, companyName: v } : e))} />
              <Input label="Designation" value={ex.designation} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, designation: v } : e))} />
              <Input label="Employment type" value={ex.employmentType} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, employmentType: v } : e))} />
              <Input label="Start date" value={ex.startDate} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, startDate: v } : e))} type="date" />
              <Input label="End date" value={ex.endDate} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, endDate: v } : e))} type="date" />
              <Input label="Reason for leaving" value={ex.reasonForLeaving ?? ''} onChange={(v) => setExperiences((list) => list.map((e, j) => j === i ? { ...e, reasonForLeaving: v || null } : e))} className="sm:col-span-2" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setExperiences((list) => [...list, emptyExperience()])}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-dark-border text-sm text-gray-600 dark:text-dark-textSecondary hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <PlusCircle className="w-4 h-4" /> Add experience
          </button>
        </div>
      </div>
    </div>
  );
}
