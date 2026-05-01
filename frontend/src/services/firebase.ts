import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import api from "./api";

// The VAPID key is public and used to identify the web app to FCM
const VAPID_KEY = "BPkb0U-B5s_mhFFyYGKQZsxbEl9xDwvEVgAKj4Ve0e-kmhgW-3b-lZX509rWV75jYwUeYaJBHMYbIyOwg4A8ido";

const firebaseConfig = {
  apiKey: "AIzaSyA8bMKnBj7G6lDYwINs8aQDY1T3d74LrXk",
  authDomain: "locolive-project.firebaseapp.com",
  projectId: "locolive-project",
  storageBucket: "locolive-project.firebasestorage.app",
  messagingSenderId: "416534093094",
  appId: "1:416534093094:web:f65106299bfc5ce97575e7",
  measurementId: "G-WLMZ0VHBE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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

