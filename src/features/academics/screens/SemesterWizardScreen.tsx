import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { SEMESTER_TEMPLATES } from '@/lib/gradingEngine';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

export function SemesterWizardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, fontFamily, isDark } = useTheme();
  const router = useRouter();
  
  const { getCurrentSemester } = useAcademicStore();
  const { addSubject } = useSubjectStore();
  const currentSemester = getCurrentSemester();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleApplyTemplate = () => {
    if (!currentSemester) {
      Alert.alert("Error", "No active semester to apply the template to.");
      return;
    }
    if (!selectedTemplate) return;

    const template = SEMESTER_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    Alert.alert(
      "Confirm",
      `Are you sure you want to populate your current semester with the ${template.name} template?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            const subjects = template.generateSubjects(currentSemester.id);
            subjects.forEach(sub => {
              addSubject({
                name: sub.name || '',
                code: sub.code || '',
                credits: sub.credits || 3,
                type: sub.type,
                semesterId: currentSemester.id,
                components: sub.components,
              });
            });
            Alert.alert("Success", "Subjects have been successfully added to your semester!");
            router.back();
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>
            Semester Wizard
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            Quickly populate your semester subjects
          </Text>
        </View>

        {SEMESTER_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <TouchableOpacity 
              key={template.id} 
              onPress={() => setSelectedTemplate(template.id)}
              activeOpacity={0.8}
            >
              <BlurView 
                intensity={isDark ? 20 : 60} 
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.templateCard, 
                  { 
                    backgroundColor: isSelected ? colors.primary + '20' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)'),
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
              >
                <View style={styles.templateHeader}>
                  <Text style={[styles.templateName, { color: colors.textPrimary, fontFamily: fontFamily.semiBold }]}>
                    {template.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </View>
                <Text style={[styles.templateDetails, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                  {template.totalCredits} Credits Total
                </Text>
              </BlurView>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          onPress={handleApplyTemplate} 
          disabled={!selectedTemplate}
          style={[styles.applyBtn, { backgroundColor: selectedTemplate ? colors.primary : colors.surfaceHover }]}
        >
          <Text style={[styles.applyBtnText, { color: selectedTemplate ? colors.white : colors.textSecondary, fontFamily: fontFamily.semiBold }]}>
            Apply Selected Template
          </Text>
        </TouchableOpacity>
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
  templateCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: {
    fontSize: 18,
  },
  templateDetails: {
    marginTop: 8,
    fontSize: 14,
  },
  applyBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  applyBtnText: {
    fontSize: 16,
  }
});
