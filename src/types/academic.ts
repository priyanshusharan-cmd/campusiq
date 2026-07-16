// Campora — Academic Types

import type { ID } from './common';

export type GradeLetter = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';

export interface GradeEntry {
  id: ID;
  semesterId: ID;
  subjectId: ID;
  grade: GradeLetter;
  gradePoint: number;
  credits: number;
}

export interface Semester {
  id: ID;
  name: string;         // "Semester 3"
  number: number;
  startDate?: string;
  endDate?: string;
  sgpa?: number;
  totalCredits?: number;
  isCurrent: boolean;
}

// Indian 10-point CGPA Scale
export const GRADE_SCALE: Record<GradeLetter, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
} as const;

export const GRADE_LETTERS: GradeLetter[] = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

export function getGradeColor(grade: GradeLetter): string {
  switch (grade) {
    case 'O': return '#10B981';   // Emerald
    case 'A+': return '#059669';  // Emerald dark
    case 'A': return '#0EA5E9';   // Sky
    case 'B+': return '#7C5CFC'; // Violet
    case 'B': return '#F59E0B';   // Amber
    case 'C': return '#F97316';   // Orange
    case 'P': return '#EF4444';   // Red
    case 'F': return '#DC2626';   // Red dark
  }
}
