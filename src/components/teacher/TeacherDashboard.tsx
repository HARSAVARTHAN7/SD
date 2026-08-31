import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  Megaphone,
  Award,
  Calendar,
  Search,
  Check,
  X,
  AlertCircle,
  FileText,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Trash2,
  Bus,
  Home,
  Phone,
  Mail,
  GraduationCap,
  Edit,
  Save,
  MessageSquarePlus,
  Send,
  Ticket,
  XCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PostAnnouncementModal } from './PostAnnouncementModal';
// Removed StorageService and DEFAULT_TIMETABLE
import { User } from '../../types';
import { formatTeacherName } from '../../utils/teacherUtils';

interface TeacherDashboardProps {
  currentTab: string;
  inspectUser?: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentTab, inspectUser }) => {
  const { user: authUser } = useAuth();
  const user = inspectUser || authUser;
  const {
    courses,
    announcements,
    deleteAnnouncement,
    attendance,
    takeAttendance,
    allUsers,
    studentResults,
    showToast,
    submitChangeRequest,
    timetable,
    updateUser,
    academicTermPeriod,
  } = useApp();

  const [postAnnModalOpen, setPostAnnModalOpen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [resultSearch, setResultSearch] = useState('');
  const [teacherSelectedSemester, setTeacherSelectedSemester] = useState<string>('Semester 5');
  const [timetableDay, setTimetableDay] = useState<string>('Monday');

  // Editing student accommodation state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editResidenceType, setEditResidenceType] = useState<'Day Scholar' | 'Hosteler'>('Day Scholar');
  const [editBusRoute, setEditBusRoute] = useState('');
  const [editBusNumber, setEditBusNumber] = useState('');
  const [editBusStop, setEditBusStop] = useState('');
  const [editHostelName, setEditHostelName] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');

  // Change Request State
  const [changeReqStudent, setChangeReqStudent] = useState<User | null>(null);
  const [changeReqDesc, setChangeReqDesc] = useState('');
  const [inspectStudentModal, setInspectStudentModal] = useState<User | null>(null);

  // Broadcast Filter State
  const [teacherBroadcastFilter, setTeacherBroadcastFilter] = useState<'all' | 'admin' | 'teacher'>('all');

  // Attendance Register State
  const [selectedAttDate, setSelectedAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAttCourse, setSelectedAttCourse] = useState<string>('c1');

  // Per-Student Attendance Calendar Modal State
  const [attCalendarStudent, setAttCalendarStudent] = useState<User | null>(null);
  const [attCalendarMonth, setAttCalendarMonth] = useState<Date>(new Date());

  // Attendance Register Search State
  const [attSearch, setAttSearch] = useState('');

  // Date Pop-up Tab Modal inside Attendance Calendar
  const [selectedDateModal, setSelectedDateModal] = useState<{
    dayNum: number;
    dateStr: string;
    currentStatus?: string;
  } | null>(null);

  // Filter students
  const students = allUsers.filter((u) => u.role === 'student');

  // Term working days calculation based on Admin Academic Dates
  const termWorkingDays = (() => {
    if (!academicTermPeriod?.startDate || !academicTermPeriod?.endDate) return 30;
    const start = new Date(academicTermPeriod.startDate);
    const end = new Date(academicTermPeriod.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 30;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 30;
  })();

  // Helper to compute student live attendance rate
  const getStudentAttStats = (st: User) => {
    const studentRecords = attendance.filter((a) => {
      const isUserMatch =
        (a.studentId && st.id && a.studentId === st.id) ||
        (a.studentId && (st.studentId || st.rollNo) && (a.studentId === st.studentId || a.studentId === st.rollNo)) ||
        (a.studentRoll && (st.rollNo || st.studentId) && (a.studentRoll.trim() === (st.rollNo || '').trim() || a.studentRoll.trim() === (st.studentId || '').trim())) ||
        (a.studentName && st.name && a.studentName.toLowerCase().trim() === st.name.toLowerCase().trim());
      if (!isUserMatch) return false;
      if (academicTermPeriod?.startDate && a.date && a.date < academicTermPeriod.startDate) return false;
      if (academicTermPeriod?.endDate && a.date && a.date > academicTermPeriod.endDate) return false;
      return true;
    });

    const absentCount = studentRecords.filter((a) => a.status === 'absent').length;
    const odCount = studentRecords.filter((a) => a.status === 'excused').length;
    const presentCount = studentRecords.filter((a) => a.status === 'present').length;
    const termDays = termWorkingDays || 30;
    const absencePct = termDays > 0 ? (absentCount / termDays) * 100 : 0;
    const rate = Math.max(0, Math.round(100 - absencePct));
    return { rate, absentCount, odCount, presentCount, termDays };
  };

  // List of students with attendance rate < 80%
  const lowAttendanceStudents = students.filter((st) => {
    const { rate } = getStudentAttStats(st);
    return rate < 80;
  });

  // Roll call local state
  const [rollCallState, setRollCallState] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>(() => {
    const map: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    students.forEach((s) => {
      map[s.id] = 'present';
    });
    return map;
  });

  const handleSaveAttendance = () => {
    const records = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      studentRoll: s.studentId || s.rollNo || '2024-418',
      status: rollCallState[s.id] || 'present',
    }));

    takeAttendance(selectedAttDate, selectedAttCourse, records);
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const updated = { ...rollCallState };
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setRollCallState(updated);
    showToast('Updated', `Marked all students as ${status}`, 'info');
  };

  const handleOpenEditAccommodation = (student: User) => {
    setEditingStudent(student);
    setEditResidenceType(student.residenceType || 'Day Scholar');
    setEditBusRoute(student.busRoute || 'Route #14 - North City Express');
    setEditBusNumber(student.busNumber || 'BUS-042');
    setEditBusStop(student.busStop || 'Central Square Stop');
    setEditHostelName(student.hostelName || 'Emerald Heights Residence (Block B)');
    setEditRoomNumber(student.roomNumber || 'Room 304-B');
  };

  const handleSaveAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updatedUser: User = {
      ...editingStudent,
      residenceType: editResidenceType,
      busRoute: editResidenceType === 'Day Scholar' ? editBusRoute : undefined,
      busNumber: editResidenceType === 'Day Scholar' ? editBusNumber : undefined,
      busStop: editResidenceType === 'Day Scholar' ? editBusStop : undefined,
      hostelName: editResidenceType === 'Hosteler' ? editHostelName : undefined,
      roomNumber: editResidenceType === 'Hosteler' ? editRoomNumber : undefined,
    };

    await updateUser(updatedUser);

    setEditingStudent(null);
  };

  const handleSubmitChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReqStudent || !user) return;
    submitChangeRequest({
      studentId: changeReqStudent.id,
      studentName: changeReqStudent.name,
      teacherId: user.id,
      teacherName: user.name,
      description: changeReqDesc,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
    setChangeReqStudent(null);
    setChangeReqDesc('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ================= TAB 1: TEACHER OVERVIEW ================= */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 p-6 sm:p-8 text-white shadow-xl shadow-purple-900/15">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-5">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
                />
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Faculty Management Console</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome, {user?.name}! 📚
                  </h2>
                  <p className="text-purple-100 text-xs sm:text-sm mt-1">
                    {user?.department} • ID: <span className="font-mono">{user?.employeeId || 'FAC-7742'}</span>
                  </p>
                </div>
              </div>

              {/* Broadcast Action Button */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPostAnnModalOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-purple-900 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4 text-purple-600" />
                  Broadcast Notice
                </button>
              </div>
            </div>

            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          </div>

          {/* 4 Analytics Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mentored Students</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{students.length} Enrolled</p>
              <p className="text-xs text-purple-600 font-semibold mt-1">Semester 5 • Computer Science</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Subjects</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{courses.length} Courses</p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">AP Calculus & Physics Sections</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Pass Rate</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">96.4%</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Exceeding Academic Target</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-rose-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Below 80% Att.</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-rose-700 mt-3">{lowAttendanceStudents.length} Students</p>
              <p className="text-xs text-rose-600 font-semibold mt-1">Requires Mentorship Review</p>
            </div>
          </div>

          {/* Low Attendance Alert Card (< 80%) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-rose-200/90 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Low Attendance Alert (&lt; 80%)</h3>
                  <p className="text-xs text-slate-500">Students falling below the mandatory 80% attendance standing threshold.</p>
                </div>
              </div>

              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                lowAttendanceStudents.length > 0
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {lowAttendanceStudents.length === 0 ? '🎉 All Clear (0 Below 80%)' : `⚠️ ${lowAttendanceStudents.length} Students Below 80%`}
              </span>
            </div>

            {lowAttendanceStudents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center space-y-1">
                <p className="text-sm font-bold text-emerald-900">Excellent Attendance Standing!</p>
                <p className="text-xs text-emerald-700">All enrolled students currently maintain an attendance rate of 80% or higher.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lowAttendanceStudents.map((st) => {
                  const { rate, absentCount, odCount } = getStudentAttStats(st);
                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-center justify-between gap-4 hover:bg-rose-50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <img src={st.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-200" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                              {rate}% Rate
                            </span>
                          </div>
                          <p className="text-xs font-mono font-semibold text-rose-800">{st.studentId || st.rollNo}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <strong className="text-rose-700">{absentCount} Days Absent</strong> • {odCount} OD Days
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setAttCalendarStudent(st)}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Mentorship Roster Overview */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Mentored Student Profiles</h3>
                <p className="text-xs text-slate-400">View contact info, semester standing, and assigned accommodation status</p>
              </div>
              <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                Semester 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-5 rounded-3xl bg-slate-50 border border-slate-200/70 hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3.5">
                        <img src={st.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-xs" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm sm:text-base">{st.name}</h4>
                          <p className="text-xs font-mono font-semibold text-purple-700">{st.studentId || st.rollNo}</p>
                          <p className="text-[11px] text-slate-500">{st.department || 'Computer Science'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditAccommodation(st)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Accommodation Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{st.phone || '+1 (555) 349-8291'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        {st.residenceType === 'Day Scholar' ? (
                          <>
                            <Bus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Day Scholar • <strong className="text-slate-800">{st.busRoute || 'Route #14'}</strong> ({st.busNumber || 'BUS-042'})</span>
                          </>
                        ) : (
                          <>
                            <Home className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>Hosteler • <strong className="text-slate-800">{st.hostelName || 'Residence Block A'}</strong> ({st.roomNumber || 'Room 304'})</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ATTENDANCE REGISTER ================= */}
      {currentTab === 'attendance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Daily Attendance Roll Call</h2>
              <p className="text-xs text-slate-500 mt-1">Manage per-student attendance with interactive calendar status popup tabs.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={attSearch}
                onChange={(e) => setAttSearch(e.target.value)}
                placeholder="Search student by name, roll number, or ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="px-3 py-1.5 bg-purple-50 text-purple-800 rounded-xl border border-purple-200">
                👥 {students.filter(
                  (s) =>
                    s.name.toLowerCase().includes(attSearch.toLowerCase()) ||
                    (s.studentId && s.studentId.includes(attSearch)) ||
                    (s.rollNo && s.rollNo.includes(attSearch))
                ).length} Students Listed
              </span>
            </div>
          </div>

          {/* Students Roll Call Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Student Name</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Accommodation</th>
                    <th className="py-3.5 px-6 text-center">Attendance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(
                      (st) =>
                        st.name.toLowerCase().includes(attSearch.toLowerCase()) ||
                        (st.studentId && st.studentId.includes(attSearch)) ||
                        (st.rollNo && st.rollNo.includes(attSearch))
                    )
                    .map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-bold text-slate-800">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-slate-600">{st.studentId || st.rollNo}</td>
                        <td className="py-4 px-4 text-slate-600">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            st.residenceType === 'Day Scholar' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {st.residenceType}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setAttCalendarStudent(st)}
                            className="px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer border border-purple-200 bg-purple-50 inline-flex items-center gap-1.5 font-bold text-xs shadow-2xs"
                            title={`Open Interactive Attendance Calendar for ${st.name}`}
                          >
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span>Attendance Calendar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: COURSES & CLASSES ================= */}
      {currentTab === 'courses' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Faculty Course Management</h2>
            <p className="text-xs text-slate-500 mt-1">Manage syllabus, room schedules, and enrolled student sections.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-xl">
                      {course.code}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      👥 {course.totalStudents} Students
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{course.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <p><strong>Room:</strong> {course.room}</p>
                    <p><strong>Schedule:</strong> {course.schedule}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-bold">Active Semester 5</span>
                  <span className="text-xs text-slate-400 font-medium">Syllabus: {course.syllabusProgress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: TIMETABLE (MONDAY TO SATURDAY) ================= */}
      {currentTab === 'timetable' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty Master Timetable</h2>
              <p className="text-xs text-slate-500 mt-1">Weekly lecture and laboratory teaching schedule (Monday to Saturday).</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timetableDay === day
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {timetable.filter((t) => t.day === timetableDay).map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700">
                      {slot.room}
                    </span>
                    <span className="text-xs font-semibold text-purple-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {slot.startTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{slot.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {slot.teacher}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Duration: 75-90 mins</span>
                  <span className="text-purple-600 font-bold">Assigned Period</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: STUDENT ROSTER & ACCOMMODATION MANAGER ================= */}
      {currentTab === 'roster' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Student Directory</h2>
              <p className="text-xs text-slate-500 mt-1">View student details. Use "Request Change" to notify the admin of any profile corrections needed.</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search student or ID..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800"
              />
            </div>
          </div>

          {/* Read-only notice */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Student profiles are managed by the admin. If you need to update a student's details, use the <strong>"Request Change"</strong> button to send a change request.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Semester</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-6">Accommodation Details</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(
                      (s) =>
                        s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                        (s.studentId && s.studentId.includes(rosterSearch)) ||
                        (s.rollNo && s.rollNo.includes(rosterSearch))
                    )
                    .map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-bold text-slate-800">{st.name}</p>
                              <p className="text-[10px] text-slate-400">{st.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-semibold text-slate-600">{st.studentId || st.rollNo}</td>
                        <td className="py-4 px-4 text-slate-600">{st.semester || '5th Semester'}</td>
                        <td className="py-4 px-4 font-medium text-slate-700">{st.phone || '—'}</td>
                        <td className="py-4 px-6 text-slate-600">
                          {st.residenceType === 'Day Scholar' ? (
                            <span className="flex items-center gap-1.5 text-amber-800">
                              <Bus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Day Scholar • <strong>{st.busRoute || 'Route 14'}</strong> ({st.busNumber || 'BUS-042'})</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-teal-800">
                              <Home className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>Hosteler • <strong>{st.hostelName || 'Residence'}</strong> ({st.roomNumber || '304-B'})</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setAttCalendarStudent(st)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                              title="Mark or toggle student attendance on any date using calendar"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Attendance Calendar
                            </button>
                            <button
                              onClick={() => setInspectStudentModal(st)}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> View All Details
                            </button>
                            <button
                              onClick={() => { setChangeReqStudent(st); setChangeReqDesc(''); }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5" /> Request Change
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ================= TAB: ACADEMIC RESULTS (VIEW ONLY) ================= */}
      {currentTab === 'results' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Academic Results & Performance</h2>
              <p className="text-xs text-slate-500 mt-1">Review official published result cards, hall tickets, and grade breakdowns for your mentored students (View-Only).</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                placeholder="Search student or roll number..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800"
              />
            </div>
          </div>

          {/* Semester Selector Buttons (Semester 1 - 8) */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
            {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
              <button
                key={sem}
                onClick={() => setTeacherSelectedSemester(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  teacherSelectedSemester === sem
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          {(() => {
            const semResults = studentResults.filter(
              (r) =>
                r.semesters &&
                r.semesters[teacherSelectedSemester] &&
                (r.studentName.toLowerCase().includes(resultSearch.toLowerCase()) ||
                  r.rollNo.toLowerCase().includes(resultSearch.toLowerCase()))
            );

            if (semResults.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                  <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">No Result Data Available for {teacherSelectedSemester}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    No published student result reports found for {teacherSelectedSemester}. The examination administration has not published grade reports for this semester yet.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {semResults.map((res) => {
                  const semData = res.semesters[teacherSelectedSemester];
                  const semChartData = semData?.grades.map((g) => ({
                    name: g.courseCode,
                    score: g.percentage,
                  })) || [];

                  return (
                    <div key={res.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-extrabold text-sm">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-base">{res.studentName}</h4>
                            <p className="text-xs font-mono font-semibold text-purple-700">Roll No: {res.rollNo} • {teacherSelectedSemester}</p>
                            <p className="text-[10px] text-slate-400">Published: {res.publishedDate}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center justify-end mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                              semData?.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {semData?.status || 'Pass'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">SGPA: <span className="text-slate-900 font-extrabold">{semData?.sgpa?.toFixed(2)}</span></p>
                          <p className="text-xs text-purple-700 uppercase font-bold tracking-wider">CGPA: <span className="font-black text-purple-900">{res.cgpa?.toFixed(2)}</span></p>
                        </div>
                      </div>

                      {/* Hall Ticket Info */}
                      {res.hallTicket && (
                        <div className="p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-bold text-purple-900 flex items-center gap-1.5">
                            <Ticket className="w-3.5 h-3.5 text-purple-600" /> Hall Ticket Issued:
                          </span>
                          <span className="font-mono text-purple-800 font-bold">{res.hallTicket.hallTicketNo} ({res.hallTicket.seatNo})</span>
                        </div>
                      )}

                      {/* Performance Bar Graph for Semester */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Subject Scores Bar Graph ({teacherSelectedSemester})</p>
                        <div className="h-36 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={semChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[50, 100]} />
                              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                              <Bar dataKey="score" fill="#9333EA" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject Grade Breakdown ({teacherSelectedSemester})</p>
                        <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-100 p-3">
                          {semData?.grades.map((g) => (
                            <div key={g.courseCode} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-800">{g.courseName} <span className="font-mono text-slate-400">({g.courseCode})</span></p>
                                <p className="text-[10px] text-slate-500">{g.remarks}</p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs ${
                                  g.gradeLetter === 'F' || g.percentage < 50 ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {g.gradeLetter} ({g.percentage}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ================= TAB 6: NOTICE BOARD ================= */}
      {currentTab === 'announcements' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty & Campus Notice Broadcaster</h2>
              <p className="text-xs text-slate-500 mt-1">Publish notices and view official Admin & Teacher broadcasts.</p>
            </div>

            <button
              onClick={() => setPostAnnModalOpen(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" /> Broadcast Notice
            </button>
          </div>

          {/* Broadcast Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs w-fit">
            {(['all', 'admin', 'teacher'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTeacherBroadcastFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  teacherBroadcastFilter === filter
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {filter === 'all' ? '📢 All Broadcasts' : filter === 'admin' ? '🏛️ Admin Broadcasts' : '👨‍🏫 Teacher Broadcasts'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {announcements
              .filter((a) => {
                if (teacherBroadcastFilter === 'admin') {
                  return a.authorRole.toLowerCase().includes('admin') || a.authorId.includes('admin');
                }
                if (teacherBroadcastFilter === 'teacher') {
                  return !a.authorRole.toLowerCase().includes('admin') && !a.authorId.includes('admin');
                }
                return true;
              })
              .map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {ann.targetCourse || 'All Students'}
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : ann.priority === 'important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-xs text-slate-400">{ann.date}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{ann.content}</p>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <img src={ann.authorAvatar} alt="" className="w-5 h-5 rounded-full" />
                    <span>Posted by {ann.authorName} ({ann.authorRole})</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Accommodation Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setEditingStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative">
              <button
                onClick={() => setEditingStudent(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-purple-200">Teacher Accommodation Manager</span>
              <h3 className="text-xl font-bold mt-1">Update {editingStudent.name}'s Residence</h3>
            </div>

            <form onSubmit={handleSaveAccommodation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Accommodation Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditResidenceType('Day Scholar')}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editResidenceType === 'Day Scholar'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Bus className="w-4 h-4" /> Day Scholar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditResidenceType('Hosteler')}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editResidenceType === 'Hosteler'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Hosteler
                  </button>
                </div>
              </div>

              {editResidenceType === 'Day Scholar' ? (
                <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Bus Route Name</label>
                    <input
                      type="text"
                      required
                      value={editBusRoute}
                      onChange={(e) => setEditBusRoute(e.target.value)}
                      placeholder="e.g. Route #14 - North City Express"
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Bus Number</label>
                      <input
                        type="text"
                        required
                        value={editBusNumber}
                        onChange={(e) => setEditBusNumber(e.target.value)}
                        placeholder="e.g. BUS-042"
                        className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Boarding Stop</label>
                      <input
                        type="text"
                        required
                        value={editBusStop}
                        onChange={(e) => setEditBusStop(e.target.value)}
                        placeholder="e.g. Central Square Stop"
                        className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-teal-50/60 rounded-2xl border border-teal-200">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Hostel Name / Building</label>
                    <input
                      type="text"
                      required
                      value={editHostelName}
                      onChange={(e) => setEditHostelName(e.target.value)}
                      placeholder="e.g. Emerald Heights Residence (Block B)"
                      className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Room Number</label>
                    <input
                      type="text"
                      required
                      value={editRoomNumber}
                      onChange={(e) => setEditRoomNumber(e.target.value)}
                      placeholder="e.g. Room 304-B"
                      className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Request Modal */}
      {changeReqStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setChangeReqStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white relative">
              <button
                onClick={() => setChangeReqStudent(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-amber-100">Student Profile Correction</span>
              <h3 className="text-xl font-bold mt-1">Submit Change Request</h3>
              <p className="text-xs text-amber-100 mt-0.5">Student: {changeReqStudent.name} ({changeReqStudent.studentId || changeReqStudent.rollNo})</p>
            </div>

            <form onSubmit={handleSubmitChangeRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Change Details & Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={changeReqDesc}
                  onChange={(e) => setChangeReqDesc(e.target.value)}
                  placeholder="Describe the requested changes (e.g. Correct phone number to +1 555-0192, change hostel room to 402-A, update GPA...)"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-amber-500 text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangeReqStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Student Full Details Modal */}
      {inspectStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setInspectStudentModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-purple-950 via-purple-900 to-slate-900 text-white relative">
              <button
                onClick={() => setInspectStudentModal(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-purple-300">Mentee Full Profile Inspection</span>
              <h3 className="text-xl font-bold mt-1">{inspectStudentModal.name}</h3>
              <p className="text-xs text-purple-200 mt-0.5">Roll No: {inspectStudentModal.rollNo || inspectStudentModal.studentId || '2024-418'} • {inspectStudentModal.department || 'CS Department'}</p>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Top Banner Profile */}
              <div className="flex items-center gap-4 p-4 bg-purple-50/70 border border-purple-100 rounded-2xl">
                <img src={inspectStudentModal.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-300 shadow-sm" />
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">{inspectStudentModal.name}</h4>
                  <p className="text-xs text-purple-800 font-semibold">{inspectStudentModal.email}</p>
                  <p className="text-[11px] text-slate-500">{inspectStudentModal.semester || '5th Semester'} • Academic Year: {inspectStudentModal.academicYear || '2024 - 2028'}</p>
                </div>
              </div>

              {/* Personal & Guardian Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Personal Information</span>
                  <p className="font-bold text-slate-800">Phone: <span className="font-normal text-slate-600">{inspectStudentModal.phone || '+1 (555) 019-2831'}</span></p>
                  <p className="font-bold text-slate-800">Blood Group: <span className="font-normal text-slate-600">{inspectStudentModal.bloodGroup || 'O+'}</span></p>
                  <p className="font-bold text-slate-800">Grade / Section: <span className="font-normal text-slate-600">{inspectStudentModal.grade || 'A'} ({inspectStudentModal.section || 'Sec 1'})</span></p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Guardian & Mentor</span>
                  <p className="font-bold text-slate-800">Guardian: <span className="font-normal text-slate-600">{inspectStudentModal.guardianName || 'Robert Gürsoy'}</span></p>
                  <p className="font-bold text-slate-800">Guardian Contact: <span className="font-normal text-slate-600">{inspectStudentModal.guardianContact || '+1 (555) 987-6543'}</span></p>
                  <p className="font-bold text-slate-800">Faculty Mentor: <span className="font-bold text-purple-700">{formatTeacherName(inspectStudentModal.mentorName || user?.name || 'Dr. Sarah Jenkins')}</span></p>
                </div>
              </div>

              {/* Accommodation & Transportation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block">Accommodation & Transport Logistics</span>
                {inspectStudentModal.residenceType === 'Day Scholar' ? (
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                    <span className="flex items-center gap-2"><Bus className="w-4 h-4 text-amber-600" /> Day Scholar</span>
                    <span>Route: <strong>{inspectStudentModal.busRoute || 'Route #14'}</strong> • Bus: <strong>{inspectStudentModal.busNumber || 'BUS-042'}</strong> • Stop: <strong>{inspectStudentModal.busStop || 'Central Stop'}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium">
                    <span className="flex items-center gap-2"><Home className="w-4 h-4 text-teal-600" /> Hosteler</span>
                    <span>Hostel: <strong>{inspectStudentModal.hostelName || 'Emerald Residence (Block B)'}</strong> • Room: <strong>{inspectStudentModal.roomNumber || 'Room 304-B'}</strong></span>
                  </div>
                )}
              </div>

              {/* Academic Performance & Hall Ticket */}
              {(() => {
                const resReport = studentResults.find(
                  (r) =>
                    r.studentId === inspectStudentModal.id ||
                    (r.rollNo && inspectStudentModal.rollNo && r.rollNo.trim() === inspectStudentModal.rollNo.trim()) ||
                    (r.studentName && inspectStudentModal.name && r.studentName.toLowerCase().trim() === inspectStudentModal.name.toLowerCase().trim())
                );

                const studentCgpaStr = (() => {
                  if (resReport && resReport.semesters && Object.keys(resReport.semesters).length > 0) {
                    const sems = Object.values(resReport.semesters);
                    const sum = sems.reduce((acc, sem) => acc + (sem.sgpa || 0), 0);
                    const avg = sum / sems.length;
                    return avg > 0 ? avg.toFixed(2) : 'Nil';
                  }
                  return 'Nil';
                })();

                const isHallTicketIssued = Boolean(
                  resReport && (resReport.hallTicket || Object.keys(resReport.semesters || {}).length > 0)
                );
                const hallTicketStatusStr = isHallTicketIssued ? 'Issued' : 'Pending / Not Published Yet';

                return (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
                    <span className="font-bold text-purple-800 uppercase text-[10px] tracking-wider block">Academic Performance & Examination</span>
                    <div className="grid grid-cols-2 gap-3 text-slate-800 font-semibold">
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Cumulative CGPA</span>
                        <span className="text-xl font-black text-purple-900">{studentCgpaStr}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Hall Ticket Status</span>
                        <span className={`text-xs font-bold ${isHallTicketIssued ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {hallTicketStatusStr}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setInspectStudentModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Per-Student Interactive Attendance Calendar */}
      {attCalendarStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setAttCalendarStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto font-sans" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={attCalendarStudent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attCalendarStudent.name)}&background=random`}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover border border-purple-200 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                      Student Attendance Calendar
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {attCalendarStudent.studentId || attCalendarStudent.rollNo || attCalendarStudent.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{attCalendarStudent.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setAttCalendarStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month Selector Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() =>
                  setAttCalendarMonth(new Date(attCalendarMonth.getFullYear(), attCalendarMonth.getMonth() - 1, 1))
                }
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                ◀ Prev Month
              </button>

              <span className="text-sm font-black text-slate-800">
                {attCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>

              <button
                type="button"
                onClick={() =>
                  setAttCalendarMonth(new Date(attCalendarMonth.getFullYear(), attCalendarMonth.getMonth() + 1, 1))
                }
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                Next Month ▶
              </button>
            </div>

            {/* Monthly Attendance Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-xs">
              <div className="flex items-center gap-4 font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Absent
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" /> OD (On Duty)
                </span>
              </div>
              <span className="text-[11px] font-bold text-purple-800">
                💡 Select any date to mark Present, Absent, or OD!
              </span>
            </div>

            {/* Interactive Calendar Grid */}
            {(() => {
              const year = attCalendarMonth.getFullYear();
              const month = attCalendarMonth.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDayOfWeek = new Date(year, month, 1).getDay();

              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

              const studentMonthRecords = attendance.filter((a) => {
                const isUserMatch =
                  (a.studentId && attCalendarStudent.id && a.studentId === attCalendarStudent.id) ||
                  (a.studentId && (attCalendarStudent.studentId || attCalendarStudent.rollNo) && (a.studentId === attCalendarStudent.studentId || a.studentId === attCalendarStudent.rollNo)) ||
                  (a.studentRoll && (attCalendarStudent.rollNo || attCalendarStudent.studentId) && (a.studentRoll.trim() === (attCalendarStudent.rollNo || '').trim() || a.studentRoll.trim() === (attCalendarStudent.studentId || '').trim())) ||
                  (a.studentName && attCalendarStudent.name && a.studentName.toLowerCase().trim() === attCalendarStudent.name.toLowerCase().trim());
                if (!isUserMatch) return false;
                const parts = a.date.split('-');
                if (parts.length === 3) {
                  return parseInt(parts[0]) === year && parseInt(parts[1]) === month + 1;
                }
                return false;
              });

              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 text-center font-extrabold text-xs text-slate-400 uppercase tracking-wider py-1">
                    {days.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty padding slots before 1st of month */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-16 rounded-2xl bg-slate-50/40 border border-slate-100/50" />
                    ))}

                    {/* Day Cells (1 to daysInMonth) */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const attRecord = studentMonthRecords.find((a) => a.date === dateStr);
                      const status = attRecord?.status;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => setSelectedDateModal({ dayNum, dateStr, currentStatus: status })}
                          className={`h-16 p-2 rounded-2xl border flex flex-col justify-between text-left transition-all cursor-pointer hover:scale-105 shadow-2xs ${
                            status === 'present'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : status === 'absent'
                              ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                              : status === 'excused'
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                              : status === 'late'
                              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black">{dayNum}</span>
                            {status && (
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                  status === 'present'
                                    ? 'bg-emerald-500 text-white'
                                    : status === 'absent'
                                    ? 'bg-rose-500 text-white'
                                    : status === 'excused'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {status === 'excused' ? 'OD' : status.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] opacity-80 capitalize truncate font-bold">
                            {status === 'excused' ? 'OD (Duty)' : status ? status : 'Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 font-medium">
              <span>Attendance changes are saved live and reflected on the student dashboard.</span>
              <button
                onClick={() => {
                  if (attCalendarStudent) {
                    showToast('Attendance Synced!', `Attendance changes for ${attCalendarStudent.name} have been saved and reflected on student dashboard.`, 'success');
                  }
                  setAttCalendarStudent(null);
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Pop-up Tab Sub-Modal: Mark Present, Absent, OD */}
      {selectedDateModal && attCalendarStudent && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedDateModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-scaleUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                  Select Attendance Status
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {new Date(selectedDateModal.dateStr).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Choose status for <strong>{attCalendarStudent.name}</strong> ({attCalendarStudent.studentId || attCalendarStudent.rollNo || 'Student'}):
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Option 1: Present */}
              <button
                type="button"
                onClick={() => {
                  takeAttendance(selectedDateModal.dateStr, selectedAttCourse || 'c1', [
                    {
                      studentId: attCalendarStudent.id,
                      studentName: attCalendarStudent.name,
                      studentRoll: attCalendarStudent.studentId || attCalendarStudent.rollNo || '2024-418',
                      status: 'present',
                    },
                  ]);
                  setSelectedDateModal(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:scale-105 ${
                  selectedDateModal.currentStatus === 'present'
                    ? 'bg-emerald-500 text-white font-extrabold ring-2 ring-emerald-600 shadow-md'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-bold'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black">Present</span>
              </button>

              {/* Option 2: Absent */}
              <button
                type="button"
                onClick={() => {
                  takeAttendance(selectedDateModal.dateStr, selectedAttCourse || 'c1', [
                    {
                      studentId: attCalendarStudent.id,
                      studentName: attCalendarStudent.name,
                      studentRoll: attCalendarStudent.studentId || attCalendarStudent.rollNo || '2024-418',
                      status: 'absent',
                    },
                  ]);
                  setSelectedDateModal(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:scale-105 ${
                  selectedDateModal.currentStatus === 'absent'
                    ? 'bg-rose-500 text-white font-extrabold ring-2 ring-rose-600 shadow-md'
                    : 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100 font-bold'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs font-black">Absent</span>
              </button>

              {/* Option 3: OD (On Duty) */}
              <button
                type="button"
                onClick={() => {
                  takeAttendance(selectedDateModal.dateStr, selectedAttCourse || 'c1', [
                    {
                      studentId: attCalendarStudent.id,
                      studentName: attCalendarStudent.name,
                      studentRoll: attCalendarStudent.studentId || attCalendarStudent.rollNo || '2024-418',
                      status: 'excused',
                    },
                  ]);
                  setSelectedDateModal(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:scale-105 ${
                  selectedDateModal.currentStatus === 'excused'
                    ? 'bg-indigo-600 text-white font-extrabold ring-2 ring-indigo-700 shadow-md'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100 font-bold'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-black">OD (Duty)</span>
              </button>

              {/* Option 4: Unmark / Clear */}
              <button
                type="button"
                onClick={() => {
                  takeAttendance(selectedDateModal.dateStr, selectedAttCourse || 'c1', [
                    {
                      studentId: attCalendarStudent.id,
                      studentName: attCalendarStudent.name,
                      studentRoll: attCalendarStudent.studentId || attCalendarStudent.rollNo || '2024-418',
                      status: 'unmark' as any,
                    },
                  ]);
                  setSelectedDateModal(null);
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer hover:scale-105 ${
                  !selectedDateModal.currentStatus
                    ? 'bg-slate-700 text-white font-extrabold ring-2 ring-slate-800 shadow-md'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 font-bold'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span className="text-xs font-black">Unmark</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Status saves live to student dashboard.</span>
              <button
                type="button"
                onClick={() => setSelectedDateModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Announcement Modal */}
      <PostAnnouncementModal
        isOpen={postAnnModalOpen}
        onClose={() => setPostAnnModalOpen(false)}
      />
    </div>
  );
};
