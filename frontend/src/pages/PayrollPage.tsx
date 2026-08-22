import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollService } from '../services/payrollService';
import { PayrollRecord } from '../types';
import { SalaryBreakdownCard } from '../components/payroll/SalaryBreakdownCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { CreditCard, Plus, FileText, CheckCircle } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const [latestPayroll, setLatestPayroll] = useState<PayrollRecord | null>(null);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [allPayrolls, setAllPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Create Modal
  const [showModal, setShowModal] = useState(false);
  const [empIdInput, setEmpIdInput] = useState('');
  const [monthInput, setMonthInput] = useState('2026-08-01');
  const [basic, setBasic] = useState('120000');
  const [hra, setHra] = useState('48000');
  const [allowances, setAllowances] = useState('15000');
  const [deductions, setDeductions] = useState('18000');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (isAdminOrHr) {
        const all = await payrollService.adminGetAllPayroll();
        setAllPayrolls(all);
      }
      const [latest, hist] = await Promise.all([
        payrollService.getMyPayroll(),
        payrollService.getMyPayrollHistory(),
      ]);
      setLatestPayroll(latest);
      setHistory(hist);
    } catch (e) {
      console.error('Failed to load payroll data', e);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);
    try {
      await payrollService.adminCreatePayroll({
        employee_id: empIdInput,
        payroll_month: monthInput,
        basic_salary: Number(basic),
        hra: Number(hra),
        allowances: Number(allowances),
        deductions: Number(deductions),
      });
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Creation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payroll & Salary Statements</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View transparent monthly compensation breakdowns, allowances, and official PDF paystubs.
          </p>
        </div>

        {isAdminOrHr && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Employee Payroll</span>
          </button>
        )}
      </div>

      {/* Latest Salary Breakdown */}
      {latestPayroll ? (
        <SalaryBreakdownCard record={latestPayroll} user={user} />
      ) : (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No current payroll statements recorded for your account.
        </div>
      )}

      {/* Admin Payroll Control List */}
      {isAdminOrHr && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Organization Employee Payroll Records
          </h3>

          <div className="overflow-x-auto mt-4">
            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Employee ID</th>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3">Basic</th>
                    <th className="py-2.5 px-3">HRA</th>
                    <th className="py-2.5 px-3">Allowances</th>
                    <th className="py-2.5 px-3">Deductions</th>
                    <th className="py-2.5 px-3">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPayrolls.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">{p.employee_id}</td>
                      <td className="py-3 px-3 text-slate-700">{p.payroll_month}</td>
                      <td className="py-3 px-3 text-slate-700">₹{Number(p.basic_salary).toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-700">₹{Number(p.hra).toLocaleString()}</td>
                      <td className="py-3 px-3 text-emerald-600 font-medium">+₹{Number(p.allowances).toLocaleString()}</td>
                      <td className="py-3 px-3 text-rose-600 font-medium">-₹{Number(p.deductions).toLocaleString()}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {p.currency} {Number(p.net_salary).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Admin Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-floating border border-slate-200 space-y-4 text-slate-900">
            <h3 className="text-base font-bold text-slate-900">Generate Employee Payroll</h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePayroll} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Profile ID (UUID)</label>
                <input
                  type="text"
                  required
                  value={empIdInput}
                  onChange={(e) => setEmpIdInput(e.target.value)}
                  placeholder="Employee Profile UUID"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Month</label>
                <input
                  type="date"
                  required
                  value={monthInput}
                  onChange={(e) => setMonthInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={basic}
                    onChange={(e) => setBasic(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HRA (₹)</label>
                  <input
                    type="number"
                    required
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allowances (₹)</label>
                  <input
                    type="number"
                    required
                    value={allowances}
                    onChange={(e) => setAllowances(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    required
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {saving ? 'Generating...' : 'Save Payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
