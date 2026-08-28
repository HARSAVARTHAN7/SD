import React, { useState } from 'react';
import { User as UserIcon, Lock, Check, School, ArrowLeft, ArrowRight, GraduationCap, Briefcase } from 'lucide-react';
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

  // Screen State: 'select-role' | 'student-login' | 'teacher-login'
  const [authStep, setAuthStep] = useState<'select-role' | 'student-login' | 'teacher-login'>('select-role');

  // Student Form State
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentRemember, setStudentRemember] = useState(false);

  // Teacher Form State
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherRemember, setTeacherRemember] = useState(false);

  // Modals
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [signupRole, setSignupRole] = useState<Role>('student');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername) {
      showToast('Enter Username', 'Please enter your username or email', 'warning');
      return;
    }
    const success = login(studentUsername, studentPassword, 'student');
    if (success) {
      showToast('Welcome!', 'Logged into Student Dashboard.', 'success');
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherUsername) {
      showToast('Enter Username', 'Please enter your username or email', 'warning');
      return;
    }
    const success = login(teacherUsername, teacherPassword, 'teacher');
    if (success) {
      showToast('Welcome!', 'Logged into Teacher Dashboard.', 'success');
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

        {authStep !== 'select-role' && (
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
        {/* ================= STEP 1: INITIAL ROLE SELECTION SCREEN ================= */}
        {authStep === 'select-role' && (
          <div className="space-y-8 animate-fadeIn text-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2C3E50] tracking-tight">
                Who wants to login?
              </h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Please select your profile to access your dashboard
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-2">
              {/* Card 1: Student Option */}
              <div
                onClick={() => setAuthStep('student-login')}
                className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border-2 border-transparent hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5"
              >
                <div>
                  <div className="pt-2 pb-6">
                    <StudentIllustration className="w-full max-w-[200px] h-36 mx-auto group-hover:scale-105 transition-transform" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-[#2C3E50] tracking-tight mb-2">
                    Student
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Access coursework, assignments, timetable, exam grades & attendance records.
                  </p>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    className="w-full py-3.5 px-6 rounded-full bg-[#2ECC71] group-hover:bg-[#27AE60] text-white font-bold text-base shadow-lg shadow-[#2ECC71]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Login as Student</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 2: Teacher Option */}
              <div
                onClick={() => setAuthStep('teacher-login')}
                className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border-2 border-transparent hover:border-slate-700 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer transform hover:-translate-y-1.5"
              >
                <div>
                  <div className="pt-2 pb-6">
                    <TeacherIllustration className="w-full max-w-[200px] h-36 mx-auto group-hover:scale-105 transition-transform" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-[#2C3E50] tracking-tight mb-2">
                    Teacher
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Manage classes, create assignments, grade student submissions & roll-call attendance.
                  </p>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    className="w-full py-3.5 px-6 rounded-full bg-[#B0B7C3] group-hover:bg-slate-800 text-white font-bold text-base shadow-md shadow-slate-300/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Login as Teacher</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: STUDENT LOGIN PAGE ================= */}
        {authStep === 'student-login' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
              <div>
                {/* Student Illustration */}
                <div className="pt-2 pb-6">
                  <StudentIllustration className="w-full max-w-[200px] h-36 mx-auto" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] tracking-tight">
                    Student Login
                  </h2>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">
                    Not a member yet?{' '}
                    <button
                      type="button"
                      onClick={() => openSignUpFor('student')}
                      className="text-[#2ECC71] hover:text-[#27AE60] font-semibold hover:underline transition-colors cursor-pointer"
                    >
                      Sign up!
                    </button>
                  </p>
                </div>

                {/* Student Login Form */}
                <form onSubmit={handleStudentSubmit} className="space-y-6 max-w-sm mx-auto">
                  {/* Username Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b-2 border-[#2ECC71] pb-2 transition-colors">
                      <UserIcon className="w-4 h-4 text-slate-500 mr-3 shrink-0" />
                      <input
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="Username or E-mail"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b-2 border-[#2ECC71] pb-2 transition-colors">
                      <Lock className="w-4 h-4 text-slate-500 mr-3 shrink-0" />
                      <input
                        type="password"
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                      <input
                        type="checkbox"
                        checked={studentRemember}
                        onChange={(e) => setStudentRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#2ECC71] focus:ring-[#2ECC71]/30 accent-[#2ECC71] cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Pill Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold text-base shadow-lg shadow-[#2ECC71]/30 hover:shadow-[#2ECC71]/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Login</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Back Link */}
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setAuthStep('select-role')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  ← Change role selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: TEACHER LOGIN PAGE ================= */}
        {authStep === 'teacher-login' && (
          <div className="max-w-md mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-between">
              <div>
                {/* Teacher Illustration */}
                <div className="pt-2 pb-6">
                  <TeacherIllustration className="w-full max-w-[200px] h-36 mx-auto" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] tracking-tight">
                    Teacher Login
                  </h2>
                  <p className="text-sm text-slate-400 mt-1.5 font-medium">
                    Not a member yet?{' '}
                    <button
                      type="button"
                      onClick={() => openSignUpFor('teacher')}
                      className="text-[#2ECC71] hover:text-[#27AE60] font-semibold hover:underline transition-colors cursor-pointer"
                    >
                      Sign up!
                    </button>
                  </p>
                </div>

                {/* Teacher Login Form */}
                <form onSubmit={handleTeacherSubmit} className="space-y-6 max-w-sm mx-auto">
                  {/* Username Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b border-slate-200 focus-within:border-slate-600 pb-2 transition-colors">
                      <UserIcon className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                      <input
                        type="text"
                        required
                        value={teacherUsername}
                        onChange={(e) => setTeacherUsername(e.target.value)}
                        placeholder="Username or E-mail"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1">
                    <div className="relative flex items-center border-b border-slate-200 focus-within:border-slate-600 pb-2 transition-colors">
                      <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                      <input
                        type="password"
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
                      <input
                        type="checkbox"
                        checked={teacherRemember}
                        onChange={(e) => setTeacherRemember(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500/30 accent-slate-700 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Pill Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full bg-[#B0B7C3] hover:bg-slate-700 hover:text-white text-white font-bold text-base shadow-md shadow-slate-300/40 hover:shadow-slate-600/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Login</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Back Link */}
              <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setAuthStep('select-role')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  ← Change role selection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-3 text-xs text-slate-400">
        <p>Student Dashboard • Role-Based Academic Management</p>
      </footer>

      {/* Signup & Forgot Password Modals */}
      <SignupModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        initialRole={signupRole}
      />
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
};
