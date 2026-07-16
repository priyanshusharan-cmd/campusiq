// Campora — Timetable Types

import type { ID, DayOfWeek, ClassType } from './common';

export interface TimetableEntry {
  id: ID;
  subjectId: ID;
  dayOfWeek: DayOfWeek; // For recurring weekly classes
  date?: string;        // "YYYY-MM-DD" For specific extra classes
  startTime: string;    // "09:00"
  endTime: string;      // "10:00"
  room: string;
  type: ClassType;
  color?: string; // Optional custom color for the class
}

// Enriched entry with subject data (used in UI)
export interface TimetableEntryWithSubject extends TimetableEntry {
  subjectName: string;
  subjectShortName: string;
  subjectColor: string;
  faculty: string;
}
