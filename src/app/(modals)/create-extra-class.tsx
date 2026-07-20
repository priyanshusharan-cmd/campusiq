// Campora — Create Extra Class Modal
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, KeyboardAvoidingView, Modal, Alert } from 'react-native';
import { ScrollView, FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { format, parseISO } from 'date-fns';
import { DayOfWeek } from '@/types';
import { TextInput, Select, ColorPicker } from '@/components/form';
import { TimePickerModal } from '@/features/timetable/components/TimePickers';
import { handleTimeInputChange, parseTimeInput, formatTime } from '@/features/timetable/utils/timeUtils';

export default function CreateExtraClassScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const { date, subjectId } = useLocalSearchParams();
  const dateStr = Array.isArray(date) ? date[0] : date;
  const initialSubjectId = Array.isArray(subjectId) ? subjectId[0] : subjectId;
  
  const subjects = useSubjectStore(state => state.subjects);
  const addEntry = useTimetableStore(state => state.addEntry);

  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [faculty, setFaculty] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  useEffect(() => { if (startTime) setStartTimeInput(formatTime(startTime)); }, [startTime]);
  useEffect(() => { if (endTime) setEndTimeInput(formatTime(endTime)); }, [endTime]);

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
    if (!dateStr) { Alert.alert('Missing Date', 'Date is not selected properly.'); setIsSubmitting(false); return; }
    if (!finalStartTime || !finalEndTime) { Alert.alert('Missing Time', 'Please select both start and end times.'); setIsSubmitting(false); return; }

    const jsDate = parseISO(dateStr);
    const dayOfWeek = (jsDate.getDay() + 6) % 7 as DayOfWeek;
    const startStr = format(finalStartTime, 'HH:mm');
    const endStr = format(finalEndTime, 'HH:mm');

    addEntry({ subjectId: selectedSubjectId, dayOfWeek, date: dateStr, startTime: startStr, endTime: endStr, room, type: 'lecture', color });
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
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>Create Extra Class</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
              Schedule a one-off class for {dateStr ? format(parseISO(dateStr), 'dd MMM yyyy') : 'this day'}
            </Text>
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: '#F3F0FF' }]}>
            <Ionicons name="calendar-outline" size={24} color="#7C5CFC" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Form */}
          <Select label="Subject" required placeholder="Select subject" value={selectedSubject?.name || ''} onPress={handleSelectSubject} isFocused={showSubjectModal} />
          <TextInput label="Faculty" placeholder="Select faculty" value={faculty} onChangeText={setFaculty} iconRight="pencil" focusColor="#7C5CFC" />
          <TextInput label="Room Number" placeholder="Enter Room Number" value={room} onChangeText={setRoom} focusColor="#7C5CFC" />

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
          <TimePickerModal visible={showStartTimePicker} value={startTime || new Date()} title="Start Time" onClose={() => setShowStartTimePicker(false)}
            onChange={(selectedTime) => {
              if (startTime && endTime) { const d = endTime.getTime() - startTime.getTime(); setEndTime(new Date(selectedTime.getTime() + (d > 0 ? d : 3600000))); }
              else { setEndTime(new Date(selectedTime.getTime() + 3600000)); }
              setStartTime(selectedTime);
            }}
          />
          <TimePickerModal visible={showEndTimePicker} value={endTime || new Date(new Date().getTime() + 3600000)} title="End Time" onClose={() => setShowEndTimePicker(false)} onChange={(t) => setEndTime(t)} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.bg }]}>
        <Pressable style={[styles.submitBtn, { backgroundColor: '#7C5CFC' }]} onPress={handleSubmit}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Add Extra Class</Text>
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
            <FlatList data={subjects} keyExtractor={item => item.id} showsVerticalScrollIndicator={false}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { marginBottom: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 300, maxHeight: '80%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  subjectColor: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
});
