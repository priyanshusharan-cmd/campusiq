// Campora — Common Types

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5; // Mon=0, Sat=5

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_SHORT_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type Priority = 'low' | 'medium' | 'high';
export type ClassType = 'lecture' | 'lab' | 'tutorial';
export type SubjectType = 'theory' | 'lab' | 'elective';

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
}

// Generic ID type
export type ID = string;

// For generating unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
