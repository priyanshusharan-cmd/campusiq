import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { SubjectPredictorCard } from '../components/SubjectPredictorCard';
import { generatePDFReport } from '@/lib/pdfGenerator';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';

export function ForecasterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, fontFamily } = useTheme();
  const router = useRouter();
  
  const { gradeScheme, getCurrentSemester, semesters, addSemester, setCurrentSemester } = useAcademicStore();
  const currentSemester = getCurrentSemester();
  const { subjects } = useSubjectStore();
  const profile = useProfileStore(s => s.profile);

  useEffect(() => {
    if (!currentSemester && profile?.currentSemester) {
      const existing = semesters.find(s => s.number === profile.currentSemester);
      if (existing) {
        setCurrentSemester(existing.id);
      } else {
        addSemester({
          name: `Semester ${profile.currentSemester}`,
          number: profile.currentSemester,
          isCurrent: true,
        });
      }
    }
  }, [currentSemester, profile?.currentSemester, semesters, setCurrentSemester, addSemester]);
  
  const semesterSubjects = subjects.filter(s => s.semesterId === currentSemester?.id);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPDF = async () => {
    if (!currentSemester || semesterSubjects.length === 0) {
      Alert.alert("No Data", "Please add some subjects to the current semester before generating a report.");
      return;
    }
    
    setIsGenerating(true);
    try {
      await generatePDFReport({
        semester: currentSemester,
        subjects: semesterSubjects,
        scheme: gradeScheme,
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to generate the PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentSemester) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.medium }}>
          No active semester found.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>
            Grade Forecaster
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            Predict and track your academic journey
          </Text>
        </View>

        <TouchableOpacity 
          onPress={handleExportPDF} 
          disabled={isGenerating}
          style={styles.exportButtonContainer}
        >
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.exportButton, { borderColor: colors.primary + '50', borderWidth: 1 }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary, fontFamily: fontFamily.semiBold }]}>
              {isGenerating ? "Generating..." : "Export Performance Report"}
            </Text>
          </BlurView>
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.textPrimary, fontFamily: fontFamily.semiBold }]}>
            Subjects ({semesterSubjects.length})
          </Text>
        </View>

        {semesterSubjects.map((subject) => (
          <SubjectPredictorCard 
            key={subject.id} 
            subject={subject} 
            scheme={gradeScheme} 
            onPress={() => {
              router.push(`/(modals)/subject-detail?id=${subject.id}`);
            }} 
          />
        ))}

        {semesterSubjects.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            No subjects added to this semester yet.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  exportButtonContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  exportText: {
    marginLeft: 12,
    fontSize: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
  }
});
