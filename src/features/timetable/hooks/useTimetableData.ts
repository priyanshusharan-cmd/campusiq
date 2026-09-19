// Campora — useTimetableData Hook
// Encapsulates timetable data logic

import { useState, useMemo } from 'react';
import { startOfWeek, addDays, format } from 'date-fns';
import { useClassesForDate, useSubjectStore } from '@/stores';
import { getCurrentDayOfWeek } from '@/lib';
import type { DayOfWeek, TimetableEntryWithSubject } from '@/types';
import { DAY_SHORT_NAMES } from '@/types';

export function useTimetableData() {
  const initialDay = Math.min(getCurrentDayOfWeek(), 5) as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);
  const subjects = useSubjectStore((s) => s.subjects);
  
  const days = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 6 }).map((_, i) => {
      const date = addDays(start, i);
      return {
        index: i as DayOfWeek,
        label: format(date, 'EEE'),
        dateText: format(date, 'd MMM'),
        dateString: format(date, 'yyyy-MM-dd'),
        isToday: selectedDay === i,
      };
    });
  }, [selectedDay]);

  const classes = useClassesForDate(days[selectedDay].dateString, selectedDay);

  return {
    selectedDay,
    setSelectedDay,
    classes,
    subjects,
    days,
  };
}
