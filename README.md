# Student Dashboard & Academic Operations Portal (EduPortal)

A modern, responsive School Management & Academic Dashboard web application featuring dedicated role-based access for **Students**, **Teachers**, and **Institutional Administrators**.

---

## 🌟 Key Roles & Features

### 1. Role Selection & Authentication
- **Role Selection Landing Page**: Interactive visual cards prompting users to choose **Student** or **Teacher**, with a dedicated **"Admin"** access button in the top right corner.
- **Dedicated Login Interfaces**:
  - **Student Login**: Illustrated student character, underline input styling, "Remember me", and green `"Login ✓"` button.
  - **Teacher Login**: Illustrated teacher character, underline input styling, and `"Login"` button.
  - **Admin Login**: Dedicated institutional login card restricted strictly to authorized institutional administrator:
    - **Authorized Email**: `admin@bitsathy.ac.in`
    - **Password**: `admin@1234`
- **Security Restricted Password Reset**:
  - Recovery link is restricted and dispatched **only** to authorized address: `harsavarthan.cs23@bitsathy.ac.in`.

---

### 2. 🎓 Student Dashboard
- **Comprehensive Overview**:
  - Student profile image, full name, ID, phone number, and email.
  - Current Semester (`5th Semester`) and Department (`Department of Computer Science & Engineering`).
  - Assigned Faculty Mentor (`Dr. Sarah Jenkins`).
  - Single assigned accommodation details:
    - **Day Scholar**: Active Bus route, Bus number (`BUS-042`), and boarding stop (`Central Square Stop`).
    - **Hosteler**: Hostel name (`Emerald Heights Residence Block-B`) and Room number (`Room 304-B`).
- **Notice Board**: Official notices and circulars broadcasted by the mentor and department.
- **My Courses**: Course curriculum, instructor contact, syllabus completion progress, and downloadable resources.
- **Academic Transcript & Grades**: Visual GPA breakdown and subject marks chart.
- **Attendance Tracker**: Daily roll call logs and monthly attendance statistics.
- **Weekly Timetable**: Full Monday through Saturday class timetable.

---

### 3. 👩‍🏫 Teacher Management Portal
- **Faculty Overview**: Active mentored student profiles, course statistics, and departmental analytics.
- **Daily Attendance Register**: Roll-call register with 1-click **"Mark All Present"** and status toggles (*Present, Late, Absent*).
- **Student Directory & Accommodation Control**: Search student roster and edit/assign accommodation details (*Day Scholar bus route/number or Hostel room*).
- **Notice Board Broadcaster**: Post priority announcements (*Normal, Important, Urgent*) that sync immediately to student dashboards.
- **Weekly Timetable**: Master faculty teaching schedule from Monday to Saturday.

---

### 4. 🏛️ Admin Control Center (Master Authority)
- **Master Overview**: Summary statistics, live portal switcher (instant live preview as Student or Teacher).
- **Mentor Allocation Hub**: Assign and change faculty mentors for any student with live synchronization.
- **Master Timetable Manager**: Add, edit, or delete lecture and laboratory periods from Monday to Saturday.
- **Student & Faculty Directory**: Full roster with accommodation and profile management.
- **Campus Notice Broadcaster**: Publish institutional announcements to all student and faculty dashboards.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Data Visualizations**: Recharts
- **State Management**: Reactive LocalStorage Storage Engine with live multi-subscriber sync

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

## 🔑 Login Credentials

| Role | Username / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bitsathy.ac.in` | `admin@1234` | Master institutional control |
| **Student** | `MuratGursoy` / `murat.gursoy@school.edu` | `password123` | 5th Semester CS Student |
| **Teacher** | `SarahJenkins` / `sarah.jenkins@school.edu` | `password123` | Department Chair & Mentor |
| **Password Reset** | `harsavarthan.cs23@bitsathy.ac.in` | — | Authorized password recovery email |
