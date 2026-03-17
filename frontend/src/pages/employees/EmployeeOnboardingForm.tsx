import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ArrowLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
  { value: 'part_time', label: 'Part Time' },
];

export function EmployeeOnboardingForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [designation, setDesignation] = useState('');
  const [reportingTo, setReportingTo] = useState('');
  const [externalRole, setExternalRole] = useState('employee');
  const [externalSubRole, setExternalSubRole] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(() => new Date().toISOString().slice(0, 10));
  const [employmentType, setEmploymentType] = useState('full_time');
  const [workLocation, setWorkLocation] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<{ success: true; data: { id: number; name: string }[] }>('/departments').then((r) => r.data),
  });
  const { data: employeesList } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get<{ success: true; data: { id: string; employeeCode: string; firstName: string; lastName: string }[] }>('/employees', { limit: '500' }).then((r) => r.data),
  });
  const { data: designationsList } = useQuery({
    queryKey: ['employees-designations'],
    queryFn: () => api.get<{ success: true; data: string[] }>('/employees/designations').then((r) => r.data),
  });
  const { data: workLocationsList } = useQuery({
    queryKey: ['employees-work-locations'],
    queryFn: () => api.get<{ success: true; data: string[] }>('/employees/work-locations').then((r) => r.data),
  });
  const { data: subadminTitlesResp } = useQuery({
    queryKey: ['subadmin-titles'],
    queryFn: () =>
      api.get<{ success: true; data: { titles: string[] } }>('/settings/api-access/subadmin-titles').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<{ success: true; data: { id: string } }>('/employees', body).then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Employee onboarded successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/employees/${data.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedFirst || !trimmedLast) {
      toast.error('First name and last name are required');
      return;
    }
    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }
    createMutation.mutate({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      ...(phone.trim() && { phone: phone.trim() }),
      ...(dateOfBirth && { dateOfBirth }),
      ...(gender.trim() && { gender: gender.trim() }),
      ...(departmentId !== '' && { departmentId: Number(departmentId) }),
      ...(designation.trim() && { designation: designation.trim() }),
      ...(reportingTo.trim() && { reportingTo: reportingTo.trim() }),
      externalRole,
      ...(externalRole === 'subadmin' && externalSubRole.trim() && { externalSubRole: externalSubRole.trim() }),
      dateOfJoining: dateOfJoining || new Date().toISOString().slice(0, 10),
      employmentType,
      ...((workLocation === '__other__' ? workLocationOther : workLocation).trim() && { workLocation: (workLocation === '__other__' ? workLocationOther : workLocation).trim() }),
    });
  }

  const loading = createMutation.isPending;
  const deptList = departments ?? [];
  const employeeOptions = Array.isArray(employeesList) ? employeesList : [];
  const designationOptions = Array.isArray(designationsList) ? designationsList : [];
  const workLocationOptions = Array.isArray(workLocationsList) ? workLocationsList : [];
  const subadminTitles = subadminTitlesResp?.titles ?? [];
  const [workLocationOther, setWorkLocationOther] = useState('');

  return (
    <div>
      <Link
        to="/employees"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Employees
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-light-primary/10 dark:bg-dark-primary/20">
          <User className="w-6 h-6 text-light-primary dark:text-dark-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            Onboard Employee
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-textSecondary mt-0.5">
            Enter details required during onboarding. Employee code will be auto-generated.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-4">
            Personal (required for onboarding)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                First name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Last name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Gender
              </label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="e.g. Male, Female"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-4">
            Employment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Employment type *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                {EMPLOYMENT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Date of joining *
              </label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Department
              </label>
              <select
                value={departmentId === '' ? '' : departmentId}
                onChange={(e) => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                <option value="">Select department</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Designation
              </label>
              <input
                list="onboarding-designation-list"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Select or type new designation"
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              />
              <datalist id="onboarding-designation-list">
                {designationOptions.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Reporting to
              </label>
              <select
                value={reportingTo}
                onChange={(e) => setReportingTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                <option value="">— None —</option>
                {employeeOptions.map((e) => (
                  <option key={e.id} value={e.employeeCode}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Role
              </label>
              <select
                value={externalRole}
                onChange={(e) => setExternalRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                {['employee', 'manager', 'admin', 'subadmin'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {externalRole === 'subadmin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                  Subadmin title
                </label>
                <select
                  value={externalSubRole}
                  onChange={(e) => setExternalSubRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                >
                  <option value="">— Select —</option>
                  {subadminTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-dark-textSecondary">
                  Manage titles in Settings → API Manager.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-1">
                Work location
              </label>
              <select
                value={workLocation && workLocationOptions.includes(workLocation) ? workLocation : workLocation ? '__other__' : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__other__') setWorkLocation('__other__');
                  else setWorkLocation(v);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
              >
                <option value="">— None —</option>
                {workLocationOptions.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="__other__">— Other (type below) —</option>
              </select>
              {(workLocation === '__other__' || (workLocation && !workLocationOptions.includes(workLocation))) && (
                <input
                  type="text"
                  value={workLocation === '__other__' ? workLocationOther : workLocation}
                  onChange={(e) => (workLocation === '__other__' ? setWorkLocationOther(e.target.value) : setWorkLocation(e.target.value))}
                  placeholder="Enter work location"
                  className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text"
                />
              )}
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Onboarding…' : 'Onboard Employee'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
