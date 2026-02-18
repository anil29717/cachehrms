import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { DollarSign, Plus, Pencil, Search } from 'lucide-react';
import { api } from '../../api/client';

type SalaryStructureItem = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  designation: string | null;
  departmentName: string | null;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  gross: number;
};

type EmployeeOption = { id: string; employeeCode: string; firstName: string; lastName: string };

export function SalaryStructurePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('0');
  const [conveyance, setConveyance] = useState('0');
  const [medical, setMedical] = useState('0');
  const [specialAllowance, setSpecialAllowance] = useState('0');

  const { data: list, isLoading } = useQuery({
    queryKey: ['payroll-salary-structures'],
    queryFn: () =>
      api.get<{ success: true; data: SalaryStructureItem[] }>('/payroll/salary-structures').then((r) => r.data),
  });
  const items = list ?? [];
  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          i.employeeCode.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const { data: employees } = useQuery({
    queryKey: ['employees-list-all'],
    queryFn: () =>
      api.get<{ success: true; data: { id: string; employeeCode: string; firstName: string; lastName: string }[] }>(
        '/employees',
        { limit: '500' }
      ).then((r) => r.data),
    enabled: showAdd,
  });
  const employeeOptions = (employees ?? []).filter(
    (e: EmployeeOption) => !items.some((s) => s.employeeId === e.employeeCode)
  );

  const saveMutation = useMutation({
    mutationFn: (body: { employeeId: string; basicSalary: number; hra: number; conveyance: number; medical: number; specialAllowance: number }) =>
      api.put<{ success: true; data: SalaryStructureItem }>(`/payroll/salary-structures/${body.employeeId}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-salary-structures'] });
      setEditingId(null);
      setShowAdd(false);
      resetForm();
      toast.success('Salary structure saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: (body: { employeeId: string; basicSalary: number; hra: number; conveyance: number; medical: number; specialAllowance: number }) =>
      api.post<{ success: true; data: SalaryStructureItem }>('/payroll/salary-structures', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-salary-structures'] });
      setShowAdd(false);
      resetForm();
      toast.success('Salary structure added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setSelectedEmployee('');
    setBasicSalary('');
    setHra('0');
    setConveyance('0');
    setMedical('0');
    setSpecialAllowance('0');
  }

  function openEdit(item: SalaryStructureItem) {
    setEditingId(item.employeeId);
    setSelectedEmployee(item.employeeId);
    setBasicSalary(String(item.basicSalary));
    setHra(String(item.hra));
    setConveyance(String(item.conveyance));
    setMedical(String(item.medical));
    setSpecialAllowance(String(item.specialAllowance));
  }

  function handleSave() {
    const empId = selectedEmployee;
    const basic = parseFloat(basicSalary);
    if (!empId || Number.isNaN(basic) || basic < 0) {
      toast.error('Select employee and enter valid basic salary');
      return;
    }
    const payload = {
      employeeId: empId,
      basicSalary: basic,
      hra: parseFloat(hra) || 0,
      conveyance: parseFloat(conveyance) || 0,
      medical: parseFloat(medical) || 0,
      specialAllowance: parseFloat(specialAllowance) || 0,
    };
    if (editingId) saveMutation.mutate(payload);
    else createMutation.mutate(payload);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-6 flex items-center gap-2">
        <DollarSign className="w-7 h-7" />
        Salary structure
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary mb-4">
        Set or edit salary components per employee. Employees with a structure can be included in payroll runs.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingId(null); resetForm(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add structure
        </button>
      </div>

      {(showAdd || editingId) && (
        <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-3">
            {editingId ? 'Edit salary structure' : 'Add salary structure'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {!editingId && (
              <div>
                <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  <option value="">Select employee</option>
                  {employeeOptions.map((e: EmployeeOption) => (
                    <option key={e.id} value={e.employeeCode}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Basic salary (₹)</label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">HRA (₹)</label>
              <input
                type="number"
                value={hra}
                onChange={(e) => setHra(e.target.value)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Conveyance (₹)</label>
              <input
                type="number"
                value={conveyance}
                onChange={(e) => setConveyance(e.target.value)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Medical (₹)</label>
              <input
                type="number"
                value={medical}
                onChange={(e) => setMedical(e.target.value)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Special allowance (₹)</label>
              <input
                type="number"
                value={specialAllowance}
                onChange={(e) => setSpecialAllowance(e.target.value)}
                min={0}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending || createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setEditingId(null); resetForm(); }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500 dark:text-dark-textSecondary">Loading…</div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Dept</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Basic</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">HRA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Gross</th>
                  <th className="w-0 py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{row.employeeName}</span>
                      <span className="text-gray-500 dark:text-dark-textSecondary block text-xs">{row.employeeCode}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-dark-textSecondary">{row.departmentName ?? '—'}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{row.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{row.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium">₹{row.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
            No salary structures. Add one to run payroll.
          </div>
        )}
      </div>
    </div>
  );
}
