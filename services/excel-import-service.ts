/**
 * services/excel-import-service.ts
 * Excel parsing and bulk course import service
 */

import { Platform } from 'react-native';
import { createCourse } from './course-service';
import { CourseFormData, Topic } from '@/types/course';

export interface ExcelRow {
  course_title: string;
  course_description: string;
  course_category?: string;
  course_language?: string;
  course_thumbnail?: string;
  topic_title: string;
  topic_description?: string;
  topic_video_duration: string;
  topic_video_url: string;
  topic_order: string;
}

export interface ParsedCourse {
  title: string;
  description: string;
  category: string;
  language: string;
  thumbnail?: string;
  topics: Array<{
    title: string;
    description?: string;
    videoDuration: number;
    videoUrl: string;
    orderIndex: number;
  }>;
}

export interface ImportResult {
  success: boolean;
  coursesCreated: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validate video URL format (must be HLS .m3u8 URL)
 */
function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  // Check if it's a valid URL and ends with .m3u8
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.endsWith('.m3u8') || url.includes('.m3u8');
  } catch {
    return false;
  }
}

/**
 * Parse Excel file and extract course data
 * Note: This requires xlsx library to be installed
 */
export async function parseExcelFile(file: File | any): Promise<ParsedCourse[]> {
  // Dynamic import for xlsx (web only)
  if (Platform.OS !== 'web') {
    throw new Error('Excel import is only supported on web platform');
  }

  // Dynamic import for xlsx - only executed on web
  // @ts-ignore - xlsx is web-only, Metro will try to resolve but it's OK
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Group rows by course_title
        const courseMap = new Map<string, ParsedCourse>();
        
        for (const row of rows) {
          const courseTitle = row.course_title?.trim();
          if (!courseTitle) continue;
          
          if (!courseMap.has(courseTitle)) {
            courseMap.set(courseTitle, {
              title: courseTitle,
              description: row.course_description?.trim() || '',
              category: row.course_category?.trim() || 'Development',
              language: row.course_language?.trim() || 'English',
              thumbnail: row.course_thumbnail?.trim(),
              topics: [],
            });
          }
          
          const course = courseMap.get(courseTitle)!;
          const videoDuration = parseFloat(row.topic_video_duration);
          const orderIndex = parseInt(row.topic_order) || course.topics.length;
          
          if (row.topic_title?.trim() && !isNaN(videoDuration) && row.topic_video_url?.trim()) {
            course.topics.push({
              title: row.topic_title.trim(),
              description: row.topic_description?.trim(),
              videoDuration,
              videoUrl: row.topic_video_url.trim(),
              orderIndex,
            });
          }
        }
        
        resolve(Array.from(courseMap.values()));
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate parsed courses
 */
export function validateCourses(courses: ParsedCourse[]): { valid: ParsedCourse[]; errors: string[] } {
  const valid: ParsedCourse[] = [];
  const errors: string[] = [];
  
  courses.forEach((course, courseIndex) => {
    const courseErrors: string[] = [];
    
    // Validate course fields
    if (!course.title.trim()) {
      courseErrors.push(`Course ${courseIndex + 1}: Missing title`);
    }
    if (!course.description.trim()) {
      courseErrors.push(`Course ${courseIndex + 1}: Missing description`);
    }
    if (course.topics.length === 0) {
      courseErrors.push(`Course "${course.title}": No topics found`);
    }
    
    // Validate topics
    course.topics.forEach((topic, topicIndex) => {
      if (!topic.title.trim()) {
        courseErrors.push(`Course "${course.title}", Topic ${topicIndex + 1}: Missing title`);
      }
      if (isNaN(topic.videoDuration) || topic.videoDuration <= 0) {
        courseErrors.push(`Course "${course.title}", Topic "${topic.title}": Invalid video duration`);
      }
      if (!topic.videoUrl.trim()) {
        courseErrors.push(`Course "${course.title}", Topic "${topic.title}": Missing video URL`);
      } else if (!isValidVideoUrl(topic.videoUrl)) {
        courseErrors.push(`Course "${course.title}", Topic "${topic.title}": Invalid video URL format (must be HLS .m3u8 URL)`);
      }
    });
    
    if (courseErrors.length === 0) {
      valid.push(course);
    } else {
      errors.push(...courseErrors);
    }
  });
  
  return { valid, errors };
}

/**
 * Import courses from parsed Excel data
 */
export async function importCourses(
  courses: ParsedCourse[],
  trainerId: string,
  trainerName: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    coursesCreated: 0,
    errors: [],
    warnings: [],
  };
  
  const total = courses.length;
  let current = 0;
  
  // Process in batches to avoid overwhelming Firebase
  const batchSize = 10;
  
  for (let i = 0; i < courses.length; i += batchSize) {
    const batch = courses.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (course) => {
        try {
          const courseData: CourseFormData = {
            title: course.title,
            description: course.description,
            category: course.category,
            language: course.language,
            thumbnail: course.thumbnail,
            outcomes: [], // Can be added to Excel template if needed
            topics: course.topics.map((topic) => ({
              title: topic.title,
              description: topic.description,
              videoDuration: topic.videoDuration,
              orderIndex: topic.orderIndex,
              videoUrl: topic.videoUrl,
              // Videos from Excel are assumed to be already processed (COMPLETE)
              videoProcessingStatus: 'COMPLETE',
            })),
          };
          
          await createCourse(courseData, trainerId, trainerName);
          result.coursesCreated++;
          current++;
          
          if (onProgress) {
            onProgress(current, total);
          }
        } catch (error: any) {
          result.success = false;
          result.errors.push(`Failed to create course "${course.title}": ${error?.message || 'Unknown error'}`);
          current++;
          
          if (onProgress) {
            onProgress(current, total);
          }
        }
      })
    );
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < courses.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return result;
}

/**
 * Generate Excel template file (for download)
 */
export async function generateExcelTemplate(): Promise<Blob> {
  if (Platform.OS !== 'web') {
    throw new Error('Excel template generation is only supported on web platform');
  }

  // Dynamic import for xlsx - only executed on web
  // @ts-ignore - xlsx is web-only, Metro will try to resolve but it's OK
  const XLSX = await import('xlsx');
  
  // Sample data for template
  const templateData = [
    {
      course_title: 'Introduction to React',
      course_description: 'Learn the basics of React framework',
      course_category: 'Development',
      course_language: 'English',
      course_thumbnail: 'https://example.com/thumbnail.jpg',
      topic_title: 'Getting Started',
      topic_description: 'Introduction to React concepts',
      topic_video_duration: '10',
      topic_video_url: 'https://example.com/videos/1/master.m3u8',
      topic_order: '0',
    },
    {
      course_title: 'Introduction to React',
      course_description: 'Learn the basics of React framework',
      course_category: 'Development',
      course_language: 'English',
      course_thumbnail: 'https://example.com/thumbnail.jpg',
      topic_title: 'Components',
      topic_description: 'Understanding React components',
      topic_video_duration: '15',
      topic_video_url: 'https://example.com/videos/2/master.m3u8',
      topic_order: '1',
    },
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

