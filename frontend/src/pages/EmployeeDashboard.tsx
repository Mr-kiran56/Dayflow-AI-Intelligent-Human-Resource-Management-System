import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClockInCard } from '../components/attendance/ClockInCard';
import { KpiCard } from '../components/ui/KpiCard';
import {
  Clock,
  CalendarDays,
  CreditCard,
  Bell,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attStats, setAttStats] = useState<any>(null);
  const [leaveStats, setLeaveStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [att, leave, notifs] = await Promise.all([
          analyticsService.getMyAttendanceAnalytics(),
          analyticsService.getMyLeaveAnalytics(),
          notificationService.getMyNotifications(),
        ]);
        setAttStats(att);
        setLeaveStats(leave);
        setNotifications(notifs.slice(0, 4));
      } catch (e) {
        console.error('Error loading dashboard stats:', e);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daily shift attendance, leave balance overview, and organization portal.
          </p>
        </div>

        <button
          onClick={() => navigate('/ai')}
          className="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-subtle self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Ask Dayflow AI</span>
        </button>
      </div>

      {/* Hero Attendance Clock-in Card */}
      <ClockInCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Attendance Rate"
          value={`${attStats?.attendance_rate_percentage || 100}%`}
          subtitle="Present vs logged workdays"
          icon={Clock}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="Leave Balance"
          value={`${leaveStats?.total_remaining_days || 0} Days`}
          subtitle="Remaining paid & sick leaves"
          icon={CalendarDays}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Logged Work Time"
          value={`${attStats?.total_work_hours || 0} hrs`}
          subtitle="Total hours this month"
          icon={CreditCard}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KpiCard
          title="Notifications"
          value={notifications.length}
          subtitle="System alerts & updates"
          icon={Bell}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/leave')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-indigo-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-900">Request Time Off</h3>
            <p className="text-xs text-slate-500 mt-1">Apply for paid, sick or unpaid leave with what-if balance simulator.</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-indigo-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-900">Attendance Timeline</h3>
            <p className="text-xs text-slate-500 mt-1">Review your daily and weekly shift clock logs and work hour summaries.</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/payroll')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-indigo-300 cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-900">My Compensation</h3>
            <p className="text-xs text-slate-500 mt-1">View gross salary, HRA, allowances, deductions and net paystubs.</p>
          </div>
        </div>
      </div>

      {/* Recent Alerts & Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Recent Notifications
          </h3>
          <button
            onClick={() => navigate('/notifications')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No recent alerts.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="py-3 flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
