export interface Topic {
  id: string;
  title: string;
  description?: string;
  videoDuration: number; // in minutes
  orderIndex: number;
  videoUrl?: string; // placeholder for now
}

export interface Course {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  totalDuration: number; // calculated in minutes
  totalTopics: number; // calculated
  trainerName: string;
  trainerId: string;
  createdAt: string;
  updatedAt?: string; // Last updated timestamp
  topics: Topic[];
  thumbnail?: string; // Course thumbnail image URL
  category?: string; // Course category (e.g., "Development", "Business", "Design")
  language?: string; // Course language (e.g., "English", "Arabic")
  rating?: number; // Average rating (0-5)
  ratingCount?: number; // Number of ratings
  enrollmentCount?: number; // Number of enrollments (calculated dynamically)
  trainerCredentials?: string; // Trainer credentials/bio
  university_ids?: string[]; // Array of university IDs
  branch_ids?: string[]; // Array of branch IDs
  year?: string; // Academic year: '1', '2', '3', or '4'
}

export interface CourseFormData {
  title: string;
  description: string;
  outcomes: string[];
  topics: Array<Omit<Topic, 'id'> & { id?: string }>; // Allow optional id for editing
  thumbnail?: string;
  category?: string;
  language?: string;
  trainerCredentials?: string;
  university_ids?: string[]; // Array of university IDs
  branch_ids?: string[]; // Array of branch IDs
  year?: string; // Academic year: '1', '2', '3', or '4'
}

