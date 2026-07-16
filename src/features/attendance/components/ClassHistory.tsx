// Campora — Class History Component
// Shows a timeline of attendance records for a subject

import React from 'react';
import { View, Text } from 'react-native';
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
}

interface ClassHistoryProps {
  records: AttendanceRecord[];
  subDetails: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  present: { color: '#10B981', icon: 'checkmark', label: 'Present' },
  absent: { color: '#EF4444', icon: 'close', label: 'Absent' },
  cancelled: { color: '#D97706', icon: 'ban-outline', label: 'Cancelled' },
  holiday: { color: '#0D9488', icon: 'sunny-outline', label: 'Holiday' },
};

export function ClassHistory({ records, subDetails }: ClassHistoryProps) {
  const { colors, spacing, textStyles } = useTheme();

  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={[textStyles.h3, { color: colors.textPrimary }]}>Class History</Text>
        <View style={styles.filterDropdown}>
          <Ionicons name="funnel-outline" size={12} color="#4F46E5" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '500' }}>All Status</Text>
          <Ionicons name="chevron-down" size={12} color="#4F46E5" style={{ marginLeft: 4 }} />
        </View>
      </View>
      
      <Card variant="elevated" padding={0}>
        {records.length > 0 ? records.map((record, index) => {
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
              {index < records.length - 1 && <View style={styles.historyDivider} />}
            </React.Fragment>
          );
        }) : (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>No attendance history yet.</Text>
          </View>
        )}
      </Card>
    </View>
  );
}
