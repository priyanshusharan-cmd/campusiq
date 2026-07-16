import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, TextInputProps as RNTextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface CustomTextInputProps extends RNTextInputProps {
  label: string;
  required?: boolean;
  iconRight?: keyof typeof Ionicons.glyphMap;
  onIconRightPress?: () => void;
  focusColor?: string;
  containerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export const TextInput = forwardRef<RNTextInput, CustomTextInputProps>(
  ({ label, required, iconRight, onIconRightPress, focusColor, style, containerStyle, ...props }, ref) => {
    const { colors, textStyles } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const innerRef = useRef<RNTextInput>(null);
    
    useImperativeHandle(ref, () => innerRef.current!);

    const currentBorderColor = isFocused ? (focusColor || colors.primary) : colors.borderLight;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[textStyles.smallMedium, { color: colors.textPrimary, marginBottom: 8 }]}>
        {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.surface,
          borderColor: currentBorderColor,
        }
      ]}>
        <RNTextInput
          ref={innerRef}
          style={[
            styles.input,
            { 
              color: colors.textPrimary,
            },
            props.multiline && { minHeight: 100, textAlignVertical: 'top', paddingTop: 14, paddingBottom: 14 },
            style
          ]}
          placeholderTextColor={colors.textQuaternary}
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
        />
        {iconRight && (
          <Pressable 
            onPress={() => {
              if (onIconRightPress) {
                innerRef.current?.blur();
                onIconRightPress();
              } else {
                innerRef.current?.focus();
              }
            }} 
            style={styles.iconContainer}
          >
            <Ionicons name={iconRight} size={20} color={isFocused ? (focusColor || colors.primary) : colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
