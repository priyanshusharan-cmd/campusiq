// Campora — Attendance Calendar Component
// Calendar with marked dates for attendance tracking + legend

import React, { useMemo } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { useAttendanceStore } from '@/stores/useAttendanceStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { DayOfWeek } from '@/types';
import { getPastScheduledClasses } from '@/lib/attendanceUtils';
import { styles } from '../styles/attendanceDetailStyles';

interface AttendanceCalendarProps {
  subjectId: string;
  onDayPress: (day: any) => void;
}

export function AttendanceCalendar({ subjectId, onDayPress }: AttendanceCalendarProps) {
  const { colors, spacing, textStyles } = useTheme();
  const allRecords = useAttendanceStore(s => s.records);
  const timetableEntries = useTimetableStore(s => s.entries);
  const events = useTimetableStore(s => s.events);
  const { profile } = useProfileStore();

  const subjectRecords = useMemo(() => {
    return allRecords
      .filter(r => r.subjectId === subjectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, subjectId]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    const pastScheduled = getPastScheduledClasses(subjectId, timetableEntries, events, profile?.semesterStartDate);
    pastScheduled.forEach(scheduled => {
      marks[scheduled.dateStr] = {
        customStyles: {
          container: { backgroundColor: '#D1FAE5', borderRadius: 14 },
          text: { color: '#10B981', fontWeight: '500' }
        }
      };
    });

    const recordsByDate: Record<string, typeof subjectRecords> = {};
    subjectRecords.forEach(r => {
      const d = new Date(r.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });

    Object.entries(recordsByDate).forEach(([dateStr, records]) => {
      const hasAbsent = records.some(r => r.status === 'absent');
      const hasCancelled = records.some(r => r.status === 'cancelled');
      const hasHoliday = records.some(r => r.status === 'holiday');
      
      if (hasAbsent) {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: '#FEE2E2', borderRadius: 14 },
            text: { color: '#EF4444', fontWeight: '500' }
          }
        };
      } else if (hasCancelled) {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: '#FEF3C7', borderRadius: 14 },
            text: { color: '#D97706', fontWeight: '500' }
          }
        };
      } else if (hasHoliday) {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: '#CCFBF1', borderRadius: 14 },
            text: { color: '#0D9488', fontWeight: '500' }
          }
        };
      } else {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: '#D1FAE5', borderRadius: 14 },
            text: { color: '#10B981', fontWeight: '500' }
          }
        };
      }
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (!marks[todayStr]) {
      marks[todayStr] = {
        customStyles: {
          container: { backgroundColor: '#EEF2FF', borderRadius: 14 },
          text: { color: '#4F46E5', fontWeight: '500' }
        }
      };
    }
    return marks;
  }, [subjectRecords, timetableEntries, events, profile]);

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={[textStyles.h3, { marginBottom: spacing.md, color: colors.textPrimary }]}>Class Calendar</Text>
      <Card variant="elevated" padding={20}>
        <Calendar
          onDayPress={onDayPress}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#9CA3AF',
            selectedDayBackgroundColor: '#4F46E5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4F46E5',
            dayTextColor: '#374151',
            textDisabledColor: '#D1D5DB',
            arrowColor: colors.primary,
            monthTextColor: colors.textPrimary,
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '400',
            textDayFontSize: 14,
            textMonthFontSize: 15,
            textDayHeaderFontSize: 12,
          }}
          renderArrow={(direction: string) => (
            <View style={styles.calNavBtn}>
              <Ionicons name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.primary} />
            </View>
          )}
        />

        {/* Legend */}
        <View style={styles.calLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendText}>Cancelled</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0D9488' }]} />
            <Text style={styles.legendText}>Holiday</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4F46E5' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
