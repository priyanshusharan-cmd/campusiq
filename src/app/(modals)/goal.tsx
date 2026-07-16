import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, Modal, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/theme';
import { useSettingsStore, useAcademicStore, useProfileStore } from '@/stores';
import { getGPALabel } from '@/lib';

const { width } = Dimensions.get('window');

export default function GoalScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  const currentCGPA = useAcademicStore(s => s.getCGPA());
  const semesters = useAcademicStore(s => s.semesters);
  const gradeEntries = useAcademicStore(s => s.gradeEntries);
  const profile = useProfileStore(s => s.profile);

  const { targetCGPA, targetSemester, goalMotivation, setTargetCGPA, setTargetSemester, setGoalMotivation } = useSettingsStore();

  const gpaLabel = getGPALabel(currentCGPA);
  const progressPercent = targetCGPA > 0 ? Math.min(100, Math.max(0, (currentCGPA / targetCGPA) * 100)) : 0;
  const difference = targetCGPA > 0 ? (targetCGPA - currentCGPA).toFixed(2) : '0.00';

  const chartData = useMemo(() => {
    const data = semesters
      .map(sem => {
        const entries = gradeEntries.filter(e => e.semesterId === sem.id);
        if (entries.length === 0) return null;
        let pts = 0;
        let creds = 0;
        entries.forEach(e => {
          creds += e.credits;
          pts += e.gradePoint * e.credits;
        });
        const sgpa = creds > 0 ? pts / creds : 0;
        return { value: parseFloat(sgpa.toFixed(2)), label: `Sem ${sem.number}` };
      })
      .filter(d => d !== null);
      
    if (data.length === 0) {
      return [{ value: 0, label: 'Start' }];
    }
    return data;
  }, [semesters, gradeEntries]);

  const [editModal, setEditModal] = useState<{ visible: boolean; type: 'cgpa' | 'semester' | 'motivation'; value: string }>({
    visible: false,
    type: 'cgpa',
    value: '',
  });

  const handleSaveModal = () => {
    if (editModal.type === 'cgpa') {
      const val = parseFloat(editModal.value);
      if (!isNaN(val) && val >= 0 && val <= 10) setTargetCGPA(val);
    } else if (editModal.type === 'semester') {
      const val = parseInt(editModal.value, 10);
      if (!isNaN(val) && val >= 1 && val <= 12) setTargetSemester(val);
    } else {
      setGoalMotivation(editModal.value);
    }
    setEditModal(prev => ({ ...prev, visible: false }));
  };

  const currentSemNum = profile?.currentSemester || 1;
  const semestersLeft = Math.max(1, targetSemester - currentSemNum);
  
  let requiredAvg = 0;
  if (targetCGPA > 0 && semestersLeft > 0) {
    const totalCreditsNeeded = targetSemester * 20; // estimate 20 credits per sem
    const creditsCompleted = currentSemNum * 20;
    const requiredPts = targetCGPA * totalCreditsNeeded - currentCGPA * creditsCompleted;
    requiredAvg = Math.max(0, Math.min(10, requiredPts / (semestersLeft * 20)));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Goal</Text>
        <Pressable style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="locate-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(20).duration(80)} style={styles.cardContainer}>
          <LinearGradient colors={['#0EA5E9', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)' }]}>Current CGPA</Text>
              <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)' }]}>Target CGPA</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyles.display, { color: '#FFF', fontSize: 36, lineHeight: 40 }]}>{currentCGPA > 0 ? currentCGPA.toFixed(2) : '--'}</Text>
                {currentCGPA > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#10B981', marginLeft: 8 }]}>
                    <Text style={[textStyles.smallMedium, { color: '#FFF', fontSize: 10 }]}>{gpaLabel}</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyles.display, { color: '#FFF', fontSize: 36, lineHeight: 40 }]}>{targetCGPA > 0 ? targetCGPA.toFixed(2) : '--'}</Text>
                <Pressable style={styles.editBtn} onPress={() => setEditModal({ visible: true, type: 'cgpa', value: targetCGPA ? targetCGPA.toString() : '' })}>
                  <Ionicons name="pencil" size={14} color="#3B82F6" />
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 24 }}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={[textStyles.small, { color: '#FFF', fontSize: 12 }]}>
                  {targetCGPA > 0 ? `You're ${difference} CGPA away from your goal!` : 'Set a target CGPA to track progress!'}
                </Text>
                <Text style={[textStyles.small, { color: 'rgba(255,255,255,0.8)', fontSize: 11 }]}>{progressPercent.toFixed(1)}%</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)} style={{ marginTop: 24 }}>
          <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 16 }]}>Goal Progress</Text>
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <LineChart
              data={chartData as any}
              width={width - spacing.lg * 2 - 32}
              height={180}
              spacing={(width - spacing.lg * 2 - 64) / Math.max(4, chartData.length)}
              initialSpacing={10}
              color="#3B82F6"
              thickness={2}
              dataPointsColor="#3B82F6"
              dataPointsRadius={4}
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              rulesColor={colors.borderLight}
              rulesType="solid"
              yAxisLabelTexts={['0.0', '2.0', '4.0', '6.0', '8.0', '10.0']}
              stepValue={2}
              maxValue={10}
              noOfSections={5}
              showReferenceLine1={targetCGPA > 0}
              referenceLine1Position={targetCGPA || 0}
              referenceLine1Config={{ color: '#3B82F6', thickness: 1, type: 'dashed' }}
            />
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
                <Text style={[textStyles.small, { color: colors.textSecondary }]}>Your CGPA</Text>
              </View>
              {targetCGPA > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#3B82F6', borderStyle: 'dashed', borderWidth: 1, height: 1 }]} />
                  <Text style={[textStyles.small, { color: colors.textSecondary }]}>Target CGPA</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)} style={{ marginTop: 24 }}>
          <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 12 }]}>Goal Settings</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <SettingItem icon="ribbon" iconColor="#8B5CF6" title="Target CGPA" value={targetCGPA > 0 ? targetCGPA.toFixed(2) : 'Not set'} colors={colors} textStyles={textStyles} onPress={() => setEditModal({ visible: true, type: 'cgpa', value: targetCGPA ? targetCGPA.toString() : '' })} />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <SettingItem icon="calendar" iconColor="#EC4899" title="Target Semester" value={targetSemester ? `\${targetSemester}th Semester` : 'Not set'} colors={colors} textStyles={textStyles} onPress={() => setEditModal({ visible: true, type: 'semester', value: targetSemester ? targetSemester.toString() : '' })} />
            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
            <SettingItem icon="shield-checkmark" iconColor="#10B981" title="Motivation" value={goalMotivation || 'Tap to add motivation'} colors={colors} textStyles={textStyles} isValueSub onPress={() => setEditModal({ visible: true, type: 'motivation', value: goalMotivation || '' })} />
          </View>
        </Animated.View>

        {targetCGPA > 0 && (
          <Animated.View entering={FadeInDown.delay(20).duration(80)} style={{ marginTop: 24 }}>
            <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 12 }]}>Tips to Achieve Your Goal</Text>
            <View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={[styles.tipIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>
                  {requiredAvg > 0 ? `Maintain above \${requiredAvg.toFixed(2)} SGPA` : 'You are well on track!'}
                </Text>
                <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 4, fontSize: 11 }]}>
                  {requiredAvg > 0 ? `You need at least \${requiredAvg.toFixed(2)} SGPA in your \${semestersLeft} remaining semesters to hit \${targetCGPA.toFixed(2)}.` : 'Keep up the excellent work!'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal visible={editModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: 16 }]}>
              Edit {editModal.type === 'cgpa' ? 'Target CGPA' : editModal.type === 'semester' ? 'Target Semester' : 'Motivation'}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.borderLight, backgroundColor: colors.bg }]}
              value={editModal.value}
              onChangeText={val => setEditModal(prev => ({ ...prev, value: val }))}
              keyboardType={editModal.type === 'motivation' ? 'default' : 'decimal-pad'}
              autoFocus
              multiline={editModal.type === 'motivation'}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => setEditModal(prev => ({ ...prev, visible: false }))}>
                <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary, marginLeft: 12 }]} onPress={handleSaveModal}>
                <Text style={[textStyles.bodyMedium, { color: '#FFF' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingItem({ icon, iconColor, title, value, colors, textStyles, isValueSub = false, onPress }: any) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, flexDirection: isValueSub ? 'column' : 'row', justifyContent: isValueSub ? 'center' : 'space-between', alignItems: isValueSub ? 'flex-start' : 'center' }}>
        <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, marginBottom: isValueSub ? 4 : 0 }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[isValueSub ? textStyles.small : textStyles.bodyMedium, { color: colors.textSecondary, marginRight: 8 }]} numberOfLines={1}>
            {value}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textQuaternary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cardContainer: { marginTop: 16, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  gradientCard: { borderRadius: 20, padding: 24 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'center' },
  editBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  chartCard: { borderRadius: 20, borderWidth: 1, padding: 16, paddingBottom: 20, alignItems: 'center' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  settingsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  divider: { height: 1, marginLeft: 64 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, borderWidth: 1 },
  tipIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }
});
