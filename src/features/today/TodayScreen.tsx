// Campora — Today Screen (Home)
// Redesigned to match new provided UI reference

import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useTodayData } from './hooks/useTodayData';
import { useProfileStore, useSubjectStore } from '@/stores';
import { useRouter } from 'expo-router';

// Components
import { TopNavBar } from '@/components/ui/TopNavBar';
import { GreetingHeader } from './components/GreetingHeader';
import { QuickStatsStrip } from './components/QuickStatsStrip';
import { TodaySchedule } from './components/TodaySchedule';
import { SubjectsList } from './components/SubjectsList';

import { LinearGradient } from 'expo-linear-gradient';

export default function TodayScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  
  const profile = useProfileStore(s => s.profile);
  const subjects = useSubjectStore(s => s.subjects);
  const isSetupComplete = profile?.semesterStartDate && profile?.semesterEndDate;
  const hasSubjects = subjects.length > 0;
  // Custom hook containing all business logic for this screen
  const { 
    firstName, 
    cgpa,
    overallAttendance,
    todayClasses, 
  } = useTodayData();

  return (
    <LinearGradient 
      colors={['#EEF2FF', '#FAFAFA', '#FFFFFF']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.3 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        
        {/* Top App Bar */}
        <TopNavBar firstName={firstName} avatarUri={profile?.avatarUri} />

        {!isSetupComplete ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="calendar-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[textStyles.h2, { color: colors.textPrimary, textAlign: 'center', marginBottom: 12 }]}>Welcome to CampusIQ!</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }]}>
              To get started tracking your attendance and calculating your progress, please set your Semester Start and End dates in your profile.
            </Text>
            <Pressable 
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => router.push('/profile' as any)}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 8 }}>Complete Profile</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Greeting */}
            <GreetingHeader firstName={firstName} />

          {!hasSubjects ? (
            <View style={{ marginTop: spacing.xl, padding: spacing.xl, alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.xl, borderRadius: 16 }}>
              <Ionicons name="book-outline" size={48} color={colors.textTertiary} style={{ marginBottom: 12 }} />
              <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 8 }]}>No Subjects Yet</Text>
              <Text style={[textStyles.small, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                Add your classes to start tracking attendance and managing your timetable.
              </Text>
              <Pressable 
                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => router.push('/(modals)/create-subject' as any)}
              >
                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Subject</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Quick Stats Grid / Scroll */}
              <QuickStatsStrip 
                cgpa={cgpa} 
                attendancePercentage={overallAttendance.percentage}
                attendanceTotal={overallAttendance.total}
                todayClassCount={todayClasses.length}
              />

              {/* Today's Schedule Card */}
              <View style={{ marginTop: spacing.md }}>
                <TodaySchedule classes={todayClasses} />
              </View>

              {/* All Subjects List */}
              <SubjectsList />
            </>
          )}

        </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  }
});
