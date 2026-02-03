/**
 * 🔘 Admin Button Component
 * Consistent button styling for admin panel
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Colors, Typography, Spacing, Radius, Glows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AdminButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export function AdminButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
}: AdminButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.text,
      glow: Glows.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      textColor: colors.text,
      glow: {},
    },
    danger: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      textColor: colors.text,
      glow: Glows.accent,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: colors.textSecondary,
      glow: {},
    },
  };

  const sizeStyles = {
    small: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, ...Typography.bodySmall },
    medium: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, ...Typography.body },
    large: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, ...Typography.bodyLarge },
  };

  const style = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled ? colors.surfaceElevated : style.backgroundColor,
          borderColor: style.borderColor,
          borderWidth: variant === 'ghost' ? 0 : 1,
          opacity: isDisabled ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        sizeStyle,
        Platform.OS === 'web' && !isDisabled && style.glow,
        Platform.OS === 'web' && {
          cursor: isDisabled ? 'not-allowed' : 'pointer',
        },
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={style.textColor} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text
            style={[
              styles.label,
              {
                color: isDisabled ? colors.textTertiary : style.textColor,
              },
              sizeStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.button,
    gap: Spacing.sm,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  label: {
    fontWeight: '600',
  },
  icon: {
    fontSize: 18,
  },
});

