import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { User, Mail, Lock, BadgeCheck, ArrowRight, Shield, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const isBusy = loading || isSubmitting;

  // Lock body & html background to slate-950 dark to eliminate over-scroll white space gaps
  useEffect(() => {
    const origBodyBg = document.body.style.backgroundColor;
    const origHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#0f172a';
    document.documentElement.style.backgroundColor = '#0f172a';
    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origHtmlBg;
    };
  }, []);

  // Password Security Rules Validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet the security policy requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900 text-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none relative font-sans">
      
      {/* Google Material 3 Ambient Quad-Color Gradient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-[#4285F4]/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed -bottom-40 -right-40 w-[550px] h-[550px] bg-[#34A853]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-[450px] h-[450px] bg-[#EA4335]/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-10 left-10 w-[450px] h-[450px] bg-[#FBBC05]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Google Material 3 Split Card Container */}
      <div className="w-full max-w-4xl max-h-[calc(100vh-2rem)] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 relative z-10 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Google Branding Column */}
        <div className="md:w-5/12 bg-slate-50/80 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#4285F4] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1">
                  Dayflow <span className="text-[#1a73e8] font-black text-xs px-1.5 py-0.5 bg-blue-50 rounded-md">AI</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Enterprise HRMS</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Create account</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              Register a new organization staff member on Dayflow HRMS
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/60 hidden md:block">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
              <span>Enterprise Encrypted & High-Security Workspace</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Enterprise Security & Role-Based Privileges</p>
          </div>
        </div>

        {/* Right Registration Form */}
        <div className="md:w-7/12 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    disabled={isBusy}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rahul Mehta"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      disabled={isBusy}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-1002"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value="EMPLOYEE"
                      disabled={true}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none font-medium disabled:opacity-60 cursor-not-allowed"
                    >
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    disabled={isBusy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul.mehta@dayflow.ai"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title (Optional)</label>
                <input
                  type="text"
                  disabled={isBusy}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                />
              </div>

              {/* Password & Confirm Password 2-Column Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      disabled={isBusy}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      disabled={isBusy}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-2xl text-xs text-slate-900 focus:outline-none transition-all font-medium disabled:opacity-60 ${
                        confirmPassword && !passwordsMatch ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Password Security Rules Checklist */}
              {password && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1">
                  <p className="font-semibold text-slate-700 mb-1">Security Policy Checklist:</p>
                  <div className="grid grid-cols-2 gap-1 text-slate-600">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#34A853] font-semibold' : ''}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                      8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUppercase ? 'text-[#34A853] font-semibold' : ''}`}>
                      {hasUppercase ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                      1 Uppercase (A-Z)
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-[#34A853] font-semibold' : ''}`}>
                      {hasNumber ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                      1 Number (0-9)
                    </span>
                    <span className={`flex items-center gap-1 ${hasSpecial ? 'text-[#34A853] font-semibold' : ''}`}>
                      {hasSpecial ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                      1 Symbol (!@#$)
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between">
                <Link to="/login" className="text-xs font-bold text-[#1a73e8] hover:underline">
                  Sign in instead
                </Link>

                <button
                  type="submit"
                  disabled={isBusy || !isPasswordValid || !passwordsMatch}
                  className="py-3 px-7 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Create</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>

          <div className="mt-8 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100">
            <span>English (United States)</span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Help</a>
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Terms</a>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Required Notice Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-6 max-w-md w-full shadow-floating border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1a73e8] mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Verification Link Sent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An activation link has been sent to <span className="font-bold text-[#1a73e8]">{email}</span>. Please verify your email before signing in.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34A853] shrink-0" />
              <span>Account registered with employee ID {employeeId}.</span>
            </div>

            <button
              onClick={() => {
                setVerificationModalOpen(false);
                navigate('/login', {
                  state: { info: `Registration successful for ${email}. Please check your inbox and verify your email before signing in.` },
                });
              }}
              className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
