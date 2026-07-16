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
  const { colors, spacing, textStyles } = useTheme();
  const insets = useSafeAreaInsets();

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const initialTab = (tab === 'attendance' || tab === 'overview') ? tab : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>(initialTab);

  const allRecords = useAttendanceStore(s => s.records);
  const markAttendance = useAttendanceStore(s => s.markAttendance);
  const removeRecord = useAttendanceStore(s => s.removeRecord);
  const timetableEntries = useTimetableStore(s => s.entries);
  const removeSubject = useSubjectStore(s => s.removeSubject);
  const subject = useSubjectStore(state => state.subjects.find(s => s.id === id));
  const subjectStats = useSubjectAttendance().find(s => s.subjectId === id);

  const percentage = subjectStats?.percentage || 0;
  const present = subjectStats?.present || 0;
  const totalClasses = subjectStats?.totalClasses || 0;
  const canMiss = subjectStats?.canMiss || 0;

  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [dayClasses, setDayClasses] = useState<typeof timetableEntries>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const subjectRecords = useMemo(() => {
    return allRecords
      .filter(r => r.subjectId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, id]);

  const subjectName = subject?.name || "Unknown Subject";
  const initials = subject?.shortName || "?";
  const typeText = subject?.type ? (subject.type.charAt(0).toUpperCase() + subject.type.slice(1) + " Subject") : "Subject";
  const subDetails = [subject?.faculty, subject?.room].filter(Boolean).join(' · ');

  const confirmDeleteSubject = () => {
    Alert.alert(
      'Delete Subject',
      'Are you sure you want to delete this subject? All related classes and attendance records will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            removeSubject(id as string);
            router.replace('/(tabs)/overview' as any);
          }
        }
      ]
    );
  };

  const handleDayPress = (day: any) => {
    const d = new Date(day.year, day.month - 1, day.day);
    const dayOfWeek = (d.getDay() === 0 ? 6 : d.getDay() - 1) as DayOfWeek;
    const classesOnDay = timetableEntries.filter(e => e.subjectId === id && e.dayOfWeek === dayOfWeek);

    if (classesOnDay.length === 0) {
      Alert.alert('No Class', 'There is no class scheduled for this subject on this day.');
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
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <View style={[styles.iconSquare, { backgroundColor: subject?.color ? `${subject.color}20` : '#E0E7FF' }]}>
              <Text style={{ color: subject?.color || '#4F46E5', fontWeight: '600', fontSize: 18 }}>{initials}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[textStyles.h2, { color: colors.textPrimary }]}>{subjectName}</Text>
              <View style={styles.headerSubInfo}>
                <View style={styles.tag}>
                  <Ionicons name="bookmark-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>{typeText}</Text>
                </View>
              </View>
              {subDetails ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{subDetails}</Text>
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
            <Text style={[styles.tabText, activeTab === 'overview' ? styles.activeTabText : { color: colors.textSecondary }]}>Overview</Text>
            {activeTab === 'overview' && <View style={styles.activeTabIndicator} />}
          </Pressable>
          <Pressable style={[styles.tab, activeTab === 'attendance' && styles.activeTab]} onPress={() => setActiveTab('attendance')}>
            <Text style={[styles.tabText, activeTab === 'attendance' ? styles.activeTabText : { color: colors.textSecondary }]}>Attendance</Text>
            {activeTab === 'attendance' && <View style={styles.activeTabIndicator} />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'attendance' ? (
          <>
            <AttendanceGauge percentage={percentage} present={present} totalClasses={totalClasses} canMiss={canMiss} />
            <AttendanceCalendar subjectId={id as string} onDayPress={handleDayPress} />
            <ClassHistory records={subjectRecords} subDetails={subDetails} />
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
        onDeleteSubject={() => {
          setShowSubjectMenu(false);
          setTimeout(() => confirmDeleteSubject(), 300);
        }}
      />
    </SafeAreaView>
  );
}
