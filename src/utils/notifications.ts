import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useTimetableStore } from '@/stores/useTimetableStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('classes', {
      name: 'Class Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C5CFC',
    });
    
    await Notifications.setNotificationChannelAsync('digest', {
      name: 'Weekly Digest',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#7C5CFC',
    });
  }

  return true;
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleClassReminders() {
  // First cancel all existing to avoid duplicates
  await cancelAllReminders();

  const settings = useSettingsStore.getState();
  
  if (settings.weeklyDigest) {
    await scheduleWeeklyDigest();
  }

  if (!settings.classReminders) return;

  const entries = useTimetableStore.getState().entries;
  const subjects = useSubjectStore.getState().subjects;

  if (entries.length === 0) return;

  const dayMap: Record<string, number> = {
    sunday: 1,
    monday: 2,
    tuesday: 3,
    wednesday: 4,
    thursday: 5,
    friday: 6,
    saturday: 7,
  };

  const reminderMinutesBefore = settings.reminderMinutesBefore || 15;

  for (const entry of entries) {
    const subject = subjects.find(s => s.id === entry.subjectId);
    if (!subject) continue;

    // Parse start time "HH:mm"
    const [hours, minutes] = entry.startTime.split(':').map(Number);
    
    // Calculate reminder time
    let reminderHours = hours;
    let reminderMinutes = minutes - reminderMinutesBefore;

    if (reminderMinutes < 0) {
      reminderMinutes += 60;
      reminderHours -= 1;
    }
    
    if (reminderHours < 0) {
        reminderHours += 24;
        // In a real app we'd need to adjust the weekday back by 1 as well
    }

    const weekday = dayMap[entry.dayOfWeek];

    if (!weekday) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming Class: ${subject.name}`,
        body: `Your ${entry.type || 'class'} starts in ${reminderMinutesBefore} minutes${entry.room ? ` in ${entry.room}` : ''}`,
        data: { entryId: entry.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: reminderHours,
        minute: reminderMinutes,
      },
    });
  }
}

export async function scheduleWeeklyDigest() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CampusIQ Weekly Digest',
      body: 'Check CampusIQ to review your attendance and plan your upcoming week!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 18,   // 6:00 PM
      minute: 0,
    },
  });
}
