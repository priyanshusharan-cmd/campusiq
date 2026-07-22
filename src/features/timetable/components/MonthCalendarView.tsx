import React, { useMemo } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '@/theme';
import { useTimetableStore, useAttendanceStore } from '@/stores';

export function MonthCalendarView() {
  const { colors, fontFamily, textStyles, spacing } = useTheme();
  const events = useTimetableStore((s) => s.events);
  const setEvent = useTimetableStore((s) => s.setEvent);
  const timetableEntries = useTimetableStore((s) => s.entries);
  const attendanceRecords = useAttendanceStore((s) => s.records);
  const markBulkAttendance = useAttendanceStore((s) => s.markBulkAttendance);
  const markDayAsHoliday = useAttendanceStore((s) => s.markDayAsHoliday);
  const markDayAsExam = useAttendanceStore((s) => s.markDayAsExam);
  const removeRecordsByDate = useAttendanceStore((s) => s.removeRecordsByDate);

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;

    // Check what day of week this is
    const d = new Date(dateString + 'T12:00:00');
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Check if any classes are scheduled for this day-of-week
    const dayEntries = timetableEntries.filter(e => e.dayOfWeek === dayOfWeek);
    const hasClasses = dayEntries.length > 0;

    // Check existing records for this date
    const dateRecords = attendanceRecords.filter(r => r.date === dateString);
    const currentEvent = events[dateString];

    const buttons: any[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const isFuture = dateString > todayStr;

    if (hasClasses) {
      if (!isFuture) {
        buttons.push({
          text: '✅ Mark All Present',
          onPress: () => markBulkAttendance(dateString, 'present'),
        });
      }
      buttons.push({
        text: '❌ Mark All Absent',
        onPress: () => markBulkAttendance(dateString, 'absent'),
      });
      buttons.push({
        text: '🏖️ Mark as Holiday',
        onPress: () => markDayAsHoliday(dateString),
      });
    }

    buttons.push({
      text: '📝 Mark as Exam Day',
      onPress: () => markDayAsExam(dateString),
    });

    if (dateRecords.length > 0 || currentEvent) {
      buttons.push({
        text: '🗑️ Clear All Records',
        onPress: () => {
          removeRecordsByDate(dateString);
          setEvent(dateString, null);
        },
        style: 'destructive',
      });
    }

    buttons.push({
      text: 'Cancel',
      style: 'cancel',
    });

    // Build subtitle
    let subtitle = '';
    if (currentEvent === 'holiday') {
      subtitle = 'Currently: Holiday';
    } else if (currentEvent === 'exam') {
      subtitle = 'Currently: Exam Day';
    } else if (dateRecords.length > 0) {
      const presentCount = dateRecords.filter(r => r.status === 'present').length;
      const absentCount = dateRecords.filter(r => r.status === 'absent').length;
      subtitle = `Records: ${presentCount} present, ${absentCount} absent`;
    } else if (hasClasses) {
      subtitle = `${dayEntries.length} class${dayEntries.length > 1 ? 'es' : ''} scheduled`;
    } else {
      subtitle = 'No classes scheduled for this day';
    }

    Alert.alert(
      `📅 ${dateString}`,
      subtitle,
      buttons,
      { cancelable: true }
    );
  };

  // Build marked dates with attendance info
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Mark events (holidays, exams)
    Object.entries(events).forEach(([dateString, type]) => {
      if (type === 'holiday') {
        marks[dateString] = {
          customStyles: {
            container: {
              backgroundColor: '#DBEAFE',
              borderRadius: 8,
            },
            text: {
              color: '#2563EB',
              fontFamily: fontFamily.medium,
            },
          },
        };
      } else if (type === 'exam') {
        marks[dateString] = {
          customStyles: {
            container: {
              backgroundColor: '#F3E8FF',
              borderRadius: 8,
            },
            text: {
              color: '#8B5CF6',
              fontFamily: fontFamily.medium,
            },
          },
        };
      }
    });

    // Mark dates with attendance records (if not already marked as event)
    const dateGroups = new Map<string, typeof attendanceRecords>();
    attendanceRecords.forEach(r => {
      if (!dateGroups.has(r.date)) {
        dateGroups.set(r.date, []);
      }
      dateGroups.get(r.date)!.push(r);
    });

    dateGroups.forEach((records, dateString) => {
      if (marks[dateString]) return; // Don't override events

      const allPresent = records.every(r => r.status === 'present');
      const allAbsent = records.every(r => r.status === 'absent');
      const hasCancelled = records.some(r => r.status === 'cancelled');

      let bgColor = '#E0E7FF'; // mixed/default - light indigo
      let textColor = '#4338CA';

      if (allPresent) {
        bgColor = '#D1FAE5';
        textColor = '#10B981';
      } else if (allAbsent) {
        bgColor = '#FEE2E2';
        textColor = '#EF4444';
      } else if (hasCancelled) {
        bgColor = '#FEF08A';
        textColor = '#CA8A04';
      }

      marks[dateString] = {
        customStyles: {
          container: {
            backgroundColor: bgColor,
            borderRadius: 8,
          },
          text: {
            color: textColor,
            fontFamily: fontFamily.medium,
          },
        },
      };
    });

    return marks;
  }, [events, attendanceRecords, fontFamily]);

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markingType="custom"
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.surface,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: colors.primary,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textQuaternary,
          dotColor: colors.primary,
          selectedDotColor: '#ffffff',
          arrowColor: colors.primary,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.primary,
          textDayFontFamily: fontFamily.regular,
          textMonthFontFamily: fontFamily.bold,
          textDayHeaderFontFamily: fontFamily.medium,
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
        }}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      />

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Holiday</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Exam</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
