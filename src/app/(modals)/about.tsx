import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function AboutScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Ionicons 
          name="close" 
          size={24} 
          color={colors.textPrimary} 
          onPress={() => router.back()} 
          style={{ marginRight: spacing.md }} 
        />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>About CampusIQ</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center' }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{
            width: 120, 
            height: 120, 
            borderRadius: 30, 
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        
        <Text style={[textStyles.h2, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
          Campus<Text style={{ color: colors.primary }}>IQ</Text>
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing['2xl'] }]}>
          Version 1.0.0
        </Text>

        <Text style={[textStyles.body, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing['3xl'], lineHeight: 24 }]}>
          CampusIQ is your all-in-one smart college companion, designed to keep you organized and focused on your studies.
        </Text>

        <View style={{ alignItems: 'center', marginTop: spacing['2xl'], padding: spacing.xl, backgroundColor: colors.surfaceElevated, borderRadius: 16, width: '100%', borderWidth: 1, borderColor: colors.border }}>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            Crafted with ❤️ by Priyanshu Sharan
          </Text>
          <Pressable onPress={() => Linking.openURL('https://github.com/priyanshusharan-cmd/campusiq')} style={{ marginTop: spacing.md }}>
            <Text style={[textStyles.h3, { color: colors.textSecondary }]}>
              {'</> '}<Text style={{ color: colors.primary }}>GitHub</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
