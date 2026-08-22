import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, User, Info, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const infoMsg = (location.state as any)?.info;
  const isBusy = loading || isAuthenticating;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setError(null);
    setIsAuthenticating(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setIsAuthenticating(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    if (isBusy) return;
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setIsAuthenticating(true);
    try {
      await login({ email: demoEmail, password: 'password123' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo credentials');
      setIsAuthenticating(false);
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
        
        {/* Left Google Branding & Header Column */}
        <div className="md:w-5/12 bg-slate-50/80 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            {/* Google / Dayflow Logo Emblem */}
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

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Sign in</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              to continue to your Dayflow HRMS Workspace
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/60 hidden md:block">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#34A853]" />
              <span>Enterprise Encrypted & High-Security Workspace</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Single Sign-On & Role-Based Access Control</p>
          </div>
        </div>

        {/* Right Form & Interactive Google Sign-In Column */}
        <div className="md:w-7/12 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>

            {infoMsg && (
              <div className="mb-5 p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{infoMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Google Material 3 Outlined Input: Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    disabled={isBusy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dayflow.ai"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Google Material 3 Outlined Input: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isBusy}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Google Primary Pill Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <Link to="/signup" className="text-xs font-bold text-[#1a73e8] hover:underline">
                  Create account
                </Link>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="py-3 px-7 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Demo Flow Banner */}
            <div className="mt-6 p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 font-bold text-center flex items-center justify-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#1a73e8] shrink-0" />
              <span>Demo: Admin → Approve Leave → Ask AI about WFH policy → Employee Clock-In</span>
            </div>

            {/* Google Account Quick Selector Cards */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                One-Click Quick Sign In (Demo Accounts)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin('arjun.rao@dayflow.ai')}
                  className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all flex items-center gap-3 text-left disabled:opacity-60 group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {isBusy && email === 'arjun.rao@dayflow.ai' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      'A'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#1a73e8] transition-colors truncate">
                      Arjun Rao
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">arjun.rao@dayflow.ai</p>
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 bg-blue-100 text-[#1a73e8] rounded-full">
                    ADMIN
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin('rahul.mehta@dayflow.ai')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center gap-3 text-left disabled:opacity-60 group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {isBusy && email === 'rahul.mehta@dayflow.ai' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      'R'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                      Rahul Mehta
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">rahul.mehta@dayflow.ai</p>
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                    STAFF
                  </span>
                </button>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-4 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>English (United States)</span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Help</a>
              <a href="#" className="hover:underline">Privacy</a>
              <a href="#" className="hover:underline">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
