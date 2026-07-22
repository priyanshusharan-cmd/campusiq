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
import { LinearGradient } from 'expo-linear-gradient';

// Components
import { OverviewCards } from './components/OverviewCards';
import { SmartInsight } from './components/SmartInsight';
import { SubjectAttendanceRow } from './components/SubjectAttendanceRow';
import { AttendanceTrend } from './components/AttendanceTrend';

export default function AttendanceScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const { subjectAttendance, overall, insight } = useAttendanceData();
  const profile = useProfileStore(s => s.profile);
  const router = useRouter();
  const firstName = profile?.name?.split(' ')[0] || 'Student';

  return (
    <LinearGradient 
      colors={isDark ? ['#0F1016', '#1A162D', '#0F1016'] : ['#F8FAFC', '#EEF2FF', '#E0E7FF']} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* Top App Bar */}
        <TopNavBar firstName={profile?.name?.split(' ')[0] || 'Student'} avatarUri={profile?.avatarUri} />

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
        <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
          <View style={[styles.cardContainer, isDark ? styles.cardContainerDark : styles.cardContainerLight]}>
            <View style={styles.header}>
              <Text style={[textStyles.h3, { color: isDark ? '#FFFFFF' : colors.textPrimary, fontSize: 18 }]}>Subject-wise Attendance</Text>
            </View>

            <View style={[styles.list, { paddingBottom: 16 }]}>
              {subjectAttendance.map((subject, index) => {
                const isLast = index === subjectAttendance.length - 1;
                return <SubjectAttendanceRow key={subject.subjectId} data={subject} isLast={isLast} />;
              })}
            </View>
          </View>
        </Animated.View>

        {/* Attendance Trend Chart */}
        <AttendanceTrend />

      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  cardContainerLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  list: {
    paddingBottom: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  handleDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  handleLight: {
    backgroundColor: '#E5E7EB',
  }
});
