// Campora — AttendanceTrend Component
// Renders a line chart for attendance history

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { useAttendanceStore, useSubjectStore, useTimetableStore, useProfileStore, useSettingsStore } from '@/stores';
import { parseISO, subWeeks, isBefore, isSameDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { getPastScheduledClasses } from '@/lib/attendanceUtils';

export function AttendanceTrend() {
  const { colors, spacing, textStyles } = useTheme();
  const records = useAttendanceStore(s => s.records);
  const subjects = useSubjectStore(s => s.subjects);
  const timetableEntries = useTimetableStore(s => s.entries);
  const events = useTimetableStore(s => s.events);
  const profile = useProfileStore(s => s.profile);
  const target = useSettingsStore(s => s.attendanceTarget);

  const data = React.useMemo(() => {
    const allPastClasses: { dateStr: string; entryId: string; subjectId: string }[] = [];
    subjects.forEach(subject => {
      const past = getPastScheduledClasses(subject.id, timetableEntries, events, profile?.semesterStartDate, profile?.semesterEndDate);
      allPastClasses.push(...past.map(p => ({ ...p, subjectId: subject.id })));
    });

    if (allPastClasses.length === 0 && records.length === 0) return [];

    const today = new Date();
    const semStart = profile?.semesterStartDate ? parseISO(profile.semesterStartDate) : new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const semEnd = profile?.semesterEndDate ? parseISO(profile.semesterEndDate) : today;
    
    let startDate = isBefore(today, semStart) ? new Date(today.getFullYear(), today.getMonth() - 2, 1) : semStart;
    let endDate = isBefore(semEnd, today) ? semEnd : today;

    const monthlyData = [];
    
    let currentMonthStart = startOfMonth(startDate);
    const endMonthStart = startOfMonth(endDate);

    while (isBefore(currentMonthStart, endMonthStart) || isSameDay(currentMonthStart, endMonthStart)) {
      let periodEnd = isSameDay(currentMonthStart, endMonthStart) ? endDate : endOfMonth(currentMonthStart);

      const classesUpToPeriod = allPastClasses.filter(c => {
         const d = parseISO(c.dateStr);
         return isBefore(d, periodEnd) || isSameDay(d, periodEnd);
      });

      const recordsUpToPeriod = records.filter(r => {
         const d = parseISO(r.date);
         return isBefore(d, periodEnd) || isSameDay(d, periodEnd);
      });

      let cumulativePresent = 0;
      let cumulativeAbsent = 0;

      classesUpToPeriod.forEach(c => {
         const r = recordsUpToPeriod.find(rec => rec.subjectId === c.subjectId && rec.date === c.dateStr && rec.timetableEntryId === c.entryId);
         if (r) {
            if (r.status === 'present') cumulativePresent++;
            else if (r.status === 'absent') cumulativeAbsent++;
         } else {
            cumulativePresent++; // Assumed present
         }
      });
      
      recordsUpToPeriod.forEach(r => {
         const isScheduled = classesUpToPeriod.some(c => c.subjectId === r.subjectId && c.dateStr === r.date && c.entryId === r.timetableEntryId);
         if (!isScheduled) {
            if (r.status === 'present') cumulativePresent++;
            else if (r.status === 'absent') cumulativeAbsent++;
         }
      });

      const cumulativeTotal = cumulativePresent + cumulativeAbsent;
      // We push a data point for every month to ensure the x-axis shows all months
      const percentage = cumulativeTotal > 0 ? Math.round((cumulativePresent / cumulativeTotal) * 100) : 100;
      
      const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(currentMonthStart);
      
      monthlyData.push({
        value: percentage,
        label: label,
        dataPointText: `${percentage}%`
      });

      currentMonthStart = addMonths(currentMonthStart, 1);
    }

    if (monthlyData.length === 0) {
        return [{ value: 100, label: 'Start', dataPointText: '100%' }, { value: 100, label: 'Now', dataPointText: '100%' }];
    }
    
    if (monthlyData.length === 1) {
       monthlyData.unshift({ ...monthlyData[0], label: 'Start' });
    }

    return monthlyData;
  }, [records, subjects, timetableEntries, events, profile]);

  if (data.length === 0) {
    return (
      <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
        <Card variant="elevated" padding={20} style={{ borderRadius: 20 }}>
          <View style={styles.header}>
            <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Attendance Trend</Text>
          </View>
          <View style={{ marginTop: 24, alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <Text style={[textStyles.body, { color: colors.textSecondary }]}>Not enough data for trend</Text>
          </View>
        </Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
      <Card variant="elevated" padding={20} style={{ borderRadius: 20 }}>
        <View style={styles.header}>
          <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Attendance Trend</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <LineChart
            data={data}
            height={160}
            spacing={50}
            initialSpacing={10}
            color={colors.primary}
            thickness={3}
            dataPointsColor={colors.primary}
            dataPointsRadius={5}
            textFontSize={11}
            textColor={colors.primary}
            textShiftY={-12}
            textShiftX={-12}
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor={colors.borderLight}
            rulesType="solid"
            maxValue={100}
            noOfSections={4}
            stepValue={25}
            yAxisLabelTexts={['0', '25', '50', '75', '100']}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500' }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500' }}
            yAxisLabelWidth={28}
            areaChart
            curved
            isAnimated
            animationDuration={1200}
            startFillColor={colors.primary}
            startOpacity={0.3}
            endFillColor={colors.primary}
            endOpacity={0.02}
          />

          {/* Beautiful Custom Target Line Overlay */}
          <View style={{
            position: 'absolute',
            left: 28 + 10, // yAxisLabelWidth + initialSpacing
            right: 0,
            bottom: (target / 100) * 160 + 28, // 160 is chart height, ~28 is xAxis label height
            height: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}>
            <Svg height="2" width="100%" style={{ position: 'absolute' }}>
              <Line x1="0" y1="1" x2="100%" y2="1" stroke={colors.danger} strokeWidth="1.5" strokeDasharray="4 4" />
            </Svg>
            <View style={{
              position: 'absolute',
              backgroundColor: colors.danger,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              shadowColor: colors.danger,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{target}% Target</Text>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    position: 'absolute',
    right: 0,
    paddingLeft: 4,
  }
});
