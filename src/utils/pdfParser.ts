import { User } from '../types';

/**
 * Utility to extract raw text from PDF ArrayBuffer / File using text stream parsing
 * or regex matching for standard key-value patterns.
 */
export async function parsePdfText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        // Simple text extraction from PDF stream bytes
        let text = '';
        for (let i = 0; i < bytes.length; i++) {
          const char = String.fromCharCode(bytes[i]);
          text += char;
        }

        // Clean printable ASCII text blocks extracted from PDF
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
    /mobile[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
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
    /sem[:\s]+([0-9a-zA-Z\s]+?)(?:dept|gpa|$)/i,
  ]);

  const gpaStr = findMatch([
    /gpa[:\s]+([0-9]\.[0-9]{1,2})/i,
    /cgpa[:\s]+([0-9]\.[0-9]{1,2})/i,
  ]);

  const guardianName = findMatch([
    /guardian[:\s]+([A-Za-z\s\.']+?)(?:contact|phone|address|$)/i,
    /father[:\s]+([A-Za-z\s\.']+?)(?:contact|phone|address|$)/i,
  ]);

  const guardianContact = findMatch([
    /guardian\s*contact[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
    /father\s*phone[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
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
    semester: semester || '5th Semester',
    academicYear: `${new Date().getFullYear()} - ${new Date().getFullYear() + 4}`,
    gpa: gpaStr ? parseFloat(gpaStr) : 3.8,
    guardianName: guardianName || '',
    guardianContact: guardianContact || '',
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
    /faculty name[:\s]+([A-Za-z\s\.']+?)(?:email|phone|employee|\d|$)/i,
  ]) || filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  const email = findMatch([
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ]);

  const phone = findMatch([
    /phone[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
    /contact[:\s]+(\+?[\d\s\-\(\)]{8,15})/i,
  ]);

  const employeeId = findMatch([
    /(?:employee\s*id|emp\s*id|faculty\s*id)[:\s]+([A-Z0-9\-]+)/i,
    /(FAC-\d{4})/i,
  ]);

  const title = findMatch([
    /title[:\s]+([A-Za-z\s&]+?)(?:department|office|email|$)/i,
    /designation[:\s]+([A-Za-z\s&]+?)(?:department|office|email|$)/i,
  ]);

  const department = findMatch([
    /department[:\s]+([A-Za-z\s&]+?)(?:title|office|phone|email|$)/i,
    /dept[:\s]+([A-Za-z\s&]+?)(?:title|office|$)/i,
  ]);

  const officeHours = findMatch([
    /office\s*hours[:\s]+([A-Za-z0-9\s:\-\.]+?)(?:department|subjects|$)/i,
  ]);

  return {
    role: 'teacher',
    name: name || 'Extracted Faculty',
    username: (name || 'faculty').replace(/[^a-zA-Z0-9]/g, ''),
    email: email || `${(name || 'faculty').toLowerCase().replace(/\s+/g, '.')}@school.edu`,
    phone: phone || '+1 (555) 000-0000',
    employeeId: employeeId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    title: title || 'Assistant Professor',
    department: department || 'Department of Computer Science',
    officeHours: officeHours || 'Mon & Wed 2:00 PM - 4:00 PM',
    subjectsTaught: ['Computer Science Fundamentals'],
  };
}
