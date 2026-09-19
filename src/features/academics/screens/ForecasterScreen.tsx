import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useActiveSubjects } from '@/stores/useSubjectStore';
import { SubjectPredictorCard } from '../components/SubjectPredictorCard';
import { generatePDFReport } from '@/lib/pdfGenerator';
import { calculateSubjectBounds, getGradeBoundary, convertLegacyToComponents } from '@/lib/gradingEngine';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSubjectStore } from '@/stores/useSubjectStore';

export function ForecasterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, textStyles } = useTheme();
  const router = useRouter();
  
  const { gradeScheme, getCurrentSemester, semesters, updateSemester, addSemester, setCurrentSemester } = useAcademicStore();
  const currentSemester = getCurrentSemester();
  const semesterSubjects = useActiveSubjects();
  const profile = useProfileStore(s => s.profile);
  const settings = useSettingsStore();
  const firstName = profile?.name?.split(' ')[0] || 'Student';

  const isSemesterComplete = currentSemester?.sgpa !== undefined && currentSemester.sgpa > 0;

  const [dreamSgpa, setDreamSgpa] = useState(-1); // -1 indicates uninitialized

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
  
  let maxAchievableSgpa = 0;
  if (semesterSubjects.length > 0) {
    let totalMaxGradePoints = 0;
    let totalCredits = 0;
    
    semesterSubjects.forEach(sub => {
      const components = sub.components || convertLegacyToComponents(sub.cieMarks, sub.aatMarks, sub.labInternalMarks, settings, sub.type === 'lab');
      const bounds = calculateSubjectBounds(components, {});
      const maxPossible = components.reduce((sum, c) => sum + c.weight, 0) || 100;
      const percentage = maxPossible > 0 ? Math.round((bounds.ceiling / maxPossible) * 100) : 0;
      const boundary = getGradeBoundary(gradeScheme, percentage);
      
      totalMaxGradePoints += (boundary.gradePoints * sub.credits);
      totalCredits += sub.credits;
    });
    
    if (totalCredits > 0) {
      maxAchievableSgpa = totalMaxGradePoints / totalCredits;
    }
  }

  // Calculate required uniform percentage to hit dreamSgpa
  let requiredPercentage = 0;
  if (dreamSgpa > 0 && maxAchievableSgpa > 0 && semesterSubjects.length > 0) {
    let low = 0;
    let high = 1;
    let bestP = 0;
    
    let floorSgpa = 0;
    let totalCredits = 0;
    const subjectData = semesterSubjects.map(sub => {
      const components = sub.components || convertLegacyToComponents(sub.cieMarks, sub.aatMarks, sub.labInternalMarks, settings, sub.type === 'lab');
      const bounds = calculateSubjectBounds(components, {});
      const maxPossible = components.reduce((sum, c) => sum + c.weight, 0) || 100;
      totalCredits += sub.credits;
      return { bounds, maxPossible, credits: sub.credits };
    });
    
    if (totalCredits > 0) {
      let floorPoints = 0;
      subjectData.forEach(d => {
        const percentage = d.maxPossible > 0 ? Math.round((d.bounds.floor / d.maxPossible) * 100) : 0;
        floorPoints += getGradeBoundary(gradeScheme, percentage).gradePoints * d.credits;
      });
      floorSgpa = floorPoints / totalCredits;
    }
    
    if (floorSgpa >= dreamSgpa) {
      requiredPercentage = 0;
    } else if (maxAchievableSgpa < dreamSgpa) {
      requiredPercentage = 1;
    } else {
      for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        let testPoints = 0;
        subjectData.forEach(d => {
          const targetScore = d.bounds.floor + (d.bounds.ceiling - d.bounds.floor) * mid;
          const percentage = d.maxPossible > 0 ? Math.round((targetScore / d.maxPossible) * 100) : 0;
          testPoints += getGradeBoundary(gradeScheme, percentage).gradePoints * d.credits;
        });
        const testSgpa = testPoints / totalCredits;
        if (testSgpa >= dreamSgpa) {
          bestP = mid;
          high = mid; // Try to find a lower percentage that still achieves it
        } else {
          low = mid;
        }
      }
      requiredPercentage = bestP;
    }
  }

  // Effect to initialize or cap dreamSgpa
  useEffect(() => {
    if (maxAchievableSgpa > 0) {
      const maxFloor = Math.floor(maxAchievableSgpa * 10) / 10;
      if (dreamSgpa === -1) {
        // First load: set to max achievable
        setDreamSgpa(maxFloor);
      } else if (dreamSgpa > maxFloor) {
        // Cap if it somehow exceeds (e.g. subject removed)
        setDreamSgpa(maxFloor);
      }
    }
  }, [maxAchievableSgpa, dreamSgpa]);

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
        {semesterSubjects.length > 0 && !isSemesterComplete && (
          <LinearGradient
            colors={isDark ? ['#5339C6', '#3D289B'] : ['#8A73FF', '#6B58F5']}
            style={styles.tunerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.tunerControls}>
              <Pressable 
                style={styles.tunerButton} 
                onPress={() => setDreamSgpa(prev => Math.max(0, prev - 0.1))}
              >
                <Ionicons name="remove" size={24} color={isDark ? "#5339C6" : "#8A73FF"} />
              </Pressable>
              <Text style={styles.dreamSgpaText}>{dreamSgpa === -1 ? '0.0' : dreamSgpa.toFixed(1)}</Text>
              <Pressable 
                style={styles.tunerButton}
                onPress={() => setDreamSgpa(prev => {
                  const next = prev + 0.1;
                  // Don't allow setting target above max achievable
                  return next > maxAchievableSgpa ? prev : next;
                })}
              >
                <Ionicons name="add" size={24} color={isDark ? "#5339C6" : "#8A73FF"} />
              </Pressable>
            </View>
            <Text style={styles.tunerDescription}>
              Tune your dream SGPA to calculate exactly what you need in the final exams.
            </Text>
            <View style={styles.maxAchievablePill}>
              <Text style={styles.maxAchievableText}>Max Achievable: {maxAchievableSgpa.toFixed(2)} SGPA</Text>
            </View>
          </LinearGradient>
        )}

        {/* Retrospective Card */}
        {semesterSubjects.length > 0 && isSemesterComplete && (
          <LinearGradient
            colors={isDark ? ['#059669', '#047857'] : ['#10B981', '#059669']}
            style={styles.tunerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.tunerControls}>
              <Text style={styles.dreamSgpaText}>{currentSemester?.sgpa?.toFixed(2)}</Text>
            </View>
            <Text style={[styles.tunerDescription, { fontSize: 16, fontWeight: '500' }]}>
              Semester {currentSemester?.number} is complete! Here is how you performed.
            </Text>
          </LinearGradient>
        )}



        <View style={[styles.listHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={[textStyles.h3, { color: isDark ? '#FFFFFF' : colors.textPrimary }]}>
            {isSemesterComplete ? 'Subject Final Marks' : 'Subject Goals'}
          </Text>
        </View>

        {(isSemesterComplete && currentSemester?.sgpaSubjects ? currentSemester.sgpaSubjects : semesterSubjects).map((subject: any) => (
          <SubjectPredictorCard 
            key={subject.id} 
            subject={subject as any} 
            scheme={gradeScheme} 
            requiredPercentage={requiredPercentage}
            isCompleted={isSemesterComplete}
            onPress={() => {
              if (!isSemesterComplete) {
                router.push(`/(modals)/subject-detail?id=${subject.id}` as any);
              }
            }} 
          />
        ))}

        {semesterSubjects.length === 0 && (!isSemesterComplete || !currentSemester?.sgpaSubjects || currentSemester.sgpaSubjects.length === 0) && (
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

