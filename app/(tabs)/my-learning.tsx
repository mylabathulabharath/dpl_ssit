import { ThemedText } from '@/components/themed-text';
import { Colors, Typography, Spacing, Radius, Glows } from '@/constants/theme';
import { LottieLoader } from '@/components/lottie-loader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEnrollment } from '@/services/enrollment-service';
import { getMyLearnings, CourseProgressSummary } from '@/services/progress-service';
import { getCourseById } from '@/services/course-service';
import { Course } from '@/types/course';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressArc } from '@/components/ui/progress-arc';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface EnrolledCourseWithProgress {
  course: Course;
  progress: CourseProgressSummary;
}

export default function MyLearningScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  const router = useRouter();
  const styles = getStyles(colors);
  
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    if (userProfile && userProfile.role === 'student') {
      loadEnrolledCourses();
    }
  }, [userProfile]);
  
  const loadEnrolledCourses = async () => {
    try {
      if (!userProfile || userProfile.role !== 'student') return;
      
      // Get all course progress summaries
      const progressSummaries = await getMyLearnings(userProfile.uid);
      
      // Fetch full course details for each
      const coursesWithProgress = await Promise.all(
        progressSummaries.map(async (progress) => {
          const course = await getCourseById(progress.course_id);
          if (!course) return null;
          
          return {
            course,
            progress,
          } as EnrolledCourseWithProgress;
        })
      );
      
      // Filter out nulls and sort by last accessed
      const validCourses = coursesWithProgress
        .filter((item): item is EnrolledCourseWithProgress => item !== null)
        .sort((a, b) => {
          // Sort by completion percentage (in progress first), then by last accessed
          if (a.progress.status === 'in_progress' && b.progress.status !== 'in_progress') return -1;
          if (a.progress.status !== 'in_progress' && b.progress.status === 'in_progress') return 1;
          return 0;
        });
      
      setEnrolledCourses(validCourses);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadEnrolledCourses();
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
  
  const handleContinueLearning = async (course: Course, progress: CourseProgressSummary) => {
    try {
      // Navigate to last accessed lecture if available, otherwise first lecture
      let targetLectureId: string | null = null;
      
      if (progress.last_accessed_lecture_id) {
        // Verify lecture still exists in course
        const lectureExists = course.topics.some(t => t.id === progress.last_accessed_lecture_id);
        if (lectureExists) {
          targetLectureId = progress.last_accessed_lecture_id;
        }
      }
      
      // Fallback to first lecture if no last accessed or it doesn't exist
      if (!targetLectureId && course.topics.length > 0) {
        targetLectureId = course.topics[0].id;
      }
      
      if (targetLectureId) {
        router.push(`/course/${course.id}/lesson/${targetLectureId}`);
      } else {
        // If no lectures, go to course detail page
        router.push(`/course/${course.id}`);
      }
    } catch (error) {
      console.error('Error continuing learning:', error);
      router.push(`/course/${course.id}`);
    }
  };
  
  if (userProfile?.role !== 'student') {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.emptyContainer}>
          <ThemedText
            style={[
              Typography.body,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Only students can view enrolled courses
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  if (loading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <LottieLoader size={150} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText
            style={[
              Typography.h1,
              {
                color: colors.text,
                fontSize: 24,
                fontWeight: '700',
              },
            ]}
          >
            My Learning
          </ThemedText>
          <ThemedText
            style={[
              Typography.body,
              {
                color: colors.textSecondary,
                marginTop: Spacing.sm,
              },
            ]}
          >
            Continue your courses
          </ThemedText>
        </View>
        
        {/* Enrolled Courses */}
        {enrolledCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="play.circle.fill" size={64} color={colors.textTertiary} />
            <ThemedText
              style={[
                Typography.h3,
                {
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '600',
                  marginTop: Spacing.lg,
                  marginBottom: Spacing.sm,
                },
              ]}
            >
              No courses yet
            </ThemedText>
            <ThemedText
              style={[
                Typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  paddingHorizontal: Spacing.xl,
                },
              ]}
            >
              Start your first course and track your progress here 🚀
            </ThemedText>
          </View>
        ) : (
          <View style={styles.coursesList}>
            {enrolledCourses.map((item, index) => (
              <Animated.View
                key={item.course.id}
                entering={FadeInDown.duration(400).delay(index * 100)}
              >
                <TouchableOpacity
                  style={styles.courseCard}
                  onPress={() => handleCoursePress(item.course.id)}
                  activeOpacity={0.85}
                >
                  {/* Thumbnail */}
                  <View style={styles.thumbnailContainer}>
                    {item.course.thumbnail ? (
                      <Image
                        source={{ uri: item.course.thumbnail }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <IconSymbol name="play.circle.fill" size={40} color={colors.textTertiary} />
                      </View>
                    )}
                    
                    {/* Progress Overlay */}
                    {item.progress.completion_percentage > 0 && (
                      <View style={styles.progressOverlay}>
                        <ProgressArc
                          progress={item.progress.completion_percentage / 100}
                          size={56}
                          strokeWidth={5}
                          showGlow={item.progress.status === 'completed'}
                        />
                        <View style={styles.progressTextOverlay}>
                          <ThemedText
                            style={[
                              Typography.caption,
                              {
                                color: colors.text,
                                fontSize: 11,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {item.progress.completion_percentage}%
                          </ThemedText>
                        </View>
                      </View>
                    )}
                  </View>
                  
                  {/* Content */}
                  <View style={styles.courseContent}>
                    <ThemedText
                      style={[
                        Typography.h3,
                        {
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: '700',
                          marginBottom: Spacing.xs,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.course.title}
                    </ThemedText>
                    
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: colors.textSecondary,
                          fontSize: 13,
                          marginBottom: Spacing.sm,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.course.trainerName}
                    </ThemedText>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${item.progress.completion_percentage}%`,
                              backgroundColor: item.progress.status === 'completed' 
                                ? '#4CAF50' 
                                : colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText
                        style={[
                          Typography.caption,
                          {
                            color: colors.textSecondary,
                            fontSize: 12,
                            marginTop: Spacing.xs,
                          },
                        ]}
                      >
                        {item.progress.completed_lectures_count} of {item.progress.total_lectures} lectures completed
                        {item.progress.status === 'completed' && ' ✓'}
                      </ThemedText>
                    </View>
                    
                    {/* Continue Button */}
                    <TouchableOpacity
                      style={[
                        styles.continueButton,
                        item.progress.status === 'completed' && {
                          backgroundColor: '#4CAF50',
                        },
                      ]}
                      onPress={() => handleContinueLearning(item.course, item.progress)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol 
                        name={item.progress.status === 'completed' ? 'checkmark.circle.fill' : 'play.fill'} 
                        size={16} 
                        color={colors.text} 
                      />
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: '600',
                            marginLeft: Spacing.xs,
                          },
                        ]}
                      >
                        {item.progress.status === 'completed' 
                          ? 'Review Course' 
                          : item.progress.completion_percentage > 0 
                            ? 'Continue Learning' 
                            : 'Start Learning'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Base styles that don't depend on colors
const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  coursesList: {
    gap: Spacing.lg,
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
    backgroundColor: '#F7F9FA',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8EAEB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

// Function to get dynamic styles based on colors
const getStyles = (colors: typeof Colors.dark) => StyleSheet.create({
  ...baseStyles,
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Glows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailContainer: {
    width: 140,
    height: 140,
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
  },
  progressBarFill: {
    ...baseStyles.progressBarFill,
    backgroundColor: colors.primary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
});
