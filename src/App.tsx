import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  Award,
  CalendarCheck,
  Calendar,
  Users,
  UserCheck,
  Loader2,
  KeyRound,
  Trash2,
  RotateCcw,
  LogOut,
  X,
  AlertTriangle,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AuthPage } from './components/auth/AuthPage';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

// Student Portal Tabs
const STUDENT_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'notices', label: 'Notice Board', icon: Megaphone },
  { id: 'courses', label: 'My Courses', icon: BookOpen },
  { id: 'grades', label: 'Grades & Report', icon: Award },
  { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
];

// Teacher Portal Tabs
const TEACHER_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
  { id: 'courses', label: 'Courses & Classes', icon: BookOpen },
  { id: 'request', label: 'Request', icon: Users },
  { id: 'results', label: 'Academic Results', icon: Award },
  { id: 'notices', label: 'Notice Board', icon: Megaphone },
];

// Administrator Master Tabs
const ADMIN_TABS = [
  { id: 'overview', label: 'Master Overview', icon: LayoutDashboard },
  { id: 'accounts', label: 'Account Management', icon: KeyRound },
  { id: 'mentors', label: 'Mentor Allocation', icon: UserCheck },
  { id: 'results', label: 'Result Publication', icon: Award },
  { id: 'timetable', label: 'Master Timetable', icon: Calendar },
  { id: 'directory', label: 'Faculty & Students', icon: Users },
  { id: 'recycle', label: 'Recycle', icon: RotateCcw },
  { id: 'notices', label: 'Campus Broadcaster', icon: Megaphone },
];

const MainApp: React.FC = () => {
  const { user, role, isLoading, logout } = useAuth();
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [currentTab, setCurrentTabState] = useState<string>(() => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const savedTab = sessionStorage.getItem('eduportal_active_tab') || localStorage.getItem('eduportal_active_tab');
      return savedTab || 'overview';
    } catch {
      return 'overview';
    }
  });

  // Intercept browser back button (popstate) navigation
  useEffect(() => {
    if (!user) return;

    try {
      window.history.pushState({ eduportalSessionGuard: true }, '', window.location.href);
    } catch (e) {}

    const handlePopState = () => {
      setShowExitConfirmModal(true);
      try {
        window.history.pushState({ eduportalSessionGuard: true }, '', window.location.href);
      } catch (err) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  const handleConfirmExit = () => {
    setShowExitConfirmModal(false);
    logout();
  };

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    try {
      sessionStorage.setItem('eduportal_active_tab', tab);
      localStorage.setItem('eduportal_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch (e) {}
  };

  // Sync tab with URL hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        setCurrentTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!role) return;
    const validTabs =
      role === 'student'
        ? STUDENT_TABS.map((t) => t.id)
        : role === 'teacher'
        ? TEACHER_TABS.map((t) => t.id)
        : ADMIN_TABS.map((t) => t.id);

    if (!validTabs.includes(currentTab)) {
      const fallback = validTabs.includes(currentTab) ? currentTab : 'overview';
      setCurrentTab(fallback);
    }
  }, [role]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F7FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading EduPortal...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const activeTabs =
    role === 'student'
      ? STUDENT_TABS
      : role === 'teacher'
      ? TEACHER_TABS
      : ADMIN_TABS;

  return (
    <div className="min-h-screen bg-[#F6F7FA] text-slate-800 flex flex-col justify-between">
      <div>
        {/* Top Sticky Navbar */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          tabs={activeTabs}
          onRequestExit={() => setShowExitConfirmModal(true)}
        />

        {/* Dashboard Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {role === 'student' ? (
            <StudentDashboard currentTab={currentTab} />
          ) : role === 'teacher' ? (
            <TeacherDashboard currentTab={currentTab} />
          ) : (
            <AdminDashboard currentTab={currentTab} onSelectTab={setCurrentTab} />
          )}
        </main>
      </div>

      {/* Quit Page & Logout Confirmation Modal */}
      {showExitConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-scaleUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white relative">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] uppercase font-black text-rose-200 tracking-wider">
                Exit Confirmation
              </span>
              <h3 className="text-xl font-bold mt-0.5">Quit Page & Log Out?</h3>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3.5 p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{user.name}</p>
                  <p className="text-slate-500 text-xs">
                    Role: <strong className="text-rose-700 capitalize">{user.role}</strong> • ID: <span className="font-mono text-slate-700">{user.studentId || user.employeeId || user.username || user.email}</span>
                  </p>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed font-medium text-xs">
                Moving back will quit the current page, log out your account (<strong>{user.name}</strong>), and require you to enter your credentials to log in again.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel (Stay)
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="px-5 py-2.5 rounded-xl font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 cursor-pointer transition-all flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Quit & Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
