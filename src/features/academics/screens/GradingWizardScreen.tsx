import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { DEFAULT_GRADE_SCHEME, GradeScheme, GradeBoundary } from '@/types/grading';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export function GradingWizardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, fontFamily, isDark } = useTheme();
  
  const { gradeScheme, setGradeScheme } = useAcademicStore();
  const [currentScheme, setCurrentScheme] = useState<GradeScheme>(gradeScheme);

  const handleBoundaryChange = (id: string, field: keyof GradeBoundary, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setCurrentScheme(prev => ({
      ...prev,
      boundaries: prev.boundaries.map(b => 
        b.id === id ? { ...b, [field]: field === 'gradeLetter' ? value : numericValue } : b
      )
    }));
  };

  const handleSave = () => {
    setGradeScheme(currentScheme);
    Alert.alert("Success", "Grading scheme saved successfully!");
  };

  const resetToDefault = () => {
    setCurrentScheme(DEFAULT_GRADE_SCHEME);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>
            Grading Setup
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            Configure your university's grading rules
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={resetToDefault} style={[styles.actionBtn, { backgroundColor: colors.surfaceHover }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.medium }}>Reset to Default</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.white, fontFamily: fontFamily.medium }}>Save Scheme</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.colLetter, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>Grade</Text>
          <Text style={[styles.colPoints, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>Points</Text>
          <Text style={[styles.colRange, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>Min Marks</Text>
        </View>

        {currentScheme.boundaries.map((boundary, index) => (
          <BlurView 
            key={boundary.id} 
            intensity={isDark ? 20 : 60} 
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.row, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
                borderColor: colors.border,
                borderBottomWidth: index === currentScheme.boundaries.length - 1 ? 0 : 1 
              }
            ]}
          >
            <View style={styles.colLetter}>
              <TextInput 
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={boundary.gradeLetter}
                onChangeText={(text) => handleBoundaryChange(boundary.id, 'gradeLetter', text)}
                maxLength={2}
              />
            </View>
            <View style={styles.colPoints}>
              <TextInput 
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={String(boundary.gradePoints)}
                onChangeText={(text) => handleBoundaryChange(boundary.id, 'gradePoints', text)}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={styles.colRange}>
              <TextInput 
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={String(boundary.minMarks)}
                onChangeText={(text) => handleBoundaryChange(boundary.id, 'minMarks', text)}
                keyboardType="numeric"
              />
            </View>
          </BlurView>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  colLetter: {
    flex: 1,
  },
  colPoints: {
    flex: 1,
  },
  colRange: {
    flex: 1.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  }
});
