// Campora — Attendance Detail Modals
// Class picker modal (when multiple classes on same day) + Subject menu modal

import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useAttendanceStore } from '@/stores/useAttendanceStore';
import { styles } from '../styles/attendanceDetailStyles';

// --- Class Picker Modal (when a day has multiple classes) ---

interface ClassPickerModalProps {
  visible: boolean;
  onClose: () => void;
  classes: { id: string; startTime: string; endTime: string; type: string; room?: string }[];
  subjectId: string;
  selectedDayStr: string | null;
  onSelectClass: (classId: string) => void;
}

const STATUS_DISPLAY: Record<string, { color: string; label: string; bg: string }> = {
  present: { color: '#10B981', label: 'Present', bg: '#D1FAE5' },
  absent: { color: '#EF4444', label: 'Absent', bg: '#FEE2E2' },
  cancelled: { color: '#CA8A04', label: 'Cancelled', bg: '#FEF08A' },
  holiday: { color: '#2563EB', label: 'Holiday', bg: '#DBEAFE' },
};

export function ClassPickerModal({ visible, onClose, classes, subjectId, selectedDayStr, onSelectClass }: ClassPickerModalProps) {
  const { colors, textStyles } = useTheme();
  const allRecords = useAttendanceStore(s => s.records);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.bg, padding: 0 }]}>
          <View style={[styles.modalHeader, { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 0 }]}>
            <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Mark Attendance</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              You have multiple classes on {selectedDayStr}. Tap to set status.
            </Text>
            {classes.map(cls => {
              const record = allRecords.find(r => r.subjectId === subjectId && r.date === selectedDayStr && r.timetableEntryId === cls.id);
              const status = record ? record.status : 'present';
              const conf = STATUS_DISPLAY[status] || STATUS_DISPLAY.present;

              return (
                <Pressable 
                  key={cls.id}
                  style={{
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    marginBottom: 12
                  }}
                  onPress={() => onSelectClass(cls.id)}
                >
                  <View>
                    <Text style={{ fontWeight: '600', color: colors.textPrimary, fontSize: 16 }}>
                      {cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                      {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)} • Room {cls.room || 'TBD'}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: conf.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: conf.color, fontWeight: '600', fontSize: 13 }}>{conf.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}


// --- Subject Options Menu (3-dot menu) ---

interface SubjectMenuModalProps {
  visible: boolean;
  onClose: () => void;
  topOffset: number;
  onEditSubject: () => void;
  onChangeTarget: () => void;
}

export function SubjectMenuModal({ visible, onClose, topOffset, onEditSubject, onChangeTarget }: SubjectMenuModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: colors.bg, top: topOffset }]}>
          <Pressable 
            style={styles.menuItem}
            onPress={onEditSubject}
          >
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Subject</Text>
          </Pressable>
          <Pressable 
            style={styles.menuItem}
            onPress={onChangeTarget}
          >
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Change Attendance Target</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
