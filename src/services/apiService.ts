import api from './api';
import type {
  User,
  Course,
  AttendanceRecord,
  Announcement,
  TimetableSlot,
  AppNotification,
  ChangeRequest,
  StudentResultReport,
  Role,
} from '../types';

// ─── Generic Response Types ─────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  total: number;
  page: number;
  pages?: number;
}

// ─── Auth Service ───────────────────────────────────
export const AuthAPI = {
  login: (usernameOrEmail: string, password: string, intendedRole?: Role) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      usernameOrEmail,
      password,
      intendedRole,
    }),

  register: (userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: Role;
    [key: string]: unknown;
  }) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/register', userData),

  getMe: () =>
    api.get<{ success: boolean; user: User }>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<{ success: boolean; user: User }>('/auth/profile', data),
};

// ─── User Service ───────────────────────────────────
export const UserAPI = {
  getAll: (params?: { role?: string; search?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  create: (user: Partial<User> & { password?: string }) =>
    api.post<ApiResponse<User>>('/users', user),

  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/users/${id}`),

  assignMentor: (studentId: string, mentorData: { mentorId: string; mentorName: string; mentorPhone: string }) =>
    api.put<ApiResponse<User>>(`/users/${studentId}/mentor`, mentorData),
};

// ─── Course Service ─────────────────────────────────
export const CourseAPI = {
  getAll: (params?: { teacherId?: string; search?: string }) =>
    api.get<{ success: boolean; count: number; data: Course[] }>('/courses', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Course>>(`/courses/${id}`),

  create: (course: Partial<Course>) =>
    api.post<ApiResponse<Course>>('/courses', course),

  update: (id: string, data: Partial<Course>) =>
    api.put<ApiResponse<Course>>(`/courses/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/courses/${id}`),
};

// ─── Attendance Service ─────────────────────────────
export const AttendanceAPI = {
  getAll: (params?: { date?: string; courseId?: string; studentId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<AttendanceRecord>>('/attendance', { params }),

  markBatch: (data: {
    date: string;
    courseId: string;
    records: Array<{
      studentId: string;
      studentName: string;
      studentRoll: string;
      status: 'present' | 'absent' | 'late' | 'excused';
    }>;
  }) => api.post<{ success: boolean; message: string; modified: number; upserted: number }>(
    '/attendance/batch',
    data,
  ),

  getStudentStats: (studentId: string) =>
    api.get<{
      success: boolean;
      data: {
        total: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
        attendanceRate: number;
      };
    }>(`/attendance/stats/${studentId}`),
};

// ─── Announcement Service ───────────────────────────
export const AnnouncementAPI = {
  getAll: (params?: { priority?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Announcement>>('/announcements', { params }),

  create: (data: { title: string; content: string; priority?: string; targetCourse?: string }) =>
    api.post<ApiResponse<Announcement>>('/announcements', data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/announcements/${id}`),
};

// ─── Timetable Service ──────────────────────────────
export const TimetableAPI = {
  getAll: (params?: { day?: string; teacher?: string }) =>
    api.get<{ success: boolean; count: number; data: TimetableSlot[] }>('/timetable', { params }),

  create: (slot: Partial<TimetableSlot>) =>
    api.post<ApiResponse<TimetableSlot>>('/timetable', slot),

  update: (id: string, data: Partial<TimetableSlot>) =>
    api.put<ApiResponse<TimetableSlot>>(`/timetable/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/timetable/${id}`),
};

// ─── Notification Service ───────────────────────────
export const NotificationAPI = {
  getAll: (params?: { roleTarget?: string; read?: string; limit?: number }) =>
    api.get<{ success: boolean; count: number; data: AppNotification[] }>('/notifications', { params }),

  create: (data: Partial<AppNotification>) =>
    api.post<ApiResponse<AppNotification>>('/notifications', data),

  markRead: (id: string) =>
    api.put<ApiResponse<AppNotification>>(`/notifications/${id}/read`),

  clearAll: (params?: { roleTarget?: string }) =>
    api.delete<{ success: boolean; message: string }>('/notifications/clear', { params }),
};

// ─── Change Request Service ─────────────────────────
export const ChangeRequestAPI = {
  getAll: (params?: { status?: string }) =>
    api.get<{ success: boolean; count: number; data: ChangeRequest[] }>('/change-requests', { params }),

  create: (data: Omit<ChangeRequest, 'id'>) =>
    api.post<ApiResponse<ChangeRequest>>('/change-requests', data),

  resolve: (id: string) =>
    api.put<ApiResponse<ChangeRequest>>(`/change-requests/${id}/resolve`),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/change-requests/${id}`),
};

// ─── Result Service ─────────────────────────────────
export const ResultAPI = {
  getAll: (params?: { studentId?: string; rollNo?: string }) =>
    api.get<{ success: boolean; count: number; data: StudentResultReport[] }>('/results', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<StudentResultReport>>(`/results/${id}`),

  save: (report: Partial<StudentResultReport>) =>
    api.post<ApiResponse<StudentResultReport>>('/results', report),

  delete: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/results/${id}`),
};

// ─── Academic Term Period Service ────────────────────
export const AcademicTermPeriodAPI = {
  get: () =>
    api.get<ApiResponse<{ startDate: string; endDate: string }>>('/academic-term-period'),

  update: (period: { startDate: string; endDate: string }) =>
    api.put<ApiResponse<{ startDate: string; endDate: string }>>('/academic-term-period', period),
};
