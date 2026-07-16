// Campora — TimelineView Component
// Renders the timetable classes in a continuous daily timeline

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import type { TimetableEntryWithSubject } from '@/types';
import { formatTime } from '@/lib';
import { useRouter } from 'expo-router';

interface TimelineViewProps {
  classes: TimetableEntryWithSubject[];
  onLongPressClass?: (cls: TimetableEntryWithSubject) => void;
}

const HOUR_HEIGHT = 100;

export function TimelineView({ classes, onLongPressClass }: TimelineViewProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minHour = classes.length > 0 
    ? Math.min(...classes.map(c => parseInt(c.startTime.split(':')[0], 10)), 8)
    : 8;
  const maxHour = classes.length > 0
    ? Math.max(...classes.map(c => {
        const h = parseInt(c.endTime.split(':')[0], 10);
        const m = parseInt(c.endTime.split(':')[1], 10);
        return m > 0 ? h + 1 : h; 
      }), 17)
    : 17;
    
  const length = Math.max(1, maxHour - minHour + 1);
  const hours = Array.from({ length }, (_, i) => i + minHour);

  const getAmPm = (hour: number) => {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return { h, ampm };
  };

  return (
    <View style={styles.container}>
      {/* Grid Lines */}
      {hours.map((hour, i) => {
        const { h, ampm } = getAmPm(hour);
        const isLast = i === hours.length - 1;
        
        return (
          <View key={`grid-${hour}`} style={[styles.row, { height: HOUR_HEIGHT }]}>
            <View style={styles.timeColumn}>
              <Text style={[textStyles.body, { color: colors.textSecondary }]}>{h}:00</Text>
              <Text style={[textStyles.small, { color: colors.textTertiary, marginTop: -2 }]}>{ampm}</Text>
            </View>
            <View style={[styles.contentColumn, { borderBottomColor: isLast ? 'transparent' : colors.borderLight }]} />
          </View>
        );
      })}

      {/* Class Cards */}
      <View style={styles.cardsOverlay}>
        {classes.map((cls, idx) => {
          const startMins = parseTimeToMinutes(cls.startTime);
          const endMins = parseTimeToMinutes(cls.endTime);
          const timelineStartMins = minHour * 60;
          
          const topOffset = ((startMins - timelineStartMins) / 60) * HOUR_HEIGHT;
          const duration = Math.max(endMins - startMins, 45); // minimum height limit for readability
          const height = (duration / 60) * HOUR_HEIGHT;
          
          return (
            <Animated.View 
              key={cls.id}
              entering={FadeInDown.delay(20 * (idx + 1)).duration(80)} 
              style={[
                styles.classBlockAbsolute, 
                { 
                  backgroundColor: cls.subjectColor + '15',
                  top: topOffset + 12, // +12 to align with the text which has some padding
                  height: height - 4, // slight gap
                  borderLeftColor: cls.subjectColor,
                  borderLeftWidth: 4,
                }
              ]}
            >
              <Pressable 
                style={styles.cardPressable}
                onPress={() => router.push(`/attendance/${cls.subjectId}` as any)}
                onLongPress={() => onLongPressClass?.(cls)}
              >
                <View style={styles.blockHeader}>
                  <Text style={[textStyles.bodyMedium, { color: cls.subjectColor, flex: 1 }]} numberOfLines={1}>
                    {cls.subjectName}
                  </Text>
                  <View style={styles.timeTag}>
                    <View style={[styles.dot, { backgroundColor: cls.subjectColor }]} />
                    <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 10 }]} numberOfLines={1}>
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.blockFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
                    <Text style={[textStyles.small, { color: colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                      {cls.faculty}
                    </Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                    <Text style={[textStyles.small, { color: colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                      {cls.room}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 20,
    marginTop: 8,
    position: 'relative',
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    paddingTop: 12,
  },
  contentColumn: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  cardsOverlay: {
    position: 'absolute',
    top: 0,
    left: 60,
    right: 0,
    bottom: 0,
  },
  classBlockAbsolute: {
    position: 'absolute',
    left: 8, 
    right: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'flex-start',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  blockFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  separator: {
    width: 1,
    height: 10,
    backgroundColor: '#D1D5DB', 
    marginHorizontal: 8,
  }
});
