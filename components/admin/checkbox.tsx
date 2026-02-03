/**
 * ☑️ Checkbox Component
 * Reusable checkbox for multi-select
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onToggle, disabled = false }: CheckboxProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : 'transparent',
            borderColor: checked ? colors.primary : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {checked && <Text style={[styles.checkmark, { color: colors.text }]}>✓</Text>}
      </View>
      <Text style={[styles.label, { color: disabled ? colors.textTertiary : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    ...Typography.body,
    flex: 1,
  },
});

