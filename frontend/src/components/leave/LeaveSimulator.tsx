import React, { useState } from 'react';
import { LeaveType, LeaveEligibilityResult } from '../../types';
import { leaveService } from '../../services/leaveService';
import { Calculator, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export const LeaveSimulator: React.FC<{ leaveTypes: LeaveType[] }> = ({ leaveTypes }) => {
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [result, setResult] = useState<LeaveEligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await leaveService.checkEligibility({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
      });
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-floating border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-300 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-brand-400" />
          What-If Leave Simulator
        </h3>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/20 text-brand-300 rounded-full border border-brand-500/30">
          Smart Eligibility
        </span>
      </div>

      <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Leave Type</label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-brand-500"
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading ? 'Simulating...' : 'Simulate Leave Eligibility'}
          </button>
        </div>
      </form>

      {result && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-150 ${
            result.eligible
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {result.eligible ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Eligible for Leave Request</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Ineligible Request</span>
              </>
            )}
          </div>
          <p className="text-slate-300">{result.reason}</p>
          <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/10 text-slate-300">
            <span>Requested: <strong>{result.requested_days} days</strong></span>
            <span>Available: <strong>{result.remaining_days} days</strong></span>
            <span>After Request: <strong>{result.remaining_after_request} days</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
