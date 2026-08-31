import React, { useState } from 'react';
import { User as UserIcon,
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
  AlertCircle,
  X
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Course, User } from '../../types';
import { formatCgpaDisplay } from '../../utils/teacherUtils';
// Timetable data is now fetched from backend via AppContext

interface StudentDashboardProps {
  currentTab: string;
  inspectUser?: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentTab, inspectUser }) => {
  const { user: authUser } = useAuth();
  const user = inspectUser || authUser;
  const { courses, announcements, attendance, studentResults, timetable, showToast, academicTermPeriod } = useApp();

  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);
  const [timetableDay, setTimetableDay] = useState<string>('Monday');
  const [noticeSearch, setNoticeSearch] = useState<string>('');
  const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'admin' | 'teacher'>('all');
  const [studentSelectedSemester, setStudentSelectedSemester] = useState<string>('Semester 5');
  const [showOfficialHallTicketModal, setShowOfficialHallTicketModal] = useState<boolean>(false);
  const [showPermanentRecordModal, setShowPermanentRecordModal] = useState<boolean>(false);
  const [downloadSemModalOpen, setDownloadSemModalOpen] = useState<boolean>(false);
  const [selectedDownloadSem, setSelectedDownloadSem] = useState<string>('Semester 5');
  const [semDownloadError, setSemDownloadError] = useState<string | null>(null);

  // Term working days calculation based on Admin Academic Dates
  const termWorkingDays = (() => {
    if (!academicTermPeriod?.startDate || !academicTermPeriod?.endDate) return 30;
    const start = new Date(academicTermPeriod.startDate);
    const end = new Date(academicTermPeriod.endDate);
    const today = new Date();
    const targetEnd = end < today ? end : today;
    if (start > targetEnd) return 30;
    let count = 0;
    const cur = new Date(start);
    while (cur <= targetEnd) {
      const day = cur.getDay();
      if (day !== 0) count++; // Exclude only Sundays (0 = Sunday)
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 30;
  })();

  // Attendance stats filtered within Academic Term Date Range
  const myAttendanceRecords = attendance.filter((a) => {
    const isUserMatch =
      (a.studentId && user?.id && a.studentId === user.id) ||
      (a.studentId && (user?.studentId || user?.rollNo) && (a.studentId === user.studentId || a.studentId === user.rollNo)) ||
      (a.studentRoll && (user?.rollNo || user?.studentId) && (a.studentRoll.trim() === (user.rollNo || '').trim() || a.studentRoll.trim() === (user.studentId || '').trim())) ||
      (a.studentName && user?.name && a.studentName.toLowerCase().trim() === user.name.toLowerCase().trim());
    if (!isUserMatch) return false;
    if (academicTermPeriod?.startDate && a.date && a.date < academicTermPeriod.startDate) return false;
    if (academicTermPeriod?.endDate && a.date && a.date > academicTermPeriod.endDate) return false;
    return true;
  });

  const presentCount = myAttendanceRecords.filter((a) => a.status === 'present').length;
  const odCount = myAttendanceRecords.filter((a) => a.status === 'excused').length;
  const lateCount = myAttendanceRecords.filter((a) => a.status === 'late').length;
  const absentCount = myAttendanceRecords.filter((a) => a.status === 'absent').length;

  const displayTotalDays = termWorkingDays;
  const displayPresentDays = presentCount + odCount + lateCount;
  const displayAbsentDays = absentCount;
  const displayODDays = odCount;

  // Absence % = (Total Days Absent / Total Days Attended) * 100
  // Attendance % = 100 - Absence % (OD does NOT reduce attendance percentage)
  const absencePercentage = displayTotalDays > 0 ? (displayAbsentDays / displayTotalDays) * 100 : 0;
  const calculatedAttendanceRate = Math.max(0, Math.round(100 - absencePercentage));

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

  // Roman numeral mapping for published semester SGPA bar chart
  const romanMap: Record<string, string> = {
    'Semester 1': 'I', '1st Semester': 'I', 'Sem 1': 'I',
    'Semester 2': 'II', '2nd Semester': 'II', 'Sem 2': 'II',
    'Semester 3': 'III', '3rd Semester': 'III', 'Sem 3': 'III',
    'Semester 4': 'IV', '4th Semester': 'IV', 'Sem 4': 'IV',
    'Semester 5': 'V', '5th Semester': 'V', 'Sem 5': 'V',
    'Semester 6': 'VI', '6th Semester': 'VI', 'Sem 6': 'VI',
    'Semester 7': 'VII', '7th Semester': 'VII', 'Sem 7': 'VII',
    'Semester 8': 'VIII', '8th Semester': 'VIII', 'Sem 8': 'VIII',
  };

  let sgpaBarChartData: { roman: string; sgpa: number }[] = [
    { roman: 'I', sgpa: 0 },
    { roman: 'II', sgpa: 0 },
    { roman: 'III', sgpa: 0 },
    { roman: 'IV', sgpa: 0 },
    { roman: 'V', sgpa: 0 },
    { roman: 'VI', sgpa: 0 },
  ];
  let displayCgpaStr = 'Nil';

  if (myResultReport && myResultReport.semesters && Object.keys(myResultReport.semesters).length > 0) {
    const semEntries = Object.entries(myResultReport.semesters);
    sgpaBarChartData = semEntries.map(([semName, semData]) => ({
      roman: romanMap[semName] || semName.replace(/\D/g, '') || semName,
      sgpa: semData.sgpa,
    }));
    const sum = semEntries.reduce((acc, [_, semData]) => acc + (semData.sgpa || 0), 0);
    const avg = sum / semEntries.length;
    displayCgpaStr = avg > 0 ? avg.toFixed(2) : 'Nil';
  } else {
    // Locked / unpublished results -> display Nil
    displayCgpaStr = 'Nil';
  }

  // Chart data for subject grades
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Cumulative CGPA</p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">
                        {displayCgpaStr}
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
      {(currentTab === 'grades' || currentTab === 'results' || currentTab === 'grade' || currentTab === 'result') && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Academic Transcript & Examination Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Official semester grade cards, SGPA/CGPA records, and issued hall tickets.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDownloadSem(studentSelectedSemester);
                  setSemDownloadError(null);
                  setDownloadSemModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-slate-950" /> Download Permanent Record
              </button>
              <button
                onClick={() => {
                  if (myResultReport?.hallTicket && myResultReport.hallTicket.status === 'Issued') {
                    setShowOfficialHallTicketModal(true);
                  } else {
                    showToast('Hall Ticket Pending', 'The official hall ticket has not been published by the examination authority yet.', 'warning');
                  }
                }}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-full font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                title="View / Print official examination hall ticket"
              >
                <Ticket className="w-4 h-4 text-slate-600" /> Hall Ticket
              </button>
            </div>
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

          {/* Hall Ticket Card (ONLY AFTER details are uploaded/published by admin) */}
          {myResultReport?.hallTicket && myResultReport.hallTicket.status === 'Issued' ? (
            <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-purple-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Ticket className="w-7 h-7" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-400/30">
                    Official Hall Ticket Issued
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1">
                    Exam Register No: {myResultReport.hallTicket.registerNumber || myResultReport.hallTicket.hallTicketNo}
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    {myResultReport.hallTicket.candidateName || user?.name} • {myResultReport.hallTicket.programme || 'B.Com (Self Financing)'} (Sem {myResultReport.hallTicket.semester || 'V'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400 block font-semibold">Scheduled Examination</span>
                  <span className="text-xs font-extrabold text-amber-300">{myResultReport.hallTicket.examDates || 'NOVEMBER - 2024'}</span>
                </div>

                <button
                  onClick={() => setShowOfficialHallTicketModal(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" /> View / Print Official Hall Ticket
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3 text-slate-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Hall Ticket Status: <strong>Pending / Not Published Yet</strong>. The official hall ticket will be available here once published by the examination authority.</span>
            </div>
          )}

          {/* Summary Cards Row (3 Cards: CGPA, Arrear Count, Fees Due) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative Grade Point Average (CGPA)</span>
              <p className="text-3xl font-black text-slate-800 mt-3">{displayCgpaStr}</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arrear Count</span>
              <p className="text-3xl font-black text-slate-800 mt-3">0</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fees Due (₹)</span>
              <p className="text-3xl font-black text-slate-800 mt-3">-</p>
            </div>
          </div>

          {/* SGPA Bar Chart Card (matching application light theme) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Semester Grade Point Average (SGPA)</h3>
              {myResultReport && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Published Result Record
                </span>
              )}
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sgpaBarChartData} margin={{ top: 25, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="roman" stroke="#94a3b8" fontSize={13} tickLine={false} fontWeight="bold" />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 8]}
                    ticks={[0.00, 2.00, 4.00, 6.00, 8.00]}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="sgpa" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={42}>
                    <LabelList dataKey="sgpa" position="insideTop" fill="#FFFFFF" fontSize={12} fontWeight="bold" offset={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {hasSemData ? (
            <>

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

          {/* Attendance Summary Cards Grid (5 Cards: Rate, Total Days, Present Days, Absent Card, OD Card) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Attendance Rate */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <p className="text-3xl font-black text-emerald-600 mt-2">{calculatedAttendanceRate}%</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-emerald-700 font-bold">Overall Rate</span>
                <span>{calculatedAttendanceRate >= 90 ? 'Good Standing' : 'Needs Attn'}</span>
              </div>
            </div>

            {/* 2. Total Days */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Days</span>
                <p className="text-3xl font-black text-slate-900 mt-2">{displayTotalDays}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-slate-700 font-bold">Classes Conducted</span>
                <span>Term Working Days</span>
              </div>
            </div>

            {/* 3. Total Present Days (Default: 0) */}
            <div className="bg-white p-5 rounded-3xl border border-emerald-100/90 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Total Present Days</span>
                <p className="text-3xl font-black text-emerald-600 mt-2">{displayPresentDays}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between text-xs text-emerald-800">
                <span className="font-bold">Present / Attended</span>
                <span>{displayPresentDays} Days</span>
              </div>
            </div>

            {/* 4. Absent Card */}
            <div className="bg-white p-5 rounded-3xl border border-rose-100/90 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">Absent Card</span>
                <p className="text-3xl font-black text-rose-600 mt-2">{displayAbsentDays}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between text-xs text-rose-800">
                <span className="font-bold">Total Absences</span>
                <span>{displayAbsentDays === 0 ? '0 Absences' : `${displayAbsentDays} Days`}</span>
              </div>
            </div>

            {/* 5. OD Card (On Duty Card) */}
            <div className="bg-white p-5 rounded-3xl border border-indigo-100/90 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">OD Card</span>
                <p className="text-3xl font-black text-indigo-600 mt-2">{displayODDays}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-50 flex items-center justify-between text-xs text-indigo-800">
                <span className="font-bold">On Duty (No Penalty)</span>
                <span>{displayODDays === 0 ? '0 OD Days' : `${displayODDays} Days`}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
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
            {timetable.filter((t) => t.day === timetableDay).map((slot) => (
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

      {/* Official Christ College (Autonomous) Printable Hall Ticket Modal */}
      {showOfficialHallTicketModal && myResultReport?.hallTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setShowOfficialHallTicketModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 max-w-2xl w-full my-8 overflow-hidden print:m-0 print:shadow-none print:w-full print:max-w-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Action Header (Hidden in Print) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Official Examination Hall Ticket (Christ College Autonomous Format)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Hall Ticket
                </button>
                <button
                  onClick={() => setShowOfficialHallTicketModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Official Document Body */}
            <div className="p-6 sm:p-8 space-y-6 font-serif text-slate-900 leading-normal">
              {/* Header Crest & College Title */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-full border-2 border-blue-900 bg-blue-50 text-blue-950 font-black flex items-center justify-center text-center text-[9px] p-1 uppercase shadow-xs">
                    OFFICIAL CAMPUS
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-blue-950 uppercase">
                      OFFICIAL AUTONOMOUS ACADEMIC INSTITUTION
                    </h1>
                    <p className="text-[11px] font-bold text-slate-700 uppercase">
                      CENTRAL EXAMINATION WING — MAIN ACADEMIC CAMPUS
                    </p>
                    <p className="text-[10px] text-rose-800 font-extrabold">
                      Affiliated to State Technological University | Reaccredited with 'A++' Grade
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 block font-sans">
                    FIFTH SEMESTER DEGREE EXTERNAL EXAMINATION (CBCSS-UG)
                  </span>
                </div>
              </div>

              {/* Student Register & Profile Block */}
              <div className="relative border-2 border-slate-900 p-4 rounded-xl font-sans text-xs space-y-2">
                <div className="text-center font-bold text-sm bg-slate-100 py-1 border-b border-slate-400 mb-2">
                  Register Number : <span className="font-mono text-base font-black tracking-wider text-blue-950">{myResultReport.hallTicket.registerNumber || 'CCAWBCM141'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1.5 font-medium">
                    <p><strong className="w-40 inline-block font-bold">Programme :</strong> {myResultReport.hallTicket.programme || 'B.Com (Self Financing)'}</p>
                    <p><strong className="w-40 inline-block font-bold">Semester :</strong> {myResultReport.hallTicket.semester || 'V'}</p>
                    <p><strong className="w-40 inline-block font-bold">Name of the Candidate :</strong> <span className="font-bold text-blue-950 uppercase">{myResultReport.hallTicket.candidateName || user?.name || 'AMRITHA HARIDASAN'}</span></p>
                    <p><strong className="w-40 inline-block font-bold">Date of Birth :</strong> {myResultReport.hallTicket.dob || '11/05/2004'}</p>
                    <p><strong className="w-40 inline-block font-bold">Examination Center :</strong> {myResultReport.hallTicket.examCenter || 'Christ College Main Hall'}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border border-slate-400 rounded-lg bg-slate-50 text-center">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                      alt="Candidate"
                      className="w-24 h-28 object-cover rounded border border-slate-300 shadow-xs mb-1"
                    />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Candidate Photo</span>
                  </div>
                </div>
              </div>

              {/* Subject Schedule Table */}
              <div className="font-sans">
                <table className="w-full text-left text-xs border-2 border-slate-900">
                  <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider border-b-2 border-slate-900">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-900 w-1/4">Subject Code</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 w-1/2">Subject Name</th>
                      <th className="py-2.5 px-3 text-center">Dated signature of the invigilator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-slate-900 font-medium">
                    {(myResultReport.hallTicket.subjects && myResultReport.hallTicket.subjects.length > 0
                      ? myResultReport.hallTicket.subjects
                      : [
                          { subjectCode: 'CC19UPSY5D01', subjectName: 'Psychology and Personal Growth' },
                          { subjectCode: 'CC19UBCM5B07', subjectName: 'Accounting for Management' },
                          { subjectCode: 'CC19UBCM5B08', subjectName: 'Business Research Methods' },
                          { subjectCode: 'CC19UBCM5B09', subjectName: 'Income Tax Law and Accounts' },
                          { subjectCode: 'CC19UBCM5B10', subjectName: 'Financial Markets and Services' },
                          { subjectCode: 'CC19UBCM5B11', subjectName: 'Financial Management' },
                        ]
                    ).map((sub) => (
                      <tr key={sub.subjectCode} className="border-b border-slate-400">
                        <td className="py-2 px-3 font-mono font-bold border-r border-slate-400">{sub.subjectCode}</td>
                        <td className="py-2 px-3 font-semibold border-r border-slate-400">{sub.subjectName}</td>
                        <td className="py-2 px-3 text-center text-slate-300">_________________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Candidate & Controller Signatures */}
              <div className="pt-6 font-sans text-xs flex items-end justify-between">
                <div>
                  <p className="font-bold text-slate-800">Signature of the Candidate :</p>
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mt-1"></div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block text-emerald-700 font-serif italic text-base font-bold pr-4">
                    ~ Controller of Exams ~
                  </div>
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Controller of Examinations</p>
                </div>
              </div>

              {/* Instructions to Candidates */}
              <div className="pt-4 border-t border-slate-300 font-sans text-[10px] space-y-1.5 leading-tight text-slate-700">
                <h4 className="font-extrabold text-slate-900 text-center uppercase tracking-widest text-xs mb-1">
                  INSTRUCTIONS TO CANDIDATES
                </h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>The candidates should also verify that the hall ticket pertains to the programme of study and that it bears the register number of Ten characters.</li>
                  <li>The candidates should write the register number in the space provided for the same in the answer book.</li>
                  <li>The candidates should write the subject code and the name of the paper in the answer book as it appears in the question paper on each day of examination.</li>
                  <li>Candidates should take their seats in the examination hall at least fifteen (15) minutes before the commencement of the examination. Candidates will not be allowed to leave the examination hall during the first 30 minutes of the examination.</li>
                  <li>Candidates are not permitted to write anything on their hall tickets or question papers other than that instructed above. They are also prohibited from writing their Name/Register Number or anything which may reveal their identity in any other part of the answer book.</li>
                  <li>Candidates who do not behave properly to the Chief/Assistant Superintendents/Invigilators of the Examinations or are found to have recourse to malpractice of any kind are liable to be sent out of the examination hall forthwith.</li>
                  <li>Candidates are prohibited from bringing in to the Examination Hall any type of electronic devices other than calculators permitted for certain specific subjects.</li>
                  <li>Violation of these instructions may entail in cancellation of the examinations and getting debarred from further appearance.</li>
                </ol>

                <div className="mt-3 p-2 bg-slate-100 text-center font-bold border border-slate-400 rounded text-[10px] text-slate-900">
                  For all correspondances with the office of the Controller of Examinations, Hall ticket has to be produced. Please keep the Hall ticket in safe custody.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Permanent Record Official Grade Modal (Matching uploaded media format) */}
      {showPermanentRecordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setShowPermanentRecordModal(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 max-w-2xl w-full my-8 overflow-hidden print:m-0 print:shadow-none print:w-full print:max-w-none font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Control Header (Hidden in Print) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Official Permanent Academic Grade Record
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPermanentRecordModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Permanent Record Document Body */}
            <div className="bg-white text-slate-900 pb-8 space-y-6">
              {/* Header Yellow Banner */}
              <div className="bg-amber-400 text-slate-950 py-6 px-4 text-center space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                  Permanent Record
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900">
                  INTERMEDIATE GRADE & ACADEMIC TRANSCRIPT
                </p>
              </div>

              <div className="px-6 sm:px-10 space-y-6">
                {/* Student Profile Row */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                  <div className="shrink-0">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                      alt={user?.name || 'Student'}
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 shadow-md"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2 text-xs">
                    <div className="bg-slate-100/90 p-2.5 rounded-lg font-bold text-slate-900 border border-slate-200 flex items-center justify-between">
                      <span>Student Name: <strong className="text-slate-950 font-black text-sm">{user?.name || 'Guzman Bryan'}</strong></span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-slate-100/90 p-2 rounded-lg font-medium text-slate-800 border border-slate-200 sm:col-span-2">
                        <strong>Roll No / DOB:</strong> {user?.rollNo || '2024-418'} (04/10/2004)
                      </div>
                      <div className="bg-slate-100/90 p-2 rounded-lg font-medium text-slate-800 border border-slate-200">
                        <strong>Gender:</strong> Male: X  Female:
                      </div>
                    </div>
                  </div>
                </div>

                {/* Program Header Category Bar */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-bold border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 uppercase">
                        <th className="py-2.5 px-4 w-2/5 border-b border-slate-200">Funding Year / Program</th>
                        <th className="py-2.5 px-3 text-center border-b border-slate-200">Grade 4</th>
                        <th className="py-2.5 px-3 text-center border-b border-slate-200">Grade 5</th>
                        <th className="py-2.5 px-3 text-center border-b border-slate-200">Grade 6</th>
                        <th className="py-2.5 px-3 text-center border-b border-slate-200">Grade 7</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-[11px] font-medium text-slate-700">
                      <tr>
                        <td className="py-2 px-4">English as First Language</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4">Specialized Engineering / Science</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-4">Institutional Core Curriculum</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                        <td className="py-2 px-3 text-center">✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Academic Record Main Grade Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase border-b-2 border-slate-300">
                        <th className="py-3 px-4 w-2/5">Academic Record</th>
                        <th className="py-3 px-3 text-center">Grade 4 (Sem 1)</th>
                        <th className="py-3 px-3 text-center">Grade 5 (Sem 2)</th>
                        <th className="py-3 px-3 text-center">Grade 6 (Sem 3)</th>
                        <th className="py-3 px-3 text-center">Grade 7 (Sem 4)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200 text-xs font-semibold text-slate-900">
                      {(myGrades && myGrades.length > 0 ? myGrades : [
                        { courseName: 'English', gradeLetter: 'A' },
                        { courseName: 'Mathematics', gradeLetter: 'A+' },
                        { courseName: 'Social Science', gradeLetter: 'B+' },
                        { courseName: 'Computer Science', gradeLetter: 'A+' },
                        { courseName: 'Chemistry', gradeLetter: 'A' },
                        { courseName: 'History', gradeLetter: 'B+' },
                        { courseName: 'Life Science', gradeLetter: 'A+' },
                        { courseName: 'Physical Science', gradeLetter: 'A+' },
                      ]).map((item, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{item.courseName}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-800">{item.gradeLetter || 'A'}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-800">{item.gradeLetter || 'A+'}</td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-800">{item.gradeLetter || 'B+'}</td>
                          <td className="py-2.5 px-3 text-center font-black text-emerald-700">{item.gradeLetter || 'A+'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Intermediate Achievement Legend Footer */}
                <div className="space-y-3 pt-2">
                  <div className="bg-slate-100 p-2 text-center font-extrabold text-xs text-slate-900 uppercase tracking-wider rounded">
                    Intermediate Achievement
                  </div>

                  <div className="flex flex-wrap items-center justify-around gap-2 text-[10px] font-bold text-slate-700 border-b border-amber-200 pb-3">
                    <span><strong>A</strong> = Excellent</span>
                    <span><strong>B</strong> = Above Average</span>
                    <span><strong>C</strong> = Average</span>
                    <span><strong>D</strong> = Below Average</span>
                    <span><strong>U</strong> = Unsatisfactory</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div>
                      <p className="text-slate-500 font-medium">Verified Evaluation Seal</p>
                      <p className="font-mono font-bold text-slate-900">SGPA: {displaySgpa.toFixed(2)} | CGPA: {displayCgpaStr}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-slate-900 uppercase">Controller of Examinations</p>
                      <p className="text-[10px] text-slate-500">Official Institutional Academic Seal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Select Semester Result to Download */}
      {downloadSemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDownloadSemModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-scaleUp font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Award className="w-6 h-6" />
                <h3 className="text-base font-extrabold text-slate-900">Select Semester to Download Result</h3>
              </div>
              <button
                onClick={() => setDownloadSemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 font-medium leading-relaxed">
                Please select the target semester to verify publication status and generate your official grade transcript.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Academic Semester:
                </label>
                <select
                  value={selectedDownloadSem}
                  onChange={(e) => {
                    setSelectedDownloadSem(e.target.value);
                    setSemDownloadError(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 cursor-pointer"
                >
                  {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => {
                    const isPublished = Boolean(mySemesters[sem] && mySemesters[sem].grades && mySemesters[sem].grades.length > 0);
                    return (
                      <option key={sem} value={sem}>
                        {sem} {isPublished ? '✓ (Results Published)' : '🔒 (Not Published)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {semDownloadError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold animate-fadeIn">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{semDownloadError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setDownloadSemModalOpen(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetSemData = mySemesters[selectedDownloadSem];
                  const isPublished = Boolean(targetSemData && targetSemData.grades && targetSemData.grades.length > 0);

                  if (!isPublished) {
                    const errorMsg = `Results Not Published: The official examination results for ${selectedDownloadSem} have not been published by the examination authority yet.`;
                    setSemDownloadError(errorMsg);
                    showToast('Results Not Published', `Official results for ${selectedDownloadSem} have not been published by the admin yet.`, 'error');
                    return;
                  }

                  setStudentSelectedSemester(selectedDownloadSem);
                  setSemDownloadError(null);
                  setDownloadSemModalOpen(false);
                  setShowPermanentRecordModal(true);
                  showToast('Result Report Loaded', `Generated official permanent record for ${selectedDownloadSem}.`, 'success');
                }}
                className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-400/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" /> Download / View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
