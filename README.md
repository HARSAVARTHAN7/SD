# Student Dashboard & Teacher Management Portal (EduPortal)

A modern, responsive School Management & Student Dashboard web application featuring dedicated role-based access for Students and Teachers.

---

## 🌟 Key Features

### 1. Role Selection & Authentication
- **First-Page Role Selection**: Interactive visual cards prompting users to choose **Student** or **Teacher**.
- **Dedicated Login Interfaces**:
  - **Student Login**: Illustrated student character, underline input styling, "Remember me", and green `"Login ✓"` button.
  - **Teacher Login**: Illustrated teacher character, underline input styling, and `"Login"` button.
  - **Sign Up Modal**: Register as a new Student or Teacher.
  - **Forgot Password**: Password reset recovery workflow.

### 2. Student Dashboard
- **Comprehensive Overview**:
  - Student profile image, full name, ID, phone number, and email.
  - Current Semester (`5th Semester`) and Department (`Department of Computer Science & Engineering`).
  - Assigned Faculty Mentor (`Dr. Sarah Jenkins`).
  - Accommodation details:
    - **Day Scholar**: Active Bus route, Bus number (`BUS-042`), and boarding stop (`Central Square Stop`).
    - **Hosteler**: Hostel name and Room number (`Room 304-B`).
- **Notice Board**: Official notices and circulars broadcasted by the mentor and department.
- **My Courses**: Course curriculum, instructor contact, syllabus completion progress, and downloadable resources.
- **Academic Transcript & Grades**: Visual GPA breakdown and subject scores chart.
- **Attendance Tracker**: Daily roll call logs and monthly attendance statistics.
- **Master Timetable**: Interactive Monday through Saturday class schedule.

### 3. Teacher Management Portal
- **Faculty Overview**: Active mentored student profiles, course statistics, and departmental analytics.
- **Daily Attendance Register**: Roll-call register with 1-click **"Mark All Present"** and status toggles (*Present, Late, Absent*).
- **Student Directory & Accommodation Control**: Search student roster and edit/assign accommodation details (*Day Scholar bus or Hostel room*).
- **Notice Board Broadcaster**: Post priority announcements (*Normal, Important, Urgent*) that sync immediately to student dashboards.
- **Master Timetable**: Weekly faculty teaching schedule from Monday to Saturday.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Data Visualizations**: Recharts
- **Effects**: Canvas Confetti

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🔑 Demo Login Credentials

- **Student**: Username: `MuratGursoy` / Password: `password123`
- **Teacher**: Username: `SarahJenkins` / Password: `password123`
