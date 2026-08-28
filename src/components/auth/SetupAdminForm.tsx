import React, { useState } from 'react';
import { usePayroll } from '../../context/PayrollContext';
import { ShieldAlert, User, Mail, Lock, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface SetupAdminFormProps {
  onBackToLogin?: () => void;
}

export const SetupAdminForm: React.FC<SetupAdminFormProps> = ({ onBackToLogin }) => {
  const { setupAdmin } = usePayroll();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupSecret, setShowSetupSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupClosed, setIsSetupClosed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await setupAdmin({ fullName, email, password, setupSecret: setupSecret || undefined });
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize administrator.';
      setError(msg);
      if (msg.includes('closed') || msg.includes('already exist') || msg.includes('SETUP_CLOSED')) {
        setIsSetupClosed(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-200">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Setup</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Initialize First System Administrator
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold space-y-2">
            <div>{error}</div>
            {isSetupClosed && onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 mt-1 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Go to Sign In Page
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="RABIU"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Administrator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="elmuaztechnologiesltd@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Setup Secret (Optional)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showSetupSecret ? 'text' : 'password'}
                value={setupSecret}
                onChange={e => setSetupSecret(e.target.value)}
                placeholder="Enter secret if admins exist"
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowSetupSecret(!showSetupSecret)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                title={showSetupSecret ? 'Hide Secret' : 'Show Secret'}
              >
                {showSetupSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Initializing Administrator...'
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Initialize System Administrator
              </>
            )}
          </button>
        </form>

        {onBackToLogin && (
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onBackToLogin}
              className="text-xs text-slate-600 hover:text-slate-800 font-bold flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
