import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Global safety polyfills for mobile stability
if (typeof window !== 'undefined') {
  interface StubMatchMedia {
    matches: boolean;
    media: string;
    onchange: null;
    addListener: () => void;
    removeListener: () => void;
    addEventListener: () => void;
    removeEventListener: () => void;
    dispatchEvent: () => boolean;
  }

  const createStubMatchMedia = (query: string): StubMatchMedia => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });

  // 1. matchMedia hardening
  if (!window.matchMedia) {
    (window as unknown as Record<string, unknown>).matchMedia = createStubMatchMedia;
  } else {
    // Some mobile browsers have matchMedia but no addEventListener on it
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query: string) {
      const res = originalMatchMedia.call(window, query);
      if (res && !res.addEventListener) {
        (res as unknown as Record<string, () => void>).addEventListener = () => {};
        (res as unknown as Record<string, () => void>).removeEventListener = () => {};
      }
      return res;
    };
  }

  // 2. Suppress Google Accounts errors that can crash UI on non-secure origins
  if (!(window as unknown as Record<string, unknown>).google) {
    (window as unknown as Record<string, unknown>).google = { accounts: { id: { initialize: () => {}, renderButton: () => {}, prompt: () => {} } } };
  }
}

if (typeof navigator !== 'undefined' && !navigator.geolocation) {
  const stubGeolocation = {
    getCurrentPosition: (_: unknown, onError?: (error: GeolocationPositionError) => void) => {
      onError?.({ code: 1, message: 'Geolocation not supported', PERMISSION_DENIED: 1 } as GeolocationPositionError);
    },
    watchPosition: () => 0,
    clearWatch: () => {}
  };
  (navigator as unknown as Record<string, unknown>).geolocation = stubGeolocation;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
        <Toaster position="top-center" />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)