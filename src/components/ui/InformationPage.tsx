import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, cancelAnimation, Easing, ReduceMotion, FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, Pressable, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from '@/platform/router';
import { useTheme } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface InformationSection { title: string; paragraphs: string[]; icon?: IconName }
export interface InformationHighlight { icon: IconName; title: string; text: string; color: string }
export interface InformationChip { label: string; icon?: IconName; color: string }
export interface InformationAction { title: string; subtitle?: string; icon: IconName; color: string; url?: string; route?: string }

function FloatingLogo() {
  const offset = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    offset.value = withRepeat(withSequence(withTiming(-7, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System })), -1, false, undefined, ReduceMotion.System);
    return () => { cancelAnimation(offset); offset.value = 0; };
  }, [offset]));
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return <Animated.View style={[{ alignSelf: 'center', paddingTop: 6 }, animated]}><Image source={require('@/assets/images/logo-transparent.png')} style={{ width: 104, height: 104 }} contentFit="contain" accessibilityLabel="CampusIQ logo" /></Animated.View>;
}

function SectionCard({ section, index, open, onToggle }: { section: InformationSection; index: number; open: boolean; onToggle: () => void }) {
  const { colors, textStyles } = useTheme();
  return <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: open ? colors.primary + '55' : colors.borderLight, overflow: 'hidden' }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={section.title} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        {section.icon ? <Ionicons name={section.icon} size={18} color={colors.primary} /> : <Text style={[textStyles.smallMedium, { color: colors.primary }]}>{index + 1}</Text>}
      </View>
      <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary, flex: 1 }]}>{section.title}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} />
    </Pressable>
    {open && <View style={{ paddingHorizontal: 16, paddingBottom: 18, gap: 12 }}>
      {section.paragraphs.map((paragraph, i) => <Text selectable key={i} style={[textStyles.body, { color: colors.textSecondary, lineHeight: 24 }]}>{paragraph}</Text>)}
    </View>}
  </View>;
}

export function InformationPage({ title, subtitle, introduction, sections, logo = false, links = [], chips = [], highlights = [], highlightsTitle = 'At a glance', actions = [], footer, heading }: {
  title: string; subtitle: string; introduction: string; sections: InformationSection[]; logo?: boolean; links?: { title: string; url: string }[];
  chips?: InformationChip[]; highlights?: InformationHighlight[]; highlightsTitle?: string; actions?: InformationAction[]; footer?: string; heading?: string;
}) {
  const { colors, textStyles } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const allOpen = open.size === sections.length;
  const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  const toggle = (i: number) => { animate(); setOpen(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; }); };
  const toggleAll = () => { animate(); setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i))); };
  const runAction = (a: InformationAction) => { if (a.route) router.push(a.route as never); else if (a.url) Linking.openURL(a.url); };

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.divider, gap: 6 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={8} style={{ padding: 8 }}><Ionicons name="close" size={24} color={colors.textPrimary} /></Pressable>
      <Text numberOfLines={1} style={[textStyles.h3, { color: colors.textPrimary, flex: 1 }]}>{title}</Text>
    </View>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56, width: '100%', maxWidth: 760, alignSelf: 'center', gap: 18 }}>
      <Animated.View entering={FadeInDown.duration(380).reduceMotion(ReduceMotion.System)} style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.borderLight, gap: 12, alignItems: logo ? 'center' : 'flex-start' }}>
        {logo && <FloatingLogo />}
        <Text style={[textStyles.h2, { color: colors.textPrimary, textAlign: logo ? 'center' : 'left' }]}>{heading ?? title}</Text>
        <Text style={[textStyles.small, { color: colors.primary, textAlign: logo ? 'center' : 'left' }]}>{subtitle}</Text>
        {chips.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: logo ? 'center' : 'flex-start' }}>
          {chips.map(chip => <View key={chip.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: chip.color + '1F' }}>
            {chip.icon && <Ionicons name={chip.icon} size={14} color={chip.color} />}
            <Text style={[textStyles.smallMedium, { color: chip.color }]}>{chip.label}</Text>
          </View>)}
        </View>}
        <Text selectable style={[textStyles.body, { color: colors.textSecondary, lineHeight: 24, textAlign: logo ? 'center' : 'left' }]}>{introduction}</Text>
      </Animated.View>

      {highlights.length > 0 && <View style={{ gap: 10 }}>
        <Text style={[textStyles.smallMedium, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }]}>{highlightsTitle}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {highlights.map((h, i) => <Animated.View key={h.title} entering={FadeInDown.delay(80 + i * 60).duration(360).reduceMotion(ReduceMotion.System)} style={{ flexGrow: 1, flexBasis: '46%', minWidth: 150, backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.borderLight, gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: h.color + '1F', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={h.icon} size={18} color={h.color} /></View>
            <Text style={[textStyles.bodySemiBold, { color: colors.textPrimary }]}>{h.title}</Text>
            <Text style={[textStyles.small, { color: colors.textSecondary, lineHeight: 19 }]}>{h.text}</Text>
          </Animated.View>)}
        </View>
      </View>}

      {sections.length > 0 && <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[textStyles.smallMedium, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, flex: 1 }]}>Details</Text>
          <Pressable accessibilityRole="button" onPress={toggleAll} hitSlop={8}><Text style={[textStyles.smallMedium, { color: colors.primary }]}>{allOpen ? 'Collapse all' : 'Expand all'}</Text></Pressable>
        </View>
        {sections.map((section, index) => <SectionCard key={section.title} section={section} index={index} open={open.has(index)} onToggle={() => toggle(index)} />)}
      </View>}

      {(actions.length > 0 || links.length > 0) && <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' }}>
        {actions.map((a, i) => <Pressable key={a.title} accessibilityRole={a.url ? 'link' : 'button'} onPress={() => runAction(a)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: pressed ? colors.surfaceHover : 'transparent', borderTopWidth: i === 0 ? 0 : 1, borderColor: colors.divider })}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: a.color + '1F', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={a.icon} size={18} color={a.color} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.bodyMedium, { color: colors.textPrimary }]}>{a.title}</Text>
            {a.subtitle && <Text style={[textStyles.small, { color: colors.textSecondary }]}>{a.subtitle}</Text>}
          </View>
          <Ionicons name={a.url ? 'open-outline' : 'chevron-forward'} size={18} color={colors.textTertiary} />
        </Pressable>)}
        {links.map((link, i) => <Pressable key={link.url} accessibilityRole="link" onPress={() => Linking.openURL(link.url)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: pressed ? colors.surfaceHover : 'transparent', borderTopWidth: actions.length === 0 && i === 0 ? 0 : 1, borderColor: colors.divider })}>
          <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="document-text-outline" size={18} color={colors.primary} /></View>
          <Text style={[textStyles.bodyMedium, { color: colors.textPrimary, flex: 1 }]}>{link.title}</Text>
          <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
        </Pressable>)}
      </View>}

      {footer && <Text style={[textStyles.small, { color: colors.textTertiary, textAlign: 'center', lineHeight: 19 }]}>{footer}</Text>}
    </ScrollView>
  </SafeAreaView>;
}
