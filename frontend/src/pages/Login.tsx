import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    try {
      await login({ email: demoEmail, password: 'password123' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo credentials');
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden relative select-none">
      {/* Background Glow Mesh */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Card Container with Rounded Corners & Overflow Clip */}
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] bg-white rounded-2xl shadow-floating border border-slate-200/80 relative z-10 text-slate-900 overflow-hidden flex flex-col">
        {/* Inner Scrollable Viewport */}
        <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar">

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl shadow-md mb-3">
              D
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dayflow AI</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Human Resource Management System</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjun.rao@dayflow.ai"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Quick Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Demo Accounts (One-Click Sign In)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('arjun.rao@dayflow.ai')}
                className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 border border-indigo-100"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold truncate">Arjun Rao</p>
                  <p className="text-[10px] text-indigo-500 font-medium truncate">Admin / HR</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('rahul.mehta@dayflow.ai')}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 border border-slate-200/60"
              >
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold truncate">Rahul Mehta</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">Employee</p>
                </div>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
              Register new employee
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
