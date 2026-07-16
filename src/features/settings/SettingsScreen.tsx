// Campora — Settings Screen

import React from 'react';
import { View, Text, Switch, Alert, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, SectionHeader, ListRow } from '@/components/ui';
import { useSettingsStore, useAcademicStore, useAttendanceStore, useAssignmentStore, useExamStore, useSubjectStore, useTimetableStore, useProfileStore } from '@/stores';

export default function SettingsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const settings = useSettingsStore();

  const handleResetData = () => {
    Alert.alert('Reset App Data', 'Are you sure you want to delete all your data? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' }, 
      { text: 'Reset', style: 'destructive', onPress: () => { 
          useAcademicStore.getState().clearAll(); 
          useAttendanceStore.getState().clearRecords(); 
          useTimetableStore.getState().clearEntries(); 
          useAssignmentStore.getState().clearAssignments(); 
          useExamStore.getState().clearExams(); 
          useSubjectStore.getState().clearSubjects();
          alert('Data cleared!'); 
        } 
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? All data and profile information will be permanently erased.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          useAcademicStore.getState().clearAll(); 
          useAttendanceStore.getState().clearRecords(); 
          useTimetableStore.getState().clearEntries(); 
          useAssignmentStore.getState().clearAssignments(); 
          useExamStore.getState().clearExams(); 
          useSubjectStore.getState().clearSubjects();
          useProfileStore.getState().clearProfile();
          useSettingsStore.getState().resetSettings();
          router.replace('/');
        }
      }
    ]);
  };

  const cycleTheme = () => {
    const nextTheme = settings.theme === 'system' ? 'light' : settings.theme === 'light' ? 'dark' : 'system';
    settings.setTheme(nextTheme);
  };

  const getThemeText = () => {
    if (settings.theme === 'system') return 'System Default';
    if (settings.theme === 'light') return 'Light Mode';
    return 'Dark Mode';
  };

  const handleEditTarget = () => {
    Alert.prompt('Attendance Target', 'Enter your new attendance target (%)', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: (val?: string) => {
        const num = parseInt(val || '75', 10);
        if (!isNaN(num)) settings.setAttendanceTarget(num);
      }}
    ], 'plain-text', settings.attendanceTarget.toString(), 'decimal-pad');
  };



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        
        <Animated.View entering={FadeInDown.delay(0).duration(80)}>
          <SectionHeader title="Appearance" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="moon-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} 
              title="Dark Mode" 
              rightText={getThemeText()} 
              showChevron={false} 
              onPress={cycleTheme}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <SectionHeader title="Academics" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="flag-outline" iconColor={colors.success} iconBackgroundColor={colors.successLight} 
              title="Attendance Target" 
              rightText={`\${settings.attendanceTarget}%`}
              showChevron={true} 
              onPress={handleEditTarget}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <SectionHeader title="Preferences" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="notifications-outline" iconColor={colors.info} 
              title="Class Reminders" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={settings.classReminders} 
                  onValueChange={settings.toggleClassReminders} 
                  trackColor={{ false: colors.border, true: colors.info }} 
                />
              } 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="hardware-chip-outline" iconColor={colors.warning} 
              title="Haptic Feedback" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={settings.hapticFeedback} 
                  onValueChange={settings.toggleHapticFeedback} 
                  trackColor={{ false: colors.border, true: colors.warning }} 
                />
              } 
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <SectionHeader title="Developer & Data" />
          <Card variant="flat" padding={0}>

            <ListRow 
              icon="trash-outline" iconColor={colors.danger} 
              title="Clear All Data" 
              onPress={handleResetData} 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="person-remove-outline" iconColor={colors.danger} 
              title="Delete Account" 
              onPress={handleDeleteAccount} 
            />
          </Card>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
