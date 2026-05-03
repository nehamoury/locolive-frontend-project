import { useSyncExternalStore } from 'react';

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    const media = window.matchMedia(query) as LegacyMediaQueryList;
    const listener = () => onStoreChange();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }

    if (typeof media.addListener === 'function') {
      media.addListener(listener);
      return () => media.removeListener?.(listener);
    }

    return () => {};
  };

  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
