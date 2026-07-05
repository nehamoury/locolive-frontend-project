import React, { useEffect, useRef, useState } from 'react';
import { getMediaUrl } from '../../utils/media';
import { useSound } from '../../context/SoundContext';
import { Blurhash } from 'react-blurhash';

interface MediaItem {
  url: string;
  type: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  thumbnail_url?: string;
  blur_hash?: string;
}

interface MediaRendererProps {
  post: any;
  mode?: 'feed' | 'reel' | 'story';
  isActive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

function VideoRenderer({ item, mode, isActive, autoplay, muted, loop }: any) {
  const videoUrl = getMediaUrl(item.url);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  let objectFit: 'contain' | 'cover' | 'fill' = 'contain';
  let aspectRatio: number | undefined = undefined;

  if (mode === "reel" || mode === "story") {
    objectFit = "cover";
    aspectRatio = 9 / 16;
  } else {
    objectFit = "contain";
    aspectRatio = item.aspect_ratio || (item.width && item.height ? item.width / item.height : 4 / 5);
  }

  // Intersection Observer for autoplay if isActive is not explicitly provided
  useEffect(() => {
    if (isActive !== undefined) return; // Ignore if controlled externally

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              if (autoplay) videoRef.current.play().catch(() => {});
            } else {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [autoplay, isActive]);

  // Handle external active state
  useEffect(() => {
    if (isActive === undefined || !videoRef.current) return;
    if (isActive && autoplay) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, autoplay]);

  // Sync mute state securely
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <div style={{ width: '100%', position: 'relative', aspectRatio, backgroundColor: 'black' }}>
      <video
        ref={videoRef}
        src={videoUrl}
        loop={loop}
        playsInline
        style={{ width: '100%', height: '100%', objectFit, position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}

function ImageRenderer({ item, mode }: any) {
  const imageUrl = getMediaUrl(item.url);
  const [isLoaded, setIsLoaded] = useState(false);

  let objectFit: 'contain' | 'cover' | 'fill' = 'contain';
  let aspectRatio: number | undefined = undefined;

  if (mode === "reel" || mode === "story") {
    objectFit = "cover";
    aspectRatio = 9 / 16;
  } else {
    objectFit = "contain";
    aspectRatio = item.aspect_ratio || (item.width && item.height ? item.width / item.height : 1);
  }

  return (
    <div style={{ width: '100%', position: 'relative', aspectRatio, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
      {/* Blurhash Placeholder */}
      {!isLoaded && item.blur_hash && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <Blurhash
            hash={item.blur_hash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      
      {/* Actual Image */}
      <img
        src={imageUrl}
        alt="Post media"
        onLoad={() => setIsLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({ 
  post, 
  mode = 'feed', 
  isActive, 
  autoplay = true, 
  muted, // Will be overridden by SoundContext if not provided
  loop = true 
}) => {
  const { isMuted } = useSound();
  const actualMuted = muted !== undefined ? muted : isMuted;

  if (!post) return null;

  let mediaItems: MediaItem[] = [];

  if (post.media && Array.isArray(post.media) && post.media.length > 0) {
    mediaItems = post.media;
  } else {
    // Legacy fallback
    const isValid = (u: string) => u && u !== 'null' && u !== 'undefined' && u.trim() !== '';
    let url = "";
    let type = "image";
    
    if (isValid(post.image_url)) {
      url = post.image_url; type = "image";
    } else if (isValid(post.video_url)) {
      url = post.video_url; type = "video";
    } else if (isValid(post.media_url)) {
      url = post.media_url; type = post.media_type || "image";
    }

    if (url) {
      mediaItems = [{
        url,
        type,
        aspect_ratio: post.aspect_ratio || 1,
        blur_hash: post.blur_hash,
      }];
    }
  }

  if (mediaItems.length === 0) return null;

  const item = mediaItems[0];

  if (item.type === 'video') {
    return <VideoRenderer item={item} mode={mode} isActive={isActive} autoplay={autoplay} muted={actualMuted} loop={loop} />;
  }

  return <ImageRenderer item={item} mode={mode} />;
};
