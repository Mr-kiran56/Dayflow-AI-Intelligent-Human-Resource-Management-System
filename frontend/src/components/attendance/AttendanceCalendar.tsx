import React, { useState } from 'react';
import { AttendanceRecord } from '../../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ records }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [viewMode, setViewMode] = useState<'SINGLE' | 'QUARTER'>('SINGLE');
  const [activeDayDetail, setActiveDayDetail] = useState<{ day: number; dateStr: string; record?: AttendanceRecord } | null>(null);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const renderSingleMonthGrid = (year: number, monthIndex: number) => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

    const paddingCells = Array.from({ length: firstDayOfWeek });
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthStr = String(monthIndex + 1).padStart(2, '0');

    return (
      <div className="space-y-3">
        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
          {WEEKDAYS.map((wd) => (
            <div key={wd}>{wd}</div>
          ))}
        </div>

        {/* 7-Column Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {paddingCells.map((_, idx) => (
            <div key={`pad-${idx}`} className="h-14 sm:h-16 rounded-xl bg-slate-50/40 border border-transparent" />
          ))}

          {dayCells.map((dayNum) => {
            const dayStr = String(dayNum).padStart(2, '0');
            const targetDateStr = `${year}-${monthStr}-${dayStr}`;

            const record = records.find((r) => r.attendance_date === targetDateStr);

            let borderStyle = 'border-slate-200 bg-white hover:border-indigo-300';
            let badgeStyle = 'bg-slate-100 text-slate-500';
            let statusText = 'Weekend / Off';

            if (record) {
              if (record.status === 'PRESENT') {
                borderStyle = 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400';
                badgeStyle = 'bg-emerald-500 text-white font-bold';
                statusText = 'Present';
              } else if (record.status === 'HALF_DAY') {
                borderStyle = 'border-amber-300 bg-amber-50/50 hover:border-amber-400';
                badgeStyle = 'bg-amber-500 text-white font-bold';
                statusText = 'Half Day';
              } else if (record.status === 'LEAVE') {
                borderStyle = 'border-blue-300 bg-blue-50/50 hover:border-blue-400';
                badgeStyle = 'bg-blue-500 text-white font-bold';
                statusText = 'Leave';
              } else if (record.status === 'ABSENT') {
                borderStyle = 'border-rose-300 bg-rose-50/50 hover:border-rose-400';
                badgeStyle = 'bg-rose-500 text-white font-bold';
                statusText = 'Absent';
              }
            }

            return (
              <div
                key={dayNum}
                onClick={() => setActiveDayDetail({ day: dayNum, dateStr: targetDateStr, record })}
                className={`h-14 sm:h-16 rounded-xl border p-1.5 flex flex-col justify-between transition-all cursor-pointer shadow-subtle ${borderStyle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800">{dayNum}</span>
                  {record && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase ${badgeStyle}`}>
                      {record.status}
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 truncate">
                  {record?.total_work_minutes ? (
                    <span className="font-semibold text-slate-700 font-mono">
                      {Math.floor(record.total_work_minutes / 60)}h {record.total_work_minutes % 60}m
                    </span>
                  ) : record?.status ? (
                    <span>{statusText}</span>
                  ) : (
                    <span className="text-slate-300">Off</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-5">

      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">

        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">Interactive Shift Attendance Calendar</p>

          </div>
        </div>

        {/* Month Navigation & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Month Stepper Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 text-slate-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[100px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white hover:text-slate-900 text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year Select Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* View Mode Toggle: Single Month vs 4-Month Quarter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'SINGLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Month
            </button>
            <button
              onClick={() => setViewMode('QUARTER')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'QUARTER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4-Month Quarter View
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present Shift</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half-Day</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Approved Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend / Off</span>
      </div>

      {/* Single Month View vs 4-Month Quarter View */}
      {viewMode === 'SINGLE' ? (
        renderSingleMonthGrid(selectedYear, selectedMonth)
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1, 2, 3].map((offset) => {
            const targetM = (selectedMonth + offset) % 12;
            const targetY = selectedYear + Math.floor((selectedMonth + offset) / 12);
            return (
              <div key={offset} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 text-center uppercase tracking-wider">
                  {MONTH_NAMES[targetM]} {targetY}
                </h4>
                {renderSingleMonthGrid(targetY, targetM)}
              </div>
            );
          })}
        </div>
      )}

      {/* Day Shift Detail Modal */}
      {activeDayDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-floating border border-slate-200 space-y-4 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold">{activeDayDetail.dateStr}</h4>
              </div>
              <button
                onClick={() => setActiveDayDetail(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {activeDayDetail.record ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Attendance Status:</span>
                  <span className="font-bold text-indigo-600">{activeDayDetail.record.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Clock In Time:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeDayDetail.record.check_in
                      ? new Date(activeDayDetail.record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Clock Out Time:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeDayDetail.record.check_out
                      ? new Date(activeDayDetail.record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Total Hours Logged:</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {Math.floor((activeDayDetail.record.total_work_minutes || 0) / 60)}h {(activeDayDetail.record.total_work_minutes || 0) % 60}m
                  </span>
                </div>
                {activeDayDetail.record.notes && (
                  <p className="text-[11px] italic text-slate-500 pt-1">Notes: "{activeDayDetail.record.notes}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                No shift attendance recorded for this date.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
