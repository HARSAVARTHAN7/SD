import React, { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { StorageService, DEFAULT_TIMETABLE } from '../../services/storage';
import { User, TimetableSlot, Course } from '../../types';
import { StudentDashboard } from '../student/StudentDashboard';
import { TeacherDashboard } from '../teacher/TeacherDashboard';
import { PostAnnouncementModal } from '../teacher/PostAnnouncementModal';

interface AdminDashboardProps {
  currentTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const {
    courses,
    announcements,
    deleteAnnouncement,
    allUsers,
    showToast,
  } = useApp();

  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'admin' | 'student-preview' | 'teacher-preview'>('admin');
  const [previewTab, setPreviewTab] = useState<string>('overview');

  // Timetable State
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(() => StorageService.getTimetable());
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [newSlotModalOpen, setNewSlotModalOpen] = useState(false);

  // New slot form
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const students = allUsers.filter((u) => u.role === 'student');
  const teachers = allUsers.filter((u) => u.role === 'teacher');

  // Handle Mentor Assignment
  const handleSaveMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;

    const teacher = teachers.find((t) => t.id === selectedMentorId);
    if (!teacher) {
      showToast('Select Mentor', 'Please select a valid faculty mentor', 'warning');
      return;
    }

    StorageService.assignMentorToStudent(
      assigningStudent.id,
      teacher.employeeId || teacher.id,
      teacher.name,
      teacher.phone || '+1 (555) 782-9912'
    );

    showToast('Mentor Assigned', `${assigningStudent.name} is now mentored by ${teacher.name}`, 'success');
    setAssigningStudent(null);
  };

  // Handle Timetable Save
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
    setSlotSubject('');
    setSlotTeacher('');
    setSlotRoom('');
    setSlotStartTime('');
    setSlotEndTime('');
    showToast('Slot Added', `Added ${created.subject} to ${selectedDay} timetable.`, 'success');
  };

  const handleDeleteSlot = (id: string) => {
    StorageService.deleteTimetableSlot(id);
    setTimetableSlots(StorageService.getTimetable());
    showToast('Slot Removed', 'Timetable slot deleted.', 'info');
  };

  // Handle Accommodation Save
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

  // If Admin chose to live inspect Student or Teacher view
  if (activeSubView === 'student-preview') {
    return (
      <div className="space-y-6">
        {/* Banner with button to return to Admin view */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Live Student View
            </span>
            <p className="text-xs text-slate-300">
              Viewing as Murat Gürsoy (5th Semester • CS Department)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              {['overview', 'notices', 'courses', 'grades', 'attendance', 'timetable'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    previewTab === tab ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveSubView('admin')}
              className="px-4 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-extrabold hover:bg-slate-100 cursor-pointer shadow-md"
            >
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
            <p className="text-xs text-purple-200">
              Viewing as Dr. Sarah Jenkins (Faculty Chair & Mentor)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-purple-900 p-1 rounded-xl">
              {['overview', 'timetable', 'attendance', 'courses', 'roster', 'announcements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    previewTab === tab ? 'bg-purple-500 text-white' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveSubView('admin')}
              className="px-4 py-1.5 bg-white text-purple-950 rounded-xl text-xs font-extrabold hover:bg-slate-100 cursor-pointer shadow-md"
            >
              ← Return to Admin
            </button>
          </div>
        </div>

        <TeacherDashboard currentTab={previewTab} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ================= TAB 1: ADMIN OVERVIEW & QUICK PORTALS ================= */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Master Admin Hero Banner */}
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
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Welcome, Administrator 🏛️
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Central Academic Administration • Authorized Master Authority
                  </p>
                </div>
              </div>

              {/* Portal Quick Switch Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setPreviewTab('overview');
                    setActiveSubView('student-preview');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Student Portal</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewTab('overview');
                    setActiveSubView('teacher-preview');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Teacher Portal</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{students.length} Active Students</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Semester 5 • 100% Retained</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Staff</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{teachers.length} Professors</p>
              <p className="text-xs text-purple-600 font-semibold mt-1">Active Mentors & Chairs</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Courses</span>
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{courses.length} Subject Modules</p>
              <p className="text-xs text-sky-600 font-semibold mt-1">AP Calculus, CS, Physics</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timetable Slots</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-800 mt-3">{timetableSlots.length} Weekly Sessions</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">Mon - Sat Master Schedule</p>
            </div>
          </div>

          {/* Quick Mentorship & Accommodation Assignment Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Student Mentorship & Accommodation Control</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign faculty mentors and manage student transportation/hostel allocations.</p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {students
                .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId?.includes(searchQuery))
                .map((st) => (
                  <div
                    key={st.id}
                    className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <img src={st.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{st.name}</h4>
                            <p className="text-xs font-mono font-semibold text-emerald-700">{st.studentId || st.rollNo}</p>
                            <p className="text-[11px] text-slate-400">{st.department || 'Computer Science'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-purple-700 font-semibold flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Mentor:
                          </span>
                          <span className="font-bold text-slate-800">{st.mentorName || 'Dr. Sarah Jenkins'}</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                            {st.residenceType === 'Day Scholar' ? <Bus className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                            {st.residenceType || 'Day Scholar'}:
                          </span>
                          <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                            {st.residenceType === 'Day Scholar' ? st.busRoute || 'Route #14' : st.hostelName || 'Residence B'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setAssigningStudent(st);
                          const currentT = teachers.find((t) => t.name === st.mentorName);
                          setSelectedMentorId(currentT ? currentT.id : teachers[0]?.id || '');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <UserCheck className="w-3 h-3" /> Change Mentor
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudentAcc(st);
                          setResidenceType(st.residenceType || 'Day Scholar');
                          setBusRoute(st.busRoute || 'Route #14 - North City Express');
                          setBusNumber(st.busNumber || 'BUS-042');
                          setBusStop(st.busStop || 'Central Square Stop');
                          setHostelName(st.hostelName || 'Emerald Heights Residence Block-B');
                          setRoomNumber(st.roomNumber || 'Room 304-B');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Edit Accommodation"
                      >
                        <Edit className="w-3 h-3" /> Accommodation
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MENTOR ALLOCATION HUB ================= */}
      {currentTab === 'mentors' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Faculty Mentor Allocation Center</h2>
              <p className="text-xs text-slate-500 mt-1">Assign and reallocate students to departmental faculty mentors with instant synchronization.</p>
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
                          {st.mentorName || 'Dr. Sarah Jenkins'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{st.mentorPhone || '+1 (555) 782-9912'}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setAssigningStudent(st);
                            const currentT = teachers.find((t) => t.name === st.mentorName);
                            setSelectedMentorId(currentT ? currentT.id : teachers[0]?.id || '');
                          }}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
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

      {/* ================= TAB 3: MASTER TIMETABLE MANAGER (MON-SAT) ================= */}
      {currentTab === 'timetable' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Master Timetable Manager (Mon - Sat)</h2>
              <p className="text-xs text-slate-500 mt-1">Configure weekly lectures, lab periods, and tutorial sessions for all classes.</p>
            </div>

            <button
              onClick={() => setNewSlotModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Timetable Slot
            </button>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-x-auto">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Timetable slots for selected day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {timetableSlots.filter((t) => t.day === selectedDay).map((slot) => (
              <div
                key={slot.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono">
                      {slot.room}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {slot.startTime} {slot.endTime && `- ${slot.endTime}`}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{slot.subject}</h3>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {slot.teacher}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Standard Slot</span>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Timetable Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: STUDENT & FACULTY DIRECTORY ================= */}
      {currentTab === 'directory' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Master Institutional Directory</h2>
            <p className="text-xs text-slate-500 mt-1">Complete profiles of registered students, faculty chairs, and staff.</p>
          </div>

          {/* Faculty Members Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" /> Faculty Staff & Mentors ({teachers.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Professor Name</th>
                    <th className="py-3.5 px-4">Employee ID</th>
                    <th className="py-3.5 px-4">Department & Role</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-6">Teaching Subjects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={tc.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-slate-800">{tc.name}</p>
                            <p className="text-[10px] text-slate-400">{tc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-600">{tc.employeeId || 'FAC-7742'}</td>
                      <td className="py-4 px-4 text-slate-700">{tc.title || 'Department Faculty'}</td>
                      <td className="py-4 px-4 text-slate-600">{tc.phone || '+1 (555) 782-9912'}</td>
                      <td className="py-4 px-6 text-slate-600">
                        {tc.subjectsTaught?.join(', ') || 'AP Calculus BC, Classical Mechanics'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: CAMPUS NOTICE BROADCASTER ================= */}
      {currentTab === 'notices' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Campus Notice Broadcaster</h2>
              <p className="text-xs text-slate-500 mt-1">Publish institutional circulars and broadcasts visible across all student and teacher dashboards.</p>
            </div>

            <button
              onClick={() => setAnnModalOpen(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-amber-400" /> Broadcast Campus Circular
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
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                      {ann.targetCourse || 'All Campus'}
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
                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl bg-slate-50 p-4 rounded-2xl border border-slate-100">{ann.content}</p>

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

      {/* ================= MODAL: ASSIGN MENTOR ================= */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative">
              <button
                onClick={() => setAssigningStudent(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-purple-200">Admin Mentorship Hub</span>
              <h3 className="text-xl font-bold mt-1">Assign Faculty Mentor</h3>
              <p className="text-xs text-purple-100 mt-0.5">Student: {assigningStudent.name} ({assigningStudent.studentId || assigningStudent.rollNo})</p>
            </div>

            <form onSubmit={handleSaveMentor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Faculty Mentor
                </label>
                <div className="space-y-2">
                  {teachers.map((tc) => (
                    <label
                      key={tc.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedMentorId === tc.id
                          ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="mentor"
                          checked={selectedMentorId === tc.id}
                          onChange={() => setSelectedMentorId(tc.id)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <img src={tc.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{tc.name}</p>
                          <p className="text-[10px] text-slate-400">{tc.title || 'Department Chair'}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-purple-700 font-semibold">{tc.employeeId || 'FAC-7742'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Mentor Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT ACCOMMODATION ================= */}
      {editingStudentAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white relative">
              <button
                onClick={() => setEditingStudentAcc(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-amber-400">Institutional Accommodation Control</span>
              <h3 className="text-xl font-bold mt-1">Manage {editingStudentAcc.name}'s Residence</h3>
            </div>

            <form onSubmit={handleSaveAccommodation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Accommodation Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResidenceType('Day Scholar')}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      residenceType === 'Day Scholar'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Bus className="w-4 h-4" /> Day Scholar
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidenceType('Hosteler')}
                    className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      residenceType === 'Hosteler'
                        ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Hosteler
                  </button>
                </div>
              </div>

              {residenceType === 'Day Scholar' ? (
                <div className="space-y-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Bus Route Name</label>
                    <input
                      type="text"
                      required
                      value={busRoute}
                      onChange={(e) => setBusRoute(e.target.value)}
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
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                        placeholder="e.g. BUS-042"
                        className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800 uppercase mb-1">Boarding Stop</label>
                      <input
                        type="text"
                        required
                        value={busStop}
                        onChange={(e) => setBusStop(e.target.value)}
                        placeholder="e.g. Central Square Stop"
                        className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-teal-50/60 rounded-2xl border border-teal-200">
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Hostel Name / Residence Block</label>
                    <input
                      type="text"
                      required
                      value={hostelName}
                      onChange={(e) => setHostelName(e.target.value)}
                      placeholder="e.g. Emerald Heights Residence (Block B)"
                      className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-teal-800 uppercase mb-1">Room Number</label>
                    <input
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. Room 304-B"
                      className="w-full px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStudentAcc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD TIMETABLE SLOT ================= */}
      {newSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-slate-900 text-white relative">
              <button
                onClick={() => setNewSlotModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs uppercase font-bold text-amber-400">Timetable Scheduler</span>
              <h3 className="text-xl font-bold mt-1">Add Slot for {selectedDay}</h3>
            </div>

            <form onSubmit={handleAddSlot} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={slotSubject}
                  onChange={(e) => setSlotSubject(e.target.value)}
                  placeholder="e.g. AP Calculus BC"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Faculty Instructor</label>
                <input
                  type="text"
                  required
                  value={slotTeacher}
                  onChange={(e) => setSlotTeacher(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    placeholder="10:15 AM"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Classroom / Laboratory</label>
                <input
                  type="text"
                  required
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder="e.g. Room 304 (Math Hall)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      <PostAnnouncementModal
        isOpen={annModalOpen}
        onClose={() => setAnnModalOpen(false)}
      />
    </div>
  );
};
