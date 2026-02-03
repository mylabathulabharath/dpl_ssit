import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressLinearProps {
  progress: number; // 0 to 1
  height?: number;
  showBackground?: boolean;
}

export function ProgressLinear({
  progress,
  height = 4,
  showBackground = true,
}: ProgressLinearProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const animatedProgress = useSharedValue(0);
  
  React.useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 600,
    });
  }, [progress]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });
  
  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: showBackground ? colors.progressBackground : 'transparent',
          borderRadius: Radius.sm,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            height,
            backgroundColor: colors.progress,
            borderRadius: Radius.sm,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  progress: {
    width: '0%',
  },
});

