// Campora — Timetable Route

import React from 'react';
import TimetableScreen from '@/features/timetable/TimetableScreen';
import { SwipeBackWrapper } from '@/components/navigation/SwipeBackWrapper';

export default function TimetableRoute() {
  return (
    <SwipeBackWrapper>
      <TimetableScreen />
    </SwipeBackWrapper>
  );
}
