import React, { useState } from 'react';
import { X, KeyRound, Mail, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTHORIZED_RESET_EMAIL = 'harsavarthan.cs23@bitsathy.ac.in';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (cleanEmail !== AUTHORIZED_RESET_EMAIL.toLowerCase()) {
      setErrorMessage(`Password reset link is restricted and authorized ONLY for ${AUTHORIZED_RESET_EMAIL}`);
      showToast('Restricted Access', `Reset links are only dispatched to ${AUTHORIZED_RESET_EMAIL}`, 'warning');
      return;
    }

    setSubmitted(true);
    showToast('Reset Link Dispatched', `Recovery link successfully sent to ${AUTHORIZED_RESET_EMAIL}`, 'success');
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 relative">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-800">Reset Your Password</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Enter the authorized institutional email address to receive secure recovery credentials.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Authorized Recovery Email
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(AUTHORIZED_RESET_EMAIL);
                      setErrorMessage('');
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Auto-Fill Authorized
                  </button>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="harsavarthan.cs23@bitsathy.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security Restriction:
                </p>
                <p className="text-[11px] text-slate-500">
                  Password reset link is authorized <strong>only</strong> for <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded">{AUTHORIZED_RESET_EMAIL}</span>.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Dispatch Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Check Your Inbox</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              Official institutional password recovery instructions have been successfully dispatched to{' '}
              <strong className="text-emerald-700 font-mono block mt-1">{AUTHORIZED_RESET_EMAIL}</strong>.
            </p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
