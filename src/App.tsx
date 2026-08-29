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
  ShieldAlert
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
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
];

// Teacher Portal Tabs
const TEACHER_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
  { id: 'courses', label: 'Courses & Classes', icon: BookOpen },
  { id: 'roster', label: 'Student Directory', icon: Users },
  { id: 'results', label: 'Academic Results', icon: Award },
  { id: 'announcements', label: 'Notice Board', icon: Megaphone },
];

// Administrator Master Tabs
const ADMIN_TABS = [
  { id: 'overview', label: 'Master Overview', icon: LayoutDashboard },
  { id: 'mentors', label: 'Mentor Allocation', icon: UserCheck },
  { id: 'results', label: 'Result Publication', icon: Award },
  { id: 'timetable', label: 'Master Timetable', icon: Calendar },
  { id: 'directory', label: 'Faculty & Students', icon: Users },
  { id: 'notices', label: 'Campus Broadcaster', icon: Megaphone },
];

const MainApp: React.FC = () => {
  const { user, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');

  useEffect(() => {
    setCurrentTab('overview');
  }, [role]);

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
        />

        {/* Dashboard Main Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {role === 'student' ? (
            <StudentDashboard currentTab={currentTab} />
          ) : role === 'teacher' ? (
            <TeacherDashboard currentTab={currentTab} />
          ) : (
            <AdminDashboard currentTab={currentTab} />
          )}
        </main>
      </div>

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
