import React, { useState } from 'react';
import { usePayroll } from '../../context/PayrollContext';
import {
  Lock,
  Mail,
  UtensilsCrossed,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Send
} from 'lucide-react';
import { forgotPasswordApi, resetPasswordApi } from '../../services/api';

interface LoginFormProps {
  onSwitchToSetup?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSetup }) => {
  const { login } = usePayroll();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot / Reset Password state
  const [viewMode, setViewMode] = useState<'LOGIN' | 'FORGOT_EMAIL' | 'RESET_PASSWORD' | 'RESET_SUCCESS'>('LOGIN');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await forgotPasswordApi(resetEmail.trim());
      if (res.resetCode) {
        setResetCode(res.resetCode); // Autofill reset code for convenient demo/testing
      }
      setResetMessage(res.message || 'Verification code has been sent to your email address.');
      setViewMode('RESET_PASSWORD');
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send reset code.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handlePerformPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!resetCode.trim()) {
      setResetError('Verification code is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await resetPasswordApi({
        email: resetEmail.trim(),
        resetCode: resetCode.trim(),
        newPassword
      });
      setResetMessage(res.message || 'Password updated successfully!');
      setViewMode('RESET_SUCCESS');
    } catch (err: any) {
      setResetError(err?.message || 'Failed to update password.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-200">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Maiduguri Restaurant</h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Computerized Payroll Management System
          </p>
        </div>

        {/* MODE 1: Standard Login Form */}
        {viewMode === 'LOGIN' && (
          <>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="manager@maidugurirestaurant.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetError(null);
                      setResetMessage(null);
                      setViewMode('FORGOT_EMAIL');
                    }}
                    className="text-[11px] text-brand-700 hover:text-brand-800 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  'Authenticating...'
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Sign In to Portal
                  </>
                )}
              </button>
            </form>

            {onSwitchToSetup && (
              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={onSwitchToSetup}
                  className="text-xs text-brand-700 hover:text-brand-800 font-bold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Initialize First Administrator
                </button>
              </div>
            )}
          </>
        )}

        {/* MODE 2: Request Password Reset Verification Code */}
        {viewMode === 'FORGOT_EMAIL' && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Reset Your Password</h3>
              <p className="text-xs text-slate-500">Enter your email address to receive a verification code</p>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleRequestResetCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="elmuaztechnologiesltd@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetSubmitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Verification Code
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setViewMode('LOGIN')}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        )}

        {/* MODE 3: Enter Reset Code and New Password */}
        {viewMode === 'RESET_PASSWORD' && (
          <div className="space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Enter Verification Code</h3>
              <p className="text-xs text-slate-500">We sent a verification code to <span className="font-bold text-slate-800">{resetEmail}</span></p>
            </div>

            {resetMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-semibold">
                {resetMessage}
              </div>
            )}

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handlePerformPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 text-center text-lg tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetSubmitting}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Update Password & Save
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setViewMode('LOGIN')}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Back to Sign In
            </button>
          </div>
        )}

        {/* MODE 4: Reset Success Confirmation */}
        {viewMode === 'RESET_SUCCESS' && (
          <div className="text-center space-y-5 py-4 animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Your password has been successfully updated in Neon PostgreSQL records. You can now sign in with your new password.
              </p>
            </div>
            <button
              onClick={() => {
                setPassword('');
                setViewMode('LOGIN');
              }}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
