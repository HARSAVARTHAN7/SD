import { User, StudentResultReport, SemesterResult, GradeItem, HallTicketInfo } from '../types';

/**
 * Utility to extract raw text from PDF ArrayBuffer / File using text stream parsing
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

        const cleanText = text
          .replace(/[^\x20-\x7E\n\r]/g, ' ')
          .replace(/\s+/g, ' ');

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
 * Extract structured Student details from raw text
 */
export function extractStudentFromText(text: string, filename: string): Partial<User> {
  const findMatch = (regexes: RegExp[]): string => {
    for (const r of regexes) {
      const match = text.match(r);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  const name = findMatch([
    /name[:\s]+([A-Za-z\s\.']+?)(?:email|phone|student|roll|dept|id|\d|$)/i,
    /student name[:\s]+([A-Za-z\s\.']+?)(?:email|phone|student|roll|\d|$)/i,
  ]) || filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  const email = findMatch([
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ]);

  const phone = findMatch([
    /phone[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
    /contact[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
  ]);

  const studentId = findMatch([
    /(?:student\s*id|stu\s*id|id)[:\s]+([A-Z0-9\-]+)/i,
    /(STU-\d{4}-\d+)/i,
  ]);

  const rollNo = findMatch([
    /(?:roll\s*no|roll\s*number|roll)[:\s]+([A-Z0-9\-]+)/i,
    /(\d{4}-\d{3,4})/i,
  ]);

  const department = findMatch([
    /department[:\s]+([A-Za-z\s&]+?)(?:semester|gpa|year|phone|email|$)/i,
    /dept[:\s]+([A-Za-z\s&]+?)(?:semester|gpa|year|$)/i,
  ]);

  const semester = findMatch([
    /semester[:\s]+([0-9a-zA-Z\s]+?)(?:department|gpa|year|$)/i,
  ]);

  return {
    role: 'student',
    name: name || 'Extracted Student',
    username: (name || 'student').replace(/[^a-zA-Z0-9]/g, ''),
    email: email || `${(name || 'student').toLowerCase().replace(/\s+/g, '.')}@school.edu`,
    phone: phone || '+1 (555) 000-0000',
    studentId: studentId || `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    rollNo: rollNo || `${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    department: department || 'Computer Science & Engineering',
    semester: semester || 'Semester 5',
    residenceType: 'Day Scholar',
  };
}

/**
 * Extract structured Teacher details from raw text
 */
export function extractTeacherFromText(text: string, filename: string): Partial<User> {
  const findMatch = (regexes: RegExp[]): string => {
    for (const r of regexes) {
      const match = text.match(r);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  const name = findMatch([
    /name[:\s]+([A-Za-z\s\.']+?)(?:email|phone|employee|title|dept|\d|$)/i,
  ]) || filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  const email = findMatch([
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ]);

  const employeeId = findMatch([
    /(?:employee\s*id|emp\s*id|faculty\s*id)[:\s]+([A-Z0-9\-]+)/i,
  ]);

  return {
    role: 'teacher',
    name: name || 'Extracted Faculty',
    username: (name || 'faculty').replace(/[^a-zA-Z0-9]/g, ''),
    email: email || `${(name || 'faculty').toLowerCase().replace(/\s+/g, '.')}@school.edu`,
    employeeId: employeeId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Department of Computer Science',
    subjectsTaught: ['Computer Science Fundamentals'],
  };
}

/**
 * Generates and downloads a sample text PDF file for student or teacher registration template
 */
export function downloadTemplatePdf(role: 'student' | 'teacher'): void {
  const content = role === 'student'
    ? `=====================================================
OFFICIAL STUDENT REGISTRATION TEMPLATE (EDU-PORTAL)
=====================================================
Student Name: Alex Johnson
Email: alex.johnson@school.edu
Phone: +1 (555) 234-5678
Student ID: STU-2024-892
Roll Number: 2024-421
Department: Computer Science & Engineering
Semester: 5th Semester
Academic Year: 2024 - 2028
Guardian Name: Robert Johnson
Guardian Contact: +1 (555) 987-6543
Blood Group: O+
Residence Type: Day Scholar
Bus Route: Route #14 - North Express
Bus Number: BUS-042
Boarding Stop: Central Square Stop
=====================================================`
    : `=====================================================
OFFICIAL FACULTY REGISTRATION TEMPLATE (EDU-PORTAL)
=====================================================
Faculty Name: Dr. Robert Vance
Email: robert.vance@school.edu
Phone: +1 (555) 876-5432
Employee ID: FAC-9042
Title: Senior Professor & Department Chair
Department: Department of Computer Science
Office Hours: Mon/Wed 2:00 PM - 4:00 PM
Subjects Taught: AP Calculus BC, Advanced Algorithms, Machine Learning
=====================================================`;

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
