import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Role } from '../types';
import { User, Mail, Lock, BadgeCheck, ArrowRight, Shield, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);

  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const isBusy = loading || isSubmitting || isVerifying;

  // Lock body & html background to slate-950 dark to eliminate over-scroll white space gaps
  useEffect(() => {
    const origBodyBg = document.body.style.backgroundColor;
    const origHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = '#020617';
    document.documentElement.style.backgroundColor = '#020617';
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
      setError('Password does not meet security requirements (8+ chars, uppercase, number, symbol).');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email,
        password,
        employee_id: employeeId,
        full_name: fullName,
        role: 'EMPLOYEE',
        job_title: jobTitle || undefined,
      });
      setVerificationModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    try {
      await authService.verifyEmail(email);
      setVerificationModalOpen(false);
      navigate('/login', {
        state: { info: `Email successfully verified for ${email}. You can now sign in!` },
      });
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 text-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto relative font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Rich Vibrant Google Material 3 Glowing Gradient Mesh Orbs */}
      <div className="fixed -top-32 -left-32 w-[650px] h-[650px] bg-blue-600/40 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed -bottom-32 -right-32 w-[700px] h-[700px] bg-indigo-600/45 rounded-full blur-[110px] pointer-events-none" />
      <div className="fixed top-1/4 right-10 w-[550px] h-[550px] bg-purple-500/35 rounded-full blur-[95px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/35 rounded-full blur-[90px] pointer-events-none" />

      {/* Google Material 3 Fixed Centered Card Container */}
      <div className="w-full max-w-md relative z-10 my-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.45)] border border-white/40 overflow-hidden p-6 sm:p-8">
          
          <div className="text-center mb-5">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" showSubtitle />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Create Employee Account</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Register new staff member on Dayflow HRMS</p>
          </div>

          <div>
            {error && (
              <div className="mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
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

              {/* Password & Confirm Password Grid */}
              <div className="relative">
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
                        onFocus={() => setShowChecklistPopover(true)}
                        onBlur={() => setShowChecklistPopover(false)}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setShowChecklistPopover(true);
                        }}
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
                        placeholder="Re-enter"
                        className={`w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-2xl text-xs text-slate-900 focus:outline-none transition-all font-medium disabled:opacity-60 ${
                          confirmPassword && !passwordsMatch ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Overlay Hover Popover */}
                {(showChecklistPopover || (password && !isPasswordValid)) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-[0_15px_35px_rgba(0,0,0,0.18)] text-[11px] space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                      <span>Security Policy Checklist:</span>
                      {isPasswordValid && <span className="text-[#34A853] text-[10px]">Passed ✓</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#34A853] font-bold' : ''}`}>
                        {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                        8+ Characters
                      </span>
                      <span className={`flex items-center gap-1 ${hasUppercase ? 'text-[#34A853] font-bold' : ''}`}>
                        {hasUppercase ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                        1 Uppercase (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-[#34A853] font-bold' : ''}`}>
                        {hasNumber ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                        1 Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 ${hasSpecial ? 'text-[#34A853] font-bold' : ''}`}>
                        {hasSpecial ? <CheckCircle2 className="w-3 h-3 text-[#34A853]" /> : <AlertCircle className="w-3 h-3 text-slate-400" />}
                        1 Symbol (!@#$)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isBusy || !isPasswordValid || !passwordsMatch}
                className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Create Employee Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-4">
              Already registered?{' '}
              <Link to="/login" className="text-[#1a73e8] font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Verification Notice Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-floating border border-slate-200 text-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1a73e8] mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Email Verification Sent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An activation link has been sent to <span className="font-bold text-[#1a73e8]">{email}</span>. You must verify your email before sign in is permitted.
              </p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <CheckCircle2 className="w-4 h-4 text-[#34A853] shrink-0" />
                <span>Evaluation & Test Verification Link</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                If custom SMTP credentials (e.g. SendGrid/Resend) are not configured in your local environment, use the instant verification link below to verify your account in 1 click.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerifyEmail}
                className="w-full py-3 bg-[#34A853] hover:bg-[#2d9247] text-white font-bold text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying & Activating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>📩 Verify Email & Activate Account Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationModalOpen(false);
                  navigate('/login', {
                    state: { info: `Registration complete for ${email}. Please check your email inbox or click verification link before logging in.` },
                  });
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-full transition-all flex items-center justify-center gap-1.5"
              >
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
