import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { employeeService } from '../services/employeeService';
import { leaveService } from '../services/leaveService';
import { UserProfile, LeaveRequest } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<any>(null);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const loadData = async () => {
    try {
      const [ov, emps, leaves] = await Promise.all([
        analyticsService.getAdminOverview(),
        employeeService.listEmployees(),
        leaveService.adminGetRequests({ status: 'PENDING' }),
      ]);
      setOverview(ov);
      setEmployees(emps);
      setPendingLeaves(leaves);
    } catch (e) {
      console.error('Failed to load admin command center:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await leaveService.adminApproveRequest(id, 'Approved via Command Center');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalId || !rejectComment.trim()) return;
    try {
      await leaveService.adminRejectRequest(rejectModalId, rejectComment.trim());
      setRejectModalId(null);
      setRejectComment('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.job_title && e.job_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Workforce Command Center
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 rounded-full">
              {user?.role}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time organizational attendance, workforce health, and leave approval workflows.
          </p>
        </div>

        <button
          onClick={() => navigate('/ai')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Workforce Executive AI Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Employees"
          value={overview?.total_active_employees || employees.length}
          subtitle="Registered staff members"
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KpiCard
          title="Present Today"
          value={overview?.present_today || 0}
          subtitle="Clocked in today"
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          title="On Leave Today"
          value={overview?.on_leave_today || 0}
          subtitle="Approved time-off"
          icon={CalendarDays}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Pending Approvals"
          value={overview?.pending_leave_requests || pendingLeaves.length}
          subtitle="Requires manager review"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Pending Approvals Action Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-brand-600" />
              Pending Leave Requests ({pendingLeaves.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Review and take immediate action on employee time-off requests.</p>
          </div>
          <button onClick={() => navigate('/leave')} className="text-xs font-semibold text-brand-600 hover:underline">
            View All Requests
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {pendingLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No pending leave approvals right now. All caught up!</p>
          ) : (
            pendingLeaves.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Employee ID: {req.employee_id}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Requested <span className="font-bold text-slate-900">{req.total_days} day(s)</span> from{' '}
                    <span className="font-semibold">{req.start_date}</span> to <span className="font-semibold">{req.end_date}</span>
                  </p>
                  {req.remarks && <p className="text-xs italic text-slate-500">"{req.remarks}"</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModalId(req.id)}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Employee Workforce Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Live Employee Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage team members, roles, and employment details.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID or title..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Job Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.full_name}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">{emp.employee_id}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={emp.role} />
                    </td>
                    <td className="py-3 px-3 text-slate-600">{emp.job_title || 'Employee'}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/employees/${emp.employee_id}`)}
                        className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1"
                      >
                        View Profile <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-floating border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Leave Request</h3>
            <p className="text-xs text-slate-500">
              Please provide a mandatory reviewer comment explaining the rejection reason to the employee.
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. Peak project delivery deadline requires full team presence."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectModalId(null);
                  setRejectComment('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectComment.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
