import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { StatusBadge } from '../ui/StatusBadge';

export const ClockInCard: React.FC = () => {
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timerText, setTimerText] = useState<string>('00h 00m');

  const fetchDaily = async () => {
    try {
      const data = await attendanceService.getDailyAttendance();
      setRecord(data);
    } catch (e) {
      console.error('Failed to load daily attendance', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  useEffect(() => {
    if (record?.check_in && !record?.check_out) {
      const interval = setInterval(() => {
        const start = new Date(record.check_in!).getTime();
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - start);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimerText(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
      }, 1000);
      return () => clearInterval(interval);
    } else if (record?.total_work_minutes) {
      const h = Math.floor(record.total_work_minutes / 60);
      const m = record.total_work_minutes % 60;
      setTimerText(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`);
    } else {
      setTimerText('00h 00m');
    }
  }, [record]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await attendanceService.checkIn('Checked in via My Day dashboard');
      setRecord(res);
      setMessage(`Clocked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      setMessage(err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await attendanceService.checkOut('Checked out via My Day dashboard');
      setRecord(res);
      setMessage(`Clocked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      setMessage(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isWorking = record?.check_in && !record?.check_out;
  const isCompleted = record?.check_in && record?.check_out;

  return (
    <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-subtle border border-slate-200 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Shift Attendance</span>
            {record?.status && <StatusBadge status={record.status} />}
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-slate-900">{timerText}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-slate-200 bg-slate-50">
              {isWorking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-700 font-bold">Shift Active</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-indigo-700 font-bold">Shift Completed</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-500">Not Clocked In</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Clock In Time</span>
              <span className="font-semibold text-slate-900 font-mono">
                {record?.check_in
                  ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Clock Out Time</span>
              <span className="font-semibold text-slate-900 font-mono">
                {record?.check_out
                  ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-start md:items-end justify-center gap-2">
          {!record?.check_in && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {actionLoading ? 'Clocking in...' : 'Clock In Now'}
            </button>
          )}

          {isWorking && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              {actionLoading ? 'Clocking out...' : 'Clock Out'}
            </button>
          )}

          {isCompleted && (
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Shift Recorded for Today
            </div>
          )}

          {message && (
            <p className="text-xs font-medium text-emerald-700 animate-in fade-in duration-150">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
