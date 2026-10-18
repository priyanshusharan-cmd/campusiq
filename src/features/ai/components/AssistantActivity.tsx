import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
export function AssistantActivity({ status }: { status?: string }) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  return <View style={{ marginBottom: 12, width: '100%', minWidth: 0 }}><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}><ActivityIndicator size="small" color={theme.colors.textSecondary} /><Text style={[theme.textStyles.smallMedium, { color: theme.colors.textSecondary, flex: 1, minWidth: 0, flexShrink: 1 }]}>{status || 'Working…'}</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={theme.colors.textSecondary} /></TouchableOpacity>{expanded && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, paddingLeft: 26, lineHeight: 21 }]}>The selected model is generating its response. For app changes, the proposal is checked before review opens. Nothing is saved until you confirm.</Text>}</View>;
}
