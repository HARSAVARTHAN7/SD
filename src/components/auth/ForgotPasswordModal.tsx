import React, { useState } from 'react';
import { X, KeyRound, Mail, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Lock, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { showToast, submitChangeRequest, allUsers } = useApp();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email or roll/employee number.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Please enter a new password of at least 6 characters.');
      return;
    }

    const matchedUser = allUsers.find(
      (u) =>
        u.role === role &&
        (u.email.toLowerCase() === cleanEmail ||
          u.username?.toLowerCase() === cleanEmail ||
          u.rollNo?.toLowerCase() === cleanEmail ||
          u.employeeId?.toLowerCase() === cleanEmail)
    );

    const targetName = matchedUser?.name || cleanEmail;
    const targetId = matchedUser?.id || `req-${role}-${Date.now()}`;

    submitChangeRequest({
      studentId: targetId,
      studentName: targetName,
      teacherId: role,
      teacherName: role === 'student' ? 'Student Account' : 'Teacher Account',
      description: `PASSWORD_RESET_REQUEST: Role=${role.toUpperCase()} | Email=${cleanEmail} | NewPassword=${newPassword}`,
      status: 'pending',
      timestamp: new Date().toLocaleString(),
    });

    setStep('success');
    showToast('Password Reset Request Submitted', `Password change request for ${targetName} sent to Admin Account Management center.`, 'success');
  };

  const handleReset = () => {
    setStep('request');
    setEmail('');
    setNewPassword('');
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

        {step === 'request' && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-800">Request Password Reset</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Submit a password change request directly to the Admin Control Center in Account Management.
            </p>

            {/* Role Selection Switcher */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === 'student' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Student Profile
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  role === 'teacher' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Faculty / Teacher
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  {role === 'student' ? 'Student Email / Roll Number' : 'Teacher Email / Employee ID'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder={role === 'student' ? 'Enter student email or roll number' : 'Enter teacher email address'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Desired New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter desired new password (min 6 characters)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin Account Management Approval:
                </p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Your request will appear directly in the Admin Account Management dashboard. Upon Admin approval, your password will be updated in the database.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Submit Request to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Request Sent to Admin</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Password change request for <strong className="text-slate-900 font-mono block mt-1">{email}</strong> has been sent to the Admin Control Center.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              The Admin will review your request under <strong>Account Management</strong> and approve your new password in the database.
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
