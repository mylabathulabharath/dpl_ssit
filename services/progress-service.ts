/**
 * Progress Service - Core Learning Engine
 * 
 * This service handles ALL progress tracking operations.
 * Progress is stored in the database and calculated server-side.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  UserCourseProgress,
  UserLectureProgress,
  LectureProgressResponse,
  CourseProgressSummary,
  ProgressUpdatePayload,
  ProgressStatus,
} from '@/types/progress';
import { Course, Topic } from '@/types/course';

const USER_COURSE_PROGRESS_COLLECTION = 'user_course_progress';
const USER_LECTURE_PROGRESS_COLLECTION = 'user_lecture_progress';

/**
 * Get or create UserCourseProgress
 * Ensures one progress record per user per course
 */
async function getOrCreateCourseProgress(
  userId: string,
  courseId: string,
  totalLectures: number
): Promise<UserCourseProgress> {
  const progressId = `${userId}_${courseId}`;
  const progressRef = doc(db, USER_COURSE_PROGRESS_COLLECTION, progressId);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return {
      id: progressSnap.id,
      ...progressSnap.data(),
    } as UserCourseProgress;
  }

  // Create new progress record
  const newProgress: Omit<UserCourseProgress, 'id'> = {
    user_id: userId,
    course_id: courseId,
    completed_lectures_count: 0,
    total_lectures: totalLectures,
    completion_percentage: 0,
    last_accessed_lecture_id: null,
    last_played_timestamp: 0,
    status: 'not_started',
    started_at: null,
    last_accessed_at: new Date().toISOString(),
    completed_at: null,
  };

  await setDoc(progressRef, newProgress);
  return { id: progressId, ...newProgress };
}

/**
 * Recalculate course progress (SERVER-SIDE ONLY)
 * This is the single source of truth for progress calculation
 */
async function recalculateCourseProgress(
  userId: string,
  courseId: string
): Promise<UserCourseProgress> {
  // Get all lecture progress for this course
  const lectureProgressQuery = query(
    collection(db, USER_LECTURE_PROGRESS_COLLECTION),
    where('user_id', '==', userId),
    where('course_id', '==', courseId)
  );
  const lectureProgressSnap = await getDocs(lectureProgressQuery);

  // Count completed lectures
  const completedLectures = lectureProgressSnap.docs.filter(
    (doc) => doc.data().is_completed === true
  ).length;

  // Get course to get total lectures
  const { getCourseById } = await import('@/services/course-service');
  const course = await getCourseById(courseId);
  if (!course) {
    throw new Error(`Course ${courseId} not found`);
  }

  const totalLectures = course.topics.length;

  // Calculate completion percentage
  const completionPercentage = totalLectures > 0
    ? Math.round((completedLectures / totalLectures) * 100)
    : 0;

  // Determine status
  let status: ProgressStatus = 'not_started';
  if (completionPercentage === 100) {
    status = 'completed';
  } else if (completionPercentage > 0 || completedLectures > 0) {
    status = 'in_progress';
  }

  // Get or create course progress
  const courseProgress = await getOrCreateCourseProgress(
    userId,
    courseId,
    totalLectures
  );

  // Update course progress
  const progressId = courseProgress.id || `${userId}_${courseId}`;
  const progressRef = doc(db, USER_COURSE_PROGRESS_COLLECTION, progressId);

  const updateData: Partial<UserCourseProgress> = {
    completed_lectures_count: completedLectures,
    total_lectures: totalLectures,
    completion_percentage: completionPercentage,
    status,
    last_accessed_at: new Date().toISOString(),
  };

  // Set started_at if not set and progress > 0
  if (!courseProgress.started_at && completedLectures > 0) {
    updateData.started_at = new Date().toISOString();
  }

  // Set completed_at if 100%
  if (completionPercentage === 100 && !courseProgress.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  await updateDoc(progressRef, updateData);

  return {
    ...courseProgress,
    ...updateData,
    id: progressId,
  } as UserCourseProgress;
}

/**
 * Get lecture progress
 * Returns watched duration and completion status
 */
export async function getLectureProgress(
  userId: string,
  courseId: string,
  lectureId: string
): Promise<LectureProgressResponse> {
  try {
    const progressId = `${userId}_${courseId}_${lectureId}`;
    const progressRef = doc(db, USER_LECTURE_PROGRESS_COLLECTION, progressId);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      const data = progressSnap.data() as UserLectureProgress;
      return {
        watched_duration_seconds: data.watched_duration_seconds || 0,
        is_completed: data.is_completed || false,
        lecture_id: lectureId,
      };
    }

    // Return default if no progress exists
    return {
      watched_duration_seconds: 0,
      is_completed: false,
      lecture_id: lectureId,
    };
  } catch (error) {
    console.error('Error fetching lecture progress:', error);
    return {
      watched_duration_seconds: 0,
      is_completed: false,
      lecture_id: lectureId,
    };
  }
}

/**
 * Update lecture progress
 * Called every 10 seconds during playback and on pause/exit
 */
export async function updateLectureProgress(
  userId: string,
  payload: ProgressUpdatePayload
): Promise<void> {
  try {
    const { course_id, lecture_id, watched_duration_seconds, is_completed } = payload;

    // Get course to validate lecture exists and get duration
    const { getCourseById } = await import('@/services/course-service');
    const course = await getCourseById(course_id);
    if (!course) {
      throw new Error(`Course ${course_id} not found`);
    }

    const lecture = course.topics.find((t) => t.id === lecture_id);
    if (!lecture) {
      throw new Error(`Lecture ${lecture_id} not found in course`);
    }

    // Convert lecture duration from minutes to seconds
    const lectureDurationSeconds = lecture.videoDuration * 60;

    // Validate watched duration doesn't exceed lecture duration
    const validWatchedDuration = Math.min(
      watched_duration_seconds,
      lectureDurationSeconds
    );

    // Determine if completed (90% threshold OR explicit completion)
    const completionThreshold = lectureDurationSeconds * 0.9;
    const shouldBeCompleted = is_completed || validWatchedDuration >= completionThreshold;

    // Upsert lecture progress
    const progressId = `${userId}_${course_id}_${lecture_id}`;
    const progressRef = doc(db, USER_LECTURE_PROGRESS_COLLECTION, progressId);

    const lectureProgress: Omit<UserLectureProgress, 'id'> = {
      user_id: userId,
      course_id,
      lecture_id,
      watched_duration_seconds: validWatchedDuration,
      is_completed: shouldBeCompleted,
      last_watched_at: new Date().toISOString(),
    };

    await setDoc(progressRef, lectureProgress, { merge: true });

    // Update course progress (last accessed lecture and timestamp)
    const courseProgressId = `${userId}_${course_id}`;
    const courseProgressRef = doc(db, USER_COURSE_PROGRESS_COLLECTION, courseProgressId);

    await updateDoc(courseProgressRef, {
      last_accessed_lecture_id: lecture_id,
      last_played_timestamp: validWatchedDuration,
      last_accessed_at: new Date().toISOString(),
    });

    // Recalculate course progress (this handles completion percentage)
    await recalculateCourseProgress(userId, course_id);
  } catch (error) {
    console.error('Error updating lecture progress:', error);
    throw error;
  }
}

/**
 * Get course progress
 * Returns full UserCourseProgress for a course
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<UserCourseProgress | null> {
  try {
    const progressId = `${userId}_${courseId}`;
    const progressRef = doc(db, USER_COURSE_PROGRESS_COLLECTION, progressId);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return {
        id: progressSnap.id,
        ...progressSnap.data(),
      } as UserCourseProgress;
    }

    // If no progress exists, create it
    const { getCourseById } = await import('@/services/course-service');
    const course = await getCourseById(courseId);
    if (!course) {
      return null;
    }

    return await getOrCreateCourseProgress(userId, courseId, course.topics.length);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return null;
  }
}

/**
 * Get all course progress for a user (My Learnings)
 * Returns summary of all courses with progress
 */
export async function getMyLearnings(
  userId: string
): Promise<CourseProgressSummary[]> {
  try {
    // Get all course progress for user
    const progressQuery = query(
      collection(db, USER_COURSE_PROGRESS_COLLECTION),
      where('user_id', '==', userId)
    );
    const progressSnap = await getDocs(progressQuery);

    const { getCourseById } = await import('@/services/course-service');

    // Fetch course details for each progress record
    const learnings = await Promise.all(
      progressSnap.docs.map(async (doc) => {
        const progress = doc.data() as UserCourseProgress;
        const course = await getCourseById(progress.course_id);

        if (!course) {
          return null;
        }

        return {
          course_id: progress.course_id,
          course_title: course.title,
          completion_percentage: progress.completion_percentage,
          status: progress.status,
          last_accessed_lecture_id: progress.last_accessed_lecture_id,
          last_played_timestamp: progress.last_played_timestamp,
          total_lectures: progress.total_lectures,
          completed_lectures_count: progress.completed_lectures_count,
          thumbnail: course.thumbnail,
          instructor: course.trainerName,
        } as CourseProgressSummary;
      })
    );

    return learnings.filter((item) => item !== null) as CourseProgressSummary[];
  } catch (error) {
    console.error('Error fetching my learnings:', error);
    return [];
  }
}

/**
 * Initialize course progress on enrollment
 * Called when user enrolls in a course
 */
export async function initializeCourseProgress(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    const { getCourseById } = await import('@/services/course-service');
    const course = await getCourseById(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    await getOrCreateCourseProgress(userId, courseId, course.topics.length);
  } catch (error) {
    console.error('Error initializing course progress:', error);
    throw error;
  }
}

/**
 * Get next lecture ID
 * Returns the next lecture after the current one, or null if last
 */
export async function getNextLectureId(
  courseId: string,
  currentLectureId: string
): Promise<string | null> {
  try {
    const { getCourseById } = await import('@/services/course-service');
    const course = await getCourseById(courseId);
    if (!course) {
      return null;
    }

    // Sort topics by orderIndex
    const sortedTopics = [...course.topics].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );

    const currentIndex = sortedTopics.findIndex((t) => t.id === currentLectureId);
    if (currentIndex === -1 || currentIndex === sortedTopics.length - 1) {
      return null;
    }

    return sortedTopics[currentIndex + 1].id;
  } catch (error) {
    console.error('Error getting next lecture:', error);
    return null;
  }
}

