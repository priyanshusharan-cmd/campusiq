import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getSubjectTheme } from '@/utils/subjectTheme';
import { calculateSubjectBounds, getGradeBoundary, convertLegacyToComponents, calculateSGPAImpact } from '@/lib/gradingEngine';
import type { AssessmentComponent } from '@/types/grading';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fontFamily, isDark } = useTheme();

  const { getSubject, updateSubject } = useSubjectStore();
  const { gradeScheme, getCurrentSemester } = useAcademicStore();
  const settings = useSettingsStore();
  
  const subject = getSubject(id as string);
  const currentSemester = getCurrentSemester();

  if (!subject) return null;

  const [components, setComponents] = useState<AssessmentComponent[]>(
    subject.components || convertLegacyToComponents(subject.cieMarks, subject.aatMarks, subject.labInternalMarks, settings, subject.type === 'lab')
  );

  const [simulatedMarks, setSimulatedMarks] = useState<Record<string, number>>(subject.targetMarks || {});

  const theme = getSubjectTheme(subject.name, subject.code, isDark, subject.color, subject.icon);
  const themeColor = theme.color;
  const themeBgColor = theme.bgColor;

  const bounds = useMemo(() => calculateSubjectBounds(components, simulatedMarks), [components, simulatedMarks]);
  
  const totalSubjectMarks = useMemo(() => components.reduce((sum, comp) => sum + (comp.type === 'grouped' ? comp.weight : comp.maxMarks), 0) || 100, [components]);
  const predictedPercentage = totalSubjectMarks > 0 ? Math.round((bounds.simulated / totalSubjectMarks) * 100) : 0;
  const predictedBoundary = getGradeBoundary(gradeScheme, predictedPercentage);
  const totalSemesterCredits = currentSemester?.totalCredits || 22; // fallback
  
  const sgpaImpact = calculateSGPAImpact(subject.credits, totalSemesterCredits, predictedBoundary.gradePoints);
  
  const floorPct = Math.min(100, Math.max(0, totalSubjectMarks ? (bounds.floor / totalSubjectMarks) * 100 : 0));
  const simPct = Math.min(100, Math.max(0, totalSubjectMarks ? (bounds.simulated / totalSubjectMarks) * 100 : 0));
  const ceilPct = Math.min(100, Math.max(0, totalSubjectMarks ? (bounds.ceiling / totalSubjectMarks) * 100 : 0));

  const getGradeColor = (letterStr: string) => {
    const letter = letterStr.toUpperCase();
    if (letter === 'S' || letter === 'O') return '#8B5CF6'; // Purple
    if (letter === 'A') return '#10B981'; // Green
    if (letter === 'B') return '#3B82F6'; // Blue
    if (letter === 'C') return '#0EA5E9'; // Cyan
    if (letter === 'D') return '#F59E0B'; // Orange
    if (letter === 'E') return '#EC4899'; // Pink
    if (letter === 'F') return '#EF4444'; // Red
    return '#64748B';
  };
  const gradeBubbleColor = getGradeColor(predictedBoundary.gradeLetter);
  const gradeBubbleBg = isDark ? `${gradeBubbleColor}20` : `${gradeBubbleColor}15`;

  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  const handleUpdateComponent = (compId: string, updates: Partial<AssessmentComponent>) => {
    const updateRecursive = (list: AssessmentComponent[]): AssessmentComponent[] => {
      return list.map(c => {
        if (c.id === compId) return { ...c, ...updates };
        if (c.children) return { ...c, children: updateRecursive(c.children) };
        return c;
      });
    };
    setComponents(updateRecursive(components));
  };

  const handleSimulateMark = (compId: string, mark: number) => {
    setSimulatedMarks(prev => ({ ...prev, [compId]: mark }));
  };

  const handleSave = () => {
    updateSubject(subject.id, { components, targetMarks: simulatedMarks });
    router.back();
  };

  const handleSyncScheme = () => {
    // Extract earned marks from current components if any
    const cieMarks: number[] = [];
    let aatMarks: number | undefined;
    let labMarks: number[] = [];
    
    components.forEach(c => {
      if (c.id === 'legacy-cie' && c.children) {
        c.children.forEach(child => {
          cieMarks.push(child.earnedMarks as number);
        });
      }
      if (c.id === 'legacy-aat') aatMarks = c.earnedMarks;
      if (c.id === 'legacy-lab') labMarks.push(c.earnedMarks as number);
    });

    const newComps = convertLegacyToComponents(
      cieMarks, 
      aatMarks, 
      labMarks, 
      settings, 
      subject.type === 'lab'
    );
    setComponents(newComps);
  };

  const renderComponentItem = (comp: AssessmentComponent) => {
    if (comp.type === 'grouped') {
      return (
        <View key={comp.id} style={styles.groupContainer}>
          <Text style={[styles.groupTitle, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>{comp.name}</Text>
          <Text style={[styles.groupSubtitle, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            Group: {comp.selectionRule?.replace('_', ' ').toUpperCase()} | Weight: {comp.weight} pts
          </Text>
          <View style={{ marginTop: 12 }}>
            {comp.children?.map(child => renderComponentItem(child))}
          </View>
        </View>
      );
    }

    const isPending = comp.earnedMarks === undefined;
    const currentVal = isPending ? (simulatedMarks[comp.id] !== undefined ? simulatedMarks[comp.id] : comp.maxMarks) : (comp.earnedMarks || 0);

    return (
      <View key={comp.id} style={[styles.componentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.compHeader}>
          <View>
            <Text style={[styles.compName, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>{comp.name}</Text>
            <Text style={[styles.compWeight, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
              Weight: {comp.weight} pts ({comp.maxMarks} max marks)
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.pendingToggle, { 
              backgroundColor: isPending ? colors.bgSecondary : themeBgColor,
              borderColor: isPending ? colors.border : themeColor 
            }]}
            onPress={() => {
              if (isPending) {
                handleUpdateComponent(comp.id, { earnedMarks: currentVal });
              } else {
                handleUpdateComponent(comp.id, { earnedMarks: undefined });
                setSimulatedMarks(prev => ({ ...prev, [comp.id]: currentVal }));
              }
            }}
          >
            <Ionicons name={isPending ? "ellipse-outline" : "checkmark-circle"} size={14} color={isPending ? colors.textSecondary : themeColor} />
            <Text style={[styles.pendingText, { color: isPending ? colors.textSecondary : themeColor, fontFamily: fontFamily.medium }]}>
              {isPending ? 'Pending' : 'Completed'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={comp.maxMarks}
            value={currentVal}
            onValueChange={val => isPending ? handleSimulateMark(comp.id, val) : handleUpdateComponent(comp.id, { earnedMarks: val })}
            minimumTrackTintColor={themeColor}
            maximumTrackTintColor={colors.border}
            thumbTintColor={themeColor}
          />
          <View style={[styles.markInputWrap, { borderColor: activeInputId === comp.id ? themeColor : colors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB' }]}>
            <TextInput
              style={[styles.markInput, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}
              value={activeInputId === comp.id ? inputText : (Number.isInteger(currentVal) ? currentVal.toString() : currentVal.toFixed(2))}
              onFocus={() => {
                setActiveInputId(comp.id);
                setInputText(Number.isInteger(currentVal) ? currentVal.toString() : currentVal.toFixed(2));
              }}
              onBlur={() => {
                setActiveInputId(null);
                const num = parseFloat(inputText);
                if (!isNaN(num)) {
                  if (isPending) handleSimulateMark(comp.id, num);
                  else handleUpdateComponent(comp.id, { earnedMarks: num });
                }
              }}
              onChangeText={text => {
                setInputText(text);
                const num = parseFloat(text);
                if (!isNaN(num)) {
                  if (isPending) handleSimulateMark(comp.id, num);
                  else handleUpdateComponent(comp.id, { earnedMarks: num });
                }
              }}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>
        <Text style={[styles.earnedPts, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
          {comp.maxMarks ? ((currentVal / comp.maxMarks) * comp.weight).toFixed(2) : 0} pts
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.navHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary, fontFamily: fontFamily.bold }]} numberOfLines={1}>
          {subject.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Bubble */}
        <View style={[styles.bubbleCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.bubbleLabel, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>
            PREDICTED TOTAL MARKS
          </Text>
          <View style={styles.bubbleRow}>
            <View>
              <Text style={[styles.bubbleScore, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>
                {bounds.simulated.toFixed(1)} <Text style={{ fontSize: 18, color: colors.textSecondary }}>/ {totalSubjectMarks}</Text>
              </Text>
              <Text style={[styles.bubbleCredits, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                Credits: {subject.credits}
              </Text>
            </View>
            <View style={[styles.gradeCircle, { backgroundColor: gradeBubbleBg }]}>
              <Text style={[styles.gradeLetter, { color: gradeBubbleColor, fontFamily: fontFamily.bold }]}>
                {predictedBoundary.gradeLetter}
              </Text>
              <Text style={[styles.gradePoints, { color: gradeBubbleColor, fontFamily: fontFamily.semiBold }]}>
                GP: {predictedBoundary.gradePoints}
              </Text>
            </View>
          </View>
        </View>

        {/* Score Projection */}
        <View style={[styles.boundsCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface, borderColor: colors.borderLight }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="analytics" size={18} color={themeColor} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, color: colors.textPrimary, fontFamily: fontFamily.bold }}>
              Score Projection
            </Text>
          </View>
          
          <View style={[styles.boundsTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }]}>
            {/* Best Case (Max Possible) background */}
            <View style={{ position: 'absolute', left: 0, height: '100%', width: `${ceilPct}%`, backgroundColor: themeColor, opacity: 0.15 }} />
            
            {/* Target/Simulated background */}
            <View style={{ position: 'absolute', left: 0, height: '100%', width: `${simPct}%`, backgroundColor: themeColor, opacity: 0.4 }} />
            
            {/* Guaranteed background */}
            <View style={{ position: 'absolute', left: 0, height: '100%', width: `${floorPct}%`, backgroundColor: themeColor }} />
            
            {/* Target Marker */}
            <View style={{ position: 'absolute', left: `${simPct}%`, height: '100%', width: 2, backgroundColor: isDark ? '#FFF' : '#000', marginLeft: -1, borderRadius: 1, opacity: 0.5 }} />
          </View>
          
          <View style={styles.boundsLegendRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: themeColor }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Guaranteed</Text>
              </View>
              <Text style={[styles.legendValue, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>{bounds.floor.toFixed(1)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: themeColor, opacity: 0.6 }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Target</Text>
              </View>
              <Text style={[styles.legendValue, { color: themeColor, fontFamily: fontFamily.bold }]}>{bounds.simulated.toFixed(1)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: themeColor, opacity: 0.25 }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Best Case</Text>
              </View>
              <Text style={[styles.legendValue, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>{bounds.ceiling.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Components List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>Assessment Components</Text>
          <TouchableOpacity onPress={handleSyncScheme} style={{ marginRight: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sync" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: fontFamily.semiBold }}>Sync Scheme</Text>
          </TouchableOpacity>
          <View style={[styles.countBadge, { backgroundColor: themeBgColor }]}>
            <Text style={[styles.countText, { color: themeColor, fontFamily: fontFamily.semiBold }]}>
              {components.reduce((c, comp) => c + (comp.type === 'grouped' ? (comp.children?.length||0) : 1), 0)} Items
            </Text>
          </View>
        </View>

        <View style={[styles.componentsList, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          {components.map(comp => renderComponentItem(comp))}
        </View>

        {/* SGPA Impact */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={20} color={themeColor} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>SGPA Impact & Loss Analysis</Text>
        </View>

        <View style={[styles.impactCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.bubbleLabel, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>PREDICTED SGPA CONTRIBUTION</Text>
          <View style={styles.bubbleRow}>
            <Text style={[styles.bubbleScore, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>
              {sgpaImpact.predictedContribution.toFixed(2)} <Text style={{ fontSize: 16, color: colors.textSecondary }}>/ {sgpaImpact.maxContribution.toFixed(2)} SGPA</Text>
            </Text>
            <View style={[styles.gradeCircleSmall, { backgroundColor: gradeBubbleBg }]}>
              <Text style={[styles.gradeLetterSmall, { color: gradeBubbleColor, fontFamily: fontFamily.bold }]}>{predictedBoundary.gradeLetter}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.impactGrid}>
            <View style={styles.impactGridCol}>
              <Text style={[styles.impactLabel, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>SGPA Points Lost</Text>
              <Text style={[styles.impactValLost, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>-{sgpaImpact.lostPoints.toFixed(2)} SGPA</Text>
              <Text style={[styles.impactSub, { color: colors.textSecondary }]}>({(totalSubjectMarks - bounds.simulated).toFixed(1)} marks lost)</Text>
            </View>
            <View style={styles.impactGridCol}>
              <Text style={[styles.impactLabel, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>Max SGPA Contribution</Text>
              <Text style={[styles.impactVal, { color: colors.textPrimary, fontFamily: fontFamily.bold }]}>{sgpaImpact.maxContribution.toFixed(2)} SGPA</Text>
              <Text style={[styles.impactSub, { color: colors.textSecondary }]}>({(100).toFixed(1)}% achievable)</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: themeColor, paddingBottom: insets.bottom || 24 }]}>
        <Text style={[styles.saveBtnText, { color: '#FFF', fontFamily: fontFamily.semiBold }]}>Save Configuration</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8, marginRight: 8 },
  navTitle: { fontSize: 20, flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  
  bubbleCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  bubbleLabel: { fontSize: 11, letterSpacing: 0.5, marginBottom: 12 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bubbleScore: { fontSize: 40 },
  bubbleCredits: { fontSize: 13, marginTop: 4 },
  gradeCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  gradeLetter: { fontSize: 28 },
  gradePoints: { fontSize: 11, marginTop: 2 },
  
  boundsCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  boundsLabel: { fontSize: 14, marginBottom: 20 },
  boundsTrack: { height: 8, borderRadius: 4, width: '100%', position: 'relative', marginBottom: 20 },
  boundsFill: { position: 'absolute', height: '100%', borderRadius: 4 },
  boundsMarker: { position: 'absolute', width: 12, height: 12, borderRadius: 6, top: -2, marginLeft: -6, borderWidth: 2, borderColor: '#FFF' },
  boundsLegendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11 },
  legendValue: { fontSize: 16 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countText: { fontSize: 12 },
  
  componentsList: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 32 },
  groupContainer: { marginBottom: 24 },
  groupTitle: { fontSize: 16, marginBottom: 4 },
  groupSubtitle: { fontSize: 11, marginBottom: 8 },
  
  componentCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  compName: { fontSize: 15, marginBottom: 4 },
  compWeight: { fontSize: 11 },
  pendingToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pendingText: { fontSize: 11, marginLeft: 4 },
  
  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slider: { flex: 1, marginRight: 16, height: 40 },
  markInputWrap: { width: 64, height: 36, borderWidth: 1, borderRadius: 10, justifyContent: 'center' },
  markInput: { textAlign: 'center', fontSize: 14 },
  earnedPts: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },

  impactCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 32 },
  gradeCircleSmall: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  gradeLetterSmall: { fontSize: 20 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  impactGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  impactGridCol: { flex: 1 },
  impactLabel: { fontSize: 12, marginBottom: 8 },
  impactVal: { fontSize: 18, marginBottom: 4 },
  impactValLost: { fontSize: 18, marginBottom: 4 },
  impactSub: { fontSize: 11 },

  saveBtn: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16 }
});
