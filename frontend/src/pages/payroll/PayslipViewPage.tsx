import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';

type PayslipData = {
  id: string;
  employeeCode: string;
  employeeName: string;
  designation: string | null;
  departmentName: string | null;
  month: number;
  year: number;
  monthName: string;
  period: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  bonus: number;
  overtime: number;
  reimbursement: number;
  grossEarnings: number;
  pfDeduction: number;
  professionalTax: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: string;
  paymentDate: string | null;
};

export function PayslipViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['payroll-payslip', id],
    queryFn: () =>
      api.get<{ success: true; data: PayslipData }>(`/payroll/payslip/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-dark-textSecondary">Invalid payslip.</p>
        <Link to="/payroll/my-payslips" className="mt-2 inline-flex items-center gap-1 text-light-primary dark:text-dark-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to my payslips
        </Link>
      </div>
    );
  }

  if (isLoading) return <div className="py-8 text-gray-500 dark:text-dark-textSecondary">Loading payslip…</div>;
  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load payslip.</p>
        <Link to="/payroll/my-payslips" className="mt-2 inline-flex items-center gap-1 text-light-primary dark:text-dark-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to my payslips
        </Link>
      </div>
    );
  }

  const p = data;
  const format = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/payroll/my-payslips"
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-dark-textSecondary hover:text-light-primary dark:hover:text-dark-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back to my payslips
        </Link>
      </div>
      <div className="max-w-2xl mx-auto rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-gray-600 dark:text-dark-textSecondary" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">Payslip</h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-textSecondary">{p.period}</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-textSecondary mb-2">Employee details</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500 dark:text-dark-textSecondary">Name</span><br />{p.employeeName}</div>
              <div><span className="text-gray-500 dark:text-dark-textSecondary">Code</span><br />{p.employeeCode}</div>
              <div><span className="text-gray-500 dark:text-dark-textSecondary">Designation</span><br />{p.designation ?? '—'}</div>
              <div><span className="text-gray-500 dark:text-dark-textSecondary">Department</span><br />{p.departmentName ?? '—'}</div>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-textSecondary mb-2">Earnings</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1">Basic salary</td><td className="py-1 text-right font-mono">{format(p.basicSalary)}</td></tr>
                <tr><td className="py-1">HRA</td><td className="py-1 text-right font-mono">{format(p.hra)}</td></tr>
                <tr><td className="py-1">Conveyance</td><td className="py-1 text-right font-mono">{format(p.conveyance)}</td></tr>
                <tr><td className="py-1">Medical</td><td className="py-1 text-right font-mono">{format(p.medical)}</td></tr>
                <tr><td className="py-1">Special allowance</td><td className="py-1 text-right font-mono">{format(p.specialAllowance)}</td></tr>
                <tr><td className="py-1">Bonus</td><td className="py-1 text-right font-mono">{format(p.bonus)}</td></tr>
                <tr><td className="py-1">Overtime</td><td className="py-1 text-right font-mono">{format(p.overtime)}</td></tr>
                <tr><td className="py-1">Reimbursement</td><td className="py-1 text-right font-mono">{format(p.reimbursement)}</td></tr>
                <tr className="border-t border-gray-200 dark:border-dark-border"><td className="py-2 font-medium">Gross earnings</td><td className="py-2 text-right font-mono font-medium">{format(p.grossEarnings)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-textSecondary mb-2">Deductions</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="py-1">PF</td><td className="py-1 text-right font-mono">{format(p.pfDeduction)}</td></tr>
                <tr><td className="py-1">Professional tax</td><td className="py-1 text-right font-mono">{format(p.professionalTax)}</td></tr>
                <tr><td className="py-1">Income tax</td><td className="py-1 text-right font-mono">{format(p.incomeTax)}</td></tr>
                <tr className="border-t border-gray-200 dark:border-dark-border"><td className="py-2 font-medium">Total deductions</td><td className="py-2 text-right font-mono font-medium">{format(p.totalDeductions)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="pt-4 border-t-2 border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 dark:text-dark-text">Net salary</span>
              <span className="text-xl font-bold text-gray-900 dark:text-dark-text">{format(p.netSalary)}</span>
            </div>
            {p.paymentStatus && (
              <p className="mt-2 text-sm text-gray-500 dark:text-dark-textSecondary">
                Status: <span className="font-medium capitalize">{p.paymentStatus}</span>
                {p.paymentDate && ` · Paid on ${new Date(p.paymentDate).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
