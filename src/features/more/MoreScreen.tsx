// Campora — More Screen (Hub Tab)

import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { ListRow, Card } from '@/components/ui';
import { useProfileStore, useAcademicStore } from '@/stores';
import { getGPALabel, getGPAEmoji } from '@/lib';
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
  const profile = useProfileStore((s) => s.profile);
  const cgpa = useAcademicStore((s) => s.getCGPA());

  const name = profile?.name || 'Guest User';
  const subtitle = profile?.enrollmentNumber && profile?.branch && profile?.currentSemester 
    ? `${profile.enrollmentNumber} • ${profile.branch}, ${profile.currentSemester}th Semester`
    : 'Complete your profile';
  
  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  const currentSGPA = useAcademicStore(s => currentSemester ? s.getSGPA(currentSemester.id) : 0);
  const sgpaValue = currentSGPA > 0 ? currentSGPA.toFixed(2) : '--';

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
        <Card variant="flat" onPress={() => router.push('/profile' as any)} padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, marginRight: spacing.md, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.h3, { color: colors.textPrimary, fontSize: 18, marginBottom: 4 }]}>{name}</Text>
              <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 12 }]}>{subtitle}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primaryLight, borderRadius: radius.sm }}>
                  <Ionicons name="person-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[textStyles.smallMedium, { color: colors.primary }]}>View Profile</Text>
                </View>
              </View>
            </View>

            {/* SGPA Card */}
            <View style={{ backgroundColor: colors.primaryLight, padding: 12, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 10, fontWeight: '500' }]}>SGPA (Current)</Text>
              <Text style={[textStyles.h2, { color: colors.primary, fontSize: 24, marginVertical: 4 }]}>{sgpaValue}</Text>
              <Text style={[textStyles.small, { color: colors.textPrimary, fontSize: 10, fontWeight: '500' }]}>{currentSGPA > 0 ? `\${getGPALabel(currentSGPA)} \${getGPAEmoji(currentSGPA)}` : 'No grades'}</Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Academics Section */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)}>
        <SectionTitle title="Academics" />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="document-text-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Grades & SGPA Tracker" 
              subtitle="View semester grades and SGPA history" 
              onPress={() => router.push('/academics' as any)} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="locate-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="GPA Goals" 
              subtitle="Set and track your academic goals"
              onPress={() => router.push('/(modals)/goal' as any)} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="book-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Subjects" 
              subtitle="Manage your subjects and credits"
              onPress={() => router.push('/academics/subjects' as any)} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="bar-chart-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight}
              title="Performance Analytics" 
              subtitle="Detailed insights on your academic performance"
              onPress={() => router.push('/analytics' as any)} 
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
              onPress={() => router.push('/settings' as any)} 
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
              title="About CampusIQ" 
              subtitle="Learn more about the app"
              rightText="v1.0.0" 
              onPress={() => Alert.alert('CampusIQ', 'The operating system for college students.')} 
              showChevron={false}
            />
          </Card>
        </View>
      </Animated.View>
    </ScrollView>
    </SafeAreaView>
  );
}
