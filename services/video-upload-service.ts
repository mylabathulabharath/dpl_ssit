/**
 * services/video-upload-service.ts
 * Fully fixed upload service
 */

import { Platform } from "react-native";


export const UPLOAD_API_URL =
  "https://reinaldo-knaggy-ellison.ngrok-free.dev/api/upload";


export interface UploadProgress {

  loaded: number;

  total: number;
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

): Promise<string> {


  return new Promise((resolve, reject) => {

    const formData = new FormData();


    if (Platform.OS === "web" && source instanceof File) {

      formData.append("video", source, fileName);
    }

    else if ("uri" in source) {

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


    const xhr = new XMLHttpRequest();


    xhr.upload.onprogress = (event) => {

      if (event.lengthComputable && onProgress) {

        onProgress({

          loaded: event.loaded,

          total: event.total,
        });
      }
    };


    xhr.onload = () => {

      console.log("Upload response:", xhr.responseText);


      if (xhr.status === 200 || xhr.status === 201) {

        try {

          const res = JSON.parse(xhr.responseText);


          resolve(
            res.videoUrl ||
            res.url ||
            res.localStreamUrl ||
            xhr.responseText
          );
        }
        catch {

          resolve(xhr.responseText);
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

      reject(new Error("Network error"));
    };


    xhr.open("POST", UPLOAD_API_URL);


    xhr.setRequestHeader(
      "ngrok-skip-browser-warning",
      "true"
    );


    xhr.send(formData);
  });
}
