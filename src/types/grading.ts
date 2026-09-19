// Campusiq — Grading Types

import type { ID } from './common';

export interface GradeBoundary {
  id: ID;
  minMarks: number;
  maxMarks: number;
  gradeLetter: string;
  gradePoints: number;
}

export interface GradeScheme {
  id: ID;
  name: string; // e.g., "10-Point Absolute (90=S)"
  boundaries: GradeBoundary[];
}

export type AssessmentComponentType = 'standalone' | 'grouped';
export type ComponentSelectionRule = 'all' | 'best_1' | 'best_2' | 'best_3';

export interface AssessmentComponent {
  id: ID;
  name: string;
  type: AssessmentComponentType;
  maxMarks: number;
  weight: number; // Contribution out of 100 or total course marks
  earnedMarks?: number; // undefined means not yet taken/assigned
  selectionRule?: ComponentSelectionRule; // Used if type is 'grouped'
  children?: AssessmentComponent[]; // Used if type is 'grouped'
}

export const DEFAULT_GRADE_SCHEME: GradeScheme = {
  id: 'default-absolute',
  name: 'Standard 10-Point Absolute',
  boundaries: [
    { id: 'b1', minMarks: 90.0, maxMarks: 100.0, gradeLetter: 'S', gradePoints: 10 },
    { id: 'b2', minMarks: 80.0, maxMarks: 89.99, gradeLetter: 'A', gradePoints: 9 },
    { id: 'b3', minMarks: 70.0, maxMarks: 79.99, gradeLetter: 'B', gradePoints: 8 },
    { id: 'b4', minMarks: 60.0, maxMarks: 69.99, gradeLetter: 'C', gradePoints: 7 },
    { id: 'b5', minMarks: 50.0, maxMarks: 59.99, gradeLetter: 'D', gradePoints: 6 },
    { id: 'b6', minMarks: 40.0, maxMarks: 49.99, gradeLetter: 'E', gradePoints: 4 },
    { id: 'b7', minMarks: 0.0, maxMarks: 39.99, gradeLetter: 'F', gradePoints: 0 },
  ],
};
