// Campora — Create New Page (Full Screen Modal)

import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/theme';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_GAP = 12;
const CARD_WIDTH = (width - CARD_MARGIN * 2 - CARD_GAP * 2) / 3;

interface GridItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  description: string;
  href?: Href;
}

function GridCard({ icon, color, title, description, href }: GridItemProps) {
  const { colors, textStyles } = useTheme();
  const router = useRouter();
  
  return (
    <Pressable 
      onPress={() => href && router.push(href)}
      style={({ pressed }) => [
      styles.card,
      { 
        backgroundColor: colors.surface, 
        borderColor: colors.borderLight,
        opacity: pressed ? 0.8 : 1,
      }
    ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textQuaternary} />
      </View>
      
      <Text style={[textStyles.smallMedium, { color: color, marginTop: 12 }]} numberOfLines={1}>
        {title}
      </Text>
      
      <Text style={[textStyles.small, { color: colors.textSecondary, marginTop: 4, fontSize: 10, lineHeight: 14 }]} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  const { colors, textStyles } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, marginBottom: 12 }]}>{title}</Text>
      <View style={styles.grid}>
        {children}
      </View>
    </View>
  );
}

export default function CreateScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSecondary }} edges={['top']}>
      
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        
        <View style={styles.headerContent}>
          <View>
            <Text style={[textStyles.display, { color: colors.textPrimary, fontSize: 28 }]}>Create New</Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
              What would you like to add today?
            </Text>
          </View>
          
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: CARD_MARGIN, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <Section title="Academics">
            <GridCard icon="flag-outline" color="#10B981" title="Subject" description="Add a subject and track its details" href="/(modals)/create-subject" />
            <GridCard icon="calendar-outline" color="#7C5CFC" title="Class" description="Add a new class to your timetable" href="/(modals)/create-class" />
            <GridCard icon="flask-outline" color="#F43F5E" title="Lab Session" description="Add a lab or practical session" href="/(modals)/create-lab" />
          </Section>

          <Section title="Tracking & Progress">
            <GridCard icon="stats-chart-outline" color="#7C5CFC" title="SGPA Entry" description="Add your semester SGPA" href="/(modals)/sgpa-entry" />
            <GridCard icon="ribbon-outline" color="#0EA5E9" title="Goal" description="Set a CGPA or SGPA target" href="/(modals)/goal" />
          </Section>

          <Section title="Tasks & Tests">
            <GridCard icon="document-text-outline" color="#F59E0B" title="Assignment" description="Add a new assignment" href="/(modals)/create-assignment" />
            <GridCard icon="create-outline" color="#8B5CF6" title="Exam" description="Add an exam or quiz" href="/(modals)/create-exam" />
          </Section>

        </Animated.View>


      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAddPill({ icon, color, label }: { icon: keyof typeof Ionicons.glyphMap, color: string, label: string }) {
  const { colors, textStyles } = useTheme();
  return (
    <Pressable style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[textStyles.smallMedium, { color: colors.textSecondary, marginLeft: 6 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 12,
    paddingBottom: 20,
  },
  closeBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  section: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBanner: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  promoImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoText: {
    flex: 1,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  }
});
