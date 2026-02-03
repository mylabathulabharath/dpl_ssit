import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { initializeCourseProgress } from './progress-service';

const ENROLLMENTS_COLLECTION = 'enrollments';
const PROGRESS_COLLECTION = 'progress';

export interface Enrollment {
  id?: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  lastAccessedAt?: string;
}

export interface LessonProgress {
  id?: string;
  studentId: string;
  courseId: string;
  topicId: string;
  completed: boolean;
  watchedDuration?: number; // in seconds
  lastWatchedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number; // 0-1
  lastAccessedAt: string;
}

/**
 * Enroll a student in a course
 */
export async function enrollInCourse(
  studentId: string,
  courseId: string
): Promise<string> {
  try {
    // Check if already enrolled
    const existingEnrollment = await getEnrollment(studentId, courseId);
    if (existingEnrollment) {
      return existingEnrollment.id!;
    }

    // Create enrollment
    const enrollment: Omit<Enrollment, 'id'> = {
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, ENROLLMENTS_COLLECTION), enrollment);
    
    // Initialize course progress tracking
    try {
      await initializeCourseProgress(studentId, courseId);
    } catch (progressError) {
      console.error('Error initializing course progress:', progressError);
      // Don't fail enrollment if progress init fails
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
}

/**
 * Get enrollment for a student and course
 */
export async function getEnrollment(
  studentId: string,
  courseId: string
): Promise<Enrollment | null> {
  try {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Enrollment;
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    throw error;
  }
}

/**
 * Get all enrollments for a student
 */
export async function getStudentEnrollments(
  studentId: string
): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Enrollment[];
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    throw error;
  }
}

/**
 * Update last accessed time for an enrollment
 */
export async function updateLastAccessed(
  enrollmentId: string
): Promise<void> {
  try {
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    await updateDoc(enrollmentRef, {
      lastAccessedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating last accessed:', error);
    throw error;
  }
}

/**
 * Get course progress for a student
 */
export async function getCourseProgress(
  studentId: string,
  courseId: string,
  totalLessons: number
): Promise<CourseProgress> {
  try {
    const q = query(
      collection(db, PROGRESS_COLLECTION),
      where('studentId', '==', studentId),
      where('courseId', '==', courseId),
      where('completed', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const completedLessons = querySnapshot.size;
    const progress = totalLessons > 0 ? completedLessons / totalLessons : 0;

    // Get enrollment to get last accessed
    const enrollment = await getEnrollment(studentId, courseId);
    
    return {
      courseId,
      totalLessons,
      completedLessons,
      progress,
      lastAccessedAt: enrollment?.lastAccessedAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return {
      courseId,
      totalLessons,
      completedLessons: 0,
      progress: 0,
      lastAccessedAt: new Date().toISOString(),
    };
  }
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(
  studentId: string,
  courseId: string,
  topicId: string
): Promise<void> {
  try {
    const progressId = `${studentId}_${courseId}_${topicId}`;
    const progressRef = doc(db, PROGRESS_COLLECTION, progressId);
    
    await setDoc(progressRef, {
      studentId,
      courseId,
      topicId,
      completed: true,
      completedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error marking lesson completed:', error);
    throw error;
  }
}

/**
 * Get all enrolled courses with progress for a student
 */
export async function getEnrolledCoursesWithProgress(
  studentId: string
): Promise<Array<{ course: Course; progress: CourseProgress; enrollment: Enrollment }>> {
  try {
    const enrollments = await getStudentEnrollments(studentId);
    const { getCourseById } = await import('@/services/course-service');
    
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await getCourseById(enrollment.courseId);
        if (!course) return null;
        
        const progress = await getCourseProgress(
          studentId,
          enrollment.courseId,
          course.totalTopics
        );
        
        return {
          course,
          progress,
          enrollment,
        };
      })
    );

    return coursesWithProgress.filter((item) => item !== null) as Array<{
      course: Course;
      progress: CourseProgress;
      enrollment: Enrollment;
    }>;
  } catch (error) {
    console.error('Error fetching enrolled courses with progress:', error);
    throw error;
  }
}

