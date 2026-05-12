import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import api from "./api";

// The VAPID key is public and used to identify the web app to FCM
const VAPID_KEY = "BPkb0U-B5s_mhFFyYGKQZsxbEl9xDwvEVgAKj4Ve0e-kmhgW-3b-lZX509rWV75jYwUeYaJBHMYbIyOwg4A8ido";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Make auth available globally for reCAPTCHA
(window as any).auth = auth;

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;

export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    });
  }
};

export const sendPhoneOTP = async (phoneNumber: string): Promise<boolean> => {
  try {
    setupRecaptcha('recaptcha-container');
    const appVerifier = (window as any).recaptchaVerifier;
    
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return true;
  } catch (error: any) {
    console.error('Firebase send OTP error:', error);
    // Reset reCAPTCHA on error
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
    throw error;
  }
};

export const verifyPhoneOTP = async (otp: string): Promise<string> => {
  try {
    if (!confirmationResult) throw new Error('No confirmation result. Please resend OTP.');
    
    const result = await confirmationResult.confirm(otp);
    const idToken = await result.user.getIdToken();
    return idToken;
  } catch (error: any) {
    console.error('Firebase verify OTP error:', error);
    throw error;
  }
};

export const resetFirebaseAuth = () => {
  confirmationResult = null;
  if ((window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier.clear();
    (window as any).recaptchaVerifier = null;
  }
};

// Safe messaging initialization
let messaging: any = null;

export const initMessaging = async () => {
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (e) {
    console.warn('Firebase Messaging check failed:', e);
  }
  return null;
};

// Pre-initialize
initMessaging();

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this environment');
    return null;
  }

  try {
    const m = await initMessaging();
    if (!m) {
      console.warn('FCM not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Ensure Service Worker is ready before getting token
      const registration = await navigator.serviceWorker.ready;
      
      const token = await getToken(m, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('[FCM] Token Refresh Success');
        // Send token to backend
        try {
          await api.post('/notifications/token', { token, device_type: 'web' });
        } catch (apiErr) {
          console.error('[FCM] Failed to sync token with backend:', apiErr);
        }
        return token;
      }
    } else {
      console.warn('[FCM] Permission not granted:', permission);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('FCM Registration aborted (common on local dev/VPN):', error.message);
    } else {
      console.error('Notification permission error:', error);
    }
  }
  return null;
};

export const onMessageListener = (callback: (payload: any) => void) => {
  initMessaging().then(m => {
    if (m) {
      onMessage(m, (payload) => {
        console.log('[FCM] Foreground message received:', payload);
        callback(payload);
      });
    }
  });
};

export default messaging;

