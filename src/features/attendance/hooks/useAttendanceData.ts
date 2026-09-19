// Campora — useAttendanceData Hook

import { useSubjectAttendance, useOverallAttendance } from '@/stores/useAttendanceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useAttendanceData() {
  const subjectAttendance = useSubjectAttendance();
  const overall = useOverallAttendance();
  const target = useSettingsStore((s) => s.attendanceTarget);

  let insight = "No attendance data available yet.";
  if (overall.total > 0) {
    if (overall.canMiss > 0) {
      insight = `Great job! You can miss ${overall.canMiss} more classes and still maintain the required ${target}% attendance.`;
    } else if (overall.canMiss === 0) {
      insight = `You are exactly at the target ${target}% attendance. Try not to miss any classes.`;
    } else {
      insight = `Be careful! You need to attend more classes to reach your target of ${target}%.`;
    }
  }

  return {
    subjectAttendance,
    overall,
    target,
    insight,
  };
}
