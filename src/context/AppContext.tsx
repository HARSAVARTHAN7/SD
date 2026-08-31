import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Course,
  AttendanceRecord,
  Announcement,
  AppNotification,
  User,
  ChangeRequest,
  StudentResultReport,
} from '../types';
import {
  CourseAPI,
  AttendanceAPI,
  AnnouncementAPI,
  NotificationAPI,
  UserAPI,
  ChangeRequestAPI,
  ResultAPI,
  TimetableAPI,
} from '../services/apiService';
import type { TimetableSlot } from '../types';
import { useAuth } from './AuthContext';
import { generateTeacherEmailAndName, formatTeacherName } from '../utils/teacherUtils';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  courses: Course[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  notifications: AppNotification[];
  allUsers: User[];
  changeRequests: ChangeRequest[];
  studentResults: StudentResultReport[];
  timetable: TimetableSlot[];
  toasts: Toast[];
  isDataLoading: boolean;

  // Actions
  showToast: (title: string, message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  takeAttendance: (
    date: string,
    courseId: string,
    records: Array<{ studentId: string; studentName: string; studentRoll: string; status: 'present' | 'absent' | 'late' | 'excused' }>,
  ) => Promise<void>;
  postAnnouncement: (data: { title: string; content: string; priority?: string; targetCourse?: string; authorId?: string; authorName?: string; authorRole?: string; authorAvatar?: string }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  clearNotifs: () => Promise<void>;
  addNotification: (notifData: Partial<AppNotification>) => Promise<void>;
  // User CRUD
  addUser: (user: Partial<User> & { password?: string }) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  assignMentor: (studentId: string, mentorData: { mentorId: string; mentorName: string; mentorPhone: string }) => Promise<void>;
  
  deletedUsers: Array<User & { deletedAt?: string }>;
  restoreUser: (id: string) => void;
  permanentlyDeleteUser: (id: string) => void;
  // Recycle Bin Data & Restorations
  deletedCourses: Array<Course & { deletedAt?: string }>;
  restoreCourse: (id: string) => void;
  deletedAnnouncements: Array<Announcement & { deletedAt?: string }>;
  restoreAnnouncement: (id: string) => void;
  deletedResults: Array<StudentResultReport & { deletedAt?: string }>;
  restoreResult: (id: string) => void;
  // Change requests
  submitChangeRequest: (req: Omit<ChangeRequest, 'id'>) => Promise<void>;
  resolveChangeRequest: (id: string) => Promise<void>;
  deleteChangeRequest: (id: string) => Promise<void>;
  // Results
  saveStudentResult: (report: Partial<StudentResultReport>) => Promise<void>;
  deleteStudentResult: (id: string) => Promise<void>;
  // Timetable
  addTimetableSlot: (slot: Partial<TimetableSlot>) => Promise<void>;
  updateTimetableSlot: (id: string, data: Partial<TimetableSlot>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  // Refresh
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_DEFAULT_USERS: User[] = [
  {
    id: 'admin-root',
    username: 'admin',
    email: 'admin@bitsathy.ac.in',
    password: 'admin@1234',
    name: 'Institutional Administrator',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 (04295) 226000',
    joinedDate: 'Jan 2018',
    department: 'Central Academic Administration',
    title: 'Chief Institutional Administrator',
    employeeId: 'ADM-BIT-01',
    isBlocked: false,
    status: 'active',
  },
  {
    id: 'student-ram',
    username: 'ram.cs23',
    email: 'ram.cs23@bitsathy.ac.in',
    password: 'password123',
    name: 'Ram',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '+91 (04295) 226010',
    joinedDate: 'Sep 2023',
    studentId: 'STU-2023-123',
    rollNo: '2023-123',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    gpa: 3.88,
    attendanceRate: 100.0,
    isBlocked: false,
    status: 'active',
  },
  {
    id: 'student-demo',
    username: 'student',
    email: 'student@bitsathy.ac.in',
    password: 'password123',
    name: 'BIT Sathy Student',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '+91 (04295) 226001',
    joinedDate: 'Sep 2024',
    studentId: 'STU-2024-001',
    rollNo: '2024-001',
    semester: 'Semester 5',
    department: 'Computer Science & Engineering',
    gpa: 3.90,
    attendanceRate: 100.0,
    isBlocked: false,
    status: 'active',
  },
  {
    id: 'teacher-priya',
    username: 'priya.sharma',
    email: 'priya.sharma@bitsathy.ac.in',
    password: 'password123',
    name: 'Dr. Priya Sharma',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Aug 2020',
    department: 'Department of Computer Science',
    title: 'Professor & Department Chair',
    employeeId: 'FAC-8989',
    attendanceRate: 100.0,
    isBlocked: false,
    status: 'active',
  },
  {
    id: 'teacher-sarah',
    username: 'sarah.jenkins',
    email: 'sarah.jenkins@bitsathy.ac.in',
    password: 'password123',
    name: 'Dr. Sarah Jenkins',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Aug 2019',
    department: 'Department of Computer Science & Mathematics',
    title: 'Senior Professor',
    employeeId: 'FAC-7742',
    attendanceRate: 100.0,
    isBlocked: false,
    status: 'active',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<Array<User & { deletedAt?: string }>>(() => {
    try {
      const saved = localStorage.getItem('eduportal_deleted_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const ramUser = INITIAL_DEFAULT_USERS.find((u) => u.id === 'student-ram');
    return ramUser ? [{ ...ramUser, deletedAt: 'Recently' }] : [];
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('eduportal_all_users');
      const savedDeleted = localStorage.getItem('eduportal_deleted_users');
      const deletedList: User[] = savedDeleted
        ? JSON.parse(savedDeleted)
        : [INITIAL_DEFAULT_USERS.find((u) => u.id === 'student-ram')].filter(Boolean) as User[];

      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (u) => !deletedList.some((du) => du && (du.id === u.id || du.email === u.email || du.username === u.username)),
          );
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved users:', e);
    }
    return INITIAL_DEFAULT_USERS.filter((u) => u.id !== 'student-ram');
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResultReport[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);

  useEffect(() => {
    if (allUsers.length > 0) {
      try {
        localStorage.setItem('eduportal_all_users', JSON.stringify(allUsers));
      } catch (e) {
        console.warn('Failed to save allUsers to localStorage:', e);
      }
    }
  }, [allUsers]);

  const [deletedCourses, setDeletedCourses] = useState<Array<Course & { deletedAt?: string }>>(() => {
    try {
      const saved = localStorage.getItem('eduportal_deleted_courses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedAnnouncements, setDeletedAnnouncements] = useState<Array<Announcement & { deletedAt?: string }>>(() => {
    try {
      const saved = localStorage.getItem('eduportal_deleted_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedResults, setDeletedResults] = useState<Array<StudentResultReport & { deletedAt?: string }>>(() => {
    try {
      const saved = localStorage.getItem('eduportal_deleted_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eduportal_deleted_users', JSON.stringify(deletedUsers));
    } catch (e) {
      console.warn('Failed to save deletedUsers:', e);
    }
  }, [deletedUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('eduportal_deleted_courses', JSON.stringify(deletedCourses));
    } catch (e) {
      console.warn('Failed to save deletedCourses:', e);
    }
  }, [deletedCourses]);

  useEffect(() => {
    try {
      localStorage.setItem('eduportal_deleted_announcements', JSON.stringify(deletedAnnouncements));
    } catch (e) {
      console.warn('Failed to save deletedAnnouncements:', e);
    }
  }, [deletedAnnouncements]);

  useEffect(() => {
    try {
      localStorage.setItem('eduportal_deleted_results', JSON.stringify(deletedResults));
    } catch (e) {
      console.warn('Failed to save deletedResults:', e);
    }
  }, [deletedResults]);

  // Auto-recover soft-deleted default users (e.g. ram.cs23) into deletedUsers if missing from both lists
  useEffect(() => {
    try {
      const purgedRaw = localStorage.getItem('eduportal_purged_users');
      const purgedIds: string[] = purgedRaw ? JSON.parse(purgedRaw) : [];

      const missingDeleted = INITIAL_DEFAULT_USERS.filter(
        (defaultUser) =>
          !allUsers.some((u) => u.id === defaultUser.id || u.email === defaultUser.email) &&
          !deletedUsers.some((du) => du.id === defaultUser.id || du.email === defaultUser.email) &&
          !purgedIds.includes(defaultUser.id),
      );

      if (missingDeleted.length > 0) {
        setDeletedUsers((prev) => [
          ...missingDeleted.map((u) => ({
            ...u,
            deletedAt: 'Recently',
          })),
          ...prev,
        ]);
      }
    } catch (e) {
      console.warn('Error syncing missing deleted users:', e);
    }
  }, [allUsers, deletedUsers]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // ─── Toast Helpers ──────────────────────────────────
  const showToast = (title: string, message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Data Fetching ──────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);

    try {
      // Fetch data in parallel based on role
      const promises: Promise<void>[] = [];

      // Everyone gets courses, announcements, timetable, notifications
      promises.push(
        CourseAPI.getAll().then(({ data }) => setCourses(data.data)),
        AnnouncementAPI.getAll({ limit: 50 }).then(({ data }) => setAnnouncements(data.data)),
        TimetableAPI.getAll().then(({ data }) => setTimetable(data.data)),
        NotificationAPI.getAll({ roleTarget: role || undefined }).then(({ data }) => setNotifications(data.data)),
      );

      // Attendance
      promises.push(
        AttendanceAPI.getAll({ limit: 200 }).then(({ data }) => setAttendance(data.data)),
      );

      // Admin/teacher get users, change requests, results
      if (role === 'admin' || role === 'teacher') {
        promises.push(
          UserAPI.getAll({ limit: 200 })
            .then(({ data }) => {
              if (data && data.data && data.data.length > 0) {
                setAllUsers((prev) => {
                  return data.data
                    .filter((serverUser) => !deletedUsers.some((du) => du.id === serverUser.id || du.email === serverUser.email))
                    .map((serverUser) => {
                      const localMatch = prev.find(
                        (u) =>
                          u.id === serverUser.id ||
                          (u as unknown as { _id: string })._id === serverUser.id ||
                          u.email === serverUser.email,
                      );
                      if (localMatch) {
                        return {
                          ...serverUser,
                          isBlocked: localMatch.isBlocked !== undefined ? localMatch.isBlocked : serverUser.isBlocked,
                          status: localMatch.status || serverUser.status,
                          password: localMatch.password || serverUser.password,
                        };
                      }
                      return serverUser;
                    });
                });
              }
            })
            .catch(() => {
              console.warn('UserAPI.getAll failed or offline; keeping existing user list.');
            }),
          ResultAPI.getAll().then(({ data }) => setStudentResults(data.data)).catch(() => {}),
        );
      }

      if (role === 'admin' || role === 'teacher') {
        promises.push(
          ChangeRequestAPI.getAll().then(({ data }) => setChangeRequests(data.data)),
        );
      }

      // Students get their own results
      if (role === 'student') {
        promises.push(
          ResultAPI.getAll({ studentId: user.id }).then(({ data }) => setStudentResults(data.data)),
        );
      }

      await Promise.allSettled(promises);
    } catch (err) {
      console.error('Data refresh failed:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      // Reset non-persistent data on logout, keep allUsers persisted in localStorage!
      setCourses([]);
      setAttendance([]);
      setAnnouncements([]);
      setNotifications([]);
      setChangeRequests([]);
      setStudentResults([]);
      setTimetable([]);
    }
  }, [user, refreshData]);

  // ─── Attendance ─────────────────────────────────────
  const takeAttendance = async (
    date: string,
    courseId: string,
    records: Array<{ studentId: string; studentName: string; studentRoll: string; status: 'present' | 'absent' | 'late' | 'excused' }>,
  ) => {
    try {
      await AttendanceAPI.markBatch({ date, courseId, records });
      showToast('Attendance Saved!', `Daily roll call for ${date} has been updated.`, 'success');
      // Refresh attendance data
      const { data } = await AttendanceAPI.getAll({ limit: 200 });
      setAttendance(data.data);
    } catch (err) {
      showToast('Error', 'Failed to save attendance.', 'error');
      console.error(err);
    }
  };

  // ─── Announcements ─────────────────────────────────
  const postAnnouncement = async (annData: { title: string; content: string; priority?: string; targetCourse?: string; authorId?: string; authorName?: string; authorRole?: string; authorAvatar?: string }) => {
    try {
      const { data } = await AnnouncementAPI.create(annData);
      setAnnouncements((prev) => [data.data, ...prev]);
      showToast('Announcement Published!', 'Notice has been broadcasted to all students.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to publish announcement.', 'error');
      console.error(err);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const target = announcements.find((a) => a.id === id || a._id === id);
    if (target) {
      setDeletedAnnouncements((prev) => [
        { ...target, deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ...prev,
      ]);
    }

    try {
      await AnnouncementAPI.delete(id);
    } catch (err) {
      console.warn('Backend announcement delete error / offline.', err);
    }

    setAnnouncements((prev) => prev.filter((a) => a.id !== id && a._id !== id));
    showToast('Moved to Recycle Bin', 'Announcement moved to the Institutional Recycle Center.', 'info');
  };

  // ─── Notifications ─────────────────────────────────
  const markNotifRead = async (id: string) => {
    try {
      await NotificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n.id === id || n._id === id) ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const clearNotifs = async () => {
    try {
      await NotificationAPI.clearAll({ roleTarget: role || undefined });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const addNotification = async (notifData: Partial<AppNotification>) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: notifData.title || 'System Alert',
      message: notifData.message || '',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: notifData.type || 'urgent',
      roleTarget: notifData.roleTarget || 'all',
      ...notifData,
    } as AppNotification;

    try {
      await NotificationAPI.create(newNotif);
    } catch (err) {
      console.warn('Backend notification creation error / offline. Saving notification locally...', err);
    }

    setNotifications((prev) => [newNotif, ...prev]);
  };

  // ─── User CRUD ──────────────────────────────────────
  const addUser = async (userData: Partial<User> & { password?: string }) => {
    let payload = { ...userData };
    if (payload.role === 'teacher' && payload.name) {
      const generated = generateTeacherEmailAndName(payload.name, allUsers);
      payload.name = generated.name;
      payload.email = payload.email && payload.email.includes('@bitsathy.ac.in') ? payload.email : generated.email;
      payload.username = payload.username || generated.username;
    }

    let createdUser: User | null = null;
    try {
      const { data } = await UserAPI.create(payload);
      if (data && data.data) {
        createdUser = data.data;
      }
    } catch (err) {
      console.warn('Backend user creation error / offline. Creating user locally...', err);
    }

    if (!createdUser) {
      const timestamp = Date.now();
      createdUser = {
        id: payload.id || `user-${timestamp}-${Math.floor(Math.random() * 1000)}`,
        username: payload.username || (payload.email ? payload.email.split('@')[0] : `user_${timestamp}`),
        email: payload.email || '',
        password: payload.password || 'password123',
        name: payload.name || 'New Member',
        role: payload.role || 'student',
        avatar: payload.avatar || (payload.role === 'teacher'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : payload.role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'),
        joinedDate: payload.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        attendanceRate: payload.attendanceRate ?? 100.0,
        ...payload,
      } as User;
    }

    setAllUsers((prev) => [createdUser!, ...prev]);
    showToast('User Added', `${createdUser.name} has been registered successfully.`, 'success');
  };

  const updateUser = async (userData: User) => {
    const userId = userData.id || (userData as unknown as { _id: string })._id;
    let updated: User = { ...userData };

    try {
      const { data } = await UserAPI.update(userId, userData);
      if (data && data.data) {
        updated = {
          ...userData,
          ...data.data,
          password: userData.password || data.data.password,
          isBlocked: userData.isBlocked !== undefined ? userData.isBlocked : data.data.isBlocked,
          status: userData.status || data.data.status,
        };
      }
    } catch (err) {
      console.warn('Backend user update error / offline. Updating user locally...', err);
    }

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId || (u as unknown as { _id: string })._id === userId || (u.email && u.email === userData.email)
          ? { ...u, ...updated }
          : u,
      ),
    );
    const label = updated.isBlocked ? 'Account Blocked' : 'Account Updated';
    showToast(label, `${updated.name || 'User'}'s account details have been updated.`, updated.isBlocked ? 'warning' : 'success');
  };

  const deleteUser = async (id: string) => {
    const target = allUsers.find((u) => u.id === id || (u as unknown as { _id: string })._id === id);
    if (target) {
      setDeletedUsers((prev) => [
        { ...target, deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ...prev,
      ]);
    }

    try {
      await UserAPI.delete(id);
    } catch (err) {
      console.warn('Backend user delete error / offline. Removing user locally...', err);
    }

    setAllUsers((prev) => prev.filter((u) => u.id !== id && (u as unknown as { _id: string })._id !== id));
    showToast('Moved to Recycle Bin', `${target?.name || 'User'} has been moved to the Institutional Recycle Center.`, 'info');
  };

  const assignMentor = async (studentId: string, mentorData: { mentorId: string; mentorName: string; mentorPhone: string }) => {
    try {
      const { data } = await UserAPI.assignMentor(studentId, mentorData);
      if (data && data.data) {
        setAllUsers((prev) =>
          prev.map((u) => (u.id === studentId || (u as unknown as { _id: string })._id === studentId ? data.data : u)),
        );
      }
    } catch (err) {
      console.warn('Backend assign mentor error / offline. Assigning mentor locally...', err);
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === studentId || (u as unknown as { _id: string })._id === studentId
            ? { ...u, mentorId: mentorData.mentorId, mentorName: mentorData.mentorName, mentorPhone: mentorData.mentorPhone }
            : u,
        ),
      );
    }
    showToast('Mentor Assigned', `Mentor assigned: ${mentorData.mentorName}`, 'success');
  };

  const restoreUser = (id: string) => {
    const target = deletedUsers.find((u) => u.id === id || (u as unknown as { _id: string })._id === id);
    if (target) {
      const { deletedAt, ...cleanedUser } = target;
      setDeletedUsers((prev) => prev.filter((u) => u.id !== id && (u as unknown as { _id: string })._id !== id));
      setAllUsers((prev) => [cleanedUser as User, ...prev]);
      showToast('Restored Successfully', `${target.name}'s account has been restored to active users.`, 'success');
    }
  };

  const permanentlyDeleteUser = (id: string) => {
    const target = deletedUsers.find((u) => u.id === id || (u as unknown as { _id: string })._id === id);
    setDeletedUsers((prev) => prev.filter((u) => u.id !== id && (u as unknown as { _id: string })._id !== id));
    showToast('Permanently Deleted', `${target?.name || 'User'} account permanently purged.`, 'warning');
  };

  const restoreCourse = (id: string) => {
    const target = deletedCourses.find((c) => c.id === id || c._id === id);
    if (target) {
      const { deletedAt, ...cleanedCourse } = target;
      setDeletedCourses((prev) => prev.filter((c) => c.id !== id && c._id !== id));
      setCourses((prev) => [cleanedCourse as Course, ...prev]);
      showToast('Course Restored', `${target.title} restored to active course catalog.`, 'success');
    }
  };

  const restoreAnnouncement = (id: string) => {
    const target = deletedAnnouncements.find((a) => a.id === id || a._id === id);
    if (target) {
      const { deletedAt, ...cleanedAnn } = target;
      setDeletedAnnouncements((prev) => prev.filter((a) => a.id !== id && a._id !== id));
      setAnnouncements((prev) => [cleanedAnn as Announcement, ...prev]);
      showToast('Notice Restored', `"${target.title}" restored to the notice board.`, 'success');
    }
  };

  const restoreResult = (id: string) => {
    const target = deletedResults.find((r) => r.id === id || r._id === id);
    if (target) {
      const { deletedAt, ...cleanedResult } = target;
      setDeletedResults((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      setStudentResults((prev) => [cleanedResult as StudentResultReport, ...prev]);
      showToast('Result Restored', `Academic grade report for ${target.studentName} restored.`, 'success');
    };
  };

  // ─── Change Requests ───────────────────────────────
  const submitChangeRequest = async (req: Omit<ChangeRequest, 'id'>) => {
    try {
      const { data } = await ChangeRequestAPI.create(req);
      setChangeRequests((prev) => [data.data, ...prev]);
      showToast('Request Submitted', 'Your change request has been sent to the admin.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to submit change request.', 'error');
      console.error(err);
    }
  };

  const resolveChangeRequest = async (id: string) => {
    try {
      const { data } = await ChangeRequestAPI.resolve(id);
      setChangeRequests((prev) =>
        prev.map((r) => ((r.id === id || r._id === id) ? data.data : r)),
      );
      showToast('Resolved', 'Change request has been marked as resolved.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to resolve change request.', 'error');
      console.error(err);
    }
  };

  const deleteChangeRequest = async (id: string) => {
    try {
      await ChangeRequestAPI.delete(id);
      setChangeRequests((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      showToast('Dismissed', 'Change request removed.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete change request.', 'error');
      console.error(err);
    }
  };

  // ─── Results ────────────────────────────────────────
  const saveStudentResult = async (report: Partial<StudentResultReport>) => {
    try {
      const { data } = await ResultAPI.save(report);
      setStudentResults((prev) => {
        const idx = prev.findIndex(
          (r) => r.id === data.data.id || r._id === data.data._id ||
            (r.rollNo && r.rollNo === data.data.rollNo),
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = data.data;
          return updated;
        }
        return [data.data, ...prev];
      });
      showToast('Results Published', `Academic results published for ${report.studentName || 'student'}.`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to publish results.', 'error');
      console.error(err);
    }
  };

  const deleteStudentResult = async (id: string) => {
    const target = studentResults.find((r) => r.id === id || r._id === id);
    if (target) {
      setDeletedResults((prev) => [
        { ...target, deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
        ...prev,
      ]);
    }

    try {
      await ResultAPI.delete(id);
    } catch (err) {
      console.warn('Backend result delete error / offline.', err);
    }

    setStudentResults((prev) => prev.filter((r) => r.id !== id && r._id !== id));
    showToast('Moved to Recycle Bin', 'Published grade report moved to Institutional Recycle Center.', 'info');
  };

  // ─── Timetable ──────────────────────────────────────
  const addTimetableSlot = async (slot: Partial<TimetableSlot>) => {
    try {
      const { data } = await TimetableAPI.create(slot);
      setTimetable((prev) => [...prev, data.data]);
      showToast('Slot Added', 'Timetable slot has been created.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to add timetable slot.', 'error');
      console.error(err);
    }
  };

  const updateTimetableSlot = async (id: string, slotData: Partial<TimetableSlot>) => {
    try {
      const { data } = await TimetableAPI.update(id, slotData);
      setTimetable((prev) =>
        prev.map((s) => ((s.id === id || s._id === id) ? data.data : s)),
      );
      showToast('Slot Updated', 'Timetable slot has been updated.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to update timetable slot.', 'error');
      console.error(err);
    }
  };

  const deleteTimetableSlot = async (id: string) => {
    try {
      await TimetableAPI.delete(id);
      setTimetable((prev) => prev.filter((s) => s.id !== id && s._id !== id));
      showToast('Slot Deleted', 'Timetable slot has been removed.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to delete timetable slot.', 'error');
      console.error(err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        attendance,
        announcements,
        notifications,
        allUsers,
        deletedUsers,
        deletedCourses,
        restoreCourse,
        deletedAnnouncements,
        restoreAnnouncement,
        deletedResults,
        restoreResult,
        changeRequests,
        studentResults,
        timetable,
        toasts,
        isDataLoading,
        showToast,
        dismissToast,
        takeAttendance,
        postAnnouncement,
        deleteAnnouncement,
        markNotifRead,
        clearNotifs,
        addNotification,
        addUser,
        updateUser,
        deleteUser,
        assignMentor,
        restoreUser,
        permanentlyDeleteUser,
        submitChangeRequest,
        resolveChangeRequest,
        deleteChangeRequest,
        saveStudentResult,
        deleteStudentResult,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
