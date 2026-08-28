import {
  User,
  Course,
  AttendanceRecord,
  Announcement,
  TimetableSlot,
  GradeItem,
  AppNotification
} from '../types';

const STORAGE_KEYS = {
  USERS: 'eduportal_users_v3',
  COURSES: 'eduportal_courses_v3',
  ATTENDANCE: 'eduportal_attendance_v3',
  ANNOUNCEMENTS: 'eduportal_announcements_v3',
  NOTIFICATIONS: 'eduportal_notifications_v3',
  CURRENT_USER: 'eduportal_current_user_v3',
};

// Seed default users
const DEFAULT_USERS: User[] = [
  {
    id: 'student-murat',
    username: 'MuratGursoy',
    email: 'murat.gursoy@school.edu',
    password: 'password123',
    name: 'Murat Gürsoy',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 349-8291',
    joinedDate: 'Sep 2024',
    studentId: 'STU-2024-418',
    rollNo: '2024-418',
    semester: '5th Semester',
    department: 'Computer Science & Engineering',
    mentorName: 'Dr. Sarah Jenkins',
    mentorId: 'FAC-7742',
    mentorPhone: '+1 (555) 782-9912',
    residenceType: 'Day Scholar',
    busRoute: 'Route #14 - North City Express',
    busNumber: 'BUS-042',
    busStop: 'Central Square Station (Stop #4)',
    hostelName: 'Emerald Heights Residence Block-B',
    roomNumber: 'Room 304-B',
    bloodGroup: 'O+ Positive',
    academicYear: '2024 - 2028',
    gpa: 3.85,
    attendanceRate: 94.8,
    guardianName: 'Selim Gürsoy',
    guardianContact: '+1 (555) 912-0044',
  },
  {
    id: 'teacher-sarah',
    username: 'SarahJenkins',
    email: 'sarah.jenkins@school.edu',
    password: 'password123',
    name: 'Dr. Sarah Jenkins',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 782-9912',
    joinedDate: 'Aug 2019',
    department: 'Department of Computer Science & Mathematics',
    title: 'Senior Professor & Department Chair',
    subjectsTaught: ['AP Calculus BC', 'Classical Mechanics & Physics', 'Advanced Algorithms'],
    employeeId: 'FAC-7742',
    officeHours: 'Mon & Thu 2:00 PM - 4:30 PM',
  },
  {
    id: 'student-emma',
    username: 'EmmaWatson',
    email: 'emma.w@school.edu',
    password: 'password123',
    name: 'Emma Watson',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 441-2099',
    joinedDate: 'Sep 2024',
    studentId: 'STU-2024-419',
    rollNo: '2024-419',
    semester: '5th Semester',
    department: 'Computer Science & Engineering',
    mentorName: 'Dr. Sarah Jenkins',
    mentorId: 'FAC-7742',
    mentorPhone: '+1 (555) 782-9912',
    residenceType: 'Hosteler',
    hostelName: 'Sapphire Girls Residency Hall (Block A)',
    roomNumber: 'Room 214-A',
    busRoute: 'N/A (Campus Resident)',
    busNumber: 'N/A',
    busStop: 'Campus Gate 1',
    bloodGroup: 'A+ Positive',
    academicYear: '2024 - 2028',
    gpa: 3.92,
    attendanceRate: 97.5,
  },
  {
    id: 'student-lucas',
    username: 'LucasVance',
    email: 'lucas.v@school.edu',
    password: 'password123',
    name: 'Lucas Vance',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 883-1142',
    joinedDate: 'Sep 2024',
    studentId: 'STU-2024-420',
    rollNo: '2024-420',
    semester: '5th Semester',
    department: 'Computer Science & Engineering',
    mentorName: 'Dr. Sarah Jenkins',
    mentorId: 'FAC-7742',
    mentorPhone: '+1 (555) 782-9912',
    residenceType: 'Day Scholar',
    busRoute: 'Route #08 - South Bay Line',
    busNumber: 'BUS-019',
    busStop: 'Riverside Avenue (Stop #2)',
    hostelName: 'Oak Ridge Residence',
    roomNumber: 'Room 102',
    bloodGroup: 'B+ Positive',
    academicYear: '2024 - 2028',
    gpa: 3.65,
    attendanceRate: 91.2,
  },
];

// Seed default courses
const DEFAULT_COURSES: Course[] = [
  {
    id: 'c1',
    code: 'MATH-401',
    title: 'AP Calculus BC',
    teacherId: 'teacher-sarah',
    teacherName: 'Dr. Sarah Jenkins',
    schedule: 'Mon, Wed, Fri • 09:00 AM - 10:15 AM',
    room: 'Room 304 (Math Hall)',
    credits: 4,
    color: 'emerald',
    iconName: 'Calculator',
    description: 'Differential and integral calculus with series analysis, vector equations, and multivariable concepts.',
    totalStudents: 28,
    syllabusProgress: 72,
    studyMaterialsCount: 14,
  },
  {
    id: 'c2',
    code: 'PHYS-302',
    title: 'Classical & Modern Physics',
    teacherId: 'teacher-sarah',
    teacherName: 'Dr. Sarah Jenkins',
    schedule: 'Tue, Thu • 10:30 AM - 12:00 PM',
    room: 'Lab B (Physics Hall)',
    credits: 4,
    color: 'sky',
    iconName: 'Atom',
    description: 'Newtonian mechanics, thermodynamics, electromagnetism, wave mechanics, and particle duality.',
    totalStudents: 26,
    syllabusProgress: 65,
    studyMaterialsCount: 18,
  },
  {
    id: 'c3',
    code: 'CS-205',
    title: 'Advanced Computer Science',
    teacherId: 'teacher-alan',
    teacherName: 'Prof. Alan Cooper',
    schedule: 'Mon, Wed • 01:15 PM - 02:30 PM',
    room: 'Lab 4 (Computer Center)',
    credits: 3,
    color: 'violet',
    iconName: 'Code2',
    description: 'Data structures, algorithms, object-oriented design patterns, recursion, and computational complexity.',
    totalStudents: 32,
    syllabusProgress: 80,
    studyMaterialsCount: 22,
  },
  {
    id: 'c4',
    code: 'LIT-110',
    title: 'World Literature & Rhetoric',
    teacherId: 'teacher-elena',
    teacherName: 'Prof. Elena Vance',
    schedule: 'Tue, Fri • 01:00 PM - 02:15 PM',
    room: 'Room 201 (Humanities)',
    credits: 3,
    color: 'amber',
    iconName: 'BookOpen',
    description: 'Comparative global literature, critical analytical essays, literary critiques, and rhetorical arguments.',
    totalStudents: 30,
    syllabusProgress: 60,
    studyMaterialsCount: 9,
  },
  {
    id: 'c5',
    code: 'CHEM-202',
    title: 'Organic Chemistry & Biochemistry',
    teacherId: 'teacher-shaw',
    teacherName: 'Dr. Robert Shaw',
    schedule: 'Wed, Fri • 10:30 AM - 11:45 AM',
    room: 'Chem Lab 2',
    credits: 4,
    color: 'rose',
    iconName: 'FlaskConical',
    description: 'Structure, reactivity, synthesis of carbon compounds, stereochemistry, and metabolic pathways.',
    totalStudents: 25,
    syllabusProgress: 58,
    studyMaterialsCount: 16,
  },
  {
    id: 'c6',
    code: 'HIST-304',
    title: 'World History & Modern Civics',
    teacherId: 'teacher-marcus',
    teacherName: 'Prof. Marcus Aurel',
    schedule: 'Mon, Thu • 11:30 AM - 12:45 PM',
    room: 'Room 108 (Social Wing)',
    credits: 3,
    color: 'indigo',
    iconName: 'Landmark',
    description: 'Major global movements, diplomatic history, geopolitical treaties, and constitutional systems.',
    totalStudents: 29,
    syllabusProgress: 75,
    studyMaterialsCount: 11,
  },
];

// Seed default announcements
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    authorId: 'teacher-sarah',
    authorName: 'Dr. Sarah Jenkins',
    authorRole: 'Mentor & Department Chair',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: '📐 Department Mentorship & Semester Progress Review',
    content: 'All 5th Semester students under Dr. Sarah Jenkins mentorship are requested to attend the academic review meeting this Thursday in Room 304.',
    date: 'August 28, 2026',
    priority: 'important',
    targetCourse: 'Computer Science & Engineering',
  },
  {
    id: 'ann-2',
    authorId: 'transport-office',
    authorName: 'Campus Transport Committee',
    authorRole: 'Transport Incharge',
    authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    title: '🚌 Day Scholar Bus Route Schedule Update',
    content: 'All Day Scholar buses (Routes 01 to 24) will operate on the regular schedule including Saturday tutorial sessions.',
    date: 'August 27, 2026',
    priority: 'normal',
    targetCourse: 'All Day Scholars',
  },
];

// Seed default timetable slots (including Saturday)
export const DEFAULT_TIMETABLE: TimetableSlot[] = [
  // Monday
  { id: 't1', day: 'Monday', startTime: '09:00 AM', endTime: '10:15 AM', subject: 'AP Calculus BC', teacher: 'Dr. Sarah Jenkins', room: 'Room 304', color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700' },
  { id: 't2', day: 'Monday', startTime: '10:30 AM', endTime: '11:45 AM', subject: 'World History & Civics', teacher: 'Prof. Marcus Aurel', room: 'Room 108', color: 'bg-indigo-500/10 border-indigo-500 text-indigo-700' },
  { id: 't3', day: 'Monday', startTime: '01:15 PM', endTime: '02:30 PM', subject: 'Advanced Computer Science', teacher: 'Prof. Alan Cooper', room: 'Lab 4', color: 'bg-purple-500/10 border-purple-500 text-purple-700' },
  
  // Tuesday
  { id: 't4', day: 'Tuesday', startTime: '10:30 AM', endTime: '12:00 PM', subject: 'Classical & Modern Physics', teacher: 'Dr. Sarah Jenkins', room: 'Lab B', color: 'bg-sky-500/10 border-sky-500 text-sky-700' },
  { id: 't5', day: 'Tuesday', startTime: '01:00 PM', endTime: '02:15 PM', subject: 'World Literature & Rhetoric', teacher: 'Prof. Elena Vance', room: 'Room 201', color: 'bg-amber-500/10 border-amber-500 text-amber-700' },
  
  // Wednesday
  { id: 't6', day: 'Wednesday', startTime: '09:00 AM', endTime: '10:15 AM', subject: 'AP Calculus BC', teacher: 'Dr. Sarah Jenkins', room: 'Room 304', color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700' },
  { id: 't7', day: 'Wednesday', startTime: '10:30 AM', endTime: '11:45 AM', subject: 'Organic Chemistry', teacher: 'Dr. Robert Shaw', room: 'Chem Lab 2', color: 'bg-rose-500/10 border-rose-500 text-rose-700' },
  { id: 't8', day: 'Wednesday', startTime: '01:15 PM', endTime: '02:30 PM', subject: 'Advanced Computer Science', teacher: 'Prof. Alan Cooper', room: 'Lab 4', color: 'bg-purple-500/10 border-purple-500 text-purple-700' },
  
  // Thursday
  { id: 't9', day: 'Thursday', startTime: '10:30 AM', endTime: '12:00 PM', subject: 'Classical & Modern Physics', teacher: 'Dr. Sarah Jenkins', room: 'Lab B', color: 'bg-sky-500/10 border-sky-500 text-sky-700' },
  { id: 't10', day: 'Thursday', startTime: '11:30 AM', endTime: '12:45 PM', subject: 'World History & Civics', teacher: 'Prof. Marcus Aurel', room: 'Room 108', color: 'bg-indigo-500/10 border-indigo-500 text-indigo-700' },
  
  // Friday
  { id: 't11', day: 'Friday', startTime: '09:00 AM', endTime: '10:15 AM', subject: 'AP Calculus BC', teacher: 'Dr. Sarah Jenkins', room: 'Room 304', color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700' },
  { id: 't12', day: 'Friday', startTime: '10:30 AM', endTime: '11:45 AM', subject: 'Organic Chemistry', teacher: 'Dr. Robert Shaw', room: 'Chem Lab 2', color: 'bg-rose-500/10 border-rose-500 text-rose-700' },
  { id: 't13', day: 'Friday', startTime: '01:00 PM', endTime: '02:15 PM', subject: 'World Literature & Rhetoric', teacher: 'Prof. Elena Vance', room: 'Room 201', color: 'bg-amber-500/10 border-amber-500 text-amber-700' },
  
  // Saturday
  { id: 't14', day: 'Saturday', startTime: '09:00 AM', endTime: '10:30 AM', subject: 'AP Calculus BC (Tutorial & Problem Solving)', teacher: 'Dr. Sarah Jenkins', room: 'Room 304', color: 'bg-emerald-500/10 border-emerald-500 text-emerald-700' },
  { id: 't15', day: 'Saturday', startTime: '10:45 AM', endTime: '12:15 PM', subject: 'Advanced Computer Science (Lab Project)', teacher: 'Prof. Alan Cooper', room: 'Lab 4', color: 'bg-purple-500/10 border-purple-500 text-purple-700' },
  { id: 't16', day: 'Saturday', startTime: '01:00 PM', endTime: '02:30 PM', subject: 'Physics & Engineering Practicum', teacher: 'Dr. Sarah Jenkins', room: 'Lab B', color: 'bg-sky-500/10 border-sky-500 text-sky-700' },
];

// Seed default grades for Murat
export const DEFAULT_STUDENT_GRADES: GradeItem[] = [
  { courseId: 'c1', courseName: 'AP Calculus BC', courseCode: 'MATH-401', credits: 4, gradeLetter: 'A', percentage: 96, gpaPoint: 4.0, teacherName: 'Dr. Sarah Jenkins', remarks: 'Exceptional mastery of integral calculus and series.' },
  { courseId: 'c2', courseName: 'Classical & Modern Physics', courseCode: 'PHYS-302', credits: 4, gradeLetter: 'A-', percentage: 92, gpaPoint: 3.7, teacherName: 'Dr. Sarah Jenkins', remarks: 'Strong analytical skills in rotational mechanics.' },
  { courseId: 'c3', courseName: 'Advanced Computer Science', courseCode: 'CS-205', credits: 3, gradeLetter: 'A+', percentage: 98, gpaPoint: 4.0, teacherName: 'Prof. Alan Cooper', remarks: 'High proficiency in algorithms & structures.' },
  { courseId: 'c4', courseName: 'World Literature & Rhetoric', courseCode: 'LIT-110', credits: 3, gradeLetter: 'B+', percentage: 88, gpaPoint: 3.3, teacherName: 'Prof. Elena Vance', remarks: 'Well-articulated essays and critical synthesis.' },
  { courseId: 'c5', courseName: 'Organic Chemistry', courseCode: 'CHEM-202', credits: 4, gradeLetter: 'A-', percentage: 91, gpaPoint: 3.7, teacherName: 'Dr. Robert Shaw', remarks: 'Good laboratory execution and problem solving.' },
  { courseId: 'c6', courseName: 'World History & Civics', courseCode: 'HIST-304', credits: 3, gradeLetter: 'A', percentage: 94, gpaPoint: 4.0, teacherName: 'Prof. Marcus Aurel', remarks: 'Active classroom engagement and strong civics insights.' },
];

// Seed default attendance records
const DEFAULT_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', date: '2026-08-28', courseId: 'c1', studentId: 'student-murat', studentName: 'Murat Gürsoy', studentRoll: 'STU-2024-418', status: 'present' },
  { id: 'att-2', date: '2026-08-28', courseId: 'c1', studentId: 'student-emma', studentName: 'Emma Watson', studentRoll: 'STU-2024-419', status: 'present' },
  { id: 'att-3', date: '2026-08-28', courseId: 'c1', studentId: 'student-lucas', studentName: 'Lucas Vance', studentRoll: 'STU-2024-420', status: 'late', notes: 'Arrived 10 mins late' },
];

// Seed default notifications
const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id: 'notif-1', title: 'Department Notice', message: 'Mentorship review schedule published by Dr. Sarah Jenkins', timestamp: '2 hours ago', read: false, type: 'announcement', roleTarget: 'student' },
  { id: 'notif-2', title: 'Transport Update', message: 'Bus routes active on regular schedule including Saturday sessions', timestamp: '5 hours ago', read: false, type: 'announcement', roleTarget: 'student' },
];

const LISTENERS: Array<() => void> = [];

export function subscribeToStore(listener: () => void) {
  LISTENERS.push(listener);
  return () => {
    const idx = LISTENERS.indexOf(listener);
    if (idx !== -1) LISTENERS.splice(idx, 1);
  };
}

function notifyStoreUpdate() {
  LISTENERS.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

export const StorageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  },

  resetDefaults() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    notifyStoreUpdate();
  },

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyStoreUpdate();
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyStoreUpdate();
  },

  getCourses(): Course[] {
    const data = localStorage.getItem(STORAGE_KEYS.COURSES);
    return data ? JSON.parse(data) : DEFAULT_COURSES;
  },

  getAttendance(): AttendanceRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : DEFAULT_ATTENDANCE;
  },

  markBatchAttendance(date: string, courseId: string, records: Array<{ studentId: string; studentName: string; studentRoll: string; status: 'present' | 'absent' | 'late' | 'excused' }>): void {
    const list = this.getAttendance();
    records.forEach((rec) => {
      const existingIndex = list.findIndex(
        (a) => a.date === date && a.courseId === courseId && a.studentId === rec.studentId
      );
      if (existingIndex !== -1) {
        list[existingIndex].status = rec.status;
      } else {
        list.push({
          id: `att-${Date.now()}-${rec.studentId}`,
          date,
          courseId,
          studentId: rec.studentId,
          studentName: rec.studentName,
          studentRoll: rec.studentRoll,
          status: rec.status,
        });
      }
    });
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    notifyStoreUpdate();
  },

  getAnnouncements(): Announcement[] {
    const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return data ? JSON.parse(data) : DEFAULT_ANNOUNCEMENTS;
  },

  addAnnouncement(announcement: Omit<Announcement, 'id' | 'date'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
    list.unshift(newAnn);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));

    this.addNotification({
      title: '📢 ' + newAnn.title,
      message: `${newAnn.authorName} posted an announcement for ${newAnn.targetCourse || 'All Students'}`,
      timestamp: 'Just now',
      read: false,
      type: 'announcement',
      roleTarget: 'student',
    });

    notifyStoreUpdate();
    return newAnn;
  },

  deleteAnnouncement(id: string): void {
    const list = this.getAnnouncements().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    notifyStoreUpdate();
  },

  getNotifications(): AppNotification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : DEFAULT_NOTIFICATIONS;
  },

  addNotification(notif: Omit<AppNotification, 'id'>): void {
    const list = this.getNotifications();
    list.unshift({ ...notif, id: `notif-${Date.now()}` });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  },

  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      notifyStoreUpdate();
    }
  },

  clearAllNotifications(): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    notifyStoreUpdate();
  }
};

StorageService.init();
