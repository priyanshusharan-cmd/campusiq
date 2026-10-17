import { getGoogleApiKey, setGoogleApiKey } from '@/platform/googleApiKey';
import { Alert } from '@/platform/alert';
// Campora — Settings Screen

import React from 'react';
import { View, Text, Switch, Platform, ActionSheetIOS, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from '@/platform/router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card, SectionHeader, ListRow } from '@/components/ui';
import { useSettingsStore, useAcademicStore, useAttendanceStore, useAssignmentStore, useExamStore, useSubjectStore, useTimetableStore, useProfileStore } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerHaptic } from '@/utils/haptics';
import { requestNotificationPermissions, scheduleClassReminders, cancelAllReminders } from '@/utils/notifications';
import * as FileSystem from '@/platform/fileSystem';
import * as Sharing from '@/platform/sharing';
import * as LocalAuthentication from '@/platform/localAuthentication';

export default function SettingsScreen() {
  const { colors, spacing, textStyles } = useTheme();
  const router = useRouter();
  const settings = useSettingsStore();
  const [hasGoogleKey, setHasGoogleKey] = React.useState(false);
  const [savingConnection, setSavingConnection] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    getGoogleApiKey().then(key => { if (mounted) setHasGoogleKey(Boolean(key)); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? All data and profile information will be permanently erased.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          useAcademicStore.getState().clearAll(); 
          useAttendanceStore.getState().clearRecords(); 
          useTimetableStore.getState().clearEntries(); 
          useAssignmentStore.getState().clearAssignments(); 
          useExamStore.getState().clearExams(); 
          useSubjectStore.getState().clearSubjects();
          useProfileStore.getState().clearProfile();
          useSettingsStore.getState().resetSettings();

          await setGoogleApiKey('');
          await AsyncStorage.clear();

          router.replace('/(onboarding)/welcome');
        }
      }
    ]);
  };

  const showThemePicker = () => {
    triggerHaptic('light');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'System Default', 'Light Mode', 'Dark Mode'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) settings.setTheme('system');
          if (buttonIndex === 2) settings.setTheme('light');
          if (buttonIndex === 3) settings.setTheme('dark');
        }
      );
    } else {
      Alert.alert('Appearance', 'Choose your preferred theme', [
        { text: 'System Default', onPress: () => settings.setTheme('system') },
        { text: 'Light Mode', onPress: () => settings.setTheme('light') },
        { text: 'Dark Mode', onPress: () => settings.setTheme('dark') },
      ]);
    }
  };

  const getThemeText = () => {
    if (settings.theme === 'system') return 'System Default';
    if (settings.theme === 'light') return 'Light Mode';
    return 'Dark Mode';
  };

  const handleToggleHapticFeedback = () => {
    if (Platform.OS === 'web') { Alert.alert('Mobile app feature', "Haptic feedback is available in the mobile app. Browser support varies by device."); return; }
    triggerHaptic('light'); // Play immediately so user feels it
    settings.toggleHapticFeedback();
  };

  const handleToggleClassReminders = async () => {
    if (Platform.OS === 'web') { Alert.alert('Mobile app feature', "Scheduled class reminders need the Android or iOS app. Your timetable is available here in the browser."); return; }
    triggerHaptic('light');
    settings.toggleClassReminders();

    // The new value will be the opposite of the current settings.classReminders
    const willBeEnabled = !settings.classReminders;
    if (willBeEnabled) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleClassReminders();
      } else {
        // If permission denied, toggle it back off
        Alert.alert('Permission Denied', 'Please enable notifications in your phone settings to use Class Reminders.');
        settings.toggleClassReminders(); // Revert
      }
    } else {
      await cancelAllReminders();
    }
  };

  const showReminderPicker = () => {
    triggerHaptic('light');
    const options = ['Cancel', '5 minutes', '10 minutes', '15 minutes', '30 minutes'];
    const values = [0, 5, 10, 15, 30];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 0 }, async (buttonIndex) => {
        if (buttonIndex > 0) {
          settings.setReminderMinutes(values[buttonIndex]);
          if (settings.classReminders) {
            await scheduleClassReminders(); // Reschedule with new timing
          }
        }
      });
    } else {
      Alert.alert('Reminder Timing', 'When should we remind you before class?', [
        { text: '5 minutes', onPress: async () => { settings.setReminderMinutes(5); if (settings.classReminders) await scheduleClassReminders(); } },
        { text: '10 minutes', onPress: async () => { settings.setReminderMinutes(10); if (settings.classReminders) await scheduleClassReminders(); } },
        { text: '15 minutes', onPress: async () => { settings.setReminderMinutes(15); if (settings.classReminders) await scheduleClassReminders(); } },
        { text: '30 minutes', onPress: async () => { settings.setReminderMinutes(30); if (settings.classReminders) await scheduleClassReminders(); } },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const showColorPicker = () => {
    triggerHaptic('light');
    const options = ['Cancel', 'Violet (Default)', 'Sky Blue', 'Emerald Green', 'Rose Pink', 'Amber Orange'];
    const values = ['', '#7C5CFC', '#0EA5E9', '#10B981', '#F43F5E', '#F59E0B'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 0 }, (buttonIndex) => {
        if (buttonIndex > 0) settings.setAccentColor(values[buttonIndex]);
      });
    } else {
      Alert.alert('Accent Color', 'Choose your app theme color', [
        { text: 'Violet', onPress: () => settings.setAccentColor('#7C5CFC') },
        { text: 'Sky Blue', onPress: () => settings.setAccentColor('#0EA5E9') },
        { text: 'Emerald Green', onPress: () => settings.setAccentColor('#10B981') },
        { text: 'Rose Pink', onPress: () => settings.setAccentColor('#F43F5E') },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const showStartOfWeekPicker = () => {
    triggerHaptic('light');
    const options = ['Cancel', 'Monday', 'Sunday'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 0 }, (buttonIndex) => {
        if (buttonIndex === 1) settings.setWeekStartsOn(0);
        if (buttonIndex === 2) settings.setWeekStartsOn(1);
      });
    } else {
      Alert.alert('Start of Week', 'Which day starts your week?', [
        { text: 'Monday', onPress: () => settings.setWeekStartsOn(0) },
        { text: 'Sunday', onPress: () => settings.setWeekStartsOn(1) },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const handleToggleWeeklyDigest = async () => {
    if (Platform.OS === 'web') { Alert.alert('Mobile app feature', "Scheduled weekly notifications need the Android or iOS app. You can review your analytics here anytime."); return; }
    triggerHaptic('light');
    settings.toggleWeeklyDigest();
    // Re-run the schedule function, it will pick up the new setting
    await scheduleClassReminders();
  };

  const handleToggleAppLock = async () => {
    if (Platform.OS === 'web') { Alert.alert('Mobile app feature', "Biometric app locking is available in the Android and iOS app. This browser demo stores data only in your browser."); return; }
    triggerHaptic('light');
    if (!settings.appLockEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Not Supported',
          'Your device does not support biometric authentication or it is not set up. Please enable Passcode or Face/Touch ID in your device settings.'
        );
        return;
      }

      // Optionally authenticate once to prove they can unlock it before turning it on
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable App Lock',
          fallbackLabel: 'Use Passcode',
        });

        if (result.success) {
          settings.toggleAppLock();
        }
      } catch (e) {
        console.warn('Auth error', e);
      }
    } else {
      settings.toggleAppLock();
    }
  };

  const handleExportData = async () => {
    try {
      triggerHaptic('light');
      const data = {
        profile: useProfileStore.getState().profile,
        subjects: useSubjectStore.getState().subjects,
        timetable: useTimetableStore.getState().entries,
        attendance: useAttendanceStore.getState().records,
        assignments: useAssignmentStore.getState().assignments,
        exams: useExamStore.getState().exams,
        academic: useAcademicStore.getState(),
        settings: useSettingsStore.getState()
      };

      const fileUri = FileSystem.cacheDirectory + 'CampusIQ_Backup.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Export CampusIQ Data',
          mimeType: 'application/json'
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Cannot export data on this device.');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    }
  };

  const getColorName = (hex: string) => {
    if (hex === '#0EA5E9') return 'Sky Blue';
    if (hex === '#10B981') return 'Emerald';
    if (hex === '#F43F5E') return 'Rose';
    if (hex === '#F59E0B') return 'Amber';
    return 'Violet';
  };

  // Key input modal state
  const [keyModal, setKeyModal] = React.useState<{ visible: boolean; label: string; value: string; secure: boolean; onSave: (v: string) => void | Promise<void> }>({ visible: false, label: '', value: '', secure: false, onSave: () => {} });
  const [keyDraft, setKeyDraft] = React.useState('');

  const openKeyModal = (label: string, currentValue: string, secure: boolean, onSave: (v: string) => void | Promise<void>) => {
    setKeyDraft(currentValue);
    setKeyModal({ visible: true, label, value: currentValue, secure, onSave });
  };

  const closeKeyModal = () => { setKeyModal(m => ({ ...m, visible: false })); setKeyDraft(''); };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} onPress={() => router.back()} style={{ marginRight: spacing.md }} />
        <Text style={[textStyles.h2, { color: colors.textPrimary }]}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>

        <Animated.View entering={FadeInDown.delay(0).duration(80)}>
          <SectionHeader title="Appearance" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="moon-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} 
              title="Theme Mode" 
              rightText={getThemeText()} 
              showChevron={true}
              onPress={showThemePicker}
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="color-palette-outline" iconColor={colors.primary} iconBackgroundColor={colors.primaryLight} 
              title="Accent Color" 
              rightText={getColorName(settings.accentColor)} 
              showChevron={true}
              onPress={showColorPicker}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <SectionHeader title="Preferences" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="notifications-outline" iconColor={colors.info} 
              title="Class Reminders" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={Platform.OS === 'web' ? false : settings.classReminders}
                  onValueChange={handleToggleClassReminders} 
                  trackColor={{ false: colors.border, true: colors.info }} 
                />
              } 
            />
            {settings.classReminders && (
              <>
                <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
                <ListRow 
                  icon="time-outline" iconColor={colors.info} 
                  title="Reminder Timing" 
                  rightText={`${settings.reminderMinutesBefore} mins`} 
                  showChevron={true}
                  onPress={showReminderPicker}
                />
              </>
            )}
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="calendar-outline" iconColor={colors.info} 
              title="Weekly Digest" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={Platform.OS === 'web' ? false : settings.weeklyDigest}
                  onValueChange={handleToggleWeeklyDigest} 
                  trackColor={{ false: colors.border, true: colors.info }} 
                />
              } 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="today-outline" iconColor={colors.info} 
              title="Start of Week" 
              rightText={settings.weekStartsOn === 0 ? 'Monday' : 'Sunday'} 
              showChevron={true}
              onPress={showStartOfWeekPicker}
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="hardware-chip-outline" iconColor={colors.warning} 
              title="Haptic Feedback" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={Platform.OS === 'web' ? false : settings.hapticFeedback}
                  onValueChange={handleToggleHapticFeedback} 
                  trackColor={{ false: colors.border, true: colors.warning }} 
                />
              } 
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(20).duration(80)}>
          <SectionHeader title="AI Assistant" />
          <Card variant="flat" padding={0}>
            <Text style={[textStyles.body, { color: colors.textSecondary, padding: spacing.md }]}>
              Your phone calls Google directly. Your Mac is optional and is used only for local fallback. Questions, academic summaries, and attached images go to the provider that handles the request.
            </Text>
            <ListRow icon="key-outline" iconColor={colors.primary} title="Google AI Studio API Key"
              rightElement={<Text style={[textStyles.body, { color: colors.textSecondary }]}>{hasGoogleKey ? 'Configured' : 'Not set'}</Text>}
              onPress={() => openKeyModal('Google AI Studio API Key', '', true, async key => {
                await setGoogleApiKey(key); setHasGoogleKey(Boolean(key));
              })} />
            <ListRow icon="desktop-outline" iconColor={colors.primary} title="Mac Ollama URL (optional)"
              rightElement={<Text style={[textStyles.body, { color: colors.textSecondary, maxWidth: 160 }]} numberOfLines={1}>{settings.macOllamaUrl || 'Not connected'}</Text>}
              onPress={() => openKeyModal('Mac Ollama URL', settings.macOllamaUrl, false, settings.setMacOllamaUrl)} />
            <ListRow icon="cloudy-outline" iconColor={colors.info} title="Enable Cloud AI" showChevron={false}
              rightElement={<Switch value={settings.cloudAiEnabled} onValueChange={settings.toggleCloudAiEnabled}
                trackColor={{ false: colors.border, true: colors.info }} />} />
            <ListRow icon="desktop-outline" iconColor={colors.primary} title="Allow Local Fallback" showChevron={false}
              rightElement={<Switch value={settings.useOfflineAIFallback} onValueChange={settings.toggleOfflineAIFallback}
                trackColor={{ false: colors.border, true: colors.primary }} />} />
            <Text style={[textStyles.body, { color: colors.textSecondary, padding: spacing.md }]}>
              Cloud AI on: Google first, Mac as backup. Cloud AI off: Mac only. Your phone and Mac must be on the same Wi-Fi for local inference; the Mac must be awake with Ollama running. No separate backend is needed.
            </Text>
          </Card>

          <SectionHeader title="Account & Security" />
          <Card variant="flat" padding={0}>
            <ListRow 
              icon="lock-closed-outline" iconColor={colors.warning} 
              title="App Lock" 
              showChevron={false}
              rightElement={
                <Switch 
                  value={Platform.OS === 'web' ? false : settings.appLockEnabled}
                  onValueChange={handleToggleAppLock} 
                  trackColor={{ false: colors.border, true: colors.warning }} 
                />
              } 
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />
            <ListRow 
              icon="person-remove-outline" iconColor={colors.danger} 
              title={Platform.OS === 'web' ? 'Clear browser data' : 'Delete Account'}
              onPress={() => {
                triggerHaptic('warning');
                handleDeleteAccount();
              }} 
            />
          </Card>
        </Animated.View>

      </ScrollView>

      {/* ── API Key Entry Modal ────────────────────────────────── */}
      <Modal
        visible={keyModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeKeyModal}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeKeyModal}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}
          >
            <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl }}>
              <Text style={[textStyles.h3, { color: colors.textPrimary, marginBottom: spacing.xs }]}>{keyModal.label}</Text>
              <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
                {keyModal.secure ? (Platform.OS === 'web' ? 'Browser key is temporary and cleared on reload. Leave blank and save to remove it.' : 'Saved securely on this phone. Leave blank and save to remove the key. Never share a key in a public app build.') : 'Example: http://192.168.1.52:11434. Use your Mac’s Wi-Fi address, not localhost, on your phone.'}
              </Text>
              <TextInput
                value={keyDraft}
                onChangeText={setKeyDraft}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                secureTextEntry={keyModal.secure}
                placeholder={`Enter ${keyModal.label}`}
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.textPrimary,
                  borderRadius: 10,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  fontSize: 14,
                  fontFamily: 'monospace',
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: spacing.lg,
                }}
              />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TouchableOpacity
                  onPress={closeKeyModal}
                  style={{ flex: 1, paddingVertical: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                >
                  <Text style={[textStyles.body, { color: colors.textSecondary, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={savingConnection}
                  onPress={async () => {
                    setSavingConnection(true);
                    try { await keyModal.onSave(keyDraft.trim()); closeKeyModal(); setKeyDraft(''); triggerHaptic('light'); }
                    catch { Alert.alert('Could not save', 'The setting could not be saved. Please try again.'); }
                    finally { setSavingConnection(false); }
                  }}
                  style={{ flex: 1, paddingVertical: spacing.md, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' }}
                >
                  <Text style={[textStyles.body, { color: '#fff', fontWeight: '700' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>


    </SafeAreaView>
  );
}
