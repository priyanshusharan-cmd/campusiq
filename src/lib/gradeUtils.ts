// CampusIQ — GPA Calculation Utilities

import type { GradeEntry, GradeLetter, Subject, GradeScheme } from '@/types';


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
  const validSemesters = semesters.filter(s => s.sgpa >= 0 && s.credits > 0);
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

// ─── Grading Settings Interface ─────────────────────────────────────────────────
// This is the shape of settings that the calculation functions expect.

export interface GradingSettings {
  // Theory config
  cieCount: number;
  cieBestOf: number;
  cieMaxMarks: number;
  aatEnabled: boolean;
  aatMaxMarks: number;
  maxInternalMarks: number;
  maxExternalMarks: number;

  // Practical config
  labCieCount: number;
  labCieBestOf: number;
  labCieMaxMarks: number;
  labAatEnabled: boolean;
  labAatMaxMarks: number;
  labComponentMarks: number;
  labMaxInternalMarks: number;
  labMaxExternalMarks: number;
}

// ─── Calculate Aggregated Internal Marks ────────────────────────────────────────
// Handles both Theory and Practical subjects with proper clamping to max marks.

export function calculateAggregatedInternal(
  sub: Subject,
  settings: GradingSettings
): number {
  let total = 0;

  // If the user just entered a direct internal total (no detailed marks), use it.
  const hasNoDetailedMarks =
    (!sub.cieMarks || sub.cieMarks.length === 0) &&
    (!sub.labInternalMarks || sub.labInternalMarks.length === 0) &&
    sub.aatMarks === undefined;
  if (sub.internalMarks !== undefined && hasNoDetailedMarks) {
    return sub.internalMarks;
  }

  const isLab = sub.type === 'lab';

  // ── CIE Component ──
  const cieCount = isLab ? settings.labCieCount : settings.cieCount;
  const cieBestOf = isLab ? settings.labCieBestOf : settings.cieBestOf;
  const cieMax = isLab ? settings.labCieMaxMarks : settings.cieMaxMarks;

  if (cieCount > 0 && sub.cieMarks && sub.cieMarks.length > 0) {
    const validScores = sub.cieMarks
      .filter(s => s !== undefined && !isNaN(s))
      .map(s => Math.min(cieMax, Math.max(0, s))); // Clamp to bounds

    // Sort descending, take best N
    validScores.sort((a, b) => b - a);
    const topScores = validScores.slice(0, Math.min(cieBestOf, validScores.length));

    if (topScores.length > 0) {
      total += topScores.reduce((a, b) => a + b, 0);
    }
  }

  // ── AAT Component ──
  const aatEnabled = isLab ? settings.labAatEnabled : settings.aatEnabled;
  const aatMax = isLab ? settings.labAatMaxMarks : settings.aatMaxMarks;
  if (aatEnabled && sub.aatMarks !== undefined && !isNaN(sub.aatMarks)) {
    total += Math.min(aatMax, Math.max(0, sub.aatMarks));
  }

  // ── Lab Component (Practical subjects only) ──
  if (isLab) {
    // Lab internal marks — just a single lab exam mark
    if (sub.labInternalMarks && sub.labInternalMarks.length > 0) {
      const labMark = sub.labInternalMarks[0];
      if (labMark !== undefined && !isNaN(labMark)) {
        total += Math.min(settings.labComponentMarks, Math.max(0, labMark));
      }
    }
    return Math.min(settings.labMaxInternalMarks, Math.round(total * 100) / 100);
  }

  return Math.min(settings.maxInternalMarks, Math.round(total * 100) / 100);
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
export function gradeToPoint(grade: GradeLetter, scheme?: GradeScheme): number {
  if (scheme) {
    const boundary = scheme.boundaries.find(b => b.gradeLetter === grade);
    if (boundary) return boundary.gradePoints;
  }
  
  const scale: Record<string, number> = {
    'S': 10, 'O': 10, 'A+': 9, 'A': 9, 'B+': 8, 'B': 8, 'C': 7, 'D': 6, 'E': 4, 'P': 4, 'F': 0,
  };
  return scale[grade] ?? 0;
}

export function marksToGradePoint(marks: number, scheme?: GradeScheme): number {
  if (scheme) {
    const { getGradeBoundary } = require('./gradingEngine');
    return getGradeBoundary(scheme, marks).gradePoints;
  }
  
  if (marks >= 90) return 10;
  if (marks >= 80) return 9;
  if (marks >= 70) return 8;
  if (marks >= 60) return 7;
  if (marks >= 50) return 6;
  if (marks >= 40) return 4;
  return 0;
}

export function getMinMarksForGradePoint(gp: number, scheme: GradeScheme): number {
  const sorted = [...scheme.boundaries].sort((a, b) => b.gradePoints - a.gradePoints);
  const exact = sorted.find(b => b.gradePoints === gp);
  if (exact) return exact.minMarks;
  
  for (const b of sorted) {
    if (gp >= b.gradePoints) {
      return b.minMarks; // Approximation for gaps
    }
  }
  return 0;
}

export interface SubjectGoalTarget {
  subjectId: string;
  internalMarks: number;
  labMarks: number;
  credits: number;
  targetGradePoint: number;
  requiredExternal: number;
  totalSubjectMax: number;
}

// Calculate the easiest path to hit a target SGPA
export function calculateRequiredExternals(
  subjects: { id: string; type: string; internalMarks: number; labMarks: number; credits: number }[],
  targetSGPA: number,
  settings: GradingSettings,
  gradeScheme: GradeScheme
): SubjectGoalTarget[] {
  if (subjects.length === 0) return [];
  
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const requiredTotalPoints = targetSGPA * totalCredits;
  
  // Start everyone at minimum pass (Grade Point 4)
  let targets = subjects.map(s => {
    const totalSubjectMax = s.type === 'lab' 
      ? (settings.labMaxInternalMarks + settings.labMaxExternalMarks) 
      : (settings.maxInternalMarks + settings.maxExternalMarks);
      
    const minPercent = getMinMarksForGradePoint(4, gradeScheme); // Starting point (passing grade)
    const minRequiredTotalMarks = Math.ceil((minPercent / 100) * totalSubjectMax);
    
    // Note: s.labMarks is kept for legacy compatibility but is now handled within internalMarks
    const existingMarks = s.internalMarks + s.labMarks;
    
    return {
      subjectId: s.id,
      internalMarks: s.internalMarks,
      labMarks: s.labMarks,
      credits: s.credits,
      targetGradePoint: 4,
      requiredExternal: Math.max(0, minRequiredTotalMarks - existingMarks),
      totalSubjectMax,
      type: s.type
    };
  });
  
  let currentTotalPoints = targets.reduce((sum, t) => sum + (t.targetGradePoint * t.credits), 0);
  
  // Greedy approach: upgrade the subject that requires the least additional marks
  while (currentTotalPoints < requiredTotalPoints) {
    let bestSubjectIndex = -1;
    let minCost = Infinity;
    
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (t.targetGradePoint < 10) {
        const nextGradePoint = t.targetGradePoint + 1;
        
        const nextMinPercent = getMinMarksForGradePoint(nextGradePoint, gradeScheme);
        const nextMinTotalMarks = Math.ceil((nextMinPercent / 100) * t.totalSubjectMax);
        const existingMarks = t.internalMarks + t.labMarks;
        const requiredExtForNext = Math.max(0, nextMinTotalMarks - existingMarks);
        
        const maxExternalForSubject = t.type === 'lab' ? settings.labMaxExternalMarks : settings.maxExternalMarks;
        
        // If this upgrade requires more external marks than mathematically possible, skip it
        if (requiredExtForNext > maxExternalForSubject) {
          continue;
        }
        
        const cost = requiredExtForNext - t.requiredExternal;
        
        // We prioritize subjects with higher credits to maximize SGPA impact per mark,
        // so cost per credit is the true metric.
        const costPerCredit = cost / t.credits;
        
        if (costPerCredit < minCost) {
          minCost = costPerCredit;
          bestSubjectIndex = i;
        }
      }
    }
    
    // If we can't upgrade anymore (all at 10), we can't reach the goal mathematically
    if (bestSubjectIndex === -1) break;
    
    // Upgrade the best subject
    const best = targets[bestSubjectIndex];
    best.targetGradePoint += 1;
    
    const nextMinPercent = getMinMarksForGradePoint(best.targetGradePoint, gradeScheme);
    const nextMinTotalMarks = Math.ceil((nextMinPercent / 100) * best.totalSubjectMax);
    const existingMarks = best.internalMarks + best.labMarks;
    
    best.requiredExternal = Math.max(0, nextMinTotalMarks - existingMarks);
    currentTotalPoints += best.credits;
  }
  
  // If we exhausted all possible upgrades and still can't reach the target SGPA,
  // it is mathematically impossible. Mark all as impossible.
  if (currentTotalPoints < requiredTotalPoints) {
    targets.forEach(t => t.requiredExternal = Infinity);
  }
  
  return targets;
}
