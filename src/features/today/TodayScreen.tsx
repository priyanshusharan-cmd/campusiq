// Campora — Today Screen (Home)
// Redesigned to match new provided UI reference

import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useTodayData } from './hooks/useTodayData';
import { useProfileStore, useActiveSubjects, useDrawerStore } from '@/stores';
import { useRouter } from 'expo-router';

// Components
import { TopNavBar } from '@/components/ui/TopNavBar';
import { QuickStatsStrip } from './components/QuickStatsStrip';
import { TodaySchedule } from './components/TodaySchedule';

import { LinearGradient } from 'expo-linear-gradient';

export default function TodayScreen({ isBackground = false }: { isBackground?: boolean } = {}) {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  
  const profile = useProfileStore(s => s.profile);
  const subjects = useActiveSubjects();
  const homeScrollY = useDrawerStore(s => s.homeScrollY);
  const setHomeScrollY = useDrawerStore(s => s.setHomeScrollY);
  const isSetupComplete = profile?.semesterStartDate && profile?.semesterEndDate;
  const hasSubjects = subjects.length > 0;
  // Custom hook containing all business logic for this screen
  const { 
    firstName, 
    cgpa,
    expectedSGPA,
    isSemesterComplete,
    overallAttendance,
    todayClasses, 
  } = useTodayData();

  const Wrapper = isBackground ? View : SafeAreaView;
  const wrapperProps = isBackground ? { style: [styles.container, { paddingTop: 60 }] } : { style: styles.container, edges: ['top'] };

  return (
    <LinearGradient 
      colors={isDark ? ['#0F1016', '#1A162D', '#0F1016'] : ['#F8FAFC', '#EEF2FF', '#E0E7FF']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Wrapper {...wrapperProps as any}>
        
        {/* Top App Bar */}
        <TopNavBar firstName={firstName} avatarUri={profile?.avatarUri} />

        {!isSetupComplete ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="calendar-outline" size={40} color={isDark ? '#818CF8' : colors.primary} />
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
            contentOffset={{ x: 0, y: isBackground ? homeScrollY : 0 }}
            onScroll={isBackground ? undefined : (e) => setHomeScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            scrollEnabled={!isBackground}
          >
            {/* Greeting */}
            <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>Hello, {firstName}!</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 5 }}>Your classes, attendance and progress at a glance.</Text>
            </View>
          {!hasSubjects ? (
            <View style={{ marginTop: spacing.xl, padding: spacing.xl, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface, borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.05)', marginHorizontal: spacing.xl, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 12, elevation: 2 }}>
              <Ionicons name="book-outline" size={48} color={isDark ? "rgba(255,255,255,0.3)" : colors.textTertiary} style={{ marginBottom: 12 }} />
              <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 8 }]}>No Subjects Yet</Text>
              <Text style={[textStyles.small, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                Add your classes to start tracking attendance and managing your timetable.
              </Text>
              <Pressable 
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.primary, borderWidth: isDark ? 1 : 0, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
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
                expectedSGPA={expectedSGPA}
                isSemesterComplete={isSemesterComplete}
                attendancePercentage={overallAttendance.percentage}
                attendanceTotal={overallAttendance.total}
                isBackground={isBackground}
              />

              <View style={{ paddingHorizontal: 20, marginBottom: 22 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 13 }}>Quick access</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>{[
                  { label: 'Timetable', icon: 'calendar-outline', route: '/academics/classes', color: '#6366F1' },
                  { label: 'Subjects', icon: 'book-outline', route: '/academics/subjects', color: '#0891B2' },
                  { label: 'Results', icon: 'stats-chart-outline', route: '/(tabs)/gpa?tab=tracker', color: '#DB2777' },
                ].map(action => <Pressable key={action.label} accessibilityRole="button" onPress={() => router.push(action.route as any)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><Ionicons name={action.icon as any} size={22} color={action.color} /><Text style={{ color: colors.textPrimary, fontSize: 10, fontWeight: '600', marginTop: 8 }}>{action.label}</Text></Pressable>)}</View>
              </View>
              <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}><Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17 }}>Today's classes</Text><Text style={{ color: colors.textSecondary, fontSize: 12 }}>{todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}</Text></View>
              {!todayClasses.length && <View style={{ marginHorizontal: 20, padding: 22, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 14, alignItems: 'center' }}><Ionicons name="sunny-outline" size={30} color="#F59E0B" /><View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Room to breathe</Text><Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 5 }}>No classes scheduled today. Make it yours.</Text></View></View>}
              {/* Today's Schedule Card */}
              <View style={{ marginTop: spacing.md }}>
                <TodaySchedule classes={todayClasses} />
              </View>

            </>
          )}

        </ScrollView>
        )}
      </Wrapper>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110,
  }
});
