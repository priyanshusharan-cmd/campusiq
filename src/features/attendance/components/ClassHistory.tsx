// Campora — Class History Component
// Shows a timeline of attendance records for a subject

import React, { useState } from 'react';
import { View, Text, Pressable, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Card } from '@/components/ui';
import { styles } from '../styles/attendanceDetailStyles';

interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string;
  status: string;
  timetableEntryId?: string;
  classType?: string;
}

interface ClassHistoryProps {
  records: AttendanceRecord[];
  subDetails: string;
  hasTheory?: boolean;
  hasLab?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  present: { color: '#10B981', icon: 'checkmark', label: 'Present' },
  absent: { color: '#EF4444', icon: 'close', label: 'Absent' },
  cancelled: { color: '#D97706', icon: 'ban-outline', label: 'Cancelled' },
  holiday: { color: '#0D9488', icon: 'sunny-outline', label: 'Holiday' },
};

export function ClassHistory({ records, subDetails, hasTheory, hasLab }: ClassHistoryProps) {
  const { colors, spacing, textStyles } = useTheme();
  const [filter, setFilter] = useState('absent');

  const openFilter = () => {
    const showAdvanced = hasTheory && hasLab;
    const options = showAdvanced 
      ? ['Cancel', 'All', 'Present', 'Absent', 'Theory Present', 'Theory Absent', 'Lab Present', 'Lab Absent', 'Cancelled', 'Holiday']
      : ['Cancel', 'All', 'Present', 'Absent', 'Cancelled', 'Holiday'];
    const filterValues = showAdvanced
      ? ['cancel', 'all', 'present', 'absent', 'theory_present', 'theory_absent', 'lab_present', 'lab_absent', 'cancelled', 'holiday']
      : ['cancel', 'all', 'present', 'absent', 'cancelled', 'holiday'];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        title: 'Filter Class History',
      },
      (buttonIndex) => {
        if (buttonIndex !== 0) {
          setFilter(filterValues[buttonIndex]);
        }
      }
    );
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'theory_present') return record.status === 'present' && record.classType !== 'lab';
    if (filter === 'theory_absent') return record.status === 'absent' && record.classType !== 'lab';
    if (filter === 'lab_present') return record.status === 'present' && record.classType === 'lab';
    if (filter === 'lab_absent') return record.status === 'absent' && record.classType === 'lab';
    return record.status === filter;
  });

  const filterLabel = filter === 'all' ? 'All Status' : 
    filter.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Class History</Text>
        <Pressable style={[styles.filterDropdown, { backgroundColor: colors.primaryLight }]} onPress={openFilter}>
          <Ionicons name="funnel-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '500' }}>{filterLabel}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>
      
      <Card variant="elevated" padding={0}>
        {filteredRecords.length > 0 ? filteredRecords.map((record, index) => {
          const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.absent;
          const { color, icon, label } = config;
          
          const dateStr = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <React.Fragment key={record.id}>
              <View style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={16} color="#fff" />
                </View>
                <View style={[styles.historyContent, { borderLeftColor: color, borderLeftWidth: 2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: 2 }}>{dateStr}</Text>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>{subDetails || 'No location details'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
                      <Text style={{ color, fontSize: 12, fontWeight: '500' }}>{label}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {index < filteredRecords.length - 1 && <View style={[styles.historyDivider, { backgroundColor: colors.divider }]} />}
            </React.Fragment>
          );
        }) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>No attendance history found.</Text>
          </View>
        )}
      </Card>
    </View>
  );
}
