/**
 * Web-specific Lottie Loader
 * Uses ActivityIndicator instead of lottie-react-native
 * This prevents web bundler from trying to resolve lottie-react-native
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface LottieLoaderProps {
  size?: number;
  style?: ViewStyle;
}

export function LottieLoader({ size = 200, style }: LottieLoaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

