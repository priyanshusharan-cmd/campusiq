// Campora — Create New Lab Session Modal
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, KeyboardAvoidingView, Switch, Modal, Alert } from 'react-native';
import { ScrollView, FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { format } from 'date-fns';
import { DayOfWeek } from '@/types';
import { TextInput, Select, ColorPicker } from '@/components/form';
import { TimePickerModal } from '@/features/timetable/components/TimePickers';
import { formatTime, DAY_MAP, DAY_OPTIONS } from '@/features/timetable/utils/timeUtils';

export default function CreateLabScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();

  const subjects = useSubjectStore(state => state.subjects);
  const addEntry = useTimetableStore(state => state.addEntry);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [labTitle, setLabTitle] = useState('');
  const [batch, setBatch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [experiments, setExperiments] = useState('');
  const [notes, setNotes] = useState('');
  const [addToTimetable, setAddToTimetable] = useState(true);
  const [color, setColor] = useState('#F43F5E');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleSelectSubject = () => {
    if (subjects.length === 0) {
      Alert.alert('No Subjects Found', 'Please create a subject first before adding a lab.');
      return;
    }
    setShowSubjectModal(true);
  };

  const handleSubmit = () => {
    if (!selectedSubjectId) { Alert.alert('Missing Subject', 'Please select a subject for this lab.'); return; }
    if (!selectedDay) { Alert.alert('Missing Day', 'Please select the day of the week.'); return; }
    if (!startTime || !endTime) { Alert.alert('Missing Time', 'Please select both start and end times.'); return; }

    if (addToTimetable) {
      const dayIndex = DAY_MAP[selectedDay] as DayOfWeek;
      const startStr = format(startTime, 'HH:mm');
      const endStr = format(endTime, 'HH:mm');
      const roomStr = batch ? `${labTitle} (${batch})` : labTitle;
      addEntry({ subjectId: selectedSubjectId, dayOfWeek: dayIndex, startTime: startStr, endTime: endStr, room: roomStr, type: 'lab' });
    }
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
            <Text style={[textStyles.h1, { color: colors.textPrimary }]}>Create New Lab Session</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>Add a lab or practical session</Text>
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: '#FFE4E6' }]}>
            <Ionicons name="flask-outline" size={24} color="#F43F5E" />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Quick Tip */}
          <View style={[styles.tipBanner, { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : '#FFF1F2', borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#FFE4E6' }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="bulb-outline" size={16} color="#F43F5E" style={{ marginRight: 6 }} />
                <Text style={[textStyles.smallMedium, { color: '#F43F5E' }]}>Quick Tip</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Track your lab sessions to maintain attendance and stay organized.</Text>
            </View>
          </View>

          {/* Form */}
          <Select label="Subject" required placeholder="Select subject" value={selectedSubject?.name || ''} onPress={handleSelectSubject} isFocused={showSubjectModal} />
          <TextInput label="Lab Title" required placeholder="Experiment 3, DBMS Lab" value={labTitle} onChangeText={setLabTitle} focusColor="#F43F5E" />
          <TextInput label="Batch" placeholder="Batch A, Group 2" value={batch} onChangeText={setBatch} focusColor="#F43F5E" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Select label="Day" required placeholder="Select day" value={selectedDay || ''} onPress={() => setShowDayModal(true)} isFocused={showDayModal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 12 }]}>Add to weekly timetable?</Text>
              <Switch value={addToTimetable} onValueChange={setAddToTimetable} trackColor={{ false: colors.borderLight, true: '#F43F5E' }} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Select label="Start Time" required placeholder="10:00 AM" icon="time-outline" value={formatTime(startTime)} onPress={() => setShowStartTimePicker(true)} isFocused={showStartTimePicker} />
            </View>
            <View style={{ flex: 1 }}>
              <Select label="End Time" required placeholder="11:00 AM" icon="time-outline" value={formatTime(endTime)} onPress={() => setShowEndTimePicker(true)} isFocused={showEndTimePicker} />
            </View>
          </View>
          
          <ColorPicker label="Color" value={color} onChange={setColor} />
          <TextInput label="Experiments" placeholder="Describe the experiment or topic covered..." multiline numberOfLines={4} value={experiments} onChangeText={setExperiments} focusColor="#F43F5E" />
          <TextInput label="Notes" placeholder="Any additional notes..." multiline numberOfLines={4} value={notes} onChangeText={setNotes} focusColor="#F43F5E" />

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
        <Pressable style={[styles.submitBtn, { backgroundColor: '#F43F5E' }]} onPress={handleSubmit}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Lab Session</Text>
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
                <Pressable style={[styles.subjectItem, { borderBottomColor: colors.borderLight }]} onPress={() => { setSelectedSubjectId(item.id); setColor(item.color || '#F43F5E'); setShowSubjectModal(false); }}>
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
            <FlatList data={DAY_OPTIONS} keyExtractor={item => item} showsVerticalScrollIndicator={false}
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
