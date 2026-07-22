import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme';
import type { Subject, GradeScheme } from '@/types';
import { calculateTotalSubjectScore, getGradeBoundary, convertLegacyToComponents } from '@/lib/gradingEngine';
import { Ionicons } from '@expo/vector-icons';
import { getSubjectTheme } from '@/utils/subjectTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface SubjectPredictorCardProps {
  subject: Subject;
  scheme: GradeScheme;
  onPress: () => void;
}

export function SubjectPredictorCard({ subject, scheme, onPress }: SubjectPredictorCardProps) {
  const { colors, isDark, fontFamily } = useTheme();
  const settings = useSettingsStore();

  // Either use dynamic components or fallback to legacy calculation
  const components = subject.components || convertLegacyToComponents(subject.cieMarks, subject.aatMarks, subject.labInternalMarks, settings, subject.type === 'lab');
  
  const currentScore = calculateTotalSubjectScore(components, false);
  const maxScore = calculateTotalSubjectScore(components, true);
  
  const currentBoundary = getGradeBoundary(scheme, currentScore);
  const maxBoundary = getGradeBoundary(scheme, maxScore);

  const subjectTheme = getSubjectTheme(subject.name, subject.code, isDark, subject.color, subject.icon);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer}>
      <View
        style={[
          styles.blurContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface,
            borderColor: colors.borderLight,
            borderWidth: 1,
          }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: subjectTheme.bgColor }]}>
            <Ionicons name={subjectTheme.icon} size={20} color={subjectTheme.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.subjectName, { color: colors.textPrimary, fontFamily: fontFamily.semiBold }]} numberOfLines={1}>
              {subject.name}
            </Text>
            <Text style={[styles.subjectCode, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              {subject.code}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Current
            </Text>
            <Text style={[styles.metricValue, { color: colors.primary, fontFamily: fontFamily.bold }]}>
              {currentScore.toFixed(1)} <Text style={styles.metricUnit}>/ 100</Text>
            </Text>
            <Text style={[styles.gradeBadge, { backgroundColor: colors.surfaceHover, color: colors.textPrimary }]}>
              {currentBoundary.gradeLetter} ({currentBoundary.gradePoints} pt)
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Max Possible
            </Text>
            <Text style={[styles.metricValue, { color: colors.success, fontFamily: fontFamily.bold }]}>
              {maxScore.toFixed(1)} <Text style={styles.metricUnit}>/ 100</Text>
            </Text>
            <Text style={[styles.gradeBadge, { backgroundColor: colors.success + '20', color: colors.success }]}>
              {maxBoundary.gradeLetter} ({maxBoundary.gradePoints} pt)
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 16,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
  },
  subjectCode: {
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    marginBottom: 8,
  },
  metricUnit: {
    fontSize: 14,
    opacity: 0.6,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'hidden',
    fontWeight: '600',
  },
});
