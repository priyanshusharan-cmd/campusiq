// Campora — Attendance Calculation Utilities

import { DEFAULTS } from '@/constants';
import { parseISO, eachDayOfInterval, format, startOfMonth } from 'date-fns';
import type { TimetableEntry, DayOfWeek, ID } from '@/types';

// Calculate attendance percentage
export function calcAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((present / total) * 10000) / 100; // 2 decimal places
}

// Calculate how many more classes can be missed while staying at/above target
export function calcCanMiss(present: number, total: number, target: number = DEFAULTS.attendanceTarget): number {
  if (total === 0) return 0;
  const canMiss = Math.floor((present * 100 - target * total) / target);
  return Math.max(0, canMiss);
}

// Calculate how many consecutive classes need to be attended to reach target
export function calcNeedToAttend(present: number, total: number, target: number = DEFAULTS.attendanceTarget): number {
  if (total === 0) return 0;
  const current = (present / total) * 100;
  if (current >= target) return 0;

  const needed = Math.ceil((target * total - present * 100) / (100 - target));
  return Math.max(0, needed);
}

export function simulateAttendance(
  present: number,
  total: number,
  missCount: number
): { newPercentage: number; newTotal: number; newPresent: number } {
  const newTotal = total + missCount;
  const newPresent = present;
  const newPercentage = calcAttendancePercentage(newPresent, newTotal);
  return { newPercentage, newTotal, newPresent };
}

export function simulateAttending(
  present: number,
  total: number,
  attendCount: number
): { newPercentage: number; newTotal: number; newPresent: number } {
  const newTotal = total + attendCount;
  const newPresent = present + attendCount;
  const newPercentage = calcAttendancePercentage(newPresent, newTotal);
  return { newPercentage, newTotal, newPresent };
}

export function getAttendanceInsight(
  present: number,
  total: number,
  target: number = DEFAULTS.attendanceTarget
): string {
  if (total === 0) return 'Start marking attendance to see insights.';

  const percentage = calcAttendancePercentage(present, total);
  const canMiss = calcCanMiss(present, total, target);
  const needToAttend = calcNeedToAttend(present, total, target);

  if (percentage >= 95) {
    return `Outstanding! You can miss ${canMiss} more classes and still be well above ${target}%.`;
  }
  if (percentage >= target) {
    if (canMiss > 0) {
      return `Great! You can miss ${canMiss} more class${canMiss > 1 ? 'es' : ''} and maintain ${target}%.`;
    }
    return `You're exactly at ${target}%. Don't miss the next class!`;
  }
  if (needToAttend > 0) {
    return `Attend the next ${needToAttend} class${needToAttend > 1 ? 'es' : ''} to reach ${target}%.`;
  }
  return `Your attendance is at ${percentage.toFixed(1)}%. Focus on improving it.`;
}

// Get all scheduled classes from start date to today
export function getPastScheduledClasses(
  subjectId: ID,
  timetableEntries: TimetableEntry[],
  events: Record<string, string>,
  semesterStartDate?: string,
  semesterEndDate?: string
): { dateStr: string; entryId: ID }[] {
  const today = new Date();
  
  // Default to 1st of current month if no start date provided
  const start = semesterStartDate ? parseISO(semesterStartDate) : startOfMonth(today);
  
  // Determine the end date: either today, or semesterEndDate if provided
  let end = today;
  if (semesterEndDate) {
    end = parseISO(semesterEndDate);
  }

  if (start > end) return [];

  const dates = eachDayOfInterval({ start, end });
  const result: { dateStr: string; entryId: ID }[] = [];

  const subjectEntries = timetableEntries.filter(e => e.subjectId === subjectId);

  dates.forEach(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    if (events[dateStr] === 'holiday' || events[dateStr] === 'exam') return;

    const jsDay = d.getDay(); // 0=Sun
    const dayOfWeek = (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek; // 0=Mon

    // Find all entries for this subject on this day of week
    const dayEntries = subjectEntries.filter(e => e.dayOfWeek === dayOfWeek);
    dayEntries.forEach(entry => {
      result.push({ dateStr, entryId: entry.id });
    });
  });

  return result;
}
