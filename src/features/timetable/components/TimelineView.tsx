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
import { getSubjectTheme } from '@/utils/subjectTheme';
import { useSettingsStore } from '@/stores';

interface TimelineViewProps {
  classes: TimetableEntryWithSubject[];
  onLongPressClass?: (cls: TimetableEntryWithSubject) => void;
  onEmptySlotLongPress?: (timeStr: string) => void;
}

const HOUR_HEIGHT = 100;

export function TimelineView({ classes, onLongPressClass, onEmptySlotLongPress }: TimelineViewProps) {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const { collegeStartTime, collegeEndTime } = useSettingsStore();
  const cMinHour = parseInt(collegeStartTime.split(':')[0], 10) || 8;
  const cMaxHour = parseInt(collegeEndTime.split(':')[0], 10) || 17;
  const isNightShift = cMaxHour < cMinHour;

  let minHour = cMinHour;
  let maxHour = isNightShift ? cMaxHour + 24 : cMaxHour;

  classes.forEach(c => {
    let sH = parseInt(c.startTime.split(':')[0], 10);
    let eH = parseInt(c.endTime.split(':')[0], 10);
    const m = parseInt(c.endTime.split(':')[1], 10);
    if (m > 0) eH += 1;

    if (isNightShift && sH < cMinHour) sH += 24;
    if (isNightShift && eH < cMinHour) eH += 24;
    if (eH < sH) eH += 24;
  });
    
  const length = Math.max(1, maxHour - minHour + 1);
  const hours = Array.from({ length }, (_, i) => i + minHour);

  const getAmPm = (hour: number) => {
    const displayHour = hour % 24;
    const h = displayHour % 12 === 0 ? 12 : displayHour % 12;
    const ampm = displayHour >= 12 ? 'PM' : 'AM';
    return { h, ampm, displayHour };
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
      <Pressable 
        style={styles.cardsOverlay}
        onLongPress={(e) => {
          if (!onEmptySlotLongPress) return;
          const tappedMins = (e.nativeEvent.locationY / HOUR_HEIGHT) * 60;
          const totalMins = Math.round(minHour * 60 + tappedMins);
          // Round to nearest 30 mins
          const remainder = totalMins % 30;
          const roundedMins = totalMins - remainder + (remainder >= 15 ? 30 : 0);
          
          let h = Math.floor(roundedMins / 60) % 24;
          const m = roundedMins % 60;
          
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const timeStr = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
          
          onEmptySlotLongPress(timeStr);
        }}
      >
        {classes.map((cls, idx) => {
          let startMins = parseTimeToMinutes(cls.startTime);
          let endMins = parseTimeToMinutes(cls.endTime);
          
          if (isNightShift && startMins < cMinHour * 60) startMins += 24 * 60;
          if (isNightShift && endMins < cMinHour * 60) endMins += 24 * 60;
          if (endMins < startMins) endMins += 24 * 60;
          
          const timelineStartMins = minHour * 60;
          
          const topOffset = ((startMins - timelineStartMins) / 60) * HOUR_HEIGHT;
          const duration = endMins - startMins;
          const height = (duration / 60) * HOUR_HEIGHT;
          
          const theme = getSubjectTheme(cls.subjectName, cls.subjectShortName, colors.bg === '#000000', cls.subjectColor, cls.subjectIcon);

          return (
            <Animated.View 
              key={cls.id}
              entering={FadeInDown.delay(20 * (idx + 1)).duration(80)} 
              style={[
                styles.classBlockAbsolute, 
                { 
                  backgroundColor: theme.bgColor,
                  top: topOffset + 12, // +12 to align with the text which has some padding
                  height: height - 4, // slight gap
                  borderLeftColor: theme.color,
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
                  <Text style={[textStyles.bodyMedium, { color: theme.color, flex: 1 }]} numberOfLines={1}>
                    {cls.subjectName}
                  </Text>
                  <View style={styles.timeTag}>
                    <View style={[styles.dot, { backgroundColor: theme.color }]} />
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
      </Pressable>
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
