// Campora — Profile Header Card
// Shows avatar, name, enrollment, branch, semester, and stats

import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { getGPALabel } from '@/lib';
import { DEFAULTS } from '@/constants';

const { width } = Dimensions.get('window');

interface ProfileViewCardProps {
  name: string;
  enrollmentNumber: string;
  branch: string;
  semesterStr: string;
  college: string;
  section: string;
  currentSGPA: number;
  cgpa: number;
  completedCredits: number;
  totalRegisteredCredits?: number;
  totalBacklogs?: number;
  avatarUri?: string;
  isPredictedSGPA?: boolean;
  onAvatarPress?: () => void;
  onAvatarLongPress?: () => void;
}

export function ProfileViewCard({
  name, enrollmentNumber, branch, semesterStr, college, section,
  currentSGPA, cgpa, completedCredits, totalRegisteredCredits = 0, totalBacklogs = 0, avatarUri, isPredictedSGPA, onAvatarPress, onAvatarLongPress
}: ProfileViewCardProps) {
  const { colors, spacing, textStyles, radius, isDark } = useTheme();

  return (
    <View style={{ position: 'relative', paddingBottom: spacing.xl }}>
      <View style={{ paddingBottom: 20 }}>
        {/* Dark Beautiful Gradient Background */}
        <Animated.View entering={FadeIn.duration(500)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden' }}>
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E1B4B', '#4C1D95'] : ['#2E1065', '#4C1D95', '#7C3AED']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ position: 'absolute', bottom: -60, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        </Animated.View>

        {/* User Info Row */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
          <TouchableOpacity onPress={onAvatarPress} onLongPress={onAvatarLongPress} style={{ position: 'relative', marginRight: spacing.lg, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark || '#3B82F6']}
              style={{ width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 84, height: 84 }} />
              ) : (
                <Ionicons name="person" size={40} color="#FFF" />
              )}
            </LinearGradient>
            {!avatarUri && (
              <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: colors.surface, borderRadius: 20, padding: 6, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, borderWidth: 2, borderColor: colors.bg }}>
                <Ionicons name="camera" size={14} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[textStyles.h2, { color: '#FFFFFF', marginBottom: 2, fontSize: 24, letterSpacing: -0.5 }]}>{name}</Text>
            <Text style={[textStyles.bodyMedium, { color: 'rgba(255,255,255,0.85)', marginBottom: 8 }]}>{enrollmentNumber}</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Ionicons name="school-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={[textStyles.small, { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }]}>{branch}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Ionicons name="calendar-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={[textStyles.small, { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }]}>{semesterStr}</Text>
              </View>
              {college ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Ionicons name="business-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[textStyles.small, { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }]}>{college}</Text>
                </View>
              ) : null}
              {section && section !== 'Enter Section' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Ionicons name="people-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[textStyles.small, { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }]}>Sec {section}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <Card variant="flat" padding={20} style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: 24, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF', shadowColor: isDark ? '#000' : colors.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 24, elevation: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' }}>
              
              {/* Current SGPA */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name={isPredictedSGPA ? "sparkles" : "trending-up"} size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[textStyles.smallMedium, { color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }]}>
                    {isPredictedSGPA ? 'Expected\nSGPA' : 'SGPA'}
                  </Text>
                </View>
                <Text style={[textStyles.display, { color: colors.primary, fontSize: 32, lineHeight: 36 }]}>{(currentSGPA > 0 || isPredictedSGPA) ? currentSGPA.toFixed(2) : '--'}</Text>
                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, alignItems: 'center', width: '90%', flexShrink: 1 }}>
                  <Text style={[textStyles.small, { color: colors.textPrimary, fontSize: 10, fontWeight: '600', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>{currentSGPA > 0 || isPredictedSGPA ? getGPALabel(currentSGPA) : 'No grades'}</Text>
                </View>
              </View>

              <View style={{ width: 1, backgroundColor: colors.borderLight, marginVertical: 16 }} />

              {/* CGPA */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="school" size={14} color="#3B82F6" style={{ marginRight: 4 }} />
                  <Text style={[textStyles.smallMedium, { color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }]}>
                    {isPredictedSGPA ? 'Current\nCGPA' : 'CGPA'}
                  </Text>
                </View>
                <Text style={[textStyles.display, { color: '#0284C7', fontSize: 32, lineHeight: 36 }]}>{cgpa > 0 ? cgpa.toFixed(2) : '--'}</Text>
                <View style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, alignItems: 'center', width: '90%', flexShrink: 1 }}>
                  <Text style={[textStyles.small, { color: '#3B82F6', fontSize: 10, fontWeight: '600', textAlign: 'center' }]} numberOfLines={1} adjustsFontSizeToFit>{cgpa > 0 ? getGPALabel(cgpa) : 'No grades'}</Text>
                </View>
              </View>

              <View style={{ width: 1, backgroundColor: colors.borderLight, marginVertical: 16 }} />

              {/* Credits */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="ribbon" size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[textStyles.smallMedium, { color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }]}>
                    {isPredictedSGPA ? 'Credits\nCompleted' : 'Credits'}
                  </Text>
                </View>
                <Text style={[textStyles.display, { fontSize: 32, lineHeight: 36 }]}>
                  <Text style={{ color: '#10B981' }}>{completedCredits}</Text>
                  {totalRegisteredCredits > 0 && (
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.3)' : colors.textTertiary, fontSize: 22 }}> / {totalRegisteredCredits}</Text>
                  )}
                </Text>
                {totalBacklogs > 0 ? (
                  <View style={{ backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, flexDirection: 'row', alignItems: 'center', width: '90%', justifyContent: 'center' }}>
                    <Ionicons name="warning" size={10} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={[textStyles.small, { color: '#DC2626', fontSize: 10, fontWeight: '600' }]} numberOfLines={1} adjustsFontSizeToFit>{totalBacklogs} {totalBacklogs === 1 ? 'Backlog' : 'Backlogs'}</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, flexDirection: 'row', alignItems: 'center', width: '90%', justifyContent: 'center' }}>
                    <Ionicons name="checkmark-circle" size={10} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={[textStyles.small, { color: '#10B981', fontSize: 10, fontWeight: '600' }]} numberOfLines={1} adjustsFontSizeToFit>On Track</Text>
                  </View>
                )}
              </View>

            </View>
          </Card>
        </Animated.View>
      </View>
    </View>
  );
}
