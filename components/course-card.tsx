import { ThemedText } from '@/components/themed-text';
import { ProgressArc } from '@/components/ui/progress-arc';
import { Colors, Radius, Shadows, Spacing, Typography, Glows, BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail?: string;
  progress?: number; // 0 to 1
  duration?: string;
  rating?: number;
  ratingCount?: number;
  price?: string;
  isBestseller?: boolean;
}

interface CourseCardProps {
  course: Course;
  featured?: boolean;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function CourseCard({ course, featured = false, index = 0 }: CourseCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const hasProgress = course.progress !== undefined && course.progress > 0;
  
  const handlePress = () => {
    router.push(`/course/${course.id}`);
  };
  
  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('★');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };
  
  return (
    <AnimatedTouchable
      entering={FadeInDown.duration(600).delay(index * 100)}
      style={[
        styles.card,
        featured && styles.featuredCard,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
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
        
        {/* Progress overlay */}
        {hasProgress && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressWrapper}>
              <ProgressArc
                progress={course.progress!}
                size={64}
                strokeWidth={6}
                showGlow={true}
              />
              <View style={styles.progressTextOverlay}>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: '#FFFFFF',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {Math.round(course.progress! * 100)}%
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <ThemedText
          style={[
            Typography.h3,
            { color: colors.text, marginBottom: Spacing.xs },
            { fontSize: 16, lineHeight: 22 },
          ]}
          numberOfLines={2}
        >
          {course.title}
        </ThemedText>
        
        <ThemedText
          style={[
            Typography.bodySmall,
            { color: colors.textSecondary, marginBottom: Spacing.xs },
          ]}
          numberOfLines={1}
        >
          {course.instructor}
        </ThemedText>
        
        {/* Rating */}
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
                  marginRight: Spacing.xs,
                },
              ]}
            >
              {renderStars(course.rating)}
            </ThemedText>
            {course.ratingCount && (
              <ThemedText
                style={[
                  Typography.caption,
                  { color: colors.textTertiary },
                ]}
              >
                ({course.ratingCount.toLocaleString()})
              </ThemedText>
            )}
          </View>
        )}
        
        {/* Price and Bestseller */}
        <View style={styles.footerRow}>
          {course.price ? (
            <ThemedText
              style={[
                Typography.body,
                {
                  color: colors.text,
                  fontWeight: '700',
                },
              ]}
            >
              {course.price}
            </ThemedText>
          ) : (
            <ThemedText
              style={[
                Typography.caption,
                { color: colors.textTertiary },
              ]}
            >
              {course.duration}
            </ThemedText>
          )}
          
          {course.isBestseller && (
            <View style={styles.bestsellerTag}>
              <ThemedText
                style={[
                  Typography.caption,
                  {
                    color: '#000',
                    fontWeight: '700',
                    fontSize: 10,
                  },
                ]}
              >
                Bestseller
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    // 🚀 Card System (Signature Look) - Launch Control Interface
    backgroundColor: '#111827', // Colors.surface
    borderRadius: 18, // As per design spec
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B', // Colors.border
    ...Glows.card, // Subtle glow for interactive cards
  },
  featuredCard: {
    marginBottom: Spacing.xl,
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
  progressOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
  },
  progressWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  bestsellerTag: {
    backgroundColor: '#F3CA52',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
