import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCourseById } from '@/services/course-service';
import { enrollInCourse, getEnrollment } from '@/services/enrollment-service';
import { getCourseProgress } from '@/services/progress-service';
import { getTrainerProfile } from '@/services/trainer-service';
import { Course } from '@/types/course';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
const BANNER_HEIGHT = width * 0.6;

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [trainerCredentials, setTrainerCredentials] = useState<string | undefined>(undefined);
  const [courseProgress, setCourseProgress] = useState<{ completion_percentage: number; last_accessed_lecture_id: string | null } | null>(null);
  
  useEffect(() => {
    if (id) {
      loadCourse();
      if (userProfile && userProfile.role === 'student') {
        loadCourseProgress();
      }
    }
  }, [id, userProfile]);

  const loadCourseProgress = async () => {
    try {
      if (!userProfile || !id) return;
      const progress = await getCourseProgress(userProfile.uid, id);
      if (progress) {
        setCourseProgress({
          completion_percentage: progress.completion_percentage,
          last_accessed_lecture_id: progress.last_accessed_lecture_id,
        });
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  };
  
  const loadCourse = async () => {
    try {
      if (id) {
        const courseData = await getCourseById(id);
        setCourse(courseData);
        
        // If trainer credentials not in course, try to fetch from trainer profile
        if (courseData && !courseData.trainerCredentials) {
          try {
            const trainerProfile = await getTrainerProfile(courseData.trainerId);
            if (trainerProfile?.credentials) {
              setTrainerCredentials(trainerProfile.credentials);
            }
          } catch (error) {
            console.error('Error loading trainer profile:', error);
          }
        } else if (courseData?.trainerCredentials) {
          setTrainerCredentials(courseData.trainerCredentials);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
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
  
  const handleStartLearning = async () => {
    if (!course) {
      Alert.alert('Error', 'Course not loaded');
      return;
    }
    
    if (course.topics.length === 0) {
      Alert.alert('Error', 'This course has no lessons yet');
      return;
    }
    
    if (!userProfile || userProfile.role !== 'student') {
      Alert.alert('Error', 'Only students can enroll in courses');
      return;
    }

    try {
      setEnrolling(true);
      
      // Check if already enrolled
      const enrollment = await getEnrollment(userProfile.uid, course.id);
      
      // If not enrolled, enroll now
      if (!enrollment) {
        await enrollInCourse(userProfile.uid, course.id);
      }
      
      // Get course progress to determine where to navigate
      const progress = await getCourseProgress(userProfile.uid, course.id);
      
      let targetLectureId: string | null = null;
      
      if (progress && progress.last_accessed_lecture_id) {
        // Resume from last accessed lecture
        targetLectureId = progress.last_accessed_lecture_id;
      } else {
        // Start from first lecture
        const firstTopic = course.topics[0];
        targetLectureId = firstTopic?.id || null;
      }
      
      if (!targetLectureId) {
        Alert.alert('Error', 'This course has no valid lessons');
        return;
      }
      
      const routePath = `/course/${id}/lesson/${targetLectureId}`;
      console.log('Navigating to:', routePath);
      router.push(routePath);
    } catch (error) {
      console.error('Error starting learning:', error);
      Alert.alert('Error', 'Failed to start learning. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };
  
  const renderStars = (rating: number = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };
  
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A435F0" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!course) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ThemedText
            style={[
              Typography.body,
              {
                color: '#6A6F73',
              },
            ]}
          >
            Course not found
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color="#1C1D1F" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <IconSymbol name="paperplane.fill" size={20} color="#1C1D1F" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner/Thumbnail */}
        <View style={styles.bannerContainer}>
          {course.thumbnail ? (
            <Image
              source={{ uri: course.thumbnail }}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: '#D1D7DC' }]}>
              <ThemedText style={{ color: '#6A6F73', fontSize: 16 }}>Course Image</ThemedText>
            </View>
          )}
        </View>
        
        {/* Course Title */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.titleSection}>
          <ThemedText
            style={[
              Typography.display,
              {
                color: '#1C1D1F',
                fontSize: 24,
                lineHeight: 32,
                fontWeight: '700',
                marginBottom: Spacing.sm,
              },
            ]}
          >
            {course.title}
          </ThemedText>
          
          <ThemedText
            style={[
              Typography.body,
              {
                color: '#6A6F73',
                fontSize: 15,
                lineHeight: 22,
                marginBottom: Spacing.md,
              },
            ]}
          >
            {course.description}
          </ThemedText>
          
          {/* Bestseller Tag */}
          <View style={styles.bestsellerTag}>
            <ThemedText
              style={[
                Typography.caption,
                {
                  color: '#1C1D1F',
                  fontSize: 12,
                  fontWeight: '700',
                },
              ]}
            >
              Bestseller
            </ThemedText>
          </View>
        </Animated.View>
        
        {/* Ratings and Students */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.ratingsSection}>
          <View style={styles.ratingRow}>
            {course.rating && course.rating > 0 ? (
              <>
                <ThemedText
                  style={[
                    Typography.h2,
                    {
                      color: '#B4690E',
                      fontSize: 18,
                      fontWeight: '700',
                      marginRight: Spacing.xs,
                    },
                  ]}
                >
                  {course.rating.toFixed(1)}
                </ThemedText>
                <ThemedText
                  style={[
                    Typography.body,
                    {
                      color: '#E59819',
                      fontSize: 16,
                      marginRight: Spacing.sm,
                    },
                  ]}
                >
                  {renderStars(course.rating)}
                </ThemedText>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: '#6A6F73',
                      fontSize: 14,
                    },
                  ]}
                >
                  {course.ratingCount ? `(${course.ratingCount.toLocaleString()} ratings)` : '(No ratings yet)'}
                  {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                    <ThemedText
                      style={[
                        Typography.bodySmall,
                        {
                          color: '#6A6F73',
                          fontSize: 14,
                        },
                      ]}
                    >
                      {' '}{course.enrollmentCount.toLocaleString()} {course.enrollmentCount === 1 ? 'student' : 'students'}
                    </ThemedText>
                  )}
                </ThemedText>
              </>
            ) : (
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: '#6A6F73',
                    fontSize: 14,
                  },
                ]}
              >
                No ratings yet
                {course.enrollmentCount !== undefined && course.enrollmentCount > 0 && (
                  <ThemedText
                    style={[
                      Typography.bodySmall,
                      {
                        color: '#6A6F73',
                        fontSize: 14,
                      },
                    ]}
                  >
                    {' • '}{course.enrollmentCount.toLocaleString()} {course.enrollmentCount === 1 ? 'student' : 'students'}
                  </ThemedText>
                )}
              </ThemedText>
            )}
          </View>
        </Animated.View>
        
        {/* Instructor */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.instructorSection}>
          <ThemedText
            style={[
              Typography.body,
              {
                color: '#6A6F73',
                fontSize: 14,
              },
            ]}
          >
            Created by{' '}
            <ThemedText
              style={[
                Typography.body,
                {
                  color: '#A435F0',
                  fontSize: 14,
                  fontWeight: '600',
                },
              ]}
            >
              {course.trainerName}
            </ThemedText>
            {(course.trainerCredentials || trainerCredentials) && (
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: '#6A6F73',
                    fontSize: 14,
                  },
                ]}
              >
                {' '}| {course.trainerCredentials || trainerCredentials}
              </ThemedText>
            )}
          </ThemedText>
        </Animated.View>
        
        {/* Course Metadata */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.metadataSection}>
          {course.updatedAt && (
            <View style={styles.metadataItem}>
              <ThemedText style={styles.metadataIcon}>⚠️</ThemedText>
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: '#6A6F73',
                    fontSize: 14,
                  },
                ]}
              >
                Last updated {new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </ThemedText>
            </View>
          )}
          
          {course.language && (
            <View style={styles.metadataItem}>
              <ThemedText style={styles.metadataIcon}>🌐</ThemedText>
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: '#6A6F73',
                    fontSize: 14,
                  },
                ]}
              >
                {course.language}
              </ThemedText>
            </View>
          )}
          
          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataIcon}>📝</ThemedText>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: '#6A6F73',
                  fontSize: 14,
                },
              ]}
            >
              English, Arabic,{' '}
              <ThemedText
                style={[
                  Typography.bodySmall,
                  {
                    color: '#A435F0',
                    fontSize: 14,
                  },
                ]}
              >
                29 more
              </ThemedText>
            </ThemedText>
          </View>
        </Animated.View>
        
        {/* Curriculum */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.curriculumSection}>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: '#1C1D1F',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: Spacing.sm,
              },
            ]}
          >
            Curriculum
          </ThemedText>
          
          <ThemedText
            style={[
              Typography.bodySmall,
              {
                color: '#6A6F73',
                fontSize: 14,
                marginBottom: Spacing.lg,
              },
            ]}
          >
            {course.topics.length} sections • {course.topics.length} lectures • {formatDuration(course.totalDuration)} total length
          </ThemedText>
        </Animated.View>
        
        {/* Course Includes */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.includesSection}>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: '#1C1D1F',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: Spacing.md,
              },
            ]}
          >
            This course includes
          </ThemedText>
          
          <View style={styles.includesList}>
            <View style={styles.includesItem}>
              <ThemedText style={styles.includesIcon}>∞</ThemedText>
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: '#1C1D1F',
                    fontSize: 14,
                  },
                ]}
              >
                Full lifetime access
              </ThemedText>
            </View>
            
            <View style={styles.includesItem}>
              <ThemedText style={styles.includesIcon}>📱</ThemedText>
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: '#1C1D1F',
                    fontSize: 14,
                  },
                ]}
              >
                Access on mobile, desktop, and TV
              </ThemedText>
            </View>
          </View>
        </Animated.View>
        
        {/* Learning Outcomes */}
        {course.outcomes.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.outcomesSection}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: '#1C1D1F',
                  fontSize: 20,
                  fontWeight: '700',
                  marginBottom: Spacing.md,
                },
              ]}
            >
              What you'll learn
            </ThemedText>
            
            <View style={styles.outcomesList}>
              {course.outcomes.map((outcome, index) => (
                <View key={index} style={styles.outcomeItem}>
                  <ThemedText style={styles.outcomeCheck}>✓</ThemedText>
                  <ThemedText
                    style={[
                      Typography.body,
                      {
                        color: '#1C1D1F',
                        fontSize: 14,
                        flex: 1,
                        marginLeft: Spacing.sm,
                        lineHeight: 22,
                      },
                    ]}
                  >
                    {outcome}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Course Content */}
        {course.topics.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.contentSection}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: '#1C1D1F',
                  fontSize: 20,
                  fontWeight: '700',
                  marginBottom: Spacing.md,
                },
              ]}
            >
              Course Content
            </ThemedText>
            
            <View style={styles.topicsList}>
              {course.topics.map((topic, index) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicItem,
                    index < course.topics.length - 1 && styles.topicItemBorder,
                  ]}
                  onPress={() => router.push(`/course/${id}/lesson/${topic.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicContent}>
                    <View style={styles.topicNumber}>
                      <ThemedText
                        style={[
                          Typography.bodySmall,
                          {
                            color: '#6A6F73',
                            fontSize: 14,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.topicInfo}>
                      <ThemedText
                        style={[
                          Typography.body,
                          {
                            color: '#1C1D1F',
                            fontSize: 14,
                            marginBottom: Spacing.xs,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {topic.title}
                      </ThemedText>
                      <ThemedText
                        style={[
                          Typography.caption,
                          {
                            color: '#6A6F73',
                            fontSize: 12,
                          },
                        ]}
                      >
                        {formatDuration(topic.videoDuration)}
                      </ThemedText>
                    </View>
                    
                    <IconSymbol name="chevron.right" size={20} color="#6A6F73" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* CTA Button */}
        <Animated.View entering={FadeInDown.duration(400).delay(450)} style={styles.ctaSection}>
          <Button
            title={
              enrolling 
                ? "Loading..." 
                : courseProgress && courseProgress.completion_percentage > 0
                  ? "Continue Learning"
                  : "Start Learning"
            }
            onPress={handleStartLearning}
            variant="primary"
            size="large"
            fullWidth
            loading={enrolling}
            disabled={enrolling}
          />
        </Animated.View>
        
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
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  bannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: '#D1D7DC',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  bestsellerTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3CA52',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: Spacing.xs,
  },
  ratingsSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  metadataSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  curriculumSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#D1D7DC',
    paddingTop: Spacing.lg,
  },
  includesSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  includesList: {
    gap: Spacing.md,
  },
  includesItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  includesIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  outcomesSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  outcomesList: {
    gap: Spacing.md,
  },
  outcomeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  outcomeCheck: {
    fontSize: 16,
    color: '#1C1D1F',
    fontWeight: '700',
    marginTop: 2,
  },
  contentSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  topicsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D7DC',
  },
  topicItem: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  topicItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D7DC',
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  topicInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  ctaSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
});
