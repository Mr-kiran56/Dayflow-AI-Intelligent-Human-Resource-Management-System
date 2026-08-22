import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { payrollService } from '../services/payrollService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Building2,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHoursFromRecord(totalWorkMinutes?: number): number {
  if (!totalWorkMinutes) return 0;
  return Math.round((totalWorkMinutes / 60) * 10) / 10;
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center">
      <p className="text-sm text-slate-400 font-medium text-center px-4">{message}</p>
    </div>
  );
}

export const AnalyticsPage: React.FC = () => {
  const { isAdminOrHr } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [attData, setAttData] = useState<any>(null);
  const [leaveData, setLeaveData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [mySalary, setMySalary] = useState<any>(null);
  const [employeeHoursTrend, setEmployeeHoursTrend] = useState<{ day: string; hours: number }[]>([]);
  const [employeeLeaveUsage, setEmployeeLeaveUsage] = useState<
    { name: string; remaining: number; used: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        if (isAdminOrHr) {
          const [ov, att, leave, pay] = await Promise.all([
            analyticsService.getAdminOverview(),
            analyticsService.getAdminAttendanceAnalytics(),
            analyticsService.getAdminLeaveAnalytics(),
            analyticsService.getAdminPayrollAnalytics(),
          ]);
          setOverview(ov);
          setAttData(att);
          setLeaveData(leave);
          setPayrollData(pay);
        } else {
          const [att, leave, pays, weekly, balances] = await Promise.all([
            analyticsService.getMyAttendanceAnalytics(),
            analyticsService.getMyLeaveAnalytics(),
            payrollService.getMyPayrollHistory().catch(() => []),
            attendanceService.getWeeklyAttendance().catch(() => null),
            leaveService.getMyBalances().catch(() => []),
          ]);
          setAttData(att);
          setLeaveData(leave);
          if (pays && pays.length > 0) {
            setMySalary(pays[0]);
          }
          if (weekly?.records?.length) {
            setEmployeeHoursTrend(
              weekly.records.map((r) => ({
                day: DAY_LABELS[new Date(r.attendance_date).getDay()],
                hours: formatHoursFromRecord(r.total_work_minutes),
              }))
            );
          } else {
            setEmployeeHoursTrend([]);
          }
          if (balances?.length) {
            setEmployeeLeaveUsage(
              balances.map((b) => ({
                name: b.leave_type?.name || 'Leave',
                remaining: Number(b.remaining_days),
                used: Number(b.used_days),
              }))
            );
          } else {
            setEmployeeLeaveUsage([]);
          }
        }
      } catch (e: any) {
        console.error('Failed to load analytics', e);
        setFetchError(e.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isAdminOrHr]);

  const departmentDistribution = attData?.department_distribution ?? [];
  const adminAttendanceTrends = attData?.attendance_trends ?? [];
  const adminLeaveDistribution = leaveData?.distribution ?? [];
  const adminPayrollBreakdown = payrollData?.breakdown ?? [];

  const hasLoggedShifts = (attData?.total_days_logged || 0) > 0;
  const loggedWorkHours = hasLoggedShifts ? attData?.total_work_hours || 0 : 0;
  const complianceRate = hasLoggedShifts ? attData?.attendance_rate_percentage || 0 : 0;
  const remainingPaidLeave =
    leaveData?.total_remaining_days !== undefined ? leaveData.total_remaining_days : 0;
  const netSalaryVal = mySalary ? Number(mySalary.net_salary) : 0;

  const hasLiveData = isAdminOrHr
    ? !!(overview || attData || leaveData || payrollData)
    : !!(attData || leaveData);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            {isAdminOrHr ? 'Workforce Analytics' : 'My Analytics'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isAdminOrHr
              ? 'Live headcount, attendance, leave, and payroll metrics from your database.'
              : 'Your shift hours, compliance rate, and leave balances — pulled from live records.'}
          </p>
        </div>

        {!loading && hasLiveData && !fetchError && (
          <span className="px-3 py-1.5 text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System Metrics
          </span>
        )}
      </div>

      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 font-medium">
          {fetchError}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : isAdminOrHr ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Active Headcount"
              value={`${overview?.total_active_employees ?? 0}`}
              subtitle="Active employees across departments"
              icon={Users}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
            />
            <KpiCard
              title="Shift Compliance Rate"
              value={`${attData?.overall_attendance_rate ?? 0}%`}
              subtitle="Last 30 days attendance"
              icon={TrendingUp}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              title="Pending Approvals"
              value={`${leaveData?.pending ?? 0}`}
              subtitle="Leave requests awaiting decision"
              icon={Calendar}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <KpiCard
              title="Total Net Payroll"
              value={`₹${(payrollData?.total_net_disbursed ?? 0).toLocaleString()}`}
              subtitle="Total net disbursed (INR)"
              icon={DollarSign}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  Departmental Headcount
                </h3>
              </div>
              {departmentDistribution.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                      <Bar dataKey="employees" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Headcount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty message="No department headcount data yet. Add employees to see this chart." />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Attendance vs Leave Trends
                </h3>
                <span className="text-xs font-semibold text-slate-400">Last 30 days</span>
              </div>
              {adminAttendanceTrends.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={adminAttendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                      <Area type="monotone" dataKey="present" stroke="#10B981" fill="#D1FAE5" name="Present" />
                      <Area type="monotone" dataKey="leave" stroke="#3B82F6" fill="#DBEAFE" name="On Leave" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty message="No attendance trends recorded yet." />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-brand-600" />
                Leave Request Distribution
              </h3>
              {adminLeaveDistribution.length > 0 ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={adminLeaveDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {adminLeaveDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#4F46E5'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty message="No leave requests submitted yet." />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Payroll Breakdown (INR)
              </h3>
              {adminPayrollBreakdown.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminPayrollBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', fontSize: '13px' }}
                        formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                      />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty message="No payroll records found. Create payroll entries to see breakdown." />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Work Hours Logged"
              value={`${loggedWorkHours} hrs`}
              subtitle={hasLoggedShifts ? 'This month' : 'No shift records yet'}
              icon={Clock}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
            />
            <KpiCard
              title="Attendance Compliance"
              value={`${complianceRate}%`}
              subtitle={hasLoggedShifts ? 'On-time check-in rate' : 'Clock in to start tracking'}
              icon={CheckCircle2}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              title="Leave Balance"
              value={`${remainingPaidLeave} days`}
              subtitle="Total remaining across all types"
              icon={Calendar}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <KpiCard
              title="Net Salary"
              value={netSalaryVal > 0 ? `₹${netSalaryVal.toLocaleString()}` : '—'}
              subtitle={netSalaryVal > 0 ? 'Latest payroll record' : 'Payroll pending'}
              icon={DollarSign}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                My Weekly Shift Hours
              </h3>
              {employeeHoursTrend.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={employeeHoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                      <Area type="monotone" dataKey="hours" stroke="#4F46E5" fill="#EEF2FF" name="Hours" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No shift data this week"
                  description="Clock in from your dashboard to start building your weekly hours chart."
                  actionLabel="Go to Dashboard"
                  onAction={() => navigate('/dashboard')}
                />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Leave Balance Breakdown
              </h3>
              {employeeLeaveUsage.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeLeaveUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px' }} />
                      <Bar dataKey="remaining" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Remaining" />
                      <Bar dataKey="used" fill="#94A3B8" radius={[6, 6, 0, 0]} name="Used" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart2}
                  title="No leave balances found"
                  description="Your leave allocations will appear here once your account is set up."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
