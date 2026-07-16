// Campora — Subjects Setup (Onboarding)

import React from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { useSettingsStore } from '@/stores';

export default function SubjectsSetupScreen() {
  const { colors, spacing, textStyles, radius } = useTheme();
  const router = useRouter();
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);

  const handleFinishEmpty = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: 60 }}>
        <Animated.View entering={FadeInDown.duration(100)}>
          <Text style={[textStyles.h1, { color: colors.textPrimary, marginBottom: spacing.xs }]}>Set up your subjects</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing['3xl'] }]}>Enter your subjects and timetable from scratch.</Text>

          <View style={{ gap: spacing.md }}>
            <Card variant="outlined" onPress={handleFinishEmpty}>
              <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Continue</Text>
              <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>Start adding your academic details.</Text>
            </Card>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
