// Campora — Onboarding Personal Info Step
// Step 1: Name, Email, Roll Number, Date of Birth

import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface PersonalInfoStepProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  rollNo: string;
  setRollNo: (v: string) => void;
  dob: string;
  onDobChange: (text: string) => void;
  focusedField: string | null;
  setFocusedField: (v: string | null) => void;
  onOpenDatePicker: () => void;
  inputWrapperStyle: any;
}

export function PersonalInfoStep({
  name, setName, email, setEmail, rollNo, setRollNo, dob, onDobChange,
  focusedField, setFocusedField, onOpenDatePicker, inputWrapperStyle,
}: PersonalInfoStepProps) {
  const { colors } = useTheme();

  return (
    <>
      <View style={[inputWrapperStyle, { borderColor: focusedField === 'name' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="person-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="Name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          textContentType="name"
          autoComplete="name"
          autoCapitalize="words"
        />
      </View>

      <View style={[inputWrapperStyle, { borderColor: focusedField === 'email' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="mail-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="Email Address"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={[inputWrapperStyle, { borderColor: focusedField === 'rollNo' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="id-card-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="Roll Number"
          placeholderTextColor={colors.textSecondary}
          value={rollNo}
          onChangeText={setRollNo}
          onFocus={() => setFocusedField('rollNo')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={[inputWrapperStyle, { borderColor: focusedField === 'dob' ? colors.primary : colors.primaryLight }]}>
        <Pressable onPress={onOpenDatePicker}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        </Pressable>
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder={focusedField === 'dob' ? "DD/MM/YYYY" : "Date of Birth"}
          placeholderTextColor={colors.textSecondary}
          value={dob}
          onChangeText={onDobChange}
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => setFocusedField('dob')}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </>
  );
}
