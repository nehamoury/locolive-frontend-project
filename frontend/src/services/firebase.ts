import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import api from "./api";

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

// Immediately check support and initialize if possible
const initMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
  } catch (e) {
    console.warn('Firebase Messaging check failed:', e);
  }
};
initMessaging();

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Push notifications not supported in this environment');
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported || !messaging) {
      console.warn('FCM not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Ensure Service Worker is ready before getting token
      const registration = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: 'BPkb0U-B5s_mhFFyYGKQZsxbEl9xDwvEVgAKj4Ve0e-kmhgW-3b-lZX509rWV75jYwUeYaJBHMYbIyOwg4A8ido',
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token:', token);
        // Send token to backend
        await api.post('/notifications/token', { token });
        return token;
      }
    }
  } catch (error) {
    // Check if it's the common AbortError and log it more specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('FCM Registration aborted or failed (common on local dev/VPN):', error.message);
    } else {
      console.error('Notification permission denied or error:', error);
    }
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default messaging;
