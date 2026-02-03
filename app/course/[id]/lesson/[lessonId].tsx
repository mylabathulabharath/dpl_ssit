import { LessonList } from '@/components/lesson-list';
import { ThemedText } from '@/components/themed-text';
import { VideoPlayer } from '@/components/video-player';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCourseById } from '@/services/course-service';
import { Course, Topic } from '@/types/course';
import { useAuth } from '@/contexts/auth-context';
import { updateLastAccessed, getEnrollment } from '@/services/enrollment-service';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { 
  getLectureProgress, 
  updateLectureProgress, 
  getNextLectureId 
} from '@/services/progress-service';

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
  
  const currentTopicIndex = course.topics.findIndex(t => t.id === lessonId);
  const currentTopic = currentTopicIndex >= 0 ? course.topics[currentTopicIndex] : course.topics[0];
  const nextTopic = currentTopicIndex >= 0 && currentTopicIndex < course.topics.length - 1
    ? course.topics[currentTopicIndex + 1]
    : null;
  
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
      
      {/* Video Player */}
      <VideoPlayer
        source={{ uri: videoUri }}
        onBack={() => router.back()}
        onFullscreenChange={setIsFullscreen}
        onVideoComplete={handleVideoComplete}
        initialPosition={initialPosition}
        onProgressUpdate={handleProgressUpdate}
        onProgressSave={handleProgressSave}
      />
      
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
            {currentTopic.title}
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
});
