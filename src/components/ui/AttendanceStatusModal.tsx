// Campora — Reusable Attendance Status Modal
// Used by both SubjectAttendanceDetail and TimetableScreen

import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'holiday' | 'none';

interface AttendanceStatusModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectStatus: (status: AttendanceStatus) => void;
}

const STATUS_OPTIONS: {
  status: AttendanceStatus;
  icon: string;
  label: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
}[] = [
  { status: 'present', icon: 'checkmark-circle', label: 'Present', bgColor: '#D1FAE5', iconColor: '#10B981', textColor: '#059669' },
  { status: 'absent', icon: 'close-circle', label: 'Absent', bgColor: '#FEE2E2', iconColor: '#EF4444', textColor: '#DC2626' },
  { status: 'cancelled', icon: 'alert-circle', label: 'Cancelled', bgColor: '#FEF08A', iconColor: '#CA8A04', textColor: '#A16207' },
  { status: 'holiday', icon: 'sunny', label: 'Holiday', bgColor: '#DBEAFE', iconColor: '#2563EB', textColor: '#1D4ED8' },
];

export function AttendanceStatusModal({ visible, onClose, onSelectStatus }: AttendanceStatusModalProps) {
  const { colors, textStyles } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.content, { backgroundColor: colors.bg, padding: 0 }]}>
          <View style={[modalStyles.header, { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 0 }]}>
            <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Set Status</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Select the attendance status for this class.
            </Text>
            
            <View style={{ gap: 12 }}>
              {STATUS_OPTIONS.map(({ status, icon, label, bgColor, iconColor, textColor }) => (
                <Pressable
                  key={status}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bgColor, padding: 16, borderRadius: 12 }}
                  onPress={() => onSelectStatus(status)}
                >
                  <Ionicons name={icon as any} size={24} color={iconColor} style={{ marginRight: 12 }} />
                  <Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>{label}</Text>
                </Pressable>
              ))}
              
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginTop: 8 }}
                onPress={() => onSelectStatus('none')}
              >
                <Ionicons name="trash-outline" size={24} color="#6B7280" style={{ marginRight: 12 }} />
                <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 16 }}>Clear Status</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
