// Campora — Profile Header Card
// Shows avatar, name, enrollment, branch, semester, and stats

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { getGPALabel, getGPAEmoji } from '@/lib';
import { DEFAULTS } from '@/constants';

interface ProfileViewCardProps {
  name: string;
  enrollmentNumber: string;
  branch: string;
  semesterStr: string;
  college: string;
  section: string;
  currentSGPA: number;
  cgpa: number;
  completedCredits: number;
}

export function ProfileViewCard({
  name, enrollmentNumber, branch, semesterStr, college, section,
  currentSGPA, cgpa, completedCredits,
}: ProfileViewCardProps) {
  const { colors, spacing, textStyles, radius } = useTheme();

  return (
    <>
      {/* User Info Row */}
      <Animated.View entering={FadeInDown.duration(100)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
        <View style={{ position: 'relative', marginRight: spacing.xl }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 16, padding: 6, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: 4 }]}>{name}</Text>
          <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 2 }]}>{enrollmentNumber}</Text>
          <Text style={[textStyles.small, { color: colors.textSecondary, marginBottom: 12 }]}>{branch}, {semesterStr}</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
              <Ionicons name="business-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[textStyles.small, { color: colors.primary, fontSize: 10, fontWeight: '500' }]}>{college}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
              <Ionicons name="people-outline" size={12} color="#0284C7" style={{ marginRight: 4 }} />
              <Text style={[textStyles.small, { color: '#0284C7', fontSize: 10, fontWeight: '500' }]}>Section {section}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View entering={FadeInDown.delay(20).duration(100)}>
        <Card variant="flat" padding={16} style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[textStyles.small, { color: colors.textSecondary }]}>SGPA <Text style={{fontSize: 10}}>(Current)</Text></Text>
              <Text style={[textStyles.h2, { color: colors.primary, marginVertical: 4 }]}>{currentSGPA > 0 ? currentSGPA.toFixed(2) : '--'}</Text>
              <Text style={[textStyles.small, { color: colors.textPrimary, fontSize: 11 }]}>{currentSGPA > 0 ? `${getGPALabel(currentSGPA)} ${getGPAEmoji(currentSGPA)}` : 'No grades yet'}</Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.divider, marginVertical: 8 }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[textStyles.small, { color: colors.textSecondary }]}>CGPA <Text style={{fontSize: 10}}>(Cumulative)</Text></Text>
              <Text style={[textStyles.h2, { color: '#3B82F6', marginVertical: 4 }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
              <Text style={[textStyles.small, { color: colors.textPrimary, fontSize: 11 }]}>{cgpa > 0 ? `${getGPALabel(cgpa)} ${getGPAEmoji(cgpa)}` : 'No grades yet'}</Text>
            </View>

            <View style={{ width: 1, backgroundColor: colors.divider, marginVertical: 8 }} />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[textStyles.small, { color: colors.textSecondary }]}>Credits Completed</Text>
              <Text style={[textStyles.h2, { marginVertical: 4 }]}>
                <Text style={{ color: '#10B981' }}>{completedCredits} </Text>
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>/ {DEFAULTS.maxCredits}</Text>
              </Text>
              <Text style={[textStyles.small, { color: colors.textPrimary, fontSize: 11 }]}>On Track ✅</Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    </>
  );
}
