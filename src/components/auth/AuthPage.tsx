import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Check,
  School,
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { StudentIllustration } from '../illustrations/StudentIllustration';
import { TeacherIllustration } from '../illustrations/TeacherIllustration';
import { SignupModal } from './SignupModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useApp();

  const [authStep, setAuthStep] = useState<'select-role' | 'student-login' | 'teacher-login' | 'admin-login'>('select-role');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Form State
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRemember, setStudentRemember] = useState(false);

  // Teacher Form State
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherRemember, setTeacherRemember] = useState(false);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Modals
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupRole, setSignupRole] = useState<Role>('student');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername) {
      showToast('Enter Username', 'Please enter your username or email', 'warning');
      return;
    }
    setIsSubmitting(true);
    const success = await login(studentUsername, studentPassword, 'student');
    setIsSubmitting(false);
    if (success) {
      showToast('Welcome!', 'Logged into Student Dashboard.', 'success');
    } else {
      showToast('Login Failed', 'Invalid username or password.', 'error');
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherUsername) {
      showToast('Enter Username', 'Please enter your username or email', 'warning');
      return;
    }
    setIsSubmitting(true);
    const success = await login(teacherUsername, teacherPassword, 'teacher');
    setIsSubmitting(false);
    if (success) {
      showToast('Welcome!', 'Logged into Teacher Dashboard.', 'success');
    } else {
      showToast('Login Failed', 'Invalid username or password.', 'error');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsSubmitting(true);
    const success = await login(adminEmail.trim(), adminPassword.trim(), 'admin');
    setIsSubmitting(false);
    if (success) {
      showToast('Master Access Granted', 'Logged into Central Administrator Control Center.', 'success');
    } else {
      setAdminError('Access restricted: Invalid administrator email or password.');
      showToast('Access Denied', 'Invalid administrator email or password.', 'error');
    }
  };

  const openSignUpFor = (role: Role) => {
    setSignupRole(role);
    setSignupModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F7] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <School className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
            Student Dashboard
          </h1>
        </div>

        {authStep === 'select-role' ? (
          <button
            onClick={() => { setAuthStep('admin-login'); setAdminError(''); }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all border border-slate-700/60 flex items-center gap-2 cursor-pointer group"
            title="Institutional Administrator Login"
          >
            <Shield className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={() => setAuthStep('select-role')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Selection
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full my-auto py-6">
        {/* STEP 1: ROLE SELECTION */}
        {authStep === 'select-role' && (
          <div className="space-y-8 animate-fadeIn text-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] tracking-tight">Who wants to login?</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Please select your profile to access your dashboard</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-2">
              <div onClick={() => setAuthStep('student-login')} className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border-2 border-transparent hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5">
                <div>
                  <div className="pt-2 pb-6"><StudentIllustration className="w-full max-w-[200px] h-36 mx-auto group-hover:scale-105 transition-transform" /></div>
                  <h3 className="text-2xl font-extrabold text-[#2C3E50] tracking-tight mb-2">Student</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Access coursework, master timetable, notice board, GPA transcript & attendance records.</p>
                </div>
                <div className="mt-8 pt-4">
                  <button type="button" className="w-full py-3.5 px-6 rounded-full bg-[#2ECC71] group-hover:bg-[#27AE60] text-white font-bold text-base shadow-lg shadow-[#2ECC71]/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <span>Login as Student</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div onClick={() => setAuthStep('teacher-login')} className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border-2 border-transparent hover:border-slate-700 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5">
                <div>
                  <div className="pt-2 pb-6"><TeacherIllustration className="w-full max-w-[200px] h-36 mx-auto group-hover:scale-105 transition-transform" /></div>
                  <h3 className="text-2xl font-extrabold text-[#2C3E50] tracking-tight mb-2">Teacher</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Manage classes, timetable, student accommodation, notice circulars & roll-call attendance.</p>
                </div>
                <div className="mt-8 pt-4">
                  <button type="button" className="w-full py-3.5 px-6 rounded-full bg-[#B0B7C3] group-hover:bg-slate-800 text-white font-bold text-base shadow-md shadow-slate-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <span>Login as Teacher</span><ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: STUDENT LOGIN */}
        {authStep === 'student-login' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="pt-2 pb-6"><StudentIllustration className="w-full max-w-[200px] h-36 mx-auto" /></div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] tracking-tight">Student Login</h2>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">
                    Not a member yet?{' '}
                    <button type="button" onClick={() => openSignUpFor('student')} className="text-[#2ECC71] hover:text-[#27AE60] font-semibold hover:underline transition-colors cursor-pointer">Sign up!</button>
                  </p>
                </div>
                <form onSubmit={handleStudentSubmit} className="space-y-6 max-w-sm mx-auto">
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b-2 border-[#2ECC71] pb-2 transition-colors">
                      <UserIcon className="w-4 h-4 text-slate-500 mr-3 shrink-0" />
                      <input type="text" required value={studentUsername} onChange={(e) => setStudentUsername(e.target.value)} placeholder="Username or E-mail" className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b-2 border-[#2ECC71] pb-2 transition-colors">
                      <Lock className="w-4 h-4 text-slate-500 mr-3 shrink-0" />
                      <input type="password" required value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} placeholder="Password" className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                      <input type="checkbox" checked={studentRemember} onChange={(e) => setStudentRemember(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#2ECC71] focus:ring-[#2ECC71]/30 accent-[#2ECC71] cursor-pointer" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" onClick={() => setForgotPasswordOpen(true)} className="hover:text-slate-600 transition-colors cursor-pointer">Forgot Password?</button>
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-6 rounded-full bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold text-base shadow-lg shadow-[#2ECC71]/30 hover:shadow-[#2ECC71]/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Login</span><Check className="w-4 h-4 stroke-[3]" /></>}
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <button type="button" onClick={() => setAuthStep('select-role')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">← Change role selection</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TEACHER LOGIN */}
        {authStep === 'teacher-login' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="pt-2 pb-6"><TeacherIllustration className="w-full max-w-[200px] h-36 mx-auto" /></div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] tracking-tight">Teacher Login</h2>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">
                    Not a member yet?{' '}
                    <button type="button" onClick={() => openSignUpFor('teacher')} className="text-[#2ECC71] hover:text-[#27AE60] font-semibold hover:underline transition-colors cursor-pointer">Sign up!</button>
                  </p>
                </div>
                <form onSubmit={handleTeacherSubmit} className="space-y-6 max-w-sm mx-auto">
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b border-slate-200 focus-within:border-slate-600 pb-2 transition-colors">
                      <UserIcon className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                      <input type="text" required value={teacherUsername} onChange={(e) => setTeacherUsername(e.target.value)} placeholder="Username or E-mail" className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b border-slate-200 focus-within:border-slate-600 pb-2 transition-colors">
                      <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                      <input type="password" required value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} placeholder="Password" className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                      <input type="checkbox" checked={teacherRemember} onChange={(e) => setTeacherRemember(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500/30 accent-slate-700 cursor-pointer" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" onClick={() => setForgotPasswordOpen(true)} className="hover:text-slate-600 transition-colors cursor-pointer">Forgot Password?</button>
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-6 rounded-full bg-[#B0B7C3] hover:bg-slate-700 hover:text-white text-white font-bold text-base shadow-md shadow-slate-300/40 hover:shadow-slate-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Login</span>}
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <button type="button" onClick={() => setAuthStep('select-role')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">← Change role selection</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ADMIN LOGIN */}
        {authStep === 'admin-login' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-400/20 border border-slate-200 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="text-center pt-2 pb-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-slate-900/20 mb-3">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Institutional Control Center</span>
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Login</h2>
                  <p className="text-xs text-slate-500 mt-1.5 font-medium">Strictly for authorized institutional administrators</p>
                </div>
                <form onSubmit={handleAdminSubmit} className="space-y-5 max-w-sm mx-auto">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">Admin Email ID</label>
                    <div className="relative flex items-center border border-slate-300 rounded-2xl bg-slate-50/70 px-3 py-2.5 focus-within:border-slate-800 focus-within:bg-white transition-all">
                      <UserIcon className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input type="email" required value={adminEmail} onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }} placeholder="admin@bitsathy.ac.in" className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">Master Password</label>
                    <div className="relative flex items-center border border-slate-300 rounded-2xl bg-slate-50/70 px-3 py-2.5 focus-within:border-slate-800 focus-within:bg-white transition-all">
                      <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                      <input type="password" required value={adminPassword} onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }} placeholder="••••••••••••" className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                    </div>
                  </div>
                  {adminError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{adminError}</span>
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Admin Authorization:</p>
                      <p className="font-mono text-slate-500">admin@bitsathy.ac.in</p>
                    </div>
                    <button type="button" onClick={() => { setAdminEmail('admin@bitsathy.ac.in'); setAdminPassword('admin@1234'); setAdminError(''); }} className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-[10px] cursor-pointer transition-colors">Auto-Fill</button>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 text-amber-400" /><span>Access Admin Console</span></>}
                    </button>
                  </div>
                </form>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button type="button" onClick={() => setAuthStep('select-role')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">← Back to Selection</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-3 text-xs text-slate-400">
        <p>Student Dashboard • Role-Based Academic Management</p>
      </footer>

      <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} initialRole={signupRole} />
      <ForgotPasswordModal isOpen={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
    </div>
  );
};
