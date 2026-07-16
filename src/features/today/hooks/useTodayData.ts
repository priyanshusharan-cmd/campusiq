// Campora — useTodayData Hook
// Aggregates all data relevant to the Today screen

import { useMemo } from 'react';
import { useProfileStore, useSubjectStore, useTodayClasses, useOverallAttendance, useAssignmentStore, useExamStore, useAcademicStore, useSettingsStore, useAttendanceStore } from '@/stores';
import { getTodayString, getDueUrgency } from '@/lib';
import type { TimetableEntryWithSubject , AttendanceStatus } from '@/types';

export interface TodayData {
  firstName: string;
  todayClasses: TimetableEntryWithSubject[];
  cgpa: number;
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

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.status !== 'completed'),
    [assignments]
  );

  const upcomingExams = useMemo(
    () => exams.filter((e) => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)),
    [exams, todayStr]
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

  return {
    firstName,
    todayClasses,
    cgpa,
    overallAttendance: overall,
    pendingAssignments,
    upcomingExams,
    streakCount,
    getClassAttendanceStatus,
    markClassAttendance,
  };
}
