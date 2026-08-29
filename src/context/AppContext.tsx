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
  postAnnouncement: (data: { title: string; content: string; priority?: string; targetCourse?: string }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  clearNotifs: () => Promise<void>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResultReport[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);

  // Recycle bin states (mocked out as empty for now until backend supports it)
  const [deletedUsers, setDeletedUsers] = useState<Array<User & { deletedAt?: string }>>([]);
  const [deletedCourses, setDeletedCourses] = useState<Array<Course & { deletedAt?: string }>>([]);
  const [deletedAnnouncements, setDeletedAnnouncements] = useState<Array<Announcement & { deletedAt?: string }>>([]);
  const [deletedResults, setDeletedResults] = useState<Array<StudentResultReport & { deletedAt?: string }>>([]);
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
          UserAPI.getAll({ limit: 200 }).then(({ data }) => setAllUsers(data.data)),
          ResultAPI.getAll().then(({ data }) => setStudentResults(data.data)),
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
      // Reset state on logout
      setCourses([]);
      setAttendance([]);
      setAnnouncements([]);
      setNotifications([]);
      setAllUsers([]);
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
  const postAnnouncement = async (annData: { title: string; content: string; priority?: string; targetCourse?: string }) => {
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
    try {
      await AnnouncementAPI.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id && a._id !== id));
      showToast('Deleted', 'Announcement removed from the notice board.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete announcement.', 'error');
      console.error(err);
    }
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

  // ─── User CRUD ──────────────────────────────────────
  const addUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      const { data } = await UserAPI.create(userData);
      setAllUsers((prev) => [...prev, data.data]);
      showToast('User Added', `${data.data.name} has been registered successfully.`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to create user.', 'error');
      console.error(err);
    }
  };

  const updateUser = async (userData: User) => {
    try {
      const userId = userData.id || (userData as unknown as { _id: string })._id;
      const { data } = await UserAPI.update(userId, userData);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId || (u as unknown as { _id: string })._id === userId ? data.data : u)),
      );
      showToast('Profile Updated', `${data.data.name}'s profile has been updated.`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to update user.', 'error');
      console.error(err);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await UserAPI.delete(id);
      setAllUsers((prev) => prev.filter((u) => u.id !== id && (u as unknown as { _id: string })._id !== id));
      showToast('Deleted', 'User has been removed from the system.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete user.', 'error');
      console.error(err);
    }
  };

  const assignMentor = async (studentId: string, mentorData: { mentorId: string; mentorName: string; mentorPhone: string }) => {
    try {
      const { data } = await UserAPI.assignMentor(studentId, mentorData);
      setAllUsers((prev) =>
        prev.map((u) => (u.id === studentId || (u as unknown as { _id: string })._id === studentId ? data.data : u)),
      );
      showToast('Mentor Assigned', `Mentor assigned: ${mentorData.mentorName}`, 'success');
    } catch (err) {
      showToast('Error', 'Failed to assign mentor.', 'error');
      console.error(err);
    }
  };

  const restoreUser = (id: string) => {
    showToast('Not Supported', 'Restoring users requires backend recycle bin support.', 'info');
  };

  const permanentlyDeleteUser = (id: string) => {
    showToast('Not Supported', 'Hard delete requires backend recycle bin support.', 'info');
  };

  const restoreCourse = (id: string) => {
    showToast('Not Supported', 'Restoring courses requires backend recycle bin support.', 'info');
  };

  const restoreAnnouncement = (id: string) => {
    showToast('Not Supported', 'Restoring announcements requires backend recycle bin support.', 'info');
  };

  const restoreResult = (id: string) => {
    showToast('Not Supported', 'Restoring results requires backend recycle bin support.', 'info');
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
    try {
      await ResultAPI.delete(id);
      setStudentResults((prev) => prev.filter((r) => r.id !== id && r._id !== id));
      showToast('Result Removed', 'Published grade report deleted.', 'info');
    } catch (err) {
      showToast('Error', 'Failed to delete result.', 'error');
      console.error(err);
    }
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
