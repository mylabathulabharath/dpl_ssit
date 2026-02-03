import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, Typography, Glows, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface CourseResult {
  id: string;
  title: string;
  university?: string;
  instructor: string;
  thumbnail?: string;
  duration: string;
  skills: string[];
  outcome: 'Placement' | 'Internship' | 'Certification';
  rating?: number;
  ratingCount?: number;
}

interface CourseResultCardProps {
  course: CourseResult;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CourseResultCard({ course, index = 0 }: CourseResultCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const scale = useSharedValue(1);
  
  const handlePress = () => {
    router.push(`/course/${course.id}`);
  };
  
  const handlePressIn = () => {
    scale.value = withSpring(1.02);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Placement':
        return BrandColors.electricCyan;
      case 'Internship':
        return BrandColors.deepSkyBlue;
      case 'Certification':
        return BrandColors.rocketRed;
      default:
        return colors.primary;
    }
  };
  
  return (
    <AnimatedTouchable
      entering={FadeInDown.duration(600).delay(index * 100)}
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {course.thumbnail ? (
          <Image
            source={{ uri: course.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceElevated }]} />
        )}
        
        {/* Outcome Badge */}
        <View style={[styles.outcomeBadge, { backgroundColor: getOutcomeColor(course.outcome) }]}>
          <ThemedText
            style={[
              Typography.caption,
              {
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: 11,
              },
            ]}
          >
            {course.outcome}
          </ThemedText>
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <ThemedText
          style={[
            Typography.h2,
            { color: colors.text, marginBottom: Spacing.xs },
          ]}
          numberOfLines={2}
        >
          {course.title}
        </ThemedText>
        
        {course.university && (
          <ThemedText
            style={[
              Typography.bodySmall,
              { color: colors.textSecondary, marginBottom: Spacing.sm },
            ]}
            numberOfLines={1}
          >
            {course.university}
          </ThemedText>
        )}
        
        <ThemedText
          style={[
            Typography.bodySmall,
            { color: colors.textSecondary, marginBottom: Spacing.md },
          ]}
          numberOfLines={1}
        >
          {course.instructor}
        </ThemedText>
        
        {/* Skills */}
        {course.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {course.skills.slice(0, 3).map((skill, idx) => (
              <View
                key={idx}
                style={[
                  styles.skillTag,
                  { 
                    backgroundColor: colors.surfaceElevated, 
                    borderColor: colors.border,
                    marginHorizontal: Spacing.xs / 2,
                    marginBottom: Spacing.xs,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    Typography.caption,
                    { color: colors.textSecondary },
                  ]}
                >
                  {skill}
                </ThemedText>
              </View>
            ))}
            {course.skills.length > 3 && (
              <ThemedText
                style={[
                  Typography.caption,
                  { color: colors.textTertiary, marginLeft: Spacing.xs },
                ]}
              >
                +{course.skills.length - 3} more
              </ThemedText>
            )}
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footerRow}>
          <ThemedText
            style={[
              Typography.body,
              { color: colors.textSecondary },
            ]}
          >
            {course.duration}
          </ThemedText>
          
          {course.rating && (
            <View style={styles.ratingRow}>
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: colors.text,
                    fontWeight: '700',
                    marginRight: Spacing.xs,
                  },
                ]}
              >
                {course.rating}
              </ThemedText>
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: '#F3CA52',
                    fontSize: 14,
                  },
                ]}
              >
                ★
              </ThemedText>
              {course.ratingCount && (
                <ThemedText
                  style={[
                    Typography.caption,
                    { color: colors.textTertiary, marginLeft: Spacing.xs },
                  ]}
                >
                  ({course.ratingCount.toLocaleString()})
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...Glows.card,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
  },
  outcomeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.xs / 2,
  },
  skillTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

