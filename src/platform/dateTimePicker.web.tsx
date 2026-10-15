import React from 'react';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  value: Date;
  mode?: string;
  onValueChange?: (event: DateTimePickerEvent, date: Date) => void;
  onChange?: (event: DateTimePickerEvent, date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  themeVariant?: string;
  [key: string]: unknown;
};
const pad = (n: number) => String(n).padStart(2, '0');
const dateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export default function DateTimePicker({ value, mode, onValueChange, onChange, minimumDate, maximumDate, themeVariant }: Props) {
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  const isTime = mode === 'time';
  return <input
    aria-label={isTime ? 'Select time' : 'Select date'}
    type={isTime ? 'time' : 'date'}
    value={isTime ? `${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}` : dateValue(safeDate)}
    min={!isTime && minimumDate ? dateValue(minimumDate) : undefined}
    max={!isTime && maximumDate ? dateValue(maximumDate) : undefined}
    style={{ boxSizing: 'border-box', width: '100%', minWidth: 0, minHeight: 52, padding: 12, border: '1px solid #9793b3', borderRadius: 12, fontSize: 16, colorScheme: themeVariant === 'dark' ? 'dark' : 'light' }}
    onInput={e => {
      const raw = e.currentTarget.value;
      if (!raw) return;
      const next = new Date(safeDate);
      if (isTime) { const [h, m] = raw.split(':').map(Number); next.setHours(h, m, 0, 0); }
      else { const [y, m, d] = raw.split('-').map(Number); next.setFullYear(y, m - 1, d); }
      const event = { type: 'set', nativeEvent: { timestamp: next.getTime(), utcOffset: -next.getTimezoneOffset() } } as DateTimePickerEvent;
      (onValueChange || onChange)?.(event, next);
    }}
  />;
}
