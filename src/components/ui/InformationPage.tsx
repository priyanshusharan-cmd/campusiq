import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, cancelAnimation, Easing, ReduceMotion } from 'react-native-reanimated';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from '@/platform/router';
import { useTheme } from '@/theme';

function FloatingLogo() {
  const offset = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    offset.value = withRepeat(withSequence(withTiming(-7, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System })), -1, false, undefined, ReduceMotion.System);
    return () => { cancelAnimation(offset); offset.value = 0; };
  }, [offset]));
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return <Animated.View style={[{ alignSelf: 'center', paddingVertical: 14 }, animated]}><Image source={require('@/assets/images/logo-transparent.png')} style={{ width: 110, height: 110 }} contentFit="contain" accessibilityLabel="CampusIQ logo" /></Animated.View>;
}

export interface InformationSection { title: string; paragraphs: string[] }
export function InformationPage({ title, subtitle, introduction, sections, logo = false, links = [] }: { title: string; subtitle: string; introduction: string; sections: InformationSection[]; logo?: boolean; links?: { title: string; url: string }[] }) {
  const { colors, textStyles } = useTheme();
  const router = useRouter();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: colors.divider, gap: 10 }}><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ padding: 8 }}><Ionicons name="close" size={24} color={colors.textPrimary} /></Pressable><Text style={[textStyles.h3, { color: colors.textPrimary, flex: 1 }]}>{title}</Text></View>
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48, width: '100%', maxWidth: 760, alignSelf: 'center', gap: 20 }}>
      {logo && <FloatingLogo />}
      <View><Text style={[textStyles.h2, { color: colors.textPrimary }]}>{title}</Text><Text style={[textStyles.small, { color: colors.primary, marginTop: 8 }]}>{subtitle}</Text></View>
      <Text selectable style={[textStyles.body, { color: colors.textSecondary, lineHeight: 25 }]}>{introduction}</Text>
      {sections.map((section, index) => <View key={section.title} style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderLight, gap: 12 }}><Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]}>{index + 1}. {section.title}</Text>{section.paragraphs.map((paragraph, i) => <Text selectable key={i} style={[textStyles.body, { color: colors.textSecondary, lineHeight: 25 }]}>{paragraph}</Text>)}</View>)}
      {links.map(link => <Pressable key={link.url} accessibilityRole="link" onPress={() => Linking.openURL(link.url)} style={{ paddingVertical: 12, flexDirection: 'row', gap: 10 }}><Ionicons name="open-outline" size={18} color={colors.primary} /><Text style={[textStyles.bodyMedium, { color: colors.primary, flex: 1 }]}>{link.title}</Text></Pressable>)}
    </ScrollView>
  </SafeAreaView>;
}
