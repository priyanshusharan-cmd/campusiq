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
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['xl'], paddingBottom: spacing.lg }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Analytics</Text>
          <Text style={[textStyles.small, { color: colors.textSecondary }]}>Performance & Insights</Text>
        </View>
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
            <Animated.View entering={FadeInDown.delay(20).duration(300).springify()} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#E0E7FF' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name="sparkles" size={20} color="#6366F1" />
                  </View>
                  <Text style={[textStyles.display, { color: '#6366F1', fontSize: 32 }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
                  <Text style={[textStyles.smallMedium, { color: isDark ? '#A5B4FC' : '#4F46E5', marginTop: 4 }]}>Overall CGPA</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  </View>
                  <Text style={[textStyles.display, { color: '#10B981', fontSize: 32 }]}>{avgAttendance}%</Text>
                  <Text style={[textStyles.smallMedium, { color: isDark ? '#6EE7B7' : '#059669', marginTop: 4 }]}>Avg Attendance</Text>
                </View>
              </View>
            </Animated.View>

        {/* CGPA Trend Chart */}
        <Animated.View entering={FadeInDown.delay(40).duration(300).springify()} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Academic Trend</Text>
          </View>
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <LineChart
              data={cgpaTrendData as any}
              width={width - spacing.xl * 2 - 40}
              height={160}
              spacing={(width - spacing.xl * 2 - 80) / Math.max(4, cgpaTrendData.length)}
              initialSpacing={20}
              color="#8B5CF6"
              thickness={3}
              dataPointsColor="#8B5CF6"
              dataPointsRadius={5}
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
              rulesColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              rulesType="solid"
              yAxisLabelTexts={['0.0', '2.0', '4.0', '6.0', '8.0', '10.0']}
              stepValue={2}
              maxValue={10}
              noOfSections={5}
              areaChart
              startFillColor="rgba(139, 92, 246, 0.2)"
              endFillColor="rgba(139, 92, 246, 0.0)"
              startOpacity={0.8}
              endOpacity={0.1}
              curved
            />
          </View>
        </Animated.View>

        {/* Subject-wise Attendance */}
        <Animated.View entering={FadeInDown.delay(60).duration(300).springify()} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Subject Attendance</Text>
          </View>
          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <BarChart
              data={attendanceBarsData}
              width={width - spacing.xl * 2 - 40}
              height={160}
              barWidth={24}
              barBorderRadius={6}
              spacing={(width - spacing.xl * 2 - 80) / Math.max(4, attendanceBarsData.length)}
              initialSpacing={20}
              noOfSections={4}
              maxValue={100}
              yAxisColor="transparent"
              xAxisColor="transparent"
              rulesColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              rulesType="solid"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
              showReferenceLine1
              referenceLine1Position={75}
              referenceLine1Config={{ color: colors.warning, thickness: 1.5, type: 'dashed' }}
              isAnimated
            />
          </View>
        </Animated.View>
        </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
