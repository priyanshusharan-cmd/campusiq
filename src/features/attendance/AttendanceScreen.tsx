// Campora — Attendance Screen
// Fully redesigned to match new UI reference

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { Card } from '@/components/ui/Card';
import { useAttendanceData } from './hooks';
import { useProfileStore } from '@/stores';
import { useRouter } from 'expo-router';
import { Alert, Pressable } from 'react-native';

// Components
import { OverviewCards } from './components/OverviewCards';
import { SmartInsight } from './components/SmartInsight';
import { SubjectAttendanceRow } from './components/SubjectAttendanceRow';
import { AttendanceTrend } from './components/AttendanceTrend';

export default function AttendanceScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const { subjectAttendance, overall, insight } = useAttendanceData();
  const profile = useProfileStore(s => s.profile);
  const router = useRouter();
  const firstName = profile?.name?.split(' ')[0] || 'Student';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      
      {/* Top App Bar */}
      <TopNavBar firstName={firstName} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>Attendance</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
              Track your attendance and stay above the target!
            </Text>
          </View>
          <Pressable 
            style={[styles.dropdown, { borderColor: colors.primaryLight, backgroundColor: colors.surface }]}
            onPress={() => Alert.alert('Filter', 'Semester filtering is active based on profile dates.')}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[textStyles.smallMedium, { color: colors.primary }]}>This Semester</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* Overview stat cards */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)}>
          <OverviewCards
            percentage={overall.percentage}
            attended={overall.present}
            missed={overall.absent}
            total={overall.total}
            canMiss={overall.canMiss}
          />
        </Animated.View>

        {/* Smart insight */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
          <SmartInsight message={insight} />
        </Animated.View>

        {/* Subject-wise list */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl }}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Subject-wise Attendance</Text>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/analytics' as any)}>
              <Text style={[textStyles.smallMedium, { color: colors.primary }]}>View Insights</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>

          <Card variant="elevated" padding={0} style={{ borderRadius: 20, overflow: 'hidden' }}>
            {subjectAttendance.map((subject, index) => {
              const isLast = index === subjectAttendance.length - 1;
              return <SubjectAttendanceRow key={subject.subjectId} data={subject} isLast={isLast} />;
            })}
          </Card>
        </Animated.View>

        {/* Attendance Trend Chart */}
        <AttendanceTrend />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  }
});
