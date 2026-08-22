import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { UserProfile } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Shield, Save, FileText, CheckCircle2, Lock, Building2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAdminOrHr, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Editable fields for self-service
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const isSelf = !id || (currentUser && (currentUser.employee_id === id || currentUser.id === id));

  const loadProfile = async () => {
    try {
      if (isSelf) {
        const data = await employeeService.getMyProfile();
        setProfile(data);
        setPhone(data.phone || '');
        setAddress(data.address || '');
      } else if (id) {
        const data = await employeeService.getEmployeeById(id);
        setProfile(data);
        setPhone(data.phone || '');
        setAddress(data.address || '');
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleSaveSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !isSelf) return;
    setSaving(true);
    setMessage(null);

    try {
      await employeeService.updateMyProfile({ phone, address });
      await refreshUser();
      setMessage('Your profile details updated successfully!');
      await loadProfile();
    } catch (err: any) {
      setMessage(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading profile records...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-xs text-slate-500">Employee profile record not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-900">

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
              <StatusBadge status={profile.role} />
            </div>
            <p className="text-xs text-slate-500 font-medium">{profile.job_title || 'Team Member'}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {profile.employee_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="text-xs text-slate-500">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Record Classification</span>
            <span className="font-semibold text-indigo-600 flex items-center gap-1">
              {isSelf ? <User className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
              {isSelf ? 'My Self-Service Profile' : 'Official HR Record (Read-Only)'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Details Container */}
      {isSelf ? (

        /* ================= SELF-SERVICE EMPLOYEE EDITABLE FORM ================= */
        <form onSubmit={handleSaveSelfProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                My Profile & Personal Information
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                You can update your personal contact phone number and address.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save My Changes'}
            </button>
          </div>

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email (Organization Locked)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID (Organization Locked)</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled
                  value={profile.employee_id}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled
                  value={profile.job_title || 'Team Member'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bangalore, Karnataka, India"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </form>

      ) : (

        /* ================= READ-ONLY OFFICIAL HR RECORD CARD FOR ADMIN/HR ================= */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Official HR Employee Record (Read-Only)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Personal contact details and employee preferences are self-managed by the employee.
              </p>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-600" /> HR Record Locked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Email</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> {profile.email}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee ID</span>
              <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> {profile.employee_id}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Job Title & Role</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> {profile.job_title || 'Team Member'} ({profile.role})
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Personal Phone</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" /> {profile.phone || 'Not Provided'}
              </span>
            </div>

            <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Residential Address</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> {profile.address || 'Bangalore, Karnataka, India'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Employee Verification & HR Compliance Documents
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Employment Offer & Contract</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Identity & Tax Proof (PAN / Aadhaar)</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
