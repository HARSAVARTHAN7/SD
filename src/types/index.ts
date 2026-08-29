export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: Role;
  avatar: string;
  phone?: string;
  joinedDate: string;
  isBlocked?: boolean;
  status?: 'active' | 'blocked';

  // Student-specific fields
  studentId?: string;
  rollNo?: string;
  grade?: string;
  section?: string;
  semester?: string;
  department?: string;
  mentorName?: string;
  mentorId?: string;
  mentorPhone?: string;
  residenceType?: 'Day Scholar' | 'Hosteler';
  busRoute?: string;
  busNumber?: string;
  busStop?: string;
  hostelName?: string;
  roomNumber?: string;
  gpa?: number;
  attendanceRate?: number;
  guardianName?: string;
  guardianContact?: string;
  bloodGroup?: string;
  academicYear?: string;

  // Teacher-specific fields
  title?: string;
  subjectsTaught?: string[];
  employeeId?: string;
  officeHours?: string;
}

export interface Course {
  id: string;
  _id?: string;
  code: string;
  title: string;
  teacherId: string;
  teacherName: string;
  schedule: string;
  room: string;
  credits: number;
  color: string;
  iconName: string;
  description: string;
  totalStudents: number;
  syllabusProgress: number;
  studyMaterialsCount: number;
}

export interface AttendanceRecord {
  id: string;
  _id?: string;
  date: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface Announcement {
  id: string;
  _id?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
  targetCourse?: string;
}

export interface TimetableSlot {
  id: string;
  _id?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
  badge?: string;
}

export interface GradeItem {
  courseId: string;
  courseName: string;
  courseCode: string;
  credits: number;
  gradeLetter: string;
  percentage: number;
  gpaPoint: number;
  teacherName: string;
  remarks: string;
}

export interface AppNotification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'grade' | 'announcement' | 'attendance' | 'urgent' | 'warning';
  roleTarget: 'student' | 'teacher' | 'all';
}

export interface ChangeRequest {
  id: string;
  _id?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  description: string;
  status: 'pending' | 'resolved';
  timestamp: string;
}

export interface SemesterResult {
  semester: string;
  sgpa: number;
  status: 'Pass' | 'Fail';
  grades: GradeItem[];
}

export interface HallTicketSubject {
  subjectCode: string;
  subjectName: string;
}

export interface HallTicketInfo {
  hallTicketNo: string;
  registerNumber?: string;
  programme?: string;
  semester?: string;
  candidateName?: string;
  dob?: string;
  examCenter?: string;
  seatNo?: string;
  examDates?: string;
  candidatePhoto?: string;
  subjects?: HallTicketSubject[];
  status: 'Issued' | 'Pending';
  publishedDate?: string;
}

export interface StudentResultReport {
  id: string;
  _id?: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  department?: string;
  currentSemester: string;
  cgpa: number;
  publishedDate: string;
  academicYear: string;
  semesters: Record<string, SemesterResult>;
  hallTicket?: HallTicketInfo;
}
