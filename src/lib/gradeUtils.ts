// Campora — GPA Calculation Utilities

import type { GradeEntry, GradeLetter } from '@/types';

// Calculate SGPA from grade entries
export function calcSGPA(entries: GradeEntry[]): number {
  if (entries.length === 0) return 0;

  let totalCredits = 0;
  let totalWeightedPoints = 0;

  for (const entry of entries) {
    totalCredits += entry.credits;
    totalWeightedPoints += entry.gradePoint * entry.credits;
  }

  if (totalCredits === 0) return 0;
  return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
}

// Calculate CGPA from array of SGPAs with credits
export function calcCGPA(semesters: { sgpa: number; credits: number }[]): number {
  const validSemesters = semesters.filter(s => s.sgpa > 0 && s.credits > 0);
  if (validSemesters.length === 0) return 0;

  let totalCredits = 0;
  let totalWeightedPoints = 0;

  for (const sem of validSemesters) {
    totalCredits += sem.credits;
    totalWeightedPoints += sem.sgpa * sem.credits;
  }

  if (totalCredits === 0) return 0;
  return Math.round((totalWeightedPoints / totalCredits) * 100) / 100;
}

// Convert CGPA to percentage (approximate)
export function cgpaToPercentage(cgpa: number): number {
  return Math.round((cgpa - 0.75) * 10 * 100) / 100;
}

// Get GPA quality label
export function getGPALabel(gpa: number): string {
  if (gpa >= 9.5) return 'Outstanding';
  if (gpa >= 9.0) return 'Excellent';
  if (gpa >= 8.0) return 'Very Good';
  if (gpa >= 7.0) return 'Good';
  if (gpa >= 6.0) return 'Above Average';
  if (gpa >= 5.0) return 'Average';
  if (gpa >= 4.0) return 'Below Average';
  return 'Needs Improvement';
}

// Get GPA emoji
export function getGPAEmoji(gpa: number): string {
  if (gpa >= 9.0) return '🌟';
  if (gpa >= 8.0) return '📈';
  if (gpa >= 7.0) return '👍';
  if (gpa >= 6.0) return '📊';
  if (gpa >= 5.0) return '💪';
  return '📚';
}

// Get GPA color
export function getGPAColor(gpa: number): string {
  if (gpa >= 9.0) return '#10B981';
  if (gpa >= 8.0) return '#0EA5E9';
  if (gpa >= 7.0) return '#7C5CFC';
  if (gpa >= 6.0) return '#F59E0B';
  if (gpa >= 5.0) return '#F97316';
  return '#F43F5E';
}

// Calculate total credits from grade entries
export function calcTotalCredits(entries: GradeEntry[]): number {
  return entries.reduce((sum, e) => sum + e.credits, 0);
}

// Get grade point from letter
export function gradeToPoint(grade: GradeLetter): number {
  const scale: Record<GradeLetter, number> = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0,
  };
  return scale[grade];
}
