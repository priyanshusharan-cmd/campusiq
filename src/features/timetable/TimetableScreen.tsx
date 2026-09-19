// Campora — Timetable Screen
// Weekly timetable redesigned to match UI reference

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/theme';
import { EmptyState } from '@/components/ui';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { Card } from '@/components/ui/Card';
import { useTimetableData } from './hooks';
import { timeToMinutes } from './utils/timeUtils';
import { DaySelector } from './components/DaySelector';
import { TimelineView } from './components/TimelineView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { AttendanceStatusModal } from '@/components/ui/AttendanceStatusModal';
import { useSettingsStore, useTimetableStore, useProfileStore, useSubjectStore, useAttendanceStore } from '@/stores';
import { TextInput } from '@/components/form';

export default function TimetableScreen() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const router = useRouter();
  const { colors, spacing, textStyles, isDark } = useTheme();
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
  const [showFabMenu, setShowFabMenu] = useState(false);

  const { collegeStartTime, collegeEndTime } = useSettingsStore();
  const timetableEntries = useTimetableStore(s => s.entries);
  const addEntry = useTimetableStore(s => s.addEntry);
  const addSubject = useSubjectStore(s => s.addSubject);
  const removeSubject = useSubjectStore(s => s.removeSubject);
  const activeSubjects = subjects.filter(s => s.semesterId === (profile?.currentSemester?.toString() || '1'));

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

  const handleEmptySlotLongPress = (timeStr: string) => {
    const startMins = timeToMinutes(timeStr);
    const endMins = startMins + 60;
    
    const isCollision = classes.some(entry => {
      const eStart = timeToMinutes(entry.startTime);
      const eEnd = timeToMinutes(entry.endTime);
      return Math.max(startMins, eStart) < Math.min(endMins, eEnd);
    });

    const startFormatted = timeStr;
    let endFormatted = '';
    
    if (!isCollision) {
      let endH = Math.floor(endMins / 60) % 24;
      const endM = endMins % 60;
      const ampm = endH >= 12 ? 'PM' : 'AM';
      const displayEndH = endH % 12 === 0 ? 12 : endH % 12;
      endFormatted = `${displayEndH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')} ${ampm}`;
    }

    Alert.alert(
      'Create Extra Class',
      `Do you want to add a class starting at ${startFormatted}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Class', 
          onPress: () => {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayStr = dayNames[selectedDay];
            router.push({
              pathname: '/(modals)/create-class',
              params: {
                initialDay: dayStr,
                initialStartTime: startFormatted,
                initialEndTime: endFormatted
              }
            });
          }
        }
      ]
    );
  };

  const handleExport = async () => {
    if (activeSubjects.length === 0) {
      Alert.alert('No Subjects', 'You have no subjects in the current semester to export.');
      return;
    }

    try {
      const semesterStr = profile?.currentSemester || 1;
      const branchStr = profile?.branch ? profile.branch.replace(/[^a-zA-Z0-9]/g, '') : 'Branch';
      const collegeStr = profile?.college ? profile.college.replace(/[^a-zA-Z0-9]/g, '') : 'College';
      const sectionStr = profile?.section ? profile.section.replace(/[^a-zA-Z0-9]/g, '') : 'A';
      
      const fileName = `timetable_section${sectionStr}_semester${semesterStr}_${branchStr}_${collegeStr}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      const activeSubjectIds = new Set(activeSubjects.map(s => s.id));
      const activeEntries = timetableEntries.filter(e => activeSubjectIds.has(e.subjectId));

      const exportData = {
        type: 'campusiq_timetable',
        version: '1.0',
        semester: semesterStr,
        branch: profile?.branch,
        college: profile?.college,
        section: profile?.section,
        subjects: activeSubjects.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          credits: s.credits,
          type: s.type,
          faculty: s.faculty,
          color: s.color,
          icon: s.icon,
        })),
        entries: activeEntries.map(e => ({
          subjectId: e.subjectId,
          dayOfWeek: e.dayOfWeek,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room,
          type: e.type,
          color: e.color,
        }))
      };

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export CampusIQ Timetable',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error exporting timetable:', error);
      Alert.alert('Export Error', 'Failed to export timetable.');
    }
  };

  const handleFileImport = async () => {
    setShowFabMenu(false);
    
    // Wait for the modal to fully close before presenting the Document Picker.
    // iOS will throw an error if a new view controller is presented while another is dismissing.
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const fileUri = result.assets[0].uri;
      const fileString = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      
      let parsedData;
      try {
        parsedData = JSON.parse(fileString);
      } catch (e) {
        Alert.alert('Invalid File', 'The selected file is not a valid JSON.');
        return;
      }

      if (parsedData.type === 'campusiq_subjects') {
        Alert.alert('Wrong File Type', 'You selected a subjects file. Please select a timetable file.');
        return;
      }

      if (parsedData.type !== 'campusiq_timetable') {
        Alert.alert('Invalid File', 'The selected file does not appear to be a CampusIQ timetable file.');
        return;
      }

      if (!parsedData.subjects || !Array.isArray(parsedData.subjects) || !parsedData.entries || !Array.isArray(parsedData.entries)) {
        Alert.alert('Invalid File', 'The file is missing subjects or timetable entries data.');
        return;
      }

      if (parsedData.semester && parsedData.semester !== (profile?.currentSemester || 1)) {
        Alert.alert(
          'Semester Mismatch', 
          `This timetable is for Semester ${parsedData.semester}, but you are currently in Semester ${profile?.currentSemester || 1}.`
        );
        return;
      }

      Alert.alert(
        'Import Timetable',
        `Are you sure you want to import this timetable? This will ERASE all existing subjects and classes for your current semester.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import & Replace',
            style: 'destructive',
            onPress: () => {
              const currentSemesterId = profile?.currentSemester?.toString() || '1';
              
              const existingSubjects = subjects.filter(s => s.semesterId === currentSemesterId);
              existingSubjects.forEach(s => removeSubject(s.id));

              const subjectIdMap: Record<string, string> = {};

              parsedData.subjects.forEach((sub: any) => {
                const newSub = addSubject({
                  name: sub.name,
                  code: sub.code,
                  credits: sub.credits,
                  semesterId: currentSemesterId,
                  type: sub.type || 'theory',
                  color: sub.color,
                  icon: sub.icon,
                  faculty: sub.faculty,
                });
                subjectIdMap[sub.id] = newSub.id;
              });

              parsedData.entries.forEach((entry: any) => {
                if (subjectIdMap[entry.subjectId]) {
                  addEntry({
                    subjectId: subjectIdMap[entry.subjectId],
                    dayOfWeek: entry.dayOfWeek,
                    date: entry.date,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    room: entry.room,
                    type: entry.type || 'lecture',
                    color: entry.color,
                  });
                }
              });

              Alert.alert('Success', 'Timetable imported successfully!');
            }
          }
        ]
      );

    } catch (err) {
      console.error('File import error:', err);
      Alert.alert('Error', 'An error occurred while importing the file.');
    }
  };

  return (
    <LinearGradient 
      colors={isDark ? ['#0F1016', '#1A162D', '#0F1016'] : ['#F8FAFC', '#EEF2FF', '#E0E7FF']} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            
            <Pressable 
              style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.borderLight, paddingHorizontal: 10, justifyContent: 'center' }]}
              onPress={handleExport}
            >
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </Pressable>
            
            <Pressable 
              style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => setViewMode(v => v === 'week' ? 'month' : 'week')}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[textStyles.smallMedium, { color: colors.primary }]}>{viewMode === 'week' ? 'Week' : 'Month'}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
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
                onEmptySlotLongPress={handleEmptySlotLongPress}
              />
            )}


          </>
        ) : (
          <MonthCalendarView />
        )}

        {/* Bottom Info Cards removed as per redesign */}

      </ScrollView>

      {/* Status Selection Modal */}
      <AttendanceStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSelectStatus={setAttendanceStatus}
      />

      
      {/* Add Extra Class FAB & Menu */}
      {viewMode === 'week' && (
        <>
          <Pressable 
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => setShowFabMenu(true)}
          >
            <Ionicons name={showFabMenu ? "close" : "add"} size={32} color="#FFF" />
          </Pressable>

          {/* Action Menu Modal */}
          <Modal visible={showFabMenu} animationType="fade" transparent={true}>
            <Pressable 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
              onPress={() => setShowFabMenu(false)}
            >
              <Pressable style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 }} onPress={e => e.stopPropagation()}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
                
                <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 16 }]}>Timetable Options</Text>
                
                {hasSubjects && (
                  <Pressable 
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
                    onPress={() => {
                      setShowFabMenu(false);
                      const dateStr = days[selectedDay].dateString;
                      router.push(`/(modals)/create-extra-class?date=${dateStr}` as any);
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Ionicons name="add" size={24} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[textStyles.body, { color: colors.textPrimary, fontWeight: '600' }]}>Add Extra Class</Text>
                      <Text style={[textStyles.small, { color: colors.textSecondary }]}>Schedule a one-off class or event</Text>
                    </View>
                  </Pressable>
                )}

                <Pressable 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                  onPress={handleFileImport}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[textStyles.body, { color: colors.textPrimary, fontWeight: '600' }]}>Import Timetable</Text>
                    <Text style={[textStyles.small, { color: colors.textSecondary }]}>Import a .json timetable file</Text>
                  </View>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}

      </SafeAreaView>
    </LinearGradient>
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
