// Campora — Onboarding Academic Info Step
// Step 2: College, Branch, Semester
// Step 3: Semester Start/End Dates

import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface AcademicInfoStepProps {
  college: string;
  setCollege: (v: string) => void;
  major: string;
  setMajor: (v: string) => void;
  semester: string;
  setSemester: (v: string) => void;
  focusedField: string | null;
  setFocusedField: (v: string | null) => void;
  inputWrapperStyle: any;
}

export function AcademicInfoStep({
  college, setCollege, major, setMajor, semester, setSemester,
  focusedField, setFocusedField, inputWrapperStyle,
}: AcademicInfoStepProps) {
  const { colors } = useTheme();

  return (
    <>
      <View style={[inputWrapperStyle, { borderColor: focusedField === 'college' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="business-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="College"
          placeholderTextColor={colors.textSecondary}
          value={college}
          onChangeText={setCollege}
          onFocus={() => setFocusedField('college')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={[inputWrapperStyle, { borderColor: focusedField === 'major' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="git-branch-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="Branch"
          placeholderTextColor={colors.textSecondary}
          value={major}
          onChangeText={setMajor}
          onFocus={() => setFocusedField('major')}
          onBlur={() => setFocusedField(null)}
        />
      </View>
      
      <View style={[inputWrapperStyle, { borderColor: focusedField === 'semester' ? colors.primary : colors.primaryLight }]}>
        <Ionicons name="school-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder="Current Semester"
          placeholderTextColor={colors.textSecondary}
          value={semester}
          onChangeText={setSemester}
          keyboardType="numeric"
          onFocus={() => setFocusedField('semester')}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </>
  );
}


interface SemesterDatesStepProps {
  semesterStart: string;
  onSemesterStartChange: (text: string) => void;
  semesterEnd: string;
  onSemesterEndChange: (text: string) => void;
  focusedField: string | null;
  setFocusedField: (v: string | null) => void;
  onOpenStartPicker: () => void;
  onOpenEndPicker: () => void;
  inputWrapperStyle: any;
}

export function SemesterDatesStep({
  semesterStart, onSemesterStartChange, semesterEnd, onSemesterEndChange,
  focusedField, setFocusedField, onOpenStartPicker, onOpenEndPicker, inputWrapperStyle,
}: SemesterDatesStepProps) {
  const { colors } = useTheme();

  return (
    <>
      <View style={[inputWrapperStyle, { borderColor: focusedField === 'semesterStart' ? colors.primary : colors.primaryLight }]}>
        <Pressable onPress={onOpenStartPicker}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        </Pressable>
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder={focusedField === 'semesterStart' ? "DD/MM/YYYY" : "Semester Start Date"}
          placeholderTextColor={colors.textSecondary}
          value={semesterStart}
          onChangeText={onSemesterStartChange}
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => setFocusedField('semesterStart')}
          onBlur={() => setFocusedField(null)}
        />
      </View>

      <View style={[inputWrapperStyle, { borderColor: focusedField === 'semesterEnd' ? colors.primary : colors.primaryLight }]}>
        <Pressable onPress={onOpenEndPicker}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
        </Pressable>
        <TextInput
          style={{ flex: 1, height: '100%', color: colors.textPrimary, fontSize: 16 }}
          placeholder={focusedField === 'semesterEnd' ? "DD/MM/YYYY" : "Semester End Date"}
          placeholderTextColor={colors.textSecondary}
          value={semesterEnd}
          onChangeText={onSemesterEndChange}
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => setFocusedField('semesterEnd')}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </>
  );
}
