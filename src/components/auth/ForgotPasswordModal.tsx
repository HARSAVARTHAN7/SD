import React, { useState } from 'react';
import { X, KeyRound, Mail, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Lock, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { showToast, submitChangeRequest, allUsers, updateUser } = useApp();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'student-sent' | 'teacher-otp' | 'success'>('request');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    if (role === 'student') {
      // Student Reset Flow -> Submit request for Admin Approval
      const studentUser = allUsers.find(
        (u) => u.role === 'student' && (u.email.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanEmail || u.rollNo?.toLowerCase() === cleanEmail)
      );

      submitChangeRequest({
        studentId: studentUser?.id || 'std-reset-req',
        studentName: studentUser?.name || cleanEmail,
        teacherId: 'admin',
        teacherName: 'Administrator',
        description: `STUDENT_PASSWORD_RESET: Request to send reset OTP to ${cleanEmail}`,
        status: 'pending',
        timestamp: new Date().toLocaleString(),
      });

      setStep('student-sent');
      showToast('Admin Approval Requested', `Password reset request for ${cleanEmail} sent to Admin for approval.`, 'info');
    } else {
      // Teacher Reset Flow -> Directly generate & send OTP to email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setStep('teacher-otp');
      showToast('OTP Sent Directly to Email', `Teacher password reset OTP [${otp}] dispatched to ${cleanEmail}`, 'success');
    }
  };

  const handleVerifyTeacherOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (inputOtp.trim() !== generatedOtp) {
      setErrorMessage('Invalid 6-digit OTP code. Please check your email and try again.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Update teacher password in database
    const teacherUser = allUsers.find(
      (u) => u.role === 'teacher' && (u.email.toLowerCase() === email.trim().toLowerCase() || u.username?.toLowerCase() === email.trim().toLowerCase())
    );

    if (teacherUser) {
      updateUser({
        ...teacherUser,
        password: newPassword,
      });
    }

    setStep('success');
    showToast('Password Changed!', 'Your password has been updated successfully.', 'success');
  };

  const handleReset = () => {
    setStep('request');
    setEmail('');
    setInputOtp('');
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-800">Forgot Password</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Enter your email or username to reset your institutional account password.
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {role === 'student' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Approval Security Notice:
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Student password reset requests require Admin authorization. Upon Admin approval, a reset OTP will be dispatched to your email.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Instant Direct Dispatch:
                  </p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    A 6-digit verification OTP will be sent directly to your registered faculty email address.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>{role === 'student' ? 'Request Admin Approval & OTP' : 'Send OTP to Faculty Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {step === 'student-sent' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Admin Approval Requested</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Password reset request for student <strong className="text-slate-900 block font-mono mt-1">{email}</strong> has been sent to the Admin.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
              Once the Admin approves your request in the control center, an OTP will be dispatched to your email to change your password.
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Back to Login
            </button>
          </div>
        )}

        {step === 'teacher-otp' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Enter OTP & Set Password</h3>
            <p className="text-xs text-slate-500">
              OTP dispatched to <strong className="text-slate-800 font-mono">{email}</strong>.
            </p>

            {/* On-screen OTP Badge for Web Simulation */}
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Dispatched OTP Code:</p>
                <p className="font-mono text-xl font-black text-purple-900 tracking-widest">{generatedOtp}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputOtp(generatedOtp);
                  showToast('OTP Auto-Filled', '6-digit OTP copied to verification box.', 'info');
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-all"
              >
                Auto-Fill OTP
              </button>
            </div>

            <form onSubmit={handleVerifyTeacherOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value)}
                  placeholder="e.g. 749201"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-base font-bold tracking-widest text-purple-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 text-slate-800"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <span>Verify OTP & Update Password</span>
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Password Reset Successful</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your password has been updated. You can now login using your new password.
            </p>

            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
            >
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
