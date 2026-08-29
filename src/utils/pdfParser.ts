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

/**
 * Generate and trigger download for sample PDF registration templates
 */
export function downloadTemplatePdf(type: 'student' | 'teacher') {
  let filename = '';
  let lines: string[] = [];

  if (type === 'student') {
    filename = 'Student_Registration_Template.pdf';
    lines = [
      'STUDENT REGISTRATION FORM TEMPLATE',
      '--------------------------------------------------',
      'Name: Jane Doe',
      'Email: jane.doe@school.edu',
      'Phone: +1 (555) 234-5678',
      'Student ID: STU-2026-401',
      'Roll No: 2026-401',
      'Department: Computer Science & Engineering',
      'Semester: 5th Semester',
      'GPA: 3.85',
      'Guardian Name: Robert Doe',
      'Guardian Contact: +1 (555) 987-6543',
      'Blood Group: O+ Positive',
      'Residence Type: Day Scholar',
      'Bus Route: Route #14 - North City Express',
    ];
  } else {
    filename = 'Teacher_Registration_Template.pdf';
    lines = [
      'FACULTY REGISTRATION FORM TEMPLATE',
      '--------------------------------------------------',
      'Name: Dr. Sarah Jenkins',
      'Email: sarah.jenkins@school.edu',
      'Phone: +1 (555) 782-9912',
      'Employee ID: FAC-7742',
      'Title: Senior Professor & Department Lead',
      'Department: Department of Computer Science',
      'Office Hours: Mon & Thu 2:00 PM - 4:30 PM',
      'Subjects Taught: AP Calculus BC, Advanced Algorithms',
    ];
  }

  const streamLines = lines.map((l) => `(${l.replace(/[()]/g, '')}) Tj T*`).join('\n');

  const pdfRaw = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length ${streamLines.length + 100}>> stream
BT
/F1 12 Tf
50 750 Td
16 TL
${streamLines}
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000311 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
450
%%EOF`;

  const blob = new Blob([pdfRaw], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate and trigger download for sample Overall Results PDF template
 */
export function downloadOverallResultsPdfTemplate() {
  const filename = 'Overall_Academic_Results_Master_Template.pdf';
  const lines = [
    'OVERALL ACADEMIC RESULTS MASTER PUBLICATION',
    '==================================================',
    'Student Name: Murat Gursoy',
    'Roll No: 2024-418',
    'Semester: 5th Semester',
    'GPA: 3.85',
    'AP Calculus BC [MATH-401]: 96% (Grade A)',
    'Classical Physics [PHYS-302]: 92% (Grade A-)',
    'Advanced CS [CS-205]: 98% (Grade A+)',
    '--------------------------------------------------',
    'Student Name: Emma Watson',
    'Roll No: 2024-419',
    'Semester: 5th Semester',
    'GPA: 3.92',
    'AP Calculus BC [MATH-401]: 98% (Grade A+)',
    'Classical Physics [PHYS-302]: 95% (Grade A)',
    'Advanced CS [CS-205]: 94% (Grade A)',
    '--------------------------------------------------',
    'Student Name: Lucas Vance',
    'Roll No: 2024-420',
    'Semester: 5th Semester',
    'GPA: 3.65',
    'AP Calculus BC [MATH-401]: 87% (Grade B+)',
    'Advanced CS [CS-205]: 91% (Grade A-)',
    '==================================================',
  ];

  const streamLines = lines.map((l) => `(${l.replace(/[()]/g, '')}) Tj T*`).join('\n');

  const pdfRaw = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length ${streamLines.length + 100}>> stream
BT
/F1 12 Tf
50 750 Td
16 TL
${streamLines}
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000311 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
450
%%EOF`;

  const blob = new Blob([pdfRaw], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
