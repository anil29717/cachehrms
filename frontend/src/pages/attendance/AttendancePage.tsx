import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  LogIn,
  LogOut,
  Calendar,
  Clock,
  Users,
  Building2,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api/client';

type TodayAttendance = {
  id: string | null;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string | null;
  workingHours: number | null;
  overtimeHours: number | null;
  lateMinutes: number | null;
  employeeName?: string | null;
};

type AttendanceRecord = TodayAttendance & { createdAt: string | null };

type ShiftItem = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  isActive: boolean;
};

export function AttendancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const roleName = user?.roleName ?? '';
  const isHR = roleName === 'super_admin' || roleName === 'hr_admin';
  const isManager = roleName === 'manager' || isHR;

  const [showTeam, setShowTeam] = useState(false);
  const [showDepartment, setShowDepartment] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  const [teamDate, setTeamDate] = useState(new Date().toISOString().slice(0, 10));
  const [deptDate, setDeptDate] = useState(new Date().toISOString().slice(0, 10));
  const [deptId, setDeptId] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportDeptId, setReportDeptId] = useState('');
  const [historyFrom, setHistoryFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().slice(0, 10));

  const { data: today, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () =>
      api.get<{ success: true; data: TodayAttendance }>('/attendance/today').then((r) => r.data),
  });

  const todayData = today ?? null;
  const hasCheckedIn = !!todayData?.checkIn;
  const hasCheckedOut = !!todayData?.checkOut;

  const checkInMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: true; data: AttendanceRecord; message: string }>('/attendance/check-in', {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] });
      toast.success('Checked in successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkOutMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: true; data: AttendanceRecord; message: string }>('/attendance/check-out', {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] });
      toast.success('Checked out successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const historyParams: Record<string, string> = {
    from: historyFrom,
    to: historyTo,
    page: '1',
    limit: '31',
  };
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-me', historyFrom, historyTo],
    queryFn: () =>
      api
        .get<{ success: true; data: AttendanceRecord[]; meta?: { total: number } }>(
          '/attendance/me',
          historyParams
        )
        .then((r) => ({ items: r.data, meta: r.meta })),
  });
  const historyItems = historyData?.items ?? [];

  const { data: teamList, isLoading: teamLoading } = useQuery({
    queryKey: ['attendance-team', teamDate],
    queryFn: () =>
      api.get<{ success: true; data: AttendanceRecord[] }>('/attendance/team', { date: teamDate }).then((r) => r.data),
    enabled: showTeam && isManager,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () =>
      api.get<{ success: true; data: { id: number; name: string }[] }>('/departments').then((r) => r.data),
    enabled: isHR,
  });
  const deptList = departments ?? [];

  const { data: deptListData, isLoading: deptListLoading } = useQuery({
    queryKey: ['attendance-department', deptId, deptDate],
    queryFn: () =>
      api
        .get<{ success: true; data: AttendanceRecord[] }>('/attendance/department', {
          departmentId: deptId,
          date: deptDate,
        })
        .then((r) => r.data),
    enabled: showDepartment && isHR && !!deptId,
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['attendance-report', reportMonth, reportYear, reportDeptId],
    queryFn: () => {
      const params: Record<string, string> = { month: String(reportMonth), year: String(reportYear) };
      if (reportDeptId) params.departmentId = reportDeptId;
      return api
        .get<{ success: true; data: { month: number; year: number; summary: Array<{ employeeId: string; employeeName: string; present: number; late: number; totalHours: number; totalOvertime: number }> } }>(
          '/attendance/report',
          params
        )
        .then((r) => r.data);
    },
    enabled: showReport && isHR,
  });

  const { data: shiftsList, isLoading: shiftsLoading } = useQuery({
    queryKey: ['attendance-shifts'],
    queryFn: () =>
      api.get<{ success: true; data: ShiftItem[] }>('/attendance/shifts').then((r) => r.data),
    enabled: showShifts && isHR,
  });
  const shifts = shiftsList ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Attendance</h1>

      {/* My attendance – today + check-in/out */}
      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-dark-textSecondary" />
          <h2 className="font-semibold text-gray-900 dark:text-dark-text">Today</h2>
        </div>
        <div className="p-6">
          {todayLoading && <p className="text-gray-500 dark:text-dark-textSecondary">Loading…</p>}
          {!todayLoading && todayData && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-dark-textSecondary">Check-in</p>
                  <p className="font-medium">
                    {todayData.checkIn
                      ? new Date(todayData.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-dark-textSecondary">Check-out</p>
                  <p className="font-medium">
                    {todayData.checkOut
                      ? new Date(todayData.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>
                {todayData.workingHours != null && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-dark-textSecondary">Working hours</p>
                    <p className="font-medium">{todayData.workingHours}h</p>
                  </div>
                )}
                {todayData.status && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      todayData.status === 'present' || todayData.status === 'late'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {todayData.status}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!hasCheckedIn && (
                  <button
                    type="button"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    Check in
                  </button>
                )}
                {hasCheckedIn && !hasCheckedOut && (
                  <button
                    type="button"
                    onClick={() => checkOutMutation.mutate()}
                    disabled={checkOutMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Check out
                  </button>
                )}
              </div>
            </div>
          )}
          {!todayLoading && !todayData?.checkIn && todayData?.date && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                Check in
              </button>
            </div>
          )}
        </div>
      </section>

      {/* My history */}
      <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
            <Calendar className="w-5 h-5" />
            My attendance history
          </h2>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              type="date"
              value={historyFrom}
              onChange={(e) => setHistoryFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            />
            <input
              type="date"
              value={historyTo}
              onChange={(e) => setHistoryTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            />
          </div>
          {historyLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Check-in</th>
                  <th className="py-2 pr-4">Check-out</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Hours</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((r) => (
                  <tr key={r.id ?? r.date + r.employeeId} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-2 pr-4">{r.date}</td>
                    <td className="py-2 pr-4">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2 pr-4">{r.status ?? '—'}</td>
                    <td className="py-2 pr-4">{r.workingHours != null ? `${r.workingHours}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyItems.length === 0 && !historyLoading && (
              <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No records in this range.</p>
            )}
          </div>
        </div>
      </section>

      {/* Team attendance (Manager / HR) */}
      {isManager && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTeam(!showTeam)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
              <Users className="w-5 h-5" />
              Team attendance
            </span>
            {showTeam ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showTeam && (
            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Date</label>
                <input
                  type="date"
                  value={teamDate}
                  onChange={(e) => setTeamDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
              {teamLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!teamLoading && teamList && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">Check-in</th>
                        <th className="py-2 pr-4">Check-out</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teamList as unknown as AttendanceRecord[]).map((r: AttendanceRecord & { employeeName?: string }) => (
                        <tr key={r.employeeId + teamDate} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                          <td className="py-2 pr-4">{r.employeeName ?? r.employeeId}</td>
                          <td className="py-2 pr-4">
                            {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2 pr-4">
                            {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2 pr-4">{r.status ?? 'absent'}</td>
                          <td className="py-2 pr-4">{r.workingHours != null ? `${r.workingHours}h` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(teamList as unknown as AttendanceRecord[]).length === 0 && (
                    <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No reportees or no attendance for this date.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Department attendance (HR) */}
      {isHR && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDepartment(!showDepartment)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
              <Building2 className="w-5 h-5" />
              Department attendance
            </span>
            {showDepartment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showDepartment && (
            <div className="p-4">
              <div className="flex gap-2 mb-3 flex-wrap">
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  <option value="">Select department</option>
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={deptDate}
                  onChange={(e) => setDeptDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                />
              </div>
              {deptListLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!deptListLoading && deptListData && deptId && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">Check-in</th>
                        <th className="py-2 pr-4">Check-out</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deptListData as unknown as (AttendanceRecord & { employeeName?: string })[]).map((r) => (
                        <tr key={r.employeeId + deptDate} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                          <td className="py-2 pr-4">{r.employeeName ?? r.employeeId}</td>
                          <td className="py-2 pr-4">
                            {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2 pr-4">
                            {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2 pr-4">{r.status ?? 'absent'}</td>
                          <td className="py-2 pr-4">{r.workingHours != null ? `${r.workingHours}h` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Monthly report (HR) */}
      {isHR && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowReport(!showReport)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
              <FileText className="w-5 h-5" />
              Monthly report
            </span>
            {showReport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showReport && (
            <div className="p-4">
              <div className="flex gap-2 mb-3 flex-wrap">
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  min={2020}
                  max={2030}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm w-24"
                />
                <select
                  value={reportDeptId}
                  onChange={(e) => setReportDeptId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
                >
                  <option value="">All departments</option>
                  {deptList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {reportLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!reportLoading && reportData?.summary && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">Present</th>
                        <th className="py-2 pr-4">Late</th>
                        <th className="py-2 pr-4">Total hours</th>
                        <th className="py-2 pr-4">Overtime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.summary.map((s) => (
                        <tr key={s.employeeId} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                          <td className="py-2 pr-4">{s.employeeName}</td>
                          <td className="py-2 pr-4">{s.present}</td>
                          <td className="py-2 pr-4">{s.late}</td>
                          <td className="py-2 pr-4">{s.totalHours.toFixed(1)}h</td>
                          <td className="py-2 pr-4">{s.totalOvertime.toFixed(1)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Shifts (HR / Admin) */}
      {isHR && (
        <section className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowShifts(!showShifts)}
            className="w-full p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-dark-bg"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-dark-text">
              <Settings className="w-5 h-5" />
              Shifts
            </span>
            {showShifts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showShifts && (
            <div className="p-4">
              {shiftsLoading && <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>}
              {!shiftsLoading && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 dark:text-dark-textSecondary border-b border-gray-200 dark:border-dark-border">
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Start</th>
                        <th className="py-2 pr-4">End</th>
                        <th className="py-2 pr-4">Grace (min)</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts.map((s) => (
                        <tr key={s.id} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                          <td className="py-2 pr-4 font-medium">{s.name}</td>
                          <td className="py-2 pr-4">{s.startTime}</td>
                          <td className="py-2 pr-4">{s.endTime}</td>
                          <td className="py-2 pr-4">{s.gracePeriod}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs ${
                                s.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {shifts.length === 0 && (
                    <p className="py-4 text-gray-500 dark:text-dark-textSecondary text-sm">No shifts defined. Run seed to add default shift.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
