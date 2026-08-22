import React, { useState } from 'react';
import { LeaveType, LeaveEligibilityResult } from '../../types';
import { leaveService } from '../../services/leaveService';
import { Calculator, CheckCircle2, AlertTriangle, Sparkles, AlertCircle } from 'lucide-react';

export const LeaveSimulator: React.FC<{ leaveTypes: LeaveType[] }> = ({ leaveTypes }) => {
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [result, setResult] = useState<LeaveEligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;
    setLoading(true);
    setResult(null);
    setSimError(null);

    try {
      const res = await leaveService.checkEligibility({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
      });
      setResult(res);
    } catch (err: any) {
      setSimError(err.message || 'Simulation error. Please check selected dates.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4 text-slate-900">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">What-If Leave Balance Simulator</h3>
            <p className="text-xs text-slate-500">Preview balance deduction before submitting formal time-off requests</p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          Instant Eligibility Check
        </span>
      </div>

      {simError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{simError}</span>
        </div>
      )}

      <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 items-end gap-3 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
          >
            <option value="" className="text-slate-500 bg-white">Select leave type</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id} className="text-slate-900 bg-white font-medium">
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-semibold"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 h-[38px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Calculating...' : 'Simulate Eligibility'}</span>
          </button>
        </div>
      </form>

      {result && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
            result.eligible
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {result.eligible ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Leave Request Eligible</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Ineligible Request</span>
              </>
            )}
          </div>
          <p className="text-slate-700 font-medium">{result.reason}</p>
          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200/80 text-slate-800 font-medium">
            <span>Requested Duration: <strong className="text-slate-900">{result.requested_days} days</strong></span>
            <span>Available Balance: <strong className="text-slate-900">{result.remaining_days} days</strong></span>
            <span>Projected Balance After Request: <strong className="text-indigo-600 font-bold">{result.remaining_after_request} days</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
