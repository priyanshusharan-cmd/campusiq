import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme';
import { getGradeColor } from '@/types';
import type { Subject, GradeScheme } from '@/types';
import { calculateTotalSubjectScore, getGradeBoundary, convertLegacyToComponents } from '@/lib/gradingEngine';
import { Ionicons } from '@expo/vector-icons';
import { getSubjectTheme } from '@/utils/subjectTheme';
import { useSettingsStore, useAcademicStore } from '@/stores';

interface SubjectPredictorCardProps {
  subject: Subject;
  scheme: GradeScheme;
  requiredPercentage?: number;
  isCompleted?: boolean;
  onPress: () => void;
}

export function SubjectPredictorCard({ subject, scheme, requiredPercentage, isCompleted, onPress }: SubjectPredictorCardProps) {
  const { colors, isDark, fontFamily } = useTheme();
  const settings = useSettingsStore();

  // Either use dynamic components or fallback to legacy calculation
  const components = subject.components || convertLegacyToComponents(subject.cieMarks, subject.aatMarks, subject.labInternalMarks, settings, subject.type === 'lab');
  
  let currentScore = calculateTotalSubjectScore(components, false);
  const maxScore = calculateTotalSubjectScore(components, true);
  let maxPossible = components.reduce((sum, c) => sum + c.weight, 0) || 100;
  
  // Calculate target score based on uniform percentage of remaining marks
  let targetScore = currentScore;
  let hasTarget = false;
  if (!isCompleted && requiredPercentage !== undefined && maxScore > currentScore) {
    targetScore = Math.ceil(currentScore + (maxScore - currentScore) * requiredPercentage);
    hasTarget = true;
  }
  
  const currentPercentage = maxPossible > 0 ? Math.round((currentScore / maxPossible) * 100) : 0;
  const maxPercentage = maxPossible > 0 ? Math.round((maxScore / maxPossible) * 100) : 0;
  const targetPercentage = maxPossible > 0 ? Math.round((targetScore / maxPossible) * 100) : 0;

  let currentBoundary = getGradeBoundary(scheme, currentPercentage);
  const maxBoundary = getGradeBoundary(scheme, maxPercentage);
  const targetBoundary = getGradeBoundary(scheme, targetPercentage);

  const currentSemester = useAcademicStore(s => s.getCurrentSemester());
  if (isCompleted && currentSemester?.sgpaSubjects) {
    const sgpaSub = currentSemester.sgpaSubjects.find(s => s.id === subject.id || s.name.trim().toLowerCase() === subject.name.trim().toLowerCase());
    if (sgpaSub) {
      currentScore = parseFloat(sgpaSub.totalMarks) || 0;
      maxPossible = 100;
      const gp = parseFloat(sgpaSub.gradePoint) || 0;
      const foundBoundary = scheme.boundaries.find(g => g.gradePoints === gp);
      currentBoundary = foundBoundary || { id: 'fallback', minMarks: 0, maxMarks: 0, gradeLetter: gp > 0 ? 'P' : 'F', gradePoints: gp };
    }
  }

  const subjectTheme = getSubjectTheme(subject.name, subject.code, isDark, subject.color, subject.icon);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.cardContainer} disabled={isCompleted}>
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
          {!isCompleted && (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              {isCompleted ? 'Final Marks' : 'Current'}
            </Text>
            <Text style={[styles.metricValue, { color: isCompleted ? colors.textPrimary : colors.primary, fontFamily: fontFamily.bold }]}>
              {currentScore.toFixed(1)} <Text style={styles.metricUnit}>/ {maxPossible}</Text>
            </Text>
            {!isCompleted && (
              <Text style={[styles.gradeBadge, { backgroundColor: colors.surfaceHover, color: colors.textPrimary }]}>
                {currentBoundary.gradeLetter} ({currentBoundary.gradePoints} pt)
              </Text>
            )}
          </View>

          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              {isCompleted ? 'Final Grade' : 'Max Possible'}
            </Text>
            {!isCompleted ? (
              <>
                <Text style={[styles.metricValue, { color: colors.success, fontFamily: fontFamily.bold }]}>
                  {maxScore.toFixed(1)} <Text style={styles.metricUnit}>/ {maxPossible}</Text>
                </Text>
                <Text style={[styles.gradeBadge, { backgroundColor: colors.success + '20', color: colors.success }]}>
                  {maxBoundary.gradeLetter} ({maxBoundary.gradePoints} pt)
                </Text>
              </>
            ) : (
              <Text style={[styles.metricValue, { color: getGradeColor(currentBoundary.gradeLetter as any) || colors.success, fontFamily: fontFamily.bold }]}>
                {currentBoundary.gradeLetter} <Text style={[styles.metricUnit, { color: getGradeColor(currentBoundary.gradeLetter as any) || colors.success }]}>({currentBoundary.gradePoints} pt)</Text>
              </Text>
            )}
          </View>
        </View>

        {hasTarget && (
          <View style={[styles.targetRow, { backgroundColor: isDark ? 'rgba(138, 115, 255, 0.1)' : 'rgba(138, 115, 255, 0.05)', borderColor: isDark ? 'rgba(138, 115, 255, 0.2)' : 'rgba(138, 115, 255, 0.1)' }]}>
            <Ionicons name="flag" size={16} color="#8A73FF" />
            <Text style={[styles.targetText, { color: colors.textPrimary, fontFamily: fontFamily.medium }]}>
              Target to hit Goal: <Text style={{ fontFamily: fontFamily.bold, color: '#8A73FF' }}>{targetScore}</Text> marks ({targetBoundary.gradeLetter})
            </Text>
          </View>
        )}
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
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  targetText: {
    fontSize: 13,
    marginLeft: 8,
  }
});
