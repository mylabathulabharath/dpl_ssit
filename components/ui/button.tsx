import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Colors, Typography, Radius, Spacing, Glows, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const isDisabled = disabled || loading;
  
  // 🚀 Button Design (Glow-Based) - Launch Control Interface
  const variantStyles = {
    primary: {
      backgroundColor: BrandColors.electricCyan, // #29B6F6
      borderWidth: 0,
      ...Glows.primary, // Cyan glow replaces elevation
    },
    accent: {
      backgroundColor: BrandColors.rocketRed, // #F44336 - Launch moments
      borderWidth: 0,
      ...Glows.accent, // Red glow for launch moments
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      ...Glows.card, // Subtle glow for secondary
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
  };
  
  const sizeStyles = {
    large: {
      paddingVertical: 14, // As per design spec
      paddingHorizontal: Spacing.xl,
      minHeight: 56,
      borderRadius: 14, // As per design spec
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      minHeight: 44,
      borderRadius: 12,
    },
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      minHeight: 36,
      borderRadius: 10,
    },
  };
  
  // Text color: dark for primary/accent (on bright bg), light for others
  const textColor = variant === 'primary' || variant === 'accent'
    ? '#001018' // Dark text on bright cyan/red (as per design spec)
    : variant === 'secondary'
    ? colors.text
    : colors.primary; // Ghost uses primary color
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={textColor} 
        />
      ) : (
        <ThemedText 
          style={[
            Typography.button,
            { 
              color: textColor,
              fontWeight: '700', // Bold as per design spec
            },
          ]}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row' as const,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
