// Campora — useTodayData Hook
// Aggregates all data relevant to the Today screen

import { useMemo } from 'react';
import { useProfileStore, useSubjectStore, useActiveSubjects, useTodayClasses, useOverallAttendance, useAssignmentStore, useExamStore, useAcademicStore, useSettingsStore, useAttendanceStore } from '@/stores';
import { getTodayString, getDueUrgency } from '@/lib';
import { calculateSubjectBounds } from '@/lib/gradingEngine';
import type { TimetableEntryWithSubject , AttendanceStatus } from '@/types';

export interface TodayData {
  firstName: string;
  todayClasses: TimetableEntryWithSubject[];
  cgpa: number;
  expectedSGPA: number;
  overallAttendance: { present: number; absent: number; total: number; percentage: number; canMiss: number };
  pendingAssignments: ReturnType<typeof useAssignmentStore.getState>['assignments'];
  upcomingExams: ReturnType<typeof useExamStore.getState>['exams'];
  streakCount: number;
  getClassAttendanceStatus: (entryId: string) => AttendanceStatus | undefined;
  markClassAttendance: (subjectId: string, entryId: string, status: 'present' | 'absent' | 'cancelled') => void;
}

export function useTodayData(): TodayData {
  const profile = useProfileStore((s) => s.profile);
  const todayClasses = useTodayClasses();
  const overall = useOverallAttendance();
  const assignments = useAssignmentStore((s) => s.assignments);
  const exams = useExamStore((s) => s.exams);
  const cgpa = useAcademicStore((s) => s.getCGPA());
  const streakCount = useSettingsStore((s) => s.streakCount);
  const attendanceRecords = useAttendanceStore((s) => s.records);
  const markAttendance = useAttendanceStore((s) => s.markAttendance);

  const firstName = profile?.name?.split(' ')[0] || 'Student';
  const todayStr = getTodayString();

  const activeSubjects = useActiveSubjects();
  const activeSubjectIds = useMemo(() => new Set(activeSubjects.map(s => s.id)), [activeSubjects]);

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.status !== 'completed' && activeSubjectIds.has(a.subjectId)),
    [assignments, activeSubjectIds]
  );

  const upcomingExams = useMemo(
    () => exams.filter((e) => e.date >= todayStr && activeSubjectIds.has(e.subjectId)).sort((a, b) => a.date.localeCompare(b.date)),
    [exams, todayStr, activeSubjectIds]
  );

  const getClassAttendanceStatus = (entryId: string): AttendanceStatus | undefined => {
    const record = attendanceRecords.find(
      (r) => r.date === todayStr && r.timetableEntryId === entryId
    );
    return record?.status;
  };

  const markClassAttendance = (subjectId: string, entryId: string, status: 'present' | 'absent' | 'cancelled') => {
    markAttendance(subjectId, todayStr, status, entryId);
  };

  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  const currentSGPA = useAcademicStore(s => currentSemester ? s.getSGPA(currentSemester.id) : 0);
  
  let expectedSGPA = currentSGPA;
  if (currentSGPA === 0 && activeSubjects.length > 0) {
    let totalPoints = 0;
    let totalCredits = 0;
    activeSubjects.forEach(sub => {
      const bounds = calculateSubjectBounds(sub.components || [], {});
      const maxPossible = sub.components?.reduce((sum, c) => sum + (c.type === 'grouped' ? c.weight : c.maxMarks), 0) || 100;
      const percentage = Math.round((bounds.ceiling / maxPossible) * 100);
      let gradePoints = 0;
      if (percentage >= 90) gradePoints = 10;
      else if (percentage >= 80) gradePoints = 9;
      else if (percentage >= 70) gradePoints = 8;
      else if (percentage >= 60) gradePoints = 7;
      else if (percentage >= 50) gradePoints = 6;
      else if (percentage >= 40) gradePoints = 5;
      else if (percentage >= 35) gradePoints = 4;
      
      totalPoints += gradePoints * sub.credits;
      totalCredits += sub.credits;
    });
    if (totalCredits > 0) {
      expectedSGPA = totalPoints / totalCredits;
    }
  }

  return {
    firstName,
    todayClasses,
    cgpa,
    expectedSGPA,
    overallAttendance: overall,
    pendingAssignments,
    upcomingExams,
    streakCount,
    getClassAttendanceStatus,
    markClassAttendance,
  };
}
