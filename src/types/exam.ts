// Campora — Exam Types

import type { ID } from './common';

export type ExamType = 'midsem' | 'endsem' | 'quiz' | 'viva' | 'practical' | 'assignment';

export interface Exam {
  id: ID;
  subjectId: ID;
  type: ExamType;
  date: string;          // "2026-07-15"
  startTime?: string;    // "09:00"
  room?: string;
  notes?: string;
  syllabus?: string;
}

export function getExamTypeLabel(type: ExamType): string {
  switch (type) {
    case 'midsem': return 'Mid Semester';
    case 'endsem': return 'End Semester';
    case 'quiz': return 'Quiz';
    case 'viva': return 'Viva';
    case 'practical': return 'Practical';
    case 'assignment': return 'Assignment';
  }
}
