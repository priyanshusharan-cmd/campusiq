// Campora — GPA Tab Route

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { ForecasterScreen } from '@/features/academics/screens/ForecasterScreen';
import AcademicsScreen from '@/features/academics/AcademicsScreen';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { useProfileStore } from '@/stores/useProfileStore';
import { useLocalSearchParams } from 'expo-router';

export default function GPARoute() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'goals' | 'tracker'>(params.tab === 'tracker' ? 'tracker' : 'goals');
  
  useEffect(() => {
    if (params.tab === 'tracker' || params.tab === 'goals') {
      setActiveTab(params.tab as 'goals' | 'tracker');
    }
  }, [params.tab]);

  const { colors, isDark, textStyles } = useTheme();
  const profile = useProfileStore(s => s.profile);
  const firstName = profile?.name?.split(' ')[0] || 'Student';

  return (
    <LinearGradient 
      colors={isDark ? ['#0F1016', '#1A162D', '#0F1016'] : ['#F8FAFC', '#EEF2FF', '#E0E7FF']} 
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <TopNavBar firstName={firstName} avatarUri={profile?.avatarUri} />
        
        <View style={{ alignItems: 'center', marginBottom: 12, marginTop: 12 }}>
          <View style={[styles.segmentContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
            <Pressable 
              style={[styles.segmentButton, activeTab === 'goals' && styles.segmentActive, activeTab === 'goals' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}
              onPress={() => setActiveTab('goals')}
            >
              <Ionicons name="flag-outline" size={16} color={activeTab === 'goals' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.segmentText, { color: activeTab === 'goals' ? (isDark ? '#FFF' : colors.textPrimary) : colors.textSecondary, fontWeight: activeTab === 'goals' ? '600' : '500' }]}>
                Goals
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.segmentButton, activeTab === 'tracker' && styles.segmentActive, activeTab === 'tracker' && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}
              onPress={() => setActiveTab('tracker')}
            >
              <Ionicons name="trending-up" size={16} color={activeTab === 'tracker' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.segmentText, { color: activeTab === 'tracker' ? (isDark ? '#FFF' : colors.textPrimary) : colors.textSecondary, fontWeight: activeTab === 'tracker' ? '600' : '500' }]}>
                Tracker
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {activeTab === 'goals' ? <ForecasterScreen /> : <AcademicsScreen />}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
