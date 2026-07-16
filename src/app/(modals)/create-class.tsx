// Campora — Create New Class Modal
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, KeyboardAvoidingView, Modal, Alert } from 'react-native';
import {  FlatList , ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { format } from 'date-fns';
import { DayOfWeek } from '@/types';
import { TextInput, Select, ColorPicker } from '@/components/form';
import { TimePickerModal } from '@/features/timetable/components/TimePickers';
import { handleTimeInputChange, parseTimeInput, formatTime, timeToMinutes, DAY_MAP, DAY_OPTIONS } from '@/features/timetable/utils/timeUtils';

export default function CreateClassScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const subjects = useSubjectStore(state => state.subjects);
  const addEntry = useTimetableStore(state => state.addEntry);
  const updateEntry = useTimetableStore(state => state.updateEntry);
  const entries = useTimetableStore(state => state.entries);

  const { editId } = useLocalSearchParams();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  useEffect(() => { if (startTime) setStartTimeInput(formatTime(startTime)); }, [startTime]);
  useEffect(() => { if (endTime) setEndTimeInput(formatTime(endTime)); }, [endTime]);

  useEffect(() => {
    if (editId) {
      const entry = entries.find(e => e.id === editId);
      if (entry) {
        setSelectedSubjectId(entry.subjectId);
        setRoom(entry.room || '');
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        setSelectedDay(dayNames[entry.dayOfWeek]);
        
        const sD = new Date();
        const [sH, sM] = entry.startTime.split(':');
        sD.setHours(parseInt(sH), parseInt(sM), 0, 0);
        setStartTime(sD);
        
        const eD = new Date();
        const [eH, eM] = entry.endTime.split(':');
        eD.setHours(parseInt(eH), parseInt(eM), 0, 0);
        setEndTime(eD);
        
        const subj = subjects.find(s => s.id === entry.subjectId);
        if (subj) {
          setFaculty(subj.faculty || '');
          setColor(subj.color || '#6366F1');
        }
      }
    }
  }, [editId]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleSelectSubject = () => {
    if (subjects.length === 0) {
      Alert.alert('No Subjects Found', 'Please create a subject first before adding a class.');
      return;
    }
    setShowSubjectModal(true);
  };

  const handleTimeBlur = (text: string, setDate: (d: Date) => void, setInput: (s: string) => void) => {
    const parsed = parseTimeInput(text);
    if (parsed) {
      setDate(parsed);
      setInput(formatTime(parsed));
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const finalStartTime = parseTimeInput(startTimeInput) || startTime;
    const finalEndTime = parseTimeInput(endTimeInput) || endTime;

    if (finalStartTime) { setStartTime(finalStartTime); setStartTimeInput(formatTime(finalStartTime)); }
    if (finalEndTime) { setEndTime(finalEndTime); setEndTimeInput(formatTime(finalEndTime)); }

    if (!selectedSubjectId) { Alert.alert('Missing Subject', 'Please select a subject for this class.'); setIsSubmitting(false); return; }
    if (!selectedDay) { Alert.alert('Missing Day', 'Please select the day of the week.'); setIsSubmitting(false); return; }
    if (!finalStartTime || !finalEndTime) { Alert.alert('Missing Time', 'Please select both start and end times.'); setIsSubmitting(false); return; }
    if (finalStartTime.getTime() >= finalEndTime.getTime()) { Alert.alert('Invalid Time', 'Class end time must be after the start time.'); setIsSubmitting(false); return; }

    const dayIndex = DAY_MAP[selectedDay] as DayOfWeek;
    const startStr = format(finalStartTime, 'HH:mm');
    const endStr = format(finalEndTime, 'HH:mm');

    const startMins = timeToMinutes(startStr);
    const endMins = timeToMinutes(endStr);

    const entriesState = useTimetableStore.getState().entries;
    const isCollision = entriesState.some(entry => {
      if (entry.id === editId) return false;
      if (entry.dayOfWeek !== dayIndex) return false;
      const eStart = timeToMinutes(entry.startTime);
      const eEnd = timeToMinutes(entry.endTime);
      return startMins < eEnd && endMins > eStart;
    });

    if (isCollision) { Alert.alert('Schedule Conflict', 'This class time overlaps with an existing class in your timetable.'); setIsSubmitting(false); return; }

    const entryData = { subjectId: selectedSubjectId, dayOfWeek: dayIndex, startTime: startStr, endTime: endStr, room, type: 'lecture' as const, color };

    if (editId) { updateEntry(editId as string, entryData); } else { addEntry(entryData); }
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <View>
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>{editId ? 'Edit Class' : 'Create New Class'}</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
              {editId ? 'Modify class details' : 'Add a new class to your timetable'}
            </Text>
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: '#F3F0FF' }]}>
            <Ionicons name="calendar-outline" size={24} color="#7C5CFC" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Quick Tip */}
          <View style={[styles.tipBanner, { backgroundColor: '#F3F0FF', borderColor: '#E9E3FF' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="bulb-outline" size={16} color="#7C5CFC" style={{ marginRight: 6 }} />
                <Text style={[textStyles.smallMedium, { color: '#7C5CFC' }]}>Quick Tip</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Adding classes helps you stay organized and never miss a lecture.
              </Text>
            </View>
          </View>

          {/* Form */}
          <Select label="Subject" required placeholder="Select subject" value={selectedSubject?.name || ''} onPress={handleSelectSubject} isFocused={showSubjectModal} />
          <TextInput label="Faculty" placeholder="Select faculty" value={faculty} onChangeText={setFaculty} iconRight="pencil" focusColor="#7C5CFC" />
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}><TextInput label="Room Number" placeholder="Enter Room Number" value={room} onChangeText={setRoom} focusColor="#7C5CFC" /></View>
            <View style={{ flex: 1 }}><Select label="Day" required placeholder="Select day" value={selectedDay || ''} onPress={() => setShowDayModal(true)} isFocused={showDayModal} /></View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput label="Start Time" required placeholder="HH:MM" iconRight="time-outline" value={startTimeInput}
                onChangeText={(t) => setStartTimeInput(handleTimeInputChange(t, startTimeInput))}
                onBlur={() => handleTimeBlur(startTimeInput, setStartTime, setStartTimeInput)}
                keyboardType="numbers-and-punctuation"
                onIconRightPress={() => { Platform.OS !== 'web' ? setShowStartTimePicker(true) : Alert.alert('Native Picker', 'Time pickers are native elements.'); }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput label="End Time" required placeholder="HH:MM" iconRight="time-outline" value={endTimeInput}
                onChangeText={(t) => setEndTimeInput(handleTimeInputChange(t, endTimeInput))}
                onBlur={() => handleTimeBlur(endTimeInput, setEndTime, setEndTimeInput)}
                keyboardType="numbers-and-punctuation"
                onIconRightPress={() => { Platform.OS !== 'web' ? setShowEndTimePicker(true) : Alert.alert('Native Picker', 'Time pickers are native elements.'); }}
              />
            </View>
          </View>
          
          <ColorPicker label="Color" value={color} onChange={setColor} />

          {/* Time Pickers */}
          <TimePickerModal
            visible={showStartTimePicker}
            value={startTime || new Date()}
            title="Start Time"
            onClose={() => setShowStartTimePicker(false)}
            onChange={(selectedTime) => {
              if (startTime && endTime) {
                const duration = endTime.getTime() - startTime.getTime();
                setEndTime(new Date(selectedTime.getTime() + (duration > 0 ? duration : 60 * 60 * 1000)));
              } else {
                setEndTime(new Date(selectedTime.getTime() + 60 * 60 * 1000));
              }
              setStartTime(selectedTime);
            }}
          />
          <TimePickerModal
            visible={showEndTimePicker}
            value={endTime || new Date(new Date().getTime() + 60 * 60 * 1000)}
            title="End Time"
            onClose={() => setShowEndTimePicker(false)}
            onChange={(selectedTime) => setEndTime(selectedTime)}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.bg }]}>
        <Pressable style={[styles.submitBtn, { backgroundColor: '#7C5CFC' }]} onPress={handleSubmit}>
          <Ionicons name={editId ? "save-outline" : "add-circle-outline"} size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{editId ? 'Save Changes' : 'Create Class'}</Text>
        </Pressable>
      </View>

      {/* Subject Selection Modal */}
      <Modal visible={showSubjectModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Select Subject</Text>
              <Pressable onPress={() => setShowSubjectModal(false)} hitSlop={10}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={subjects}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable style={[styles.subjectItem, { borderBottomColor: colors.borderLight }]} onPress={() => { setSelectedSubjectId(item.id); setFaculty(item.faculty || ''); setColor(item.color || '#6366F1'); setShowSubjectModal(false); }}>
                  <View style={[styles.subjectColor, { backgroundColor: item.color }]} />
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Day Selection Modal */}
      <Modal visible={showDayModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Select Day</Text>
              <Pressable onPress={() => setShowDayModal(false)} hitSlop={10}><Ionicons name="close" size={24} color={colors.textSecondary} /></Pressable>
            </View>
            <FlatList
              data={DAY_OPTIONS}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable style={[styles.subjectItem, { borderBottomColor: colors.borderLight }]} onPress={() => { setSelectedDay(item); setShowDayModal(false); }}>
                  <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { marginBottom: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tipBanner: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24, alignItems: 'flex-start' },
  row: { flexDirection: 'row', gap: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 300, maxHeight: '80%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  subjectColor: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
});
