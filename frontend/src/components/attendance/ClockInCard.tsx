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
      setMessage(`Checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
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
      setMessage(`Checked out at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      setMessage(err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isWorking = record?.check_in && !record?.check_out;
  const isCompleted = record?.check_in && record?.check_out;

  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-floating relative overflow-hidden border border-slate-800">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Today's Shift Attendance</span>
            {record?.status && <StatusBadge status={record.status} />}
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl font-extrabold tracking-tight font-mono">{timerText}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-white/10">
              {isWorking ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400">Shift Active</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-300">Shift Completed</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-400">Not Clocked In</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-300 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clock In</span>
              <span className="font-semibold text-white">
                {record?.check_in
                  ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Clock Out</span>
              <span className="font-semibold text-white">
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
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {actionLoading ? 'Clocking in...' : 'Clock In Now'}
            </button>
          )}

          {isWorking && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              {actionLoading ? 'Clocking out...' : 'Clock Out'}
            </button>
          )}

          {isCompleted && (
            <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Shift Recorded
            </div>
          )}

          {message && (
            <p className="text-xs font-medium text-emerald-400 animate-in fade-in duration-150">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
