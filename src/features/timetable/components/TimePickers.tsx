// Campora — Shared Time Picker Components
// Reusable iOS/Android time picker modals used by create-class, create-lab, create-extra-class

import React from 'react';
import { View, Text, Pressable, Modal, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/theme';

interface TimePickerProps {
  visible: boolean;
  value: Date;
  title: string;
  onClose: () => void;
  onChange: (date: Date) => void;
}

export function TimePickerModal({ visible, value, title, onClose, onChange }: TimePickerProps) {
  const { colors, textStyles } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={pickerStyles.overlay}>
          <View style={[pickerStyles.content, { backgroundColor: colors.bg, padding: 0, minHeight: 250 }]}>
            <View style={[pickerStyles.header, { padding: 20, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
              <Text style={[textStyles.h2, { color: colors.textPrimary }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={{ color: '#7C5CFC', fontWeight: '600', fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={value}
              mode="time"
              display="spinner"
              onChange={(event: any, selectedTime?: Date) => {
                if (selectedTime) onChange(selectedTime);
              }}
              onDismiss={onClose}
              style={{ alignSelf: 'center', marginVertical: 10 }}
            />
          </View>
        </View>
      </Modal>
    );
  }

  // Android
  if (!visible || Platform.OS === 'web') return null;
  
  return (
    <DateTimePicker
      value={value}
      mode="time"
      display="default"
      onChange={(event: any, selectedTime?: Date) => {
        onClose();
        if (selectedTime) onChange(selectedTime);
      }}
      onDismiss={onClose}
    />
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
