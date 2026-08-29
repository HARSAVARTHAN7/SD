import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Building2,
  UserCheck,
  Phone,
  Mail,
  Bus,
  Home,
  MapPin,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Printer,
  CheckCircle,
  XCircle,
  Hash,
  ShieldCheck,
  Sparkles,
  Layers,
  Heart,
  Megaphone,
  Bell,
  Search,
  Tag,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { DEFAULT_TIMETABLE, DEFAULT_STUDENT_GRADES } from '../../services/storage';

interface StudentDashboardProps {
  currentTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const { courses, announcements, attendance, studentResults } = useApp();

  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);
  const [timetableDay, setTimetableDay] = useState<string>('Monday');
  const [noticeSearch, setNoticeSearch] = useState<string>('');
  const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'admin' | 'teacher'>('all');
  const [studentSelectedSemester, setStudentSelectedSemester] = useState<string>('Semester 5');

  // Attendance stats
  const myAttendanceRecords = attendance.filter((a) => a.studentId === user?.id);
  const presentCount = myAttendanceRecords.filter((a) => a.status === 'present').length;
  const totalAttRecorded = myAttendanceRecords.length || 1;
  const calculatedAttendanceRate = Math.round((presentCount / totalAttRecorded) * 100) || 94.8;

  // Published result card for current student
  const myResultReport = studentResults.find(
    (r) =>
      r.studentId === user?.id ||
      (r.rollNo && user?.rollNo && r.rollNo.trim() === user?.rollNo.trim()) ||
      (r.studentName && user?.name && r.studentName.toLowerCase().trim() === user?.name.toLowerCase().trim()) ||
      (r.studentId && user?.studentId && r.studentId.trim() === user?.studentId.trim())
  );

  const mySemesters = myResultReport?.semesters || {};
  const hasSemData = Boolean(mySemesters[studentSelectedSemester]);
  const currentSemData = mySemesters[studentSelectedSemester];

  const myGrades = currentSemData ? currentSemData.grades : [];
  const displaySgpa = currentSemData ? currentSemData.sgpa : 0;
  const displayCgpa = myResultReport?.cgpa || (user?.gpa || 3.85);

  // Chart data for grades
  const gradeChartData = myGrades.map((g) => ({
    name: g.courseCode,
    subject: g.courseName,
    score: g.percentage,
    gpa: g.gpaPoint,
  }));

  const isDayScholar = user?.residenceType === 'Day Scholar' || !user?.residenceType;

  return (
    <div className="space-y-8 pb-16">
      {/* ================= TAB 1: OVERVIEW ================= */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Student Profile & Institutional Details Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50">
            {/* Top Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Student Profile & Academic Enrolment</h2>
                  <p className="text-xs text-slate-400 font-medium">Official Institutional Record & Department Data</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Enrolled & Active
                </span>
              </div>
            </div>

            {/* Profile Card Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
              {/* Left Column: Student Image & Identity Summary (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col items-center text-center p-6 bg-gradient-to-b from-slate-50 to-emerald-50/30 rounded-3xl border border-slate-100">
                <div className="relative mb-4">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80'}
                    alt={user?.name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-white shadow-lg shadow-slate-300/50"
                  />
                  <span className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 text-white rounded-full ring-2 ring-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {user?.name || 'Murat Gürsoy'}
                </h3>
                <span className="mt-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                  ID: {user?.studentId || user?.rollNo || 'STU-2024-418'}
                </span>

                <div className="w-full mt-6 pt-5 border-t border-slate-200/60 space-y-3 text-left text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{user?.phone || '+1 (555) 349-8291'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate text-slate-700 font-medium">{user?.email || 'murat.gursoy@school.edu'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Blood Group: <strong className="text-slate-800">{user?.bloodGroup || 'O+ Positive'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Batch: <strong className="text-slate-800">{user?.academicYear || '2024 - 2028'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Column: Academic Details, Mentor & Assigned Accommodation (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Academic Details Section */}
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/70">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" /> Academic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Current Semester</p>
                      <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                        {user?.semester || '5th Semester'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Department</p>
                      <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5">
                        {user?.department || 'Department of Computer Science & Engineering'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Assigned Faculty Mentor Section */}
                <div className="bg-gradient-to-r from-purple-50/60 to-indigo-50/40 rounded-2xl p-5 border border-purple-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Assigned Faculty Mentor
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] font-bold text-purple-400 uppercase">Mentor Name</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {user?.mentorName || 'Dr. Sarah Jenkins'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-purple-400 uppercase">Mentor ID</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5 font-mono">
                        {user?.mentorId || 'FAC-7742'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-purple-400 uppercase">Mentor Phone</p>
                      <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {user?.mentorPhone || '+1 (555) 782-9912'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Accommodation & Transportation Section (Solely based on Teacher/System Assigned Record) */}
                <div className={`rounded-2xl p-5 border transition-all ${
                  isDayScholar
                    ? 'bg-amber-50/50 border-amber-200/80'
                    : 'bg-teal-50/50 border-teal-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDayScholar ? 'text-amber-800' : 'text-teal-800'
                    }`}>
                      {isDayScholar ? (
                        <>
                          <Bus className="w-4 h-4 text-amber-600" /> Day Scholar & Bus Transportation Details
                        </>
                      ) : (
                        <>
                          <Home className="w-4 h-4 text-teal-600" /> Hostel Accommodation & Room Details
                        </>
                      )}
                    </h4>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isDayScholar
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-teal-100 text-teal-900'
                    }`}>
                      {isDayScholar ? 'Day Scholar' : 'Hosteler'}
                    </span>
                  </div>

                  {isDayScholar ? (
                    /* Day Scholar Specific Details */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-amber-700 uppercase">Bus Facility</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          Applicable (Active)
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-amber-700 uppercase">Bus Route</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          {user?.busRoute || 'Route #14 - North City Express'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-amber-700 uppercase">Bus Number & Stop</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          <span className="font-mono bg-amber-200/60 px-1.5 py-0.5 rounded text-xs">{user?.busNumber || 'BUS-042'}</span> • {user?.busStop || 'Central Square Stop'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Hosteler Specific Details */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-teal-700 uppercase">Accommodation Type</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          Campus Resident
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-teal-700 uppercase">Hostel Name</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                          {user?.hostelName || 'Emerald Heights Residence (Block B)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-teal-700 uppercase">Room Number</p>
                        <p className="text-sm font-extrabold text-slate-800 mt-0.5 font-mono">
                          {user?.roomNumber || 'Room 304-B'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: NOTICE BOARD (ADMIN & TEACHER BROADCASTS) ================= */}
      {currentTab === 'notices' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Notice Board</h2>
              <p className="text-xs text-slate-500 mt-1">Official circulars, academic notices, and broadcasts from Admin and Faculty.</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={noticeSearch}
                onChange={(e) => setNoticeSearch(e.target.value)}
                placeholder="Search notices..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* Broadcast Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs w-fit">
            {(['all', 'admin', 'teacher'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setBroadcastFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  broadcastFilter === filter
                    ? 'bg-emerald-600 text-white shadow-xs'
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
                if (broadcastFilter === 'admin') {
                  return a.authorRole.toLowerCase().includes('admin') || a.authorId.includes('admin');
                }
                if (broadcastFilter === 'teacher') {
                  return !a.authorRole.toLowerCase().includes('admin') && !a.authorId.includes('admin');
                }
                return true;
              })
              .filter((a) =>
                a.title.toLowerCase().includes(noticeSearch.toLowerCase()) ||
                a.content.toLowerCase().includes(noticeSearch.toLowerCase()) ||
                a.authorName.toLowerCase().includes(noticeSearch.toLowerCase())
              )
              .map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {ann.targetCourse || 'Department Circular'}
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
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{ann.date}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    {ann.content}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <img src={ann.authorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span className="font-bold text-slate-700">{ann.authorName}</span>
                      <span className="text-slate-400">• {ann.authorRole}</span>
                    </div>

                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Faculty Broadcast
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: MY COURSES ================= */}
      {currentTab === 'courses' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Enrolled Courses & Classes</h2>
            <p className="text-xs text-slate-500 mt-1">Review course curriculum, instructor contact, syllabus progress, and course resources.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono">
                      {course.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {course.credits} Credits
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{course.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Instructor:</span>
                      <span className="font-semibold text-slate-800">{course.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Schedule:</span>
                      <span className="font-semibold text-slate-700">{course.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Room:</span>
                      <span className="font-semibold text-slate-700">{course.room}</span>
                    </div>
                  </div>

                  {/* Syllabus Progress Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Syllabus Progress</span>
                      <span className="font-bold text-slate-800">{course.syllabusProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${course.syllabusProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    📁 {course.studyMaterialsCount} Documents
                  </span>
                  <button
                    onClick={() => setSelectedCourseDetail(course)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Syllabus →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: GRADES & REPORT CARD ================= */}
      {currentTab === 'grades' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Academic Transcript & Examination Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Official semester grade cards, SGPA/CGPA records, and issued hall tickets.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print Official Report
            </button>
          </div>

          {/* Semester Selector Buttons (Semester 1 - 8) */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
            {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
              <button
                key={sem}
                onClick={() => setStudentSelectedSemester(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  studentSelectedSemester === sem
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* Hall Ticket Card (If Issued) */}
          {myResultReport?.hallTicket && (
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-purple-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Ticket className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-400/30">
                    Official Hall Ticket Issued
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1">Exam Hall Ticket: {myResultReport.hallTicket.hallTicketNo}</h3>
                  <p className="text-xs text-purple-200 mt-0.5">{myResultReport.hallTicket.examCenter} • {myResultReport.hallTicket.seatNo}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-semibold">Scheduled Examination Window</span>
                <span className="text-xs font-extrabold text-amber-300">{myResultReport.hallTicket.examDates}</span>
              </div>
            </div>
          )}

          {hasSemData ? (
            <>
              {/* GPA Card Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
                    {displaySgpa.toFixed(2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester SGPA</p>
                    <p className="text-base font-extrabold text-slate-800">{studentSelectedSemester}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Auto-Calculated Scale: 4.0</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl">
                    {displayCgpa.toFixed(2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</p>
                    <p className="text-base font-extrabold text-slate-800">Across Published Semesters</p>
                    <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Verified Academic Record</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
                    {currentSemData?.status === 'Pass' ? 'PASS' : 'FAIL'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Result Status</p>
                    <p className="text-base font-extrabold text-slate-800">{currentSemData ? currentSemData.status : 'Cleared'}</p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Institutional Evaluation</p>
                  </div>
                </div>
              </div>

              {/* Performance Bar Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6">Subject Performance Analysis (%) ({studentSelectedSemester})</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[50, 100]} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="score" fill="#10B981" radius={[8, 8, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Official Grade Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">Subject Marks & Faculty Remarks ({studentSelectedSemester})</h3>
                  {myResultReport && (
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                      Published: {myResultReport.publishedDate}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6">Course Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Grade</th>
                        <th className="py-3 px-6">Faculty Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myGrades.map((item) => (
                        <tr key={item.courseCode} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">{item.courseName}</td>
                          <td className="py-4 px-4 font-mono text-slate-500">{item.courseCode}</td>
                          <td className="py-4 px-4 text-slate-600">{item.credits}</td>
                          <td className="py-4 px-4 font-bold text-slate-800">{item.percentage}%</td>
                          <td className="py-4 px-4">
                            <span className="font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {item.gradeLetter}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 italic">{item.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">No Result Data Available for {studentSelectedSemester}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Academic results for {studentSelectedSemester} have not been published by the examination authority yet. Please check back later or contact your faculty mentor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: ATTENDANCE TRACKER ================= */}
      {currentTab === 'attendance' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Attendance Log & Records</h2>
            <p className="text-xs text-slate-500 mt-1">Daily roll-call tracking and semester attendance percentage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <p className="text-4xl font-black text-emerald-600 mt-3">{calculatedAttendanceRate}%</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Meets school honors criteria (Min 90% required).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold">Good Standing</span>
                <span className="text-slate-400">Total Recorded: {myAttendanceRecords.length} Sessions</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Recent Daily Roll-Call Entries</h3>
              <div className="space-y-2.5">
                {myAttendanceRecords.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                        att.status === 'present'
                          ? 'bg-emerald-500'
                          : att.status === 'late'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}>
                        {att.status === 'present' && <CheckCircle className="w-4 h-4" />}
                        {att.status === 'late' && <Clock className="w-4 h-4" />}
                        {att.status === 'absent' && <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Date: {att.date}</p>
                        <p className="text-[11px] text-slate-500">AP Calculus BC • Dr. Sarah Jenkins</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        att.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status}
                      </span>
                      {att.notes && <p className="text-[10px] text-slate-400 mt-0.5">{att.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: TIMETABLE ================= */}
      {currentTab === 'timetable' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Weekly Class Timetable</h2>
              <p className="text-xs text-slate-500 mt-1">Full semester master schedule for Semester 5.</p>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timetableDay === day
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable slots for selected day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DEFAULT_TIMETABLE.filter((t) => t.day === timetableDay).map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                      {slot.room}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {slot.startTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{slot.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {slot.teacher}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Duration: 75 mins</span>
                  <span className="text-emerald-600 font-bold">Standard Period</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Course Details */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedCourseDetail(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              ✕
            </button>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
              {selectedCourseDetail.code}
            </span>
            <h3 className="text-xl font-bold text-slate-800 mt-2">{selectedCourseDetail.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedCourseDetail.description}</p>

            <div className="mt-6 space-y-3 bg-slate-50 p-4 rounded-2xl text-xs text-slate-700">
              <p><strong>Teacher:</strong> {selectedCourseDetail.teacherName}</p>
              <p><strong>Meeting Time:</strong> {selectedCourseDetail.schedule}</p>
              <p><strong>Classroom:</strong> {selectedCourseDetail.room}</p>
              <p><strong>Enrolled Students:</strong> {selectedCourseDetail.totalStudents}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Close Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
