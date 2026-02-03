/**
 * Progress Types - Core Learning Engine
 * 
 * These types define the database-driven progress tracking system.
 * Progress is calculated server-side and stored in the database.
 */

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * UserCourseProgress - ONE per user per course
 * This is the source of truth for course-level progress
 */
export interface UserCourseProgress {
  id?: string;
  user_id: string;
  course_id: string;
  completed_lectures_count: number;
  total_lectures: number;
  completion_percentage: number; // 0-100, stored (not calculated)
  last_accessed_lecture_id: string | null;
  last_played_timestamp: number; // in seconds
  status: ProgressStatus;
  started_at: string | null; // ISO timestamp
  last_accessed_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
}

/**
 * UserLectureProgress - ONE per user per lecture
 * Tracks individual lecture viewing progress
 */
export interface UserLectureProgress {
  id?: string;
  user_id: string;
  course_id: string;
  lecture_id: string; // maps to topic.id
  watched_duration_seconds: number;
  is_completed: boolean;
  last_watched_at: string; // ISO timestamp
}

/**
 * Lecture Progress Response
 * Returned when fetching progress for a specific lecture
 */
export interface LectureProgressResponse {
  watched_duration_seconds: number;
  is_completed: boolean;
  lecture_id: string;
}

/**
 * Course Progress Summary
 * Used in My Learnings and course cards
 */
export interface CourseProgressSummary {
  course_id: string;
  course_title: string;
  completion_percentage: number;
  status: ProgressStatus;
  last_accessed_lecture_id: string | null;
  last_played_timestamp: number;
  total_lectures: number;
  completed_lectures_count: number;
  thumbnail?: string;
  instructor?: string;
}

/**
 * Progress Update Payload
 * Sent when updating lecture progress
 */
export interface ProgressUpdatePayload {
  course_id: string;
  lecture_id: string;
  watched_duration_seconds: number;
  is_completed: boolean;
}

