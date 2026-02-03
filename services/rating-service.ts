import { 
  collection, 
  doc, 
  addDoc, 
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RATINGS_COLLECTION = 'ratings';
const COURSE_RATINGS_COLLECTION = 'courseRatings';

export interface Rating {
  id?: string;
  courseId: string;
  studentId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseRatingStats {
  averageRating: number;
  ratingCount: number;
}

/**
 * Add or update a rating for a course
 */
export async function addOrUpdateRating(
  courseId: string,
  studentId: string,
  rating: number,
  review?: string
): Promise<string> {
  try {
    // Check if rating already exists
    const existingRating = await getRating(courseId, studentId);
    
    const ratingData: Omit<Rating, 'id'> = {
      courseId,
      studentId,
      rating: Math.max(1, Math.min(5, rating)), // Clamp between 1-5
      review,
      updatedAt: new Date().toISOString(),
      createdAt: existingRating?.createdAt || new Date().toISOString(),
    };

    if (existingRating?.id) {
      // Update existing rating
      const ratingRef = doc(db, RATINGS_COLLECTION, existingRating.id);
      await updateDoc(ratingRef, ratingData);
      await updateCourseRatingStats(courseId);
      return existingRating.id;
    } else {
      // Create new rating
      const docRef = await addDoc(collection(db, RATINGS_COLLECTION), ratingData);
      await updateCourseRatingStats(courseId);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    throw error;
  }
}

/**
 * Get rating for a course by a specific student
 */
export async function getRating(
  courseId: string,
  studentId: string
): Promise<Rating | null> {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('courseId', '==', courseId),
      where('studentId', '==', studentId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Rating;
  } catch (error) {
    console.error('Error fetching rating:', error);
    throw error;
  }
}

/**
 * Get all ratings for a course
 */
export async function getCourseRatings(courseId: string): Promise<Rating[]> {
  try {
    const q = query(
      collection(db, RATINGS_COLLECTION),
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rating[];
  } catch (error) {
    console.error('Error fetching course ratings:', error);
    throw error;
  }
}

/**
 * Get rating statistics for a course
 */
export async function getCourseRatingStats(courseId: string): Promise<CourseRatingStats> {
  try {
    // Try to get cached stats first
    const statsRef = doc(db, COURSE_RATINGS_COLLECTION, courseId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        averageRating: data.averageRating || 0,
        ratingCount: data.ratingCount || 0,
      };
    }

    // Calculate from ratings if cache doesn't exist
    const ratings = await getCourseRatings(courseId);
    
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        ratingCount: 0,
      };
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    const stats = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: ratings.length,
    };

    // Cache the stats
    await setDoc(statsRef, stats);
    
    return stats;
  } catch (error) {
    console.error('Error fetching course rating stats:', error);
    return {
      averageRating: 0,
      ratingCount: 0,
    };
  }
}

/**
 * Update course rating statistics (called after rating changes)
 */
async function updateCourseRatingStats(courseId: string): Promise<void> {
  try {
    const ratings = await getCourseRatings(courseId);
    
    if (ratings.length === 0) {
      const statsRef = doc(db, COURSE_RATINGS_COLLECTION, courseId);
      await setDoc(statsRef, {
        averageRating: 0,
        ratingCount: 0,
      });
      return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;
    
    const statsRef = doc(db, COURSE_RATINGS_COLLECTION, courseId);
    await setDoc(statsRef, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: ratings.length,
    });
  } catch (error) {
    console.error('Error updating course rating stats:', error);
  }
}

