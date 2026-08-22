import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { User, Mail, Lock, BadgeCheck, ArrowRight, Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  // Password Security Rules Validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet the security policy requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      await signup({
        email,
        password,
        employee_id: employeeId,
        full_name: fullName,
        role,
        job_title: jobTitle || undefined,
      });
      setVerificationModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glow Mesh */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Card with Rounded Corners & Overflow Clip */}
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] bg-white rounded-2xl shadow-floating border border-slate-200/80 relative z-10 text-slate-900 overflow-hidden flex flex-col">
        {/* Inner Scrollable Viewport */}
        <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl shadow-md mb-3">
              D
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Create Employee Account</h1>
            <p className="text-xs text-slate-500 mt-1">Register new organization member on Dayflow AI</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Mehta"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP-1002"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR">HR Officer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.mehta@dayflow.ai"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title (Optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Software Engineer"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              />
            </div>

            {/* Password & Confirm Password 2-Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none transition-all font-medium ${
                      confirmPassword && !passwordsMatch ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <XCircle className="w-3 h-3" /> Passwords match error
                  </p>
                )}
              </div>
            </div>


            {/* Password Security Rules Checklist */}
            {password && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <p className="font-semibold text-slate-700 mb-1">Security Policy Checklist:</p>
                <div className="grid grid-cols-2 gap-1 text-slate-600">
                  <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                    8+ Characters
                  </span>
                  <span className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasUppercase ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                    1 Uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasNumber ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                    1 Number (0-9)
                  </span>
                  <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-semibold' : ''}`}>
                    {hasSpecial ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                    1 Symbol (!@#$)
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Creating account...' : 'Create Employee Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Email Verification Required Notice Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-floating border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Email Verification Sent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A verification activation link has been sent to <span className="font-bold text-indigo-600">{email}</span>. Please verify your email to complete activation before logging in.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Account created successfully with employee ID {employeeId}.</span>
            </div>

            <button
              onClick={() => {
                setVerificationModalOpen(false);
                navigate('/dashboard');
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Proceed to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
