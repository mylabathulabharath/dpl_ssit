import { Logo } from '@/components/logo';
import { LottieLoader } from '@/components/lottie-loader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserMenu } from '@/components/user-menu';
import { Colors, Glows, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCourses } from '@/services/course-service';
import { Course } from '@/types/course';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCourses();
  }, []);
  
  const loadCourses = async () => {
    try {
      const allCourses = await getCourses();
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };
  
  const handleCoursePress = (courseId: string) => {
    router.push(`/course/${courseId}`);
  };
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header with User Menu */}
      <View style={styles.topBar}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Logo variant="small" style={styles.logo} />
            <ThemedText
              style={[
                Typography.display,
                {
                  color: colors.text,
                  fontSize: 28,
                  lineHeight: 36,
                  marginLeft: Spacing.sm,
                },
              ]}
            >
              DPL
            </ThemedText>
          </View>
        </View>
        <UserMenu />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <ThemedText
            style={[
              Typography.h1,
              {
                color: colors.text,
                fontSize: 24,
                lineHeight: 32,
                marginBottom: Spacing.xs,
              },
            ]}
          >
            Welcome back{userProfile?.displayName ? `, ${userProfile.displayName.split(' ')[0]}` : ''}
          </ThemedText>
          <ThemedText
            style={[
              Typography.bodyLarge,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Continue your learning journey
          </ThemedText>
        </Animated.View>
        
        {/* Available Courses */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <LottieLoader size={150} />
          </View>
        ) : courses.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.section}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: colors.text,
                  marginBottom: Spacing.md,
                  fontSize: 22,
                },
              ]}
            >
              Available Courses
            </ThemedText>
            {courses.map((course, index) => (
              <TouchableOpacity
                key={course.id}
                style={[styles.courseCard, { backgroundColor: colors.surface }]}
                onPress={() => handleCoursePress(course.id)}
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
                    <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                      <IconSymbol name="play.circle.fill" size={40} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
                
                {/* Content */}
                <View style={styles.courseCardContent}>
                  <ThemedText
                    style={[
                      Typography.h3,
                      {
                        color: colors.text,
                        marginBottom: Spacing.xs,
                        fontSize: 18,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {course.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: colors.textSecondary,
                        marginBottom: Spacing.sm,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {course.trainerName}
                  </ThemedText>
                  
                  {/* Rating and Enrollment */}
                  {(course.rating && course.rating > 0) || (course.enrollmentCount && course.enrollmentCount > 0) ? (
                    <View style={styles.ratingRow}>
                      {course.rating && course.rating > 0 && (
                        <>
                          <ThemedText
                            style={[
                              Typography.bodySmall,
                              {
                                color: '#B4690E',
                                fontSize: 13,
                                fontWeight: '700',
                                marginRight: Spacing.xs,
                              },
                            ]}
                          >
                            {course.rating.toFixed(1)}
                          </ThemedText>
                          <ThemedText
                            style={[
                              Typography.bodySmall,
                              {
                                color: '#E59819',
                                fontSize: 12,
                                marginRight: Spacing.xs,
                              },
                            ]}
                          >
                            ★★★★★
                          </ThemedText>
                          {course.ratingCount && course.ratingCount > 0 && (
                            <ThemedText
                              style={[
                                Typography.caption,
                                {
                                  color: colors.textTertiary,
                                  fontSize: 11,
                                  marginRight: Spacing.sm,
                                },
                              ]}
                            >
                              ({course.ratingCount.toLocaleString()})
                            </ThemedText>
                          )}
                        </>
                      )}
                      {course.enrollmentCount && course.enrollmentCount > 0 && (
                        <ThemedText
                          style={[
                            Typography.caption,
                            {
                              color: colors.textTertiary,
                              fontSize: 11,
                            },
                          ]}
                        >
                          {course.enrollmentCount.toLocaleString()} {course.enrollmentCount === 1 ? 'student' : 'students'}
                        </ThemedText>
                      )}
                    </View>
                  ) : null}
                  
                  <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                      <IconSymbol name="list.bullet" size={14} color={colors.textTertiary} />
                      <ThemedText
                        style={[
                          Typography.caption,
                          {
                            color: colors.textTertiary,
                            marginLeft: Spacing.xs,
                          },
                        ]}
                      >
                        {course.totalTopics} topics
                      </ThemedText>
                    </View>
                    <View style={styles.metaItem}>
                      <IconSymbol name="play.circle.fill" size={14} color={colors.textTertiary} />
                      <ThemedText
                        style={[
                          Typography.caption,
                          {
                            color: colors.textTertiary,
                            marginLeft: Spacing.xs,
                          },
                        ]}
                      >
                        {formatDuration(course.totalDuration)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                
                <IconSymbol name="chevron.right" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyContainer}>
            <ThemedText
              style={[
                Typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                },
              ]}
            >
              No courses available yet. Check back soon!
            </ThemedText>
          </Animated.View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
  },
  courseCard: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    ...Glows.card,
  },
  thumbnailContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#1A1D23',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCardContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
