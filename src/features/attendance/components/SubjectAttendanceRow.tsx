// Campora — SubjectAttendanceRow Component
// Now redesigned as a row item to be placed inside a larger card

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSettingsStore, useSubjectStore } from '@/stores';
import { getSubjectTheme } from '@/utils/subjectTheme';

import { useRouter } from 'expo-router';

interface SubjectAttendanceRowProps {
  data: {
    subjectId: string;
    subjectName: string;
    shortName?: string;
    subjectColor: string;
    present: number;
    absent: number;
    totalClasses: number;
    percentage: number;
    canMiss: number;
    target?: number;
  };
  isLast?: boolean;
}

export function SubjectAttendanceRow({ data, isLast = false }: SubjectAttendanceRowProps) {
  const { colors, textStyles, isDark } = useTheme();
  const getSubject = useSubjectStore(s => s.getSubject);
  const router = useRouter();

  const fullSubject = getSubject(data.subjectId);
  const subjectCode = fullSubject?.code || '';

  // Extract initials for the square icon
  const initials = data.shortName || data.subjectName
    .split(' ')
    .filter(word => word.length > 0 && word.toLowerCase() !== '&' && word.toLowerCase() !== 'and')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const globalTarget = useSettingsStore(s => s.attendanceTarget);
  const target = data.target ?? globalTarget;

  const getStatus = (percentage: number) => {
    if (percentage >= target + 10) return { label: 'Excellent', color: colors.success };
    if (percentage >= target + 5) return { label: 'Good', color: colors.success };
    if (percentage > target) return { label: 'Above Target', color: colors.success };
    if (percentage === target) return { label: 'On Track', color: colors.success };
    if (percentage >= target - 5) return { label: 'At Risk', color: colors.warning };
    return { label: 'Critical', color: colors.danger };
  };

  const status = getStatus(data.percentage);
  const progressWidth = `${Math.min(data.percentage, 100)}%`;
  const isPerfect = data.totalClasses > 0 && data.percentage === 100;
  
  const theme = getSubjectTheme(data.subjectName, subjectCode, isDark, data.subjectColor || fullSubject?.color, fullSubject?.icon);
  const icon = theme.icon;

  return (
    <Pressable onPress={() => router.push(`/attendance/${data.subjectId}?tab=attendance`)} style={styles.container}>
      <View style={styles.row}>
        {/* Left Icon */}
        <View style={[styles.iconSquare, { backgroundColor: theme.bgColor }]}>
          <Ionicons name={icon} size={20} color={theme.color} />
        </View>

        {/* Content Column */}
        <View style={styles.content}>
          {/* Top Row: Title & Percentage */}
          <View style={styles.header}>
            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, flex: 1, marginRight: 12, fontSize: 16, fontWeight: '600' }]} numberOfLines={1}>
              {data.subjectName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[textStyles.bodyMedium, { color: status.color, fontSize: 16, fontWeight: '700', marginRight: 4 }]}>
                {data.totalClasses > 0 ? `${data.percentage.toFixed(0)}%` : '—'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressBarFill, { width: progressWidth as any, backgroundColor: status.color }]} />
          </View>

          {/* Bottom Row: Stats & Badge */}
          <View style={styles.footer}>
            <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 12 }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{data.present}</Text> / {data.totalClasses} classes
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: status.color + '15', marginRight: 8 }]}>
                <Text style={[textStyles.small, { color: status.color, fontSize: 11, fontWeight: '600' }]}>{status.label}</Text>
              </View>
              <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 12 }]}>
                {isPerfect ? 'Perfect!' : `Miss ${data.canMiss > 0 ? data.canMiss : 0}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  divider: {
    height: 1,
  }
});
