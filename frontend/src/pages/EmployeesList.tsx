import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Shield, ArrowRight } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { UserProfile } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';

export const EmployeesList: React.FC = () => {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const data = await employeeService.listEmployees();
        setEmployees(data);
      } catch (e) {
        console.error('Failed to load employees', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmps();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View and manage organizational staff records, job titles, and roles.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-600 shadow-subtle"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.employee_id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-brand-200 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {emp.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {emp.full_name}
                    </h3>
                    <p className="text-xs text-slate-500">{emp.job_title || 'Team Member'}</p>
                  </div>
                </div>
                <StatusBadge status={emp.role} />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-700 font-medium">ID: {emp.employee_id}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                View Full Profile <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
