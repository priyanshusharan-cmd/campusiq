// Campora — Subject Attendance Detail Route

import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useAttendanceStore, useSubjectAttendance } from '@/stores/useAttendanceStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { DayOfWeek } from '@/types';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getPastScheduledClasses, calcAttendancePercentage, calcCanMiss, calcNeedToAttend } from '@/lib/attendanceUtils';
import { getSubjectTheme } from '@/utils/subjectTheme';
// Modular components
import { AttendanceGauge } from '@/features/attendance/components/AttendanceGauge';
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar';
import { ClassHistory } from '@/features/attendance/components/ClassHistory';
import { WeeklyClasses } from '@/features/attendance/components/WeeklyClasses';
import { ClassPickerModal, SubjectMenuModal } from '@/features/attendance/components/AttendanceModals';
import { AttendanceStatusModal } from '@/components/ui/AttendanceStatusModal';
import { styles } from '@/features/attendance/styles/attendanceDetailStyles';

export default function SubjectAttendanceDetailScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const { colors, spacing, textStyles, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const initialTab = (tab === 'attendance' || tab === 'overview') ? tab : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>(initialTab);

  const allRecords = useAttendanceStore(s => s.records);
  const markAttendance = useAttendanceStore(s => s.markAttendance);
  const removeRecord = useAttendanceStore(s => s.removeRecord);
  const timetableEntries = useTimetableStore(s => s.entries);
  const events = useTimetableStore(s => s.events);
  const profile = useProfileStore(s => s.profile);
  const removeSubject = useSubjectStore(s => s.removeSubject);
  const subject = useSubjectStore(state => state.subjects.find(s => s.id === id));
  const subjectStats = useSubjectAttendance().find(s => s.subjectId === id);

  const percentage = subjectStats?.percentage || 0;
  const present = subjectStats?.present || 0;
  const totalClasses = subjectStats?.totalClasses || 0;
  const canMiss = subjectStats?.canMiss || 0;
  const needToAttend = subjectStats?.needToAttend || 0;

  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [dayClasses, setDayClasses] = useState<typeof timetableEntries>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    // Basic copy to clipboard for faculty/room
  };

  const subjectRecords = useMemo(() => {
    const explicitRecords = allRecords.filter(r => r.subjectId === id);
    
    // Get all scheduled past classes
    const pastClasses = getPastScheduledClasses(id as string, timetableEntries, events, profile?.semesterStartDate);
    
    // Find assumed present classes
    const assumedRecords = pastClasses
      .filter(pc => !explicitRecords.some(er => er.date === pc.dateStr && er.timetableEntryId === pc.entryId))
      .map(pc => ({
        id: `assumed-${pc.dateStr}-${pc.entryId}`,
        subjectId: id as string,
        date: pc.dateStr,
        status: 'present', // Assumed present
        timetableEntryId: pc.entryId,
      }));
      
    const allSubjectRecords = [...explicitRecords, ...assumedRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Enrich with classType for filtering
    return allSubjectRecords.map(r => {
      const entry = timetableEntries.find(e => e.id === r.timetableEntryId);
      return {
        ...r,
        classType: entry?.type || 'lecture',
      };
    });
  }, [allRecords, id, timetableEntries, events, profile]);

  const subjectTimetableEntries = timetableEntries.filter(e => e.subjectId === id);
  const hasTheory = subjectTimetableEntries.some(e => e.type === 'lecture');
  const hasLab = subjectTimetableEntries.some(e => e.type === 'lab');

  const getStatsForType = (typeCategory: 'theory' | 'lab') => {
    const relevantEntries = subjectTimetableEntries.filter(e => 
      typeCategory === 'lab' ? e.type === 'lab' : e.type === 'lecture'
    );
    const entryIds = new Set(relevantEntries.map(e => e.id));
    if (entryIds.size === 0) return null;

    const filteredRecords = allRecords.filter(r => r.subjectId === id && entryIds.has(r.timetableEntryId as string));
    
    const explicitPresent = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;

    const pastScheduled = getPastScheduledClasses(id as string, timetableEntries, events, profile?.semesterStartDate)
       .filter(c => entryIds.has(c.entryId));

    let assumedPresent = 0;
    for (const scheduled of pastScheduled) {
      const hasRecord = filteredRecords.some(r => r.date === scheduled.dateStr && r.timetableEntryId === scheduled.entryId);
      if (!hasRecord) assumedPresent++;
    }

    const present = explicitPresent + assumedPresent;
    const totalClasses = present + absent;
    const percentage = calcAttendancePercentage(present, totalClasses);
    
    const target = subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget;
    const canMiss = calcCanMiss(present, totalClasses, target);
    const needToAttend = calcNeedToAttend(present, totalClasses, target);

    return { present, totalClasses, percentage, canMiss, needToAttend };
  };

  const theoryStats = getStatsForType('theory');
  const labStats = getStatsForType('lab');

  const subjectName = subject?.name || "Unknown Subject";
  const initials = subject?.shortName || "?";
  
  let typeText = "Subject";
  if (hasLab) typeText = "Theory & Lab";
  else if (hasTheory) typeText = "Theory Subject";

  const subDetails = [subject?.faculty, subject?.room].filter(Boolean).join(' · ');

  const handleChangeTarget = () => {
    setShowSubjectMenu(false);
    
    setTimeout(() => {
      Alert.prompt(
        'Attendance Target',
        `Enter target % for ${subjectName} (e.g. 75, 80). Leave empty to use global target.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (text?: string) => {
              const val = text?.trim();
              const updateSubject = useSubjectStore.getState().updateSubject;
              if (!val) {
                updateSubject(id as string, { attendanceTarget: undefined });
              } else {
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0 && num <= 100) {
                  updateSubject(id as string, { attendanceTarget: num });
                } else {
                  Alert.alert('Invalid Input', 'Please enter a valid number between 1 and 100.');
                }
              }
            }
          }
        ],
        'plain-text',
        subject?.attendanceTarget ? subject.attendanceTarget.toString() : ''
      );
    }, 300);
  };

  const handleDayPress = (day: any) => {
    const d = new Date(day.year, day.month - 1, day.day);
    const dayOfWeek = (d.getDay() === 0 ? 6 : d.getDay() - 1) as DayOfWeek;
    
    const classesOnDay = timetableEntries.filter(e => {
      if (e.subjectId !== id) return false;
      
      // If this is a one-off extra class, it only applies to its specific date
      if (e.date) {
        return e.date === day.dateString;
      }
      
      // Otherwise, it's a regular weekly class
      if (e.dayOfWeek !== dayOfWeek) return false;
      
      // Regular classes shouldn't show up outside the semester bounds
      if (profile?.semesterStartDate && day.dateString < profile.semesterStartDate) return false;
      if (profile?.semesterEndDate && day.dateString > profile.semesterEndDate) return false;
      
      return true;
    });

    if (classesOnDay.length === 0) {
      Alert.alert(
        'No Class', 
        'There is no class scheduled for this subject on this day. Would you like to create an extra class?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Extra Class', 
            onPress: () => router.push(`/(modals)/create-extra-class?subjectId=${id}&date=${day.dateString}`) 
          }
        ]
      );
      return;
    }

    setSelectedDayStr(day.dateString);
    if (classesOnDay.length === 1) {
      setSelectedClassId(classesOnDay[0].id);
      setShowStatusModal(true);
    } else {
      setDayClasses(classesOnDay);
      setShowClassModal(true);
    }
  };

  const openStatusModalForClass = (clsId: string) => {
    setShowClassModal(false);
    setSelectedClassId(clsId);
    setTimeout(() => setShowStatusModal(true), 100);
  };

  const setAttendanceStatus = (status: 'present' | 'absent' | 'cancelled' | 'holiday' | 'none') => {
    if (!selectedDayStr || !selectedClassId) return;
    if (status === 'none') {
      const existing = allRecords.find(r => r.subjectId === id && r.date === selectedDayStr && r.timetableEntryId === selectedClassId);
      if (existing) removeRecord(existing.id);
    } else {
      markAttendance(id as string, selectedDayStr, status, selectedClassId);
    }
    setShowStatusModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: isDark ? '#000000' : '#ffffff', borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            {(() => {
              const theme = getSubjectTheme(subject?.name || '', subject?.code || '', colors.bg === '#000000', subject?.color, subject?.icon);
              const icon = theme.icon;
              return (
                <View style={[styles.iconSquare, { backgroundColor: theme.bgColor }]}>
                  <Ionicons name={icon} size={28} color={theme.color} />
                </View>
              );
            })()}
            <View style={styles.headerTextContainer}>
              <Text style={[textStyles.h2, { color: colors.textPrimary, textAlign: 'center' }]}>{subjectName}</Text>
              <View style={styles.headerSubInfo}>
                <View style={[styles.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                  <Ionicons name="bookmark-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>{typeText}</Text>
                </View>
              </View>
              {subDetails ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>{subDetails}</Text>
              ) : null}
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={() => setShowSubjectMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable style={[styles.tab, activeTab === 'overview' && styles.activeTab]} onPress={() => setActiveTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' ? [styles.activeTabText, { color: colors.primary }] : { color: colors.textSecondary }]}>Overview</Text>
            {activeTab === 'overview' && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'attendance' && styles.activeTab]} onPress={() => setActiveTab('attendance')}>
            <Text style={[styles.tabText, activeTab === 'attendance' ? [styles.activeTabText, { color: colors.primary }] : { color: colors.textSecondary }]}>Attendance</Text>
            {activeTab === 'attendance' && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'attendance' ? (
          <>
            {(!hasTheory || !hasLab) ? (
              <AttendanceGauge title="Overall Attendance" percentage={percentage} present={present} totalClasses={totalClasses} canMiss={canMiss} needToAttend={needToAttend} target={subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget} />
            ) : (
              <View style={{ gap: 16 }}>
                {theoryStats && <AttendanceGauge title="Theory Attendance" percentage={theoryStats.percentage} present={theoryStats.present} totalClasses={theoryStats.totalClasses} canMiss={theoryStats.canMiss} needToAttend={theoryStats.needToAttend} target={subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget} />}
                {labStats && <AttendanceGauge title="Lab Attendance" percentage={labStats.percentage} present={labStats.present} totalClasses={labStats.totalClasses} canMiss={labStats.canMiss} needToAttend={labStats.needToAttend} target={subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget} />}
              </View>
            )}
            <AttendanceCalendar subjectId={id as string} onDayPress={handleDayPress} />
            <ClassHistory records={subjectRecords} subDetails={subDetails} hasTheory={hasTheory} hasLab={hasLab} />
          </>
        ) : (
          <WeeklyClasses subjectId={id as string} subjectColor={subject?.color} />
        )}
      </ScrollView>

      {/* Modals */}
      <ClassPickerModal
        visible={showClassModal}
        onClose={() => setShowClassModal(false)}
        classes={dayClasses}
        subjectId={id as string}
        selectedDayStr={selectedDayStr}
        onSelectClass={openStatusModalForClass}
      />
      <AttendanceStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSelectStatus={setAttendanceStatus}
      />
      <SubjectMenuModal
        visible={showSubjectMenu}
        onClose={() => setShowSubjectMenu(false)}
        topOffset={insets.top + 56}
        onEditSubject={() => {
          setShowSubjectMenu(false);
          router.push(`/(modals)/create-subject?id=${id}`);
        }}
        onChangeTarget={handleChangeTarget}
      />
    </SafeAreaView>
  );
}
