// Campora — AttendanceTrend Component
// Renders a line chart for attendance history

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import { useAttendanceStore } from '@/stores';
import { startOfWeek, endOfWeek, parseISO, format, differenceInWeeks } from 'date-fns';

export function AttendanceTrend() {
  const { colors, spacing, textStyles } = useTheme();
  const records = useAttendanceStore(s => s.records);

  const data = React.useMemo(() => {
    if (records.length === 0) return [];

    // Sort records by date
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = parseISO(sorted[0].date);
    const lastDate = parseISO(sorted[sorted.length - 1].date);
    
    const weeksDiff = differenceInWeeks(lastDate, firstDate) + 1;
    
    // Calculate week by week
    const weeklyData = [];
    let currentTotal = 0;
    let currentPresent = 0;
    
    for (let i = 0; i < Math.min(weeksDiff, 6); i++) { // Show max 6 weeks
      const weekRecords = sorted.filter(r => {
        const d = parseISO(r.date);
        return differenceInWeeks(d, firstDate) === i;
      });
      
      const weekTotal = weekRecords.length;
      const weekPresent = weekRecords.filter(r => r.status === 'present').length;
      
      currentTotal += weekTotal;
      currentPresent += weekPresent;
      
      if (currentTotal > 0) {
        const percentage = Math.round((currentPresent / currentTotal) * 100);
        weeklyData.push({
          value: percentage,
          label: `W${i + 1}`,
          dataPointText: `${percentage}%`
        });
      }
    }
    
    return weeklyData;
  }, [records]);

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
        <View style={{ marginTop: 24, marginLeft: -10 }}>
          <LineChart
            data={data}
            height={160}
            spacing={45}
            initialSpacing={20}
            color={colors.primary}
            thickness={3}
            dataPointsColor={colors.primary}
            dataPointsRadius={4}
            textFontSize={10}
            textColor={colors.textSecondary}
            yAxisColor="transparent"
            xAxisColor="transparent"
            rulesColor={colors.borderLight}
            rulesType="solid"
            maxValue={100}
            noOfSections={4}
            stepValue={25}
            yAxisLabelTexts={['0', '25', '50', '75', '100']}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            showReferenceLine1
            referenceLine1Position={75}
            referenceLine1Config={{
              color: colors.danger,
              thickness: 1,
              type: 'dashed'
            }}
          />
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
