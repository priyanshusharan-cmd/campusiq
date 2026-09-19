// Campora — Weekly Classes Component
// Overview tab showing swipeable class list grouped by day

import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { styles } from '../styles/attendanceDetailStyles';

interface WeeklyClassesProps {
  subjectId: string;
  subjectColor?: string;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeeklyClasses({ subjectId, subjectColor }: WeeklyClassesProps) {
  const { colors, spacing, textStyles, isDark } = useTheme();
  const router = useRouter();
  const timetableEntries = useTimetableStore(s => s.entries);
  const removeEntry = useTimetableStore(s => s.removeEntry);

  const overviewClasses = timetableEntries
    .filter(e => e.subjectId === subjectId)
    .sort((a, b) => {
      return a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime);
    });

  return (
    <View>
      <Text style={[textStyles.h3, { marginBottom: spacing.md, color: colors.textPrimary }]}>Weekly Classes</Text>
      
      {overviewClasses.length > 0 ? (
        <Card variant="elevated" padding={0}>
          {overviewClasses.map((cls, index) => {
            const isLast = index === overviewClasses.length - 1;
            const dayCapitalized = DAY_NAMES[cls.dayOfWeek] || 'Unknown';
            
            return (
              <React.Fragment key={cls.id}>
                <Swipeable
                  renderRightActions={() => (
                    <View style={{ flexDirection: 'row' }}>
                      <Pressable
                        style={{
                          backgroundColor: '#F59E0B',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: 74,
                        }}
                        onPress={() => router.push(`/(modals)/create-class?editId=${cls.id}` as any)}
                      >
                        <Ionicons name="pencil" size={22} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={{
                          backgroundColor: '#EF4444',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: 74,
                        }}
                        onPress={() => {
                          Alert.alert(
                            'Delete Class',
                            'Are you sure you want to remove this class from your timetable?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => removeEntry(cls.id) 
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash" size={22} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                >
                  <View style={[styles.historyItem, { backgroundColor: colors.surface }]}>
                    <View style={[styles.historyIcon, { backgroundColor: (subjectColor || colors.primary) + '20' }]}>
                      <Ionicons name="time-outline" size={16} color={subjectColor || colors.primary} />
                    </View>
                    <View style={[styles.historyContent, { borderLeftColor: subjectColor || colors.primary, borderLeftWidth: 2 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: 2 }}>{dayCapitalized}</Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          {cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                          <Text style={{ color: isDark ? '#FFFFFF' : colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
                            {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Swipeable>
                {!isLast && <View style={styles.historyDivider} />}
              </React.Fragment>
            );
          })}
        </Card>
      ) : (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No classes scheduled for this subject.</Text>
        </View>
      )}
    </View>
  );
}
