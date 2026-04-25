import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
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
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BPkb0U-B5s_mhFFyYGKQZsxbEl9xDwvEVgAKj4Ve0e-kmhgW-3b-lZX509rWV75jYwUeYaJBHMYbIyOwg4A8ido'
      });
      if (token) {
        console.log('FCM Token:', token);
        // Send token to backend
        await api.post('/notifications/token', { token });
        return token;
      }
    }
  } catch (error) {
    console.error('Notification permission denied or error:', error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default messaging;
