import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useSettingsStore } from '@/stores';
import { loadDemoData } from '@/platform/demoData.web';

export default function WebWelcome() {
  const router = useRouter();
  const onboarded = useSettingsStore(s => s.onboardingCompleted);
  const [loading, setLoading] = useState(false);
  if (onboarded && !loading) return <Redirect href="/(tabs)" />;
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Head><title>CampusIQ — Try the campus companion</title><meta name="description" content="Try CampusIQ in your browser. Explore attendance tracking, timetables, grade predictions, and a local demo assistant. No download or signup needed." /></Head>
    <View style={styles.card}>
      <Image source={require('../../assets/images/logo-transparent.png')} style={{ width: 76, height: 76, marginBottom: 24 }} />
      <Text style={styles.eyebrow}>CAMPUSIQ · INTERACTIVE DEMO</Text>
      <Text style={styles.title}>Your semester,{ '\n' }a little simpler.</Text>
      <Text style={styles.description}>Stay on top of classes, attendance, deadlines, and grades. Try the campus companion right here in your browser.</Text>
      <View style={styles.features}>
        {['Attendance insights', 'Smart timetable', 'SGPA forecaster', 'Assignments & exams'].map(label => <Text key={label} style={styles.chip}>{label}</Text>)}
      </View>
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => {
        setLoading(true);
        loadDemoData();
        router.replace('/(tabs)');
      }} style={({ pressed }) => [styles.primary, { opacity: pressed || loading ? 0.8 : 1 }]}>
        <Text style={styles.primaryText}>{loading ? 'Opening your demo…' : 'Try with sample data →'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(onboarding)/welcome')} style={styles.secondary}>
        <Text style={styles.secondaryText}>Start with my own details</Text>
      </Pressable>
      <Text style={styles.note}>No download. No signup. Your changes stay in this browser; clearing browser data removes them.</Text>
      <Text style={styles.disclosure}>The demo assistant uses local calculations. Phone reminders, biometric locks, and app-store purchases are available in the mobile app.</Text>
    </View>
    <Text style={styles.footer}>Built for student life. Made to be tried.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f2fc' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 36 },
  card: { width: '100%', maxWidth: 580, backgroundColor: '#fff', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: '#e6e0f4' },
  eyebrow: { color: '#7051cf', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  title: { fontSize: 42, lineHeight: 49, fontWeight: '800', letterSpacing: -1.8, color: '#221a39', marginBottom: 20 },
  description: { fontSize: 17, lineHeight: 27, color: '#676079', marginBottom: 24 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  chip: { backgroundColor: '#f3f0fc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: '#64508c', fontSize: 12, fontWeight: '600' },
  primary: { backgroundColor: '#7552df', borderRadius: 15, paddingVertical: 18, alignItems: 'center', paddingHorizontal: 12 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { alignItems: 'center', paddingVertical: 18 },
  secondaryText: { color: '#7051cf', fontSize: 14, fontWeight: '600' },
  note: { color: '#767083', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  disclosure: { color: '#767083', fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 18 },
  footer: { color: '#8d839e', marginTop: 24, fontSize: 12 },
});
