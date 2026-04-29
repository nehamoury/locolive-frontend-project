import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Global safety polyfills for mobile stability
if (typeof window !== 'undefined') {
  // 1. matchMedia hardening
  if (!window.matchMedia) {
    (window as any).matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  } else {
    // Some mobile browsers have matchMedia but no addEventListener on it
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query: string) {
      const res = originalMatchMedia.call(window, query);
      if (res && !res.addEventListener) {
        (res as any).addEventListener = () => {};
        (res as any).removeEventListener = () => {};
      }
      return res;
    };
  }

  // 2. Suppress Google Accounts errors that can crash UI on non-secure origins
  if (!(window as any).google) {
    (window as any).google = { accounts: { id: { initialize: () => {}, renderButton: () => {}, prompt: () => {} } } };
  }
}

if (typeof navigator !== 'undefined' && !navigator.geolocation) {
  (navigator as any).geolocation = {
    getCurrentPosition: (_: any, err: any) => err({ code: 1, message: 'Geolocation not supported' }),
    watchPosition: () => 0,
    clearWatch: () => {}
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="top-center" />
    </ErrorBoundary>
  </StrictMode>,
)