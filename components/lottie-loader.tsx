/**
 * Native Lottie Loader
 * Uses lottie-react-native for iOS and Android
 * Web version is in lottie-loader.web.tsx
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface LottieLoaderProps {
  size?: number;
  style?: ViewStyle;
}

// Lottie source URL from lottie.host
const LOTTIE_URL = 'https://lottie.host/c19834a8-2dfa-4768-8875-e770b9bc134f/kUygRZbXCR.lottie';

// Native platforms - use Lottie
export function LottieLoader({ size = 200, style }: LottieLoaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  // Try to load Lottie module
  const LottieView = React.useMemo(() => {
    try {
      // @ts-ignore - lottie-react-native is only available on native
      const lottieModule = require('lottie-react-native');
      return lottieModule?.default || lottieModule;
    } catch (error) {
      console.warn('Lottie not available:', error);
      return null;
    }
  }, []);

  // Try to load local file, fallback to URL
  const source = React.useMemo(() => {
    try {
      return require('@/assets/preloaders/rocket-loader.lottie');
    } catch {
      try {
        return require('../../assets/preloaders/rocket-loader.lottie');
      } catch {
        return { uri: LOTTIE_URL };
      }
    }
  }, []);

  if (LottieView && source) {
    return (
      <View style={[styles.container, style]}>
        <LottieView
          source={source}
          autoPlay
          loop
          style={{ width: size, height: size }}
        />
      </View>
    );
  }

  // Fallback to ActivityIndicator if Lottie fails to load
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

