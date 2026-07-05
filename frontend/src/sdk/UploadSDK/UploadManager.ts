import api from "../../services/api";
import type {
  UploadConfig,
  MediaType,
  UploadResult,
  UploadProgressEvent,
} from "./Types";
import { mediaProcessor } from "./MediaProcessor";

class UploadManager {
  private async performXHR(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      // For web, since we have an `api` axios instance configured in `../../services/api.ts`
      // we can just use it, but for XHR progress events axios is also fine.
      api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      })
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
    });
  }

  private async performUploadWithRetry(
    file: File,
    retries: number = 3,
    onProgress?: (percent: number) => void
  ): Promise<any> {
    const backoffDelays = [1000, 3000, 10000];

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.performXHR(file, onProgress);
      } catch (err: any) {
        if (attempt === retries) {
          throw err;
        }
        console.warn(`Upload failed, retrying in ${backoffDelays[attempt]}ms...`);
        await new Promise((res) => setTimeout(res, backoffDelays[attempt]));
      }
    }
  }

  async startUpload(
    file: File,
    mediaType: MediaType,
    config: UploadConfig,
    onEvent?: (event: UploadProgressEvent) => void
  ): Promise<UploadResult & { originalFile: File }> {
    try {
      onEvent?.({ state: "preparing" });
      onEvent?.({ state: "validating" }); // MIME and size checks

      onEvent?.({ state: "compressing" });
      const metadata = await mediaProcessor.process(file, mediaType, config);

      onEvent?.({ state: "uploading", percent: 0 });

      const uploadRes = await this.performUploadWithRetry(
        metadata.originalFile,
        3, // 3 retries
        (percent) => {
          onEvent?.({ state: "uploading", percent });
        }
      );

      onEvent?.({ state: "processing" });
      onEvent?.({ state: "completed" });

      return {
        url: uploadRes.url,
        metadata,
        originalFile: metadata.originalFile,
      };
    } catch (err: any) {
      onEvent?.({ state: "error" });
      throw err;
    }
  }
}

export const uploadManager = new UploadManager();
