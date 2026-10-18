// Campora — Attendance Route

import React from 'react';
import AttendanceScreen from '@/features/attendance/AttendanceScreen';
import { SwipeBackWrapper } from '@/components/navigation/SwipeBackWrapper';

export default function AttendanceRoute() {
  return (
    <SwipeBackWrapper>
      <AttendanceScreen />
    </SwipeBackWrapper>
  );
}
