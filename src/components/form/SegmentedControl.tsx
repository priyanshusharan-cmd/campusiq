import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export interface SegmentOption {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string; // e.g. for Priority
}

interface SegmentedControlProps {
  label?: string;
  required?: boolean;
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'outline' | 'pill';
}

export function SegmentedControl({ label, required, options, value, onChange, variant = 'outline' }: SegmentedControlProps) {
  const { colors, textStyles } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 8 }]}>
          {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        </Text>
      )}
      <View style={[styles.optionsRow, variant === 'pill' && { gap: 8 }]}>
        {options.map((option) => {
          const isActive = value === option.value;
          
          if (variant === 'pill') {
            return (
              <Pressable
                key={option.value}
                onPress={() => onChange(option.value)}
                style={[
                  styles.pillOption,
                  { 
                    backgroundColor: isActive ? (option.color ? option.color + '15' : colors.primaryLight) : colors.surface,
                    borderColor: isActive ? (option.color || colors.primary) : colors.borderLight,
                  }
                ]}
              >
                {option.icon && (
                  <Ionicons 
                    name={option.icon} 
                    size={16} 
                    color={isActive ? (option.color || colors.primary) : colors.textTertiary} 
                    style={{ marginBottom: 4 }} 
                  />
                )}
                {option.color && !option.icon && (
                  <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                )}
                <Text style={{ 
                  fontSize: 13, 
                  fontWeight: isActive ? '600' : '500', 
                  color: isActive ? (option.color || colors.primary) : colors.textSecondary 
                }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          }

          // Outline variant (default)
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.outlineOption,
                { 
                  backgroundColor: isActive ? colors.primaryLight : colors.surface,
                  borderColor: isActive ? colors.primary : colors.borderLight,
                }
              ]}
            >
              {option.icon && (
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={isActive ? colors.primary : colors.textSecondary} 
                  style={{ marginBottom: 8 }} 
                />
              )}
              <Text style={{ 
                fontSize: 13, 
                fontWeight: isActive ? '600' : '400', 
                color: isActive ? colors.primary : colors.textSecondary 
              }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  pillOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});
