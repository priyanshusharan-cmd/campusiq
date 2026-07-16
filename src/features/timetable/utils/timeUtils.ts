// Campora — Shared Time Utilities
// Reusable time parsing and formatting logic used by create-class, create-lab, create-extra-class

import { format } from 'date-fns';

/**
 * Handles time input text changes with auto-colon insertion.
 */
export function handleTimeInputChange(text: string, currentVal: string): string {
  let cleaned = text.replace(/[^0-9:]/g, '');
  if (text.length < currentVal.length) {
    return cleaned;
  }
  if (cleaned.length === 2 && !cleaned.includes(':')) {
    cleaned += ':';
  }
  return cleaned;
}

/**
 * Parses a time string (e.g., "10:30 AM") into a Date object and formatted string.
 * Returns null if parsing fails.
 */
export function parseTimeInput(text: string): Date | null {
  if (!text) return null;
  const match = text.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?$/);
  if (!match) return null;
  let [, hStr, mStr, ampm] = match;
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr || '0', 10);
  if (ampm) {
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  }
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Formats a Date object into a display time string (e.g., "10:30 AM").
 */
export function formatTime(time: Date | null): string {
  return time ? format(time, 'hh:mm a') : '';
}

/**
 * Converts a time string (HH:MM or hh:mm AM/PM) into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  let h = 0, m = 0;
  if (timeStr.toLowerCase().includes('m')) { 
    const match = timeStr.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?$/);
    if (match) {
      let [, hStr, mStr, ampm] = match;
      h = parseInt(hStr, 10);
      m = parseInt(mStr || '0', 10);
      ampm = ampm?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
    }
  } else {
    const parts = timeStr.split(':');
    h = parseInt(parts[0], 10) || 0;
    m = parseInt(parts[1], 10) || 0;
  }
  return h * 60 + m;
}

/**
 * Day name to DayOfWeek index mapping.
 */
export const DAY_MAP: Record<string, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
};

export const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
