import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, User, Info, Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';

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
    document.body.style.backgroundColor = '#020617';
    document.documentElement.style.backgroundColor = '#020617';
    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origHtmlBg;
    };
  }, []);

  const handleLoginSuccess = (userPayload: any) => {
    const role = userPayload?.role;

    if (role === 'ADMIN' || role === 'HR') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setError(null);
    setIsAuthenticating(true);
    try {
      const loggedInUser = await login({ email, password });
      handleLoginSuccess(loggedInUser);
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
      const loggedInUser = await login({ email: demoEmail, password: 'password123' });
      handleLoginSuccess(loggedInUser);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo credentials');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 text-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-y-auto relative font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Rich Vibrant Google Material 3 Glowing Gradient Mesh Orbs */}
      <div className="fixed -top-32 -left-32 w-[650px] h-[650px] bg-blue-600/40 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed -bottom-32 -right-32 w-[700px] h-[700px] bg-indigo-600/45 rounded-full blur-[110px] pointer-events-none" />
      <div className="fixed top-1/4 right-10 w-[550px] h-[550px] bg-purple-500/35 rounded-full blur-[95px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 left-10 w-[500px] h-[500px] bg-emerald-500/35 rounded-full blur-[90px] pointer-events-none" />

      {/* Google Material 3 Centered Card Container */}
      <div className="w-full max-w-md relative z-10 my-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.45)] border border-white/40 overflow-hidden p-6 sm:p-8">
          
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" showSubtitle />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">to continue to Dayflow HRMS</p>
          </div>

          <div>
            {infoMsg && (
              <div className="mb-4 p-3 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1a73e8] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{infoMsg}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="name@dayflow.ai"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isBusy}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8] focus:bg-white transition-all font-medium disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Quick Sign In (Demo Accounts)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin('arjun.rao@dayflow.ai')}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all flex items-center gap-2.5 text-left disabled:opacity-60 group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {isBusy && email === 'arjun.rao@dayflow.ai' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      'A'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#1a73e8] transition-colors truncate">
                      Arjun Rao
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">Admin / HR</p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin('rahul.mehta@dayflow.ai')}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center gap-2.5 text-left disabled:opacity-60 group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {isBusy && email === 'rahul.mehta@dayflow.ai' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      'R'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition-colors truncate">
                      Rahul Mehta
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">Employee</p>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-5">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#1a73e8] font-bold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
