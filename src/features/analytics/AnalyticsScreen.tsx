import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, SectionHeader, EmptyState } from '@/components/ui';
import { useAcademicStore, useSubjectAttendance, useSubjectStore } from '@/stores';
import { LineChart, BarChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  const semesters = useAcademicStore(s => s.semesters);
  const getSGPA = useAcademicStore(s => s.getSGPA);
  const cgpa = useAcademicStore(s => s.getCGPA());
  const subjectStats = useSubjectAttendance();
  const subjects = useSubjectStore(s => s.subjects);
  const hasSubjects = subjects.length > 0;

  // CGPA Trend Data
  const cgpaTrendData = useMemo(() => {
    const data = semesters
      .map(sem => {
        const sgpa = getSGPA(sem.id);
        if (sgpa === 0) return null;
        return {
          value: parseFloat(sgpa.toFixed(2)),
          label: `Sem \${sem.number}`,
        };
      })
      .filter(d => d !== null);
    
    if (data.length === 0) {
      return [{ value: 0, label: 'Start' }];
    }
    return data;
  }, [semesters, getSGPA]);

  // Subject Attendance Bars
  const attendanceBarsData = useMemo(() => {
    if (subjectStats.length === 0) return [{ value: 0, label: 'None' }];
    return subjectStats.map(stat => ({
      value: stat.percentage,
      label: stat.subjectName.substring(0, 3).toUpperCase(),
      frontColor: stat.percentage >= 75 ? colors.success : colors.danger,
    }));
  }, [subjectStats, colors]);

  const avgAttendance = useMemo(() => {
    if (subjectStats.length === 0) return 0;
    const sum = subjectStats.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / subjectStats.length);
  }, [subjectStats]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Analytics</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {!hasSubjects ? (
          <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            <Card>
              <EmptyState
                icon="bar-chart-outline"
                title="No Data Available"
                subtitle="Add subjects and mark attendance to see your analytics."
              />
            </Card>
          </Animated.View>
        ) : (
          <>
            {/* Insights */}
            <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Card variant="elevated" padding={16} style={{ flex: 1, backgroundColor: colors.primaryLight }}>
                  <Ionicons name="stats-chart" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={[textStyles.h2, { color: colors.primary }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Current CGPA</Text>
                </Card>
                <Card variant="elevated" padding={16} style={{ flex: 1, backgroundColor: colors.successLight }}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.success} style={{ marginBottom: 8 }} />
                  <Text style={[textStyles.h2, { color: colors.success }]}>{avgAttendance}%</Text>
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Avg Attendance</Text>
                </Card>
              </View>
            </Animated.View>

        {/* CGPA Trend Chart */}
        <Animated.View entering={FadeInDown.delay(40).duration(100)} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          <SectionHeader title="Academic Performance" />
          <Card variant="flat" padding={16} style={{ alignItems: 'center' }}>
            <LineChart
              data={cgpaTrendData as any}
              width={width - spacing.xl * 2 - 48}
              height={180}
              spacing={(width - spacing.xl * 2 - 64) / Math.max(4, cgpaTrendData.length)}
              initialSpacing={10}
              color={colors.primary}
              thickness={2}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              rulesColor={colors.borderLight}
              rulesType="solid"
              yAxisLabelTexts={['0.0', '2.0', '4.0', '6.0', '8.0', '10.0']}
              stepValue={2}
              maxValue={10}
              noOfSections={5}
            />
          </Card>
        </Animated.View>

        {/* Subject-wise Attendance */}
        <Animated.View entering={FadeInDown.delay(60).duration(100)} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          <SectionHeader title="Subject-wise Attendance" />
          <Card variant="flat" padding={16} style={{ alignItems: 'center' }}>
            <BarChart
              data={attendanceBarsData}
              width={width - spacing.xl * 2 - 64}
              height={180}
              barWidth={20}
              spacing={(width - spacing.xl * 2 - 80) / Math.max(4, attendanceBarsData.length)}
              initialSpacing={10}
              noOfSections={4}
              maxValue={100}
              yAxisColor="transparent"
              xAxisColor="transparent"
              rulesColor={colors.borderLight}
              rulesType="solid"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              showReferenceLine1
              referenceLine1Position={75}
              referenceLine1Config={{ color: colors.warning, thickness: 1, type: 'dashed' }}
            />
          </Card>
        </Animated.View>
        </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
