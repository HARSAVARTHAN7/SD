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
import { StorageService, subscribeToStore } from '../services/storage';

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
  toasts: Toast[];

  // Actions
  showToast: (title: string, message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  takeAttendance: (
    date: string,
    courseId: string,
    records: Array<{ studentId: string; studentName: string; studentRoll: string; status: 'present' | 'absent' | 'late' | 'excused' }>
  ) => void;
  postAnnouncement: (data: Omit<Announcement, 'id' | 'date'>) => void;
  deleteAnnouncement: (id: string) => void;
  markNotifRead: (id: string) => void;
  clearNotifs: () => void;
  resetAllDemoData: () => void;
  // User CRUD
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  // Change requests
  submitChangeRequest: (req: Omit<ChangeRequest, 'id'>) => void;
  resolveChangeRequest: (id: string) => void;
  deleteChangeRequest: (id: string) => void;
  // Results
  saveStudentResult: (report: StudentResultReport) => void;
  deleteStudentResult: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => StorageService.getCourses());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => StorageService.getAnnouncements());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());
  const [allUsers, setAllUsers] = useState<User[]>(() => StorageService.getUsers());
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => StorageService.getChangeRequests());
  const [studentResults, setStudentResults] = useState<StudentResultReport[]>(() => StorageService.getStudentResults());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshState = useCallback(() => {
    setCourses(StorageService.getCourses());
    setAttendance(StorageService.getAttendance());
    setAnnouncements(StorageService.getAnnouncements());
    setNotifications(StorageService.getNotifications());
    setAllUsers(StorageService.getUsers());
    setChangeRequests(StorageService.getChangeRequests());
    setStudentResults(StorageService.getStudentResults());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      refreshState();
    });
    return () => unsubscribe();
  }, [refreshState]);

  const showToast = (title: string, message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const takeAttendance = (
    date: string,
    courseId: string,
    records: Array<{ studentId: string; studentName: string; studentRoll: string; status: 'present' | 'absent' | 'late' | 'excused' }>
  ) => {
    StorageService.markBatchAttendance(date, courseId, records);
    showToast('Attendance Saved!', `Daily roll call for ${date} has been updated.`, 'success');
  };

  const postAnnouncement = (data: Omit<Announcement, 'id' | 'date'>) => {
    StorageService.addAnnouncement(data);
    showToast('Announcement Published!', `Notice has been broadcasted to all students.`, 'info');
  };

  const deleteAnnouncement = (id: string) => {
    StorageService.deleteAnnouncement(id);
    showToast('Deleted', 'Announcement removed from the notice board.', 'info');
  };

  const markNotifRead = (id: string) => {
    StorageService.markNotificationRead(id);
  };

  const clearNotifs = () => {
    StorageService.clearAllNotifications();
  };

  const resetAllDemoData = () => {
    StorageService.resetDefaults();
    showToast('Reset Complete', 'Demo database reset to defaults.', 'info');
  };

  // User CRUD
  const addUser = (user: User) => {
    StorageService.addUser(user);
    showToast('User Added', `${user.name} has been registered successfully.`, 'success');
  };

  const updateUser = (user: User) => {
    StorageService.updateUser(user);
    showToast('Profile Updated', `${user.name}'s profile has been updated.`, 'success');
  };

  const deleteUser = (id: string) => {
    StorageService.deleteUser(id);
    showToast('Deleted', 'User has been removed from the system.', 'info');
  };

  // Change Requests
  const submitChangeRequest = (req: Omit<ChangeRequest, 'id'>) => {
    StorageService.addChangeRequest(req);
    showToast('Request Submitted', 'Your change request has been sent to the admin.', 'success');
  };

  const resolveChangeRequest = (id: string) => {
    StorageService.resolveChangeRequest(id);
    showToast('Resolved', 'Change request has been marked as resolved.', 'success');
  };

  const deleteChangeRequest = (id: string) => {
    StorageService.deleteChangeRequest(id);
    showToast('Dismissed', 'Change request removed.', 'info');
  };

  // Results Actions
  const saveStudentResult = (report: StudentResultReport) => {
    StorageService.saveStudentResult(report);
    showToast('Results Published', `Academic results published for ${report.studentName}.`, 'success');
  };

  const deleteStudentResult = (id: string) => {
    StorageService.deleteStudentResult(id);
    showToast('Result Removed', 'Published grade report deleted.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        attendance,
        announcements,
        notifications,
        allUsers,
        changeRequests,
        studentResults,
        toasts,
        showToast,
        dismissToast,
        takeAttendance,
        postAnnouncement,
        deleteAnnouncement,
        markNotifRead,
        clearNotifs,
        resetAllDemoData,
        addUser,
        updateUser,
        deleteUser,
        submitChangeRequest,
        resolveChangeRequest,
        deleteChangeRequest,
        saveStudentResult,
        deleteStudentResult,
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
