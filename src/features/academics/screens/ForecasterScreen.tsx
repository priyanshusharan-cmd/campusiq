import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useActiveSubjects } from '@/stores/useSubjectStore';
import { SubjectPredictorCard } from '../components/SubjectPredictorCard';
import { generatePDFReport } from '@/lib/pdfGenerator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';

export function ForecasterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, textStyles } = useTheme();
  const router = useRouter();
  
  const { gradeScheme, getCurrentSemester, semesters, addSemester, setCurrentSemester } = useAcademicStore();
  const currentSemester = getCurrentSemester();
  const semesterSubjects = useActiveSubjects();
  const profile = useProfileStore(s => s.profile);
  const firstName = profile?.name?.split(' ')[0] || 'Student';

  const [dreamSgpa, setDreamSgpa] = useState(8.5);

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
  
  // Subjects are automatically filtered for the current semester via useActiveSubjects

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
      <View style={[styles.emptyContainer, { flex: 1 }]}>
        <Text style={{ color: colors.textSecondary }}>
          No active semester found.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* GPA Tuner Card */}
        <LinearGradient
          colors={['#8A73FF', '#6B58F5']}
          style={styles.tunerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.tunerControls}>
            <Pressable 
              style={styles.tunerButton} 
              onPress={() => setDreamSgpa(prev => Math.max(0, prev - 0.1))}
            >
              <Ionicons name="remove" size={24} color="#8A73FF" />
            </Pressable>
            <Text style={styles.dreamSgpaText}>{dreamSgpa.toFixed(1)}</Text>
            <Pressable 
              style={styles.tunerButton}
              onPress={() => setDreamSgpa(prev => Math.min(10, prev + 0.1))}
            >
              <Ionicons name="add" size={24} color="#8A73FF" />
            </Pressable>
          </View>
          <Text style={styles.tunerDescription}>
            Tune your dream SGPA to calculate exactly what you need in the final exams.
          </Text>
          <View style={styles.maxAchievablePill}>
            <Text style={styles.maxAchievableText}>Max Achievable: 8.52 SGPA</Text>
          </View>
        </LinearGradient>



        <View style={styles.listHeader}>
          <Text style={[textStyles.h3, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>
            Subject Goals
          </Text>
        </View>

        {semesterSubjects.map((subject) => (
          <SubjectPredictorCard 
            key={subject.id} 
            subject={subject} 
            scheme={gradeScheme} 
            onPress={() => {
              router.push(`/(modals)/subject-detail?id=${subject.id}` as any);
            }} 
          />
        ))}

        {semesterSubjects.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  tunerCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  tunerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tunerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dreamSgpaText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFF',
    marginHorizontal: 32,
    letterSpacing: -1,
  },
  tunerDescription: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  maxAchievablePill: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  maxAchievableText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  exportText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 24,
    width: '80%',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  }
});

