// Campora — Date Utilities

import { format, formatDistanceToNowStrict, differenceInDays, differenceInHours, differenceInMinutes, isToday, isTomorrow, isYesterday, parseISO, startOfWeek, addDays, isBefore, isAfter, startOfDay } from 'date-fns';

// Get time-aware greeting
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

// Get contextual subtitle based on time of day
export function getGreetingSubtitle(): string {
  const hour = new Date().getHours();
  if (hour < 9) return "Let's make today productive.";
  if (hour < 12) return 'Stay focused. You got this!';
  if (hour < 14) return 'Halfway through the day!';
  if (hour < 17) return 'Keep the momentum going.';
  if (hour < 21) return 'Great work today!';
  return 'Rest well. Tomorrow awaits.';
}

// Get emoji for greeting
export function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '👋';
  if (hour < 17) return '☀️';
  if (hour < 21) return '🌆';
  return '🌙';
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

// Format date with year
export function formatDateFull(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM d, yyyy');
}

// Format date for display like "Mon, Jun 26"
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, MMM d');
}

// Get relative time string
export function getRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();

  if (isBefore(date, now)) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }

  const days = differenceInDays(date, now);
  if (days === 0) {
    const hours = differenceInHours(date, now);
    if (hours === 0) {
      const mins = differenceInMinutes(date, now);
      return `in ${mins} min`;
    }
    return `in ${hours}h`;
  }
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `in ${days} days`;
  return format(date, 'MMM d');
}

// Get countdown for exams
export function getCountdown(dateStr: string): { days: number; hours: number; minutes: number; isPast: boolean } {
  const target = parseISO(dateStr);
  const now = new Date();

  if (isBefore(target, now)) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }

  const totalMinutes = differenceInMinutes(target, now);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes, isPast: false };
}

// Get today's date string
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// Get current day of week (0=Mon, 5=Sat)
export function getCurrentDayOfWeek(): number {
  const day = new Date().getDay();
  // Convert from JS (0=Sun) to our format (0=Mon)
  return day === 0 ? 6 : day - 1;
}

// Get current time as "HH:mm"
export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

// Format time from "HH:mm" to "h:mm AM"
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Check if current time is within a time range
export function isTimeInRange(startTime: string, endTime: string): boolean {
  const now = getCurrentTime();
  return now >= startTime && now < endTime;
}

// Check if a time is in the past for today
export function isTimePast(time: string): boolean {
  return getCurrentTime() > time;
}

// Get week dates (Mon-Sat)
export function getWeekDates(referenceDate: Date = new Date()): Date[] {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 6 }, (_, i) => addDays(monday, i));
}

// Check if a date string is overdue
export function isOverdue(dateStr: string): boolean {
  return isBefore(startOfDay(parseISO(dateStr)), startOfDay(new Date()));
}

// Get due urgency color
export function getDueUrgency(dateStr: string): 'danger' | 'warning' | 'info' | 'success' {
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0) return 'danger';
  if (days === 0) return 'danger';
  if (days <= 2) return 'warning';
  if (days <= 7) return 'info';
  return 'success';
}
