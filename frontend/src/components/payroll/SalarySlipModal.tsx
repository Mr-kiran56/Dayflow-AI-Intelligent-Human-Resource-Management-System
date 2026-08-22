import React from 'react';
import { PayrollRecord, UserProfile } from '../../types';
import { Printer, Download, X, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SalarySlipModalProps {
  payroll: PayrollRecord;
  user: UserProfile | null;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, user, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const basic = Number(payroll.basic_salary);
  const hra = Number(payroll.hra);
  const allowances = Number(payroll.allowances);
  const deductions = Number(payroll.deductions);
  const gross = Number(payroll.gross_salary);
  const net = Number(payroll.net_salary);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible !important;
          }
          #printable-payslip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-floating border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">

        {/* Sticky Top Action Bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">Official Salary Payslip Statement</h3>
              <p className="text-[10px] text-slate-400">Statement Month: {payroll.payroll_month}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="Print or Save as System PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inner Scrollable Printable Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6 text-slate-900 bg-white custom-scrollbar" id="printable-payslip">

          {/* Letterhead */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                D
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">DAYFLOW TECHNOLOGIES INC.</h1>
                <p className="text-xs text-slate-500">Corporate HQ: Tech Park, Ring Road, Bangalore - 560103</p>
                <p className="text-[11px] text-slate-400">EIN / Reg: IND-HRMS-2026-8891</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Statement Period</span>
              <p className="text-sm font-bold text-slate-900">{payroll.payroll_month}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Disbursed
              </span>
            </div>
          </div>

          {/* Employee & Paystub Details Table */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Employee Name:</p>
              <p className="font-bold text-slate-900">{user?.full_name || 'Rahul Mehta'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Employee ID:</p>
              <p className="font-mono font-bold text-slate-900">{user?.employee_id || payroll.employee_id}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Designation / Title:</p>
              <p className="font-bold text-slate-900">{user?.job_title || 'Software Engineer'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Payment Currency:</p>
              <p className="font-bold text-slate-900">{payroll.currency} (INR)</p>
            </div>
          </div>

          {/* Detailed Earnings & Deductions Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Earnings / Allowances</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4 border-l border-slate-200">Deductions / Taxes</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium">Basic Salary</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">₹{basic.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 border-l border-slate-200 font-medium">Provident Fund (PF) & Statutory Taxes</td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-bold">₹{(deductions * 0.6).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">House Rent Allowance (HRA)</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">₹{hra.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 border-l border-slate-200 font-medium">Professional Tax & Insurance</td>
                  <td className="py-2.5 px-4 text-right font-mono text-rose-600 font-bold">₹{(deductions * 0.4).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Special & Flexible Allowances</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-600 font-bold">₹{allowances.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-4 border-l border-slate-200 font-medium">Other Deductions</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">₹0.00</td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="py-3 px-4 text-slate-900">Total Gross Earnings</td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-600 font-extrabold text-sm">₹{gross.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border-l border-slate-200 text-slate-900">Total Deductions</td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600 font-extrabold text-sm">₹{deductions.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Salary Disbursed Banner */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">Net Salary Payable</span>
              <p className="text-xs text-indigo-700 font-medium">Transferred directly to registered corporate salary account</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold font-mono text-indigo-900">
                ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Signature & Seal Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Electronically Generated & Certified by Dayflow HR System</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">Priya Sharma</p>
              <p className="text-[10px] text-slate-400">Head of People Operations</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Fixed Action Bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <p className="text-[11px] text-slate-500 font-medium">
            Clicking <span className="font-bold text-slate-800">Print / Download PDF</span> opens system printer to Save as PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
