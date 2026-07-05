export interface MediaMetadata {
  width: number;
  height: number;
  aspect_ratio: number;
  mime_type: string;
  file_size: number;
  duration: number | null;
  thumbnail_url: string | null;
}

/**
 * Extracts comprehensive metadata from a local File object before upload.
 */
export async function getMediaMetadata(file: File): Promise<MediaMetadata> {
  const mimeType = file.type;
  const fileSize = file.size;
  const isVideo = mimeType.startsWith('video/');
  
  let width = 0;
  let height = 0;
  let duration: number | null = null;
  
  const objectUrl = URL.createObjectURL(file);

  try {
    if (isVideo) {
      await new Promise<void>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          width = video.videoWidth;
          height = video.videoHeight;
          duration = video.duration;
          resolve();
        };
        
        video.onerror = () => {
          console.warn("Failed to load video metadata");
          resolve();
        };
        
        video.src = objectUrl;
      });
    } else {
      await new Promise<void>((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          width = img.naturalWidth;
          height = img.naturalHeight;
          resolve();
        };
        
        img.onerror = () => {
          console.warn("Failed to load image metadata");
          resolve();
        };
        
        img.src = objectUrl;
      });
    }
  } catch (error) {
    console.error("Error extracting media metadata:", error);
  } finally {
    // Always revoke to prevent memory leaks
    URL.revokeObjectURL(objectUrl);
  }

  // Fallback if extraction failed
  if (!width || !height) {
    width = 1080;
    height = 1080;
  }

  // Calculate Aspect Ratio safely
  const aspectRatio = height > 0 ? width / height : 1;

  return {
    width,
    height,
    aspect_ratio: aspectRatio,
    mime_type: mimeType,
    file_size: fileSize,
    duration: duration,
    thumbnail_url: null, // Web doesn't easily extract video thumbnails to files without heavy canvas work; backend/CDN will handle or we just send null
  };
}
