// Campora — TodaySchedule Component
// Renders today's schedule inside a single card

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui/Card';
import type { TimetableEntryWithSubject } from '@/types';
import { formatTime } from '@/lib';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

interface TodayScheduleProps {
  classes: TimetableEntryWithSubject[];
}

export function TodaySchedule({ classes }: TodayScheduleProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  // If no classes, return null to save space
  if (classes.length === 0) return null;

  const getSubjectIcon = (subjectName: string): keyof typeof Ionicons.glyphMap => {
    const s = subjectName.toLowerCase();
    if (s.includes('database') || s.includes('dbms')) return 'server-outline';
    if (s.includes('algorithm') || s.includes('programming') || s.includes('java') || s.includes('code')) return 'code-slash-outline';
    return 'book-outline';
  };

  return (
    <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
      <Card variant="elevated" padding={0} style={styles.cardContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[textStyles.h3, { color: colors.textPrimary, fontSize: 18 }]}>Today&apos;s Schedule</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push('/(tabs)/timetable' as any)}>
              <Text style={[textStyles.smallMedium, { color: colors.primary }]}>View Timetable</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Classes List */}
        <View style={styles.list}>
          {classes.map((cls, index) => {
            const isLast = index === classes.length - 1;
            const icon = getSubjectIcon(cls.subjectName);

            return (
              <View key={cls.id}>
                <View style={styles.row}>
                  
                  {/* Left: Times */}
                  <View style={styles.timeColumn}>
                    <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>
                      {formatTime(cls.startTime).split(' ')[0]} {formatTime(cls.startTime).split(' ')[1]}
                    </Text>
                    <Text style={[textStyles.small, { color: colors.textTertiary }]}>
                      – {formatTime(cls.endTime)}
                    </Text>
                  </View>
                  
                  {/* Separator Line */}
                  <View style={[styles.line, { backgroundColor: cls.subjectColor }]} />
                  
                  {/* Middle: Details */}
                  <View style={styles.detailsColumn}>
                    <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
                      {cls.subjectName}
                    </Text>
                    <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                      {cls.faculty}  •  {cls.room}
                    </Text>
                  </View>

                  {/* Right: Icon */}
                  <View style={[styles.iconSquare, { backgroundColor: cls.subjectColor + '15' }]}>
                    <Ionicons name={icon} size={20} color={cls.subjectColor} />
                  </View>

                </View>
                {!isLast && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
              </View>
            );
          })}
        </View>

        {/* Bottom handle indicator (aesthetic) */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  list: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeColumn: {
    width: 75,
  },
  line: {
    width: 3,
    height: 36,
    borderRadius: 1.5,
    marginRight: 16,
  },
  detailsColumn: {
    flex: 1,
    paddingRight: 12,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#F3F4F6', // Using dashed border effect
    marginHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  }
});
