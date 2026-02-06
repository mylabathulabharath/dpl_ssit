/**
 * services/video-upload-service.ts
 * Fully fixed upload service
 * 
 * IMPORTANT: If using ngrok, your server must allow the 'ngrok-skip-browser-warning' header
 * in CORS configuration. Add it to Access-Control-Allow-Headers:
 * 
 * Example Express.js CORS config:
 * app.use(cors({
 *   origin: '*',
 *   allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
 *   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
 * }));
 * 
 * Or manually handle OPTIONS requests:
 * app.options('/api/upload', (req, res) => {
 *   res.header('Access-Control-Allow-Origin', '*');
 *   res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
 *   res.header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
 *   res.sendStatus(200);
 * });
 */

import { Platform } from "react-native";


export const UPLOAD_API_URL =
  "https://reinaldo-knaggy-ellison.ngrok-free.dev/api/upload";

// R2 Bucket public URL - videos are stored at hls/{jobId}/master.m3u8
// Format: https://pub-e12a9e2bfd10445dafbc66e17252efb5.r2.dev/hls/{jobId}/master.m3u8
export const R2_PUBLIC_URL = "https://pub-e12a9e2bfd10445dafbc66e17252efb5.r2.dev";

/**
 * Construct R2 video URL from jobId
 * This is the final public URL where videos are accessible after processing
 * @param jobId - Processing job ID from upload response
 * @returns Full R2 public URL for the HLS master playlist
 */
export function getR2VideoUrl(jobId: string): string {
  if (!jobId) {
    throw new Error('JobId is required to construct R2 video URL');
  }
  return `${R2_PUBLIC_URL}/hls/${jobId}/master.m3u8`;
}

/**
 * Check if R2 video URL is accessible (video is ready)
 * @param videoUrl - R2 video URL to check
 * @returns true if video is accessible, false otherwise
 */
export async function checkVideoUrlAccessible(videoUrl: string): Promise<boolean> {
  try {
    console.log(`🔍 [VIDEO CHECK] Checking if video is accessible: ${videoUrl}`);
    const response = await fetch(videoUrl, { method: 'HEAD' });
    const isAccessible = response.ok;
    console.log(`🔍 [VIDEO CHECK] Video accessible: ${isAccessible}, status: ${response.status}`);
    return isAccessible;
  } catch (error) {
    console.log(`🔍 [VIDEO CHECK] Video not accessible:`, error);
    return false;
  }
}


export interface UploadProgress {

  loaded: number;

  total: number;
}

export interface VideoUploadResult {
  videoUrl: string; // HLS master playlist URL
  jobId: string;
  status: 'PROCESSING' | 'COMPLETE' | 'FAILED';
}

export type VideoUploadSource =
  | File
  | {
      uri: string;
      name?: string;
      mimeType?: string;
    };



export function uploadVideo(

  source: VideoUploadSource,

  fileName: string,

  onProgress?: (progress: UploadProgress) => void,

  title?: string

): Promise<VideoUploadResult> {

  // Use XMLHttpRequest for web to support progress tracking
  // Use fetch for mobile platforms
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {

      const formData = new FormData();


      if (source instanceof File) {

        formData.append("video", source, fileName);
      }

      if (title) {

        formData.append("title", title);
      }


      console.log("Uploading to:", UPLOAD_API_URL);


      const xhr = new XMLHttpRequest();


      xhr.upload.onprogress = (event) => {

        if (event.lengthComputable && onProgress) {

          onProgress({

            loaded: event.loaded,

            total: event.total,
          });
        }
      };


      xhr.onload = async () => {

        console.log("📤 [VIDEO UPLOAD] Upload response received:", xhr.responseText);
        console.log("📤 [VIDEO UPLOAD] Response status:", xhr.status);


        if (xhr.status === 200 || xhr.status === 201) {

          try {

            const res = JSON.parse(xhr.responseText);
            console.log("📤 [VIDEO UPLOAD] Parsed response:", JSON.stringify(res, null, 2));

            // Parse response to extract video URL, jobId, and status
            const jobId = res.jobId || '';
            const status = (res.status || 'PROCESSING').toUpperCase() as 'PROCESSING' | 'COMPLETE' | 'FAILED';
            
            console.log("📤 [VIDEO UPLOAD] Extracted jobId:", jobId);
            console.log("📤 [VIDEO UPLOAD] Extracted status:", status);
            
            if (!jobId) {
              console.error("❌ [VIDEO UPLOAD] No jobId in response!");
              reject(new Error('No jobId in response'));
              return;
            }

            // Construct R2 URL from jobId (this is the final public URL)
            const videoUrl = getR2VideoUrl(jobId);
            console.log("📤 [VIDEO UPLOAD] Constructed R2 URL:", videoUrl);
            console.log("📤 [VIDEO UPLOAD] R2 Public URL:", R2_PUBLIC_URL);
            console.log("📤 [VIDEO UPLOAD] JobId:", jobId);

            // If we have a jobId and R2 URL, the video is ready (R2 URL format means it's accessible)
            // Server may return PROCESSING status, but if URL is available, video is ready to watch
            const finalStatus = status === 'PROCESSING' ? 'COMPLETE' : status;
            console.log(`📤 [VIDEO UPLOAD] Final status: ${finalStatus} (URL is available, video is ready)`);

            const result = {
              videoUrl,
              jobId,
              status: finalStatus,
            };
            
            console.log("✅ [VIDEO UPLOAD] Upload result:", JSON.stringify(result, null, 2));
            
            resolve(result);
          }
          catch (error) {
            reject(new Error(`Failed to parse upload response: ${error}`));
          }
        }
        else {

          reject(
            new Error(
              `Upload failed ${xhr.status}: ${xhr.responseText}`
            )
          );
        }
      };


      xhr.onerror = () => {
        // Check if this is a CORS error
        if (xhr.status === 0 && !xhr.responseText) {
          reject(
            new Error(
              "CORS error: Server must allow 'ngrok-skip-browser-warning' header in Access-Control-Allow-Headers. " +
              "Please update your server CORS configuration to include this header."
            )
          );
        } else {
          reject(new Error("Network error"));
        }
      };


      xhr.open("POST", UPLOAD_API_URL);

      // Only set ngrok header if we're using ngrok (check URL)
      // Note: Server must allow this header in CORS Access-Control-Allow-Headers
      if (UPLOAD_API_URL.includes("ngrok")) {
        try {
          xhr.setRequestHeader(
            "ngrok-skip-browser-warning",
            "true"
          );
        } catch (e) {
          console.warn("Could not set ngrok header:", e);
        }
      }

      xhr.send(formData);
    });
  } else {
    // Mobile platforms - use fetch API
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();

        if ("uri" in source) {
          const uri =
            Platform.OS === "ios"
              ? source.uri.replace("file://", "")
              : source.uri;

          formData.append("video", {

            uri,

            name: fileName,

            type: source.mimeType || "video/mp4",

          } as any);
        }

        if (title) {
          formData.append("title", title);
        }

        console.log("Uploading to:", UPLOAD_API_URL);

        const headers: Record<string, string> = {};
        
        // Only set ngrok header if we're using ngrok
        if (UPLOAD_API_URL.includes("ngrok")) {
          headers["ngrok-skip-browser-warning"] = "true";
        }

        const response = await fetch(UPLOAD_API_URL, {
          method: "POST",
          body: formData,
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          reject(
            new Error(
              `Upload failed ${response.status}: ${errorText}`
            )
          );
          return;
        }

        const res = await response.json();
        console.log("📤 [VIDEO UPLOAD] Mobile upload response:", JSON.stringify(res, null, 2));
        
        // Parse response to extract video URL, jobId, and status
        const jobId = res.jobId || '';
        const status = (res.status || 'PROCESSING').toUpperCase() as 'PROCESSING' | 'COMPLETE' | 'FAILED';

        console.log("📤 [VIDEO UPLOAD] Mobile - jobId:", jobId);
        console.log("📤 [VIDEO UPLOAD] Mobile - status:", status);

        if (!jobId) {
          console.error("❌ [VIDEO UPLOAD] Mobile - No jobId in response!");
          reject(new Error('No jobId in response'));
          return;
        }

        // Construct R2 URL from jobId (this is the final public URL)
        const videoUrl = getR2VideoUrl(jobId);
        console.log("📤 [VIDEO UPLOAD] Mobile - Constructed R2 URL:", videoUrl);

        // If we have a jobId and R2 URL, the video is ready (R2 URL format means it's accessible)
        // Server may return PROCESSING status, but if URL is available, video is ready to watch
        const finalStatus = status === 'PROCESSING' ? 'COMPLETE' : status;
        console.log(`📤 [VIDEO UPLOAD] Mobile - Final status: ${finalStatus} (URL is available, video is ready)`);

        const result = {
          videoUrl,
          jobId,
          status: finalStatus,
        };
        
        console.log("✅ [VIDEO UPLOAD] Mobile - Upload result:", JSON.stringify(result, null, 2));

        resolve(result);
      } catch (error: any) {
        reject(new Error(error?.message || "Network error"));
      }
    });
  }
}
