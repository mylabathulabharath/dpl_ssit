import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Glows, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { UserMenu } from '@/components/user-menu';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { getCoursesByTrainer } from '@/services/course-service';
import { Course } from '@/types/course';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TutorDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.uid) {
      loadCourses();
    }
  }, [user]);
  
  const loadCourses = async () => {
    try {
      if (user?.uid) {
        const trainerCourses = await getCoursesByTrainer(user.uid);
        setCourses(trainerCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
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
              Instructor
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
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
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
                Manage your courses and students
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tutor)/edit-profile')}
              style={[styles.editProfileButton, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="person.circle" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <ThemedText
              style={[
                Typography.h1,
                {
                  color: colors.accent,
                  fontSize: 32,
                  marginBottom: Spacing.xs,
                },
              ]}
            >
              {courses.length}
            </ThemedText>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Courses Created
            </ThemedText>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <ThemedText
              style={[
                Typography.h1,
                {
                  color: colors.accent,
                  fontSize: 32,
                  marginBottom: Spacing.xs,
                },
              ]}
            >
              0
            </ThemedText>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Total Students
            </ThemedText>
          </View>
        </Animated.View>
        
        {/* Create Course CTA */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <Button
            title="Create New Course"
            onPress={() => router.push('/(tutor)/create-course')}
            variant="primary"
            size="large"
            fullWidth
          />
        </Animated.View>
        
        {/* My Courses */}
        {courses.length > 0 && (
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
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
              My Courses
            </ThemedText>
            
            {courses.map((course, index) => (
              <TouchableOpacity
                key={course.id}
                style={[styles.courseCard, { backgroundColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/(tutor)/edit-course?id=${course.id}`)}
              >
                <View style={styles.courseCardContent}>
                  <ThemedText
                    style={[
                      Typography.h3,
                      {
                        color: colors.text,
                        marginBottom: Spacing.xs,
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
                      },
                    ]}
                  >
                    {course.totalTopics} topics • {Math.round(course.totalDuration / 60)} hours
                    {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        {' • '}{course.enrollmentCount} {course.enrollmentCount === 1 ? 'student' : 'students'}
                      </ThemedText>
                    )}
                  </ThemedText>
                </View>
                <IconSymbol name="pencil" size={20} color={colors.accent} />
              </TouchableOpacity>
            ))}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  editProfileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    alignItems: 'center',
    ...Glows.card,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  actionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
    position: 'relative',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(91, 141, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  infoSection: {
    marginTop: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  courseCard: {
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Glows.card,
  },
  courseCardContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
});

