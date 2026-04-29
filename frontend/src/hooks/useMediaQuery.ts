import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (!media) return;

    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else if ((media as any).addListener) {
      (media as any).addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else if ((media as any).removeListener) {
        (media as any).removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
