// Campora — OverviewCards Component (Attendance)
// Horizontal scrollable stats cards for attendance

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface OverviewCardsProps {
  percentage: number;
  attended: number;
  missed: number;
  total: number;
  canMiss: number;
}

export function OverviewCards({ percentage, attended, missed, total, canMiss }: OverviewCardsProps) {
  const { colors, spacing, textStyles } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.sm, paddingTop: 4 }}
    >
      {/* Overall Attendance */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, fontSize: 12 }]}>Overall Attendance</Text>
        <Text style={[textStyles.display, { color: percentage >= 85 ? colors.success : colors.warning, fontSize: 38, marginTop: 12, marginBottom: 12, lineHeight: 42 }]}>
          {percentage > 0 ? `${percentage.toFixed(0)}%` : '—'}
        </Text>
        <View style={[styles.badge, { backgroundColor: percentage >= 85 ? colors.successLight : colors.warningLight }]}>
          <View style={[styles.dot, { backgroundColor: percentage >= 85 ? colors.success : colors.warning }]} />
          <Text style={[textStyles.smallMedium, { color: percentage >= 85 ? colors.success : colors.warning, fontSize: 11 }]}>
            {percentage >= 85 ? 'Above Target' : 'Below Target'}
          </Text>
        </View>
      </View>

      {/* Classes Attended */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, fontSize: 12 }]}>Classes Attended</Text>
        <Text style={[textStyles.display, { color: colors.info, fontSize: 38, marginTop: 14, marginBottom: 6, lineHeight: 42 }]}>
          {attended}
        </Text>
        <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 12 }]}>
          / {total}
        </Text>
      </View>

      {/* Classes Missed */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, fontSize: 12 }]}>Classes Missed</Text>
        <Text style={[textStyles.display, { color: '#F97316', fontSize: 38, marginTop: 14, marginBottom: 6, lineHeight: 42 }]}>
          {missed}
        </Text>
        <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 12 }]}>
          / {total}
        </Text>
      </View>

      {/* You can miss */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, fontSize: 12 }]}>You can miss</Text>
        <Text style={[textStyles.display, { color: colors.primary, fontSize: 38, marginTop: 14, marginBottom: 6, lineHeight: 42 }]}>
          {canMiss > 0 ? canMiss : 0}
        </Text>
        <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 12 }]}>
          more classes
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 145,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  }
});
