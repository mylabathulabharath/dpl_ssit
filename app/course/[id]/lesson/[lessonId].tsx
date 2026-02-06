import { LessonList } from '@/components/lesson-list';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VideoPlayer } from '@/components/video-player';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCourseById } from '@/services/course-service';
import { getEnrollment, updateLastAccessed } from '@/services/enrollment-service';
import {
  getLectureProgress,
  updateLectureProgress
} from '@/services/progress-service';
import { updateVideoStatusAndPoll } from '@/services/video-status-service';
import { Course } from '@/types/course';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LessonPlayerScreen() {
  const { id, lessonId } = useLocalSearchParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialPosition, setInitialPosition] = useState<number>(0);
  const [lectureDuration, setLectureDuration] = useState<number>(0);
  
  useEffect(() => {
    if (id && lessonId) {
      loadCourse();
      loadLectureProgress();
    } else if (id && !lessonId) {
      console.error('Missing lessonId in route');
      router.back();
    }
  }, [id, lessonId]);

  // Load lecture progress to resume from last position
  const loadLectureProgress = async () => {
    try {
      if (!userProfile || !id || !lessonId) return;
      
      const progress = await getLectureProgress(userProfile.uid, id, lessonId);
      setInitialPosition(progress.watched_duration_seconds);
      
      // Get lecture duration from course
      if (course) {
        const lecture = course.topics.find(t => t.id === lessonId);
        if (lecture) {
          setLectureDuration(lecture.videoDuration * 60); // Convert minutes to seconds
        }
      }
    } catch (error) {
      console.error('Error loading lecture progress:', error);
    }
  };
  
  useEffect(() => {
    // Update last accessed when lesson is viewed
    if (course && userProfile && userProfile.role === 'student') {
      updateLastAccessedForCourse();
    }
  }, [course, userProfile, lessonId]);
  
  const updateLastAccessedForCourse = async () => {
    try {
      if (!userProfile || !course) return;
      const enrollment = await getEnrollment(userProfile.uid, course.id);
      if (enrollment && enrollment.id) {
        await updateLastAccessed(enrollment.id);
      }
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  };
  
  const loadCourse = async () => {
    try {
      if (id) {
        const courseData = await getCourseById(id);
        if (!courseData) {
          console.error('Course not found');
          router.back();
          return;
        }
        
        if (!courseData.topics || courseData.topics.length === 0) {
          console.error('Course has no topics');
          router.back();
          return;
        }
        
        setCourse(courseData);
        
        // Load lecture progress after course is loaded
        if (userProfile && lessonId) {
          const progress = await getLectureProgress(userProfile.uid, id, lessonId);
          setInitialPosition(progress.watched_duration_seconds);
          
          const lecture = courseData.topics.find(t => t.id === lessonId);
          if (lecture) {
            setLectureDuration(lecture.videoDuration * 60);
          }
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };
  
  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // Memoize currentTopic to prevent hook dependency issues
  const currentTopic = useMemo(() => {
    if (!course || !lessonId) return null;
    const topicIndex = course.topics.findIndex(t => t.id === lessonId);
    return topicIndex >= 0 ? course.topics[topicIndex] : course.topics[0] || null;
  }, [course, lessonId]);
  
  // Calculate nextTopic after currentTopic is memoized
  const nextTopic = useMemo(() => {
    if (!course || !currentTopic) return null;
    const currentTopicIndex = course.topics.findIndex(t => t.id === currentTopic.id);
    return currentTopicIndex >= 0 && currentTopicIndex < course.topics.length - 1
      ? course.topics[currentTopicIndex + 1]
      : null;
  }, [course, currentTopic]);

  // Check if video is processing - only after course is loaded
  const isVideoProcessing = currentTopic?.videoProcessingStatus === 'PROCESSING';
  const isVideoFailed = currentTopic?.videoProcessingStatus === 'FAILED';
  
  // Poll status if video is processing - use stable dependencies
  useEffect(() => {
    // Only run if we have all required data
    if (!course || !currentTopic || !id || !lessonId) {
      console.log(`🎬 [LESSON PLAYER] Skipping polling - missing data:`, {
        hasCourse: !!course,
        hasCurrentTopic: !!currentTopic,
        hasId: !!id,
        hasLessonId: !!lessonId
      });
      return;
    }
    
    const topicId = currentTopic.id;
    const videoJobId = currentTopic.videoJobId;
    const videoUrl = currentTopic.videoUrl;
    const processingStatus = currentTopic.videoProcessingStatus;
    
    const shouldPoll = processingStatus === 'PROCESSING' && videoJobId && videoUrl;
    
    console.log(`🎬 [LESSON PLAYER] Polling check:`, {
      topicId,
      videoJobId,
      videoUrl,
      processingStatus,
      shouldPoll
    });
    
    if (shouldPoll) {
      console.log(`🎬 [LESSON PLAYER] Starting status polling for topic ${topicId}`);
      updateVideoStatusAndPoll(
        id,
        topicId,
        videoJobId,
        videoUrl
      )
        .then(() => {
          console.log(`✅ [LESSON PLAYER] Status polling completed, reloading course...`);
          // Reload course to get updated status
          loadCourse();
        })
        .catch(error => {
          console.error('❌ [LESSON PLAYER] Error polling video status:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, id, lessonId]); // Use only stable primitive dependencies
  
  // Early return AFTER all hooks are called
  if (loading || !course) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  // Convert topics to lessons format for LessonList component
  const lessons = course.topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    duration: `${Math.floor(topic.videoDuration / 60)}:${String(topic.videoDuration % 60).padStart(2, '0')}`,
  }));
  
  const handleLessonPress = (newLessonId: string) => {
    router.replace(`/course/${id}/lesson/${newLessonId}`);
  };
  
  const handleNextLessonPress = (nextLessonId: string) => {
    router.replace(`/course/${id}/lesson/${nextLessonId}`);
  };
  
  const handleVideoComplete = async () => {
    try {
      // Mark lecture as completed via progress service
      if (userProfile && userProfile.role === 'student' && course && lessonId) {
        await updateLectureProgress(userProfile.uid, {
          course_id: course.id,
          lecture_id: lessonId,
          watched_duration_seconds: lectureDuration,
          is_completed: true,
        });
      }
      
      // Auto-navigate to next lesson if available
      if (nextTopic) {
        // Small delay to let completion animation finish
        setTimeout(() => {
          handleNextLessonPress(nextTopic.id);
        }, 500);
      }
    } catch (error) {
      console.error('Error handling video completion:', error);
      // Still navigate even if marking as completed fails
      if (nextTopic) {
        setTimeout(() => {
          handleNextLessonPress(nextTopic.id);
        }, 500);
      }
    }
  };

  // Handle progress updates (every 10 seconds)
  const handleProgressUpdate = async (positionSeconds: number, durationSeconds: number) => {
    try {
      if (!userProfile || !course || !lessonId) return;
      
      await updateLectureProgress(userProfile.uid, {
        course_id: course.id,
        lecture_id: lessonId,
        watched_duration_seconds: positionSeconds,
        is_completed: false, // Will be set to true on completion
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Handle progress save (on pause/exit)
  const handleProgressSave = async (positionSeconds: number, isCompleted: boolean) => {
    try {
      if (!userProfile || !course || !lessonId) return;
      
      await updateLectureProgress(userProfile.uid, {
        course_id: course.id,
        lecture_id: lessonId,
        watched_duration_seconds: positionSeconds,
        is_completed: isCompleted,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Use topic's videoUrl or fallback to demo video
  const videoUri = currentTopic?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Video Processing Message */}
      {isVideoProcessing && (
        <View style={[styles.processingContainer, { backgroundColor: colors.primary + '20' }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.processingText, { color: colors.primary, marginLeft: Spacing.sm }]}>
            Video is being processed. Please wait...
          </ThemedText>
        </View>
      )}
      
      {isVideoFailed && (
        <View style={[styles.processingContainer, { backgroundColor: colors.accent + '20' }]}>
          <IconSymbol name="exclamationmark.circle.fill" size={20} color={colors.accent} />
          <ThemedText style={[styles.processingText, { color: colors.accent, marginLeft: Spacing.sm }]}>
            Video processing failed. Please try uploading again.
          </ThemedText>
        </View>
      )}
      
      {/* Video Player */}
      {!isVideoProcessing && !isVideoFailed && (
        <VideoPlayer
          source={{ uri: videoUri }}
          onBack={() => router.back()}
          onFullscreenChange={setIsFullscreen}
          onVideoComplete={handleVideoComplete}
          initialPosition={initialPosition}
          onProgressUpdate={handleProgressUpdate}
          onProgressSave={handleProgressSave}
        />
      )}
      
      {/* Placeholder when processing */}
      {(isVideoProcessing || isVideoFailed) && (
        <View style={[styles.videoPlaceholder, { backgroundColor: colors.surface }]}>
          <IconSymbol 
            name={isVideoFailed ? "exclamationmark.triangle.fill" : "hourglass"} 
            size={64} 
            color={colors.textTertiary} 
          />
          <ThemedText style={[styles.placeholderText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            {isVideoFailed 
              ? 'Video processing failed' 
              : 'Video is being processed'}
          </ThemedText>
        </View>
      )}
      
      {/* Scrollable Content */}
      {!isFullscreen && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Lesson Metadata */}
        <View style={[styles.metadataContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <ThemedText
            style={[
              Typography.h2,
              {
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
                marginBottom: Spacing.xs,
              },
            ]}
          >
            {currentTopic?.title || 'Loading...'}
          </ThemedText>
          <ThemedText
            style={[
              Typography.bodySmall,
              {
                color: colors.textSecondary,
                fontSize: 14,
              },
            ]}
          >
            {course.title}
          </ThemedText>
          
          {/* Next Lesson */}
          {nextTopic && (
            <TouchableOpacity
              style={[styles.nextLessonButton, { borderTopColor: colors.border }]}
              onPress={() => handleNextLessonPress(nextTopic.id)}
              activeOpacity={0.7}
            >
              <View style={styles.nextLessonContent}>
                <View style={styles.nextLessonInfo}>
                  <ThemedText
                    style={[
                      Typography.caption,
                      {
                        color: colors.textSecondary,
                        fontSize: 12,
                        marginBottom: 2,
                      },
                    ]}
                  >
                    Next Lesson
                  </ThemedText>
                  <ThemedText
                    style={[
                      Typography.body,
                      {
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {nextTopic.title}
                  </ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          <View style={styles.lessonsHeader}>
            <ThemedText
              style={[
                Typography.h2,
                {
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: '700',
                },
              ]}
            >
              Course Content
            </ThemedText>
            <ThemedText
              style={[
                Typography.bodySmall,
                {
                  color: colors.textSecondary,
                  marginTop: Spacing.xs,
                },
              ]}
            >
              {lessons.length} lessons
            </ThemedText>
          </View>
          
          <LessonList
            lessons={lessons}
            currentLessonId={lessonId}
            onLessonPress={handleLessonPress}
          />
        </View>
      </ScrollView>
      )}
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  metadataContainer: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  nextLessonButton: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  nextLessonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextLessonInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  lessonsContainer: {
    paddingBottom: Spacing.xl,
  },
  lessonsHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  processingContainer: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    ...Typography.body,
    fontWeight: '600',
  },
  videoPlaceholder: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Spacing.lg,
    borderRadius: 8,
  },
  placeholderText: {
    ...Typography.body,
  },
});
