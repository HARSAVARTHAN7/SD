import React, { useState, useMemo, useRef } from 'react';
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
  ShieldAlert,
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
  FileUp,
  ImageOff,
  Download,
  Award,
  Ticket,
  Printer,
  KeyRound,
  RotateCcw,
  UserX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
// Removed StorageService
import { User, TimetableSlot, ChangeRequest, StudentResultReport, GradeItem } from '../../types';
import { StudentDashboard } from '../student/StudentDashboard';
import { formatTeacherName, generateTeacherEmailAndName } from '../../utils/teacherUtils';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { PostAnnouncementModal } from '../teacher/PostAnnouncementModal';
import { parsePdfText, extractStudentFromText, extractTeacherFromText, calculateSgpa, calculateCgpa, downloadTemplatePdf, downloadOverallResultsPdfTemplate, downloadHallTicketsPdfTemplate } from '../../utils/pdfParser';

interface AdminDashboardProps {
  currentTab: string;
  onSelectTab?: (tab: string) => void;
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
  attendanceRate: 100.0,
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const {
    courses,
    announcements,
    deleteAnnouncement,
    allUsers,
    changeRequests,
    studentResults,
    saveStudentResult,
    deleteStudentResult,
    showToast,
    addUser,
    updateUser,
    deleteUser,
    deletedUsers,
    restoreUser,
    deletedCourses,
    restoreCourse,
    deletedAnnouncements,
    restoreAnnouncement,
    deletedResults,
    restoreResult,
    resolveChangeRequest,
    deleteChangeRequest,
    timetable,
    addTimetableSlot,
    deleteTimetableSlot,
    assignMentor,
    addNotification,
  } = useApp();

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'admin' | 'student-preview' | 'teacher-preview'>('admin');
  const [previewTab, setPreviewTab] = useState<string>('overview');

  // Timetable State
  const timetableSlots = timetable;
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [newSlotModalOpen, setNewSlotModalOpen] = useState(false);
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');

  // Account Management State
  const [accountSubTab, setAccountSubTab] = useState<'pending' | 'approved' | 'credentials' | 'blocked'>('credentials');
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  // Recycle Bin State
  const [recycleCategory, setRecycleCategory] = useState<'students' | 'teachers' | 'courses' | 'announcements' | 'results'>('students');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Mentor Assignment State
  const [assigningStudent, setAssigningStudent] = useState<User | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [mentorSearch, setMentorSearch] = useState('');

  // Accommodation Edit State
  const [editingStudentAcc, setEditingStudentAcc] = useState<User | null>(null);
  const [residenceType, setResidenceType] = useState<'Day Scholar' | 'Hosteler'>('Day Scholar');
  const [busRoute, setBusRoute] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [busStop, setBusStop] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Results & Publication State
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<string>('Semester 5');
  const [resultSearchQuery, setResultSearchQuery] = useState('');
  const [editingResultReport, setEditingResultReport] = useState<StudentResultReport | null>(null);
  const pdfResultsInputRef = useRef<HTMLInputElement>(null);
  const pdfHallTicketInputRef = useRef<HTMLInputElement>(null);

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

  // Broadcast filter state
  const [adminBroadcastFilter, setAdminBroadcastFilter] = useState<'all' | 'admin' | 'teacher'>('all');

  // PDF Refs
  const pdfStudentInputRef = useRef<HTMLInputElement>(null);
  const pdfTeacherInputRef = useRef<HTMLInputElement>(null);

  // Template Modal & Publication Year Prompts
  const [activeTemplateModal, setActiveTemplateModal] = useState<'results' | 'hallTicket' | null>(null);
  const [activeRegTemplateModal, setActiveRegTemplateModal] = useState<'student' | 'teacher' | null>(null);
  const [publishYearModal, setPublishYearModal] = useState<'results' | 'hallTicket' | null>(null);
  const [targetPublishYear, setTargetPublishYear] = useState<string>('2024 - 2025');
  const [targetPublishSem, setTargetPublishSem] = useState<string>('Semester 5');
  const [activePdfViewer, setActivePdfViewer] = useState<{ title: string; content: string; fileName?: string } | null>(null);

  const handleHallTicketPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawText = await parsePdfText(file);

    showToast('Parsing Hall Tickets PDF...', `Issuing examination hall tickets for ${targetPublishYear} (${targetPublishSem}) from ${file.name}`, 'info');
    const studentList = allUsers.filter((u) => u.role === 'student');

    studentList.forEach((st, idx) => {
      const existing = studentResults.find((r) => r.studentId === st.id || r.rollNo === st.rollNo) || {
        id: `res-${st.id}`,
        studentId: st.id,
        studentName: st.name,
        rollNo: st.rollNo || '2024-418',
        department: st.department || 'Computer Science & Engineering',
        currentSemester: targetPublishSem,
        cgpa: st.gpa || 3.85,
        publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        academicYear: targetPublishYear,
        semesters: {},
      };

      const updatedReport: StudentResultReport = {
        ...existing,
        academicYear: targetPublishYear,
        hallTicket: {
          hallTicketNo: `REG-${targetPublishYear.split(' ')[0]}-${st.rollNo || (4180 + idx)}`,
          registerNumber: st.rollNo || `CCAWBCM${140 + idx}`,
          programme: `${st.department || 'Computer Science'} (Degree)`,
          semester: targetPublishSem.replace('Semester ', 'Sem '),
          candidateName: st.name,
          dob: '11/05/2004',
          examCenter: `Main Academic Examination Complex (Block ${String.fromCharCode(65 + (idx % 3))})`,
          seatNo: `Seat ${String.fromCharCode(65 + (idx % 3))}-${10 + idx}`,
          examDates: `${targetPublishYear} ${targetPublishSem} Examination Window`,
          status: 'Issued',
          publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      };

      saveStudentResult(updatedReport);
    });

    setSelectedSemesterTab(targetPublishSem);
    setActivePdfViewer({
      title: `Issued Hall Tickets (${targetPublishYear} - ${targetPublishSem})`,
      content: rawText || `=================================================================================\nOFFICIAL AUTONOMOUS ACADEMIC INSTITUTION\nHALL TICKET PUBLICATION REPORT (${targetPublishYear} - ${targetPublishSem})\n=================================================================================\nIssued hall tickets successfully for all enrolled students.\nTarget Academic Session: ${targetPublishYear}\nTarget Semester: ${targetPublishSem}\nStatus: PUBLISHED & ACTIVE\n=================================================================================`,
      fileName: file.name,
    });

    showToast('Hall Tickets Published!', `Issued official examination hall tickets for ${targetPublishYear} (${targetPublishSem}).`, 'success');
    e.target.value = '';
  };

  const handleOverallPdfResultsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Parsing Master Results PDF...', `Reading grade cards for ${targetPublishYear} (${targetPublishSem}) from ${file.name}`, 'info');
    const rawText = await parsePdfText(file);

    const studentList = allUsers.filter((u) => u.role === 'student');

    studentList.forEach((st) => {
      const matchesName = st.name.toLowerCase().split(' ').some((part) => part.length > 2 && rawText.toLowerCase().includes(part.toLowerCase()));
      const matchesRoll = st.rollNo && rawText.includes(st.rollNo);

      if (matchesName || matchesRoll || studentList.length <= 5) {
        const sampleGrades: GradeItem[] = [
          { courseId: 'c1', courseName: 'AP Calculus BC', courseCode: 'MATH-401', credits: 4, gradeLetter: 'A', percentage: 96, gpaPoint: 4.0, teacherName: st.mentorName || 'Dr. Sarah Jenkins', remarks: 'High proficiency demonstrated.' },
          { courseId: 'c2', courseName: 'Classical & Modern Physics', courseCode: 'PHYS-302', credits: 4, gradeLetter: 'A-', percentage: 92, gpaPoint: 3.7, teacherName: 'Dr. Sarah Jenkins', remarks: 'Good analytical skills.' },
          { courseId: 'c3', courseName: 'Advanced Computer Science', courseCode: 'CS-205', credits: 3, gradeLetter: 'A+', percentage: 98, gpaPoint: 4.0, teacherName: 'Prof. Alan Cooper', remarks: 'Excellent project work.' },
        ];

        const { sgpa, status } = calculateSgpa(sampleGrades);

        const existingReport = studentResults.find((r) => r.studentId === st.id || r.rollNo === st.rollNo);
        const updatedSemesters = {
          ...(existingReport?.semesters || {}),
          [targetPublishSem]: {
            semester: targetPublishSem,
            sgpa,
            status,
            grades: sampleGrades,
          },
        };

        const cgpa = calculateCgpa(updatedSemesters);

        const report: StudentResultReport = {
          id: existingReport?.id || `res-${st.id}`,
          studentId: st.id,
          studentName: st.name,
          rollNo: st.rollNo || '2024-418',
          department: st.department || 'Computer Science & Engineering',
          currentSemester: targetPublishSem,
          cgpa,
          publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          academicYear: targetPublishYear,
          semesters: updatedSemesters,
          hallTicket: existingReport?.hallTicket,
        };

        saveStudentResult(report);
      }
    });

    setSelectedSemesterTab(targetPublishSem);
    setActivePdfViewer({
      title: `Published Master Results (${targetPublishYear} - ${targetPublishSem})`,
      content: rawText || `=====================================================================\nMASTER ACADEMIC RESULT PUBLICATION REPORT (${targetPublishYear} - ${targetPublishSem})\n=====================================================================\nPublished semester grade cards successfully.\nAcademic Year: ${targetPublishYear}\nTarget Semester: ${targetPublishSem}\n=====================================================================`,
      fileName: file.name,
    });

    showToast('Results Published!', `Uploaded and published results for ${targetPublishYear} (${targetPublishSem}).`, 'success');
    e.target.value = '';
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetRole: 'student' | 'teacher') => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Parsing PDF...', `Reading text details from ${file.name}`, 'info');
    const rawText = await parsePdfText(file);

    if (targetRole === 'student') {
      const extracted = extractStudentFromText(rawText, file.name);
      setEditRole('student');
      setEditMode('add');
      setEditingUser({ ...blankStudent(), ...extracted });
      setEditModalOpen(true);
      showToast('PDF Auto-Filled!', `Extracted student profile for "${extracted.name}" from PDF.`, 'success');
    } else {
      const extracted = extractTeacherFromText(rawText, file.name);
      setEditRole('teacher');
      setEditMode('add');
      setEditingUser({ ...blankTeacher(), ...extracted });
      setSubjectsInput(extracted.subjectsTaught?.join(', ') || '');
      setEditModalOpen(true);
      showToast('PDF Auto-Filled!', `Extracted teacher profile for "${extracted.name}" from PDF.`, 'success');
    }

    e.target.value = '';
  };

  const handleDeletePhoto = (u: User) => {
    const updated: User = {
      ...u,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=150`,
    };
    updateUser(updated);
    if (inspectUser && inspectUser.id === u.id) {
      setInspectUser(updated);
    }
    showToast('Photo Removed', `Deleted profile picture for ${u.name}.`, 'info');
  };

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
  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;
    const teacher = teachers.find((t) => t.id === selectedMentorId);
    if (!teacher) { showToast('Select Mentor', 'Please select a valid faculty mentor', 'warning'); return; }
    await assignMentor(assigningStudent.id, { mentorId: teacher.employeeId || teacher.id, mentorName: teacher.name, mentorPhone: teacher.phone || '' });
    setAssigningStudent(null);
  };

  // ── Handlers: Timetable ────────────────────────────────────────────────────
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTimetableSlot({
      day: selectedDay as any,
      subject: slotSubject,
      teacher: slotTeacher,
      room: slotRoom,
      startTime: slotStartTime,
      endTime: slotEndTime,
      color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700',
    });
    setNewSlotModalOpen(false);
    setSlotSubject(''); setSlotTeacher(''); setSlotRoom(''); setSlotStartTime(''); setSlotEndTime('');
  };

  const handleDeleteSlot = async (id: string) => {
    await deleteTimetableSlot(id);
  };

  // ── Handlers: Accommodation ────────────────────────────────────────────────
  const handleSaveAccommodation = async (e: React.FormEvent) => {
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
    await updateUser(updated);
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
    let finalName = editingUser.name || '';
    let finalEmail = editingUser.email || '';
    let finalUsername = editingUser.username || '';

    if (editRole === 'teacher' && finalName) {
      const generated = generateTeacherEmailAndName(finalName, allUsers);
      finalName = generated.name;
      if (!finalEmail || !finalEmail.includes('@bitsathy.ac.in')) {
        finalEmail = generated.email;
        finalUsername = generated.username;
      }
    }

    const base: User = {
      id: editMode === 'add' ? makeId(editRole) : (editingUser.id || makeId(editRole)),
      username: finalUsername || (finalEmail ? finalEmail.split('@')[0] : `user_${Date.now()}`),
      email: finalEmail,
      password: editingUser.password || 'password123',
      name: finalName,
      role: editRole,
      avatar: editingUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName || 'User')}&background=random&size=150`,
      phone: editingUser.phone || '',
      joinedDate: editingUser.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      department: editingUser.department || '',
      attendanceRate: editingUser.attendanceRate ?? 100.0,
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
        attendanceRate: editingUser.attendanceRate ?? 100.0,
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
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">Admin Dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          {(() => {
            const blockedStudentsCount = allUsers.filter((u) => u.role === 'student' && (u.isBlocked || u.status === 'blocked')).length;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'students', label: 'Total Enrolled', value: `${students.length} Students`, sub: 'Active Directory', color: 'emerald', Icon: GraduationCap },
                    { id: 'teachers', label: 'Faculty Staff', value: `${teachers.length} Professors`, sub: 'Active Mentors & Chairs', color: 'purple', Icon: Users },
                    { id: 'blocked', label: 'Blocked Accounts', value: `${blockedStudentsCount} Suspended`, sub: blockedStudentsCount > 0 ? 'Tap to Manage' : 'All Accounts Active', color: 'rose', Icon: ShieldAlert },
                    { id: 'results', label: 'Result Portal', value: 'Publications', sub: 'SGPA/CGPA Cards', color: 'sky', Icon: BookOpen },
                    { id: 'timetable', label: 'Timetable Slots', value: `${timetableSlots.length} Sessions`, sub: 'Weekly Schedule', color: 'amber', Icon: Calendar },
                  ].map(({ id, label, value, sub, color, Icon }) => (
                    <div
                      key={label}
                      onClick={() => {
                        if (id === 'students') {
                          setDirActiveTab('students');
                          if (onSelectTab) onSelectTab('directory');
                        } else if (id === 'teachers') {
                          setDirActiveTab('teachers');
                          if (onSelectTab) onSelectTab('directory');
                        } else if (id === 'blocked') {
                          if (onSelectTab) onSelectTab('accounts');
                          setAccountSubTab('blocked');
                        } else if (id === 'results') {
                          if (onSelectTab) onSelectTab('results');
                        } else if (id === 'timetable') {
                          if (onSelectTab) onSelectTab('timetable');
                        }
                      }}
                      className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:border-slate-300 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-700 transition-colors">{label}</span>
                        <div className={`w-9 h-9 rounded-2xl bg-${color}-50 text-${color}-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-extrabold text-slate-800 mt-2 flex items-center justify-between">
                        {value}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                      </p>
                      <p className={`text-[11px] text-${color}-600 font-semibold mt-1`}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Blocked Students Alert Banner */}
                {blockedStudentsCount > 0 && (
                  <div className="bg-rose-50 border-2 border-rose-200/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <ShieldAlert className="w-6 h-6 animate-pulse text-rose-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          🚨 {blockedStudentsCount} Student Account{blockedStudentsCount > 1 ? 's' : ''} Currently Blocked
                        </h4>
                        <p className="text-xs text-rose-700 mt-0.5 font-semibold">
                          Student portal access suspended by Administration. Notifications sent to assigned faculty mentors.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onSelectTab) onSelectTab('accounts');
                        setAccountSubTab('blocked');
                      }}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" /> Manage Blocked Accounts →
                    </button>
                  </div>
                )}
              </>
            );
          })()}

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
        </div>
      )}

      {/* ===== TAB: ACCOUNT MANAGEMENT (Password Change Requests) ===== */}
      {currentTab === 'accounts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-7 h-7 text-indigo-600" /> Account Management Center
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review and approve password change requests for Students & Faculty. View approved account records and dismiss/delete messages.
              </p>
            </div>

            {/* Sub-Tab Navigation Switcher */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl shrink-0">
              <button
                onClick={() => setAccountSubTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  accountSubTab === 'pending' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending Requests</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                  {changeRequests.filter((r) => r.description.includes('PASSWORD_RESET') && r.status === 'pending').length}
                </span>
              </button>

              <button
                onClick={() => setAccountSubTab('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  accountSubTab === 'approved' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approved Accounts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {changeRequests.filter((r) => r.description.includes('PASSWORD_RESET') && r.status === 'resolved').length}
                </span>
              </button>

              <button
                onClick={() => setAccountSubTab('credentials')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  accountSubTab === 'credentials' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Registered Credentials Directory</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                  {allUsers.filter((u) => u.role !== 'admin' && !u.isBlocked && u.status !== 'blocked').length}
                </span>
              </button>

              <button
                onClick={() => setAccountSubTab('blocked')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  accountSubTab === 'blocked' ? 'bg-white text-rose-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Blocked Accounts & Retrieval</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                  {allUsers.filter((u) => u.role !== 'admin' && (u.isBlocked || u.status === 'blocked')).length}
                </span>
              </button>
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Role:</span>
              {(['all', 'student', 'teacher'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAccountRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    accountRoleFilter === r
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : `${r}s`}
                </button>
              ))}
            </div>

            <p className="text-xs font-medium text-slate-400">
              Showing {accountSubTab === 'pending' ? 'Pending Requests' : accountSubTab === 'approved' ? 'Approved Account Records' : 'Registered Login Credentials Database'}
            </p>
          </div>

          {/* Sub-Tab 3: REGISTERED ACCOUNT CREDENTIALS DIRECTORY */}
          {accountSubTab === 'credentials' && (
            <div className="space-y-4">
              {(() => {
                const registeredUsers = allUsers.filter((u) => {
                  if (u.role === 'admin') return false;
                  if (u.isBlocked || u.status === 'blocked') return false;
                  if (accountRoleFilter === 'student') return u.role === 'student';
                  if (accountRoleFilter === 'teacher') return u.role === 'teacher';
                  return true;
                });

                if (registeredUsers.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                      <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-800">No Active Accounts Found</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Student and teacher account credentials created or registered will appear here.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {registeredUsers.map((account) => {
                      const isTeacher = account.role === 'teacher';
                      const isPassVisible = visiblePasswords[account.id] || false;
                      const accountPass = account.password || 'password123';

                      return (
                        <div
                          key={account.id}
                          className={`bg-white rounded-3xl p-6 border shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                            isTeacher ? 'border-purple-200 bg-purple-50/10' : 'border-emerald-200 bg-emerald-50/10'
                          }`}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                                  isTeacher
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isTeacher ? 'Teacher Account' : 'Student Account'}
                              </span>

                              <span className="text-xs text-slate-400 font-mono">
                                ID: {isTeacher ? account.employeeId || account.id : account.rollNo || account.id}
                              </span>
                            </div>

                            <div className="flex items-start gap-4">
                              <img
                                src={account.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=random`}
                                alt={account.name}
                                className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                              />
                              <div className="space-y-0.5">
                                <h4 className="text-base font-extrabold text-slate-900">{account.name}</h4>
                                <p className="text-xs text-slate-500 font-mono">{account.email}</p>
                                <p className="text-xs text-slate-600 font-medium pt-0.5">
                                  {isTeacher
                                    ? `Department: ${account.department || 'Faculty'}`
                                    : `Roll No: ${account.rollNo || '—'} • ${account.semester || 'Student'}`}
                                </p>
                              </div>
                            </div>

                            {/* Registered Login Password Box */}
                            <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Login Password:</p>
                                <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                                  {isPassVisible ? accountPass : '••••••••••••'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePasswords((prev) => ({
                                    ...prev,
                                    [account.id]: !prev[account.id],
                                  }))
                                }
                                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                                title={isPassVisible ? 'Hide Password' : 'Show Password'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(account);
                                setEditRole(account.role as 'student' | 'teacher');
                                setEditMode('edit');
                                setEditModalOpen(true);
                              }}
                              className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Edit Credentials
                            </button>
                            {!isTeacher && (
                              <button
                                onClick={() => {
                                  updateUser({ ...account, isBlocked: true, status: 'blocked' });
                                  showToast('Student Blocked', `Access suspended for ${account.name} (${account.email}). Moved to Blocked tab.`, 'warning');
                                }}
                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Block student account access"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Block Student
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub-Tab 4: BLOCKED STUDENT ACCOUNTS & RETRIEVAL DIRECTORY */}
          {accountSubTab === 'blocked' && (
            <div className="space-y-4">
              {(() => {
                const blockedStudents = allUsers.filter((u) => {
                  if (u.role !== 'student') return false;
                  return Boolean(u.isBlocked || u.status === 'blocked');
                });

                if (blockedStudents.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-800">No Blocked Student Accounts</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        All registered student accounts are currently active with full access.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blockedStudents.map((account) => {
                      const isPassVisible = visiblePasswords[account.id] || false;
                      const accountPass = account.password || 'password123';

                      return (
                        <div
                          key={account.id}
                          className="bg-white rounded-3xl p-6 border-2 border-rose-300 bg-rose-50/20 shadow-md flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-4">
                            {/* Status Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-xs">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> STUDENT ACCOUNT BLOCKED
                              </span>

                              <span className="text-xs text-rose-700 font-mono font-bold">
                                Roll #: {account.rollNo || account.studentId || account.id}
                              </span>
                            </div>

                            {/* Student Profile Info */}
                            <div className="flex items-start gap-4">
                              <img
                                src={account.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=random`}
                                alt={account.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-400 shadow-sm shrink-0"
                              />
                              <div className="space-y-1">
                                <h4 className="text-base font-extrabold text-slate-900">{account.name}</h4>
                                <p className="text-xs text-rose-600 font-mono font-bold">{account.email}</p>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {account.department || 'Computer Science'}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {account.semester || '5th Semester'}
                                  </span>
                                  {account.gpa !== undefined && (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                      GPA: {account.gpa}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Extra Details (Mentor & Residence) */}
                            <div className="p-3 bg-rose-100/40 rounded-2xl border border-rose-200/80 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Residence Type:</span>
                                <span className="font-semibold text-slate-800">{account.residenceType || 'Day Scholar'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500 block">Assigned Mentor:</span>
                                <span className="font-semibold text-slate-800">{account.mentorName || 'Dr. Sarah Jenkins'}</span>
                              </div>
                            </div>

                            {/* Registered Login Password Box */}
                            <div className="p-3 bg-white rounded-2xl border border-rose-200 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Blocked Password:</p>
                                <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                                  {isPassVisible ? accountPass : '••••••••••••'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePasswords((prev) => ({
                                    ...prev,
                                    [account.id]: !prev[account.id],
                                  }))
                                }
                                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                title={isPassVisible ? 'Hide Password' : 'Show Password'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Revoke Block Button */}
                          <div className="pt-4 border-t border-rose-200">
                            <button
                              onClick={() => {
                                updateUser({ ...account, isBlocked: false, status: 'active' });
                                showToast('Block Revoked', `Full access & credentials retrieved for ${account.name} (${account.email}). Moved back to Active Directory.`, 'success');
                              }}
                              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" /> Revoke Block / Restore Student Access
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub-Tabs 1 & 2: Password Reset Requests (Pending / Approved) */}
          {accountSubTab !== 'credentials' && (
            <div className="space-y-4">
              {(() => {
                const resetRequests = changeRequests.filter((r) => {
                  const isReset = r.description.includes('PASSWORD_RESET');
                  if (!isReset) return false;

                  // Filter by Sub-tab status
                  if (accountSubTab === 'pending' && r.status !== 'pending') return false;
                  if (accountSubTab === 'approved' && r.status !== 'resolved') return false;

                  // Filter by Role
                  const isStudentReq = r.description.includes('Role=STUDENT') || r.teacherName === 'Student Account';
                  const isTeacherReq = r.description.includes('Role=TEACHER') || r.teacherName === 'Teacher Account';
                  if (accountRoleFilter === 'student') return isStudentReq;
                  if (accountRoleFilter === 'teacher') return isTeacherReq;

                  return true;
                });

                if (resetRequests.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-800">
                        {accountSubTab === 'pending' ? 'No Pending Password Requests' : 'No Approved Account Records'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {accountSubTab === 'pending'
                          ? 'All student and teacher password reset requests have been reviewed and approved.'
                          : 'Approved account password change messages will appear here once approved by the Admin.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resetRequests.map((req) => {
                      // Extract email & new password from description
                      let userEmail = req.studentName;
                      let requestedNewPass = '';
                      let isTeacherRole = req.description.includes('Role=TEACHER') || req.teacherName === 'Teacher Account';

                      if (req.description.includes('Email=')) {
                        const emailMatch = req.description.match(/Email=([^|]+)/);
                        if (emailMatch) userEmail = emailMatch[1].trim();
                      }
                      if (req.description.includes('NewPassword=')) {
                        const passMatch = req.description.match(/NewPassword=([^|]+)/);
                        if (passMatch) requestedNewPass = passMatch[1].trim();
                      }

                      const isPassVisible = visiblePasswords[req.id] || false;

                      return (
                        <div
                          key={req.id}
                          className={`bg-white rounded-3xl p-6 border shadow-sm transition-all flex flex-col justify-between ${
                            req.status === 'pending'
                              ? isTeacherRole
                                ? 'border-purple-200 bg-purple-50/20'
                                : 'border-emerald-200 bg-emerald-50/20'
                              : 'border-emerald-300 bg-emerald-50/10'
                          }`}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                                  isTeacherRole
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isTeacherRole ? 'Teacher Account' : 'Student Account'}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">{req.timestamp}</span>
                                <button
                                  onClick={() => {
                                    deleteChangeRequest(req.id);
                                    showToast('Message Deleted', 'Account request message entry dismissed.', 'info');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                  title="Delete Message Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <p className="text-base font-extrabold text-slate-900">{req.studentName}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{userEmail}</p>
                            </div>

                            {requestedNewPass && (
                              <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {req.status === 'pending' ? 'Requested New Password:' : 'Approved Updated Password:'}
                                  </p>
                                  <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                                    {isPassVisible ? requestedNewPass : '••••••••••••'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVisiblePasswords((prev) => ({
                                      ...prev,
                                      [req.id]: !prev[req.id],
                                    }))
                                  }
                                  className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                                  title={isPassVisible ? 'Hide Password' : 'Show Password'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            {req.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => {
                                    // Update target user password in database
                                    const targetUser = allUsers.find(
                                      (u) =>
                                        u.email.toLowerCase() === userEmail.toLowerCase() ||
                                        u.username?.toLowerCase() === userEmail.toLowerCase() ||
                                        u.name.toLowerCase() === req.studentName.toLowerCase() ||
                                        u.rollNo?.toLowerCase() === userEmail.toLowerCase() ||
                                        u.employeeId?.toLowerCase() === userEmail.toLowerCase()
                                    );

                                    if (targetUser && requestedNewPass) {
                                      updateUser({
                                        ...targetUser,
                                        password: requestedNewPass,
                                      });
                                      showToast(
                                        'Password Updated in Database',
                                        `Successfully updated password for ${targetUser.name} to '${requestedNewPass}'.`,
                                        'success'
                                      );
                                    } else {
                                      showToast('Request Approved', `Approved password change request for ${req.studentName}.`, 'success');
                                    }

                                    resolveChangeRequest(req.id);
                                  }}
                                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Approve & Update Password
                                </button>
                                <button
                                  onClick={() => {
                                    deleteChangeRequest(req.id);
                                    showToast('Dismissed', 'Request message entry deleted.', 'info');
                                  }}
                                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Dismiss / Delete
                                </button>
                              </>
                            ) : (
                              <div className="w-full flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200">
                                  <CheckCircle2 className="w-4 h-4" /> Approved & Updated in Database
                                </span>
                                <button
                                  onClick={() => {
                                    deleteChangeRequest(req.id);
                                    showToast('Entry Deleted', 'Approved account message entry deleted.', 'info');
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-rose-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Message
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: INSTITUTIONAL RECYCLE BIN ===== */}
      {currentTab === 'recycle' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw className="w-7 h-7 text-indigo-600" /> Institutional Recycle Center ♻️
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Holds all deleted data across Students, Teachers, Courses, Notice Announcements, and Published Results. Items can ONLY be restored.
              </p>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setRecycleCategory('students')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recycleCategory === 'students' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Students</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {deletedUsers.filter((u) => u.role === 'student').length}
                </span>
              </button>

              <button
                onClick={() => setRecycleCategory('teachers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recycleCategory === 'teachers' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Teachers</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-800">
                  {deletedUsers.filter((u) => u.role === 'teacher').length}
                </span>
              </button>

              <button
                onClick={() => setRecycleCategory('courses')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recycleCategory === 'courses' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Courses</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800">
                  {deletedCourses.length}
                </span>
              </button>

              <button
                onClick={() => setRecycleCategory('announcements')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recycleCategory === 'announcements' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Notices</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                  {deletedAnnouncements.length}
                </span>
              </button>

              <button
                onClick={() => setRecycleCategory('results')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  recycleCategory === 'results' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Results</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800">
                  {deletedResults.length}
                </span>
              </button>
            </div>
          </div>

          {/* Recycle Content Area */}
          <div className="space-y-4">
            {/* CATEGORY: STUDENTS */}
            {recycleCategory === 'students' && (() => {
              const deletedStudents = deletedUsers.filter((u) => u.role === 'student');
              if (deletedStudents.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                    <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Deleted Student Accounts</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Any student profile deleted from the directory will be archived here and can be restored anytime.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deletedStudents.map((st) => (
                    <div key={st.id} className="bg-white rounded-3xl p-6 border border-emerald-200/80 bg-emerald-50/10 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Student Account
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Deleted: {st.deletedAt || 'Recently'}</span>
                      </div>

                      <div className="flex items-start gap-4">
                        <img
                          src={st.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=random`}
                          alt={st.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                        />
                        <div className="space-y-0.5">
                          <h4 className="text-base font-extrabold text-slate-900">{st.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{st.email}</p>
                          <p className="text-xs text-slate-600 font-medium pt-0.5">
                            Roll No: {st.rollNo || '—'} • {st.department || 'Academic Department'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80">
                        <button
                          onClick={() => restoreUser(st.id)}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore Student Account to Active List
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CATEGORY: TEACHERS */}
            {recycleCategory === 'teachers' && (() => {
              const deletedTeachers = deletedUsers.filter((u) => u.role === 'teacher');
              if (deletedTeachers.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                    <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Deleted Teacher Accounts</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Any faculty member profile deleted from the directory will be archived here and can be restored anytime.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deletedTeachers.map((tc) => (
                    <div key={tc.id} className="bg-white rounded-3xl p-6 border border-purple-200/80 bg-purple-50/10 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Teacher Account
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Deleted: {tc.deletedAt || 'Recently'}</span>
                      </div>

                      <div className="flex items-start gap-4">
                        <img
                          src={tc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tc.name)}&background=random`}
                          alt={tc.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                        />
                        <div className="space-y-0.5">
                          <h4 className="text-base font-extrabold text-slate-900">{tc.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{tc.email}</p>
                          <p className="text-xs text-slate-600 font-medium pt-0.5">
                            Employee ID: {tc.employeeId || '—'} • {tc.title || tc.department || 'Faculty Member'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80">
                        <button
                          onClick={() => restoreUser(tc.id)}
                          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore Teacher Account to Active List
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CATEGORY: COURSES */}
            {recycleCategory === 'courses' && (() => {
              if (deletedCourses.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Deleted Courses</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Any deleted course modules will appear here for one-click restoration.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deletedCourses.map((crs) => (
                    <div key={crs.id} className="bg-white rounded-3xl p-6 border border-blue-200/80 bg-blue-50/10 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                          {crs.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Deleted: {crs.deletedAt || 'Recently'}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{crs.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{crs.description}</p>
                        <p className="text-xs text-slate-600 font-semibold mt-2">
                          Instructor: {crs.teacherName} • Credits: {crs.credits}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80">
                        <button
                          onClick={() => restoreCourse(crs.id)}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore Course Module to Active Catalog
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CATEGORY: ANNOUNCEMENTS */}
            {recycleCategory === 'announcements' && (() => {
              if (deletedAnnouncements.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                    <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Deleted Notice Announcements</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Any deleted campus notices or announcements will be stored here and can be restored anytime.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deletedAnnouncements.map((ann) => (
                    <div key={ann.id} className="bg-white rounded-3xl p-6 border border-amber-200/80 bg-amber-50/10 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Notice Circular
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Deleted: {ann.deletedAt || 'Recently'}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{ann.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-2">
                          Author: {ann.authorName} • Posted: {ann.date}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80">
                        <button
                          onClick={() => restoreAnnouncement(ann.id)}
                          className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore Announcement to Notice Board
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* CATEGORY: RESULTS */}
            {recycleCategory === 'results' && (() => {
              if (deletedResults.length === 0) {
                return (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Deleted Academic Results</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Any deleted student academic grade reports will be stored here and can be restored anytime.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deletedResults.map((res) => (
                    <div key={res.id} className="bg-white rounded-3xl p-6 border border-rose-200/80 bg-rose-50/10 shadow-xs flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Result
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Deleted: {res.deletedAt || 'Recently'}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{res.studentName}</h4>
                        <p className="text-xs text-slate-500 font-mono">Roll No: {res.rollNo} • {res.currentSemester}</p>
                        <p className="text-xs text-slate-700 font-bold mt-2">
                          CGPA: {res.cgpa.toFixed(2)} • Published: {res.publishedDate}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80">
                        <button
                          onClick={() => restoreResult(res.id)}
                          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore Result to Published Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== TAB 2: MENTOR ALLOCATION ===== */}
      {currentTab === 'mentors' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty Mentor Allocation Center</h2>
              <p className="text-xs text-slate-500 mt-1">Assign and reallocate students to departmental faculty mentors with instant synchronization.</p>
            </div>

            {/* Mentor Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder="Search student or mentor..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800"
              />
            </div>
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
                  {students
                    .filter(
                      (st) =>
                        st.name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
                        (st.studentId && st.studentId.includes(mentorSearch)) ||
                        (st.rollNo && st.rollNo.includes(mentorSearch)) ||
                        (st.mentorName && st.mentorName.toLowerCase().includes(mentorSearch.toLowerCase()))
                    )
                    .map((st) => (
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

      {/* ===== TAB: RESULT PUBLICATION CENTER ===== */}
      {currentTab === 'results' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Result & Hall Ticket Publication Center</h2>
              <p className="text-xs text-slate-500 mt-1">Publish semester result grade cards, issue exam hall tickets, and review pass/fail analytics.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveTemplateModal('results')}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Preview master results PDF template format"
              >
                <Eye className="w-4 h-4 text-amber-600" /> Results Template Preview
              </button>

              <button
                onClick={() => setActiveTemplateModal('hallTicket')}
                className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Preview master hall tickets PDF template format"
              >
                <Eye className="w-4 h-4 text-purple-600" /> Hall Ticket Template Preview
              </button>

              <input
                type="file"
                ref={pdfResultsInputRef}
                accept=".pdf"
                onChange={handleOverallPdfResultsUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={pdfHallTicketInputRef}
                accept=".pdf"
                onChange={handleHallTicketPdfUpload}
                className="hidden"
              />

              <button
                onClick={() => setPublishYearModal('results')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-amber-400" /> Publish Overall Results PDF
              </button>

              <button
                onClick={() => setPublishYearModal('hallTicket')}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-amber-300" /> Publish Overall Hall Tickets PDF
              </button>
            </div>
          </div>

          {/* Semester Selector Buttons (Semester 1 - 8) */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
            {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemesterTab(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSemesterTab === sem
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sem}
              </button>
            ))}
          </div>

          {/* Pass / Fail & Semester Summary Metrics */}
          {(() => {
            const semesterStudents = studentResults.filter(
              (r) => r.semesters && r.semesters[selectedSemesterTab]
            );
            const passedCount = semesterStudents.filter(
              (r) => r.semesters[selectedSemesterTab]?.status === 'Pass'
            ).length;
            const failedCount = semesterStudents.filter(
              (r) => r.semesters[selectedSemesterTab]?.status === 'Fail'
            ).length;
            const passRate = semesterStudents.length > 0 ? Math.round((passedCount / semesterStudents.length) * 100) : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Semester</span>
                  <span className="text-xl font-extrabold text-slate-800 mt-1 block">{selectedSemesterTab}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">{semesterStudents.length} Students Evaluated</span>
                </div>

                <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Passed Students</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">{passedCount}</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">Cleared All Subjects</span>
                </div>

                <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200/80 shadow-xs">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Failed Students</span>
                  <span className="text-2xl font-black text-rose-700 mt-1 block">{failedCount}</span>
                  <span className="text-[11px] text-rose-800 font-semibold">Needs Re-examination</span>
                </div>

                <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200/80 shadow-xs">
                  <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">Semester Pass Rate</span>
                  <span className="text-2xl font-black text-purple-800 mt-1 block">{passRate}%</span>
                  <span className="text-[11px] text-purple-700 font-semibold">Institutional Average</span>
                </div>
              </div>
            );
          })()}

          {/* Search and Count */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={resultSearchQuery}
                onChange={(e) => setResultSearchQuery(e.target.value)}
                placeholder="Search student or roll number..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 text-slate-800 shadow-xs"
              />
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
              Showing {selectedSemesterTab} Reports
            </span>
          </div>

          {/* Student Result Cards for Selected Semester */}
          {(() => {
            const semResults = studentResults.filter(
              (r) =>
                r.semesters &&
                r.semesters[selectedSemesterTab] &&
                (r.studentName.toLowerCase().includes(resultSearchQuery.toLowerCase()) ||
                  r.rollNo.toLowerCase().includes(resultSearchQuery.toLowerCase()))
            );

            if (semResults.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3 col-span-full">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800">No Result Data Available for {selectedSemesterTab}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    No published student result reports found for {selectedSemesterTab}. Use "Publish Overall Results PDF" above to upload and publish grade reports for this semester.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {semResults.map((res) => {
                  const semData = res.semesters[selectedSemesterTab];
                  return (
                  <div key={res.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-extrabold text-sm">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base">{res.studentName}</h4>
                          <p className="text-xs font-mono font-semibold text-purple-700">Roll No: {res.rollNo} • {selectedSemesterTab}</p>
                          <p className="text-[10px] text-slate-400">{res.department || 'CS Department'}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
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

                    {/* Hall Ticket Badge */}
                    {res.hallTicket && (
                      <div className="p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-900 flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-purple-600" /> Hall Ticket Issued:
                        </span>
                        <span className="font-mono text-purple-800 font-bold">{res.hallTicket.hallTicketNo} ({res.hallTicket.seatNo})</span>
                      </div>
                    )}

                    {/* Subject Grades Breakdown */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject Breakdown ({selectedSemesterTab})</p>
                      <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl border border-slate-100 p-3">
                        {semData?.grades.map((g) => (
                          <div key={g.courseCode} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{g.courseName} <span className="font-mono text-slate-400">({g.courseCode})</span></p>
                              <p className="text-[10px] text-slate-500">{g.remarks}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-md font-extrabold text-xs ${
                                g.gradeLetter === 'F' || g.percentage < 50 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {g.gradeLetter} ({g.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      <button
                        onClick={() => setEditingResultReport(res)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" /> Admin Edit Access (Grades)
                      </button>
                      <button
                        onClick={() => deleteStudentResult(res.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Published Result Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            );
          })()}
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
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={pdfStudentInputRef}
                    accept=".pdf"
                    onChange={(e) => handlePdfUpload(e, 'student')}
                    className="hidden"
                  />
                  <button
                    onClick={() => setActiveRegTemplateModal('student')}
                    className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Preview student registration template format"
                  >
                    <Eye className="w-4 h-4 text-emerald-600" /> Preview Template
                  </button>
                  <button
                    onClick={() => pdfStudentInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Upload PDF document to auto-fill student details"
                  >
                    <FileUp className="w-4 h-4 text-emerald-600" /> Auto-fill from PDF
                  </button>
                  <button onClick={() => openAddModal('student')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <UserPlus className="w-4 h-4" /> Add Student
                  </button>
                </div>
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
                              {st.isBlocked || st.status === 'blocked' ? (
                                <button
                                  onClick={() => {
                                    updateUser({ ...st, isBlocked: false, status: 'active' });
                                    showToast('Block Revoked', `Full access restored for ${st.name}.`, 'success');
                                  }}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Revoke Block / Restore Access"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    updateUser({ ...st, isBlocked: true, status: 'blocked' });
                                    showToast('Student Blocked', `Access suspended for ${st.name}. Moved to Blocked tab.`, 'warning');
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Block Student Account"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              )}
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
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="file"
                    ref={pdfTeacherInputRef}
                    accept=".pdf"
                    onChange={(e) => handlePdfUpload(e, 'teacher')}
                    className="hidden"
                  />
                  <button
                    onClick={() => setActiveRegTemplateModal('teacher')}
                    className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Preview faculty registration template format"
                  >
                    <Eye className="w-4 h-4 text-purple-600" /> Preview Template
                  </button>
                  <button
                    onClick={() => pdfTeacherInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Upload PDF document to auto-fill teacher details"
                  >
                    <FileUp className="w-4 h-4 text-purple-600" /> Auto-fill from PDF
                  </button>
                  <button onClick={() => openAddModal('teacher')}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                    <UserPlus className="w-4 h-4" /> Add Teacher
                  </button>
                </div>
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
                            <button
                              onClick={() => {
                                resolveChangeRequest(req.id);
                                if (req.description.includes('STUDENT_PASSWORD_RESET')) {
                                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                                  showToast('Password Reset Approved', `Approved password reset for ${req.studentName}. Dispatched verification OTP to student email.`, 'success');
                                }
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> {req.description.includes('STUDENT_PASSWORD_RESET') ? 'Approve Reset & Send OTP' : 'Approve'}
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

          {/* Broadcast Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs w-fit">
            {(['all', 'admin', 'teacher'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setAdminBroadcastFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  adminBroadcastFilter === filter
                    ? 'bg-slate-900 text-white shadow-xs'
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
                if (adminBroadcastFilter === 'admin') {
                  return a.authorRole.toLowerCase().includes('admin') || a.authorId.includes('admin');
                }
                if (adminBroadcastFilter === 'teacher') {
                  return !a.authorRole.toLowerCase().includes('admin') && !a.authorId.includes('admin');
                }
                return true;
              })
              .map((ann) => (
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

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDeletePhoto(inspectUser)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Admin Access Only: Delete profile photo and reset to default avatar"
                >
                  <ImageOff className="w-3.5 h-3.5" /> Delete Photo
                </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setNewSlotModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
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

      {/* ===== MODAL: ADMIN EDIT GRADES ===== */}
      {editingResultReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn" onClick={() => setEditingResultReport(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-slate-950 to-indigo-950 text-white relative">
              <button onClick={() => setEditingResultReport(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"><X className="w-5 h-5" /></button>
              <span className="text-xs uppercase font-bold text-amber-400">Admin Master Grade Access</span>
              <h3 className="text-xl font-bold mt-1">Edit Results: {editingResultReport.studentName}</h3>
              <p className="text-xs text-slate-300 mt-0.5">Roll No: {editingResultReport.rollNo} • {selectedSemesterTab}</p>
            </div>

            {(() => {
              const currentSemData = editingResultReport.semesters[selectedSemesterTab] || {
                semester: selectedSemesterTab,
                sgpa: 3.85,
                status: 'Pass',
                grades: [
                  { courseId: 'c1', courseName: 'AP Calculus BC', courseCode: 'MATH-401', credits: 4, gradeLetter: 'A', percentage: 96, gpaPoint: 4.0, teacherName: 'Dr. Sarah Jenkins', remarks: 'High proficiency' },
                  { courseId: 'c2', courseName: 'Classical & Modern Physics', courseCode: 'PHYS-302', credits: 4, gradeLetter: 'A-', percentage: 92, gpaPoint: 3.7, teacherName: 'Dr. Sarah Jenkins', remarks: 'Good analytical skills' },
                ],
              };

              return (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Recalculate SGPA and CGPA
                    const { sgpa, status } = calculateSgpa(currentSemData.grades);
                    const updatedSemesters = {
                      ...editingResultReport.semesters,
                      [selectedSemesterTab]: {
                        ...currentSemData,
                        sgpa,
                        status,
                      },
                    };
                    const updatedCgpa = calculateCgpa(updatedSemesters);

                    const finalReport: StudentResultReport = {
                      ...editingResultReport,
                      cgpa: updatedCgpa,
                      semesters: updatedSemesters,
                    };

                    saveStudentResult(finalReport);
                    setEditingResultReport(null);
                  }}
                  className="p-6 space-y-5 text-xs"
                >
                  <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                    <div>
                      <span className="text-[11px] font-bold text-purple-700 uppercase block">Auto-Calculated CGPA</span>
                      <span className="text-xl font-black text-purple-900">{calculateCgpa(editingResultReport.semesters).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{selectedSemesterTab} SGPA</span>
                      <span className="text-xl font-black text-slate-900">{calculateSgpa(currentSemData.grades).sgpa.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Subject Grade Entries ({selectedSemesterTab})</h4>
                    <div className="space-y-3">
                      {currentSemData.grades.map((g, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Subject Name</label>
                              <input
                                type="text"
                                value={g.courseName}
                                onChange={(e) => {
                                  const updatedGrades = [...currentSemData.grades];
                                  updatedGrades[idx].courseName = e.target.value;
                                  setEditingResultReport({
                                    ...editingResultReport,
                                    semesters: {
                                      ...editingResultReport.semesters,
                                      [selectedSemesterTab]: { ...currentSemData, grades: updatedGrades },
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Course Code</label>
                              <input
                                type="text"
                                value={g.courseCode}
                                onChange={(e) => {
                                  const updatedGrades = [...currentSemData.grades];
                                  updatedGrades[idx].courseCode = e.target.value;
                                  setEditingResultReport({
                                    ...editingResultReport,
                                    semesters: {
                                      ...editingResultReport.semesters,
                                      [selectedSemesterTab]: { ...currentSemData, grades: updatedGrades },
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Grade Letter</label>
                              <input
                                type="text"
                                value={g.gradeLetter}
                                onChange={(e) => {
                                  const updatedGrades = [...currentSemData.grades];
                                  updatedGrades[idx].gradeLetter = e.target.value;
                                  setEditingResultReport({
                                    ...editingResultReport,
                                    semesters: {
                                      ...editingResultReport.semesters,
                                      [selectedSemesterTab]: { ...currentSemData, grades: updatedGrades },
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Percentage (%)</label>
                              <input
                                type="number"
                                value={g.percentage}
                                onChange={(e) => {
                                  const updatedGrades = [...currentSemData.grades];
                                  updatedGrades[idx].percentage = parseInt(e.target.value) || 0;
                                  setEditingResultReport({
                                    ...editingResultReport,
                                    semesters: {
                                      ...editingResultReport.semesters,
                                      [selectedSemesterTab]: { ...currentSemData, grades: updatedGrades },
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">GPA Point</label>
                              <input
                                type="number"
                                step="0.1"
                                value={g.gpaPoint}
                                onChange={(e) => {
                                  const updatedGrades = [...currentSemData.grades];
                                  updatedGrades[idx].gpaPoint = parseFloat(e.target.value) || 0;
                                  setEditingResultReport({
                                    ...editingResultReport,
                                    semesters: {
                                      ...editingResultReport.semesters,
                                      [selectedSemesterTab]: { ...currentSemData, grades: updatedGrades },
                                    },
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setEditingResultReport(null)} className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Auto-Calculate SGPA/CGPA & Save
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* Template Preview & Download Modal */}
      {activeTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveTemplateModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white relative">
              <button
                onClick={() => setActiveTemplateModal(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-amber-400">Master Template Preview & Download</span>
              <h3 className="text-xl font-bold mt-1">
                {activeTemplateModal === 'results' ? '📄 Overall Academic Results PDF Template' : '🎫 Master Hall Tickets PDF Template'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Review and copy the official template format to prepare PDF documents for upload.
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto border border-slate-700 whitespace-pre-wrap">
                {activeTemplateModal === 'results'
                  ? `=====================================================================
INSTITUTIONAL MASTER ACADEMIC RESULT PUBLICATION MASTER PDF TEMPLATE
=====================================================================
Academic Year: 2024 - 2028 | Semester: Semester 5

STUDENT ENTRY #1:
---------------------------------------------------------------------
Student Name: Murat Gürsoy
Roll Number: 2024-418
Department: Computer Science & Engineering
Semester: Semester 5

SUBJECT MARKS BREAKDOWN:
1. AP Calculus BC (MATH-401) - 4 Credits - Grade: A (96%) - GPA: 4.0 - Remarks: High proficiency
2. Classical Physics (PHYS-302) - 4 Credits - Grade: A- (92%) - GPA: 3.7 - Remarks: Good analytical skills
3. Advanced CS (CS-205) - 3 Credits - Grade: A+ (98%) - GPA: 4.0 - Remarks: Excellent project work

---------------------------------------------------------------------
STUDENT ENTRY #2:
---------------------------------------------------------------------
Student Name: Emma Watson
Roll Number: 2024-419
Department: Computer Science & Engineering
Semester: Semester 5

SUBJECT MARKS BREAKDOWN:
1. AP Calculus BC (MATH-401) - 4 Credits - Grade: A+ (98%) - GPA: 4.0 - Remarks: Outstanding performance
2. Classical Physics (PHYS-302) - 4 Credits - Grade: A (95%) - GPA: 4.0 - Remarks: Excellent lab execution
3. Advanced CS (CS-205) - 3 Credits - Grade: A (94%) - GPA: 4.0 - Remarks: Great algorithm design
=====================================================================`
                  : `=================================================================================
OFFICIAL AUTONOMOUS ACADEMIC INSTITUTION
CENTRAL EXAMINATION WING — MAIN ACADEMIC CAMPUS
Affiliated to State Technological University | Reaccredited with 'A++' Grade
FIFTH SEMESTER DEGREE EXTERNAL EXAMINATION (CBCSS-UG)
=================================================================================

HALL TICKET MASTER REGISTRATION ENTRY #1:
---------------------------------------------------------------------------------
Register Number / Roll No: REG-2024-141
Programme: B.Com (Self Financing)
Semester: V (Fifth Semester)
Name of Candidate: AMRITHA HARIDASAN
Date of Birth: 11/05/2004
Exam Center: Main Examination Complex (Block A)
Seat Number: Seat A-14
Scheduled Window: Nov 15 - Nov 28, 2024

SUBJECT SCHEDULE:
1. CC19UPSY5D01 | Psychology and Personal Growth
2. CC19UBCM5B07 | Accounting for Management
3. CC19UBCM5B08 | Business Research Methods
4. CC19UBCM5B09 | Income Tax Law and Accounts
5. CC19UBCM5B10 | Financial Markets and Services
6. CC19UBCM5B11 | Financial Management
=================================================================================`}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const text = activeTemplateModal === 'results'
                      ? `=====================================================================\nINSTITUTIONAL MASTER ACADEMIC RESULT PUBLICATION MASTER PDF TEMPLATE\n=====================================================================\nAcademic Year: 2024 - 2028 | Semester: Semester 5\n\nSTUDENT ENTRY #1:\n---------------------------------------------------------------------\nStudent Name: Murat Gürsoy\nRoll Number: 2024-418\nDepartment: Computer Science & Engineering\nSemester: Semester 5\n\nSUBJECT MARKS BREAKDOWN:\n1. AP Calculus BC (MATH-401) - 4 Credits - Grade: A (96%) - GPA: 4.0\n2. Classical Physics (PHYS-302) - 4 Credits - Grade: A- (92%) - GPA: 3.7\n3. Advanced CS (CS-205) - 3 Credits - Grade: A+ (98%) - GPA: 4.0\n=====================================================================`
                      : `=================================================================================\nOFFICIAL AUTONOMOUS ACADEMIC INSTITUTION\n=================================================================================\nRegister Number / Roll No: REG-2024-141\nProgramme: B.Com (Self Financing)\nSemester: V (Fifth Semester)\nName of Candidate: AMRITHA HARIDASAN\nDate of Birth: 11/05/2004\nExam Center: Main Examination Complex (Block A)\nSeat Number: Seat A-14\nScheduled Window: Nov 15 - Nov 28, 2024\n=================================================================================`;
                    navigator.clipboard.writeText(text);
                    showToast('Template Copied', 'Template content copied to clipboard!', 'success');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  📋 Copy Text
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTemplateModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publication Academic Year Prompt Modal */}
      {publishYearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPublishYearModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white relative">
              <button
                onClick={() => setPublishYearModal(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-amber-100">Publication Session Control</span>
              <h3 className="text-xl font-bold mt-1">Select Target Semester to Publish</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Target: {publishYearModal === 'results' ? 'Overall Semester Results' : 'Master Hall Tickets'}
              </p>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-2">Select Target Semester (1 – 8) *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setTargetPublishSem(sem)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetPublishSem === sem
                          ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sem.replace('Semester ', 'Sem ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishYearModal(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mode = publishYearModal;
                    setPublishYearModal(null);
                    showToast('Session Confirmed', `Publishing ${mode} for ${targetPublishYear} (${targetPublishSem}). Select PDF...`, 'info');
                    if (mode === 'results') {
                      pdfResultsInputRef.current?.click();
                    } else {
                      pdfHallTicketInputRef.current?.click();
                    }
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileUp className="w-4 h-4" /> Confirm & Upload PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student & Teacher Registration Template Preview Modal (Preview Only) */}
      {activeRegTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveRegTemplateModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white relative">
              <button
                onClick={() => setActiveRegTemplateModal(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-emerald-400">Institutional Registration Format</span>
              <h3 className="text-xl font-bold mt-1">
                {activeRegTemplateModal === 'student' ? '🎓 Student Registration PDF Template Preview' : '👨‍🏫 Teacher Registration PDF Template Preview'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Preview the exact key-value details required in the PDF for automatic registration parsing.
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto border border-slate-700 whitespace-pre-wrap">
                {activeRegTemplateModal === 'student'
                  ? `=====================================================================
INSTITUTIONAL STUDENT REGISTRATION MASTER TEMPLATE
=====================================================================
Name: Alex Rivera
Roll Number: 2024-425
Email: alex.rivera@university.edu
Department: Computer Science & Engineering
Semester: Semester 5
Academic Year: 2024 - 2028
Grade / Section: Section A
Phone: +1 555-019-2834
Guardian Name: Maria Rivera
Guardian Phone: +1 555-019-2835
Blood Group: O+
Residence Type: Day Scholar
Hostel Name: N/A
Room Number: N/A
Bus Route: Route 4 - Central Campus
Bus Number: BUS-12
Bus Stop: North Gate Stop
Mentor Name: Dr. Sarah Jenkins
=====================================================================`
                  : `=====================================================================
INSTITUTIONAL FACULTY / TEACHER REGISTRATION MASTER TEMPLATE
=====================================================================
Name: Dr. Sarah Jenkins
Employee ID: EMP-104
Email: sarah.jenkins@university.edu
Department: Computer Science & Engineering
Title: Associate Professor
Office Hours: Mon, Wed, Fri 10:00 AM - 12:00 PM
Phone: +1 555-018-9922
Subjects Taught: MATH-401, PHYS-302, CS-205
=====================================================================`}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const text = activeRegTemplateModal === 'student'
                      ? `=====================================================================\nINSTITUTIONAL STUDENT REGISTRATION MASTER TEMPLATE\n=====================================================================\nName: Alex Rivera\nRoll Number: 2024-425\nEmail: alex.rivera@university.edu\nDepartment: Computer Science & Engineering\nSemester: Semester 5\nAcademic Year: 2024 - 2028\nGrade / Section: Section A\nPhone: +1 555-019-2834\nGuardian Name: Maria Rivera\nGuardian Phone: +1 555-019-2835\nBlood Group: O+\nResidence Type: Day Scholar\nMentor Name: Dr. Sarah Jenkins\n=====================================================================`
                      : `=====================================================================\nINSTITUTIONAL FACULTY / TEACHER REGISTRATION MASTER TEMPLATE\n=====================================================================\nName: Dr. Sarah Jenkins\nEmployee ID: EMP-104\nEmail: sarah.jenkins@university.edu\nDepartment: Computer Science & Engineering\nTitle: Associate Professor\nOffice Hours: Mon, Wed, Fri 10:00 AM - 12:00 PM\nPhone: +1 555-018-9922\nSubjects Taught: MATH-401, PHYS-302, CS-205\n=====================================================================`;
                    navigator.clipboard.writeText(text);
                    showToast('Template Copied', 'Registration format copied to clipboard!', 'success');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  📋 Copy Template Text
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRegTemplateModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal In-Browser PDF Document Viewer Modal */}
      {activePdfViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setActivePdfViewer(null)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-300 max-w-3xl w-full my-8 overflow-hidden print:m-0 print:shadow-none print:w-full print:max-w-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Universal PDF Document Viewer</span>
                <h3 className="text-sm font-extrabold text-white">{activePdfViewer.title}</h3>
                {activePdfViewer.fileName && <p className="text-[10px] text-slate-400 font-mono">File: {activePdfViewer.fileName}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activePdfViewer.content);
                    showToast('Copied', 'PDF text content copied to clipboard!', 'success');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  📋 Copy Text
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setActivePdfViewer(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Canvas */}
            <div className="p-8 space-y-4 font-mono text-xs text-slate-900 bg-white leading-relaxed">
              <div className="p-6 bg-slate-50 border-2 border-slate-300 rounded-2xl whitespace-pre-wrap max-h-[70vh] overflow-y-auto shadow-inner text-[11px]">
                {activePdfViewer.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      <PostAnnouncementModal isOpen={annModalOpen} onClose={() => setAnnModalOpen(false)} />
    </div>
  );
};
