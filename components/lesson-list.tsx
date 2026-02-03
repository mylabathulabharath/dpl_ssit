import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeInDown
} from 'react-native-reanimated';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  current?: boolean;
}

interface LessonListProps {
  lessons: Lesson[];
  currentLessonId?: string;
  onLessonPress: (lessonId: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function LessonList({ lessons, currentLessonId, onLessonPress }: LessonListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {lessons.map((lesson, index) => {
        const isCurrent = lesson.id === currentLessonId;
        const isCompleted = lesson.completed;
        
        return (
          <AnimatedTouchable
            key={lesson.id}
            entering={FadeInDown.duration(400).delay(index * 50)}
            style={[
              styles.lessonItem,
              {
                backgroundColor: isCurrent ? colors.surfaceElevated : colors.surface,
              },
            ]}
            onPress={() => onLessonPress(lesson.id)}
            activeOpacity={0.7}
          >
            {/* Flow Indicator Line */}
            {index < lessons.length - 1 && (
              <View
                style={[
                  styles.flowLine,
                  {
                    backgroundColor: isCompleted
                      ? colors.completed
                      : colors.progressBackground,
                    opacity: isCompleted ? 0.3 : 0.1,
                  },
                ]}
              />
            )}
            
            {/* Lesson Content */}
            <View style={styles.lessonContent}>
              {/* Lesson Number & Status */}
              <View style={styles.lessonNumberContainer}>
                {isCompleted ? (
                  <View style={[styles.completedCircle, { backgroundColor: colors.completed }]}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color={colors.background}
                    />
                  </View>
                ) : isCurrent ? (
                  <View style={[styles.currentCircle, { backgroundColor: colors.current }]}>
                    <View style={styles.currentInnerCircle} />
                  </View>
                ) : (
                  <View style={[styles.pendingCircle, { borderColor: colors.progressBackground }]}>
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        { color: colors.textTertiary, fontWeight: '600' },
                      ]}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </ThemedText>
                  </View>
                )}
              </View>
              
              {/* Lesson Info */}
              <View style={styles.lessonInfo}>
                <ThemedText
                  style={[
                    Typography.bodyLarge,
                    {
                      color: isCurrent ? colors.text : colors.textSecondary,
                      marginBottom: Spacing.xs,
                      fontWeight: isCurrent ? '600' : '400',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {lesson.title}
                </ThemedText>
                
                <ThemedText
                  style={[
                    Typography.caption,
                    { color: colors.textTertiary },
                  ]}
                >
                  {lesson.duration}
                </ThemedText>
              </View>
              
              {/* Completed Glow Effect */}
              {isCompleted && !isCurrent && (
                <LinearGradient
                  colors={[`${colors.completed}15`, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.completedGlow}
                />
              )}
            </View>
          </AnimatedTouchable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  lessonItem: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  flowLine: {
    position: 'absolute',
    left: 28,
    top: 56,
    width: 2,
    height: Spacing.md + Radius.lg,
    zIndex: 0,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  lessonNumberContainer: {
    marginRight: Spacing.md,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  currentInnerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  pendingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  lessonInfo: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  completedGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.5,
  },
});
