import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ProgressArcProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  showGlow?: boolean;
}

export function ProgressArc({
  progress,
  size = 120,
  strokeWidth = 8,
  showGlow = false,
}: ProgressArcProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const animatedProgress = useSharedValue(0);
  
  React.useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1200,
    });
  }, [progress]);
  
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const startAngle = -Math.PI / 2; // Start from top
  
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const progressValue = animatedProgress.value;
    
    // Create arc path - inline worklet function
    let path = '';
    if (progressValue <= 0) {
      path = '';
    } else if (progressValue >= 1) {
      // Full circle
      path = `M ${center} ${strokeWidth / 2} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${strokeWidth / 2}`;
    } else {
      const angle = startAngle + (Math.PI * 2 * progressValue);
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const largeArcFlag = progressValue > 0.5 ? 1 : 0;
      path = `M ${center} ${strokeWidth / 2} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`;
    }
    
    return {
      d: path,
    };
  });
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Path
          d={`M ${center} ${strokeWidth / 2} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${strokeWidth / 2}`}
          stroke={colors.progressBackground}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <AnimatedPath
          animatedProps={animatedProps}
          stroke={colors.progress}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        
        {/* Glow effect (subtle) */}
        {showGlow && progress > 0 && (
          <AnimatedPath
            animatedProps={animatedProps}
            stroke={colors.progress}
            strokeWidth={strokeWidth + 4}
            fill="transparent"
            strokeLinecap="round"
            opacity={0.2}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

