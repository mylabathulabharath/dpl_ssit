import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, Topic, CourseFormData } from '@/types/course';
import { getCourseRatingStats } from './rating-service';

const COURSES_COLLECTION = 'courses';
const ENROLLMENTS_COLLECTION = 'enrollments';

export async function createCourse(
  courseData: CourseFormData,
  trainerId: string,
  trainerName: string
): Promise<string> {
  try {
    // Calculate totals
    const totalDuration = courseData.topics.reduce(
      (sum, topic) => sum + topic.videoDuration,
      0
    );
    const totalTopics = courseData.topics.length;
    const now = new Date().toISOString();

    const course: Omit<Course, 'id'> = {
      title: courseData.title,
      description: courseData.description,
      thumbnail: courseData.thumbnail,
      outcomes: courseData.outcomes,
      totalDuration,
      totalTopics,
      trainerName,
      trainerId,
      createdAt: now,
      updatedAt: now,
      category: courseData.category || 'Development', // Default to Development if not provided
      language: courseData.language || 'English', // Default to English if not provided
      trainerCredentials: courseData.trainerCredentials,
      rating: 0,
      ratingCount: 0,
      enrollmentCount: 0,
      university_ids: courseData.university_ids || [],
      branch_ids: courseData.branch_ids || [],
      year: courseData.year,
      topics: courseData.topics.map((topic, index) => ({
        ...topic,
        id: `topic-${Date.now()}-${index}`,
      })),
    };

    const docRef = await addDoc(collection(db, COURSES_COLLECTION), course);
    return docRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function getCourses(): Promise<Course[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    
    const courses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
    
    // Fetch dynamic data for all courses (in batches to avoid overwhelming)
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        try {
          const [enrollmentCount, ratingStats] = await Promise.all([
            getEnrollmentCount(course.id),
            getCourseRatingStats(course.id),
          ]);

          return {
            ...course,
            enrollmentCount,
            rating: ratingStats.averageRating,
            ratingCount: ratingStats.ratingCount,
          };
        } catch (error) {
          console.error(`Error fetching stats for course ${course.id}:`, error);
          return {
            ...course,
            enrollmentCount: 0,
            rating: 0,
            ratingCount: 0,
          };
        }
      })
    );
    
    // Sort by createdAt in descending order (newest first)
    return coursesWithStats.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

/**
 * Get enrollment count for a course
 */
async function getEnrollmentCount(courseId: string): Promise<number> {
  try {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching enrollment count:', error);
    return 0;
  }
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const courseData = {
        id: docSnap.id,
        ...docSnap.data(),
      } as Course;

      // Fetch dynamic data
      const [enrollmentCount, ratingStats] = await Promise.all([
        getEnrollmentCount(courseId),
        getCourseRatingStats(courseId),
      ]);

      // Update course with dynamic data
      courseData.enrollmentCount = enrollmentCount;
      courseData.rating = ratingStats.averageRating;
      courseData.ratingCount = ratingStats.ratingCount;

      return courseData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
}

export async function getCoursesByTrainer(trainerId: string): Promise<Course[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('trainerId', '==', trainerId)
    );
    const querySnapshot = await getDocs(q);
    
    const courses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
    
    // Fetch dynamic data for all courses
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const [enrollmentCount, ratingStats] = await Promise.all([
          getEnrollmentCount(course.id),
          getCourseRatingStats(course.id),
        ]);

        return {
          ...course,
          enrollmentCount,
          rating: ratingStats.averageRating,
          ratingCount: ratingStats.ratingCount,
        };
      })
    );
    
    // Sort by createdAt in descending order (newest first)
    return coursesWithStats.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching trainer courses:', error);
    throw error;
  }
}

/**
 * Update course (for when course content is modified)
 */
export async function updateCourse(
  courseId: string,
  updates: Partial<CourseFormData>
): Promise<void> {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.language !== undefined) updateData.language = updates.language;
    if (updates.trainerCredentials !== undefined) updateData.trainerCredentials = updates.trainerCredentials;
    if (updates.outcomes !== undefined) updateData.outcomes = updates.outcomes;
    if (updates.university_ids !== undefined) updateData.university_ids = updates.university_ids;
    if (updates.branch_ids !== undefined) updateData.branch_ids = updates.branch_ids;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.topics !== undefined) {
      const totalDuration = updates.topics.reduce(
        (sum, topic) => sum + topic.videoDuration,
        0
      );
      updateData.totalDuration = totalDuration;
      updateData.totalTopics = updates.topics.length;
      updateData.topics = updates.topics.map((topic, index) => ({
        ...topic,
        id: topic.id || `topic-${Date.now()}-${index}`,
      }));
    }

    await updateDoc(courseRef, updateData);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

