import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService } from '../services/leaveService';
import { LeaveBalance, LeaveRequest, LeaveType } from '../types';
import { LeaveSimulator } from '../components/leave/LeaveSimulator';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiCard } from '../components/ui/KpiCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Request modal form
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadLeaveData = async () => {
    try {
      const [bals, reqs, types] = await Promise.all([
        leaveService.getMyBalances(),
        leaveService.getMyRequests(),
        leaveService.getLeaveTypes(),
      ]);
      setBalances(bals);
      setRequests(reqs);
      setLeaveTypes(types);
    } catch (e) {
      console.error('Failed to load leave data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, []);

  // Fallback: derive leave types directly from user balances if global types fetch comes back empty
  const availableLeaveTypes =
    leaveTypes.length > 0
      ? leaveTypes
      : balances
          .map((b) => b.leave_type)
          .filter((lt): lt is LeaveType => Boolean(lt));

  useEffect(() => {
    if (showModal && availableLeaveTypes.length > 0 && !selectedType) {
      setSelectedType(availableLeaveTypes[0].id);
    }
  }, [showModal, availableLeaveTypes, selectedType]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await leaveService.createRequest({
        leave_type_id: selectedType,
        start_date: startDate,
        end_date: endDate,
        remarks: remarks || undefined,
      });
      setShowModal(false);
      setSelectedType('');
      setStartDate('');
      setEndDate('');
      setRemarks('');
      await loadLeaveData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    setPageError(null);
    try {
      await leaveService.deleteRequest(id);
      await loadLeaveData();
    } catch (err: any) {
      setPageError(err.message || 'Cancellation failed');
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Leave & Time-Off Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit leave requests, simulate balance impact, and view status history.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>

      {pageError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map((b) => (
          <KpiCard
            key={b.id}
            title={b.leave_type?.name || 'Leave Balance'}
            value={`${b.remaining_days} Days`}
            subtitle={`Allocated: ${b.allocated_days}d | Used: ${b.used_days}d`}
            icon={CalendarDays}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        ))}
      </div>

      {/* What-If Leave Simulator */}
      <LeaveSimulator leaveTypes={availableLeaveTypes} />

      {/* Submitted Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          My Submitted Leave Requests
        </h3>

        <div className="overflow-x-auto mt-4">
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">End Date</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{r.leave_type?.name || 'Leave'}</td>
                      <td className="py-3 px-3 text-slate-700">{r.start_date}</td>
                      <td className="py-3 px-3 text-slate-700">{r.end_date}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{r.total_days} days</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{r.remarks || '--'}</td>
                      <td className="py-3 px-3 text-right">
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Time-Off Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-floating border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Request Time Off</h3>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  required
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer"
                >
                  <option value="" className="text-slate-400 bg-white font-normal">
                    Select leave type...
                  </option>
                  {availableLeaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id} className="text-slate-900 bg-white font-semibold py-1">
                      {lt.name} ({lt.is_paid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Reason</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Family vacation"
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedType}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
