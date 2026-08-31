import { User, StudentResultReport, SemesterResult, GradeItem, HallTicketInfo } from '../types';
import { formatTeacherName } from './teacherUtils';

/**
 * Utility to extract raw text from PDF ArrayBuffer / File using text stream parsing
 */
/**
 * Utility to extract raw text from PDF / text File using text stream parsing with line preservation
 */
export async function parsePdfText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        let text = '';
        for (let i = 0; i < bytes.length; i++) {
          const char = String.fromCharCode(bytes[i]);
          text += char;
        }

        // Clean non-printable characters BUT preserve line breaks (\n)
        const cleanText = text
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .replace(/[ \t]+/g, ' ');

        resolve(cleanText);
      } catch (err) {
        console.error('PDF text extraction error:', err);
        resolve('');
      }
    };

    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Automatically calculate SGPA and Pass/Fail status for a semester
 */
export function calculateSgpa(grades: GradeItem[]): { sgpa: number; status: 'Pass' | 'Fail' } {
  if (!grades || grades.length === 0) return { sgpa: 0, status: 'Fail' };
  let totalCredits = 0;
  let weightedPoints = 0;
  let hasFailedSubject = false;

  grades.forEach((g) => {
    const credits = g.credits || 3;
    totalCredits += credits;
    weightedPoints += (g.gpaPoint || 0) * credits;
    if ((g.percentage || 0) < 50 || g.gradeLetter === 'F') {
      hasFailedSubject = true;
    }
  });

  const sgpa = totalCredits > 0 ? parseFloat((weightedPoints / totalCredits).toFixed(2)) : 0;
  return {
    sgpa,
    status: hasFailedSubject ? 'Fail' : 'Pass',
  };
}

/**
 * Automatically calculate CGPA across all published semesters
 */
export function calculateCgpa(semesters: Record<string, SemesterResult>): number {
  const semKeys = Object.keys(semesters);
  if (semKeys.length === 0) return 0;
  let totalSgpa = 0;
  semKeys.forEach((key) => {
    totalSgpa += semesters[key].sgpa || 0;
  });
  return parseFloat((totalSgpa / semKeys.length).toFixed(2));
}

/**
 * Clean up extracted name by removing template headers, metadata words, and file noise
 */
export function sanitizeExtractedName(raw: string): string {
  if (!raw) return '';

  let cleaned = raw
    .replace(/institutional|student|faculty|registration|master|template|official|exact|format|pdf|txt/gi, '')
    .replace(/[^a-zA-Z\s\.']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Generate a clean username from person's name (e.g. "Ram" -> "Ram")
 */
export function generateCleanUsername(name: string): string {
  const clean = sanitizeExtractedName(name);
  return clean.replace(/[^a-zA-Z0-9]/g, '') || 'Ram';
}

/**
 * Extract structured Student details from raw text (Line-by-line + Regex)
 */
export function extractStudentFromText(text: string, filename: string): Partial<User> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const getKeyValue = (keys: string[]): string => {
    for (const key of keys) {
      const lowerKey = key.toLowerCase().trim();
      for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();
        if (lowerLine.startsWith(lowerKey)) {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const val = line.substring(colonIdx + 1).trim();
            if (val) return val;
          }
        }
      }
    }
    return '';
  };

  const getRegexMatch = (regex: RegExp): string => {
    const match = text.match(regex);
    return match && match[1] ? match[1].trim() : '';
  };

  // Line-by-line key matching with fallback regex & sanitization
  const rawName =
    getKeyValue(['Name:', 'Student Name:']) ||
    getRegexMatch(/(?:^|\n)(?:student\s*name|name)[:\s]+([A-Za-z\s\.']+?)(?=\n|email|phone|roll|dept|\d|$)/i) ||
    filename.replace(/\.pdf$|\.txt$/i, '').replace(/[-_]/g, ' ');

  const name = sanitizeExtractedName(rawName) || 'Ram';
  const username = generateCleanUsername(name);

  const rollNo =
    getKeyValue(['Roll Number:', 'Roll No:', 'Register Number:']) ||
    getRegexMatch(/(?:roll\s*number|roll\s*no|roll)[:\s]+([A-Z0-9\-]+)/i);

  const email =
    getKeyValue(['Email:']) ||
    getRegexMatch(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

  const department =
    getKeyValue(['Department:', 'Dept:']) ||
    getRegexMatch(/department[:\s]+([A-Za-z\s&]+?)(?=\n|semester|gpa|year|phone|email|$)/i);

  const semester =
    getKeyValue(['Semester:']) ||
    getRegexMatch(/semester[:\s]+([0-9a-zA-Z\s]+?)(?=\n|academic|department|gpa|year|$)/i);

  const academicYear =
    getKeyValue(['Academic Year:', 'Session:']) ||
    getRegexMatch(/academic\s*year[:\s]+([\d\s\-]+)/i);

  const section =
    getKeyValue(['Grade / Section:', 'Section:', 'Grade:']) ||
    getRegexMatch(/(?:grade\s*\/\s*section|section)[:\s]+([A-Za-z0-9\s]+)/i);

  const phone =
    getKeyValue(['Phone:', 'Contact:']) ||
    getRegexMatch(/(?:^|\n)phone[:\s]+(\+?[\d\s\-\(\)]{8,15})/i);

  const guardianName =
    getKeyValue(['Guardian Name:', 'Parent Name:']) ||
    getRegexMatch(/guardian\s*name[:\s]+([A-Za-z\s\.']+)/i);

  const guardianContact =
    getKeyValue(['Guardian Phone:', 'Guardian Contact:', 'Parent Phone:']) ||
    getRegexMatch(/guardian\s*(?:phone|contact)[:\s]+(\+?[\d\s\-\(\)]{8,15})/i);

  const bloodGroup =
    getKeyValue(['Blood Group:']) ||
    getRegexMatch(/blood\s*group[:\s]+([A-Z0-9\+\-]+)/i);

  const residenceTypeRaw =
    getKeyValue(['Residence Type:']) ||
    getRegexMatch(/residence\s*type[:\s]+([A-Za-z\s]+)/i);

  const residenceType: 'Day Scholar' | 'Hosteler' =
    residenceTypeRaw.toLowerCase().includes('hostel') ? 'Hosteler' : 'Day Scholar';

  const mentorName =
    getKeyValue(['Mentor Name:', 'Faculty Mentor:']) ||
    getRegexMatch(/mentor\s*name[:\s]+([A-Za-z\s\.']+)/i);

  return {
    role: 'student',
    name,
    username,
    email: email || 'ram.cs23@bitsathy.ac.in',
    phone: phone || '+91 98765 43210',
    studentId: rollNo ? `STU-${rollNo}` : `STU-2023-123`,
    rollNo: rollNo || '2023-123',
    department: department || 'Computer Science & Engineering',
    semester: semester || 'Semester 5',
    academicYear: academicYear || '2023 - 2027',
    section: section || 'Section A',
    guardianName: guardianName || 'Kumar',
    guardianContact: guardianContact || '+91 98765 43211',
    bloodGroup: bloodGroup || 'B+',
    residenceType,
    mentorName: mentorName || 'Dr. Priya Sharma',
  };
}

/**
 * Extract structured Teacher details from raw text (Line-by-line + Regex)
 */
export function extractTeacherFromText(text: string, filename: string): Partial<User> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const getKeyValue = (keys: string[]): string => {
    for (const key of keys) {
      const lowerKey = key.toLowerCase().trim();
      for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();
        if (lowerLine.startsWith(lowerKey)) {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const val = line.substring(colonIdx + 1).trim();
            if (val) return val;
          }
        }
      }
    }
    return '';
  };

  const getRegexMatch = (regex: RegExp): string => {
    const match = text.match(regex);
    return match && match[1] ? match[1].trim() : '';
  };

  const rawName =
    getKeyValue(['Faculty Name:', 'Teacher Name:', 'Name:']) ||
    getRegexMatch(/(?:^|\n)(?:faculty\s*name|teacher\s*name|name)[:\s]+([A-Za-z\s\.']+?)(?=\n|email|phone|employee|title|dept|\d|$)/i) ||
    filename.replace(/\.pdf$|\.txt$/i, '').replace(/[-_]/g, ' ');

  const rawExtractedName = sanitizeExtractedName(rawName) || 'Dr. Robert Vance';
  const name = formatTeacherName(rawExtractedName);
  const username = generateCleanUsername(name);

  const email = getKeyValue(['Email:']);
  const phone = getKeyValue(['Phone:', 'Contact:']);
  const employeeId = getKeyValue(['Employee ID:', 'Emp ID:', 'Faculty ID:']);
  const title = getKeyValue(['Title:', 'Designation:']);
  const department = getKeyValue(['Department:', 'Dept:']);
  const officeHours = getKeyValue(['Office Hours:']);
  const subjectsRaw = getKeyValue(['Subjects Taught:', 'Subjects:']);

  return {
    role: 'teacher',
    name,
    username,
    email: email || `${username}@bitsathy.ac.in`,
    phone: phone || '+1 (555) 000-0000',
    employeeId: employeeId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || 'Senior Professor',
    department: department || 'Department of Computer Science',
    officeHours: officeHours || 'Mon & Wed 2:00 PM - 4:00 PM',
    subjectsTaught: subjectsRaw ? subjectsRaw.split(',').map((s) => s.trim()) : ['Computer Science Fundamentals'],
  };
}

/**
 * Generates and downloads a sample text PDF file for student or teacher registration template
 */
export function downloadTemplatePdf(role: 'student' | 'teacher'): void {
  const content =
    role === 'student'
      ? `================================================================================
INSTITUTIONAL STUDENT REGISTRATION MASTER TEMPLATE
================================================================================
Name: Ram
Roll Number: 2023-123
Email: ram.cs23@bitsathy.ac.in
Department: Computer Science & Engineering
Semester: Semester 5
Academic Year: 2023 - 2027
Grade / Section: Section A
Phone: +91 98765 43210
Guardian Name: Kumar
Guardian Phone: +91 98765 43211
Blood Group: B+
Residence Type: Day Scholar
Mentor Name: Dr. Priya Sharma
================================================================================`
      : `================================================================================
INSTITUTIONAL FACULTY REGISTRATION MASTER TEMPLATE
================================================================================
Faculty Name: Dr. Robert Vance
Email: robert.vance@school.edu
Phone: +1 (555) 876-5432
Employee ID: FAC-9042
Title: Senior Professor & Department Chair
Department: Department of Computer Science & Engineering
Office Hours: Mon & Wed 2:00 PM - 4:00 PM
Subjects Taught: AP Calculus BC, Advanced Algorithms, Data Structures
================================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${role}_registration_template.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download Printable Master Results PDF Template
 */
export function downloadOverallResultsPdfTemplate(): void {
  const content = `=====================================================================
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
=====================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'overall_academic_results_template.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download Printable Master Hall Tickets PDF Template
 */
export function downloadHallTicketsPdfTemplate(): void {
  const content = `=================================================================================
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

INSTRUCTIONS TO CANDIDATES:
1. Verify register number of 10 characters.
2. Write register number and subject codes clearly on answer book.
3. Take seats 15 minutes before examination commencement.
4. Keep Hall Ticket in safe custody for all correspondences.
=================================================================================

HALL TICKET MASTER REGISTRATION ENTRY #2:
---------------------------------------------------------------------------------
Register Number / Roll No: CCAWBCM142
Programme: B.Com (Self Financing)
Semester: V (Fifth Semester)
Name of Candidate: MURAT GÜRSOY
Date of Birth: 14/08/2003
Exam Center: Christ College Main Examination Hall (Block B)
Seat Number: Seat B-08
Scheduled Window: Nov 15 - Nov 28, 2024

SUBJECT SCHEDULE:
1. CC19UPSY5D01 | Psychology and Personal Growth
2. CC19UBCM5B07 | Accounting for Management
3. CC19UBCM5B08 | Business Research Methods
4. CC19UBCM5B09 | Income Tax Law and Accounts
5. CC19UBCM5B10 | Financial Markets and Services
6. CC19UBCM5B11 | Financial Management
=================================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'christ_college_hall_tickets_template.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
