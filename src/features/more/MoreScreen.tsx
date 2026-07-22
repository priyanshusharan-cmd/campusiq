// Campora — More Screen (Hub Tab)

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { ListRow, Card } from '@/components/ui';
import { useProfileStore, useAcademicStore } from '@/stores';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { getGPALabel } from '@/lib';
import { Alert } from 'react-native';

function SectionTitle({ title }: { title: string }) {
  const { colors, spacing, textStyles } = useTheme();
  return (
    <Text style={[textStyles.h3, { color: colors.textPrimary, paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
      {title}
    </Text>
  );
}

export default function MoreScreen() {
  const { colors, spacing, textStyles, radius } = useTheme();
  const router = useRouter();
  const { setDrawerOpen } = useDrawerStore();
  const profile = useProfileStore((s) => s.profile);
  const semesters = useAcademicStore((s) => s.semesters);
  const gradeEntries = useAcademicStore((s) => s.gradeEntries);
  const cgpa = useAcademicStore((s) => s.getCGPA());

  const name = profile?.name || 'Guest User';
  const subtitle = profile?.enrollmentNumber && profile?.branch && profile?.currentSemester 
    ? `${profile.enrollmentNumber} • ${profile.branch}, ${profile.currentSemester}th Semester`
    : 'Complete your profile';
  
  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  const currentSGPA = useAcademicStore(s => currentSemester ? s.getSGPA(currentSemester.id) : 0);
  const sgpaValue = currentSGPA > 0 ? currentSGPA.toFixed(2) : '--';

  const handleNav = (route: string) => {
    setDrawerOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          <Text style={[textStyles.h1, { color: colors.textPrimary, marginBottom: 4 }]}>More</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>All tools and settings in one place.</Text>
        </View>

        {/* Profile Card */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
        <Pressable onPress={() => handleNav('/profile')} style={{ borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 }}>
          <LinearGradient
            colors={['#0F172A', '#1E1B4B', '#4C1D95']}
            style={{ padding: 20 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Optional background abstract shapes for beauty */}
            <View style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              <View style={{ width: 68, height: 68, borderRadius: 34, marginRight: spacing.md, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
                {profile?.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={{ width: 68, height: 68 }} />
                ) : (
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.h3, { color: '#FFFFFF', fontSize: 20, marginBottom: 4 }]} numberOfLines={1}>{name}</Text>
                <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.75)', marginBottom: 12 }]} numberOfLines={2}>{subtitle}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                    <Ionicons name="person-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[textStyles.smallMedium, { color: '#FFFFFF', fontSize: 11 }]}>View Profile</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Academics Section */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)}>
        <SectionTitle title="Academics" />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="flag-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Attendance Goals" 
              subtitle="Set default and subject-specific targets"
              onPress={() => handleNav('/academics/attendance-goals')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="settings-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Academic Settings" 
              subtitle="Configure passing marks and criteria"
              onPress={() => handleNav('/academics/settings')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="book-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Subjects" 
              subtitle="Manage your subjects and credits"
              onPress={() => handleNav('/academics/subjects')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="bar-chart-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Performance Analytics" 
              subtitle="Detailed insights on your academic performance"
              onPress={() => handleNav('/analytics')} 
            />
          </Card>
        </View>
      </Animated.View>

      {/* Settings & Support Section */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)}>
        <SectionTitle title="Settings & Support" />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="settings-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Settings" 
              subtitle="Customize your app experience" 
              onPress={() => handleNav('/settings')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="help-circle-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Help & Support" 
              subtitle="Get help and contact support" 
              onPress={() => Alert.alert('Help & Support', 'Please contact support@campora.com for assistance.')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="shield-checkmark-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Privacy Policy" 
              subtitle="Read our privacy policy" 
              onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device.')} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="information-circle-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="About Campora" 
              subtitle="Learn more about the app"
              rightText="v1.0.0" 
              onPress={() => Alert.alert('Campora', 'The operating system for college students.')} 
              showChevron={false}
            />
          </Card>
        </View>
      </Animated.View>
    </ScrollView>
    </SafeAreaView>
  );
}
