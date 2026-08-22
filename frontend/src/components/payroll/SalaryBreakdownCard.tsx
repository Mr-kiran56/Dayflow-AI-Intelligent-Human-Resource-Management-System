import React, { useState } from 'react';
import { PayrollRecord, UserProfile } from '../../types';
import { aiService } from '../../services/aiService';
import { SalarySlipModal } from './SalarySlipModal';
import { Sparkles, DollarSign, ArrowUpRight, ArrowDownRight, Printer, FileText } from 'lucide-react';

export const SalaryBreakdownCard: React.FC<{ record: PayrollRecord; user: UserProfile | null }> = ({ record, user }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const res = await aiService.explainSalary(record.id);
      setExplanation(res.explanation);
    } catch (e: any) {
      setExplanation(e.message || 'AI salary explanation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Monthly Compensation</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {record.currency} {Number(record.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Net Salary Disbursed ({record.payroll_month})</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowSlipModal(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Download Payslip PDF</span>
            </button>

            <button
              onClick={handleExplain}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-subtle"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{loading ? 'Analyzing...' : 'Explain Salary with AI'}</span>
            </button>
          </div>
        </div>

        {/* Salary Components Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Basic Salary</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              ₹{Number(record.basic_salary).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">HRA</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              ₹{Number(record.hra).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Allowances
            </span>
            <p className="text-sm font-bold text-emerald-900 mt-1">
              ₹{Number(record.allowances).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> Deductions
            </span>
            <p className="text-sm font-bold text-rose-900 mt-1">
              - ₹{Number(record.deductions).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* AI Salary Explanation Box */}
        {explanation && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Salary Breakdown Explanation</span>
            </div>
            <p className="text-slate-700 leading-relaxed">{explanation}</p>
          </div>
        )}
      </div>

      {showSlipModal && (
        <SalarySlipModal payroll={record} user={user} onClose={() => setShowSlipModal(false)} />
      )}
    </>
  );
};
