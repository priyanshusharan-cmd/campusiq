// Campora — Profile Setup (Onboarding)

import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { useProfileStore, useAcademicStore } from '@/stores';

export default function ProfileSetupScreen() {
  const { colors, spacing, textStyles, radius } = useTheme();
  const router = useRouter();
  const setProfile = useProfileStore((s) => s.setProfile);

  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      setProfile({ name: name.trim(), college: college.trim(), branch: branch.trim(), currentSemester: 1 });
      
      const academicStore = useAcademicStore.getState();
      if (academicStore.semesters.length === 0) {
        academicStore.addSemester({
          name: 'Semester 1',
          number: 1,
          isCurrent: true,
          
        });
      }

      router.push('/(onboarding)/subjects');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: 60 }}>
        <Animated.View entering={FadeInDown.duration(100)}>
          <Text style={[textStyles.h1, { color: colors.textPrimary, marginBottom: spacing.xs }]}>Who are you?</Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing['3xl'] }]}>Let's set up your profile.</Text>

          <View style={{ gap: spacing.lg }}>
            <View>
              <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: spacing.xs, marginLeft: spacing.xs }]}>Full Name</Text>
              <TextInput
                style={{ backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md, fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderLight }}
                placeholder="Aryan Sharma"
                placeholderTextColor={colors.textQuaternary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
            <View>
              <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: spacing.xs, marginLeft: spacing.xs }]}>College / University (Optional)</Text>
              <TextInput
                style={{ backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md, fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderLight }}
                placeholder="WCEM Nagpur"
                placeholderTextColor={colors.textQuaternary}
                value={college}
                onChangeText={setCollege}
              />
            </View>
            <View>
              <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: spacing.xs, marginLeft: spacing.xs }]}>Branch (Optional)</Text>
              <TextInput
                style={{ backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md, fontSize: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderLight }}
                placeholder="CSE"
                placeholderTextColor={colors.textQuaternary}
                value={branch}
                onChangeText={setBranch}
              />
            </View>
          </View>
        </Animated.View>

        <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.xl, marginTop: spacing['2xl'] }}>
          <Card
            variant="flat"
            onPress={handleNext}
            style={{ backgroundColor: name.trim() ? colors.primary : colors.bgSecondary, paddingVertical: spacing.lg, borderRadius: radius.full, alignItems: 'center' }}
          >
            <Text style={[textStyles.h3, { color: name.trim() ? colors.white : colors.textTertiary }]}>Continue</Text>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
