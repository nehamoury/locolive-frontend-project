import type { MediaType, UploadConfig, ProcessedMedia } from "./Types";

class MediaProcessor {
  /**
   * Generates a simple fingerprint hash using crypto.subtle for Deduplication
   */
  async generateFingerprint(file: File): Promise<string> {
    try {
      // In a real scenario, we hash the file contents.
      // For web performance, we'll hash the name, size, and lastModified.
      const data = `${file.name}_${file.size}_${file.lastModified}`;
      const msgUint8 = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch {
      return "";
    }
  }

  /**
   * Extracts the first frame of a video using a hidden video element and canvas
   */
  async generateThumbnail(file: File): Promise<File | undefined> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 1.0; // Extract at 1 second

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
            } else {
              resolve(undefined);
            }
          }, "image/jpeg", 0.8);
        } else {
          resolve(undefined);
        }
      };
      video.onerror = () => resolve(undefined);
      video.load();
    });
  }

  /**
   * Generates BlurHash for an image using canvas
   * (Placeholder until a JS blurhash library like blurhash or react-blurhash is injected)
   */
  async generateBlurHash(_file: File): Promise<string | undefined> {
    return "U7H2^+WBE2~q_39FRP%g~q-pt7t7E1xuM{kC"; // Generic blurhash
  }

  /**
   * Compresses image using Canvas
   */
  async compressImage(
    file: File,
    config: UploadConfig
  ): Promise<{ file: File; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      let quality = 0.8;
      let targetWidth = 1080;

      if (config.priority === "low") {
        quality = 0.6;
        targetWidth = 800;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > targetWidth) {
          height = Math.round((height * targetWidth) / width);
          width = targetWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve({ file: compressedFile, width, height });
            } else {
              resolve({ file, width: img.width, height: img.height });
            }
          }, "image/jpeg", quality);
        } else {
          resolve({ file, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image compression failed"));
      };
    });
  }

  /**
   * Main processing pipeline
   */
  async process(
    file: File,
    mediaType: MediaType,
    config: UploadConfig
  ): Promise<ProcessedMedia & { originalFile: File }> {
    let finalFile = file;
    let width = 0;
    let height = 0;
    let thumbnailUri: string | undefined;
    let blurHash: string | undefined;

    const fingerprint = await this.generateFingerprint(file);

    if (mediaType === "image") {
      const compressed = await this.compressImage(file, config);
      finalFile = compressed.file;
      width = compressed.width;
      height = compressed.height;
      blurHash = await this.generateBlurHash(finalFile);
    } else if (mediaType === "video") {
      const thumbFile = await this.generateThumbnail(file);
      if (thumbFile) {
        blurHash = await this.generateBlurHash(thumbFile);
        thumbnailUri = URL.createObjectURL(thumbFile); // Just for local preview if needed
      }
      width = 1080;
      height = 1920; // Default portrait
    }

    return {
      uri: URL.createObjectURL(finalFile), // Used locally for preview
      originalFile: finalFile, // Web specific! FormData needs a File object
      thumbnailUri,
      mimeType: mediaType === "image" ? "image/jpeg" : file.type,
      fileSize: finalFile.size,
      width,
      height,
      aspectRatio: width && height ? width / height : 0.5625,
      blurHash,
      fingerprint,
    };
  }
}

export const mediaProcessor = new MediaProcessor();
