export type UploadContext = "story" | "feed" | "reel" | "profile" | "business" | "ads" | "chat" | "document";

export type UploadState =
  | "preparing"
  | "validating"
  | "compressing"
  | "extracting_thumbnail"
  | "generating_blurhash"
  | "hashing"
  | "uploading"
  | "processing"
  | "completed"
  | "error"
  | "cancelled";

export type MediaType = "image" | "video";

export interface UploadConfig {
  context: UploadContext;
  maxDuration?: number;
  maxSizeBytes?: number;
  priority?: "high" | "medium" | "low";
  allowBackground?: boolean;
}

export interface ProcessedMedia {
  uri: string;
  thumbnailUri?: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  aspectRatio: number;
  duration?: number;
  blurHash?: string;
  fingerprint?: string; // SHA256 or MD5 hash
}

export interface UploadResult {
  url: string;
  metadata: ProcessedMedia;
}

export interface UploadError {
  code:
    | "VALIDATION_FAILED"
    | "COMPRESSION_FAILED"
    | "NETWORK_ERROR"
    | "SERVER_ERROR"
    | "CANCELLED"
    | "TIMEOUT";
  message: string;
  details?: any;
}

export interface UploadProgressEvent {
  state: UploadState;
  percent?: number; // Used mainly for the 'uploading' state
}
