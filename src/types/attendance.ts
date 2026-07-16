// Campora — Attendance Types

import type { ID } from './common';

export type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'holiday';

export interface AttendanceRecord {
  id: ID;
  subjectId: ID;
  date: string;         // "2026-06-26"
  status: AttendanceStatus;
  timetableEntryId?: ID;
  markedAt: Date;
  note?: string;
}

export interface SubjectAttendance {
  subjectId: ID;
  subjectName: string;
  subjectShortName: string;
  subjectColor: string;
  totalClasses: number;
  present: number;
  absent: number;
  cancelled: number;
  holiday: number;
  percentage: number;
  canMiss: number;       // How many more can be missed
  needToAttend: number;  // How many needed to reach target
  status: AttendanceHealthStatus;
}

export type AttendanceHealthStatus =
  | 'excellent'    // >= 95%
  | 'good'         // >= 85%
  | 'above_target' // >= target
  | 'at_risk'      // 5% above or at target
  | 'critical';    // below target

export function getAttendanceStatus(percentage: number, target: number): AttendanceHealthStatus {
  if (percentage >= 95) return 'excellent';
  if (percentage >= 85) return 'good';
  if (percentage >= target + 5) return 'above_target';
  if (percentage >= target) return 'at_risk';
  return 'critical';
}

export function getAttendanceStatusLabel(status: AttendanceHealthStatus): string {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'above_target': return 'Above Target';
    case 'at_risk': return 'At Risk';
    case 'critical': return 'Critical';
  }
}
