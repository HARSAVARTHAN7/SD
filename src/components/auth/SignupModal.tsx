import React, { useState } from 'react';
import { X, UserCheck, GraduationCap, Briefcase, Mail, User, Lock, BookOpen } from 'lucide-react';
import { Role } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: Role;
}

export const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, initialRole = 'student' }) => {
  const { register } = useAuth();
  const { showToast } = useApp();

  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Student
  const [grade, setGrade] = useState('Grade 11');
  const [rollNo, setRollNo] = useState('');

  // Teacher
  const [department, setDepartment] = useState('Mathematics & Sciences');
  const [title, setTitle] = useState('Assistant Faculty');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      showToast('Missing Fields', 'Please fill in all required fields.', 'warning');
      return;
    }

    const success = register({
      name,
      username,
      email,
      password,
      role,
      grade: role === 'student' ? grade : undefined,
      rollNo: role === 'student' ? (rollNo || `2024-${Math.floor(100 + Math.random() * 900)}`) : undefined,
      department: role === 'teacher' ? department : undefined,
      title: role === 'teacher' ? title : undefined,
    });

    if (success) {
      showToast('Registration Successful!', `Welcome to EduPortal, ${name}!`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transition-all transform scale-100">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-slate-50 to-emerald-50/40 border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 text-emerald-600 mb-1">
            <UserCheck className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Join EduPortal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create your Account</h2>
          <p className="text-sm text-slate-500 mt-0.5">Choose your account type to personalize your workspace.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                role === 'student'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                role === 'teacher'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Teacher / Faculty
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'student' ? 'e.g. Alex Morgan' : 'e.g. Dr. Robert Shaw'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alexmorgan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@school.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'student' ? (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                  Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none text-slate-800"
                >
                  <option value="Grade 9">Grade 9 (Freshman)</option>
                  <option value="Grade 10">Grade 10 (Sophomore)</option>
                  <option value="Grade 11">Grade 11 (Junior)</option>
                  <option value="Grade 12">Grade 12 (Senior)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                  Student Roll #
                </label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 2024-425"
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100">
              <div>
                <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Science"
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-purple-800 uppercase tracking-wider mb-1">
                  Academic Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Professor / Faculty"
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Complete Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
