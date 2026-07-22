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
  const { colors, spacing, textStyles, isDark } = useTheme();
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

    const presentBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5';
    const presentText = '#10B981';

    const absentBg = isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2';
    const absentText = '#EF4444';

    const cancelBg = isDark ? 'rgba(202, 138, 4, 0.2)' : '#FEF08A';
    const cancelText = '#CA8A04';

    const holidayBg = isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE';
    const holidayText = '#2563EB';

    const todayBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#EEF2FF';

    const pastScheduled = getPastScheduledClasses(subjectId, timetableEntries, events, profile?.semesterStartDate, profile?.semesterEndDate);
    pastScheduled.forEach(scheduled => {
      marks[scheduled.dateStr] = {
        customStyles: {
          container: { backgroundColor: presentBg, borderRadius: 8 },
          text: { color: presentText, fontWeight: '500' }
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
            container: { backgroundColor: absentBg, borderRadius: 8 },
            text: { color: absentText, fontWeight: '500' }
          }
        };
      } else if (hasCancelled) {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: cancelBg, borderRadius: 8 },
            text: { color: cancelText, fontWeight: '500' }
          }
        };
      } else if (hasHoliday) {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: holidayBg, borderRadius: 8 },
            text: { color: holidayText, fontWeight: '500' }
          }
        };
      } else {
        marks[dateStr] = {
          customStyles: {
            container: { backgroundColor: presentBg, borderRadius: 8 },
            text: { color: presentText, fontWeight: '500' }
          }
        };
      }
    });

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (!marks[todayStr]) {
      marks[todayStr] = {
        customStyles: {
          container: { backgroundColor: todayBg, borderRadius: 8 },
          text: { color: colors.primary, fontWeight: '500' }
        }
      };
    }
    return marks;
  }, [subjectRecords, timetableEntries, events, profile, isDark, colors.primary]);

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text style={[textStyles.h3, { marginBottom: spacing.md, color: colors.textPrimary }]}>Class Calendar</Text>
      <Card variant="elevated" padding={20}>
        <Calendar
          onDayPress={onDayPress}
          markingType={'custom'}
          markedDates={markedDates}
          theme={{
            backgroundColor: isDark ? 'transparent' : '#ffffff',
            calendarBackground: isDark ? 'transparent' : '#ffffff',
            textSectionTitleColor: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: isDark ? '#E2E8F0' : '#374151',
            textDisabledColor: isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB',
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
            <View style={[styles.calNavBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EEF2FF' }]}>
              <Ionicons name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.primary} />
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', gap: 6, marginTop: 16, paddingHorizontal: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>Present</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: '#EF4444' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>Absent</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: '#2563EB' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>Holiday</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: '#EA580C' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>Exam</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 4, backgroundColor: '#CA8A04' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>Cancel</Text>
          </View>
        </View>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
          <Text style={[textStyles.small, { color: colors.textSecondary, marginRight: 4 }]}>*</Text>
          <Text style={[textStyles.small, { color: colors.textSecondary, flex: 1 }]}>
            Note: Scheduled classes are considered present by default.
          </Text>
        </View>
      </Card>
    </View>
  );
}
