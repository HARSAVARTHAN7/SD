import { User } from '../types';

/**
 * Format a teacher name to strictly have 'Dr.', 'Ms.', or 'Mrs.' title prefix
 */
export function formatTeacherName(rawName: string): string {
  if (!rawName) return 'Dr. Faculty Member';
  let trimmed = rawName.trim();

  // If it starts with Teacher / Prof, strip it
  trimmed = trimmed.replace(/^(teacher|prof|professor)\.?\s*/i, '');

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('dr.') || lower.startsWith('ms.') || lower.startsWith('mrs.')) {
    return trimmed;
  }
  if (lower.startsWith('dr ')) {
    return 'Dr. ' + trimmed.slice(3).trim();
  }
  if (lower.startsWith('ms ')) {
    return 'Ms. ' + trimmed.slice(3).trim();
  }
  if (lower.startsWith('mrs ')) {
    return 'Mrs. ' + trimmed.slice(4).trim();
  }

  // Default prefix to Dr.
  return `Dr. ${trimmed}`;
}

/**
 * Generate teacher email in format 'name.bitsathy.ac.in'
 * and handle duplicate teacher names by adding an initial (e.g. 'Dr. Sarah Jenkins A.')
 */
export function generateTeacherEmailAndName(
  rawName: string,
  existingUsers: User[],
): { name: string; email: string; username: string } {
  const formattedName = formatTeacherName(rawName);

  // Extract base name without title prefix
  const baseName = formattedName.replace(/^(dr|ms|mrs)\.\s*/i, '').trim();

  // Convert base name to dot format e.g. "sarah.jenkins"
  const cleanHandle = baseName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  const baseEmail = `${cleanHandle}@bitsathy.ac.in`;

  // Check if another teacher has the exact same handle/email
  const isDuplicate = existingUsers.some(
    (u) =>
      u.role === 'teacher' &&
      (u.email?.toLowerCase() === baseEmail ||
        u.name?.toLowerCase() === formattedName.toLowerCase()),
  );

  if (isDuplicate) {
    const initials = ['A', 'B', 'C', 'D', 'E', 'K', 'M', 'R', 'S', 'V'];
    for (const init of initials) {
      const testName = `${formattedName} ${init}.`;
      const testEmail = `${cleanHandle}.${init.toLowerCase()}@bitsathy.ac.in`;
      const match = existingUsers.some(
        (u) =>
          u.role === 'teacher' &&
          (u.email?.toLowerCase() === testEmail ||
            u.name?.toLowerCase() === testName.toLowerCase()),
      );
      if (!match) {
        return {
          name: testName,
          email: testEmail,
          username: testEmail.split('@')[0],
        };
      }
    }
  }

  return {
    name: formattedName,
    email: baseEmail,
    username: cleanHandle,
  };
}

/**
 * Format CGPA value. Returns "Nil" if no CGPA or default state.
 */
export function formatCgpaDisplay(cgpa?: number | null): string {
  if (cgpa === undefined || cgpa === null || cgpa === 0 || isNaN(cgpa)) {
    return 'Nil';
  }
  return cgpa.toFixed(2);
}

/**
 * Calculate total working days in an academic term period (excluding Sundays).
 * Supports YYYY-MM-DD, MM/DD/YYYY, and standard date strings seamlessly.
 */
export function calculateTermWorkingDays(startDateStr?: string, endDateStr?: string): number {
  if (!startDateStr || !endDateStr) return 30;

  const parseToLocalDate = (str: string): Date | null => {
    if (!str) return null;
    const clean = str.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/').map(Number);
      if (parts.length === 3) {
        if (parts[2] > 1000) return new Date(parts[2], parts[0] - 1, parts[1]);
        if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (clean.includes('-')) {
      const parts = clean.split('T')[0].split('-').map(Number);
      if (parts.length === 3) {
        if (parts[0] > 1000) return new Date(parts[0], parts[1] - 1, parts[2]);
        if (parts[2] > 1000) return new Date(parts[2], parts[0] - 1, parts[1]);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseToLocalDate(startDateStr);
  const end = parseToLocalDate(endDateStr);

  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 30;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0) count++; // Exclude ONLY Sundays (0 = Sunday)
    cur.setDate(cur.getDate() + 1);
  }

  return count > 0 ? count : 30;
}
