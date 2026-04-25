importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA8bMKnBj7G6lDYwINs8aQDY1T3d74LrXk",
  authDomain: "locolive-project.firebaseapp.com",
  projectId: "locolive-project",
  storageBucket: "locolive-project.firebasestorage.app",
  messagingSenderId: "416534093094",
  appId: "1:416534093094:web:f65106299bfc5ce97575e7",
  measurementId: "G-WLMZ0VHBE3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
