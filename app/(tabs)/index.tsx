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
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = Spacing.md;

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'tutor') {
        router.replace('/(tutor)/dashboard');
        return;
      }
    }
    loadCourses();
  }, [userProfile]);
  
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
    console.log('Navigating to course:', courseId);
    // Use href for Expo Router navigation
    router.push(`/course/${courseId}`);
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
  
  if (userProfile?.role === 'tutor') {
    return null;
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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Logo variant="small" />
            <ThemedText
              style={[
                Typography.display,
                {
                  color: colors.text,
                  fontSize: 28,
                  fontWeight: '700',
                  marginLeft: Spacing.sm,
                },
              ]}
            >
              DPL
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <UserMenu />
          </View>
        </View>
        
        {/* Welcome Message */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.welcomeSection}>
          <ThemedText
            style={[
              Typography.h1,
              {
                color: '#1C1D1F',
                fontSize: 24,
                fontWeight: '700',
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
                fontSize: 15,
              },
            ]}
          >
            Continue your learning journey
          </ThemedText>
        </Animated.View>
        
        {/* Top Courses Sections - Grouped by Category */}
        {(() => {
          // Group courses by category
          const coursesByCategory: { [key: string]: Course[] } = {};
          courses.forEach((course) => {
            const category = course.category || 'Development';
            if (!coursesByCategory[category]) {
              coursesByCategory[category] = [];
            }
            coursesByCategory[category].push(course);
          });

          // Get unique categories, limit to 3 sections
          const categories = Object.keys(coursesByCategory).slice(0, 3);

          return categories.map((category, categoryIndex) => {
            const categoryCourses = coursesByCategory[category];
            if (categoryCourses.length === 0) return null;

            return (
              <Animated.View 
                key={category} 
                entering={FadeInDown.duration(400).delay(100 + categoryIndex * 100)} 
                style={styles.section}
              >
                <ThemedText
                  style={[
                    Typography.h2,
                    {
                      color: colors.text,
                      fontSize: 22,
                      fontWeight: '700',
                      marginBottom: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                    },
                  ]}
                >
                  Top courses in{' '}
                  <ThemedText
                    style={[
                      Typography.h2,
                      {
                        color: colors.primary,
                        fontSize: 22,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {category}
                  </ThemedText>
                </ThemedText>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.coursesList}
                >
                  {categoryCourses.slice(0, 5).map((course, index) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[styles.courseCard, { width: CARD_WIDTH, backgroundColor: colors.surface }]}
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
                    <View style={styles.courseContent}>
                      <ThemedText
                        style={[
                          Typography.h3,
                          {
                            color: colors.text,
                            fontSize: 16,
                            fontWeight: '700',
                            marginBottom: Spacing.xs,
                            lineHeight: 22,
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
                            fontSize: 13,
                            marginBottom: Spacing.xs,
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
                                    fontSize: 14,
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
                                    fontSize: 14,
                                    marginRight: Spacing.sm,
                                  },
                                ]}
                              >
                                {renderStars(course.rating)}
                              </ThemedText>
                              {course.ratingCount && course.ratingCount > 0 && (
                                <ThemedText
                                  style={[
                                    Typography.caption,
                                    {
                                      color: colors.textSecondary,
                                      fontSize: 12,
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
                                  color: colors.textSecondary,
                                  fontSize: 12,
                                  marginLeft: course.rating && course.rating > 0 ? Spacing.xs : 0,
                                },
                              ]}
                            >
                              {course.enrollmentCount.toLocaleString()} {course.enrollmentCount === 1 ? 'student' : 'students'}
                            </ThemedText>
                          )}
                        </View>
                      ) : (
                        <ThemedText
                          style={[
                            Typography.caption,
                            {
                              color: colors.textSecondary,
                              fontSize: 12,
                            },
                          ]}
                        >
                          New course
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
            );
          });
        })()}
        
        {courses.length === 0 && !loading && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    minHeight: 44,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 44,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  welcomeSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  coursesList: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
    gap: CARD_SPACING,
  },
  courseCard: {
    marginRight: CARD_SPACING,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Glows.card,
  },
  thumbnailContainer: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.dark.surfaceElevated,
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
  courseContent: {
    padding: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
});
