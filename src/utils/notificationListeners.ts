import { useTimetableStore } from '@/stores/useTimetableStore';
import { useSubjectStore } from '@/stores/useSubjectStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { scheduleClassReminders } from './notifications';

export function setupNotificationListeners() {
  let prevEntries = useTimetableStore.getState().entries;
  let prevSubjects = useSubjectStore.getState().subjects;

  useTimetableStore.subscribe((state) => {
    if (state.entries !== prevEntries) {
      prevEntries = state.entries;
      const { classReminders } = useSettingsStore.getState();
      if (classReminders) {
        scheduleClassReminders();
      }
    }
  });

  useSubjectStore.subscribe((state) => {
    if (state.subjects !== prevSubjects) {
      prevSubjects = state.subjects;
      const { classReminders } = useSettingsStore.getState();
      if (classReminders) {
        scheduleClassReminders();
      }
    }
  });
}
