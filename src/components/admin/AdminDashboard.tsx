import React, { useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Megaphone,
  UserCheck,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Shield,
  Eye,
  Bus,
  Home,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  Layers,
  ArrowRight,
  AlertCircle,
  UserPlus,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { StorageService, DEFAULT_TIMETABLE } from '../../services/storage';
import { User, TimetableSlot, ChangeRequest } from '../../types';
import { StudentDashboard } from '../student/StudentDashboard';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { PostAnnouncementModal } from '../teacher/PostAnnouncementModal';

interface AdminDashboardProps {
  currentTab: string;
}

// ── Blank student form ──────────────────────────────────────────────────────
const blankStudent = (): Partial<User> => ({
  role: 'student',
  name: '',
  username: '',
  email: '',
  password: 'password123',
  phone: '',
  avatar: '',
  joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  studentId: '',
  rollNo: '',
  department: '',
  semester: '',
  academicYear: '',
  grade: '',
  section: '',
  gpa: undefined,
  attendanceRate: undefined,
  guardianName: '',
  guardianContact: '',
  bloodGroup: '',
  residenceType: 'Day Scholar',
  busRoute: '',
  busNumber: '',
  busStop: '',
  hostelName: '',
  roomNumber: '',
  mentorId: '',
  mentorName: '',
  mentorPhone: '',
});

// ── Blank teacher form ──────────────────────────────────────────────────────
const blankTeacher = (): Partial<User> => ({
  role: 'teacher',
  name: '',
  username: '',
  email: '',
  password: 'password123',
  phone: '',
  avatar: '',
  joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  employeeId: '',
  title: '',
  department: '',
  officeHours: '',
  subjectsTaught: [],
});

// ── Helper to build a unique ID ─────────────────────────────────────────────
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const {
    courses,
    announcements,
    deleteAnnouncement,
    allUsers,
    changeRequests,
    showToast,
    addUser,
    updateUser,
    deleteUser,
    resolveChangeRequest,
    deleteChangeRequest,
  } = useApp();

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'admin' | 'student-preview' | 'teacher-preview'>('admin');
  const [previewTab, setPreviewTab] = useState<string>('overview');

  // Timetable State
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => StorageService.getTimetable());
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [newSlotModalOpen, setNewSlotModalOpen] = useState(false);
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');

  // Mentor Assignment State
  const [assigningStudent, setAssigningStudent] = useState<User | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');

  // Accommodation Edit State
  const [editingStudentAcc, setEditingStudentAcc] = useState<User | null>(null);
  const [residenceType, setResidenceType] = useState<'Day Scholar' | 'Hosteler'>('Day Scholar');
  const [busRoute, setBusRoute] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [busStop, setBusStop] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Overview search
  const [searchQuery, setSearchQuery] = useState('');

  // ── Directory State ────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [inspectUser, setInspectUser] = useState<User | null>(null);
  const [dirActiveTab, setDirActiveTab] = useState<'students' | 'teachers' | 'requests'>('students');

  // Add / Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<Partial<User>>(blankStudent());
  const [editRole, setEditRole] = useState<'student' | 'teacher'>('student');
  const [subjectsInput, setSubjectsInput] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const students = allUsers.filter((u) => u.role === 'student');
  const teachers = allUsers.filter((u) => u.role === 'teacher');

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.rollNo || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
          (s.department || '').toLowerCase().includes(studentSearch.toLowerCase())
      ),
    [students, studentSearch]
  );

  const filteredTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
          (t.employeeId || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
          (t.department || '').toLowerCase().includes(teacherSearch.toLowerCase())
      ),
    [teachers, teacherSearch]
  );

  const pendingRequests = changeRequests.filter((r) => r.status === 'pending');

  // ── Handlers: Mentor Assignment ────────────────────────────────────────────
  const handleSaveMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;
    const teacher = teachers.find((t) => t.id === selectedMentorId);
    if (!teacher) { showToast('Select Mentor', 'Please select a valid faculty mentor', 'warning'); return; }
    StorageService.assignMentorToStudent(assigningStudent.id, teacher.employeeId || teacher.id, teacher.name, teacher.phone || '');
    showToast('Mentor Assigned', `${assigningStudent.name} is now mentored by ${teacher.name}`, 'success');
    setAssigningStudent(null);
  };

  // ── Handlers: Timetable ────────────────────────────────────────────────────
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const created = StorageService.addTimetableSlot({
      day: selectedDay as any,
      subject: slotSubject,
      teacher: slotTeacher,
      room: slotRoom,
      startTime: slotStartTime,
      endTime: slotEndTime,
      color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700',
    });
    setTimetableSlots(StorageService.getTimetable());
    setNewSlotModalOpen(false);
    setSlotSubject(''); setSlotTeacher(''); setSlotRoom(''); setSlotStartTime(''); setSlotEndTime('');
    showToast('Slot Added', `Added ${created.subject} to ${selectedDay} timetable.`, 'success');
  };

  const handleDeleteSlot = (id: string) => {
    StorageService.deleteTimetableSlot(id);
    setTimetableSlots(StorageService.getTimetable());
    showToast('Slot Removed', 'Timetable slot deleted.', 'info');
  };

  // ── Handlers: Accommodation ────────────────────────────────────────────────
  const handleSaveAccommodation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentAcc) return;
    const updated: User = {
      ...editingStudentAcc,
      residenceType,
      busRoute: residenceType === 'Day Scholar' ? busRoute : undefined,
      busNumber: residenceType === 'Day Scholar' ? busNumber : undefined,
      busStop: residenceType === 'Day Scholar' ? busStop : undefined,
      hostelName: residenceType === 'Hosteler' ? hostelName : undefined,
      roomNumber: residenceType === 'Hosteler' ? roomNumber : undefined,
    };
    StorageService.saveUser(updated);
    showToast('Updated', `Accommodation updated for ${updated.name}`, 'success');
    setEditingStudentAcc(null);
  };

  // ── Handlers: Add / Edit user ──────────────────────────────────────────────
  const openAddModal = (role: 'student' | 'teacher') => {
    setEditRole(role);
    setEditMode('add');
    setEditingUser(role === 'student' ? blankStudent() : blankTeacher());
    setSubjectsInput('');
    setEditModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditRole(u.role as 'student' | 'teacher');
    setEditMode('edit');
    setEditingUser({ ...u });
    setSubjectsInput(u.subjectsTaught?.join(', ') || '');
    setEditModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const base: User = {
      id: editMode === 'add' ? makeId(editRole) : (editingUser.id || makeId(editRole)),
      username: editingUser.username || '',
      email: editingUser.email || '',
      password: editingUser.password || 'password123',
      name: editingUser.name || '',
      role: editRole,
      avatar: editingUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingUser.name || 'User')}&background=random&size=150`,
      phone: editingUser.phone || '',
      joinedDate: editingUser.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      department: editingUser.department || '',
    };

    if (editRole === 'student') {
      const mentor = teachers.find((t) => t.id === editingUser.mentorId);
      Object.assign(base, {
        studentId: editingUser.studentId || '',
        rollNo: editingUser.rollNo || '',
        semester: editingUser.semester || '',
        academicYear: editingUser.academicYear || '',
        grade: editingUser.grade || '',
        section: editingUser.section || '',
        gpa: editingUser.gpa ?? undefined,
        attendanceRate: editingUser.attendanceRate ?? undefined,
        guardianName: editingUser.guardianName || '',
        guardianContact: editingUser.guardianContact || '',
        bloodGroup: editingUser.bloodGroup || '',
        residenceType: editingUser.residenceType || 'Day Scholar',
        busRoute: editingUser.busRoute || '',
        busNumber: editingUser.busNumber || '',
        busStop: editingUser.busStop || '',
        hostelName: editingUser.hostelName || '',
        roomNumber: editingUser.roomNumber || '',
        mentorId: mentor?.employeeId || mentor?.id || '',
        mentorName: mentor?.name || editingUser.mentorName || '',
        mentorPhone: mentor?.phone || editingUser.mentorPhone || '',
      });
    } else {
      Object.assign(base, {
        employeeId: editingUser.employeeId || '',
        title: editingUser.title || '',
        officeHours: editingUser.officeHours || '',
        subjectsTaught: subjectsInput
          ? subjectsInput.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
    }

    if (editMode === 'add') {
      addUser(base);
    } else {
      updateUser(base);
    }
    setEditModalOpen(false);
  };

  // ── Preview modes ──────────────────────────────────────────────────────────
  if (activeSubView === 'student-preview') {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Live Student View
            </span>
            <p className="text-xs text-slate-300">Viewing as Murat Gürsoy (5th Semester • CS Department)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              {['overview', 'notices', 'courses', 'grades', 'attendance', 'timetable'].map((tab) => (
                <button key={tab} onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${previewTab === tab ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={() => setActiveSubView('admin')}
              className="px-4 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-extrabold hover:bg-slate-100 cursor-pointer shadow-md">
              ← Return to Admin
            </button>
          </div>
        </div>
        <StudentDashboard currentTab={previewTab} />
      </div>
    );
  }

  if (activeSubView === 'teacher-preview') {
    return (
      <div className="space-y-6">
        <div className="bg-purple-950 text-white p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-purple-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-400/20 text-purple-300 font-bold text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Live Teacher View
            </span>
            <p className="text-xs text-purple-200">Viewing as Dr. Sarah Jenkins (Faculty Chair & Mentor)</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-purple-900 p-1 rounded-xl">
              {['overview', 'timetable', 'attendance', 'courses', 'roster', 'announcements'].map((tab) => (
                <button key={tab} onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${previewTab === tab ? 'bg-purple-500 text-white' : 'text-purple-300 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <button onClick={() => setActiveSubView('admin')}
              className="px-4 py-1.5 bg-white text-purple-950 rounded-xl text-xs font-extrabold hover:bg-slate-100 cursor-pointer shadow-md">
              ← Return to Admin
            </button>
          </div>
        </div>
        <TeacherDashboard currentTab={previewTab} />
      </div>
    );
  }

  // ── Main admin render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-16">

      {/* ===== TAB 1: ADMIN OVERVIEW ===== */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl shadow-slate-900/30 border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-400/20">
                  <Shield className="w-10 h-10" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-extrabold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Institutional Master Control Center</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome, Administrator 🏛️</h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">Central Academic Administration • Authorized Master Authority</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => { setPreviewTab('overview'); setActiveSubView('student-preview'); }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4" /><span>Inspect Student Portal</span>
                </button>
                <button onClick={() => { setPreviewTab('overview'); setActiveSubView('teacher-preview'); }}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4" /><span>Inspect Teacher Portal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Enrolled', value: `${students.length} Active Students`, sub: 'Semester 5 • 100% Retained', color: 'emerald', Icon: GraduationCap },
              { label: 'Faculty Staff', value: `${teachers.length} Professors`, sub: 'Active Mentors & Chairs', color: 'purple', Icon: Users },
              { label: 'Active Courses', value: `${courses.length} Subject Modules`, sub: 'AP Calculus, CS, Physics', color: 'sky', Icon: BookOpen },
              { label: 'Timetable Slots', value: `${timetableSlots.length} Weekly Sessions`, sub: 'Mon - Sat Master Schedule', color: 'amber', Icon: Calendar },
            ].map(({ label, value, sub, color, Icon }) => (
              <div key={label} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                  <div className={`w-10 h-10 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-800 mt-3">{value}</p>
                <p className={`text-xs text-${color}-600 font-semibold mt-1`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Pending Change Requests alert */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-semibold">
                {pendingRequests.length} pending change request{pendingRequests.length > 1 ? 's' : ''} from teachers.
                <span className="text-amber-600 ml-1">Go to Faculty & Students → Change Requests to review.</span>
              </p>
            </div>
          )}

          {/* Mentorship & Accommodation Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Student Mentorship & Accommodation Control</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign faculty mentors and manage student transportation/hostel allocations.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 text-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {students
                .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.studentId || '').includes(searchQuery))
                .map((st) => (
                  <div key={st.id} className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <img src={st.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs" />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{st.name}</h4>
                          <p className="text-xs font-mono font-semibold text-emerald-700">{st.studentId || st.rollNo}</p>
                          <p className="text-[11px] text-slate-400">{st.department || 'Computer Science'}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-purple-700 font-semibold flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Mentor:</span>
                          <span className="font-bold text-slate-800">{st.mentorName || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                            {st.residenceType === 'Day Scholar' ? <Bus className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                            {st.residenceType || 'Day Scholar'}:
                          </span>
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                            {st.residenceType === 'Day Scholar' ? (st.busRoute || 'Route #14') : (st.hostelName || 'Residence B')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button onClick={() => { setAssigningStudent(st); const currentT = teachers.find((t) => t.name === st.mentorName); setSelectedMentorId(currentT ? currentT.id : teachers[0]?.id || ''); }}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs">
                        <UserCheck className="w-3 h-3" /> Change Mentor
                      </button>
                      <button onClick={() => { setEditingStudentAcc(st); setResidenceType(st.residenceType || 'Day Scholar'); setBusRoute(st.busRoute || ''); setBusNumber(st.busNumber || ''); setBusStop(st.busStop || ''); setHostelName(st.hostelName || ''); setRoomNumber(st.roomNumber || ''); }}
                        className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer">
                        <Edit className="w-3 h-3" /> Accommodation
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB 2: MENTOR ALLOCATION ===== */}
      {currentTab === 'mentors' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Faculty Mentor Allocation Center</h2>
            <p className="text-xs text-slate-500 mt-1">Assign and reallocate students to departmental faculty mentors with instant synchronization.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Student</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Department & Semester</th>
                    <th className="py-3.5 px-6">Assigned Faculty Mentor</th>
                    <th className="py-3.5 px-4">Mentor Contact</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={st.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-slate-800">{st.name}</p>
                            <p className="text-[10px] text-slate-400">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600">{st.studentId || st.rollNo}</td>
                      <td className="py-4 px-4 text-slate-600">{st.semester || '5th Semester'} • {st.department || 'CS'}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                          {st.mentorName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{st.mentorPhone || '—'}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => { setAssigningStudent(st); const currentT = teachers.find((t) => t.name === st.mentorName); setSelectedMentorId(currentT ? currentT.id : teachers[0]?.id || ''); }}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                          <Edit className="w-3 h-3" /> Reassign Mentor
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

      {/* ===== TAB 3: MASTER TIMETABLE ===== */}
      {currentTab === 'timetable' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Master Timetable Manager (Mon - Sat)</h2>
              <p className="text-xs text-slate-500 mt-1">Configure weekly lectures, lab periods, and tutorial sessions for all classes.</p>
            </div>
            <button onClick={() => setNewSlotModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Timetable Slot
            </button>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedDay === day ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                {day}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {timetableSlots.filter((t) => t.day === selectedDay).map((slot) => (
              <div key={slot.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono">{slot.room}</span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {slot.startTime} {slot.endTime && `- ${slot.endTime}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{slot.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {slot.teacher}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Standard Slot</span>
                  <button onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 4: FACULTY & STUDENTS DIRECTORY ===== */}
      {currentTab === 'directory' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Master Institutional Directory</h2>
            <p className="text-xs text-slate-500 mt-1">Manage student & faculty profiles. Add, edit, delete and inspect all records.</p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs w-fit">
            {(['students', 'teachers', 'requests'] as const).map((tab) => (
              <button key={tab} onClick={() => setDirActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${dirActiveTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab === 'students' && <GraduationCap className="w-3.5 h-3.5" />}
                {tab === 'teachers' && <Users className="w-3.5 h-3.5" />}
                {tab === 'requests' && (
                  <span className="relative">
                    <FileText className="w-3.5 h-3.5" />
                    {pendingRequests.length > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-black">{pendingRequests.length}</span>
                    )}
                  </span>
                )}
                {tab === 'students' ? 'Students' : tab === 'teachers' ? 'Teachers' : 'Change Requests'}
              </button>
            ))}
          </div>

          {/* ── Students list ── */}
          {dirActiveTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name, roll no, department..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 text-slate-800 shadow-xs" />
                </div>
                <button onClick={() => openAddModal('student')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <UserPlus className="w-4 h-4" /> Add Student
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-emerald-50/50">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" /> Students ({filteredStudents.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6">Student</th>
                        <th className="py-3 px-4">Roll / ID</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Semester</th>
                        <th className="py-3 px-4">Mentor</th>
                        <th className="py-3 px-4">GPA</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-xs">No students found.</td></tr>
                      ) : filteredStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <img src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=random&size=80`} alt=""
                                className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{st.name}</p>
                                <p className="text-[10px] text-slate-400">{st.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">{st.rollNo || st.studentId || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-600">{st.department || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-600">{st.semester || '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-lg">{st.mentorName || 'Unassigned'}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold ${(st.gpa || 0) >= 3.7 ? 'text-emerald-600' : (st.gpa || 0) >= 3.0 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {st.gpa?.toFixed(2) || '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setInspectUser(st)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Inspect Profile">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEditModal(st)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirmId(st.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* ── Teachers list ── */}
          {dirActiveTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)}
                    placeholder="Search by name, employee ID, department..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 text-slate-800 shadow-xs" />
                </div>
                <button onClick={() => openAddModal('teacher')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <UserPlus className="w-4 h-4" /> Add Teacher
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-purple-50/50">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" /> Faculty Staff ({filteredTeachers.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6">Professor</th>
                        <th className="py-3 px-4">Employee ID</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Subjects</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTeachers.length === 0 ? (
                        <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-xs">No teachers found.</td></tr>
                      ) : filteredTeachers.map((tc) => (
                        <tr key={tc.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <img src={tc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tc.name)}&background=random&size=80`} alt=""
                                className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="font-bold text-slate-800">{tc.name}</p>
                                <p className="text-[10px] text-slate-400">{tc.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">{tc.employeeId || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-700">{tc.title || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-600">{tc.department || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate">{tc.subjectsTaught?.join(', ') || '—'}</td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setInspectUser(tc)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Inspect Profile">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEditModal(tc)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirmId(tc.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* ── Change Requests list ── */}
          {dirActiveTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Teacher Change Requests</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review and resolve change requests submitted by teachers for student profiles.</p>
                </div>
                {pendingRequests.length > 0 && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </div>

              {changeRequests.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No change requests yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Teachers can submit change requests from their Student Directory tab.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {changeRequests.map((req) => (
                    <div key={req.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${req.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200/80 opacity-60'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${req.status === 'pending' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                              {req.status}
                            </span>
                            <span className="text-xs text-slate-400">{req.timestamp}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Student: <span className="text-indigo-700">{req.studentName}</span>
                            </p>
                            <p className="text-xs text-slate-500">Requested by: {req.teacherName}</p>
                          </div>
                          <div className="bg-slate-100 rounded-xl p-3">
                            <p className="text-xs text-slate-700 leading-relaxed">{req.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.status === 'pending' && (
                            <button onClick={() => resolveChangeRequest(req.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                            </button>
                          )}
                          <button onClick={() => deleteChangeRequest(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 5: CAMPUS NOTICE BROADCASTER ===== */}
      {currentTab === 'notices' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Campus Notice Broadcaster</h2>
              <p className="text-xs text-slate-500 mt-1">Publish institutional circulars and broadcasts visible across all student and teacher dashboards.</p>
            </div>
            <button onClick={() => setAnnModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
              <Megaphone className="w-4 h-4 text-amber-400" /> Broadcast Campus Circular
            </button>
          </div>
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">{ann.targetCourse || 'All Campus'}</span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${ann.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : ann.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{ann.priority}</span>
                    <span className="text-xs text-slate-400">{ann.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl bg-slate-50 p-4 rounded-2xl border border-slate-100">{ann.content}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <img src={ann.authorAvatar} alt="" className="w-5 h-5 rounded-full" />
                    <span>Posted by {ann.authorName} ({ann.authorRole})</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <button onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" title="Delete Announcement">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MODAL: INSPECT PROFILE ===== */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setInspectUser(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-6 py-6 text-white relative flex items-center gap-5 ${inspectUser.role === 'student' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
              <button onClick={() => setInspectUser(null)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <img src={inspectUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(inspectUser.name)}&background=random&size=150`}
                alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl" />
              <div>
                <span className="text-[11px] font-bold uppercase opacity-70">{inspectUser.role === 'student' ? 'Student Profile' : 'Faculty Profile'}</span>
                <h3 className="text-2xl font-extrabold">{inspectUser.name}</h3>
                <p className="text-sm opacity-80">{inspectUser.email}</p>
                {inspectUser.role === 'student' && <p className="text-xs opacity-70 mt-0.5">{inspectUser.studentId || inspectUser.rollNo} • {inspectUser.semester}</p>}
                {inspectUser.role === 'teacher' && <p className="text-xs opacity-70 mt-0.5">{inspectUser.employeeId} • {inspectUser.title}</p>}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Common fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Phone', value: inspectUser.phone },
                  { label: 'Department', value: inspectUser.department },
                  { label: 'Joined', value: inspectUser.joinedDate },
                  { label: 'Username', value: inspectUser.username },
                ].map(({ label, value }) => value && (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Student-specific */}
              {inspectUser.role === 'student' && (
                <>
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Academic Info</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Roll No', value: inspectUser.rollNo },
                        { label: 'Student ID', value: inspectUser.studentId },
                        { label: 'Semester', value: inspectUser.semester },
                        { label: 'Academic Year', value: inspectUser.academicYear },
                        { label: 'GPA', value: inspectUser.gpa?.toFixed(2) },
                        { label: 'Attendance', value: inspectUser.attendanceRate ? `${inspectUser.attendanceRate}%` : undefined },
                        { label: 'Blood Group', value: inspectUser.bloodGroup },
                        { label: 'Guardian', value: inspectUser.guardianName },
                        { label: 'Guardian Contact', value: inspectUser.guardianContact },
                      ].map(({ label, value }) => value && (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Mentor & Residence</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Mentor', value: inspectUser.mentorName },
                        { label: 'Mentor Phone', value: inspectUser.mentorPhone },
                        { label: 'Residence Type', value: inspectUser.residenceType },
                        { label: inspectUser.residenceType === 'Hosteler' ? 'Hostel' : 'Bus Route', value: inspectUser.residenceType === 'Hosteler' ? inspectUser.hostelName : inspectUser.busRoute },
                        { label: inspectUser.residenceType === 'Hosteler' ? 'Room No.' : 'Bus No.', value: inspectUser.residenceType === 'Hosteler' ? inspectUser.roomNumber : inspectUser.busNumber },
                        { label: 'Bus Stop', value: inspectUser.busStop },
                      ].map(({ label, value }) => value && (
                        <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Teacher-specific */}
              {inspectUser.role === 'teacher' && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Faculty Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Office Hours', value: inspectUser.officeHours },
                    ].map(({ label, value }) => value && (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {inspectUser.subjectsTaught && inspectUser.subjectsTaught.length > 0 && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Subjects Taught</p>
                      <div className="flex flex-wrap gap-2">
                        {inspectUser.subjectsTaught.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => { setInspectUser(null); openEditModal(inspectUser); }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD / EDIT USER ===== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`px-6 py-5 text-white relative ${editRole === 'student' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
              <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <span className="text-xs uppercase font-bold opacity-70">{editMode === 'add' ? 'Register New' : 'Edit'} {editRole === 'student' ? 'Student' : 'Teacher'}</span>
              <h3 className="text-xl font-bold mt-1">{editMode === 'add' ? `Add ${editRole === 'student' ? 'Student' : 'Teacher'}` : `Edit: ${editingUser.name}`}</h3>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5 text-xs">
              {/* Basic Info */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input required value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      placeholder="e.g. John Smith" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username *</label>
                    <input required value={editingUser.username || ''} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      placeholder="e.g. JohnSmith" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input required type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="e.g. john@school.edu" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password</label>
                    <input value={editingUser.password || ''} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                      placeholder="password123" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone</label>
                    <input value={editingUser.phone || ''} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <input value={editingUser.department || ''} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      placeholder="e.g. Computer Science" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Photo URL (Avatar)</label>
                    <input value={editingUser.avatar || ''} onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                      placeholder="https://... (leave blank to auto-generate)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                  </div>
                </div>
              </div>

              {/* Student-specific fields */}
              {editRole === 'student' && (
                <>
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Student ID</label>
                        <input value={editingUser.studentId || ''} onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                          placeholder="e.g. STU-2024-100" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Roll No</label>
                        <input value={editingUser.rollNo || ''} onChange={(e) => setEditingUser({ ...editingUser, rollNo: e.target.value })}
                          placeholder="e.g. 2024-100" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Semester</label>
                        <input value={editingUser.semester || ''} onChange={(e) => setEditingUser({ ...editingUser, semester: e.target.value })}
                          placeholder="e.g. 5th Semester" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                        <input value={editingUser.academicYear || ''} onChange={(e) => setEditingUser({ ...editingUser, academicYear: e.target.value })}
                          placeholder="e.g. 2024 - 2028" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">GPA</label>
                        <input type="number" step="0.01" min="0" max="4" value={editingUser.gpa ?? ''} onChange={(e) => setEditingUser({ ...editingUser, gpa: parseFloat(e.target.value) || undefined })}
                          placeholder="e.g. 3.85" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Attendance Rate (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value={editingUser.attendanceRate ?? ''} onChange={(e) => setEditingUser({ ...editingUser, attendanceRate: parseFloat(e.target.value) || undefined })}
                          placeholder="e.g. 94.5" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                        <input value={editingUser.bloodGroup || ''} onChange={(e) => setEditingUser({ ...editingUser, bloodGroup: e.target.value })}
                          placeholder="e.g. O+" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Guardian Name</label>
                        <input value={editingUser.guardianName || ''} onChange={(e) => setEditingUser({ ...editingUser, guardianName: e.target.value })}
                          placeholder="e.g. Mr. John Sr." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Guardian Contact</label>
                        <input value={editingUser.guardianContact || ''} onChange={(e) => setEditingUser({ ...editingUser, guardianContact: e.target.value })}
                          placeholder="e.g. +1 (555) 000-0000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Assign Mentor</h4>
                    <select value={editingUser.mentorId || ''} onChange={(e) => setEditingUser({ ...editingUser, mentorId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900">
                      <option value="">— No Mentor Assigned —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.employeeId || t.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Residence</h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(['Day Scholar', 'Hosteler'] as const).map((type) => (
                        <button key={type} type="button" onClick={() => setEditingUser({ ...editingUser, residenceType: type })}
                          className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${editingUser.residenceType === type ? (type === 'Day Scholar' ? 'bg-amber-500 text-white border-amber-600' : 'bg-teal-600 text-white border-teal-700') : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {type === 'Day Scholar' ? <Bus className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />} {type}
                        </button>
                      ))}
                    </div>
                    {editingUser.residenceType === 'Day Scholar' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div>
                          <label className="block font-bold text-amber-800 mb-1">Bus Route</label>
                          <input value={editingUser.busRoute || ''} onChange={(e) => setEditingUser({ ...editingUser, busRoute: e.target.value })}
                            placeholder="Route #14" className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block font-bold text-amber-800 mb-1">Bus Number</label>
                          <input value={editingUser.busNumber || ''} onChange={(e) => setEditingUser({ ...editingUser, busNumber: e.target.value })}
                            placeholder="BUS-042" className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono focus:outline-none" />
                        </div>
                        <div>
                          <label className="block font-bold text-amber-800 mb-1">Bus Stop</label>
                          <input value={editingUser.busStop || ''} onChange={(e) => setEditingUser({ ...editingUser, busStop: e.target.value })}
                            placeholder="Central Square" className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:outline-none" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-teal-50 rounded-xl border border-teal-200">
                        <div>
                          <label className="block font-bold text-teal-800 mb-1">Hostel Name</label>
                          <input value={editingUser.hostelName || ''} onChange={(e) => setEditingUser({ ...editingUser, hostelName: e.target.value })}
                            placeholder="Emerald Heights Block-B" className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block font-bold text-teal-800 mb-1">Room Number</label>
                          <input value={editingUser.roomNumber || ''} onChange={(e) => setEditingUser({ ...editingUser, roomNumber: e.target.value })}
                            placeholder="Room 304-B" className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-xs font-mono focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Teacher-specific fields */}
              {editRole === 'teacher' && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Faculty Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                      <input value={editingUser.employeeId || ''} onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                        placeholder="e.g. FAC-1001" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-slate-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Title / Designation</label>
                      <input value={editingUser.title || ''} onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                        placeholder="e.g. Associate Professor" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Office Hours</label>
                      <input value={editingUser.officeHours || ''} onChange={(e) => setEditingUser({ ...editingUser, officeHours: e.target.value })}
                        placeholder="Mon & Thu 2:00 PM - 4:00 PM" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subjects Taught <span className="font-normal text-slate-400">(comma-separated)</span></label>
                      <input value={subjectsInput} onChange={(e) => setSubjectsInput(e.target.value)}
                        placeholder="e.g. Calculus, Physics, Algorithms" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit"
                  className={`px-6 py-2 rounded-xl font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${editRole === 'student' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                  <Save className="w-3.5 h-3.5" /> {editMode === 'add' ? 'Register' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: DELETE CONFIRM ===== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Delete User?</h3>
              <p className="text-xs text-slate-500 mt-1">This action is permanent and cannot be undone. The user will be removed from the system.</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
              <button onClick={() => { deleteUser(deleteConfirmId); setDeleteConfirmId(null); }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ASSIGN MENTOR ===== */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative">
              <button onClick={() => setAssigningStudent(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <span className="text-xs uppercase font-bold text-purple-200">Admin Mentorship Hub</span>
              <h3 className="text-xl font-bold mt-1">Assign Faculty Mentor</h3>
              <p className="text-xs text-purple-100 mt-0.5">Student: {assigningStudent.name} ({assigningStudent.studentId || assigningStudent.rollNo})</p>
            </div>
            <form onSubmit={handleSaveMentor} className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Faculty Mentor</label>
              <div className="space-y-2">
                {teachers.map((tc) => (
                  <label key={tc.id} className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedMentorId === tc.id ? 'border-purple-600 bg-purple-50/70 shadow-xs' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="mentor" checked={selectedMentorId === tc.id} onChange={() => setSelectedMentorId(tc.id)} className="text-purple-600 focus:ring-purple-500" />
                      <img src={tc.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{tc.name}</p>
                        <p className="text-[10px] text-slate-400">{tc.title || 'Department Chair'}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-purple-700 font-semibold">{tc.employeeId || tc.id}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setAssigningStudent(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> Save Mentor Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT ACCOMMODATION ===== */}
      {editingStudentAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white relative">
              <button onClick={() => setEditingStudentAcc(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <span className="text-xs uppercase font-bold text-amber-400">Institutional Accommodation Control</span>
              <h3 className="text-xl font-bold mt-1">Manage {editingStudentAcc.name}'s Residence</h3>
            </div>
            <form onSubmit={handleSaveAccommodation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Accommodation Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Day Scholar', 'Hosteler'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setResidenceType(type)}
                      className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${residenceType === type ? (type === 'Day Scholar' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-teal-600 text-white border-teal-700 shadow-sm') : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {type === 'Day Scholar' ? <Bus className="w-4 h-4" /> : <Home className="w-4 h-4" />} {type}
                    </button>
                  ))}
                </div>
              </div>
              {residenceType === 'Day Scholar' ? (
                <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Bus Route Name</label>
                    <input type="text" required value={busRoute} onChange={(e) => setBusRoute(e.target.value)} placeholder="e.g. Route #14 - North City Express" className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Bus Number</label>
                      <input type="text" required value={busNumber} onChange={(e) => setBusNumber(e.target.value)} placeholder="BUS-042" className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Boarding Stop</label>
                      <input type="text" required value={busStop} onChange={(e) => setBusStop(e.target.value)} placeholder="Central Square Stop" className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-teal-50/60 rounded-2xl border border-teal-200">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Hostel Name / Residence Block</label>
                    <input type="text" required value={hostelName} onChange={(e) => setHostelName(e.target.value)} placeholder="Emerald Heights Residence (Block B)" className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Room Number</label>
                    <input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room 304-B" className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none" />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setEditingStudentAcc(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: ADD TIMETABLE SLOT ===== */}
      {newSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-slate-900 text-white relative">
              <button onClick={() => setNewSlotModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <span className="text-xs uppercase font-bold text-amber-400">Timetable Scheduler</span>
              <h3 className="text-xl font-bold mt-1">Add Slot for {selectedDay}</h3>
            </div>
            <form onSubmit={handleAddSlot} className="p-6 space-y-4 text-xs">
              {[
                { label: 'Subject Name', value: slotSubject, setter: setSlotSubject, placeholder: 'AP Calculus BC' },
                { label: 'Faculty Instructor', value: slotTeacher, setter: setSlotTeacher, placeholder: 'Dr. Sarah Jenkins' },
                { label: 'Classroom / Laboratory', value: slotRoom, setter: setSlotRoom, placeholder: 'Room 304 (Math Hall)' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{label}</label>
                  <input type="text" required value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Time</label>
                  <input type="text" required value={slotStartTime} onChange={(e) => setSlotStartTime(e.target.value)} placeholder="09:00 AM"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Time</label>
                  <input type="text" required value={slotEndTime} onChange={(e) => setSlotEndTime(e.target.value)} placeholder="10:15 AM"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button type="button" onClick={() => setNewSlotModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      <PostAnnouncementModal isOpen={annModalOpen} onClose={() => setAnnModalOpen(false)} />
    </div>
  );
};
