import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function PrivacyPolicyScreen() {
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
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          CampusIQ Privacy Policy
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          Last Updated: July 2026
        </Text>

        <Text style={[textStyles.h4, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          1. Data Security & Local Storage
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          At CampusIQ, your privacy and data security are our highest priority. We believe that your academic data belongs to you. Therefore, CampusIQ operates strictly as an offline-first application. All your data—including attendance records, timetables, grades, and profile information—is stored locally on your device. We do not transmit, sync, or store your personal data on any external servers.
        </Text>

        <Text style={[textStyles.h4, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          2. No Data Collection
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          We do not collect, harvest, or track any personally identifiable information (PII) or app usage statistics. Since the app functions entirely on your device, there are no databases or cloud services monitoring your activities within the app.
        </Text>

        <Text style={[textStyles.h4, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          3. Device Permissions
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          CampusIQ may request certain device permissions (such as notifications for class reminders) solely to enhance your user experience. These permissions are used exclusively on your device and are not used to collect data for third-party services.
        </Text>

        <Text style={[textStyles.h4, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          4. Changes to This Policy
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          If we make changes to this privacy policy in the future (for example, if optional cloud sync features are introduced), we will update this document and ask for your explicit consent before any data leaves your device. Until then, your data remains 100% on your device.
        </Text>

        <Text style={[textStyles.h4, { color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          5. On-Device Processing
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          All computations—including your SGPA/CGPA calculations, attendance predictions, and performance bounds—are processed entirely locally on your own device. We do not use any remote servers or cloud services to calculate or process your academic data, guaranteeing that your information is private, secure, and always accessible offline.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
