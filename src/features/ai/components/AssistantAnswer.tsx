import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { inlineParts, parseAnswer } from '../services/answerFormat';

export function AssistantAnswer({ content }: { content: string }) {
  const theme = useTheme();
  const blocks = useMemo(() => parseAnswer(content), [content]);
  const inline = (text: string) => inlineParts(text).map((part, index) => (
    <Text key={index} style={part.style === 'bold' ? { fontFamily: theme.textStyles.bodySemiBold.fontFamily } : part.style === 'italic' ? { fontStyle: 'italic' } : part.style === 'code' ? { fontFamily: 'monospace', backgroundColor: theme.colors.bg } : undefined}>{part.text}</Text>
  ));
  return <View style={styles.content}>
    {blocks.map((block, index) => {
      if (block.kind === 'table') return <View key={index} style={[styles.table, { borderColor: theme.colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Response table. Scroll horizontally to view all columns.">
          <View>
            {[block.headers, ...block.rows].map((row, rowIndex) => <View key={rowIndex} style={[styles.row, { backgroundColor: rowIndex === 0 ? theme.colors.bg : theme.colors.surface }]}>
              {block.headers.map((_, column) => <View key={column} style={[styles.cell, { width: column === 0 ? 108 : 144, borderColor: theme.colors.borderLight }]}>
                <Text selectable style={[rowIndex === 0 ? theme.textStyles.smallMedium : theme.textStyles.small, { color: theme.colors.textPrimary }]}>{inline(row[column] ?? '')}</Text>
              </View>)}
            </View>)}
          </View>
        </ScrollView>
      </View>;
      if (block.kind === 'code') return <ScrollView key={index} horizontal style={[styles.code, { backgroundColor: theme.colors.bg }]}><Text selectable style={[theme.textStyles.small, { fontFamily: 'monospace', color: theme.colors.textPrimary }]}>{block.text}</Text></ScrollView>;
      return <View key={index} style={[styles.row, block.kind === 'quote' && [styles.quote, { borderColor: theme.colors.border }]]}>
        {block.kind === 'list' && <Text style={[theme.textStyles.body, styles.marker, { color: theme.colors.textSecondary }]}>{block.marker}</Text>}
        <Text selectable style={[block.kind === 'heading' ? theme.textStyles.bodySemiBold : theme.textStyles.body, styles.text, { color: theme.colors.textPrimary }]}>{inline(block.text)}</Text>
      </View>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  content: { gap: 12, minWidth: 0, width: '100%' },
  row: { flexDirection: 'row' },
  text: { flex: 1, minWidth: 0 },
  marker: { width: 26 },
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', width: '100%' },
  cell: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth },
  code: { padding: 12, borderRadius: 8 },
  quote: { borderLeftWidth: 3, paddingLeft: 12 },
});
