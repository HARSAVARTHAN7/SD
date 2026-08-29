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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PostAnnouncementModal } from './PostAnnouncementModal';
import { StorageService, DEFAULT_TIMETABLE } from '../../services/storage';
import { User } from '../../types';

interface TeacherDashboardProps {
  currentTab: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const {
    courses,
    announcements,
    deleteAnnouncement,
    attendance,
    takeAttendance,
    allUsers,
    showToast,
    submitChangeRequest,
  } = useApp();

  const [postAnnModalOpen, setPostAnnModalOpen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
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

  // Attendance Register State
  const [selectedAttDate, setSelectedAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAttCourse, setSelectedAttCourse] = useState<string>('c1');

  // Filter students
  const students = allUsers.filter((u) => u.role === 'student');

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

  const handleSaveAccommodation = (e: React.FormEvent) => {
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

    StorageService.saveUser(updatedUser);
    
    // Also if this is current student, update current session
    const current = StorageService.getCurrentUser();
    if (current && current.id === updatedUser.id) {
      StorageService.setCurrentUser(updatedUser);
    }

    showToast('Accommodation Updated', `${updatedUser.name} is now registered as ${editResidenceType}.`, 'success');
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

          {/* 3 Analytics Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
              <p className="text-xs text-slate-500 mt-1">Take attendance by class section with quick batch actions.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMarkAll('present')}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark All Present
              </button>
              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Save Register
              </button>
            </div>
          </div>

          {/* Date & Course Selectors */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedAttDate}
                onChange={(e) => setSelectedAttDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Class Section
              </label>
              <select
                value={selectedAttCourse}
                onChange={(e) => setSelectedAttCourse(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
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
                    <th className="py-3.5 px-6 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => {
                    const currentStatus = rollCallState[st.id] || 'present';
                    return (
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
                          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                            {(['present', 'late', 'absent'] as const).map((stat) => (
                              <button
                                key={stat}
                                onClick={() =>
                                  setRollCallState((prev) => ({
                                    ...prev,
                                    [st.id]: stat,
                                  }))
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                                  currentStatus === stat
                                    ? stat === 'present'
                                      ? 'bg-emerald-500 text-white shadow-xs'
                                      : stat === 'late'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-rose-500 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {stat}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            {DEFAULT_TIMETABLE.filter((t) => t.day === timetableDay).map((slot) => (
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
                          <button
                            onClick={() => { setChangeReqStudent(st); setChangeReqDesc(''); }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5" /> Request Change
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


      {/* ================= TAB 6: NOTICE BOARD ================= */}
      {currentTab === 'announcements' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty Notice Broadcaster</h2>
              <p className="text-xs text-slate-500 mt-1">Publish notices and updates that appear directly in your students' Notice Board tab.</p>
            </div>

            <button
              onClick={() => setPostAnnModalOpen(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" /> Broadcast Notice
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
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

      {/* Post Announcement Modal */}
      <PostAnnouncementModal
        isOpen={postAnnModalOpen}
        onClose={() => setPostAnnModalOpen(false)}
      />
    </div>
  );
};
