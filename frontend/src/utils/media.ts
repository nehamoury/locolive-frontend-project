const BACKEND_URL = 'http://localhost:8080';

/**
 * Safely constructs a full URL for media assets.
 * Handles absolute URLs, relative paths, and provides fallback for null/undefined.
 */
export const getMediaUrl = (path: string | null | undefined, fallback: string = ''): string => {
  if (!path || typeof path !== 'string') {
    return fallback;
  }

  // If it's already an absolute URL, return as is
  if (path.startsWith('http')) {
    return path;
  }

  // Ensure relative path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${BACKEND_URL}${normalizedPath}`;
};

/**
 * Preset fallbacks for common media types
 */
export const FALLBACKS = {
  AVATAR: (username?: string) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username || 'default'}`,
  POST: 'https://api.dicebear.com/7.x/shapes/svg?seed=post',
  HIGHLIGHT: 'https://api.dicebear.com/7.x/shapes/svg?seed=highlight',
  VAULT: 'https://api.dicebear.com/7.x/shapes/svg?seed=vault'
};
