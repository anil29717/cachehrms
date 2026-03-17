import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CheckCircle, Mail, ArrowRight, Loader2, AlertCircle, Upload, FileText, XCircle } from 'lucide-react';
import { api } from '../../api/client';

const STAGE_NAMES: Record<number, string> = {
  1: 'Offer acceptance',
  2: 'Personal information',
  3: 'Document upload',
  4: 'Bank details',
  5: 'Emergency contact',
  6: 'Education details',
  7: 'Experience details',
  8: 'ID generation',
  9: 'IT setup',
  10: 'HR review & activation',
};

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
  spouseName: string | null;
  spouseDateOfBirth: string | null;
  childrenNames: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_LEN = 10;
const AADHAAR_LEN = 12;
const PINCODE_LEN = 6;

type OnboardingDocument = {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: string;
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

type OnboardingData = {
  id: string;
  candidateEmail: string;
  employeeType: string;
  currentStage: number;
  status: string;
  designation: string | null;
  department: { name: string } | null;
  personalInfo: PersonalInfo | null;
  documents?: OnboardingDocument[];
  bankDetail?: BankDetail | null;
  emergencyContacts?: EmergencyContact[];
  educations?: Education[];
  experiences?: Experience[];
};

const DOC_TYPE_LABELS: Record<string, string> = {
  photo: 'Passport size photo',
  identity_proof: 'Identity proof (Aadhaar/Passport/Voter ID)',
  address_proof: 'Address proof',
  pan_card: 'PAN card',
  passport: 'Passport',
  resume: 'Resume / CV',
  signed_offer_letter: 'Signed offer letter',
  cancel_cheque: 'Cancelled cheque',
  class_10_marksheet: 'Class 10 marksheet',
  class_12_marksheet: 'Class 12 marksheet',
  marksheet: 'Graduation marksheet',
  degree_certificate: 'Degree certificate',
  experience_letter: 'Experience / Relieving letter',
  salary_slip: 'Salary slip(s)',
};

const DOC_TYPES_COMMON = ['photo', 'identity_proof', 'address_proof', 'pan_card', 'resume', 'signed_offer_letter', 'cancel_cheque', 'passport'];
const DOC_TYPES_FRESHER = ['class_10_marksheet', 'class_12_marksheet', 'marksheet', 'degree_certificate'];
const DOC_TYPES_SWITCHING = ['experience_letter', 'salary_slip'];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];

function toDateInput(d: string | Date | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function OnboardingJoinPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Indian',
    bloodGroup: '',
    personalEmail: '',
    personalMobile: '',
    alternateMobile: '',
    currentAddress: '',
    currentCity: '',
    currentState: '',
    currentPincode: '',
    currentCountry: 'India',
    permanentAddress: '',
    permanentCity: '',
    permanentState: '',
    permanentPincode: '',
    permanentCountry: 'India',
    isSameAsCurrent: false,
    panNumber: '',
    aadhaarNumber: '',
    passportNumber: '',
    spouseName: '',
    spouseDateOfBirth: '',
    childrenNames: '',
  });

  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'savings',
  });
  const [emergencyForm, setEmergencyForm] = useState({
    primaryContactName: '',
    primaryRelationship: '',
    primaryPhone: '',
    primaryAlternatePhone: '',
    primaryEmail: '',
    secondaryContactName: '',
    secondaryRelationship: 'Other',
    secondaryPhone: '',
    secondaryAlternatePhone: '',
    secondaryEmail: '',
  });
  const [educationEntries, setEducationEntries] = useState<Array<{
    qualification: string;
    institution: string;
    universityBoard: string;
    yearOfPassing: string;
    percentageOrCgpa: string;
    divisionOrClass: string;
    specialization: string;
    startDate: string;
    endDate: string;
  }>>([{ qualification: '', institution: '', universityBoard: '', yearOfPassing: String(new Date().getFullYear()), percentageOrCgpa: '', divisionOrClass: '', specialization: '', startDate: '', endDate: '' }]);
  const [experienceEntries, setExperienceEntries] = useState<Array<{
    companyName: string;
    designation: string;
    employmentType: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    reasonForLeaving: string;
    lastDrawnSalary: string;
    reportingManagerName: string;
  }>>([{ companyName: '', designation: '', employmentType: 'full_time', startDate: '', endDate: '', isCurrent: false, reasonForLeaving: '', lastDrawnSalary: '', reportingManagerName: '' }]);

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['onboarding-join', token],
    queryFn: () =>
      api.get<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}`),
    enabled: !!token,
    retry: false,
  });

  const onboarding = (apiResponse as { data?: OnboardingData } | undefined)?.data;

  useEffect(() => {
    if (!onboarding?.personalInfo) return;
    const p = onboarding.personalInfo as PersonalInfo;
    setForm((prev) => ({
      ...prev,
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      middleName: p.middleName ?? '',
      dateOfBirth: toDateInput(p.dateOfBirth),
      gender: p.gender ?? '',
      maritalStatus: p.maritalStatus ?? '',
      nationality: p.nationality ?? 'Indian',
      bloodGroup: p.bloodGroup ?? '',
      personalEmail: p.personalEmail ?? '',
      personalMobile: p.personalMobile ?? '',
      alternateMobile: p.alternateMobile ?? '',
      currentAddress: p.currentAddress ?? '',
      currentCity: p.currentCity ?? '',
      currentState: p.currentState ?? '',
      currentPincode: p.currentPincode ?? '',
      currentCountry: p.currentCountry ?? 'India',
      permanentAddress: p.permanentAddress ?? '',
      permanentCity: p.permanentCity ?? '',
      permanentState: p.permanentState ?? '',
      permanentPincode: p.permanentPincode ?? '',
      permanentCountry: p.permanentCountry ?? 'India',
      panNumber: p.panNumber ?? '',
      aadhaarNumber: p.aadhaarNumber ?? '',
      passportNumber: p.passportNumber ?? '',
      spouseName: (p as { spouseName?: string | null }).spouseName ?? '',
      spouseDateOfBirth: (p as { spouseDateOfBirth?: string | Date | null }).spouseDateOfBirth ? toDateInput((p as { spouseDateOfBirth: string | Date }).spouseDateOfBirth) : '',
      childrenNames: (p as { childrenNames?: string | null }).childrenNames ?? '',
    }));
  }, [onboarding?.personalInfo]);

  useEffect(() => {
    if (onboarding?.candidateEmail && !form.personalEmail) setForm((f) => ({ ...f, personalEmail: onboarding.candidateEmail }));
  }, [onboarding?.candidateEmail, form.personalEmail]);

  useEffect(() => {
    const b = onboarding?.bankDetail;
    if (b) setBankForm((prev) => ({ ...prev, accountHolderName: b.accountHolderName ?? '', bankName: b.bankName ?? '', branchName: b.branchName ?? '', accountNumber: b.accountNumber ?? '', confirmAccountNumber: b.accountNumber ?? '', ifscCode: b.ifscCode ?? '', accountType: b.accountType ?? 'savings' }));
  }, [onboarding?.bankDetail]);
  useEffect(() => {
    const ec = onboarding?.emergencyContacts ?? [];
    const primary = ec.find((c) => c.isPrimary) ?? ec[0];
    const secondary = ec.find((c) => !c.isPrimary);
    if (primary) setEmergencyForm((prev) => ({ ...prev, primaryContactName: primary.contactName ?? '', primaryRelationship: primary.relationship ?? '', primaryPhone: primary.phone ?? '', primaryAlternatePhone: primary.alternatePhone ?? '', primaryEmail: primary.email ?? '' }));
    if (secondary) setEmergencyForm((prev) => ({ ...prev, secondaryContactName: secondary.contactName ?? '', secondaryRelationship: secondary.relationship ?? 'Other', secondaryPhone: secondary.phone ?? '', secondaryAlternatePhone: secondary.alternatePhone ?? '', secondaryEmail: secondary.email ?? '' }));
  }, [onboarding?.emergencyContacts]);
  useEffect(() => {
    const ed = onboarding?.educations;
    if (ed?.length) setEducationEntries(ed.map((e) => ({ qualification: e.qualification ?? '', institution: e.institution ?? '', universityBoard: e.universityBoard ?? '', yearOfPassing: String(e.yearOfPassing ?? ''), percentageOrCgpa: e.percentageOrCgpa ?? '', divisionOrClass: e.divisionOrClass ?? '', specialization: e.specialization ?? '', startDate: e.startDate ? toDateInput(e.startDate) : '', endDate: e.endDate ? toDateInput(e.endDate) : '' })));
  }, [onboarding?.educations]);
  useEffect(() => {
    const ex = onboarding?.experiences;
    if (ex?.length) setExperienceEntries(ex.map((e) => ({ companyName: e.companyName ?? '', designation: e.designation ?? '', employmentType: e.employmentType ?? 'full_time', startDate: toDateInput(e.startDate), endDate: toDateInput(e.endDate), isCurrent: e.isCurrent ?? false, reasonForLeaving: e.reasonForLeaving ?? '', lastDrawnSalary: e.lastDrawnSalary ?? '', reportingManagerName: e.reportingManagerName ?? '' })));
  }, [onboarding?.experiences]);

  const submitPersonalMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.put<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/personal-info`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] });
      toast.success('Personal information saved. Next: document upload.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ documentType, file }: { documentType: string; file: File }) => {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('file', file);
      return api.uploadFile<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/documents`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] });
      toast.success('Document uploaded.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const completeDocUploadMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/complete-document-upload`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] });
      toast.success('You can now fill bank details.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitBankMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.put<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/bank`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] }); toast.success('Bank details saved.'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const submitEmergencyMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.put<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/emergency-contacts`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] }); toast.success('Emergency contacts saved.'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const submitEducationsMutation = useMutation({
    mutationFn: (body: { educations: Record<string, unknown>[] }) => api.put<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/educations`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] }); toast.success('Education details saved.'); },
    onError: (err: Error) => toast.error(err.message),
  });
  const submitExperiencesMutation = useMutation({
    mutationFn: (body: { experiences: Record<string, unknown>[] }) => api.put<{ success: true; data: OnboardingData }>(`/onboarding/by-token/${token}/experiences`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboarding-join', token] }); toast.success('Experience details saved.'); },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmitPersonal(e: React.FormEvent) {
    e.preventDefault();
    const mobile = form.personalMobile.replace(/\D/g, '');
    if (mobile.length !== 10) {
      toast.error('Personal mobile must be exactly 10 digits');
      return;
    }
    if (form.alternateMobile.trim()) {
      const alt = form.alternateMobile.replace(/\D/g, '');
      if (alt.length !== 10) {
        toast.error('Emergency contact number must be exactly 10 digits');
        return;
      }
    }
    if (!EMAIL_REGEX.test(form.personalEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (form.currentPincode.length !== PINCODE_LEN || !/^\d+$/.test(form.currentPincode)) {
      toast.error('Current pincode must be exactly 6 digits');
      return;
    }
    const permPincode = form.isSameAsCurrent ? form.currentPincode : form.permanentPincode;
    if (permPincode.length !== PINCODE_LEN || !/^\d+$/.test(permPincode)) {
      toast.error('Permanent pincode must be exactly 6 digits');
      return;
    }
    if (form.panNumber.trim() && form.panNumber.trim().length !== PAN_LEN) {
      toast.error('PAN must be exactly 10 characters');
      return;
    }
    if (form.aadhaarNumber.trim()) {
      const aadhaar = form.aadhaarNumber.replace(/\D/g, '');
      if (aadhaar.length !== AADHAAR_LEN) {
        toast.error('Aadhaar must be exactly 12 digits');
        return;
      }
    }
    const permanent = form.isSameAsCurrent
      ? {
          permanentAddress: form.currentAddress,
          permanentCity: form.currentCity,
          permanentState: form.currentState,
          permanentPincode: form.currentPincode,
          permanentCountry: form.currentCountry,
        }
      : {};
    submitPersonalMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || undefined,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      maritalStatus: form.maritalStatus || undefined,
      nationality: form.nationality.trim(),
      bloodGroup: form.bloodGroup || undefined,
      personalEmail: form.personalEmail.trim(),
      personalMobile: form.personalMobile.replace(/\D/g, ''),
      alternateMobile: form.alternateMobile.trim() ? form.alternateMobile.replace(/\D/g, '') : undefined,
      currentAddress: form.currentAddress.trim(),
      currentCity: form.currentCity.trim(),
      currentState: form.currentState.trim(),
      currentPincode: form.currentPincode.trim(),
      currentCountry: form.currentCountry.trim(),
      permanentAddress: (permanent.permanentAddress ?? form.permanentAddress).trim(),
      permanentCity: (permanent.permanentCity ?? form.permanentCity).trim(),
      permanentState: (permanent.permanentState ?? form.permanentState).trim(),
      permanentPincode: (permanent.permanentPincode ?? form.permanentPincode).trim(),
      permanentCountry: (permanent.permanentCountry ?? form.permanentCountry).trim(),
      isSameAsCurrent: form.isSameAsCurrent,
      panNumber: form.panNumber.trim() || undefined,
      aadhaarNumber: form.aadhaarNumber.trim() ? form.aadhaarNumber.replace(/\D/g, '') : undefined,
      passportNumber: form.passportNumber.trim() || undefined,
      spouseName: form.spouseName.trim() || undefined,
      spouseDateOfBirth: form.spouseDateOfBirth.trim() || undefined,
      childrenNames: form.childrenNames.trim() || undefined,
    });
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Invalid link</h1>
          <p className="text-gray-600 dark:text-dark-textSecondary mt-2">This onboarding link is invalid or missing.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-light-primary dark:text-dark-primary" />
      </div>
    );
  }

  if (error || !onboarding) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Link expired or invalid</h1>
          <p className="text-gray-600 dark:text-dark-textSecondary mt-2">
            {error instanceof Error ? error.message : 'This onboarding link may have expired. Please contact HR.'}
          </p>
        </div>
      </div>
    );
  }

  const currentStage = onboarding.currentStage;
  const progressPercent = (currentStage / 10) * 100;
  const showPersonalForm = currentStage <= 2;
  const showDocumentUpload = currentStage === 3;
  const showBankForm = currentStage === 4;
  const showEmergencyForm = currentStage === 5;
  const showEducationForm = currentStage === 6;
  const showExperienceForm = currentStage === 7 && onboarding.employeeType === 'SWITCHING';

  const documentTypesForCandidate =
    onboarding.employeeType === 'FRESHER'
      ? [...DOC_TYPES_COMMON, ...DOC_TYPES_FRESHER]
      : [...DOC_TYPES_COMMON, ...DOC_TYPES_SWITCHING];
  const documentsByType = (onboarding.documents ?? []).reduce(
    (acc, d) => {
      acc[d.documentType] = d;
      return acc;
    },
    {} as Record<string, OnboardingDocument>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex">
      {/* Left: Pipeline stages (fixed, stays visible while right side scrolls) */}
      <aside className="w-64 sm:w-72 flex-shrink-0 border-r border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col sticky top-0 h-screen max-h-screen">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-light-primary dark:text-dark-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 dark:text-dark-text truncate">Onboarding</h1>
              <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">{onboarding.candidateEmail}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-dark-textSecondary mb-1">
              <span>Stage {currentStage} of 10</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 dark:bg-dark-border overflow-hidden">
              <div
                className="h-full bg-light-primary dark:bg-dark-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Onboarding stages">
          <p className="text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase tracking-wide px-2 mb-2">Stages</p>
          <div className="space-y-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((stage) => {
              if (onboarding.employeeType === 'FRESHER' && stage === 7) return null;
              const done = currentStage > stage;
              const current = currentStage === stage;
              return (
                <div
                  key={stage}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                    current ? 'bg-light-primary/15 dark:bg-dark-primary/25 text-gray-900 dark:text-dark-text' : done ? 'bg-gray-100 dark:bg-dark-bg/80 text-gray-600 dark:text-dark-textSecondary' : 'text-gray-500 dark:text-dark-textSecondary'
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        current ? 'bg-light-primary dark:bg-dark-primary text-white' : 'bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-dark-textSecondary'
                      }`}
                    >
                      {stage}
                    </span>
                  )}
                  <span className={`text-sm truncate ${current ? 'font-medium' : ''}`}>
                    {STAGE_NAMES[stage]}
                  </span>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Right: Scrollable content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
            {showPersonalForm ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 2: Personal information</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">
              Please fill in your details. All fields marked * are required.
            </p>
            <form onSubmit={handleSubmitPersonal} className="space-y-6">
              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Basic details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">First name *</label>
                    <input type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Last name *</label>
                    <input type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Middle name</label>
                    <input type="text" value={form.middleName} onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Date of birth *</label>
                    <input type="date" required value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Gender *</label>
                    <select required value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                      <option value="">Select</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Marital status</label>
                    <select value={form.maritalStatus} onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                      <option value="">Select</option>
                      {MARITAL_STATUSES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Nationality *</label>
                    <input type="text" required value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Blood group</label>
                    <select value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Personal email *</label>
                    <input type="email" required value={form.personalEmail} onChange={(e) => setForm((f) => ({ ...f, personalEmail: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Personal mobile *</label>
                    <input type="tel" required value={form.personalMobile} onChange={(e) => setForm((f) => ({ ...f, personalMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Emergency contact number</label>
                    <input type="tel" value={form.alternateMobile} onChange={(e) => setForm((f) => ({ ...f, alternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Family (optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Spouse name</label>
                    <input type="text" value={form.spouseName} onChange={(e) => setForm((f) => ({ ...f, spouseName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Spouse date of birth</label>
                    <input type="date" value={form.spouseDateOfBirth} onChange={(e) => setForm((f) => ({ ...f, spouseDateOfBirth: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Children name(s)</label>
                    <input type="text" value={form.childrenNames} onChange={(e) => setForm((f) => ({ ...f, childrenNames: e.target.value }))} placeholder="Optional; comma-separated if multiple" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Current address *</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Address</label>
                    <textarea required rows={2} value={form.currentAddress} onChange={(e) => setForm((f) => ({ ...f, currentAddress: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">City</label>
                      <input type="text" required value={form.currentCity} onChange={(e) => setForm((f) => ({ ...f, currentCity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">State</label>
                      <input type="text" required value={form.currentState} onChange={(e) => setForm((f) => ({ ...f, currentState: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Pincode</label>
                      <input type="text" required value={form.currentPincode} onChange={(e) => setForm((f) => ({ ...f, currentPincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6 digits" maxLength={6} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Country</label>
                      <input type="text" required value={form.currentCountry} onChange={(e) => setForm((f) => ({ ...f, currentCountry: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <label className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={form.isSameAsCurrent} onChange={(e) => setForm((f) => ({ ...f, isSameAsCurrent: e.target.checked }))} className="rounded border-gray-300 dark:border-dark-border" />
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary">Permanent address same as current</span>
                </label>
                {!form.isSameAsCurrent && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Permanent address *</label>
                      <textarea required rows={2} value={form.permanentAddress} onChange={(e) => setForm((f) => ({ ...f, permanentAddress: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">City</label>
                        <input type="text" required value={form.permanentCity} onChange={(e) => setForm((f) => ({ ...f, permanentCity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">State</label>
                        <input type="text" required value={form.permanentState} onChange={(e) => setForm((f) => ({ ...f, permanentState: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Pincode</label>
                        <input type="text" required value={form.permanentPincode} onChange={(e) => setForm((f) => ({ ...f, permanentPincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6 digits" maxLength={6} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Country</label>
                        <input type="text" required value={form.permanentCountry} onChange={(e) => setForm((f) => ({ ...f, permanentCountry: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">PAN</label>
                    <input type="text" value={form.panNumber} onChange={(e) => setForm((f) => ({ ...f, panNumber: e.target.value.slice(0, PAN_LEN).toUpperCase() }))} placeholder="10 characters" maxLength={PAN_LEN} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Aadhaar</label>
                    <input type="text" value={form.aadhaarNumber} onChange={(e) => setForm((f) => ({ ...f, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, AADHAAR_LEN) }))} placeholder="12 digits" maxLength={AADHAAR_LEN} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Passport number (optional)</label>
                    <input type="text" value={form.passportNumber} onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                </div>
              </section>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitPersonalMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitPersonalMutation.isPending ? 'Saving…' : 'Save & continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : showDocumentUpload ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 3: Document upload</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">
              Upload PDF, JPG or PNG (max 5MB; photo max 2MB). Re-upload to replace.
            </p>
            <div className="space-y-4">
              {documentTypesForCandidate.map((docType) => {
                const doc = documentsByType[docType];
                const isUploading = uploadDocMutation.isPending;
                return (
                  <div
                    key={docType}
                    className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-dark-text text-sm">{DOC_TYPE_LABELS[docType] ?? docType}</p>
                      {doc ? (
                        <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {doc.fileName}
                          <span
                            className={
                              doc.verificationStatus === 'VERIFIED'
                                ? 'text-green-600 dark:text-green-400'
                                : doc.verificationStatus === 'REJECTED'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            · {doc.verificationStatus}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm hover:opacity-90">
                          <Upload className="w-4 h-4" />
                          {doc ? 'Replace' : 'Upload'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              uploadDocMutation.mutate({ documentType: docType, file });
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            {documentTypesForCandidate.every((t) => documentsByType[t]) && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
                <p className="text-sm text-gray-600 dark:text-dark-textSecondary mb-3">
                  All required documents uploaded. Click below to continue to bank details. HR will verify your documents separately.
                </p>
                <button
                  type="button"
                  onClick={() => completeDocUploadMutation.mutate()}
                  disabled={completeDocUploadMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50"
                >
                  {completeDocUploadMutation.isPending ? 'Saving…' : 'Continue to next step'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : showBankForm ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 4: Bank details</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">For salary credit. All fields marked * are required.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
                  toast.error('Account number and confirm do not match');
                  return;
                }
                submitBankMutation.mutate({
                  accountHolderName: bankForm.accountHolderName,
                  bankName: bankForm.bankName,
                  branchName: bankForm.branchName || undefined,
                  accountNumber: bankForm.accountNumber,
                  ifscCode: bankForm.ifscCode,
                  accountType: bankForm.accountType,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Account holder name *</label>
                <input type="text" required value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Bank name *</label>
                <input type="text" required value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Branch name</label>
                <input type="text" value={bankForm.branchName} onChange={(e) => setBankForm((f) => ({ ...f, branchName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Account number *</label>
                <input type="text" required value={bankForm.accountNumber} onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Confirm account number *</label>
                <input type="text" required value={bankForm.confirmAccountNumber} onChange={(e) => setBankForm((f) => ({ ...f, confirmAccountNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">IFSC code *</label>
                <input type="text" required value={bankForm.ifscCode} onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} placeholder="e.g. SBIN0001234" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">Account type *</label>
                <select value={bankForm.accountType} onChange={(e) => setBankForm((f) => ({ ...f, accountType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <button type="submit" disabled={submitBankMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50">
                {submitBankMutation.isPending ? 'Saving…' : 'Save & continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : showEmergencyForm ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 5: Emergency contact</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">Primary contact is required. Secondary is optional.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const primaryPhone = emergencyForm.primaryPhone.replace(/\D/g, '');
                if (primaryPhone.length !== 10) {
                  toast.error('Primary emergency contact phone must be exactly 10 digits');
                  return;
                }
                if (emergencyForm.primaryAlternatePhone && emergencyForm.primaryAlternatePhone.replace(/\D/g, '').length !== 10) {
                  toast.error('Primary emergency contact secondary number must be exactly 10 digits');
                  return;
                }
                if (emergencyForm.primaryEmail && !EMAIL_REGEX.test(emergencyForm.primaryEmail)) {
                  toast.error('Primary contact email format is invalid');
                  return;
                }
                if (emergencyForm.secondaryPhone && emergencyForm.secondaryPhone.replace(/\D/g, '').length !== 10) {
                  toast.error('Secondary contact phone must be exactly 10 digits');
                  return;
                }
                if (emergencyForm.secondaryAlternatePhone && emergencyForm.secondaryAlternatePhone.replace(/\D/g, '').length !== 10) {
                  toast.error('Secondary emergency contact number must be exactly 10 digits');
                  return;
                }
                if (emergencyForm.secondaryEmail && !EMAIL_REGEX.test(emergencyForm.secondaryEmail)) {
                  toast.error('Secondary contact email format is invalid');
                  return;
                }
                submitEmergencyMutation.mutate({
                  primaryContactName: emergencyForm.primaryContactName,
                  primaryRelationship: emergencyForm.primaryRelationship,
                  primaryPhone: primaryPhone,
                  primaryAlternatePhone: emergencyForm.primaryAlternatePhone?.replace(/\D/g, '') || undefined,
                  primaryEmail: emergencyForm.primaryEmail || undefined,
                  secondaryContactName: emergencyForm.secondaryContactName || undefined,
                  secondaryRelationship: emergencyForm.secondaryRelationship,
                  secondaryPhone: emergencyForm.secondaryPhone?.replace(/\D/g, '') || undefined,
                  secondaryAlternatePhone: emergencyForm.secondaryAlternatePhone?.replace(/\D/g, '') || undefined,
                  secondaryEmail: emergencyForm.secondaryEmail || undefined,
                });
              }}
              className="space-y-6"
            >
              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Primary contact *</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input type="text" required value={emergencyForm.primaryContactName} onChange={(e) => setEmergencyForm((f) => ({ ...f, primaryContactName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship *</label>
                    <select required value={emergencyForm.primaryRelationship} onChange={(e) => setEmergencyForm((f) => ({ ...f, primaryRelationship: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                      <option value="">Select</option>
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input type="tel" required value={emergencyForm.primaryPhone} onChange={(e) => setEmergencyForm((f) => ({ ...f, primaryPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency contact (secondary)</label>
                    <input type="tel" value={emergencyForm.primaryAlternatePhone} onChange={(e) => setEmergencyForm((f) => ({ ...f, primaryAlternatePhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={emergencyForm.primaryEmail} onChange={(e) => setEmergencyForm((f) => ({ ...f, primaryEmail: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-3">Secondary contact (optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input type="text" value={emergencyForm.secondaryContactName} onChange={(e) => setEmergencyForm((f) => ({ ...f, secondaryContactName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship</label>
                    <select value={emergencyForm.secondaryRelationship} onChange={(e) => setEmergencyForm((f) => ({ ...f, secondaryRelationship: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input type="tel" value={emergencyForm.secondaryPhone} onChange={(e) => setEmergencyForm((f) => ({ ...f, secondaryPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Emergency contact (secondary)</label>
                    <input type="tel" value={emergencyForm.secondaryAlternatePhone} onChange={(e) => setEmergencyForm((f) => ({ ...f, secondaryAlternatePhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10 digits" maxLength={10} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg" />
                  </div>
                </div>
              </section>
              <button type="submit" disabled={submitEmergencyMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50">
                {submitEmergencyMutation.isPending ? 'Saving…' : 'Save & continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : showEducationForm ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 6: Education details</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">Add at least one. For Fresher include 10th, 12th and graduation.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const valid = educationEntries.filter((ent) => ent.qualification.trim() && ent.institution.trim() && ent.universityBoard.trim() && ent.yearOfPassing);
                if (!valid.length) {
                  toast.error('Add at least one education with qualification, institution, board and year');
                  return;
                }
                submitEducationsMutation.mutate({
                  educations: valid.map((ent) => ({
                    qualification: ent.qualification,
                    institution: ent.institution,
                    universityBoard: ent.universityBoard,
                    yearOfPassing: Number(ent.yearOfPassing),
                    percentageOrCgpa: ent.percentageOrCgpa || undefined,
                    divisionOrClass: ent.divisionOrClass || undefined,
                    specialization: ent.specialization || undefined,
                    startDate: ent.startDate || undefined,
                    endDate: ent.endDate || undefined,
                  })),
                });
              }}
              className="space-y-6"
            >
              {educationEntries.map((ent, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary">Education {idx + 1}</span>
                    {educationEntries.length > 1 && (
                      <button type="button" onClick={() => setEducationEntries((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-600 dark:text-red-400">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Qualification *</label>
                      <input type="text" required value={ent.qualification} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, qualification: e.target.value } : x)))} placeholder="e.g. B.Tech, Class 10" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Institution *</label>
                      <input type="text" required value={ent.institution} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, institution: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">University / Board *</label>
                      <input type="text" required value={ent.universityBoard} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, universityBoard: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Year of passing *</label>
                      <input type="number" required value={ent.yearOfPassing} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, yearOfPassing: e.target.value } : x)))} min="1990" max={new Date().getFullYear() + 2} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">% / CGPA</label>
                      <input type="text" value={ent.percentageOrCgpa} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, percentageOrCgpa: e.target.value } : x)))} placeholder="e.g. 85 or 8.5" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Specialization</label>
                      <input type="text" value={ent.specialization} onChange={(e) => setEducationEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, specialization: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setEducationEntries((prev) => [...prev, { qualification: '', institution: '', universityBoard: '', yearOfPassing: String(new Date().getFullYear()), percentageOrCgpa: '', divisionOrClass: '', specialization: '', startDate: '', endDate: '' }])} className="text-sm text-light-primary dark:text-dark-primary hover:underline">
                + Add another education
              </button>
              <div>
                <button type="submit" disabled={submitEducationsMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50">
                  {submitEducationsMutation.isPending ? 'Saving…' : 'Save & continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : showExperienceForm ? (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">Stage 7: Experience details</h2>
            <p className="text-sm text-gray-500 dark:text-dark-textSecondary mb-6">Add previous employment. Most recent first.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const valid = experienceEntries.filter((ex) => ex.companyName.trim() && ex.designation.trim() && ex.startDate && ex.endDate);
                if (!valid.length) {
                  toast.error('Add at least one experience with company, designation and dates');
                  return;
                }
                submitExperiencesMutation.mutate({
                  experiences: valid.map((ex) => ({
                    companyName: ex.companyName,
                    designation: ex.designation,
                    employmentType: ex.employmentType,
                    startDate: ex.startDate,
                    endDate: ex.endDate,
                    isCurrent: ex.isCurrent,
                    reasonForLeaving: ex.reasonForLeaving || undefined,
                    lastDrawnSalary: ex.lastDrawnSalary || undefined,
                    reportingManagerName: ex.reportingManagerName || undefined,
                  })),
                });
              }}
              className="space-y-6"
            >
              {experienceEntries.map((ex, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-gray-200 dark:border-dark-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary">Experience {idx + 1}</span>
                    {experienceEntries.length > 1 && (
                      <button type="button" onClick={() => setExperienceEntries((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-600 dark:text-red-400">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Company name *</label>
                      <input type="text" required value={ex.companyName} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, companyName: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Designation *</label>
                      <input type="text" required value={ex.designation} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, designation: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Employment type *</label>
                      <select required value={ex.employmentType} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, employmentType: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm">
                        {EMPLOYMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Start date *</label>
                      <input type="date" required value={ex.startDate} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, startDate: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End date *</label>
                      <input type="date" required value={ex.endDate} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, endDate: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input type="checkbox" checked={ex.isCurrent} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, isCurrent: e.target.checked } : x)))} className="rounded border-gray-300" />
                      <span className="text-xs text-gray-600 dark:text-dark-textSecondary">Currently working here</span>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium mb-1">Reason for leaving</label>
                      <input type="text" value={ex.reasonForLeaving} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, reasonForLeaving: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Last drawn salary</label>
                      <input type="text" value={ex.lastDrawnSalary} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, lastDrawnSalary: e.target.value } : x)))} placeholder="Optional" className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Reporting manager name</label>
                      <input type="text" value={ex.reportingManagerName} onChange={(e) => setExperienceEntries((prev) => prev.map((x, i) => (i === idx ? { ...x, reportingManagerName: e.target.value } : x)))} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setExperienceEntries((prev) => [...prev, { companyName: '', designation: '', employmentType: 'full_time', startDate: '', endDate: '', isCurrent: false, reasonForLeaving: '', lastDrawnSalary: '', reportingManagerName: '' }])} className="text-sm text-light-primary dark:text-dark-primary hover:underline">
                + Add another experience
              </button>
              <div>
                <button type="submit" disabled={submitExperiencesMutation.isPending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 disabled:opacity-50">
                  {submitExperiencesMutation.isPending ? 'Saving…' : 'Save & continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">{STAGE_NAMES[currentStage]}</h2>
            <p className="text-gray-600 dark:text-dark-textSecondary">Stages 8–10 (ID generation, IT setup, HR review) will be completed by HR. Contact HR if you have questions.</p>
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
