import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
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
    const data = semesters
      .map(sem => {
        const sgpa = getSGPA(sem.id);
        if (sgpa === 0) return null;
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
  }, [semesters, getSGPA]);

  // Subject Attendance Bars
  const attendanceBarsData = useMemo(() => {
    if (subjectStats.length === 0) return [{ value: 0, label: 'None' }];
    return subjectStats.map(stat => ({
      value: stat.percentage,
      label: stat.subjectName.substring(0, 3).toUpperCase(),
      frontColor: stat.percentage >= 75 ? colors.success : colors.danger,
    }));
  }, [subjectStats, colors]);

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

  return (
    <LinearGradient 
      colors={isDark ? ['#0F1016', '#1A162D', '#0F1016'] : ['#F8FAFC', '#EEF2FF', '#E0E7FF']} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View>
          <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Analytics</Text>
          <Text style={[textStyles.small, { color: colors.textSecondary }]}>Performance & Insights</Text>
        </View>
      </View>

      <View style={{ paddingBottom: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12 }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable 
                key={tab.id} 
                onPress={() => setActiveTab(tab.id)} 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF'),
                  borderColor: isActive ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                }}
              >
                <Ionicons name={tab.icon} size={16} color={isActive ? '#FFF' : colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[textStyles.bodyMedium, { color: isActive ? '#FFF' : colors.textSecondary, fontSize: 13 }]}>{tab.label}</Text>
              </Pressable>
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
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#E0E7FF' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="sparkles" size={20} color="#6366F1" />
                      </View>
                      <Text style={[textStyles.display, { color: '#6366F1', fontSize: 32 }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
                      <Text style={[textStyles.smallMedium, { color: isDark ? '#A5B4FC' : '#4F46E5', marginTop: 4 }]}>Overall CGPA</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                      </View>
                      <Text style={[textStyles.display, { color: '#10B981', fontSize: 32 }]}>{avgAttendance}%</Text>
                      <Text style={[textStyles.smallMedium, { color: isDark ? '#6EE7B7' : '#059669', marginTop: 4 }]}>Avg Attendance</Text>
                    </View>
                  </View>
                </View>

                {/* CGPA Trend Chart */}
                <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Academic Trend</Text>
                  </View>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <LineChart
                      data={cgpaTrendData as any}
                      width={width - spacing.xl * 2 - 40}
                      height={160}
                      spacing={(width - spacing.xl * 2 - 80) / Math.max(4, cgpaTrendData.length)}
                      initialSpacing={20}
                      color="#8B5CF6"
                      thickness={3}
                      dataPointsColor="#8B5CF6"
                      dataPointsRadius={5}
                      yAxisColor="transparent"
                      xAxisColor="transparent"
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      rulesColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                      rulesType="solid"
                      yAxisLabelTexts={['0.0', '2.0', '4.0', '6.0', '8.0', '10.0']}
                      stepValue={2}
                      maxValue={10}
                      noOfSections={5}
                      areaChart
                      startFillColor="rgba(139, 92, 246, 0.2)"
                      endFillColor="rgba(139, 92, 246, 0.0)"
                      startOpacity={0.8}
                      endOpacity={0.1}
                      curved
                    />
                  </View>
                </View>

                {/* Subject-wise Attendance */}
                <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Subject Attendance</Text>
                  </View>
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <BarChart
                      data={attendanceBarsData}
                      width={width - spacing.xl * 2 - 40}
                      height={160}
                      barWidth={24}
                      barBorderRadius={6}
                      spacing={(width - spacing.xl * 2 - 80) / Math.max(4, attendanceBarsData.length)}
                      initialSpacing={20}
                      noOfSections={4}
                      maxValue={100}
                      yAxisColor="transparent"
                      xAxisColor="transparent"
                      rulesColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                      rulesType="solid"
                      yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                      showReferenceLine1
                      referenceLine1Position={75}
                      referenceLine1Config={{ color: colors.warning, thickness: 1.5, type: 'dashed' }}
                      isAnimated
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
