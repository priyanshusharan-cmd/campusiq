import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TouchableOpacity, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useAcademicStore, useSubjectAttendance, useSubjectStore, useSettingsStore } from '@/stores';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'marks' | 'grades' | 'attendance';

export default function AnalyticsScreen() {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const semesters = useAcademicStore(s => s.semesters);
  const getSGPA = useAcademicStore(s => s.getSGPA);
  const cgpa = useAcademicStore(s => s.getCGPA());
  const gradeEntries = useAcademicStore(s => s.gradeEntries);
  const subjectStats = useSubjectAttendance();
  const subjects = useSubjectStore(s => s.subjects);
  const hasSubjects = subjects.length > 0;

  // CGPA Trend Data
  const cgpaTrendData = useMemo(() => {
    const sortedSemesters = [...semesters].sort((a, b) => a.number - b.number);
    const data = sortedSemesters
      .map(sem => {
        // First check gradeEntries, then fall back to manual entry
        const entries = gradeEntries.filter(e => e.semesterId === sem.id);
        let sgpa = 0;
        if (entries.length > 0) {
          const totalCredits = entries.reduce((sum, e) => sum + e.credits, 0);
          const totalPoints = entries.reduce((sum, e) => sum + e.gradePoint * e.credits, 0);
          sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
        } else if (sem.sgpa && sem.sgpa > 0) {
          sgpa = sem.sgpa;
        }
        
        if (sgpa <= 0) return null;
        return {
          value: parseFloat(sgpa.toFixed(2)),
          label: `Sem ${sem.number}`,
        };
      })
      .filter(d => d !== null);
    
    if (data.length === 0) {
      return [{ value: 0, label: 'Start' }];
    }
    return data;
  }, [semesters, gradeEntries]);

  // Subject Attendance Bars
  const attendanceBarsData = useMemo(() => {
    if (subjectStats.length === 0) return [{ value: 0, label: 'None' }];
    return subjectStats.map(stat => ({
      value: stat.percentage,
      label: stat.subjectName.substring(0, 3).toUpperCase(),
      frontColor: stat.percentage >= 75 ? colors.success : colors.danger,
      gradientColor: stat.percentage >= 75 ? (isDark ? '#34D399' : '#10B981') : (isDark ? '#F87171' : '#EF4444'),
    }));
  }, [subjectStats, colors, isDark]);

  const avgAttendance = useMemo(() => {
    if (subjectStats.length === 0) return 0;
    const sum = subjectStats.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / subjectStats.length);
  }, [subjectStats]);

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: 'pie-chart' },
    { id: 'marks', label: 'Marks', icon: 'ribbon' },
    { id: 'grades', label: 'Grades', icon: 'school' },
    { id: 'attendance', label: 'Attendance', icon: 'calendar' },
  ];

  const exportToPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; background: #FAFAFA; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6366F1; padding-bottom: 30px; }
              .logo-title-container { display: flex; align-items: center; justify-content: center; gap: 15px; }
              .title { font-size: 34px; color: #1E1B4B; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
              .subtitle { font-size: 16px; color: #6B7280; margin-top: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; }
              .summary-container { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
              .summary-box { flex: 1; background: #FFFFFF; border: 1px solid #E5E7EB; padding: 30px 20px; border-radius: 16px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
              .summary-box-primary { border-top: 4px solid #6366F1; }
              .summary-box-success { border-top: 4px solid #10B981; }
              .summary-value { font-size: 42px; font-weight: 800; margin-bottom: 8px; }
              .val-primary { color: #4F46E5; }
              .val-success { color: #059669; }
              .summary-label { font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
              .section-title { font-size: 22px; color: #111827; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; margin-bottom: 25px; margin-top: 50px; font-weight: 700; }
              table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; }
              th, td { text-align: left; padding: 16px; border-bottom: 1px solid #E5E7EB; }
              th { background-color: #F9FAFB; color: #374151; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
              tr:last-child td { border-bottom: none; }
              .safe { color: #10B981; font-weight: 700; }
              .danger { color: #EF4444; font-weight: 700; }
              .footer { text-align: center; margin-top: 60px; color: #9CA3AF; font-size: 12px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-title-container">
                <h1 class="title">CampusIQ</h1>
              </div>
              <p class="subtitle">Performance Analytics Report</p>
            </div>
            
            <div class="summary-container">
              <div class="summary-box summary-box-primary">
                <div class="summary-value val-primary">${cgpa > 0 ? cgpa.toFixed(2) : '--'}</div>
                <div class="summary-label">Overall CGPA</div>
              </div>
              <div class="summary-box summary-box-success">
                <div class="summary-value val-success">${avgAttendance}%</div>
                <div class="summary-label">Average Attendance</div>
              </div>
            </div>

            <div class="section-title">Subject Attendance Breakdown</div>
            <table>
              <tr>
                <th>Subject</th>
                <th>Target</th>
                <th>Classes Attended</th>
                <th>Missed</th>
                <th>Percentage</th>
              </tr>
              ${subjectStats.map(stat => {
                const subject = subjects.find(s => s.id === stat.subjectId);
                const target = subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget;
                const isSafe = stat.percentage >= target;
                return `
                  <tr>
                    <td style="font-weight: 600; color: #1F2937;">${stat.subjectName}</td>
                    <td>${target}%</td>
                    <td>${stat.present} / ${stat.totalClasses}</td>
                    <td>${stat.absent}</td>
                    <td class="${isSafe ? 'safe' : 'danger'}">${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `;
              }).join('')}
            </table>

            <div class="section-title">Academic Trend & SGPA</div>
            <table>
              <tr>
                <th>Semester</th>
                <th>SGPA</th>
              </tr>
              ${semesters.map(sem => `
                <tr>
                  <td style="font-weight: 600; color: #1F2937;">${sem.name}</td>
                  <td style="color: #4F46E5; font-weight: 700;">${getSGPA(sem.id).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>

            <div class="footer">
              Generated on ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Export Analytics PDF' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <LinearGradient 
      colors={isDark ? ['#05050A', '#130B24', '#05050A'] : ['#F8FAFC', '#EFF6FF', '#E0E7FF']} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[textStyles.h2, { color: colors.textPrimary, letterSpacing: -0.5 }]}>Analytics</Text>
            <Text style={[textStyles.small, { color: colors.textSecondary, letterSpacing: 0.2 }]}>Performance & Insights</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={exportToPDF}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : '#C7D2FE' }}
        >
          <Ionicons name="download-outline" size={16} color={isDark ? '#A5B4FC' : '#4F46E5'} style={{ marginRight: 6 }} />
          <Text style={[textStyles.smallMedium, { color: isDark ? '#A5B4FC' : '#4F46E5', fontWeight: '700' }]}>PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingBottom: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, paddingVertical: 8 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity 
                key={tab.id} 
                onPress={() => setActiveTab(tab.id)} 
              >
                <LinearGradient
                  colors={isActive ? (isDark ? ['#6366F1', '#4F46E5'] : ['#4F46E5', '#4338CA']) : (isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)'] : ['#FFFFFF', '#F9FAFB'])}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: isActive ? (isDark ? 'rgba(165, 180, 252, 0.4)' : '#6366F1') : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                  }}
                >
                  <Ionicons name={tab.icon} size={16} color={isActive ? '#FFF' : colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[textStyles.bodyMedium, { color: isActive ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: isActive ? '700' : '500' }]}>{tab.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {!hasSubjects && activeTab !== 'grades' ? (
          <Animated.View entering={FadeInDown.delay(20).duration(100)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            <Card>
              <EmptyState
                icon="bar-chart-outline"
                title="No Data Available"
                subtitle="Add subjects and mark attendance to see your analytics."
              />
            </Card>
          </Animated.View>
        ) : (
          <>
            {activeTab === 'overview' && (
              <Animated.View entering={FadeIn}>
                {/* Insights */}
                <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <LinearGradient
                      colors={isDark ? ['rgba(99, 102, 241, 0.2)', 'rgba(79, 70, 229, 0.1)'] : ['#EEF2FF', '#E0E7FF']}
                      style={{ flex: 1, padding: 22, borderRadius: 28, borderWidth: 1, borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.4)' : '#C7D2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                        <Ionicons name="sparkles" size={22} color={isDark ? '#E0E7FF' : '#4F46E5'} />
                      </View>
                      <Text style={[textStyles.display, { color: isDark ? '#A5B4FC' : '#4338CA', fontSize: 36, fontWeight: '800', letterSpacing: -1 }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
                      <Text style={[textStyles.smallMedium, { color: isDark ? '#818CF8' : '#6366F1', marginTop: 6, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }]}>Overall CGPA</Text>
                    </LinearGradient>

                    <LinearGradient
                      colors={isDark ? ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)'] : ['#ECFDF5', '#D1FAE5']}
                      style={{ flex: 1, padding: 22, borderRadius: 28, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
                        <Ionicons name="shield-checkmark" size={22} color={isDark ? '#D1FAE5' : '#059669'} />
                      </View>
                      <Text style={[textStyles.display, { color: isDark ? '#6EE7B7' : '#047857', fontSize: 36, fontWeight: '800', letterSpacing: -1 }]}>{avgAttendance}%</Text>
                      <Text style={[textStyles.smallMedium, { color: isDark ? '#34D399' : '#10B981', marginTop: 6, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 11 }]}>Avg Attendance</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* CGPA Trend Chart */}
                <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[textStyles.h3, { color: colors.textPrimary, letterSpacing: -0.3 }]}>Academic Trend</Text>
                  </View>
                  <View style={{ padding: 24, borderRadius: 32, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
                    <LineChart
                      data={cgpaTrendData as any}
                      width={width - spacing.xl * 2 - 48}
                      height={180}
                      spacing={(width - spacing.xl * 2 - 80) / Math.max(4, cgpaTrendData.length)}
                      initialSpacing={20}
                      color={isDark ? "#818CF8" : "#4F46E5"}
                      thickness={4}
                      dataPointsColor={isDark ? "#C7D2FE" : "#4F46E5"}
                      dataPointsRadius={6}
                      yAxisColor="transparent"
                      xAxisColor="transparent"
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      rulesColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                      rulesType="dashed"
                      dashWidth={4}
                      dashGap={4}
                      yAxisLabelTexts={['0.0', '2.0', '4.0', '6.0', '8.0', '10.0']}
                      stepValue={2}
                      maxValue={10}
                      noOfSections={5}
                      areaChart
                      startFillColor={isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(79, 70, 229, 0.2)"}
                      endFillColor="rgba(99, 102, 241, 0.0)"
                      startOpacity={0.9}
                      endOpacity={0.1}
                      curved
                      isAnimated
                    />
                  </View>
                </View>

                {/* Subject-wise Attendance */}
                <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={[textStyles.h3, { color: colors.textPrimary, letterSpacing: -0.3 }]}>Subject Attendance</Text>
                  </View>
                  <View style={{ padding: 24, borderRadius: 32, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
                    <BarChart
                      data={attendanceBarsData}
                      width={width - spacing.xl * 2 - 48}
                      height={180}
                      barWidth={28}
                      barBorderRadius={8}
                      spacing={(width - spacing.xl * 2 - 80) / Math.max(4, attendanceBarsData.length)}
                      initialSpacing={20}
                      noOfSections={4}
                      maxValue={100}
                      yAxisColor="transparent"
                      xAxisColor="transparent"
                      rulesColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                      rulesType="dashed"
                      dashWidth={4}
                      dashGap={4}
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      showReferenceLine1
                      referenceLine1Position={75}
                      referenceLine1Config={{ color: colors.warning, thickness: 2, type: 'dashed', dashWidth: 6, dashGap: 4 }}
                      isAnimated
                      showGradient
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {activeTab === 'marks' && (
              <Animated.View entering={FadeIn} style={{ paddingHorizontal: spacing.xl, gap: 16 }}>
                {subjects.map((sub, index) => {
                  const hasCIE = sub.cieMarks && sub.cieMarks.length > 0;
                  const hasAAT = sub.aatMarks !== undefined;
                  const hasLab = sub.labInternalMarks && sub.labInternalMarks.length > 0;
                  const hasNoMarks = !hasCIE && !hasAAT && !hasLab;

                  return (
                    <Animated.View key={sub.id} entering={FadeInDown.delay(index * 50).duration(300)}>
                      <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: sub.color, marginRight: 8 }} />
                          <Text style={[textStyles.h3, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{sub.name}</Text>
                        </View>
                        
                        {hasNoMarks ? (
                          <Text style={[textStyles.body, { color: colors.textSecondary, fontStyle: 'italic' }]}>No marks recorded yet.</Text>
                        ) : (
                          <View style={{ gap: 12 }}>
                            {hasCIE && (
                              <View>
                                <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 4 }]}>CIEs</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                  {sub.cieMarks?.map((mark, i) => (
                                    <View key={i} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                      <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Test {i + 1}: <Text style={{ color: colors.primary }}>{mark}</Text></Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                            
                            {hasAAT && (
                              <View>
                                <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 4 }]}>AAT</Text>
                                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
                                  <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Score: <Text style={{ color: colors.primary }}>{sub.aatMarks}</Text></Text>
                                </View>
                              </View>
                            )}

                            {hasLab && (
                              <View>
                                <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginBottom: 4 }]}>Lab Internal</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                  {sub.labInternalMarks?.map((mark, i) => (
                                    <View key={i} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                      <Text style={[textStyles.smallMedium, { color: colors.textPrimary }]}>Lab {i + 1}: <Text style={{ color: colors.primary }}>{mark}</Text></Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}

            {activeTab === 'grades' && (
              <Animated.View entering={FadeIn} style={{ paddingHorizontal: spacing.xl, gap: 16 }}>
                {semesters.length === 0 ? (
                   <Card>
                    <EmptyState
                      icon="school-outline"
                      title="No Semesters Added"
                      subtitle="Add a semester to track your grades."
                    />
                  </Card>
                ) : (
                  semesters.map((sem, index) => {
                    const entries = gradeEntries.filter(e => e.semesterId === sem.id);
                    const sgpa = getSGPA(sem.id);
                    
                    return (
                      <Animated.View key={sem.id} entering={FadeInDown.delay(index * 50).duration(300)}>
                        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                          <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                            <Text style={[textStyles.h3, { color: colors.textPrimary }]}>{sem.name}</Text>
                            <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                              <Text style={[textStyles.smallMedium, { color: colors.primary }]}>SGPA: {sgpa.toFixed(2)}</Text>
                            </View>
                          </View>
                          <View style={{ padding: 16, gap: 12 }}>
                            {entries.length === 0 ? (
                              <Text style={[textStyles.body, { color: colors.textSecondary, fontStyle: 'italic' }]}>No grades recorded for this semester.</Text>
                            ) : (
                              entries.map(entry => {
                                const subject = subjects.find(s => s.id === entry.subjectId);
                                return (
                                  <View key={entry.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                      <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{subject ? subject.name : 'Unknown Subject'}</Text>
                                      <Text style={[textStyles.small, { color: colors.textSecondary }]}>{entry.credits} Credits</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                      <Text style={[textStyles.h3, { color: colors.primary }]}>{entry.grade}</Text>
                                    </View>
                                  </View>
                                );
                              })
                            )}
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })
                )}
              </Animated.View>
            )}

            {activeTab === 'attendance' && (
              <Animated.View entering={FadeIn} style={{ paddingHorizontal: spacing.xl, gap: 16 }}>
                {subjectStats.map((stat, index) => {
                  const subject = subjects.find(s => s.id === stat.subjectId);
                  const target = subject?.attendanceTarget ?? useSettingsStore.getState().attendanceTarget;
                  const isSafe = stat.percentage >= target;
                  
                  return (
                    <Animated.View key={stat.subjectId} entering={FadeInDown.delay(index * 50).duration(300)}>
                      <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: stat.subjectColor, marginRight: 8 }} />
                          <Text style={[textStyles.h3, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{stat.subjectName}</Text>
                          <Badge variant={isSafe ? 'success' : 'danger'} label={`${stat.percentage.toFixed(0)}%`} />
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <View>
                            <Text style={[textStyles.small, { color: colors.textSecondary }]}>Attended</Text>
                            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{stat.present} / {stat.totalClasses}</Text>
                          </View>
                          <View>
                            <Text style={[textStyles.small, { color: colors.textSecondary }]}>Absent</Text>
                            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{stat.absent}</Text>
                          </View>
                          <View>
                            <Text style={[textStyles.small, { color: colors.textSecondary }]}>Target</Text>
                            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{target}%</Text>
                          </View>
                        </View>
                        
                        <View style={{ backgroundColor: isSafe ? (isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5') : (isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2'), padding: 10, borderRadius: 12 }}>
                          <Text style={[textStyles.smallMedium, { color: isSafe ? colors.success : colors.danger, textAlign: 'center' }]}>
                            {isSafe 
                              ? `You can safely miss ${stat.canMiss} more classes` 
                              : `You need to attend ${stat.needToAttend} more classes to reach target`}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
