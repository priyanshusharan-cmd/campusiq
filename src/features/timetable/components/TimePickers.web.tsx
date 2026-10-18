import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import DateTimePicker from '@/platform/dateTimePicker';
import { useTheme } from '@/theme';

export function TimePickerModal({ visible, value, title, onClose, onChange }: {
  visible: boolean; value: Date; title: string; onClose: () => void; onChange: (date: Date) => void;
}) {
  const { colors, textStyles, isDark } = useTheme();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 420, alignSelf: 'center', gap: 20 }}>
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>{title}</Text>
        <DateTimePicker value={value} mode="time" themeVariant={isDark ? 'dark' : 'light'} onValueChange={(_event, date) => onChange(date)} />
        <Pressable accessibilityRole="button" onPress={onClose} style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}
