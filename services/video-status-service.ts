/**
 * services/video-status-service.ts
 * Video processing status polling and Firebase update service
 */

import { updateTopicVideoStatus } from './course-service';
import { getR2VideoUrl } from './video-upload-service';

export const STATUS_API_BASE_URL = 
  "https://reinaldo-knaggy-ellison.ngrok-free.dev/api/status";

export interface VideoStatusResponse {
  status: 'PROCESSING' | 'COMPLETE' | 'FAILED';
  jobId: string;
  localStreamUrl?: string;
  message?: string;
}

/**
 * Poll video processing status until complete or max attempts reached
 * @param jobId - Processing job ID from upload response
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Polling interval in milliseconds (default: 5000 = 5 seconds)
 * @returns Final status and video URL if complete
 */
export async function pollVideoStatus(
  jobId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<VideoStatusResponse> {
  let attempts = 0;
  console.log(`🔄 [VIDEO STATUS] Starting status polling for jobId: ${jobId}, maxAttempts: ${maxAttempts}`);

  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 [VIDEO STATUS] Polling attempt ${attempts + 1}/${maxAttempts} for jobId: ${jobId}`);
      const status = await checkVideoStatus(jobId);
      console.log(`🔄 [VIDEO STATUS] Status response:`, JSON.stringify(status, null, 2));
      
      if (status.status === 'COMPLETE' || status.status === 'FAILED') {
        console.log(`✅ [VIDEO STATUS] Final status reached: ${status.status} for jobId: ${jobId}`);
        return status;
      }

      console.log(`⏳ [VIDEO STATUS] Still processing (${status.status}), waiting ${intervalMs}ms before next attempt...`);
      // Still processing, wait and retry
      await sleep(intervalMs);
      attempts++;
    } catch (error) {
      console.error(`❌ [VIDEO STATUS] Error polling video status (attempt ${attempts + 1}):`, error);
      attempts++;
      
      // If it's a network error, continue polling
      // If it's a critical error, throw
      if (attempts >= maxAttempts) {
        console.error(`❌ [VIDEO STATUS] Max attempts reached for jobId: ${jobId}`);
        throw new Error(`Failed to get video status after ${maxAttempts} attempts`);
      }
      
      await sleep(intervalMs);
    }
  }

  // Max attempts reached, return as failed
  console.error(`❌ [VIDEO STATUS] Timeout - max attempts reached for jobId: ${jobId}`);
  return {
    status: 'FAILED',
    jobId,
    message: 'Processing timeout - maximum polling attempts reached',
  };
}

/**
 * Check video processing status once
 * @param jobId - Processing job ID
 * @returns Current status
 */
export async function checkVideoStatus(jobId: string): Promise<VideoStatusResponse> {
  const url = `${STATUS_API_BASE_URL}/${jobId}`;
  console.log(`🔍 [VIDEO STATUS] Checking status at: ${url}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add ngrok header if using ngrok
  if (STATUS_API_BASE_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  console.log(`🔍 [VIDEO STATUS] Request headers:`, headers);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  console.log(`🔍 [VIDEO STATUS] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [VIDEO STATUS] Status check failed: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`🔍 [VIDEO STATUS] Raw status response:`, JSON.stringify(data, null, 2));
  
  const currentJobId = data.jobId || jobId;
  const status = (data.status || 'PROCESSING').toUpperCase() as 'PROCESSING' | 'COMPLETE' | 'FAILED';
  
  // Always use R2 URL format (constructed from jobId)
  // The server may return localStreamUrl (ngrok URL) but we want the R2 public URL
  const r2VideoUrl = getR2VideoUrl(currentJobId);
  console.log(`🔍 [VIDEO STATUS] Constructed R2 URL: ${r2VideoUrl}`);
  console.log(`🔍 [VIDEO STATUS] Server's localStreamUrl: ${data.localStreamUrl || 'none'}`);
  
  const result = {
    status,
    jobId: currentJobId,
    localStreamUrl: r2VideoUrl, // Use R2 URL instead of server's localStreamUrl
    message: data.message,
  };
  
  console.log(`✅ [VIDEO STATUS] Final status response:`, JSON.stringify(result, null, 2));
  
  return result;
}

/**
 * Update video status in Firebase and poll until complete
 * @param courseId - Course ID
 * @param topicId - Topic ID
 * @param jobId - Processing job ID
 * @param initialVideoUrl - Initial video URL (may be temporary)
 * @returns Final video URL when processing completes
 */
export async function updateVideoStatusAndPoll(
  courseId: string,
  topicId: string,
  jobId: string,
  initialVideoUrl: string
): Promise<string> {
  console.log(`🚀 [VIDEO STATUS POLL] Starting status polling and update`);
  console.log(`🚀 [VIDEO STATUS POLL] CourseId: ${courseId}`);
  console.log(`🚀 [VIDEO STATUS POLL] TopicId: ${topicId}`);
  console.log(`🚀 [VIDEO STATUS POLL] JobId: ${jobId}`);
  console.log(`🚀 [VIDEO STATUS POLL] InitialVideoUrl: ${initialVideoUrl}`);
  
  // Ensure we're using R2 URL format
  const r2VideoUrl = getR2VideoUrl(jobId);
  console.log(`🚀 [VIDEO STATUS POLL] Constructed R2 URL: ${r2VideoUrl}`);
  
  // Update status to PROCESSING initially with R2 URL
  console.log(`📝 [VIDEO STATUS POLL] Updating Firebase with PROCESSING status...`);
  await updateTopicVideoStatus(
    courseId,
    topicId,
    'PROCESSING',
    r2VideoUrl,
    jobId
  );
  console.log(`✅ [VIDEO STATUS POLL] Firebase updated with PROCESSING status`);

  try {
    // Poll until complete
    console.log(`🔄 [VIDEO STATUS POLL] Starting to poll status...`);
    const result = await pollVideoStatus(jobId);
    console.log(`🔄 [VIDEO STATUS POLL] Polling completed, result:`, JSON.stringify(result, null, 2));
    
    if (result.status === 'COMPLETE' && result.localStreamUrl) {
      console.log(`✅ [VIDEO STATUS POLL] Video processing COMPLETE!`);
      console.log(`📝 [VIDEO STATUS POLL] Updating Firebase with COMPLETE status and URL: ${result.localStreamUrl}`);
      
      // Update Firebase with final R2 URL and COMPLETE status
      await updateTopicVideoStatus(
        courseId,
        topicId,
        'COMPLETE',
        result.localStreamUrl, // This is already the R2 URL from pollVideoStatus
        jobId
      );
      console.log(`✅ [VIDEO STATUS POLL] Firebase updated with COMPLETE status`);
      return result.localStreamUrl;
    } else {
      console.error(`❌ [VIDEO STATUS POLL] Video processing FAILED!`);
      console.log(`📝 [VIDEO STATUS POLL] Updating Firebase with FAILED status...`);
      
      // Update Firebase with FAILED status, but keep R2 URL
      await updateTopicVideoStatus(
        courseId,
        topicId,
        'FAILED',
        r2VideoUrl, // Keep R2 URL even if failed
        jobId
      );
      console.log(`✅ [VIDEO STATUS POLL] Firebase updated with FAILED status`);
      throw new Error(result.message || 'Video processing failed');
    }
  } catch (error) {
    console.error(`❌ [VIDEO STATUS POLL] Error during polling:`, error);
    console.log(`📝 [VIDEO STATUS POLL] Updating Firebase with FAILED status due to error...`);
    
    // Update Firebase with FAILED status on error, but keep R2 URL
    await updateTopicVideoStatus(
      courseId,
      topicId,
      'FAILED',
      r2VideoUrl,
      jobId
    );
    console.log(`✅ [VIDEO STATUS POLL] Firebase updated with FAILED status`);
    throw error;
  }
}

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

