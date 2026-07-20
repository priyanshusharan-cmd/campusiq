// Campora — Timetable Screen
// Weekly timetable redesigned to match UI reference

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme';
import { EmptyState } from '@/components/ui';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { Card } from '@/components/ui/Card';
import { useTimetableData } from './hooks';
import { DaySelector } from './components/DaySelector';
import { TimelineView } from './components/TimelineView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { useProfileStore, useSubjectStore, useAttendanceStore } from '@/stores';
import { AttendanceStatusModal } from '@/components/ui/AttendanceStatusModal';

export default function TimetableScreen() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const router = useRouter();
  const { colors, spacing, textStyles } = useTheme();
  const { selectedDay, setSelectedDay, classes, days } = useTimetableData();
  const profile = useProfileStore(s => s.profile);
  const subjects = useSubjectStore(s => s.subjects);
  const firstName = profile?.name?.split(' ')[0] || 'Student';
  
  const hasSubjects = subjects.length > 0;
  const markBulkAttendance = useAttendanceStore(s => s.markBulkAttendance);
  const markDayAsHoliday = useAttendanceStore(s => s.markDayAsHoliday);
  const markAttendance = useAttendanceStore(s => s.markAttendance);
  const removeRecord = useAttendanceStore(s => s.removeRecord);
  const allRecords = useAttendanceStore(s => s.records);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      // Import dynamically or get the value from the hook
      // Actually we can just use the same logic from the hook
      const day = new Date().getDay();
      const currentDayIndex = day === 0 ? 6 : day - 1;
      const initialDay = Math.min(currentDayIndex, 5);
      setSelectedDay(initialDay as any);
    }, [setSelectedDay])
  );

  const setAttendanceStatus = (status: 'present' | 'absent' | 'cancelled' | 'holiday' | 'none') => {
    if (!selectedClassId || !selectedSubjectId) return;
    const selectedDayStr = days[selectedDay].dateString;

    if (status === 'none') {
      const existing = allRecords.find(r => r.subjectId === selectedSubjectId && r.date === selectedDayStr && r.timetableEntryId === selectedClassId);
      if (existing) removeRecord(existing.id);
    } else {
      markAttendance(selectedSubjectId, selectedDayStr, status, selectedClassId);
    }
    
    setShowStatusModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      
      {/* Top App Bar */}
      <TopNavBar firstName={firstName} avatarUri={profile?.avatarUri} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title and Toggles */}
        <View style={[styles.headerRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={[textStyles.h1, { color: colors.textPrimary }]}>Timetable</Text>
          <Pressable 
            style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => setViewMode(v => v === 'week' ? 'month' : 'week')}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[textStyles.smallMedium, { color: colors.primary }]}>{viewMode === 'week' ? 'Week' : 'Month'}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {viewMode === 'week' ? (
          <>
            {/* Day selector */}
            <DaySelector days={days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

            {/* Timeline Classes List */}
            {!hasSubjects ? (
              <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
                <Card>
                  <EmptyState
                    icon="book-outline"
                    title="No Subjects"
                    subtitle="You need to add subjects before scheduling classes."
                  />
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Pressable 
                      style={{ backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                      onPress={() => router.push('/(modals)/create-subject' as any)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Add Subject</Text>
                    </Pressable>
                  </View>
                </Card>
              </Animated.View>
            ) : classes.length === 0 ? (
              <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
                <Card>
                  <EmptyState
                    icon="sunny-outline"
                    title="No Classes"
                    subtitle="No classes scheduled for this day. Enjoy your free time!"
                  />
                </Card>
              </Animated.View>
            ) : (
              <TimelineView 
                classes={classes} 
                onLongPressClass={(cls) => {
                  setSelectedClassId(cls.id);
                  setSelectedSubjectId(cls.subjectId);
                  setShowStatusModal(true);
                }}
              />
            )}


          </>
        ) : (
          <MonthCalendarView />
        )}

        {/* Bottom Info Cards */}
        <Animated.View entering={FadeInDown.delay(20).duration(100)} style={styles.bottomCards}>
          


          {/* Quick Actions */}
          <Card variant="outlined" padding={16} style={{ borderRadius: 16, marginTop: 12 }}>
            <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 12 }]}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <ActionItem 
                icon="calendar-outline" 
                color={colors.primary} 
                label="Add Class" 
                onPress={() => router.push('/(modals)/create-class')}
              />
              <ActionItem 
                icon="add-circle-outline" 
                color={colors.warning} 
                label="Extra Class" 
                onPress={() => router.push(`/(modals)/create-extra-class?date=${days[selectedDay].dateString}` as any)}
              />
              <ActionItem 
                icon="share-social-outline" 
                color={colors.info} 
                label="Share" 
                onPress={async () => {
                  try {
                    await Share.share({
                      message: 'Check out my class timetable on CampusIQ!',
                    });
                  } catch (error) {
                    console.error(error);
                  }
                }}
              />
            </View>


          </Card>

        </Animated.View>

      </ScrollView>

      {/* Status Selection Modal */}
      <AttendanceStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSelectStatus={setAttendanceStatus}
      />

    </SafeAreaView>
  );
}

// Subcomponents for Bottom Cards
function LegendItem({ color, label }: { color: string, label: string }) {
  const { colors, textStyles } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[textStyles.small, { color: colors.textSecondary, fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

function ActionItem({ icon, color, label, onPress }: { icon: keyof typeof Ionicons.glyphMap, color: string, label: string, onPress?: () => void }) {
  const { textStyles } = useTheme();
  return (
    <Pressable style={styles.actionItem} onPress={onPress}>
      <Ionicons name={icon as any} size={16} color={color} style={{ marginRight: 6 }} />
      <Text style={[textStyles.small, { color: '#4B5563', fontSize: 11 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    height: 32,
  },
  activeToggleItem: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  inactiveToggleItem: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 32,
  },
  bottomCards: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dayActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
