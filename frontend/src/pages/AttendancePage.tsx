import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, AttendanceSummary } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { StatusBadge } from '../components/ui/StatusBadge';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';



import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Clock, Calendar, CheckCircle, AlertCircle, Play, Square } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const [weeklySummary, setWeeklySummary] = useState<AttendanceSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'WEEKLY' | 'ALL'>('WEEKLY');

  const loadData = async () => {
    try {
      if (isAdminOrHr && view === 'ALL') {
        const adminData = await attendanceService.adminGetAllAttendance();
        setRecords(adminData);
      } else {
        const [summary, history] = await Promise.all([
          attendanceService.getWeeklyAttendance(),
          attendanceService.getMyAttendance(),
        ]);
        setWeeklySummary(summary);
        setRecords(history);
      }
    } catch (e) {
      console.error('Failed to load attendance data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [view]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Attendance & Work Hours</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track daily clock logs, total working duration, and weekly shift compliance.
          </p>
        </div>

        {isAdminOrHr && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => exportToCSV(`attendance_report_${new Date().toISOString().slice(0,10)}.csv`, records)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-subtle flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Export CSV Report
            </button>

            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setView('WEEKLY')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  view === 'WEEKLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Attendance
              </button>
              <button
                onClick={() => setView('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  view === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Employees
              </button>
            </div>
          </div>
        )}

      </div>

      {/* KPI Cards */}
      {weeklySummary && view === 'WEEKLY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Present Days"
            value={weeklySummary.present_days}
            subtitle="Current week shifts"
            icon={CheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Leave Days"
            value={weeklySummary.leave_days}
            subtitle="Approved time-off"
            icon={Calendar}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Total Hours"
            value={`${weeklySummary.total_work_hours} hrs`}
            subtitle="Logged work time"
            icon={Clock}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <KpiCard
            title="Half Days / Absent"
            value={weeklySummary.half_days + weeklySummary.absent_days}
            subtitle="Exceptions"
            icon={AlertCircle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Interactive Google Calendar Attendance Tracker */}
      <AttendanceCalendar records={records} />



      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Attendance Records Log
        </h3>

        <div className="overflow-x-auto mt-4">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const durationHours = r.total_work_minutes
                      ? `${Math.floor(r.total_work_minutes / 60)}h ${r.total_work_minutes % 60}m`
                      : r.check_in && !r.check_out
                      ? 'In progress...'
                      : '--';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">{r.attendance_date}</td>
                        <td className="py-3 px-3 text-slate-700 font-mono">
                          {r.check_in
                            ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-mono">
                          {r.check_out
                            ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{durationHours}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{r.notes || '--'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
