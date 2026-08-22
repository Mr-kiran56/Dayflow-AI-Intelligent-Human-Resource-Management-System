import React from 'react';
import { AttendanceRecord } from '../../types';
import { Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const AttendanceHeatmap: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getRecordForDay = (dayNum: number) => {
    const dayStr = String(dayNum).padStart(2, '0');
    return records.find((r) => r.attendance_date.endsWith(`-${dayStr}`));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Monthly Shift Compliance Heatmap Grid (August 2026)
        </h3>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Half-Day
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Leave
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-200" /> Weekend / Off
          </span>
        </div>
      </div>

      {/* 31-Day Heatmap Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-16 lg:grid-cols-31 gap-2 pt-2">
        {daysArray.map((dayNum) => {
          const record = getRecordForDay(dayNum);
          let bg = 'bg-slate-100 text-slate-400 border-slate-200';
          let tooltip = `Aug ${dayNum}: Weekend / Off`;

          if (record) {
            if (record.status === 'PRESENT') {
              bg = 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs';
              tooltip = `Aug ${dayNum}: Present (${Math.floor(record.total_work_minutes / 60)}h ${record.total_work_minutes % 60}m)`;
            } else if (record.status === 'HALF_DAY') {
              bg = 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs';
              tooltip = `Aug ${dayNum}: Half Day`;
            } else if (record.status === 'LEAVE') {
              bg = 'bg-blue-500 text-white border-blue-600 font-bold shadow-xs';
              tooltip = `Aug ${dayNum}: Approved Leave`;
            }
          }

          return (
            <div
              key={dayNum}
              title={tooltip}
              className={`h-10 rounded-xl border flex flex-col items-center justify-center text-xs transition-transform hover:scale-110 cursor-pointer ${bg}`}
            >
              <span className="text-[10px] opacity-75 font-mono">{dayNum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
